import "svelte";

import { ItemView, LinkCache, Notice, TFile, WorkspaceLeaf } from "obsidian";

import { focusContentEditorView, devLog } from "./utils";
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
  inInEditorLeaf: boolean = false;

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
        this.inInEditorLeaf =
          this.app.workspace.activeLeaf.view.getViewType() === MOC_VIEW_TYPE;
        if (!this.isPinned && !this.inInEditorLeaf) {
          this.monitorNote();
          this.rerender();
        }
      })
    );
    this.monitorNote();
    this.rerender();
  }

  async onOpen(): Promise<void> {}

  /** reload paths and recreate the svelte instance */
  rerender(): void {
    devLog("Rerender called on view");
    if (this.inInEditorLeaf) {
      // if update MOC button is clicked in editor mode, the moc view will get focus leading to 'no file is open' message
      // this fixes that issue:
      focusContentEditorView(this.app);
    }

    devLog(
      "Leaf viewtype: " + this.app.workspace.activeLeaf?.view?.getViewType()
    );

    this.destroyApp();

    let errors = [];

    if (this.db.isDatabaseUpdating) {
      errors.push("Updating...");
    } else if (!this.db.isDatabaseComplete) {
      errors.push(
        `Your Map of Content couldn't be created.<br><br> Make sure your Central Note path <code>'${this.settings.get(
          "CN_path"
        )}'</code> is correct. You can change this path in the settings tab.`
      );
    } else if (this.app.workspace.getActiveFile() === null) {
      errors.push("No file is open");
    } else if (
      this.settings.isExcludedFile(this.app.workspace.getActiveFile())
    ) {
      errors.push("This file has been excluded from the Map of Content.");
    } else {
      this.openFilePath = this.app.workspace.getActiveFile().path;
      if (this.db.getNoteFromPath(this.openFilePath) === undefined) {
        errors.push("Updating...");
        this.db.update(true);
      }
    }
    let paths = [];
    if (errors.length === 0) {
      let allPaths = this.db.findPaths(this.openFilePath);
      if (allPaths.length === 0) {
        devLog("No paths to this note");
      }

      paths = allPaths.map((p: Path) => p.items.slice());
    } else {
      this.openFilePath = "None";
      paths = [];
    }

    this._app = new View({
      target: (this as any).contentEl,
      props: { view: this, paths: paths, errors: errors },
    });
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
    let rerender = false;
    let activeFile = this.app.workspace.getActiveFile();
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
      rerender = true;
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
          rerender = true;
        }
      }
    }
    this.noteBeingMonitored = activeFile.path;
    this.linksOfNoteBeingMonitored = this.db.getValidatedLinksFromNote(
      activeFile.path,
      "/"
    );
    if (rerender) {
      this.db.update(true);
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
