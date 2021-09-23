<script lang="ts">
  // Todo: check if note is not in lib (new note), show notice
  import type { App } from "obsidian";
  import type { LibKeeper } from "../libkeeper";
  import { LINKED_BOTH, LINKED_TO, LINKED_FROM } from "../constants"; 
  import { getDisplayName, isCtrlPressed, navigateToFile } from "../utils";
 
  import Descendants from "./Descendants.svelte";

  export let paths: [string, string][][];
  export let app: App;
  export let lib: LibKeeper; 
  export let tli_path: string;

  export let open_note_path: string;

  $: {
    app = app;
    paths = paths;
    open_note_path = open_note_path;
  }
</script>

<div class="pathview">
  {#if paths.length == 0}
    ❌ This note has no connections to <a
      class="link"
      title={tli_path}
      on:click={(event) => navigateToFile(app, tli_path, event)}
    >
      {getDisplayName(tli_path, lib)}</a
    >
  {/if}
  {#each paths as path}
    <div class="path">
      {#each path.reverse() as pathitem, i}
        {#if i == 0}
          <span title={pathitem[0]}> {getDisplayName(pathitem[0], lib)}</span>
        {:else}
          <a
            class="link"
            title={pathitem[0]}
            on:click={(event) => navigateToFile(app, pathitem[0], event)}
          >
            {getDisplayName(pathitem[0], lib)}</a
          >
        {/if}
        {#if pathitem[1] == LINKED_FROM}
          {LINKED_TO}
        {:else if pathitem[1] == LINKED_TO}
          {LINKED_FROM}
        {:else if pathitem[1] == LINKED_BOTH}
          {LINKED_BOTH}
        {/if}
      {/each}
    </div>
    <br />
  {/each}
</div>
<br />
<ul>
  <Descendants {lib} {app} note_path={open_note_path} indentation={0} />
</ul>

<style>
  .pathview {
    padding: initial;
    width: initial;
    height: initial;
    position: initial;
    overflow-y: initial;
    overflow-wrap: initial;
  }
  a.link {
    cursor: pointer;
  }
  ul {
    padding: 0px;
  }

  
  ul,
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
  li.empty {
    font-style: italic;
    color: silver;
    border-color: silver;
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
