
import { App, getLinkpath, LinkCache, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, Vault } from 'obsidian';
import { TLI_NOTE_PATH_DEFAULT, TLI_VIEW_TYPE } from './constants' 
import { DBManager } from './db'
import TLIView from './view';
import Settings from './svelte/Settings.svelte';
import { TLISettings, DEFAULT_SETTINGS } from './settings';
import { Log } from './utils';    
 

export default class TLIPlugin extends Plugin {
	settings: TLISettings;
	lib: DBManager;
	view: TLIView;
	//statusbartext: HTMLElement
	async onload() {
		this.registerView(TLI_VIEW_TYPE, (leaf) => (this.view = new TLIView(leaf))) 
		
		this.app.workspace.onLayoutReady(() => this.initializePlugin()) 
	}

	async initializePlugin() {
		await this.loadSettings()
		this.lib = new DBManager(this.app, this)
		this.addSettingTab(new TLISettingTab(this.app, this, this.lib));
		
		this.initLeaf()
		this.view.init( this, this.lib)

		this.addRibbonIcon('sync', 'Rebuild Map of Content', async () => {
			this.lib.update()
		});

		this.addCommand({
			id: 'rebuild-map-of-content',
			name: 'Rebuild Map of Content',
			 callback: () => {this.lib.update()
			 
			}
		});

		// Todo:  maybe implement some status bar text? like no of linked, unlinked, last time refreshed? 
		//this.statusbartext = this.addStatusBarItem()
		//this.statusbartext.setText("Total number of notes: " + String(l.count()));

	}

	initLeaf(): void {
		if (this.app.workspace.getLeavesOfType(TLI_VIEW_TYPE).length) {
			Log("already leaves attached",true)
			return
		}

		this.app.workspace.getRightLeaf(true).setViewState({
			type: TLI_VIEW_TYPE
		})
	}
	rerender() {
		this.view.rerender()
	}

	onunload(): void {
		Log('Unloading plugin');
		this.view.onClose()
		this.app.workspace.getLeavesOfType(TLI_VIEW_TYPE).forEach((leaf) => leaf.detach());

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		Log("Central note path per vault" + this.settings.TLI_path_per_vault, true)
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async updateSettings(updates: Partial<TLISettings>) {
		Object.assign(this.settings, updates)
		await this.saveData(this.settings)
		this.view.rerender()
	}

	getSettingValue<K extends keyof TLISettings>(setting: K): TLISettings[K] {
		return this.settings[setting]
	}

	getTliPath() {
	 

		let tli_settings_vault_names = this.settings.TLI_path_per_vault.map((val: [string, string]) => val[0])

		if (tli_settings_vault_names.contains(this.app.vault.getName())) {

			return this.settings.TLI_path_per_vault[tli_settings_vault_names.indexOf(this.app.vault.getName())][1]

		}

		return TLI_NOTE_PATH_DEFAULT
	}

	setTliPath(path: string) {

		let tli_settings_vault_names = this.settings.TLI_path_per_vault.map((val: [string, string]) => val[0])
		let new_settings = this.settings.TLI_path_per_vault.slice()

		if (tli_settings_vault_names.contains(this.app.vault.getName())) {
			new_settings.splice(tli_settings_vault_names.indexOf(this.app.vault.getName()), 1)

		}
		new_settings.push([this.app.vault.getName(), path])
		this.settings.TLI_path_per_vault = new_settings
		this.saveSettings()
	}
	/**check whether the central note exists */
	TLIexists():boolean{
		return !(this.app.vault.getAbstractFileByPath(this.getTliPath())==null) 
	}

	
}

class TLISettingTab extends PluginSettingTab {
	plugin: TLIPlugin;
	_app: Settings;
	lib: DBManager

	constructor(app: App, plugin: TLIPlugin, lib: DBManager) {
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

