import { App, getLinkpath, LinkCache, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, Vault } from 'obsidian';
import { CENTRAL_NOTE_PATH_DEFAULT, MOC_VIEW_TYPE, ViewCallback } from './constants'
import { DBManager } from './db'
import MOCView from './view';
import Settings from './svelte/Settings.svelte';
import { MOCSettings, DEFAULT_SETTINGS, UpgradeSettings,MOCSettingTab} from './settings';
import { Log } from './utils';

export default class MOCPlugin extends Plugin {
	settings: MOCSettings;
	db: DBManager;
	view: MOCView;
	// statusbartext: HTMLElement	

	async onload() {
		await this.loadSettings()

		this.db = new DBManager(this)

		this.registerView(MOC_VIEW_TYPE, (leaf) => (this.view = new MOCView(leaf, this)))

		this.app.workspace.onLayoutReady(() => this.initializePlugin())
	}

	async initializePlugin() {
		this.addSettingTab(new MOCSettingTab(this));
		this.initLeaf()
		this.db.update()

		this.addRibbonIcon('sync', 'Update Map of Content', async () => {
			await this.db.update()
		});

		this.addCommand({
			id: 'rebuild-map-of-content',
			name: 'Update Map of Content',
			callback: () => {
				this.db.update()

			}
		});

		this.addCommand({
			id: 'open-note-as-central-note',
			name: 'Set open note as Central Note',
			callback: () => {
				let errors = []
				// make sure a file is opened
				if (this.app.workspace.getActiveFile() == null) {
					errors.push("No file has been opened")
				}
				else if (this.isExludedFile(this.app.workspace.getActiveFile())) {
					errors.push("This file has been excluded from the Map of Content.")
				}
				if (errors.length) {
					new Notice(errors[0])
					return
				}
				// get path of open note 
				this.updateSettings({ CN_path: this.app.workspace.getActiveFile().path });
				this.db.update()

			}
		});
		//Todo:  maybe implement some status bar text? like no of linked, unlinked, last time refreshed? 
		//this.statusbartext = this.addStatusBarItem()
		//this.statusbartext.setText("Total number of notes: " + String(l.count()));

	}

	initLeaf(): void {
		if (this.app.workspace.getLeavesOfType(MOC_VIEW_TYPE).length) {
			Log("View already attached", true)
		} else {
			this.app.workspace.getRightLeaf(true).setViewState({
				type: MOC_VIEW_TYPE,
				active: true
			})
		}
	}

	rerender() {
		Log("rerender on main plugin called", true)
		if (this.view) {
			this.view.rerender()
		}
	}

	onunload(): void {
		Log('Unloading plugin');

		if (this.view) {
			this.view.onClose()
		}
		this.app.workspace.detachLeavesOfType(MOC_VIEW_TYPE)
	}

	async loadSettings() {
		let data = await this.loadData()
		// upgrade settings to newest format if necessary 
		data = UpgradeSettings(data, this.app)
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
		this.saveSettings()
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async updateSettings(updates: Partial<MOCSettings>) {
		Object.assign(this.settings, updates)
		await this.saveData(this.settings)
		this.rerender()
	}

	getSettingValue<K extends keyof MOCSettings>(setting: K): MOCSettings[K] {
		return this.settings[setting]
	}


	/**check whether the central note exists */
	CNexists(): boolean {
		let exists = !(this.app.vault.getAbstractFileByPath(this.getSettingValue("CN_path")) == null)
		Log(exists ? "CN exists" : "CN does not exist", true)
		return exists
	}

	/** get any open views and perform callback function on them */
	oldview(callback: ViewCallback) {
		let leaves = this.app.workspace.getLeavesOfType(MOC_VIEW_TYPE)
		if (leaves.length) {
			Log(`Found ${leaves.length} leaves`, true)
			leaves.forEach((leaf) => {
				let view = leaf.view as MOCView
				callback(view)
			})
		}
		else {
			Log("No view attached", true)
		}
	}
	/**set internal reference to the current view
	 * TODO: Allow keeping several views
	 */
	registerViewInstance(view: MOCView) {
		Log("View registered", true)
		this.view = view
	}
	/** delete reference to view 
	 * TODO: allow keeping several views
	*/
	unregisterViewInstance(view: MOCView) {
		this.view = undefined
	}
	/** check if the file is in any of the exluded folders or the filename contains excluded phrases */
	isExludedFile(file: TFile) {
		let path_to_file = file.path
		let in_excluded_folder = this.getSettingValue("exluded_folders").some((path: string) => path_to_file.startsWith(path))
		if (in_excluded_folder) { return true }
		let filename = file.basename + "." + file.extension
		let has_excluded_filename = this.getSettingValue("exluded_filename_components").some((phrase: string) => filename.contains(phrase))
		return has_excluded_filename
	}
}

