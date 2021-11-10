import type { App } from 'obsidian'

import type MOCPlugin from "./main"
import { Log } from './utils'
import { getLinkpath, LinkCache, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, Vault } from 'obsidian';
import { CENTRAL_NOTE_PATH_DEFAULT, MOC_VIEW_TYPE, ViewCallback } from './constants'
import type { DBManager } from './db'
import MOCView from './view';
import Settings from './svelte/Settings.svelte';

export interface MOCSettings {
	CN_path: string // path of the note that serves as Central Note
	exluded_folders: string[],
	exluded_filename_components: string[],
	settings_version: string,
	plugin_version: string,
	showed_update_notice_for_version:string,
	auto_update_on_file_change:boolean

}

export const DEFAULT_SETTINGS: MOCSettings = {
	CN_path: "Central Note.md",
	exluded_folders: [],
	exluded_filename_components: [],
	settings_version: "0.1.12",
	plugin_version: "0.1.12",
	showed_update_notice_for_version:"None",
	auto_update_on_file_change:true
}

/** take a legacy settings object and transform it till it conforms to the current version */
export function UpgradeSettings(object: any, app: App) {
	try {
		// abort if settings are already in current version format
		if (object["settings_version"] === DEFAULT_SETTINGS["settings_version"]) {
			Log("Settings already in current version", true)
			return object
		}

		// clone the object
		object = JSON.parse(JSON.stringify(object))

		let object_keys = Object.keys(object)
		Log("old settings object: " + String(object_keys), true)
		let old_version = undefined

		// determine which version the legacy object is from
		if (!object_keys.contains("settings_version")) {
			old_version = "pre-0.1.10"
		}
		else {
			old_version = object["settings_version"]
		}

		console.log("old settings version: " + old_version)

		if (old_version === "pre-0.1.10") {
			// extract the CN path from CN_path_per_vault and save it as CN_path
			Log("Converting CN path from pre-0.1.10 to 0.1.10", true)

			// get just the name of all vaults there's a CN stored for
			let cn_settings_vault_names = object["CN_path_per_vault"].map((val: [string, string]) => val[0])
			if (cn_settings_vault_names.contains(app.vault.getName())) {
				object["CN_path"] = object["CN_path_per_vault"][cn_settings_vault_names.indexOf(app.vault.getName())][1]
			} else {
				// delete the CN_path entry. it will then be filled with default_settings data later
				delete object["CN_path"]
			}

			// delete the legacy CN_path_per_vault entry
			delete object["CN_path_per_vault"]

			//set new settings_version
			object["settings_version"] = "0.1.10"

		}
		
		if (old_version === "0.1.10") {
			Log("upgrading settings to 0.1.12")

			// add plugin_version key
			object["plugin_version"] = "0.1.12"

			//set new settings_version
			object["settings_version"] = "0.1.12"

		}
		return UpgradeSettings(object,app)
	} catch {
		// it things don't work out, delete all old settings data (better than breaking the plugin)
		return {}
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

	/* initial trials in porting the settings to the native Obsidian presets:
	displayv(): void {
		let { containerEl } = this

		this.containerEl.empty()

		this.containerEl.createEl("h3", {
			text: "General Settings",
		})

		new Setting(containerEl)
			.setName("sdf")
			.setDesc("sdfs")
			.addDropdown((dropdown) => {
				let all_files = this.plugin.app.vault.getFiles().map((file: TFile) => file.path);
				all_files.forEach((file) => {
					dropdown.addOption(file, file)


				})
			})


		new Setting(containerEl)
			.setName("sdf")
			.setDesc("swdfs")
			.addSearch((search) => {
				search.registerOptionListener({ "sfs": ((sd) => "asdf"), "asdfas": ((sd) => { return "sdfas" }) }, "asd")
				search.onChanged
				search.setPlaceholder("adfasdf")
				search.onChange((value) => {
					console.log(value)
				})
			})
			.addTextArea((df) => {

			})


	}*/

}

