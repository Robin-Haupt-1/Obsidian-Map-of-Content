<script lang="ts">
  import type { App } from "obsidian";

  export let pathes: [string, string][][];
  export let app:App
  export let lib:LibKeeper;
  import type { LibKeeper } from './libkeeper'

  import Paths from "./Paths.svelte";
  let j: string = "test";
  console.log("svelte is running!");

  const redraw = async () => {
    pathes=pathes
  }

  $: {
    redraw()
  } 

</script>

<div class="pathview">
  {#each pathes as path}
    <Paths {path} {app} {lib} />
  {/each}
  
</div>

<style>
 
  .pathview {
    padding: initial;
    width: initial;
    height: initial;
    position: initial;
    overflow-y: initial;
    overflow-wrap: initial; 
    font-size:15px;
  }
</style>
