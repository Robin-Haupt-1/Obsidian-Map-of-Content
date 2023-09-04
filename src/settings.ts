import type { App, TFile } from "obsidian";

import type MOCPlugin from "./main";
import { Log } from "./utils";
import { PluginSettingTab } from "obsidian";
import type { DBManager } from "./db";
import Settings from "./svelte/Settings.svelte";

export interface MOCSettings {
  CN_path: string;
  exluded_folders: string[];
  exluded_filename_components: string[];
  settings_version: string;
  plugin_version: string;
  do_show_update_notice: boolean;
  auto_update_on_file_change: boolean;
  do_remember_expanded: boolean;
  MOC_path_starts_at_CN: boolean;
  file_descendants_expanded: {};
}

export const DEFAULT_SETTINGS: MOCSettings = {
  CN_path: "Central Note.md",
  exluded_folders: [],
  exluded_filename_components: [],
  settings_version: "0.1.16",
  plugin_version: "1.1.0",
  do_show_update_notice: false,
  auto_update_on_file_change: true,
  do_remember_expanded: false,
  MOC_path_starts_at_CN: false,
  file_descendants_expanded: {},
};

export class SettingsManager {
  settings: MOCSettings;
  plugin: MOCPlugin;
  constructor(plugin: any) {
    this.plugin = plugin;
  }

  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      this.UpgradeSettingsVersion(await this.plugin.loadData())
    );
    this.saveSettings();
  }

  async saveSettings() {
    await this.plugin.saveData(this.settings);
  }

  async set(updates: Partial<MOCSettings>) {
    Object.assign(this.settings, updates);
    await this.plugin.saveData(this.settings);
  }

  get<K extends keyof MOCSettings>(setting: K): MOCSettings[K] {
    return this.settings[setting];
  }

  UpgradeSettingsVersion(object: any) {
    // TODO remove deleted/renamed files from the is_expanded object. But this is only possible once the vault is done being indexed by Obsidian
    try {
      // if fresh install, go with defaults
      if (object === undefined) {
        Log("fresh install, returning empty settings object");
        return {};
      }
      object["plugin_version"] = DEFAULT_SETTINGS["plugin_version"];

      // abort if settings are already in current version format
      if (object["settings_version"] === DEFAULT_SETTINGS["settings_version"]) {
        Log("Settings already in current version");
        return object;
      }

      // clone the object
      object = JSON.parse(JSON.stringify(object));

      let object_keys = Object.keys(object);
      Log("old settings object: " + String(object_keys));
      let old_version = undefined;

      // determine which version the legacy object is from
      if (!object_keys.contains("settings_version")) {
        old_version = "pre-0.1.10";
      } else {
        old_version = object["settings_version"];
      }

      Log("old settings version: " + old_version);

      if (old_version === "pre-0.1.10") {
        // extract the CN path from CN_path_per_vault and save it as CN_path
        Log("Converting CN path from pre-0.1.10 to 0.1.10");

        let cn_settings_vault_names = object["CN_path_per_vault"].map(
          (val: [string, string]) => val[0]
        ); // get just the name of all vaults there's a CN stored for
        if (cn_settings_vault_names.contains(this.plugin.app.vault.getName())) {
          object["CN_path"] =
            object["CN_path_per_vault"][
              cn_settings_vault_names.indexOf(this.plugin.app.vault.getName())
            ][1];
        } else {
          delete object["CN_path"];
        }

        delete object["CN_path_per_vault"];

        object["settings_version"] = "0.1.10";
      } // clone the object

      let generic_update_versions = ["0.1.10", "0.1.12", "0.1.14"];

      if (generic_update_versions.contains(old_version)) {
        Log(
          "performing generic update of settings to " +
            DEFAULT_SETTINGS["settings_version"]
        );
        object["settings_version"] = DEFAULT_SETTINGS["settings_version"];
        object["do_show_update_notice"] = true;
      }

      let silent_generic_update_versions = [
        "0.1.15",
        "0.1.16",
        "0.1.17",
        "0.1.18",
        "1.0.0",
      ];

      if (silent_generic_update_versions.contains(old_version)) {
        Log(
          "performing silent generic update of settings to " +
            DEFAULT_SETTINGS["settings_version"]
        );

        object["settings_version"] = DEFAULT_SETTINGS["settings_version"];
        object["do_show_update_notice"] = false;
      }
      return this.UpgradeSettingsVersion(object);
    } catch {
      // it things don't work out, delete all old settings data (better than breaking the plugin)
      Log("error while transforming settings object");
      return {};
    }
  }

  isExludedFile(file: TFile) {
    let path_to_file = file.path;
    let in_excluded_folder = this.get("exluded_folders").some((path: string) =>
      path_to_file.startsWith(path)
    );
    if (in_excluded_folder) {
      return true;
    }
    let filename = file.basename + "." + file.extension;
    let has_excluded_filename = this.get("exluded_filename_components").some(
      (phrase: string) => filename.contains(phrase)
    );
    return has_excluded_filename;
  }

  isExpanded(path: string) {
    if (!this.get("do_remember_expanded")) return true;
    let current_settings = this.get("file_descendants_expanded");
    if (Object.keys(current_settings).contains(path)) {
      return current_settings[path];
    }
    let new_settings = Object.assign(current_settings, { path: true });
    this.set({ file_descendants_expanded: new_settings });
    return true;
  }

  setExpanded(path: string, expanded: boolean) {
    if (!this.get("do_remember_expanded")) return;

    let new_val = {};
    new_val[path] = expanded;

    let new_settings = Object.assign(
      {},
      this.get("file_descendants_expanded"),
      new_val
    );
    this.set({ file_descendants_expanded: new_settings });
    return true;
  }
}

export class MOCSettingTab extends PluginSettingTab {
  plugin: MOCPlugin;
  _app: Settings;
  db: DBManager;

  constructor(plugin: MOCPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
    this.db = plugin.db;
    this._app = undefined;
  }

  display(): void {
    if (this._app) {
      this._app.$destroy();
      this._app = undefined;
    }
    this._app = new Settings({
      target: (this as any).containerEl,
      props: { app: this.app, plugin: this.plugin },
    });
  }

  hide(): void {
    this.plugin.db.update();
  }
}
