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

<div
  id="main_moc_div"
  bind:this={main_div}
  on:scroll={(e) => on_scroll(e.target.scrollTop)}
>
  {#if paths.length == 0}
    This note has no connections to <a
      class="link"
      title={cn_path}
      on:click={(event) => NavigateToFile(app, cn_path, event)}
    >
      {GetDisplayName(cn_path, db)}</a
    >.<br /><br /> Link it to a note that is part of your Map of Content,
    <a
      class="link"
      on:click={() => {
        db.update()
      }}>update it</a
    > and watch it grow!<br>
    <!--seedling svg from https://www.svgrepo.com/svg/267582/sprout-->
    <svg id="seedling"version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 512.001 512.001" style="enable-background:new 0 0 512.001 512.001;" xml:space="preserve">
<g>
	<path style="fill:#B5E06C;" d="M317.852,55.319c8.656,27.97,4.605,54.055-9.044,58.283c-13.637,4.228-31.726-15.015-40.382-42.973
		c-8.656-27.97-4.616-54.055,9.033-58.283C291.108,8.118,309.185,27.361,317.852,55.319z"/>
	<path style="fill:#B5E06C;" d="M490.169,63.032c7.113,22.953-25.261,53.384-72.297,67.94
		c-47.048,14.568-90.939,7.761-98.053-15.192c-7.101-22.965,25.261-53.384,72.309-67.951
		C439.164,33.261,483.067,40.068,490.169,63.032z"/>
</g>
<path style="fill:#A3875E;" d="M244.413,337.358c7.584,19.643-7.608,43.797-33.929,53.961c-26.321,10.151-53.796,2.461-61.38-17.182
	c-7.572-19.643,7.62-43.797,33.929-53.949c16.122-6.218,32.692-5.747,44.834,0.082C235.557,323.944,241.481,329.75,244.413,337.358z
	"/>
<path d="M187.104,407.579c-6.032,0-11.93-0.775-17.512-2.336c-15.038-4.209-26.509-14.001-31.475-26.864
	c-4.962-12.868-3.037-27.827,5.275-41.045c7.751-12.323,20.323-22.314,35.401-28.132c18.483-7.128,38.733-6.959,54.17,0.453
	c10.74,5.136,18.499,13.251,22.438,23.469c4.965,12.858,3.045,27.819-5.27,41.04c-7.749,12.324-20.323,22.319-35.404,28.142
	C205.647,405.806,196.224,407.579,187.104,407.579z M206.468,327.471c-6.209,0-12.798,1.235-19.197,3.704
	c-19.868,7.667-32.314,25.4-27.177,38.725c5.141,13.317,26.281,18.096,46.153,10.431c19.874-7.674,32.322-25.412,27.179-38.731
	c-2.195-5.696-6.995-8.964-10.636-10.703c-0.007-0.004-0.014-0.007-0.021-0.011C218.024,328.609,212.422,327.471,206.468,327.471z"
	/>
<path d="M70.993,512.001c-29.648,0-55.039-16.272-56.603-17.294c-5.444-3.559-6.973-10.857-3.413-16.301
	c3.558-5.443,10.855-6.973,16.301-3.414c0.405,0.263,43.242,27.45,73.205,3.292c12.342-9.949,12.207-23.357,10.964-44.407
	c-1.426-24.137-3.2-54.177,32.804-70.469c5.921-2.68,12.903-0.052,15.583,5.874c2.682,5.926,0.052,12.904-5.874,15.584
	c-20.301,9.186-20.476,22.647-19.002,47.622c1.212,20.523,2.722,46.064-19.694,64.133
	C101.022,508.103,85.495,512.001,70.993,512.001z"/>
<path d="M79.031,426.805c-0.879,0-1.77-0.099-2.664-0.305c-6.337-1.465-10.286-7.79-8.821-14.127
	c0.28-1.211,3.003-12.112,12.275-21.819c8.699-9.106,24.758-18.852,51.892-13.562c6.384,1.245,10.551,7.429,9.306,13.813
	s-7.435,10.551-13.813,9.306c-13.394-2.611-23.604-0.353-30.353,6.712c-4.78,5.005-6.346,10.8-6.358,10.856
	C89.236,423.123,84.389,426.804,79.031,426.805z"/>
<path d="M227.874,332.05c-4.457,0-8.722-2.545-10.707-6.86c-2.717-5.91-0.128-12.902,5.781-15.619
	c55.32-25.434,54.12-57.165,52.602-97.339c-1.304-34.508-2.783-73.619,32.952-110.69c4.514-4.684,11.97-4.819,16.652-0.305
	c4.682,4.514,4.819,11.97,0.305,16.652c-28.777,29.853-27.609,60.746-26.374,93.453c0.801,21.172,1.629,43.064-6.529,63.731
	c-9.22,23.361-28.772,41.646-59.771,55.898C231.193,331.703,229.52,332.05,227.874,332.05z"/>
<path d="M468.271,56.016c-1.238,0-2.495-0.197-3.734-0.611c-1.459-0.488-3.021-0.933-4.64-1.321
	c-6.325-1.517-10.223-7.874-8.707-14.199c1.517-6.324,7.876-10.223,14.199-8.705c2.282,0.548,4.508,1.181,6.614,1.885
	c6.167,2.061,9.498,8.734,7.436,14.902C477.791,52.898,473.198,56.016,468.271,56.016z"/>
<path d="M370.235,150.526c-31.585,0.001-55.414-11.085-61.665-31.26c-9.315-30.124,25.109-65.668,80.073-82.688
	c14.992-4.642,30.464-7.428,44.742-8.053c6.484-0.296,11.996,4.752,12.281,11.249c0.285,6.498-4.752,11.997-11.25,12.281
	c-12.292,0.539-25.711,2.968-38.805,7.022c-45.799,14.181-68.458,40.556-64.541,53.222c3.922,12.654,37.519,21.607,83.318,7.422
	c20.767-6.427,39.673-16.688,51.873-28.152c9.903-9.307,14.636-18.672,12.659-25.051c-1.926-6.212,1.55-12.809,7.763-14.735
	c6.21-1.928,12.811,1.55,14.735,7.763c4.845,15.634-1.911,33.102-19.025,49.186c-14.938,14.038-36.615,25.932-61.038,33.49
	C403.219,147.837,385.785,150.526,370.235,150.526z"/>
<path d="M304.822,125.986c-8.934,0-18.173-4.709-26.656-13.736c-8.83-9.397-16.285-22.941-20.991-38.139
	c-10.918-35.278-3.696-66.667,16.798-73.015c20.489-6.348,44.192,15.463,55.129,50.735c0,0.002,0.001,0.004,0.001,0.006
	c10.917,35.275,3.69,66.664-16.81,73.014C309.842,125.61,307.344,125.986,304.822,125.986z M281.487,23.52
	c-0.204,0-0.386,0.025-0.545,0.074c-3.459,1.072-9.264,17.71-1.267,43.551c3.614,11.671,9.32,22.232,15.655,28.973
	c5.129,5.458,8.953,6.553,9.99,6.233c3.462-1.073,9.279-17.709,1.284-43.547l0,0C298.963,34.161,285.695,23.52,281.487,23.52z"/>
</svg>
  {:else}
    {#each paths as path}
      <div class="path">
        {#each path.reverse() as pathitem, i}
          {#if i == 0}
            <span title={pathitem[0]}> {GetDisplayName(pathitem[0], db)}</span>
          {:else}
            <a
              class="link"
              title={pathitem[0]}
              on:click={(event) => NavigateToFile(app, pathitem[0], event)}
            >
              {GetDisplayName(pathitem[0], db)}</a
            >
          {/if}
          {#if pathitem[1] == LINKED_FROM}
            {LINKED_TO}
          {:else if pathitem[1] == LINKED_TO}
            {LINKED_FROM}
          {:else if pathitem[1] == LINKED_BOTH}
            {LINKED_BOTH}
          {/if}
        {/each}
      </div>
      <br />
    {/each}

    <br />
    <ul>
      <Descendants {db} {app} note_path={open_note_path} indentation={0} />
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
        viewBox="0 0 24 24"><path d="M24 12l-12-9v5h-12v8h12v5l12-9z" /></svg
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
    fill: lightgray;
  }
  div#scroll_up:hover svg {
    fill: gray;
  }

  a.link {
    cursor: pointer;
  }
  ul {
    padding-left: 0;
  }

  svg#seedling{
    display:block;
    margin-top:100px;
    height:50%;
    max-height:180px; 
    opacity: 75%;
    position:relative;
    margin-left:auto;
    margin-right:auto;
  }
</style>
