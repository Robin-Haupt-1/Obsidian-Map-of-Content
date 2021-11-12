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
    let main_div;
    let dark_mode = document.body.classList.contains("theme-dark")
        ? "dark-mode"
        : "light-mode";
    /** Scroll the whole view to the top*/
    function acceptNotice() {
        plugin.updateSettings({"do_show_update_notice":false})
        view.rerender()
    }
</script>

<div id="all-container">
    <div id="main_moc_div" class={dark_mode} bind:this={main_div}>
        <div class="errors">Updated!</div>
        <h3 style="text-align:center">This plugin has been updated</h3>

        The latest changes are:
        <ul>
            <li>
                Your Map of Content will be updated automatically when you
                switch between notes (but only if you've changed any links)
            </li>
            <li>
                There's a new top bar with buttons to show or hide more
                descendants in the tree, and to update the Map of Content
            </li>
        </ul>
        <br />
        If you'd like to support the development of this addon, please consider donating
        to my <a href="https://www.paypal.com/paypalme/robinhaupt">Paypal</a> or
        <a href="https://ko-fi.com/robinhaupt">Ko-Fi</a> account. <br /><br>And
        please spread the word about it to your friends or on social media, so
        we can help more people organize their notes in an amazing way!
        <button on:click={acceptNotice}>Accept</button>
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
