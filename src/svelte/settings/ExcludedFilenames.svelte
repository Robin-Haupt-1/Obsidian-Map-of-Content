<script lang="ts">
  import type { App } from "obsidian";
  import type MOCPlugin from "../../main";
  import { onMount } from "svelte";

  export let app: App;
  export let plugin: MOCPlugin;
  let excludedList;

  const excludedFilenameComponents = plugin.settings.get(
    "exluded_filename_components"
  );
  const allFiles = app.vault
    .getFiles()
    .map((file) => file.basename + "." + file.extension);

  let excludedFiles = allExcludedFiles();
  // TODO show all exluded files in TextEdit not list

  // add all existing excluded folders to select element

  let listOptionsNo = 0;
  onMount(() => {
    // create select entries for all already excluded filename components
    excludedFilenameComponents.forEach((folder) => {
      excludedList.options[listOptionsNo] = new Option(folder, folder);
      listOptionsNo++;
    });
  });

  function allExcludedFiles() {
    return allFiles.filter((filename: string) => {
      return excludedFilenameComponents.some((path: string) =>
        filename.contains(path)
      );
    });
  }

  let excludePhraseInputValue;
  let excludePhraseInput;
  let showAllHidden = false;

  /** update the list of exluded files and save the updated settings*/
  function save() {
    excludedFiles = allExcludedFiles();
    plugin.settings.set({
      exluded_filename_components: excludedFilenameComponents,
    });
  }

  function addValue() {
    if (!excludePhraseInputValue) {
      return;
    }
    // Return if folder already on list
    if (excludedFilenameComponents.contains(excludePhraseInputValue)) {
      excludePhraseInput.value = "";
      excludePhraseInputValue = "";
      return;
    }

    // add option to select box
    excludedList.options[listOptionsNo++] = new Option(
      excludePhraseInputValue,
      excludePhraseInputValue
    );
    excludedFilenameComponents.push(excludePhraseInputValue);
    // reset input field

    excludePhraseInput.value = "";
    excludePhraseInputValue = "";

    save();
    return true;
  }

  function deleteValue() {
    let s = 1;
    let selectedIndex;
    if (excludedList.selectedIndex === -1) {
      alert("Please select an item from the list");
      return true;
    }

    while (s > 0) {
      selectedIndex = excludedList.selectedIndex;

      if (selectedIndex >= 0) {
        excludedFilenameComponents.remove(
          excludedList.options[selectedIndex].value
        );

        excludedList.options[selectedIndex] = null;

        --listOptionsNo;
      } else s = 0;
    }
    save();
    return true;
  }
</script>

<h2>Excluded filenames</h2>
Filenames that contain these phrases will not be included in the Map of Content.
That also includes the file extension.<br /><br />

<div id="exlude-filenames">
  <div id="list-excluded">
    <select
      bind:this={excludedList}
      id="excluded-select"
      name="lstValue"
      type="text"
      multiple
    />
  </div>
  <div id="add-remove-exluded">
    <label for="Exluded-phrases"> Add a phrase:</label>
    <input
      bind:this={excludePhraseInput}
      bind:value={excludePhraseInputValue}
      id="Exluded-phrases"
      type="text"
      style="width:300px;"
    />
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
        {#each excludedFiles as file_path}
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

  div#exlude-filenames {
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
