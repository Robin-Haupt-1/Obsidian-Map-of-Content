<script lang="ts">
  import type { App, TFile } from "obsidian";
  import type { DBManager } from "../db";
  import type MOCPlugin from "../main";
  import { Log } from "../utils";

  export let app: App;
  export let db: DBManager;
  export let plugin: MOCPlugin;

  // Todo: choose whether to reverse paths to note
  // Show paths and descendants in different views

  // get list of all files for dropdown menu
  let all_files = app.vault.getFiles().map((file: TFile) => file.path);
  Log("Central note path: " + plugin.getCNPath(), true);
  let input_value = "";
  let current_tli = plugin.getCNPath();

  const updateCNPath = () => {
    // change TLI path
    plugin.setCNPath(input_value);
    Log("New central note path: " + input_value, true);
    document.getElementById("tli_path").textContent = input_value;

    // recreate path information
    db.update();
    plugin.rerender();

    // clear selection dropdown list
    document.getElementById("CN_select").value = "";
  };
</script>

<div class="path">
  <label for="myBrowser">Path of your Central Note: (start typing to see suggestions)</label>
  <input bind:value={input_value} list="notes" id="CN_select" />
  <datalist id="notes">
    {#each all_files as filepath}
      <option value={filepath} />{/each}
  </datalist>

  <button
    id="update_TLI_path_button"
    type="button"
    on:click={() => {
      updateCNPath();
    }}>Save settings & rebuild Map of Content</button
  >
</div>

<br />
Current central note: <span id="tli_path">{current_tli}</span>

<style>
  #CN_select {
    width: 200px;
  }
  #update_TLI_path_button {
    margin-left: auto;
    margin-right: auto;
  }
</style>
