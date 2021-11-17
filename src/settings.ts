import type { App, TFile } from 'obsidian'

import type MOCPlugin from "./main"
import { Log } from './utils'
import { PluginSettingTab } from 'obsidian';
import type { DBManager } from './db'
import Settings from './svelte/Settings.svelte';

export interface MOCSettings {
	CN_path: string, exluded_folders: string[], exluded_filename_components: string[], settings_version: string, plugin_version: string, do_show_update_notice: boolean, auto_update_on_file_change: boolean
}

export const DEFAULT_SETTINGS: MOCSettings = {
	CN_path: "Central Note.md",
	exluded_folders: [],
	exluded_filename_components: [],
	settings_version: "0.1.12",
	plugin_version: "0.1.12",
	do_show_update_notice: false,
	auto_update_on_file_change: true
}

export class SettingsManager {
	settings: MOCSettings;
	plugin: MOCPlugin;
	constructor(plugin: any) {
		this.plugin = plugin;
	}
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, this.UpgradeSettingsVersion(await this.plugin.loadData()));
		this.saveSettings()
	}

	async saveSettings() {
		await this.plugin.saveData(this.settings);
	}

	async set(updates: Partial<MOCSettings>) {
		Object.assign(this.settings, updates)
		await this.plugin.saveData(this.settings)
	}

	get<K extends keyof MOCSettings>(setting: K): MOCSettings[K] {
		return this.settings[setting]
	}

	UpgradeSettingsVersion(object: any) {
		try {
			// if fresh install, go with defaults
			if (object == undefined) {
				Log("fresh install, returning empty settings object")
				return {}
			}

			// abort if settings are already in current version format
			if (object["settings_version"] === DEFAULT_SETTINGS["settings_version"]) {
				Log("Settings already in current version")
				return object
			}

			// clone the object
			object = JSON.parse(JSON.stringify(object))

			let object_keys = Object.keys(object)
			Log("old settings object: " + String(object_keys))
			let old_version = undefined

			// determine which version the legacy object is from
			if (!object_keys.contains("settings_version")) {
				old_version = "pre-0.1.10"
			}
			else {
				old_version = object["settings_version"]
			}

			Log("old settings version: " + old_version)

			if (old_version === "pre-0.1.10") {
				// extract the CN path from CN_path_per_vault and save it as CN_path
				Log("Converting CN path from pre-0.1.10 to 0.1.10")

				let cn_settings_vault_names = object["CN_path_per_vault"].map((val: [string, string]) => val[0]) // get just the name of all vaults there's a CN stored for
				if (cn_settings_vault_names.contains(this.plugin.app.vault.getName())) {
					object["CN_path"] = object["CN_path_per_vault"][cn_settings_vault_names.indexOf(this.plugin.app.vault.getName())][1]
				} else {
					delete object["CN_path"]
				}

				delete object["CN_path_per_vault"]

				object["settings_version"] = "0.1.10"

			}			// clone the object


			if (old_version === "0.1.10") {
				Log("upgrading settings to 0.1.12")
				object["plugin_version"] = "0.1.12"
				object["settings_version"] = "0.1.12"

			}
			return this.UpgradeSettingsVersion(object)
		} catch {
			// it things don't work out, delete all old settings data (better than breaking the plugin)
			Log("error while transforming settings object")
			return {}
		}
	}

	isExludedFile(file: TFile) {
		let path_to_file = file.path
		let in_excluded_folder = this.get("exluded_folders").some((path: string) => path_to_file.startsWith(path))
		if (in_excluded_folder) { return true }
		let filename = file.basename + "." + file.extension
		let has_excluded_filename = this.get("exluded_filename_components").some((phrase: string) => filename.contains(phrase))
		return has_excluded_filename
	}



}


export class MOCSettingTab extends PluginSettingTab {
	plugin: MOCPlugin;
	_app: Settings;
	db: DBManager

	constructor(plugin: MOCPlugin) {
		super(plugin.app, plugin);
		this.plugin = plugin;
		this.db = plugin.db
		this._app = undefined
	}

	display(): void {
		if (this._app) {
			this._app.$destroy()
			this._app = undefined

		}
		this._app = new Settings({
			target: (this as any).containerEl,
			props: { app: this.app, plugin: this.plugin },
		})
	}

	hide(): void {
		this.plugin.db.update()
	}

}
