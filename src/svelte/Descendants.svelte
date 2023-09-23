<script lang="ts">
  import type { App } from "obsidian";
  import type { DBManager } from "../db";
  import { getDisplayName, NavigateToFile } from "../utils";
  import type { ExpandManager } from "./helpers/expandManager";

  export let notePath: string;
  export let db: DBManager;
  export let indentation: number;
  export let view: any;
  export let app: App;
  export let expandManager: ExpandManager;
  let isExpanded;

  const children = Array.from(db.descendants.get(notePath) || []);

  const darkModeDependentClass = document.body.classList.contains("theme-dark")
    ? "dark-mode"
    : "light-mode";

  function resetExpanded(newMaxIndent: number) {
    if (indentation === 0) {
      isExpanded = true;
    } else if (!view.plugin.settings.isExpanded(notePath)) {
      isExpanded = false;
    } else {
      isExpanded = indentation < newMaxIndent;
    }
  }

  expandManager.registerIndentation(indentation);

  resetExpanded(expandManager.initialMaxIndent);

  expandManager.registerRedrawDescendantCallback(resetExpanded);
</script>

<!-- expand svg-->
<svg display="none">
  <symbol
    id="expand-arrow-svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
  >
    <path d="M22 12l-20 12 5-12-5-12z" />
  </symbol>
</svg>
<!--start descendants view-->
{#if indentation === 0 && children.length === 0}
  No descendants
{:else}
  <li class="container {darkModeDependentClass}">
    <p>
      {#if indentation === 0}
        {getDisplayName(notePath, db)}
      {:else}
        {#if children.length > 0}
          <span
            class="expand-arrow"
            on:click={() => {
              isExpanded = !isExpanded;
              view.plugin.settings.setExpanded(notePath, isExpanded);
              if (isExpanded) {
                expandManager.onManualExpand();
                expandManager.registerIndentation(indentation + 1);
              }
            }}
            ><div class="expand-button">
              {#if isExpanded}
                <svg class="svg expanded">
                  <use href="#expand-arrow-svg" />
                </svg>
              {:else}<svg class="svg">
                  <use href="#expand-arrow-svg" />
                </svg>
              {/if}
            </div></span
          >{/if}
        <a
          class="link"
          title={notePath}
          on:click={(event) => {
            NavigateToFile(app, notePath, event);
          }}
        >
          {getDisplayName(notePath, db)}</a
        >
      {/if}
    </p>
    <ul>
      {#if children.length > 0 && isExpanded}
        {#each children as child}
          <svelte:self
            {db}
            {app}
            notePath={child}
            indentation={indentation + 1}
            {view}
            {expandManager}
          />
        {/each}
      {/if}
    </ul>
  </li>
{/if}

<style>
  a.link {
    cursor: pointer;
    text-decoration: none;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    list-style: none;
    margin: 0;
    padding: 2px 0;
  }

  ul {
    padding-left: 1em;
  }

  li {
    padding-left: 1em;
    border: 5px solid darkgray;
    border-width: 0 0 1px 1px;
  }

  li.dark-mode {
    padding-left: 1em;
    border: 5px solid gray;
    border-width: 0 0 1px 1px;
  }

  li.container {
    border-bottom: 0px;
  }

  li p {
    margin: 0;
    position: relative;
    top: 0em;
    padding: 1px 0 1px 0;
  }

  li ul {
    border-top: 1px solid darkgray;
    margin-left: -1em;
    padding-left: 2em;
  }

  li.dark-mode ul {
    border-top: 1px solid gray;
  }

  ul li:last-child ul {
    border-left: none;
    margin-left: -17px;
  }

  .expand-arrow {
    color: darkgrey;
  }

  .expand-arrow:hover {
    color: gray;
  }

  div.expand-button {
    display: inline;
  }

  div.expand-button svg.svg {
    width: 14px;
    height: 14px;
    margin-top: 5px;
  }

  li.light-mode div.expand-button svg.svg {
    fill: darkgrey;
  }

  li.light-mode div.expand-button svg.svg:hover {
    fill: gray;
  }

  li.dark-mode div.expand-button svg.svg {
    fill: gray;
  }

  li.dark-mode div.expand-button svg.svg:hover {
    fill: lightgray;
  }

  div.expand-button svg.svg.expanded {
    transform: rotate(90deg);
  }
</style>
