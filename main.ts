
import { App, getLinkpath, LinkCache, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, Vault } from 'obsidian';
import { TLI_NOTE_PATH_DEFAULT, TLI_VIEW_TYPE } from './constants'
import type { LibEntry, LibEntry2, note, } from './types';
import { LibKeeper } from './libkeeper';
import TLIView from './view';
import Settings from './Settings.svelte';
import { TLISettings,DEFAULT_SETTINGS } from './settings';


const t2 = (file: TFile, app: App): LibEntry2 => {
	let return_lib: LibEntry
	return_lib

	let links_to = app.metadataCache.getCache(file.path).links.map((val: LinkCache) => val.link);
	let b: LibEntry2 = { internal_file: file, links_to: links_to }
	return b
}
 

const readVaultFile = async (file: TFile, app: App) => {
	let linkcache = app.metadataCache.getCache(file.path).links.map((val: LinkCache) => val.link);
	linkcache.forEach(async (val: string) => {
		let link_path = getLinkpath(val)
		new Notice("link path: " + link_path + " from " + val)
		let linked_file = app.metadataCache.getFirstLinkpathDest(val, "/")
		new Notice("basename: " + linked_file.basename)

	})


	return linkcache.join(", ")

}
export default class TLIPlugin extends Plugin {
	settings: TLISettings;
	lib: LibKeeper;
	view: TLIView;
	statusbartext: HTMLElement
	async onload() {
		await this.loadSettings() 
		console.log(this.app.vault.getName())
		this.lib = new LibKeeper(this.app,this)
		let l = this.lib
		this.addSettingTab(new TLISettingTab(this.app, this,this.lib));

		this.registerView(TLI_VIEW_TYPE, (leaf) => {
			this.view = new TLIView(leaf, this, this.lib)
			return this.view
		})


		if (this.app.workspace.layoutReady) this.initLeaf()
		else this.registerEvent(this.app.workspace.on("layout-ready", () => this.initLeaf()))





		this.addRibbonIcon('dice', 'Update paths', () => {
			new Notice('Updating paths...');
			l.updateLib()
			l.updatePaths()
			new Notice("Total number of notes: " + String(l.count_notes()))
			new Notice(l.overview())
			// Todo:  maybe implement some status bar text? like no of linked, unlinked, last time refreshed? like kicker ticker
			//this.statusbartext.setText("Total number of notes: " + String(l.count()));
		});

		this.statusbartext = this.addStatusBarItem()
		this.statusbartext.setText("");


		this.addCommand({
			id: 'open-sample-modal',
			name: 'Open Sample Modal',
			// callback: () => {
			// 	console.log('Simple Callback');
			// },
			checkCallback: (checking: boolean) => {
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						new SampleModal(this.app).open();
					}
					return true;
				}
				return false;
			}
		});

		

		this.registerCodeMirror((cm: CodeMirror.Editor) => {
			console.log('codemirror', cm);
		});

		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
		

	}

	initLeaf(): void {
		if (this.app.workspace.getLeavesOfType(TLI_VIEW_TYPE).length) return 
		this.app.workspace.getRightLeaf(true).setViewState({
			type: TLI_VIEW_TYPE,
			active: false,
		})
	}
	rerender(){
		this.view.rerender()
	}

	onunload() {
		console.log('unloading plugin');
		this.app.workspace.detachLeavesOfType(TLI_VIEW_TYPE);

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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

	getTliPath(){ 
		let tli_settings_vault_names=this.settings.TLI_path_per_vault.map((val:[string,string] )=>val[0])
		if (tli_settings_vault_names.contains(this.app.vault.getName())){
			return this.settings.TLI_path_per_vault[tli_settings_vault_names.indexOf(this.app.vault.getName())][1]
		}
		
		return TLI_NOTE_PATH_DEFAULT
	}
	
	setTliPath(path:string){

		let tli_settings_vault_names=this.settings.TLI_path_per_vault.map((val:[string,string] )=>val[0])
		let new_settings=this.settings.TLI_path_per_vault.slice()

		if (tli_settings_vault_names.contains(this.app.vault.getName())){
			new_settings.splice(tli_settings_vault_names.indexOf(this.app.vault.getName()),1)
			 
		}
		new_settings.push([this.app.vault.getName(),path]) 
		this.settings.TLI_path_per_vault=new_settings
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		let { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}

class TLISettingTab extends PluginSettingTab {
	plugin: TLIPlugin;
	_app: Settings;
	lib:LibKeeper

	constructor(app: App, plugin: TLIPlugin, lib:LibKeeper) {
		super(app, plugin);
		this.plugin = plugin;
		this.lib=lib
	}

	display(): void {
		//let { containerEl } = this;
		this._app = new Settings({
			target: (this as any).containerEl,
			props: { app: this.app,lib:this.lib ,plugin:this.plugin},
		})
		/*
				containerEl.empty();
		
				containerEl.createEl('h2', { text: 'Settings for my awesome plugin.' });
		
				new Setting(containerEl)
					.setName('Setting #1')
					.setDesc('It\'s a secret')
					.addText(text => text
						.setPlaceholder('Enter your secret')
						.setValue('')
						.onChange(async (value) => {
							console.log('Secret: ' + value);
							this.plugin.settings.mySetting = value;
							await this.plugin.saveSettings();
						}));*/
	}
}
