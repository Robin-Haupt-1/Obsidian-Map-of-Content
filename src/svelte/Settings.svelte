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
  let settings = plugin.settings;

  // TODO check the db is complete before allow settings changes (maybe have this svelte only do that and load all other components from other svelte files)
  // TODO lazy load all the file names and folders?

  // get list of all files for dropdown menu
  let all_files = app.vault.getFiles().map((file: TFile) => file.path);
  Log("Central note path: " + settings.get("CN_path"));
  let cn_path_input_value;
  let current_tli = settings.get("CN_path");

  const updateCNPath = () => {
    if (!cn_path_input_value) {
      return;
    }
    // change TLI path
    settings.set({ CN_path: cn_path_input_value });
    Log("New central note path: " + cn_path_input_value);
    document.getElementById("tli_path").textContent = cn_path_input_value;
    new Notice("New Central Note path saved");

    // clear selection dropdown list
    cn_input.value = "";
    cn_path_input_value = "";
  };
  let auto_update_file_switch_checkbox;
  let do_remember_expanded_checkbox;
  const toggleUpdateOnFileSwitch = () => {
    settings.set({
      auto_update_on_file_change: !settings.get("auto_update_on_file_change"),
    });
    if (settings.get("auto_update_on_file_change")) {
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
  <br />
  <div>
    <h2>Auto-updating the Map of Content</h2>
    Update when switching between files<input
      bind:this={auto_update_file_switch_checkbox}
      type="checkbox"
      id="auto-update-file-switch"
      on:click={() => {
        let enabled = !settings.get("auto_update_on_file_change");
        settings.set({
          auto_update_on_file_change: enabled,
        });
        auto_update_file_switch_checkbox.checked = enabled;
      }}
      checked={settings.get("auto_update_on_file_change")}
    />
  </div>
  <br />
  <div>
    <h2>Descendants</h2>
    Remember whether a file's descandants are shown or hidden<input
      bind:this={do_remember_expanded_checkbox}
      type="checkbox"
      on:click={() => {
        let enabled = !settings.get("do_remember_expanded");
        settings.set({
          do_remember_expanded: enabled,
        });
        do_remember_expanded_checkbox.checked = enabled;
      }}
      checked={settings.get("do_remember_expanded")}
    />
  </div>
  <br />
  <ExcludedFolders {app} {plugin} />
  <ExcludedFilenames {app} {plugin} />
<p>
For support & suggestion feature ideas, visit the plugin's <a
href="https://github.com/Robin-Haupt-1/Obsidian-Map-of-Content"
>
GitHub page</a
>
or
<a href="https://forum.obsidian.md/t/map-of-content-plugin-release/25209/4">
this post</a
> in the official Obsidian forum.
<br><br>
You can support the development by donating on <a href="https://www.patreon.com/RobinHaupt">Patreon</a>, <a href="https://ko-fi.com/robinhaupt">Ko-Fi</a> or <a href="https://www.paypal.com/paypalme/robinhaupt">PayPal</a>. Thank you!</p>
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
