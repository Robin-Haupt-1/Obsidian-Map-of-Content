<script lang="ts">
  import type { App } from "obsidian";
  import type { DBManager } from "../db";
  import type MOCPlugin from "../../main";
  import { Log } from "../utils";
  import { onMount } from "svelte";

  export let view: any;
  export let plugin: MOCPlugin;
  let settings = plugin.settings;

  let dark_mode = document.body.classList.contains("theme-dark")
    ? "dark-mode"
    : "light-mode";
</script>

<div id="all-container">
  <div id="main_moc_div" class={dark_mode}>
    <h3 style="text-align:center">This plugin has been updated</h3>

    The latest changes are:
    <ul>
      <li>
        Added a settings option to display the path from the Central Note
        starting at the Central Note instead of the currently open one.
      </li>
      <br />
      <li>
        Fixed a bug where links using # or ^ to reference headings or blocks
        weren't followed
      </li>
    </ul>
    See&nbsp;<a
      href="https://github.com/Robin-Haupt-1/Obsidian-Map-of-Content/releases"
    >
      here</a
    >
    for a complete history of all changes.<br /><br />
    Thank you for using this plugin! You can donate to support it's development on
    <a href="https://www.patreon.com/RobinHaupt">Patreon</a>,
    <a href="https://ko-fi.com/robinhaupt">Ko-Fi</a>
    or
    <a href="https://www.paypal.com/paypalme/robinhaupt">PayPal</a>.

    <br /><br />
    <button
      on:click={() => {
        settings.set({ do_show_update_notice: false });
        view.rerender();
      }}
      style="display:block;margin:auto;">Close</button
    >
  </div>
</div>

<style>
  div#all-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  div#main_moc_div {
    padding: initial;
    width: initial;
    height: initial;
    position: initial;
    overflow: auto;
    flex: 1;
  }

  div#main_moc_div.dark-mode {
    color: #dcddde;
  }
</style>
