<script lang="ts">
  import { App, Notice, TFile } from "obsidian";
  import type MOCPlugin from "../main";
  import { devLog } from "../utils";
  import ExcludedFolders from "./settings/ExcludedFolders.svelte";
  import ExcludedFilenames from "./settings/ExcludedFilenames.svelte";

  export let app: App;
  export let plugin: MOCPlugin;

  let cnInput;

  // TODO check the db is complete before allow settings changes (maybe have this svelte only do that and load all other components from other svelte files)
  // TODO lazy load all the file names and folders?

  // get list of all files for dropdown menu
  let allFiles = app.vault.getFiles().map((file: TFile) => file.path);
  devLog("Central note path: " + plugin.settings.get("CN_path"));
  let cnPathInputValue;

  const updateCNPath = () => {
    if (!cnPathInputValue) {
      return;
    }
    // change TLI path
    plugin.settings.set({ CN_path: cnPathInputValue });
    devLog("New central note path: " + cnPathInputValue);
    document.getElementById("cn-path-input").textContent = cnPathInputValue;
    new Notice("New Central Note path saved");

    // clear selection dropdown list
    cnInput.value = "";
    cnPathInputValue = "";
  };
</script>

<div id="settings-container">
  <div class="path">
    <h2>Path of your Central Note</h2>
    Current path:&nbsp;<span id="cn-path-input"
      >{plugin.settings.get("CN_path")}</span
    ><br />
    <label for="CN-select"> New path:</label>
    <input
      type="text"
      bind:this={cnInput}
      bind:value={cnPathInputValue}
      list="notes"
      id="CN-select"
      placeholder="Start typing to see suggestions..."
    />

    <datalist id="notes">
      {#each allFiles as filepath}
        <option value={filepath} />
      {/each}
    </datalist>

    <button
      id="update-CN-path-button"
      type="button"
      on:click={() => {
        updateCNPath();
      }}
      >Save
    </button>
  </div>
  <br />
  <div>
    <h2>Auto-updating the Map of Content</h2>
    <label for="auto-update-file-switch"
      >Update when switching between files
    </label><input
      type="checkbox"
      id="auto-update-file-switch"
      on:click={() => {
        plugin.settings.set({
          auto_update_on_file_change: !plugin.settings.get(
            "auto_update_on_file_change"
          ),
        });
      }}
      checked={plugin.settings.get("auto_update_on_file_change")}
    />
  </div>
  <br />
  <div>
    <h2>Path and descendants</h2>

    <label for="MOC_path_starts_at_CN_checkbox"
      >Display the path from the Central Note starting at the Central Note
    </label><input
      type="checkbox"
      id="MOC_path_starts_at_CN_checkbox"
      on:click={() => {
        plugin.settings.set({
          MOC_path_starts_at_CN: !plugin.settings.get("MOC_path_starts_at_CN"),
        });
      }}
      checked={plugin.settings.get("MOC_path_starts_at_CN")}
    />
    <br />
    <label for="do_remember_expanded_checkbox"
      >Remember whether a file's descendants are shown or hidden
    </label><input
      type="checkbox"
      id="do_remember_expanded_checkbox"
      on:click={() => {
        plugin.settings.set({
          do_remember_expanded: !plugin.settings.get("do_remember_expanded"),
        });
      }}
      checked={plugin.settings.get("do_remember_expanded")}
    />
  </div>
  <br />
  <ExcludedFolders {app} {plugin} />
  <ExcludedFilenames {app} {plugin} />
  <p>
    For support, bug reports or suggesting feature ideas, visit the plugin's <a
      href="https://github.com/Robin-Haupt-1/Obsidian-Map-of-Content"
    >
      GitHub page</a
    >.<br /><br />
  </p>
</div>

<style>
  #settings-container {
    position: relative;
    height: 100%;
    width: 100%;
  }

  #CN-select {
    min-width: 200px;
    width: 50%;
    font-size: 1em;
  }

  #update-CN-path-button {
    margin-left: auto;
    margin-right: auto;
  }

  h2 {
    text-align: left;
  }
</style>
