import "svelte";

import { ItemView, LinkCache, Notice, TFile, WorkspaceLeaf } from "obsidian";

import { devLog } from "./utils";
import { MOC_VIEW_TYPE } from "./constants";
import type MOCPlugin from "./main";
import type { Path } from "./types";
import type { DBManager } from "./db";
import View from "./svelte/View.svelte";
import type { SettingsManager } from "./settings";

export default class MOCView extends ItemView {
  db: DBManager;
  _app: View;
  plugin: MOCPlugin;
  settings: SettingsManager;
  leaf: WorkspaceLeaf;
  openFilePath: string;
  maxIndent: number = 5;
  isPinned = false;
  noteBeingMonitored: string;
  linksOfNoteBeingMonitored: string[];

  constructor(leaf: WorkspaceLeaf, plugin: MOCPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.leaf = leaf;
    this.db = this.plugin.db;
    this.settings = plugin.settings;
    this.app = this.plugin.app;

    this.plugin.registerViewInstance(this);
    this.plugin.app.workspace.onLayoutReady(() => this.init());

    this.plugin.app.workspace.on("css-change", () => {
      this.rerender();
    });
  }

  init() {
    this.registerEvent(
      this.app.workspace.on("file-open", (file: TFile) => {
        if (!this.isPinned) {
          this.monitorNote();
          this.rerender();
        }
      })
    );
    this.monitorNote();
    this.rerender();
  }

  async onOpen(): Promise<void> {}

  rerender(): void {
    devLog("Rerender called on view");

    this.destroyApp();

    const error = this.getRerenderError();

    if (error) {
      this._app = new View({
        target: this.contentEl,
        props: { view: this, paths: [], error: error },
      });
      return;
    }
    let allPaths = this.db.findPaths(this.openFilePath);
    if (allPaths.length === 0) {
      devLog("No paths to this note");
    }

    this._app = new View({
      target: this.contentEl,
      props: {
        view: this,
        paths: allPaths.map((p: Path) => p.items.slice()),
        error: error,
      },
    });
  }

  getRerenderError(): string | undefined {
    switch (true) {
      case this.db.isDatabaseUpdating:
        return "Updating...";
      case !this.db.isDatabaseComplete:
        return `Your Map of Content couldn't be created.<br><br> Make sure your Central Note path <code>'${this.settings.get(
          "CN_path"
        )}'</code> is correct. You can change this path in the settings tab.`;
      case this.app.workspace.getActiveFile() === null:
        return "No file is open";
      case this.settings.isExcludedFile(this.app.workspace.getActiveFile()):
        return "This file has been excluded from the Map of Content.";
      default:
        this.openFilePath = this.app.workspace.getActiveFile().path;
        if (this.db.getNoteFromPath(this.openFilePath) === undefined) {
          this.db.update(true);
          return "Updating...";
        }
    }
  }

  destroyApp() {
    if (!this._app) {
      return;
    }
    this._app.$destroy();
    this._app = undefined; // set symbol to undefined in order to avoid "This component has already been destroyed" message
  }

  onClose(): Promise<void> {
    devLog("View closing");

    this.destroyApp();

    this.plugin.unregisterViewInstance(this);

    return Promise.resolve();
  }

  async monitorNote() {
    let doUpdateDb = false;
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile === null) {
      return;
    }
    if (!this.settings.get("auto_update_on_file_change")) {
      devLog("not monitoring note because feature disabled");
      return;
    }
    if (this.settings.isExcludedFile(activeFile)) {
      devLog("not monitoring because no file / excluded file");
      return;
    }
    if (
      this.noteBeingMonitored &&
      this.app.metadataCache.getCache(this.noteBeingMonitored) === undefined
    ) {
      devLog("note name must have changed");
      doUpdateDb = true;
    }

    devLog("Monitornote called on: " + activeFile.path);
    devLog("Old monitoring note: " + this.noteBeingMonitored);
    if (
      this.noteBeingMonitored &&
      this.app.metadataCache.getCache(this.noteBeingMonitored)
    ) {
      if (activeFile.path !== this.noteBeingMonitored) {
        if (
          JSON.stringify(
            this.db.getValidatedLinksFromNote(this.noteBeingMonitored, "/")
          ) !== JSON.stringify(this.linksOfNoteBeingMonitored)
        ) {
          devLog("links changed!");
          doUpdateDb = true;
        }
      }
    }
    this.noteBeingMonitored = activeFile.path;
    this.linksOfNoteBeingMonitored = this.db.getValidatedLinksFromNote(
      activeFile.path,
      "/"
    );
    if (doUpdateDb) {
      await this.db.update(true);
    }
  }

  getViewType(): string {
    return MOC_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Map of Content";
  }

  getIcon(): string {
    return "stacked-levels";
  }
}
