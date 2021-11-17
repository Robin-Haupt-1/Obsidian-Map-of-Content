<script lang="ts">
    import type { App } from "obsidian";
    import type { DBManager } from "../db";
    import type MOCPlugin from "../../main"; 
    import { 
        Log,
    } from "../utils";
    import { onMount } from "svelte";

    export let app: App;
    export let view: any;
    export let plugin: MOCPlugin;
    let settings=plugin.settings

    let main_div;
    let dark_mode = document.body.classList.contains("theme-dark")
        ? "dark-mode"
        : "light-mode";
    /** Scroll the whole view to the top*/
    function acceptNotice() {
        settings.set({"do_show_update_notice":false})
        view.rerender()
    }
</script>

<div id="all-container">
    <div id="main_moc_div" class={dark_mode} bind:this={main_div}>
        <h3 style="text-align:center">The Map of Content plugin has been updated</h3> 

        The latest changes are:
        <ul>
            <li>
                Your Map of Content will be updated automatically when you
                switch between notes, if you've changed any links
            </li><br>
            <li>
                There's a new top bar with buttons to show or hide more
                descendants in the tree, and to update the Map of Content
            </li>
        </ul>
        <br />
        <button on:click={acceptNotice} style="display:block;margin:auto;">Close</button> 
    </div>
</div>

<style>
    div#all-container {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    div#main_moc_div {
        padding: initial;
        width: initial;
        height: initial;
        position: initial;
        overflow: auto;
        flex: 1;
    }

    div#main_moc_div.dark-mode {
        color: #dcddde;
    }
</style>
