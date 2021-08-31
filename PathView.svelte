<script lang="ts">
  import type { App } from "obsidian";
  import type { LibKeeper } from "./libkeeper";
  import { LINKED_BOTH, LINKED_TLI, LINKED_TO ,LINKED_FROM} from "./constants";

  //import Paths from "./Paths.svelte";
  import { getDisplayName, isCtrlPressed ,navigateToFile} from "./utils";

  import type TLIPlugin from "./main";

  export let pathes: [string, string][][];
  export let app: App;
  export let lib: LibKeeper;
  export let plugin: TLIPlugin;
  export let tli_path:string;
  export let rerender_key:number
  console.log("Pathview called")
  $:{
    app=app
    pathes=pathes
  }
  rerender_key+=1

</script>

<div class="pathview"> 
  {#if pathes.length == 0} 
  ❌ This note has no connections to <a
      class="link"
      title={tli_path}
      on:click={(event) =>
        navigateToFile(app, tli_path, event)}
    >
      {getDisplayName(tli_path, lib)}</a
    >
  {/if}
  {#each pathes as path}

  <div class="path">
  
    {#each path.reverse() as pathitem, i}
      {#if i == 0}
        <span title={pathitem[0]}> {getDisplayName(pathitem[0], lib)}</span>
      {:else}
        <a
          class="link"
          title={pathitem[0]}
          on:click={(event) => navigateToFile(app, pathitem[0], event)}
        >
          {getDisplayName(pathitem[0], lib)}</a
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
  

    <!--<Paths {path} {app} {lib} />-->
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
  }
  a.link {
    cursor: pointer;
  }
</style>
