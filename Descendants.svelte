<script lang="ts">
  //Todo: store expanded or not for every note between instances of this view
  import type { App } from "obsidian";
  import type { LibKeeper } from "./libkeeper";
  import { LINKED_BOTH, LINKED_TLI, LINKED_TO, LINKED_FROM } from "./constants";
  import { getDisplayName, isCtrlPressed, navigateToFile } from "./utils";
  import type TLIPlugin from "./main";

  export let note_path: string;
  export let lib: LibKeeper;
  export let indentation: number;
  export let app: App;
  export let expanded = true;

  function toggle() {
    expanded = !expanded;
  }

  $: {
    note_path = note_path;
    let children = [];
    if (lib.descendants.has(note_path)) {
      children = lib.descendants.get(note_path).slice();
    }
  }

  let children = [];
  if (lib.descendants.has(note_path)) {
    children = lib.descendants.get(note_path).slice();
  }
</script>
{#if indentation == 0 && children.length == 0}

  No descendants
  {:else}
<li class="container">
  <p>
    {#if indentation == 0}
      
      
        {getDisplayName(note_path, lib)}
      
    {:else}
      <a
        class="link"
        title={note_path}
        on:click={(event) => {
          navigateToFile(app, note_path, event);
        }}
      >
        {getDisplayName(note_path, lib)}</a
      >
      <!--<span class:expanded on:click={toggle}>expand</span>-->
    {/if}
  </p>
  <ul>
    {#if expanded && children.length > 0 && indentation < 3}
      {#each children as child}
        <svelte:self
          {lib}
          {app}
          note_path={child}
          indentation={indentation + 1}
        />
      {/each}
    {/if}
  </ul>
</li>
{/if}
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
