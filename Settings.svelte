<script lang="ts">
  import type { App, TFile } from "obsidian";

  import { LINKED_BOTH, LINKED_TLI, LINKED_TO } from "./constants";
  import { LINKED_FROM } from "./constants";
  import { getDisplayName, isCtrlPressed } from "./utils";
  import type { LibKeeper } from "./libkeeper";
  import type TLIPlugin from "./main";
  export let app: App;

  import { log } from "./utils";
  import { domain } from "process";
  export let lib: LibKeeper;
  export let plugin: TLIPlugin;

  // get list of all files for dropdown menu
  let all_files = app.vault.getFiles().map((file: TFile) => file.path);
  log("Central note path: " + plugin.getTliPath(), true);
  let input_value = "";
  let current_tli = plugin.getTliPath();
  const updateTliPath = () => {
    // change TLI path
    plugin.setTliPath(input_value);
    log("New central note path: " + input_value, true); 
    document.getElementById("tli_path").textContent = input_value;
    
    // recreate path information
    lib.updateEverything()

    // clear selection dropdown list
    document.getElementById("TLI_select").value = "";
  };
</script>

<div class="path">
  <label for="myBrowser">Choose the central note from this list:</label>
  <input bind:value={input_value} list="notes" id="TLI_select" />
  <datalist id="notes">
    {#each all_files as filepath}
      <option value={filepath} />{/each}
  </datalist>

  <button
    id="update_TLI_path_button"
    type="button"
    on:click={() => {
      updateTliPath();
    }}>Save settings & rebuild path information</button
  >
</div>

<br />
Current central note: <span id="tli_path">{current_tli}</span>

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
