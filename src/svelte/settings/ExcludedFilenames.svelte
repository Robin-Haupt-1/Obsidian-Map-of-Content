<script lang="ts">
    import type { App, TFile } from "obsidian";
    import type { DBManager } from "../../db";
    import type MOCPlugin from "../../main";
    import { onMount } from "svelte";

    export let app: App;
    export let plugin: MOCPlugin;
    let excludedlist;

    let exluded_filename_components = plugin.settings.get(
        "exluded_filename_components"
    );
    let all_files = app.vault
        .getFiles()
        .map((file) => file.basename + "." + file.extension);

    let excluded_files = allExcludedFiles();
    // TODO show all exluded files in TextEdit not list
    
    // add all existing excluded folders to select element

    var list_options_no = 0;
    onMount(() => {
        // create select entries for all already excluded filename components
        exluded_filename_components.forEach((folder) => {
            excludedlist.options[list_options_no] = new Option(folder, folder);
            list_options_no++;
        });
    });

    function allExcludedFiles() {
        return all_files.filter((filename: string) => {
            return exluded_filename_components.some((path: string) =>
                filename.contains(path)
            );
        });
    }

    let exclude_phrase_input_value;
    let exclude_phrase_input;
    let show_all_hidden = false;

    /** update the list of exluded files and save the updated settings*/
    function save() {
        excluded_files = allExcludedFiles();
        plugin.settings.set({
            exluded_filename_components: exluded_filename_components,
        });
    }
    function addValue() {
        if (!exclude_phrase_input_value) {
            return;
        }
        // Return if folder already on list
        if (exluded_filename_components.contains(exclude_phrase_input_value)) {
            exclude_phrase_input.value = "";
            exclude_phrase_input_value = "";
            return;
        }

        // add option to select box
        let AddOpt = new Option(
            exclude_phrase_input_value,
            exclude_phrase_input_value
        );
        excludedlist.options[list_options_no++] = AddOpt;
        exluded_filename_components.push(exclude_phrase_input_value);
        // reset input field

        exclude_phrase_input.value = "";
        exclude_phrase_input_value = "";

        save();
        return true;
    }

    function deleteValue() {
        let s = 1;
        let Index;
        if (excludedlist.selectedIndex == -1) {
            alert("Please select an item from the list");
            return true;
        }

        while (s > 0) {
            Index = excludedlist.selectedIndex;

            if (Index >= 0) {
                exluded_filename_components.remove(
                    excludedlist.options[Index].value
                );

                excludedlist.options[Index] = null;

                --list_options_no;
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
            bind:this={excludedlist}
            id="excluded-select"
            name="lstValue"
            type="text"
            multiple
        />
    </div>
    <div id="add-remove-exluded">
        <label for="myBrowser"> Add a phrase:</label>
        <input
            bind:this={exclude_phrase_input}
            bind:value={exclude_phrase_input_value}
            id="Exluded-filenames"
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
