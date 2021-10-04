
import { App, getLinkpath, LinkCache, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, Vault } from 'obsidian';
import { CENTRAL_NOTE_PATH_DEFAULT, MOC_VIEW_TYPE } from './constants'
import { DBManager } from './db'
import MOCView from './view';
import Settings from './svelte/Settings.svelte';
import { MOCSettings, DEFAULT_SETTINGS } from './settings';
import { Log } from './utils';


export default class MOCPlugin extends Plugin {
	settings: MOCSettings;
	lib: DBManager;
	view: MOCView;
	//statusbartext: HTMLElement
	async onload() {
		this.registerView(MOC_VIEW_TYPE, (leaf) => (this.view = new MOCView(leaf)))

		this.app.workspace.onLayoutReady(() => this.initializePlugin())
	}

	async initializePlugin() {
		await this.loadSettings()
		this.lib = new DBManager(this.app, this)
		this.addSettingTab(new MOCSettingTab(this.app, this, this.lib));

		this.initLeaf()
		this.view.init(this, this.lib)

		this.addRibbonIcon('sync', 'Rebuild Map of Content', async () => {
			this.lib.update()
		});

		this.addCommand({
			id: 'rebuild-map-of-content',
			name: 'Rebuild Map of Content',
			callback: () => {
				this.lib.update()

			}
		});

		// Todo:  maybe implement some status bar text? like no of linked, unlinked, last time refreshed? 
		//this.statusbartext = this.addStatusBarItem()
		//this.statusbartext.setText("Total number of notes: " + String(l.count()));

	}

	initLeaf(): void {
		if (this.app.workspace.getLeavesOfType(MOC_VIEW_TYPE).length) {
			Log("View already attached", true)
			return
		}

		this.app.workspace.getRightLeaf(true).setViewState({
			type: MOC_VIEW_TYPE
		})
	}
	rerender() {
		this.view.rerender()
	}

	onunload(): void {
		Log('Unloading plugin');
		this.view.onClose()
		this.app.workspace.getLeavesOfType(MOC_VIEW_TYPE).forEach((leaf) => leaf.detach());

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
		this.view.rerender()
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
		return !(this.app.vault.getAbstractFileByPath(this.getCNPath()) == null)
	}


}

class MOCSettingTab extends PluginSettingTab {
	plugin: MOCPlugin;
	_app: Settings;
	lib: DBManager

	constructor(app: App, plugin: MOCPlugin, lib: DBManager) {
		super(app, plugin);
		this.plugin = plugin;
		this.lib = lib
		this._app = new Settings({
			target: (this as any).containerEl,
			props: { app: this.app, lib: this.lib, plugin: this.plugin },
		})
	}

	display(): void {
		this._app.$destroy()
		this._app = new Settings({
			target: (this as any).containerEl,
			props: { app: this.app, lib: this.lib, plugin: this.plugin },
		})
	}

}

