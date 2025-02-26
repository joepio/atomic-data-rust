//! The Commit Monitor checks for new commits and notifies listeners.
//! It is used for WebSockets to notify front-end clients of changes in Resources,
//! and to update the Search index.

use crate::{
    actor_messages::{CommitMessage, Subscribe},
    errors::AtomicServerResult,
    handlers::web_sockets::WebSocketConnection,
    search::SearchState,
};
use actix::{
    prelude::{Actor, Context, Handler},
    ActorStreamExt, Addr, ContextFutureSpawner,
};
use atomic_lib::{agents::ForAgent, Db, Storelike};
use chrono::Local;
use std::collections::{HashMap, HashSet};

/// The Commit Monitor is an Actor that manages subscriptions for subjects and sends Commits to listeners.
/// It's also responsible for checking whether the rights are present
pub struct CommitMonitor {
    /// Maintains a list of all the resources that are being subscribed to, and maps these to websocket connections.
    subscriptions: HashMap<String, HashSet<Addr<WebSocketConnection>>>,
    store: Db,
    search_state: SearchState,
    last_search_commit: chrono::DateTime<Local>,
    run_expensive_next_tick: bool,
}

// Only runs expensive index operation (tantivy) once every x seconds
const REBUILD_INDEX_TIME: std::time::Duration = std::time::Duration::from_secs(5);

// Since his Actor only starts once, there is no need to handle its lifecycle
impl Actor for CommitMonitor {
    type Context = Context<Self>;

    fn started(&mut self, ctx: &mut Context<Self>) {
        tracing::debug!("CommitMonitor started");

        // spawn an interval stream into our context
        actix::utils::IntervalFunc::new(REBUILD_INDEX_TIME, Self::tick)
            .finish()
            .spawn(ctx);
    }
}

impl Handler<Subscribe> for CommitMonitor {
    type Result = ();

    // A message comes in when a client subscribes to a subject.
    #[tracing::instrument(
        name = "handle_subscribe",
        skip_all,
        fields(to = %msg.subject, agent = %msg.agent)
    )]
    fn handle(&mut self, msg: Subscribe, _ctx: &mut Context<Self>) {
        // check if the agent has the rights to subscribe to this resource
        if !msg.subject.starts_with(&self.store.get_self_url().unwrap()) {
            tracing::warn!("can't subscribe to external resource");
            return;
        }
        match self.store.get_resource(&msg.subject) {
            Ok(resource) => {
                match atomic_lib::hierarchy::check_read(
                    &self.store,
                    &resource,
                    &ForAgent::AgentSubject(msg.agent.clone()),
                ) {
                    Ok(_explanation) => {
                        let mut set = if let Some(set) = self.subscriptions.get(&msg.subject) {
                            set.clone()
                        } else {
                            HashSet::new()
                        };
                        set.insert(msg.addr);
                        tracing::debug!("handle subscribe {} ", msg.subject);
                        self.subscriptions.insert(msg.subject.clone(), set);
                    }
                    Err(unauthorized_err) => {
                        tracing::debug!(
                            "Not allowed {} to subscribe to {}: {}",
                            &msg.agent,
                            &msg.subject,
                            unauthorized_err
                        );
                    }
                }
            }
            Err(e) => {
                tracing::debug!(
                    "Subscribe failed for {} by {}: {}",
                    &msg.subject,
                    msg.agent,
                    e
                );
            }
        }
    }
}

impl CommitMonitor {
    /// When a commit comes in, send it to any listening subscribers,
    /// and update the value index.
    /// The search index is only updated if the last search commit is 15 seconds or older.
    fn handle_internal(&mut self, msg: CommitMessage) -> AtomicServerResult<()> {
        let target = msg.commit_response.commit.subject.clone();

        // Notify websocket listeners
        if let Some(subscribers) = self.subscriptions.get(&target) {
            tracing::debug!(
                "Sending commit {} to {} subscribers",
                target,
                subscribers.len()
            );
            for connection in subscribers {
                connection.do_send(msg.clone());
            }
        } else {
            tracing::debug!("No subscribers for {}", target);
        }

        self.search_state.remove_resource(&target)?;

        // Update the search index
        if let Some(resource) = &msg.commit_response.resource_new {
            // We could one day re-(allow) to keep old resources,
            // but then we also should index the older versions when re-indexing.
            // Add new resource to search index
            self.search_state.add_resource(resource, &self.store)?;
        }

        self.run_expensive_next_tick = true;
        Ok(())
    }

    /// Runs every X seconds to perform expensive operations.
    fn tick(&mut self, _ctx: &mut Context<Self>) {
        if self.run_expensive_next_tick {
            _ = self.update_expensive().map_err(|e| {
                tracing::error!(
                    "Error during expensive update in Commit Monitor: {}",
                    e.to_string()
                )
            });
        }
    }

    /// Run expensive updates that should not be run after every single Commit
    fn update_expensive(&mut self) -> AtomicServerResult<()> {
        tracing::debug!("Update expensive");
        self.search_state.writer.write()?.commit()?;
        self.last_search_commit = chrono::Local::now();
        self.run_expensive_next_tick = false;
        Ok(())
    }
}

impl Handler<CommitMessage> for CommitMonitor {
    type Result = ();

    #[tracing::instrument(name = "handle_commit_message", skip_all, fields(subscriptions = &self.subscriptions.len(), s = %msg.commit_response.commit_resource.get_subject()))]
    fn handle(&mut self, msg: CommitMessage, _: &mut Context<Self>) {
        // We have moved the logic to the `handle_internal` function for decent error handling
        match self.handle_internal(msg) {
            Ok(_) => {}
            Err(e) => {
                tracing::error!(
                    "Handling commit in CommitMonitor failed, cache may not be fully updated: {}",
                    e
                );
            }
        }
    }
}

/// Spawns a commit monitor actor
pub fn create_commit_monitor(store: Db, search_state: SearchState) -> Addr<CommitMonitor> {
    tracing::info!("spawning commit monitor");
    crate::commit_monitor::CommitMonitor::create(|_ctx: &mut Context<CommitMonitor>| {
        CommitMonitor {
            subscriptions: HashMap::new(),
            store,
            search_state,
            run_expensive_next_tick: false,
            last_search_commit: chrono::Local::now(),
        }
    })
}
