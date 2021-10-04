<script lang="ts">
  import type { App } from 'obsidian'
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
  let scroll_pos;
  let scroll_up_div_already_visible=false;

  onMount(() => {
    scroll_to_top();
  });
  
  /** Scroll the whole view to the top*/
  function scroll_to_top(){
     main_div.scrollTop=0
  }
  /**show to "scroll to top" arrow if the user has scrolled the view*/
  function on_scroll(position:number){
    if (position!=0 && !scroll_up_div_already_visible){
      scroll_up_div.style.display="block"
      scroll_up_div_already_visible=true
    }
    //hide the arrow if scrolls back to the top 
    else if (position===0){
      scroll_up_div.style.display="none"
      scroll_up_div_already_visible=false
    } 
  }
</script>   
<div id="main_moc_div" bind:this={main_div} on:scroll={(e) => on_scroll(e.target.scrollTop)}>
 
  {#if paths.length == 0}
    ❌ This note has no connections to <a
      class="link"
      title={cn_path}
      on:click={(event) => NavigateToFile(app, cn_path, event)}
    >
      {GetDisplayName(cn_path, db)}</a
    >
  {/if}
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
<div bind:this={scroll_up_div} id="scroll_up" title="Scroll to top" ><span on:click={()=>scroll_to_top()}>⬆</span></div>

</div>

<style>
  div#main_moc_div {
    padding: initial;
    width: initial;
    height: 100%;
    position: initial;
    overflow:auto;
  }

  div#scroll_up{
    color:gray;
    display:none;
    text-align:center; 
    height:30px;
    width:30px;
    background-color: transparent;
    position:fixed;
    margin-right:20px;
    margin-top:20px;
     right:5px;
    top:4px;
   }
  div#scroll_up span{
    cursor:pointer;
    font-size:25px;
    color:darkgrey
  }
  div#scroll_up:hover span {
    color:gray
  }
 
  a.link {
    cursor: pointer;
  }
  ul {
    padding-left: 0;
  } 
</style>
