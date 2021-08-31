<script lang="ts">
  import type { App } from "obsidian";

  import { LINKED_BOTH, LINKED_TLI, LINKED_TO } from "./constants";
  import { LINKED_FROM } from "./constants";
  import { getDisplayName, isCtrlPressed } from "./utils";
  import type { LibKeeper } from "./libkeeper";

  export let app: App;

  export let path: [string, string][];
  export let lib: LibKeeper;

  export const navigateToFile = async (
    app: App,
    path: string,
    event: MouseEvent
  ) => {
    // Todo: maybe use 	this.app.workspace.openLinkText("Top Level Index.md", "Top Level Index.md")

    let file = app.metadataCache.getFirstLinkpathDest(path, "/");

    if (!file) return;
    const leaf = isCtrlPressed(event)
      ? app.workspace.splitActiveLeaf()
      : app.workspace.getUnpinnedLeaf();
    await leaf.openFile(file);
  };
</script>

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

<style>
  a.link {
    cursor: pointer;
  }
  .path { 
  }
</style>
