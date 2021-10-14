<script lang="ts">
    import type { App } from "obsidian";
    import type { DBManager } from "../db";
    import { LINKED_BOTH, LINKED_TO, LINKED_FROM } from "../constants";
    import { GetDisplayName, IsCtrlPressed, NavigateToFile } from "../utils";
    import { onMount } from "svelte";
    import SaplingImage from "./SaplingImage.svelte";
    import Descendants from "./Descendants.svelte";

    export let paths: [string, string][][];
    export let app: App;
    export let db: DBManager;
    export let cn_path: string;
    export let errors: string[];

    export let open_note_path: string;
    let scroll_up_div;
    let main_div;
    let scroll_up_div_already_visible = false;
    let dark_mode = document.body.classList.contains("theme-dark")
        ? "dark-mode"
        : "light-mode";
    onMount(() => {
        scroll_to_top();
    });

    /** Scroll the whole view to the top*/
    function scroll_to_top() {
        main_div.scrollTop = 0;
    }
    /**show to "scroll to top" arrow if the user has scrolled the view*/
    function on_scroll(position: number) {
        if (position > 30 && !scroll_up_div_already_visible) {
            scroll_up_div.style.display = "block";
            scroll_up_div_already_visible = true;
        }
        //hide the arrow if user scrolls back to the top
        else if (position <= 30 && scroll_up_div_already_visible) {
            scroll_up_div.style.display = "none";
            scroll_up_div_already_visible = false;
        }
    }
</script>

<!-- define right pointer arrow svg-->
<svg display="none">
    <symbol
        id="pointer-arrow-right-svg-moc"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 15.05"
        ><path
            d=" M 21.883,8 14.356,14.235 15,15 24,7.479 15,0 14.355,0.764 21.884,7 H 0 v 1 z"
        />
    </symbol></svg
>
<!-- define left pointer arrow svg-->
<svg display="none">
    <symbol
        id="pointer-arrow-left-svg-moc"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 15.05"
        ><path
            d="M 2.117,7 9.644,0.765 9,0 0,7.521 9,15 9.645,14.236 2.116,8 H 24 V 7 Z"
        />
    </symbol></svg
>
<!-- define both directions pointer arrow svg-->
<svg display="none">
    <symbol
        id="pointer-arrow-both-svg-moc"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 15.05"
    >
        <path
            d="M 9 0 L 0 7.5214844 L 9 15 L 9.6445312 14.236328 L 2.1152344 8 L 21.882812 8 L 14.355469 14.234375 L 15 15 L 24 7.4785156 L 15 0 L 14.355469 0.76367188 L 21.884766 7 L 2.1171875 7 L 9.6445312 0.765625 L 9 0 z "
        />
    </symbol></svg
>
<!-- define hamburger menu svg-->
<svg display="none">
    <symbol
        id="hamburger-menu"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
    >
        <path d="M24 6h-24v-4h24v4zm0 4h-24v4h24v-4zm0 8h-24v4h24v-4z" />
    </symbol></svg
>
<div
    id="main_moc_div"
    class={dark_mode}
    bind:this={main_div}
    on:scroll={(e) => on_scroll(e.target.scrollTop)}
>
    <div id="top-bar">
        <svg class="path-arrow">
            <use href="#hamburger-menu" />
        </svg>
    </div>
    {#if errors.length}
        <div class="errors">
            {@html errors[0]}
        </div>
    {:else if paths.length == 0}
        This file doesn't have any connections to <a
            class="link"
            title={cn_path}
            on:click={(event) => NavigateToFile(app, cn_path, event)}
        >
            {GetDisplayName(cn_path, db)}</a
        >.<br /><br /> Link it to a file that is part of your Map of Content.
        Then
        <a
            class="link"
            on:click={() => {
                db.update();
            }}>update</a
        >
        your Map of Content and watch it grow!<br />
        <SaplingImage />
    {:else}
        {#each paths as path}
            <div class="path">
                {#each path.reverse() as pathitem, i}
                    {#if i == 0}
                        <span title={pathitem[0]}>
                            {GetDisplayName(pathitem[0], db)}</span
                        >
                    {:else}
                        <a
                            class="link"
                            title={pathitem[0]}
                            on:click={(event) =>
                                NavigateToFile(app, pathitem[0], event)}
                        >
                            {GetDisplayName(pathitem[0], db)}</a
                        >
                    {/if}
                    {#if pathitem[1] == LINKED_FROM}
                        <svg class="path-arrow">
                            <use href="#pointer-arrow-right-svg-moc" />
                        </svg>
                    {:else if pathitem[1] == LINKED_TO}
                        <svg class="path-arrow">
                            <use href="#pointer-arrow-left-svg-moc" />
                        </svg>
                    {:else if pathitem[1] == LINKED_BOTH}
                        <svg class="path-arrow">
                            <use href="#pointer-arrow-both-svg-moc" />
                        </svg>
                    {/if}
                {/each}
            </div>
            <br />
        {/each}

        <br />
        <ul>
            <Descendants
                {db}
                {app}
                note_path={open_note_path}
                indentation={0}
            />
        </ul>
        <div
            bind:this={scroll_up_div}
            id="scroll_up"
            title="Scroll to top"
            on:click={() => scroll_to_top()}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                ><path d="M24 12l-12-9v5h-12v8h12v5l12-9z" /></svg
            >
        </div>{/if}
</div>

<style>
    div#top-bar {
        display:none;
        text-align: right;
    }
    div#top-bar svg {
        float: right;
        clear: both;
        width: 24px;
        margin-left:10px;
        margin-bottom: 10px;
        height: 24px;
    }
    div#main_moc_div {
        padding: initial;
        width: initial;
        height: 100%;
        position: initial;
        overflow: auto;
    }
    div#main_moc_div.dark-mode {
        color: #dcddde;
    }

    div#scroll_up {
        color: gray;
        display: none;
        text-align: center;
        height: 30px;
        width: 30px;
        background-color: transparent;
        position: fixed;
        margin-right: 20px;
        margin-top: 20px;
        right: 5px;
        top: 4px;
    }
    div#scroll_up {
        cursor: pointer;
        font-size: 25px;
        color: darkgrey;
    }

    div#scroll_up svg {
        transform: rotate(-90deg);
    }

    div.light-mode div#scroll_up svg {
        fill: lightgray;
    }
    div.light-mode div#scroll_up:hover svg {
        fill: gray;
    }

    div.dark-mode div#scroll_up svg {
        fill: gray;
    }
    div.dark-mode div#scroll_up:hover svg {
        fill: lightgray;
    }

    a.link {
        cursor: pointer;
    }
    ul {
        padding-left: 0;
    }

    svg.path-arrow {
        margin-right: 2px;
        margin-left: 2px;
        display: inline;
        width: 24px;
        height: 0.7em;
    }
    div.dark-mode svg.path-arrow {
        fill: lightgray;
    }
    .errors {
        padding: 10px;
        width: initial;
        height: initial;
        position: initial;
        overflow-y: initial;
        overflow-wrap: initial;
    }
</style>
