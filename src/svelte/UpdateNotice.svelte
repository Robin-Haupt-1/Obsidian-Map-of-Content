<script lang="ts">
  import type MOCPlugin from "../main";

  export let view: any;
  export let plugin: MOCPlugin;
  const settings = plugin.settings;

  const darkModeDependentClass = document.body.classList.contains("theme-dark")
    ? "dark-mode"
    : "light-mode";
</script>

<div id="all-container">
  <div id="main-moc-div" class={darkModeDependentClass}>
    <h3 style="text-align:center">This plugin has been updated</h3>

    The latest changes are:
    <ul>
      <li>
        Added a settings option to toggle whether the paths to the current note
        are displayed or not
      </li>
    </ul>
    See&nbsp;<a
      href="https://github.com/Robin-Haupt-1/Obsidian-Map-of-Content/releases"
    >
      here</a
    >
    for a complete history of all changes.<br /><br />
    <br /><br />
    <button
      on:click={() => {
        settings.set({ do_show_update_notice: false });
        view.rerender();
      }}
      style="display:block;margin:auto;"
      >Okay
    </button>
  </div>
</div>

<style>
  div#all-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  div#main-moc-div {
    padding: initial;
    width: initial;
    height: initial;
    position: initial;
    overflow: auto;
    flex: 1;
  }

  div#main-moc-div.dark-mode {
    color: #dcddde;
  }
</style>
