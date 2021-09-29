<script lang="ts">
  import type { App } from "obsidian";
  import type { DBManager } from "../db";
  import  { GetDisplayName, NavigateToFile } from "../utils";

  export let note_path: string;
  export let db: DBManager;
  export let indentation: number;
  export let app: App;

  let children = [];
  if (db.descendants.has(note_path)) {
    children = db.descendants.get(note_path).slice();
  }
</script>

{#if indentation == 0 && children.length == 0}
  This note has no descendants
{:else}
  <li class="container">
    <p>
      {#if indentation == 0}
        {GetDisplayName(note_path, db)}
      {:else}
        <a
          class="link" 
          title={note_path}
          on:click={(event) => {
            NavigateToFile(app, note_path, event);
          }}
        >
          {GetDisplayName(note_path, db)}</a
        >
      {/if}
    </p>
    <ul>
      {#if children.length > 0}
        {#if indentation < 3}
          {#each children as child}
            <svelte:self
              db={db}
              {app}
              note_path={child}
              indentation={indentation + 1}
            />
          {/each}
        {:else}
          <li>
            <a
            href="/"
              class="link"
              title={note_path}
              on:click={(event) => {
                NavigateToFile(app, note_path, event);
              }}
            >
              ...</a
            >
          </li>
        {/if}
      {/if}
    </ul>
  </li>
{/if}

<style>
  
  a.link {
    cursor: pointer;
  } 

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  ul {
    padding-left: 1em;
  }
  li {
    padding-left: 1em;
    border: 5px dotted black;
    border-width: 0 0 1px 1px;
  }
  li.container {
    border-bottom: 0px;
  } 

  li p {
    margin: 0;
    position: relative;
    top: 0em;
  }
  li ul {
    border-top: 1px dotted black;
    margin-left: -1em;
    padding-left: 2em;
  }
  ul li:last-child ul {
    border-left: none;
    margin-left: -17px;
  }
</style>
