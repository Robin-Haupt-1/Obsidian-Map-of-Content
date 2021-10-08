
import { App, getLinkpath, LinkCache, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, Vault } from 'obsidian';
import { CENTRAL_NOTE_PATH_DEFAULT, MOC_VIEW_TYPE, ViewCallback } from './constants'
import { DBManager } from './db'
import MOCView from './view';
import Settings from './svelte/Settings.svelte';
import { MOCSettings, DEFAULT_SETTINGS } from './settings';
import { Log } from './utils';

export default class MOCPlugin extends Plugin {
	settings: MOCSettings;
	db: DBManager;
	view: MOCView;
	// statusbartext: HTMLElement	

	async onload() {
		await this.loadSettings()

		this.db = new DBManager(this.app, this)

		this.registerView(MOC_VIEW_TYPE, (leaf) => (this.view = new MOCView(leaf, this)))

		this.app.workspace.onLayoutReady(() => this.initializePlugin())
	}

	async initializePlugin() {
		this.addSettingTab(new MOCSettingTab(this.app, this, this.db));

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
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		Log("Central note path per vault" + this.settings.CN_path_per_vault, true)
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

	/**get the path of the central note for the open vault */
	getCNPath() {


		let cn_settings_vault_names = this.settings.CN_path_per_vault.map((val: [string, string]) => val[0])

		if (cn_settings_vault_names.contains(this.app.vault.getName())) {

			return this.settings.CN_path_per_vault[cn_settings_vault_names.indexOf(this.app.vault.getName())][1]

		}

		return CENTRAL_NOTE_PATH_DEFAULT
	}
	/**set the path of the central note for the open vault */
	setCNPath(path: string) {

		let cn_settings_vault_names = this.settings.CN_path_per_vault.map((val: [string, string]) => val[0])
		let new_settings = this.settings.CN_path_per_vault.slice()

		if (cn_settings_vault_names.contains(this.app.vault.getName())) {
			new_settings.splice(cn_settings_vault_names.indexOf(this.app.vault.getName()), 1)

		}
		new_settings.push([this.app.vault.getName(), path])
		this.settings.CN_path_per_vault = new_settings
		this.saveSettings()
	}

	/**check whether the central note exists */
	CNexists(): boolean {
		let exists = !(this.app.vault.getAbstractFileByPath(this.getCNPath()) == null)
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
}

class MOCSettingTab extends PluginSettingTab {
	plugin: MOCPlugin;
	_app: Settings;
	db: DBManager

	constructor(app: App, plugin: MOCPlugin, db: DBManager) {
		super(app, plugin);
		this.plugin = plugin;
		this.db = db
		this._app = new Settings({
			target: (this as any).containerEl,
			props: { app: this.app, db: this.db, plugin: this.plugin },
		})
	}

	display(): void {
		this._app.$destroy()
		this._app = new Settings({
			target: (this as any).containerEl,
			props: { app: this.app, db: this.db, plugin: this.plugin },
		})
	}

}

