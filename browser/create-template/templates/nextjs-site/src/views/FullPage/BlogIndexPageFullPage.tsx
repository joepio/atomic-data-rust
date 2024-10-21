import Container from "@/components/Layout/Container";
import Loader from "@/components/Loader";
import type { Page } from "@/ontologies/website";
import { type Resource, core } from "@tomic/lib";
import styles from "./BlogIndexPageFullPage.module.css";
import VStack from "@/components/Layout/VStack";
import HStack from "@/components/Layout/HStack";
import Searchbar from "@/components/Searchbar";
import ListItemView from "../ListItem/ListItemView";
import { useEffect, useState } from "react";
import { useDebounced } from "@/utils";
import { CollectionBuilder, useStore } from "@tomic/react";
import { website } from "@/ontologies/website";

const BlogIndexPageFullPage = ({ resource }: { resource: Resource<Page> }) => {
  const [search, setSearch] = useState<string>("");
  const [results, setResults] = useState<string[]>([]);

  const debouncedSearchValue = useDebounced(search, 200);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  return (
    <Loader resource={resource}>
      <Container>
        <div className={styles.wrapper}>
          <VStack>
            <HStack wrap fullWidth align="center" justify="space-between">
              <h1>{resource.title}</h1>
              <Searchbar
                value={search}
                handler={handleSearch}
                placeholder="Search blogposts..."
              />
            </HStack>
            <ul>
              {results.map((post: string) => (
                <li key={post}>
                  <ListItemView subject={post} />
                </li>
              ))}
            </ul>
          </VStack>
        </div>
      </Container>
    </Loader>
  );
};

export default BlogIndexPageFullPage;
