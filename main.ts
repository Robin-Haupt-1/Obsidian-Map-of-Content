
import { App, getLinkpath, LinkCache, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, Vault } from 'obsidian';
import { TLI_NOTE_PATH_DEFAULT, TLI_VIEW_TYPE } from './constants'
import type { LibEntry, LibEntry2, note, } from './types';
import { LibKeeper } from './libkeeper';
import TLIView from './view';
import Settings from './Settings.svelte';
import { TLISettings, DEFAULT_SETTINGS } from './settings';
import { log } from './utils';
import { Console } from 'console';


export default class TLIPlugin extends Plugin {
	settings: TLISettings;
	lib: LibKeeper;
	view: TLIView;
	//statusbartext: HTMLElement
	async onload() {
		this.registerView(TLI_VIEW_TYPE, (leaf) => (this.view = new TLIView(leaf)))
		if (this.app.workspace.layoutReady) this.initializePlugin()
		else this.registerEvent(this.app.workspace.on("layout-ready", () => this.initializePlugin()))


	}

	async initializePlugin() {
		await this.loadSettings()
		this.lib = new LibKeeper(this.app, this)
		this.addSettingTab(new TLISettingTab(this.app, this, this.lib));
		
		this.initLeaf()
		this.view._init( this, this.lib)

		this.addRibbonIcon('sync', 'Update paths', async () => {
			this.lib.updateEverything()

		});

		// Todo:  maybe implement some status bar text? like no of linked, unlinked, last time refreshed? 
		//this.statusbartext = this.addStatusBarItem()
		//this.statusbartext.setText("Total number of notes: " + String(l.count()));

	}
	initLeaf(): void {
		
		
		if (this.app.workspace.getLeavesOfType(TLI_VIEW_TYPE).length) {
			log("already leaves attached",true)
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
		log('Unloading plugin');
		this.view.onClose()
		this.app.workspace.getLeavesOfType(TLI_VIEW_TYPE).forEach((leaf) => leaf.detach());

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		log("TLI path per vault" + this.settings.TLI_path_per_vault, true)
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
}

class TLISettingTab extends PluginSettingTab {
	plugin: TLIPlugin;
	_app: Settings;
	lib: LibKeeper

	constructor(app: App, plugin: TLIPlugin, lib: LibKeeper) {
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

