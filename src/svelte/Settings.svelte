<script lang="ts">
  import { App, Notice, TFile } from "obsidian";
  import type MOCPlugin from "../main";
  import { devLog } from "../utils";
  import ExcludedFolders from "./settings/ExcludedFolders.svelte";
  import ExcludedFilenames from "./settings/ExcludedFilenames.svelte";

  export let app: App;
  export let plugin: MOCPlugin;

  let cnInput;
  let settings = plugin.settings;

  // TODO check the db is complete before allow settings changes (maybe have this svelte only do that and load all other components from other svelte files)
  // TODO lazy load all the file names and folders?

  // get list of all files for dropdown menu
  let allFiles = app.vault.getFiles().map((file: TFile) => file.path);
  devLog("Central note path: " + settings.get("CN_path"));
  let cnPathInputValue;
  let currentCnPath = settings.get("CN_path");

  const updateCNPath = () => {
    if (!cnPathInputValue) {
      return;
    }
    // change TLI path
    settings.set({ CN_path: cnPathInputValue });
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
    Current path:&nbsp;<span id="cn-path-input">{currentCnPath}</span><br />
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
        let enabled = !settings.get("auto_update_on_file_change");
        settings.set({
          auto_update_on_file_change: enabled,
        });
      }}
      checked={settings.get("auto_update_on_file_change")}
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
        let enabled = !settings.get("MOC_path_starts_at_CN");
        settings.set({
          MOC_path_starts_at_CN: enabled,
        });
      }}
      checked={settings.get("MOC_path_starts_at_CN")}
    />
    <br />
    <label for="do_remember_expanded_checkbox"
      >Remember whether a file's descendants are shown or hidden
    </label><input
      type="checkbox"
      id="do_remember_expanded_checkbox"
      on:click={() => {
        let enabled = !settings.get("do_remember_expanded");
        settings.set({
          do_remember_expanded: enabled,
        });
      }}
      checked={settings.get("do_remember_expanded")}
    />
  </div>
  <br />
  <ExcludedFolders {app} {plugin} />
  <ExcludedFilenames {app} {plugin} />
  <p>
    For support and suggesting feature ideas, visit the plugin's <a
      href="https://github.com/Robin-Haupt-1/Obsidian-Map-of-Content"
    >
      GitHub page</a
    >
    or
    <a href="https://forum.obsidian.md/t/map-of-content-plugin-release/25209">
      this post</a
    >
    in the official Obsidian forum.
    <br /><br />
    You can support the development by donating on
    <a href="https://www.patreon.com/RobinHaupt">Patreon</a>,
    <a href="https://ko-fi.com/robinhaupt">Ko-Fi</a>
    or <a href="https://www.paypal.com/paypalme/robinhaupt">PayPal</a>. Thank
    you!
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
