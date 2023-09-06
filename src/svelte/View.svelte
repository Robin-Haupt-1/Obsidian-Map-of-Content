<script lang="ts">
  import { LINKED_BOTH, LINKED_TO, LINKED_FROM } from "../constants";
  import type MOCView from "../view";
  import { getDisplayName, NavigateToFile } from "../utils";
  import NoLinkImage from "./NoLinkImage.svelte";
  import Descendants from "./Descendants.svelte";
  import UpdateNotice from "./UpdateNotice.svelte";
  import { ExpandManager } from "./helpers/expandManager";

  export let view: MOCView;
  export let paths: [string, string][][];
  export let error: string | undefined;

  const plugin = view.plugin;
  const expandManager = new ExpandManager();
  let scrollUpDiv;
  let mainDiv;
  let isScrollUpDivVisible = false;
  let currentNoteIsPinned = false;
</script>

<div
  id="all-container"
  class={document.body.classList.contains("theme-dark")
    ? "dark-mode"
    : "light-mode"}
>
  <div id="top-bar">
    <div
      id="pin-file"
      class="action is-pinned"
      class:is-pinned={currentNoteIsPinned}
      title={currentNoteIsPinned ? "Unpin this file" : "Pin this file"}
      on:click={() => {
        view.isPinned = !view.isPinned;
        currentNoteIsPinned = !currentNoteIsPinned;
        if (view.isPinned) {
        }
      }}
    >
      <svg
        id="not-pinned"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path
          d="M18 6c0 2.972-2.164 5.433-5 5.91v8.09h-2v-8.089c-2.836-.477-5-2.938-5-5.911 0-3.314 2.687-6 6-6s6 2.687 6 6zm-2 0c0-2.206-1.794-4-4-4s-4 1.794-4 4 1.794 4 4 4 4-1.794 4-4zm-5.618 2.098c2.339 1.84 5.563-.722 3.858-3.539.313 2.237-1.956 4.03-3.858 3.539zm4.618 8.195v2.052l.438.107c1.706.493 2.496 1.027 2.507 1.547-.011.52-.801 1.054-2.507 1.547-2.097.606-4.786.604-6.874.001-1.695-.489-2.515-1.021-2.515-1.547s.82-1.058 2.516-1.548l.436-.106v-2.052c-2.932.593-5.001 2.028-5.001 3.706 0 2.209 3.581 4 8 4s8-1.791 8-4c0-1.678-2.069-3.113-5-3.707z"
        />
      </svg>
      <svg
        id="pinned"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <path
          d="M 12,2 C 8.687,2 6,4.687 6,8 c 0,2.972 2.164,5.433 5,5.91 V 20 h 2 v -6.089 c 2.836,-0.477 5,-2.938 5,-5.91 C 18,4.687 15.313,2 12,2 Z M 11.293,6.508 C 10.744,7.158 9.87,7.308 9.34,6.841 8.81,6.374 8.824,5.469 9.374,4.819 9.922,4.169 10.796,4.02 11.326,4.486 c 0.53,0.467 0.515,1.372 -0.033,2.022 z M 20,20 c 0,2.209 -3.581,4 -8,4 -4.419,0 -8,-1.791 -8,-4 0,-1.678 2.069,-3.113 5,-3.707 v 2.052 L 8.564,18.451 C 6.869,18.942 6.048,19.474 6.048,20 c 0,0.526 0.82,1.058 2.516,1.548 2.088,0.603 4.777,0.605 6.874,-10e-4 C 17.144,21.054 17.934,20.52 17.945,20 17.934,19.48 17.144,18.946 15.438,18.453 L 15,18.346 v -2.052 c 2.931,0.593 5,2.028 5,3.706 z"
        />
      </svg>
    </div>
    <div id="top-bar-flex">
      <div
        id="update-moc"
        class="action"
        title="Update the Map of Content"
        on:click={() => {
          plugin.db.update();
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
          expandManager.contract();
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
          expandManager.expand();
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
      bind:this={scrollUpDiv}
      id="scroll-up-button"
      title="Scroll to top"
      class="action"
      on:click={() => {
        mainDiv.scrollTop = 0;
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path
          d="M15 5.829l6.171 6.171-6.171 6.171v-3.171h-13v-6h13v-3.171zm-2-4.829v6h-13v10h13v6l11-11-11-11z"
        />
      </svg>
    </div>
  </div>
  <div
    id="main-moc-div"
    bind:this={mainDiv}
    on:scroll={(e) => {
      if (e.target.scrollTop > 30 && !isScrollUpDivVisible) {
        scrollUpDiv.style.display = "block";
        isScrollUpDivVisible = true;
      }
      //hide the arrow if user scrolls back to the top
      else if (e.target.scrollTop <= 30 && isScrollUpDivVisible) {
        scrollUpDiv.style.display = "none";
        isScrollUpDivVisible = false;
      }
    }}
  >
    {#if plugin.settings.get("do_show_update_notice")}
      <UpdateNotice {view} {plugin} />
    {:else if error}
      <div class="error">
        {@html error}
      </div>
    {:else if paths.length === 0}
      This file doesn't have any connections to <a
        class="link"
        title={plugin.settings.get("CN_path")}
        on:click={(event) =>
          NavigateToFile(plugin.app, plugin.settings.get("CN_path"), event)}
      >
        {getDisplayName(plugin.settings.get("CN_path"), plugin.db)}</a
      >.<br /><br /> Link it to a file that is part of your Map of Content. Then
      <a
        class="link"
        on:click={() => {
          plugin.db.update();
        }}>update</a
      >
      your Map of Content and watch it grow!<br />
      <NoLinkImage />
    {:else}
      {#each paths as path}
        <div class="path">
          {#if plugin.settings.get("MOC_path_starts_at_CN")}
            {#each path as pathitem, i}
              {#if pathitem[1] === LINKED_FROM}
                <svg
                  class="path-arrow"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 15.05"
                >
                  <path
                    d="M 2.117,7 9.644,0.765 9,0 0,7.521 9,15 9.645,14.236 2.116,8 H 24 V 7 Z"
                  />
                </svg>
              {:else if pathitem[1] === LINKED_TO}
                <svg
                  class="path-arrow"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 15.05"
                >
                  <path
                    d=" M 21.883,8 14.356,14.235 15,15 24,7.479 15,0 14.355,0.764 21.884,7 H 0 v 1 z"
                  />
                </svg>
              {:else if pathitem[1] === LINKED_BOTH}
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
              {#if i === path.length - 1}<span title={pathitem[0]}>
                  {getDisplayName(pathitem[0], plugin.db)}</span
                >{:else}<a
                  class="link"
                  title={pathitem[0]}
                  on:click={(event) =>
                    NavigateToFile(plugin.app, pathitem[0], event)}
                  >{getDisplayName(pathitem[0], plugin.db)}</a
                >{/if}
            {/each}
          {:else}
            {#each path.reverse() as pathitem, i}
              {#if i === 0}<span title={pathitem[0]}>
                  {getDisplayName(pathitem[0], plugin.db)}</span
                >{:else}<a
                  class="link"
                  title={pathitem[0]}
                  on:click={(event) =>
                    NavigateToFile(plugin.app, pathitem[0], event)}
                >
                  {getDisplayName(pathitem[0], plugin.db)}</a
                >{/if}
              {#if pathitem[1] === LINKED_FROM}
                <svg
                  class="path-arrow"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 15.05"
                >
                  <path
                    d=" M 21.883,8 14.356,14.235 15,15 24,7.479 15,0 14.355,0.764 21.884,7 H 0 v 1 z"
                  />
                </svg>
              {:else if pathitem[1] === LINKED_TO}
                <svg
                  class="path-arrow"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 15.05"
                >
                  <path
                    d="M 2.117,7 9.644,0.765 9,0 0,7.521 9,15 9.645,14.236 2.116,8 H 24 V 7 Z"
                  />
                </svg>
              {:else if pathitem[1] === LINKED_BOTH}
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
          {/if}
        </div>
        <br />
      {/each}

      <br />
      <ul>
        <Descendants
          db={plugin.db}
          app={plugin.app}
          {view}
          notePath={view.openFilePath}
          indentation={0}
          {expandManager}
        />
      </ul>
    {/if}
  </div>
  <!--{open_file_folder}-->
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
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 10px;
    margin-bottom: 1em;
  }

  div#top-bar div#pin-file svg#pinned {
    display: none;
  }

  div#top-bar div#pin-file.is-pinned svg#pinned {
    display: block;
  }

  div#top-bar div#pin-file.is-pinned svg#not-pinned {
    display: none;
  }

  div#top-bar-flex {
    min-height: 30px;
    display: flex;
    justify-content: center;
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

  div#main-moc-div {
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

  div#scroll-up-button {
    justify-self: flex-end;
    display: none;
  }

  div#scroll-up-button {
    cursor: pointer;
    color: darkgrey;
  }

  div#scroll-up-button svg {
    transform: rotate(-90deg);
    height: 20px;
  }

  div.light-mode div#scroll-up-button svg {
    fill: darkgray;
  }

  div.light-mode div#scroll-up-button:hover svg {
    fill: gray;
  }

  div.dark-mode div#scroll-up-button svg {
    fill: gray;
  }

  div.dark-mode div#scroll-up-button:hover svg {
    fill: darkgray;
  }

  a.link {
    cursor: pointer;
  }

  ul {
    padding-left: 0;
  }

  svg.path-arrow {
    margin-right: 3px;
    margin-left: 3px;
    display: inline;
    width: 24px;
    height: 0.7em;
  }

  div.dark-mode svg.path-arrow {
    fill: lightgray;
  }

  .error {
    padding: 10px;
    width: initial;
    height: initial;
    position: initial;
    overflow-y: initial;
    overflow-wrap: initial;
  }
</style>
