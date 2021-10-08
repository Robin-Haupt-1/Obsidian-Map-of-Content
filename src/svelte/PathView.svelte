<script lang="ts">
    import type { App } from "obsidian";
    import type { DBManager } from "../db";
    import { LINKED_BOTH, LINKED_TO, LINKED_FROM } from "../constants";
    import { GetDisplayName, IsCtrlPressed, NavigateToFile } from "../utils";
    import { onMount } from "svelte";

    import Descendants from "./Descendants.svelte";

    export let paths: [string, string][][];
    export let app: App;
    export let db: DBManager;
    export let cn_path: string;

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
        if (position != 0 && !scroll_up_div_already_visible) {
            scroll_up_div.style.display = "block";
            scroll_up_div_already_visible = true;
        }
        //hide the arrow if user scrolls back to the top
        else if (position === 0) {
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
<div
    id="main_moc_div"
    class={dark_mode}
    bind:this={main_div}
    on:scroll={(e) => on_scroll(e.target.scrollTop)}
>
    {#if paths.length == 0}
        This note doesn't have any connections to <a
            class="link"
            title={cn_path}
            on:click={(event) => NavigateToFile(app, cn_path, event)}
        >
            {GetDisplayName(cn_path, db)}</a
        >.<br /><br /> Link it to a note that is part of your Map of Content.
        Then
        <a
            class="link"
            on:click={() => {
                db.update();
            }}>update</a
        >
        your Map of Content and watch it grow!<br />
        <div id="seedling-container">
            <!--seedling svg from https://www.svgrepo.com/svg/263312/sprout-tree -->
            <svg
                id="seedling"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                x="0px"
                y="0px"
                viewBox="0 0 512.001 512.001"
                style="enable-background:new 0 0 512.001 512.001;"
                xml:space="preserve"
            >
                <path
                    style="fill:#6DC82A;"
                    d="M282.915,211.33c-3.863,4.077-9.324,6.225-14.941,5.877c-1.943-0.123-48.129-3.298-95.369-28.754
	c-44.641-24.056-98.511-72.868-101.639-168.804c-0.172-5.232,1.831-10.3,5.531-14.002C82.141,0,88.765,0,91.594,0
	c0.001,0,0.001,0,0.001,0c2.001,0,49.045,0.338,97.518,29.403c25.163,15.089,46.083,35.148,62.181,59.622
	c19.446,29.566,31.786,65.589,36.678,107.066C288.63,201.671,286.777,207.252,282.915,211.33z"
                />
                <path
                    style="fill:#5EAC24;"
                    d="M251.887,89.963c-7.938,14.65-14.633,31.15-19.437,49.738c-4.32,12.902-10.917,35.57-16.362,66.933
	c28.719,8.988,50.563,10.49,51.886,10.573c5.618,0.349,11.078-1.799,14.941-5.877c3.862-4.078,5.715-9.659,5.056-15.237
	C283.13,155.048,270.983,119.354,251.887,89.963z"
                />
                <path
                    style="fill:#4E901E;"
                    d="M266.674,178.855l-40.788-39.775L215.13,85.482c-0.851-4.248-4.984-6.997-9.233-6.147
	c-4.248,0.852-6.998,4.987-6.147,9.233l6.245,31.116L183.5,97.748l-10.904-54.335c-0.851-4.248-4.986-6.994-9.233-6.147
	c-4.248,0.852-6.998,4.986-6.147,9.233l6.392,31.852l-52.492-51.184c-3.104-3.024-8.066-2.96-11.091,0.14
	c-3.024,3.102-2.961,8.067,0.14,11.09l57.719,56.284l-40.264-0.688c-4.327-0.118-7.901,3.377-7.976,7.708
	c-0.073,4.331,3.377,7.901,7.708,7.976l56.907,0.973l26.775,26.11l-40.88-0.697c-4.292-0.096-7.901,3.377-7.976,7.708
	c-0.073,4.331,3.377,7.901,7.708,7.976l57.522,0.982l38.311,37.358c1.526,1.487,3.501,2.227,5.474,2.227
	c2.04,0,4.078-0.792,5.617-2.368C269.837,186.843,269.775,181.878,266.674,178.855z"
                />
                <path
                    style="fill:#91DC5A;"
                    d="M467.824,5.914c-3.863-4.077-9.324-6.225-14.941-5.877c-1.943,0.123-48.129,3.298-95.369,28.754
	c-36.301,19.561-78.701,55.493-94.961,119.819c-8.881,26.153-28.446,97.078-23.87,203.868c0.396,9.239,8.01,16.463,17.17,16.462
	c0.248,0,0.498-0.005,0.749-0.016c9.489-0.407,16.852-8.428,16.446-17.919c-2.371-55.323,2.184-100.55,8.054-133.923
	c13.209-0.757,52.566-5.045,92.92-29.241c25.163-15.089,46.083-35.148,62.181-59.622c19.446-29.566,31.786-65.589,36.678-107.066
	C473.539,15.573,471.686,9.992,467.824,5.914z"
                />
                <path
                    style="fill:#5EAC24;"
                    d="M443.129,27.307c-3.026-3.101-7.991-3.164-11.091-0.14L379.55,78.35l6.392-31.851
	c0.851-4.247-1.899-8.38-6.147-9.233c-4.242-0.848-8.381,1.899-9.233,6.147l-10.905,54.335l-22.494,21.936l6.245-31.116
	c0.852-4.247-1.899-8.38-6.147-9.233c-4.246-0.85-8.381,1.899-9.233,6.147l-10.757,53.599l-40.789,39.775
	c-3.102,3.024-3.163,7.989-0.14,11.09c1.538,1.576,3.575,2.367,5.617,2.367c1.974,0,3.95-0.74,5.474-2.227l38.311-37.358
	l57.524-0.982c4.331-0.074,7.781-3.644,7.708-7.976c-0.073-4.286-3.57-7.709-7.839-7.709c-0.046,0-0.092,0-0.137,0.001
	l-40.881,0.697l26.775-26.11l56.907-0.973c4.331-0.074,7.781-3.644,7.708-7.976c-0.073-4.286-3.57-7.709-7.839-7.709
	c-0.046,0-0.092,0-0.137,0.001l-40.264,0.688l57.719-56.284C446.091,35.373,446.153,30.408,443.129,27.307z"
                />
                <path
                    style="fill:#CC7400;"
                    d="M449.193,410.125c-7.91,0-15.298,2.228-21.577,6.087c-9.274-30.342-37.491-52.414-70.869-52.414
	c-3.704,0-7.341,0.28-10.898,0.805c-15.13-34.614-49.655-58.813-89.846-58.813s-74.716,24.199-89.846,58.813
	c-3.558-0.525-7.196-0.805-10.898-0.805c-33.378,0-61.594,22.072-70.869,52.414c-6.279-3.859-13.666-6.087-21.577-6.087
	c-22.795,0-41.275,18.48-41.275,41.275s18.48,41.275,41.275,41.275c12.216,0,23.188-5.31,30.744-13.744
	c13.282,19.931,35.954,33.07,61.701,33.07c20.851,0,39.68-8.625,53.144-22.487c14.097,7.848,30.321,12.334,47.601,12.334
	c17.279,0,33.504-4.487,47.601-12.334c13.466,13.862,32.293,22.487,53.144,22.487c25.747,0,48.42-13.137,61.701-33.07
	c7.557,8.434,18.529,13.744,30.744,13.744c22.795,0,41.275-18.48,41.275-41.275C490.468,428.604,471.988,410.125,449.193,410.125z"
                />
                <g>
                    <path
                        style="fill:#AA6100;"
                        d="M309.888,345.918c9.748,0,19.154,1.443,28.042,4.092c-17.525-26.63-47.666-44.221-81.928-44.221
		c-40.192,0-74.716,24.199-89.846,58.813c-3.558-0.525-7.196-0.805-10.898-0.805c-33.378,0-61.594,22.072-70.869,52.414
		c-6.279-3.859-13.666-6.087-21.577-6.087c-22.795,0-41.275,18.48-41.275,41.275c0,22.795,18.48,41.275,41.275,41.275
		c12.216,0,23.188-5.31,30.744-13.744c13.282,19.931,35.954,33.07,61.701,33.07c20.851,0,39.68-8.625,53.144-22.487
		c6.148,3.423,12.7,6.204,19.567,8.255c-10.172-15.451-16.108-33.939-16.108-53.821C211.86,389.808,255.749,345.918,309.888,345.918
		z"
                    />
                    <circle
                        style="fill:#AA6100;"
                        cx="294.986"
                        cy="421.014"
                        r="17.771"
                    />
                    <circle
                        style="fill:#AA6100;"
                        cx="366.638"
                        cy="462.863"
                        r="17.771"
                    />
                    <circle
                        style="fill:#AA6100;"
                        cx="355.71"
                        cy="402.055"
                        r="6.838"
                    />
                    <circle
                        style="fill:#AA6100;"
                        cx="256.002"
                        cy="469.702"
                        r="6.838"
                    />
                    <circle
                        style="fill:#AA6100;"
                        cx="277.209"
                        cy="376.498"
                        r="6.838"
                    />
                    <circle
                        style="fill:#AA6100;"
                        cx="424.351"
                        cy="438.791"
                        r="6.838"
                    />
                </g>
                <g>
                    <circle
                        style="fill:#CC7400;"
                        cx="384.415"
                        cy="317.216"
                        r="17.771"
                    />
                    <circle
                        style="fill:#CC7400;"
                        cx="424.351"
                        cy="356.953"
                        r="6.838"
                    />
                    <circle
                        style="fill:#CC7400;"
                        cx="424.351"
                        cy="324.055"
                        r="6.838"
                    />
                </g>
                <g>
                    <circle
                        style="fill:#AA6100;"
                        cx="112.53"
                        cy="310.942"
                        r="17.771"
                    />
                    <circle
                        style="fill:#AA6100;"
                        cx="83.02"
                        cy="350.115"
                        r="6.838"
                    />
                </g>
            </svg>
        </div>
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
    div#main_moc_div {
        padding: initial;
        width: initial;
        height: 100%;
        position: initial;
        overflow: auto;
    }
    div#main_moc_div.dark-mode {
        color: lightgray;
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

    div#seedling-container {
        position: fixed;
        bottom: 5%;
        width: 100%;
        height: 25%;
        max-height: 200px;
        align-content: center;
    }
    svg#seedling {
        display: block;
        width: 100%;
        height: 100%;
        opacity: 60%;
        position: relative;
        margin-left: auto;
        margin-right: auto;
    }
</style>
