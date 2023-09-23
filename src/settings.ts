import type { TFile } from "obsidian";
import { PluginSettingTab } from "obsidian";

import type MOCPlugin from "./main";
import { devLog } from "./utils";
import type { DBManager } from "./db";
import Settings from "./svelte/Settings.svelte";

// TODO refactor this settings object to use camelCase and migrate old versions objects to new version
export interface MOCSettings {
  CN_path: string;
  exluded_folders: string[]; // TODO rename to excludedFolders
  exluded_filename_components: string[];
  settings_version: string;
  plugin_version: string;
  do_show_update_notice: boolean;
  auto_update_on_file_change: boolean;
  do_remember_expanded: boolean;
  MOC_path_starts_at_CN: boolean;
  file_descendants_expanded: {};
  do_show_paths_to_note: boolean;
}

export const DEFAULT_SETTINGS: MOCSettings = {
  CN_path: "Central Note.md",
  exluded_folders: [],
  exluded_filename_components: [],
  settings_version: "1.3.0",
  plugin_version: "1.3.0",
  do_show_update_notice: false,
  auto_update_on_file_change: true,
  do_remember_expanded: false,
  MOC_path_starts_at_CN: false,
  file_descendants_expanded: {},
  do_show_paths_to_note: true,
};

export class SettingsManager {
  settings: MOCSettings;
  plugin: MOCPlugin;
  genericUpdateVersions = ["0.1.10", "0.1.12", "0.1.14", "1.2.0"];
  silentGenericUpdateVersions = [
    "0.1.15",
    "0.1.16",
    "0.1.17",
    "0.1.18",
    "1.0.0",
    "1.1.0",
  ];

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
        return { ...DEFAULT_SETTINGS, ...object };
      }

      object = JSON.parse(JSON.stringify(object));

      devLog(`old settings object: ${Object.keys(object)}`);
      let oldVersion;

      // determine which version the legacy object is from
      if (!Object.keys(object).contains("settings_version")) {
        oldVersion = "pre-0.1.10";
      } else {
        oldVersion = object["settings_version"];
      }

      devLog("old settings version: " + oldVersion);

      if (oldVersion === "pre-0.1.10") {
        // extract the CN path from CN_path_per_vault and save it as CN_path
        devLog("Converting CN path from pre-0.1.10 to 0.1.10");

        const vaultsWithCnPath = object["CN_path_per_vault"].map(
          (val: [string, string]) => val[0]
        );
        if (vaultsWithCnPath.contains(this.plugin.app.vault.getName())) {
          object["CN_path"] =
            object["CN_path_per_vault"][
              vaultsWithCnPath.indexOf(this.plugin.app.vault.getName())
            ][1];
        } else {
          delete object["CN_path"];
        }

        delete object["CN_path_per_vault"];

        object["settings_version"] = "0.1.10";
      } // clone the object

      if (this.genericUpdateVersions.contains(oldVersion)) {
        devLog(
          "performing generic update of settings to " +
            DEFAULT_SETTINGS["settings_version"]
        );
        object["settings_version"] = DEFAULT_SETTINGS["settings_version"];
        object["do_show_update_notice"] = true;
      }

      if (this.silentGenericUpdateVersions.contains(oldVersion)) {
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
    if (
      this.get("exluded_folders").some((path: string) =>
        file.path.startsWith(path)
      )
    ) {
      return true;
    }

    return this.get("exluded_filename_components").some((phrase: string) =>
      (file.basename + "." + file.extension).contains(phrase)
    );
  }

  isExpanded(path: string) {
    if (!this.get("do_remember_expanded")) {
      return true;
    }
    if (Object.keys(this.get("file_descendants_expanded")).contains(path)) {
      return this.get("file_descendants_expanded")[path];
    }
    this.set({
      file_descendants_expanded: {
        ...this.get("file_descendants_expanded"),
        [path]: true,
      },
    });
    return true;
  }

  setExpanded(path: string, newIsExpanded: boolean) {
    if (!this.get("do_remember_expanded")) {
      return;
    }

    this.set({
      file_descendants_expanded: {
        ...this.get("file_descendants_expanded"),
        [path]: newIsExpanded,
      },
    });
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
