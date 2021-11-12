<script lang="ts">
    import type MOCPlugin from "../../main";
    import { LINKED_BOTH, LINKED_TO, LINKED_FROM } from "../constants";
    import type MOCView from "../view";
    import {
        GetDisplayName,
        IsCtrlPressed,
        NavigateToFile,
        Log,
    } from "../utils";
    import SeedlingImage from "./SeedlingImage.svelte";
    import Descendants from "./Descendants.svelte";
    import UpdateNotice from "./UpdateNotice.svelte";
    import { expandManager } from "./helpers/expandManager";

    export let view: MOCView;
    export let paths: [string, string][][];
    export let errors: string[];
    let plugin = view.plugin;
    let app = plugin.app;
    let db = plugin.db;
    let cn_path = plugin.settings.get("CN_path");
    let expandMan = new expandManager();
    let scroll_up_div;
    let settings = plugin.settings;
    let main_div;
    let scroll_up_div_already_visible = false;
</script>

<div
    id="all-container"
    class={document.body.classList.contains("theme-dark")
        ? "dark-mode"
        : "light-mode"}
>
    <div id="top-bar">
        <div
            id="update-moc"
            class="action"
            title="Update the Map of Content"
            on:click={() => {
                db.update();
            }}
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                    d="M23 12c0 1.042-.154 2.045-.425 3h-2.101c.335-.94.526-1.947.526-3 0-4.962-4.037-9-9-9-1.706 0-3.296.484-4.655 1.314l1.858 2.686h-6.994l2.152-7 1.849 2.673c1.684-1.049 3.659-1.673 5.79-1.673 6.074 0 11 4.925 11 11zm-6.354 7.692c-1.357.826-2.944 1.308-4.646 1.308-4.962 0-9-4.038-9-9 0-1.053.191-2.06.525-3h-2.1c-.271.955-.425 1.958-.425 3 0 6.075 4.925 11 11 11 2.127 0 4.099-.621 5.78-1.667l1.853 2.667 2.152-6.989h-6.994l1.855 2.681z"
                />
            </svg>
        </div>

        <div
            id="minus-expand"
            class="action"
            title="Show fewer descendants"
            on:click={() => {
                expandMan.contract();
            }}
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                    d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-12v-2h12v2z"
                />
            </svg>
        </div>
        <div
            id="plus-expand"
            class="action"
            title="Show more descendants"
            on:click={() => {
                expandMan.expand();
            }}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill-rule="evenodd"
                clip-rule="evenodd"
            >
                <path
                    d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-5v5h-2v-5h-5v-2h5v-5h2v5h5v2z"
                />
            </svg>
        </div>
    </div>
    <div
        id="main_moc_div"
        bind:this={main_div}
        on:scroll={(e) => {
            if (e.target.scrollTop > 30 && !scroll_up_div_already_visible) {
                scroll_up_div.style.display = "block";
                scroll_up_div_already_visible = true;
            }
            //hide the arrow if user scrolls back to the top
            else if (
                e.target.scrollTop <= 30 &&
                scroll_up_div_already_visible
            ) {
                scroll_up_div.style.display = "none";
                scroll_up_div_already_visible = false;
            }
        }}
    >
        {#if settings.get("do_show_update_notice")}
            <UpdateNotice {app} {view} {plugin} />
        {:else if errors.length}
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
            >.<br /><br /> Link it to a file that is part of your Map of
            Content. Then
            <a
                class="link"
                on:click={() => {
                    db.update();
                }}>update</a
            >
            your Map of Content and watch it grow!<br />
            <SeedlingImage />
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
                            <svg
                                class="path-arrow"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 15.05"
                            >
                                <path
                                    d=" M 21.883,8 14.356,14.235 15,15 24,7.479 15,0 14.355,0.764 21.884,7 H 0 v 1 z"
                                />
                            </svg>
                        {:else if pathitem[1] == LINKED_TO}
                            <svg
                                class="path-arrow"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 15.05"
                            >
                                <path
                                    d="M 2.117,7 9.644,0.765 9,0 0,7.521 9,15 9.645,14.236 2.116,8 H 24 V 7 Z"
                                />
                            </svg>
                        {:else if pathitem[1] == LINKED_BOTH}
                            <svg
                                class="path-arrow"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 15.05"
                            >
                                <path
                                    d="M 9 0 L 0 7.5214844 L 9 15 L 9.6445312 14.236328 L 2.1152344 8 L 21.882812 8 L 14.355469 14.234375 L 15 15 L 24 7.4785156 L 15 0 L 14.355469 0.76367188 L 21.884766 7 L 2.1171875 7 L 9.6445312 0.765625 L 9 0 z "
                                />
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
                    {view}
                    note_path={view.open_file_path}
                    indentation={0}
                    {expandMan}
                />
            </ul>
            <div
                bind:this={scroll_up_div}
                id="scroll_up"
                title="Scroll to top"
                on:click={() => {
                    main_div.scrollTop = 0;
                }}
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
</div>

<style>
    div#all-container {
        display: flex;
        flex-direction: column;
        height: 100%;
    }
    div#top-bar {
        min-height: 30px;
        width: 100%;
        margin-bottom: 10px;
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
    }
    div#top-bar div.action {
        height: 20px;
        width: 20px;
        margin: 5px;
    }
    div#top-bar div.action svg {
        height: 20px;
        width: 20px;
        fill: darkgrey;
    }
    div#top-bar div.action:hover svg {
        fill: grey;
    }
    div.dark-mode div#top-bar div.action svg {
        height: 20px;
        width: 20px;
        fill: grey;
    }
    div.dark-mode div#top-bar div.action:hover svg {
        fill: darkgrey;
    }
    div#main_moc_div {
        padding: initial;
        width: initial;
        height: initial;
        position: initial;
        overflow: auto;
        flex: 1;
    }

    div.dark-mode {
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
