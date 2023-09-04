import "svelte";

import { ItemView, LinkCache, Notice, TFile, WorkspaceLeaf } from "obsidian";

import { focus_content_editor_view, Log } from "./utils";
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
  open_file_path: string;
  max_indent: number = 5;
  is_pinned = false;
  monitoring_note: string;
  monitoring_note_links: string[];
  is_in_editor_leaf: boolean = false;

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
        this.is_in_editor_leaf =
          this.app.workspace.activeLeaf.view.getViewType() === MOC_VIEW_TYPE;
        if (!this.is_pinned && !this.is_in_editor_leaf) {
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
    Log("Rerender called on view");
    if (this.is_in_editor_leaf) {
      // if update MOC button is clicked in editor mode, the moc view will get focus leading to 'no file is open' message
      // this fixes that issue:
      focus_content_editor_view(this.app);
    }

    Log("Leaf viewtype: " + this.app.workspace.activeLeaf?.view?.getViewType());

    this.destroyApp();

    let errors = [];

    if (this.db.database_updating) {
      errors.push("Updating...");
    } else if (!this.db.database_complete) {
      errors.push(
        `Your Map of Content couldn't be created.<br><br> Make sure your Central Note path <code>'${this.settings.get(
          "CN_path"
        )}'</code> is correct. You can change this path in the settings tab.`
      );
    } else if (this.app.workspace.getActiveFile() === null) {
      errors.push("No file is open");
    } else if (
      this.settings.isExludedFile(this.app.workspace.getActiveFile())
    ) {
      errors.push("This file has been excluded from the Map of Content.");
    } else {
      this.open_file_path = this.app.workspace.getActiveFile().path;
      if (this.db.getNoteFromPath(this.open_file_path) === undefined) {
        errors.push("Updating...");
        this.db.update(true);
      }
    }
    let paths = [];
    if (errors.length === 0) {
      let all_paths = this.db.findPaths(this.open_file_path);
      if (all_paths.length === 0) {
        Log("No paths to this note");
      }

      paths = all_paths.map((p: Path) => p.items.slice());
    } else {
      this.open_file_path = "None";
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
    Log("View closing");

    this.destroyApp();

    this.plugin.unregisterViewInstance(this);

    return Promise.resolve();
  }

  async monitorNote() {
    let rerender = false;
    let active_file = this.app.workspace.getActiveFile();
    if (active_file === null) {
      return;
    }
    if (!this.settings.get("auto_update_on_file_change")) {
      Log("not monitoring note because feature disabled");
      return;
    }
    if (this.settings.isExludedFile(active_file)) {
      Log("not monitoring because no file / excluded file");
      return;
    }
    if (
      this.monitoring_note &&
      this.app.metadataCache.getCache(this.monitoring_note) === undefined
    ) {
      Log("note name must have changed");
      rerender = true;
    }
    let path = active_file.path;

    Log("Monitornote called on: " + path);
    Log("Old monitoring note: " + this.monitoring_note);
    if (
      this.monitoring_note &&
      this.app.metadataCache.getCache(this.monitoring_note)
    ) {
      if (!(path === this.monitoring_note)) {
        let now_links = this.db.getValidatedLinksFromNote(
          this.monitoring_note,
          "/"
        );
        if (
          !(
            JSON.stringify(now_links) ==
            JSON.stringify(this.monitoring_note_links)
          )
        ) {
          Log("links changed!");
          rerender = true;
        }
      }
    }
    this.monitoring_note = path;
    this.monitoring_note_links = this.db.getValidatedLinksFromNote(path, "/");
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
