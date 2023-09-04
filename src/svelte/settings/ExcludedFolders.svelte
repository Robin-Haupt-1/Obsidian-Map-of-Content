<script lang="ts">
  import type { App, TFile } from "obsidian";
  import type { DBManager } from "../../db";
  import type MOCPlugin from "../../main";
  import { onMount } from "svelte";

  import { Log, GetAllFolders } from "../../utils";

  export let app: App;
  export let plugin: MOCPlugin;
  let excludedlist;
  let excluded_folders = plugin.settings.get("exluded_folders");
  // TODO show all exluded files in TextEdit not list
  // Select box based on https://www.c-sharpcorner.com/UploadFile/mahakgupta/add-and-remove-listbox-items-in-javascript/
  let all_folders = GetAllFolders(app);

  var list_options_no = 0;
  let excluded_files = allExcludedFiles();
  onMount(() => {
    // create select entries for all already excluded folders
    excluded_folders.forEach((folder) => {
      excludedlist.options[list_options_no] = new Option(folder, folder);
      list_options_no++;
    });
  });

  function allExcludedFiles() {
    let all_files = app.vault.getFiles().map((file) => file.path);

    return all_files.filter((path_to_file) => {
      return excluded_folders.some((path: string) =>
        path_to_file.startsWith(path)
      );
    });
  }

  let exlude_path_input_value;
  let exlude_path_input;
  let show_all_hidden = false;

  /** update the list of exluded files and save the updated settings*/
  function save() {
    excluded_files = allExcludedFiles();
    plugin.settings.set({ exluded_folders: excluded_folders });
  }

  function addValue() {
    if (!exlude_path_input_value) {
      return;
    }
    // Return if folder doesn't exist
    if (!all_folders.contains(exlude_path_input_value)) {
      alert("Please choose a folder from the list");
      return;
    }
    // Return if folder already on list
    if (excluded_folders.contains(exlude_path_input_value)) {
      exlude_path_input.value = "";
      exlude_path_input_value = "";
      return;
    }
    // add option to select box
    let AddOpt = new Option(exlude_path_input_value, exlude_path_input_value);
    excludedlist.options[list_options_no++] = AddOpt;
    excluded_folders.push(exlude_path_input_value);

    // reset input field
    exlude_path_input.value = "";
    exlude_path_input_value = "";

    save();
    return true;
  }

  function deleteValue() {
    let s = 1;
    let Index;
    if (excludedlist.selectedIndex === -1) {
      alert("Please select an item from the list");
      return true;
    }

    while (s > 0) {
      Index = excludedlist.selectedIndex;

      if (Index >= 0) {
        excluded_folders.remove(excludedlist.options[Index].value);

        excludedlist.options[Index] = null;

        --list_options_no;
      } else s = 0;
    }
    save();
    return true;
  }
</script>

<h2>Excluded folders</h2>

<div id="exluded-folders">
  <div id="list-excluded">
    <select
      bind:this={excludedlist}
      id="excluded-select"
      name="lstValue"
      type="text"
      multiple
    />
  </div>
  <div id="add-remove-exluded">
    <label for="myBrowser"> Add a folder:</label>
    <input
      bind:this={exlude_path_input}
      bind:value={exlude_path_input_value}
      list="exlude-folder"
      id="Exluded-folders"
      type="text"
      placeholder="Start typing to see suggestions..."
      style="width:300px;"
    />
    <datalist id="exlude-folder">
      {#each all_folders as folder_path}
        <option value={folder_path} />
      {/each}
    </datalist>
    <br />
    <br />
    <input
      type="button"
      name="add"
      value="Add"
      on:click={() => {
        addValue();
      }}
    /><br />
    <input
      type="button"
      name="delete"
      value="Delete"
      on:click={() => {
        deleteValue();
      }}
    /><br /><br />
  </div>
  <div id="currently-excluded">
    Currently excluded files: {excluded_files.length}
    <input
      type="button"
      name="toggle-show-hidden"
      value={show_all_hidden ? "Hide" : "Show"}
      on:click={() => {
        show_all_hidden = !show_all_hidden;
      }}
    />
    <div
      style={show_all_hidden ? "display:block" : "display:none"}
      id="currently-excluded-list"
    >
      <ul>
        {#each excluded_files as file_path}
          <li>{file_path}</li>
        {/each}
      </ul>
    </div>
  </div>
</div>

<style>
  * {
    font-size: 1em;
  }

  h2 {
    text-align: left;
  }

  div#exluded-folders {
    display: flex;
    flex-wrap: wrap;
    column-gap: 10px;
  }

  div#list-excluded {
    width: 300px;
  }

  #excluded-select {
    height: 300px;
    width: 300px;
    font-size: 1em;
    overflow: auto;
  }

  #add-remove-exluded {
    height: 300px;
    width: 300px;
  }

  div#currently-excluded {
    width: 600px;
    max-height: 300px;
    overflow: hidden;
  }

  div#currently-excluded-list {
    overflow: auto;
    max-height: 260px;
  }
</style>
