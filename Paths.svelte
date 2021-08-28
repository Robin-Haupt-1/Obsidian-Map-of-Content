<script lang="ts">
  import type { App } from "obsidian";

  import { LINKED_BOTH, LINKED_TLI, LINKED_TO } from "./constants";
  import { LINKED_FROM } from "./constants";
  import { TLI_NAME } from "./constants";
  import { cleanExtension, fileNameFromPath, getDisplayName } from "./utils";
  import type { LibKeeper } from "./libkeeper";

  export let app: App;

  export let path: [string, string][];
  export let lib: LibKeeper;

  export const navigateToFile = async (
    app: App,
    path: string,
    ev: MouseEvent
  ) => {
    //let file = app.vault.getAbstractFileByPath(path)
    let file = app.metadataCache.getFirstLinkpathDest(path, "/");

    if (!file) return;
    const leaf = app.workspace.getUnpinnedLeaf();
    await leaf.openFile(file);
  };
</script>

<div class="path">
  {#each path.reverse() as pathitem, i}
    {#if i == 0}
      <span title={pathitem[0]}> {getDisplayName(pathitem[0], lib)}</span>
    {:else}
      <a
        href="#"
        title={pathitem[0]}
        on:click={(ev) => navigateToFile(app, pathitem[0], ev)}
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
</div><br>

<style> 
.path{
    font-size:20px;
}
</style>
