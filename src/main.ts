import { App, getLinkpath, LinkCache, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, Vault } from 'obsidian';
import { CENTRAL_NOTE_PATH_DEFAULT, MOC_VIEW_TYPE, ViewCallback } from './constants'
import { DBManager } from './db'
import MOCView from './view'; 
import { MOCSettings, DEFAULT_SETTINGS, UpgradeSettings,MOCSettingTab, SettingsManager} from './settings';
import { Log } from './utils';

export default class MOCPlugin extends Plugin {
	db: DBManager;
	view: MOCView;
	settings:SettingsManager
 
	async onload() {
		this.settings=new SettingsManager(this)
		await this.settings.loadSettings() 
		this.db = new DBManager(this) 
		this.registerView(MOC_VIEW_TYPE, (leaf) => (this.view = new MOCView(leaf, this))) 
		this.app.workspace.onLayoutReady(() => this.initializePlugin())
	}

	async initializePlugin() {
		this.addSettingTab(new MOCSettingTab(this));
		this.initLeaf()
		this.db.update(true)

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
			name: 'Set current note as Central Note',
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
 				this.settings.set({ CN_path: this.app.workspace.getActiveFile().path });
				this.db.update()

			}
		}); 
	}

	initLeaf(): void {
		if (this.app.workspace.getLeavesOfType(MOC_VIEW_TYPE).length) {
			Log("View already attached" )
		} else {
			this.app.workspace.getRightLeaf(true).setViewState({
				type: MOC_VIEW_TYPE,
				active: true
			})
		}
	}

	rerender() {
		Log("rerender on main plugin called" )
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

	

 	CNexists(): boolean {
		let exists = !(this.app.vault.getAbstractFileByPath(this.settings.get("CN_path")) == null)
		Log(exists ? "CN exists" : "CN does not exist" )
		return exists
	}

  
	registerViewInstance(view: MOCView) {
		Log("View registered" )
		this.view = view
	} 
	unregisterViewInstance(view: MOCView) {
		this.view = undefined
	}
 
	isExludedFile(file: TFile) {
		let path_to_file = file.path
		let in_excluded_folder = this.settings.get("exluded_folders").some((path: string) => path_to_file.startsWith(path))
		if (in_excluded_folder) { return true }
		let filename = file.basename + "." + file.extension
		let has_excluded_filename = this.settings.get("exluded_filename_components").some((phrase: string) => filename.contains(phrase))
		return has_excluded_filename
	}
}

