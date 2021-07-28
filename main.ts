import { strict } from 'assert';
import { readFile } from 'fs';
import { App, getLinkpath, LinkCache, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, Vault } from 'obsidian';
import { TLI_NAME, TLI_VIEW_TYPE } from './constants'
import { LibEntry, LibEntry2, note,  } from 'types';
import { LibKeeper } from 'libkeeper';
import TLIView from 'view';


const t2 = (file: TFile, app: App): LibEntry2 => {
	let return_lib: LibEntry
	return_lib

	let links_to = app.metadataCache.getCache(file.path).links.map((val: LinkCache) => val.link);
	let b: LibEntry2 = { internal_file: file, links_to: links_to }
	return b
}


/*
const t = (file: TFile, app: App): LibEntry => {
	let return_lib: LibEntry
	return_lib

	let links_to = app.metadataCache.getCache(file.path).links.map((val: LinkCache) => val.link);
	let b: LibEntry = { internal_file: file, links_to: links_to, is_linked_to_TLI: false, distance_from_TLI: null, linked_from: null }
	return b
}*/


const log = (text: any) => {
	text = String(text)
	console.log(text)
	new Notice(text)
}

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

const readVaultFile = async (file: TFile, app: App) => {
	//let file_cont: string = await app.vault.read(file)
	let linkcache = app.metadataCache.getCache(file.path).links.map((val: LinkCache) => val.link);
	linkcache.forEach(async (val: string) => {
		let link_path = getLinkpath(val)
		new Notice("link path: " + link_path + " from " + val)
		let linked_file = app.metadataCache.getFirstLinkpathDest(val, "/")
		new Notice("basename: " + linked_file.basename)
		//let file_cont: string = await app.vault.read(linked_file)
		//new Notice(linked_file.basename+": "+file_cont)
		//new Notice(val)
	})

	
	return linkcache.join(", ")

}
export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	lib:LibKeeper;
	view:TLIView;
	async onload() {
		//console.log('loading plugin');
		
		this.lib=new LibKeeper(this.app)
		let l=this.lib
		
		await this.loadSettings();
		this.registerView(TLI_VIEW_TYPE, (leaf) => {
			this.view = new TLIView(leaf, this,this.lib)
			return this.view
		  })
		if (this.app.workspace.layoutReady) this.initLeaf()
		else this.registerEvent(this.app.workspace.on("layout-ready", () => this.initLeaf()))
		

		
		
		this.addRibbonIcon('dice', 'Sample Plugin', () => {
			new Notice('Updating lib')
			//l.updateLib()
			this.app.workspace.openLinkText("Top Level Index.md","Top Level Index.md")

		});

		this.addRibbonIcon('dice', 'Sample Plugin', () => {

			// new Notice('This is a notice!');
			//let b: lib = new lib("van given string")
			l.updateLib()
			l.updatePaths()
			//l.updatePathslinearly()
			new Notice("items: "+String(l.count()))
			//new Notice(l.overview())


				/*
				readVaultFile(file, this.app).then((ret) => {
					const cont: string = ret
					log(cont);
				})*/



			// log("test");
			//new SampleModal(this.app).open();
		});

		// maybe implement some status bar text? like no of linked, unlinked, last time refreshed? like kicker ticker
		//this.addStatusBarItem().setText('Status Bar Text');

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

		this.addSettingTab(new SampleSettingTab(this.app, this));

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

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

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
				}));
	}
}
