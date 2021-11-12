<script lang="ts">
  import { App, Notice, TFile } from "obsidian";
  import type { DBManager } from "../db";
  import type MOCPlugin from "../main";
  import { Log, GetAllFolders } from "../utils";
  import ExcludedFolders from "./settings/ExcludedFolders.svelte";
  import ExcludedFilenames from "./settings/ExcludedFilenames.svelte";

  export let app: App;
  export let plugin: MOCPlugin;
  let cn_input;
  // TODO choose whether to reverse paths to note
  // TODO check the db is complete before allow settings changes (maybe have this svelte only do that and load all other components from other svelte files)
  // TODO lazy load all the file names and folders?
  // Show paths and descendants in different views

  // get list of all files for dropdown menu
  let all_files = app.vault.getFiles().map((file: TFile) => file.path);
  Log("Central note path: " + plugin.getSettingValue("CN_path"), true);
  let cn_path_input_value;
  let current_tli = plugin.getSettingValue("CN_path");

  const updateCNPath = () => {
    if (!cn_path_input_value) {
      return;
    }
    // change TLI path
    plugin.updateSettings({ CN_path: cn_path_input_value });
    Log("New central note path: " + cn_path_input_value, true);
    document.getElementById("tli_path").textContent = cn_path_input_value;
    new Notice("New Central Note path saved");

    // clear selection dropdown list
    cn_input.value = "";
    cn_path_input_value = "";
  };
  let auto_update_file_switch_checkbox;
  const toggleUpdateOnFileSwitch = () => {
    plugin.updateSettings({
      auto_update_on_file_change: !plugin.getSettingValue(
        "auto_update_on_file_change"
      ),
    });
    if (plugin.getSettingValue("auto_update_on_file_change")) {
      auto_update_file_switch_checkbox.checked = true;
    } else {
      auto_update_file_switch_checkbox.checked = false;
    }
  };
</script>

<div id="settings-container">
  <div class="path">
    <h2>Path of your Central Note</h2>
    Current path:<span id="tli_path">{current_tli}</span><br />
    <label for="myBrowser"> New path:</label>
    <input
      type="text"
      bind:this={cn_input}
      bind:value={cn_path_input_value}
      list="notes"
      id="CN_select"
      placeholder="Start typing to see suggestions..."
    />

    <datalist id="notes">
      {#each all_files as filepath}
        <option value={filepath} />{/each}
    </datalist>

    <button
      id="update_TLI_path_button"
      type="button"
      on:click={() => {
        updateCNPath();
      }}>Save</button
    >
  </div>
  <br/>
  <div>
    <!--TODO use js or some sort of switch statement instead of defining the checkbox twice-->
    <h2>Auto-updating the Map of Content</h2>
    Update when switching between files  <input
        bind:this={auto_update_file_switch_checkbox}
        type="checkbox"
        id="auto-update-file-switch"
        on:click={toggleUpdateOnFileSwitch}
        checked={plugin.getSettingValue("auto_update_on_file_change")}
      /> 
  </div>
  <br />
  <ExcludedFolders {app} {plugin} />
  <ExcludedFilenames {app} {plugin} />
</div>

<style>
  #settings-container {
    position: relative;
    height: 100%;
    width: 100%;
  }
  #CN_select {
    min-width: 200px;
    width: 50%;
    font-size: 1em;
  }
  #update_TLI_path_button {
    margin-left: auto;
    margin-right: auto;
  }
  h2 {
    text-align: left;
  }
</style>
