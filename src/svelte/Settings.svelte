  <script lang="ts">
  import type { App, TFile } from "obsidian";
  import type { DBManager } from "../db";
  import type TLIPlugin from "../main";
  import { Log } from "../utils";

  export let app: App;
  export let lib: DBManager;
  export let plugin: TLIPlugin;


  // Todo: choose whether to reverse paths to note
  // Show paths and descendants in different views
  // 

  // get list of all files for dropdown menu
  let all_files = app.vault.getFiles().map((file: TFile) => file.path);
  Log("Central note path: " + plugin.getTliPath(), true);
  let input_value = "";
  let current_tli = plugin.getTliPath();

  const updateTliPath = () => {
    // change TLI path
    plugin.setTliPath(input_value);
    Log("New central note path: " + input_value, true); 
    document.getElementById("tli_path").textContent = input_value;
    
    // recreate path information
    lib.update()
    plugin.view.rerender()

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


  #TLI_select {
    width: 200px;
  }
  #update_TLI_path_button {
    margin-left: auto;
    margin-right: auto;
  }
</style>
