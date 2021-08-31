<script lang="ts">
  import type { App, TFile } from "obsidian";

  import { LINKED_BOTH, LINKED_TLI, LINKED_TO } from "./constants";
  import { LINKED_FROM } from "./constants";
  import { getDisplayName, isCtrlPressed } from "./utils";
  import type { LibKeeper } from "./libkeeper";
  import type TLIPlugin from "./main";
  export let app: App;

  export let lib: LibKeeper;
  export let plugin: TLIPlugin;

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

  // get list of all files for dropdown menu
  let all_files = app.vault.getFiles().map((file: TFile) => file.path);

  let chosen_tli_path = plugin.getSettingValue("TLI_path");
  console.log(chosen_tli_path);
  let input_value = "";

  const updateTliPath = () => {
    console.log(input_value);
    plugin.setTliPath(input_value)
    lib.updatePaths()
    plugin.rerender()
  };
</script>

<div class="path">
  <label for="myBrowser">Choose a browser from this list:</label>
  <input
    bind:value={input_value}
    list="browsers"
    id="TLI_select"
    name="myBrowser"
  />
  <datalist id="browsers">
    {#each all_files as filepath}
      <option value={filepath} />{/each}
  </datalist>

  <button
    id="update_TLI_path_button"
    type="button"
    on:click={() => {
      updateTliPath();
    }}>Save Settings & rebuild path information</button
  >
</div>
<br />

<style>
  a.link {
    cursor: pointer;
  }
  .path {
  }
  #TLI_select {
    width: 200px;
  }
  #update_TLI_path_button {
    center: right;
    margin-left: auto;
    margin-right: auto;
  }
</style>
