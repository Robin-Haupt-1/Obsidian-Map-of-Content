<script lang="ts">
  import type { App } from 'obsidian'
  import type { DBManager } from "../db";
  import { LINKED_BOTH, LINKED_TO, LINKED_FROM } from "../constants";
  import { GetDisplayName, IsCtrlPressed, NavigateToFile } from "../utils";

  import Descendants from "./Descendants.svelte";

  export let paths: [string, string][][];
  export let app: App;
  export let lib: DBManager;
  export let tli_path: string;

  export let open_note_path: string;
 
</script>

<div class="pathview">
  {#if paths.length == 0}
    ❌ This note has no connections to <a
      class="link"
      title={tli_path}
      on:click={(event) => NavigateToFile(app, tli_path, event)}
    >
      {GetDisplayName(tli_path, lib)}</a
    >
  {/if}
  {#each paths as path}
    <div class="path">
      {#each path.reverse() as pathitem, i}
        {#if i == 0}
          <span title={pathitem[0]}> {GetDisplayName(pathitem[0], lib)}</span>
        {:else}
          <a
            class="link"
            title={pathitem[0]}
            on:click={(event) => NavigateToFile(app, pathitem[0], event)}
          >
            {GetDisplayName(pathitem[0], lib)}</a
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
    padding-left: 0;
  } 
</style>
