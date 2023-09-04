<script lang="ts">
  import type { App } from "obsidian";
  import type MOCPlugin from "../../main";
  import { onMount } from "svelte";

  import { GetAllFolders } from "../../utils";

  export let app: App;
  export let plugin: MOCPlugin;
  let excludedlist;
  let excludedFolders = plugin.settings.get("exluded_folders");
  // TODO show all exluded files in TextEdit not list
  // Select box based on https://www.c-sharpcorner.com/UploadFile/mahakgupta/add-and-remove-listbox-items-in-javascript/
  let allFolders = GetAllFolders(app);

  var listOptionsNo = 0;
  let excludedFiles = allExcludedFiles();
  onMount(() => {
    // create select entries for all already excluded folders
    excludedFolders.forEach((folder) => {
      excludedlist.options[listOptionsNo] = new Option(folder, folder);
      listOptionsNo++;
    });
  });

  function allExcludedFiles() {
    let allFiles = app.vault.getFiles().map((file) => file.path);

    return allFiles.filter((pathToFile) => {
      return excludedFolders.some((path: string) =>
        pathToFile.startsWith(path)
      );
    });
  }

  let excludePathInputValue;
  let excludePathInput;
  let showAllHidden = false;

  /** update the list of exluded files and save the updated settings*/
  function save() {
    excludedFiles = allExcludedFiles();
    plugin.settings.set({ exluded_folders: excludedFolders });
  }

  function addValue() {
    if (!excludePathInputValue) {
      return;
    }
    // Return if folder doesn't exist
    if (!allFolders.contains(excludePathInputValue)) {
      alert("Please choose a folder from the list");
      return;
    }
    // Return if folder already on list
    if (excludedFolders.contains(excludePathInputValue)) {
      excludePathInput.value = "";
      excludePathInputValue = "";
      return;
    }
    // add option to select box
    excludedlist.options[listOptionsNo++] = new Option(
      excludePathInputValue,
      excludePathInputValue
    );
    excludedFolders.push(excludePathInputValue);

    // reset input field
    excludePathInput.value = "";
    excludePathInputValue = "";

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
        excludedFolders.remove(excludedlist.options[Index].value);

        excludedlist.options[Index] = null;

        --listOptionsNo;
      } else s = 0;
    }
    save();
    return true;
  }
</script>

<h2>Excluded folders</h2>

<div id="exluded-folders-container">
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
    <label for="Exluded-folders"> Add a folder:</label>
    <input
      bind:this={excludePathInput}
      bind:value={excludePathInputValue}
      list="exlude-folder"
      id="Exluded-folders"
      type="text"
      placeholder="Start typing to see suggestions..."
      style="width:300px;"
    />
    <datalist id="exlude-folder">
      {#each allFolders as folderPath}
        <option value={folderPath} />
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
    Currently excluded files: {excludedFiles.length}
    <input
      type="button"
      name="toggle-show-hidden"
      value={showAllHidden ? "Hide" : "Show"}
      on:click={() => {
        showAllHidden = !showAllHidden;
      }}
    />
    <div
      style={showAllHidden ? "display:block" : "display:none"}
      id="currently-excluded-list"
    >
      <ul>
        {#each excludedFiles as filePath}
          <li>{filePath}</li>
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

  div#exluded-folders-container {
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
