<script lang="ts">
    import type { App } from "obsidian";
    import type { DBManager } from "../db";
    import type MOCPlugin from "../../main";
    import { Log } from "../utils";
    import { onMount } from "svelte";

    export let app: App;
    export let view: any;
    export let plugin: MOCPlugin;
    let settings = plugin.settings;

    let main_div;
    let dark_mode = document.body.classList.contains("theme-dark")
        ? "dark-mode"
        : "light-mode";
    /** Scroll the whole view to the top*/
    function acceptNotice() {
        settings.set({ do_show_update_notice: false });
        view.rerender();
    }
</script>

<div id="all-container">
    <div id="main_moc_div" class={dark_mode} bind:this={main_div}>
        <h3 style="text-align:center">This plugin has been updated</h3>

        The latest changes are:
        <ul>
            <li>
                The plugin can remember whether to show or hide a file's
                descendants in the tree view. This must be enabled in the
                settings.
            </li> 
        </ul>
        See <a
            href="https://github.com/Robin-Haupt-1/Obsidian-Map-of-Content/releases"
            >here</a
        > for a complete history of all changes.<br><br>
        You can support the development by donating on <a
            href="https://www.patreon.com/RobinHaupt">Patreon</a
        >, <a href="https://ko-fi.com/robinhaupt">Ko-Fi</a> or
        <a href="https://www.paypal.com/paypalme/robinhaupt">PayPal</a>. <br />
        Thank you!

        <br /><br />
        <button on:click={acceptNotice} style="display:block;margin:auto;"
            >Close</button
        >
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
