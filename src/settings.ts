import type { TFile } from "obsidian";
import { PluginSettingTab } from "obsidian";

import type MOCPlugin from "./main";
import { devLog } from "./utils";
import type { DBManager } from "./db";
import Settings from "./svelte/Settings.svelte";

// TODO refactor this settings object to use camelCase and migrate old versions objects to new version
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
      this.upgradeSettingsVersion(await this.plugin.loadData())
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

  upgradeSettingsVersion(object: any) {
    // TODO remove deleted/renamed files from the is_expanded object. But this is only possible once the vault is done being indexed by Obsidian
    try {
      // if fresh install, go with defaults
      if (object === undefined) {
        devLog("fresh install, returning empty settings object");
        return {};
      }
      object["plugin_version"] = DEFAULT_SETTINGS["plugin_version"];

      // abort if settings are already in current version format
      if (object["settings_version"] === DEFAULT_SETTINGS["settings_version"]) {
        devLog("Settings already in current version");
        return object;
      }

      object = JSON.parse(JSON.stringify(object));

      let objectKeys = Object.keys(object);
      devLog("old settings object: " + String(objectKeys));
      let oldVersion;

      // determine which version the legacy object is from
      if (!objectKeys.contains("settings_version")) {
        oldVersion = "pre-0.1.10";
      } else {
        oldVersion = object["settings_version"];
      }

      devLog("old settings version: " + oldVersion);

      if (oldVersion === "pre-0.1.10") {
        // extract the CN path from CN_path_per_vault and save it as CN_path
        devLog("Converting CN path from pre-0.1.10 to 0.1.10");

        let ncSettingsVaultNames = object["CN_path_per_vault"].map(
          (val: [string, string]) => val[0]
        ); // get just the name of all vaults there's a CN stored for
        if (ncSettingsVaultNames.contains(this.plugin.app.vault.getName())) {
          object["CN_path"] =
            object["CN_path_per_vault"][
              ncSettingsVaultNames.indexOf(this.plugin.app.vault.getName())
            ][1];
        } else {
          delete object["CN_path"];
        }

        delete object["CN_path_per_vault"];

        object["settings_version"] = "0.1.10";
      } // clone the object

      let genericUpdateVersions = ["0.1.10", "0.1.12", "0.1.14"];

      if (genericUpdateVersions.contains(oldVersion)) {
        devLog(
          "performing generic update of settings to " +
            DEFAULT_SETTINGS["settings_version"]
        );
        object["settings_version"] = DEFAULT_SETTINGS["settings_version"];
        object["do_show_update_notice"] = true;
      }

      let silentGenericUpdateVersions = [
        "0.1.15",
        "0.1.16",
        "0.1.17",
        "0.1.18",
        "1.0.0",
      ];

      if (silentGenericUpdateVersions.contains(oldVersion)) {
        devLog(
          "performing silent generic update of settings to " +
            DEFAULT_SETTINGS["settings_version"]
        );

        object["settings_version"] = DEFAULT_SETTINGS["settings_version"];
        object["do_show_update_notice"] = false;
      }
      return this.upgradeSettingsVersion(object);
    } catch {
      // if things don't work out, delete all old settings data (better than breaking the plugin)
      devLog("error while transforming settings object");
      return {};
    }
  }

  isExcludedFile(file: TFile) {
    let pathToFile = file.path;
    let isInExcludedFolder = this.get("exluded_folders").some((path: string) =>
      pathToFile.startsWith(path)
    );
    if (isInExcludedFolder) {
      return true;
    }
    let filename = file.basename + "." + file.extension;
    return this.get("exluded_filename_components").some((phrase: string) =>
      filename.contains(phrase)
    );
  }

  isExpanded(path: string) {
    if (!this.get("do_remember_expanded")) return true;
    let currentSettings = this.get("file_descendants_expanded");
    if (Object.keys(currentSettings).contains(path)) {
      return currentSettings[path];
    }
    let newSettings = Object.assign(currentSettings, { path: true });
    this.set({ file_descendants_expanded: newSettings });
    return true;
  }

  setExpanded(path: string, expanded: boolean) {
    if (!this.get("do_remember_expanded")) return;

    let newVal = {};
    newVal[path] = expanded;

    let newSettings = Object.assign(
      {},
      this.get("file_descendants_expanded"),
      newVal
    );
    this.set({ file_descendants_expanded: newSettings });
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
