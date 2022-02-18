//! Various benchmarks for atomic_lib.
//! Should be run using `cargo criterion` or `cargo bench --all-features`.
//! See contribute.md for more information.

use atomic_lib::*;
use criterion::{black_box, criterion_group, criterion_main, Criterion};
use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};

fn random_string(n: usize) -> String {
    let rand_string: String = thread_rng()
        .sample_iter(&Alphanumeric)
        .take(n)
        .map(char::from)
        .collect();
    rand_string
}

fn random_atom() -> Atom {
    Atom::new(
        format!("https://localhost/{}", random_string(10)),
        urls::DESCRIPTION.into(),
        Value::Markdown(random_string(200)),
    )
}

fn random_resource(atom: &Atom) -> Resource {
    let mut resource = Resource::new(atom.subject.clone());
    resource.set_propval_unsafe(atom.property.clone(), atom.value.clone());
    resource
}

fn criterion_benchmark(c: &mut Criterion) {
    let store = atomic_lib::Db::init_temp("bench").unwrap();

    c.bench_function("add_atom_to_index", |b| {
        b.iter(|| {
            let atom = random_atom();
            let resource = random_resource(&random_atom());
            store.add_atom_to_index(&atom, &resource).unwrap();
        })
    });

    c.bench_function("add_resource", |b| {
        b.iter(|| {
            let resource = random_resource(&random_atom());
            store
                .add_resource_opts(&resource, true, true, false)
                .unwrap();
        })
    });

    c.bench_function("resource.save()", |b| {
        b.iter(|| {
            let mut resource = random_resource(&random_atom());
            resource.save(&store).unwrap();
        })
    });

    let big_resource = store
        .get_resource_extended("https://localhost/collections", false, None)
        .unwrap();

    c.bench_function("resource.to_json_ad()", |b| {
        b.iter(|| {
            big_resource.to_json_ad().unwrap();
        })
    });

    c.bench_function("resource.to_json_ld()", |b| {
        b.iter(|| {
            big_resource.to_json_ld(&store).unwrap();
        })
    });

    c.bench_function("resource.to_json()", |b| {
        b.iter(|| {
            big_resource.to_json(&store).unwrap();
        })
    });

    c.bench_function("resource.to_n_triples()", |b| {
        b.iter(|| {
            big_resource.to_n_triples(&store).unwrap();
        })
    });
}

criterion_group!(benches, criterion_benchmark);
criterion_main!(benches);
