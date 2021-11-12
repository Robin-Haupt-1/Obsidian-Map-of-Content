import 'svelte'

import { ItemView, LinkCache, Notice, TFile, WorkspaceLeaf } from 'obsidian'


import { Log } from './utils';
import { MOC_VIEW_TYPE } from './constants'
import type MOCPlugin from './main'
import type { Path } from './types'
import type { DBManager } from './db'
import View from './svelte/View.svelte'

export default class MOCView extends ItemView {
  db: DBManager
  _app: View
  plugin: MOCPlugin
  open_file_path: string
  max_indent: number = 5

  monitoring_note: string
  monitoring_note_links: string[]


  constructor(leaf: WorkspaceLeaf, plugin: MOCPlugin) {
    super(leaf)
    this.plugin = plugin
    this.db = this.plugin.db
    this.app = this.plugin.app

    // register with the main class
    this.plugin.registerViewInstance(this)
    this.plugin.app.workspace.onLayoutReady(() => this.init())

    // rerender on css change to adapt to dark/light mode changes
    // TODO pass command to svelte, not recreate it
    this.plugin.app.workspace.on("css-change", () => {
      this.rerender()
    })

  }

  init() {
    // update the path view every time a file is opened
    this.registerEvent(this.app.workspace.on("file-open", (file: TFile) => {    this.monitorNote();      this.rerender() }))
    this.monitorNote()
    this.rerender()
  }

  async onOpen(): Promise<void> {

  }

 
  /** reload paths and recreate the svelte instance */
  rerender(): void {
    Log("Rerender called on view", true)

    // destroy old pathview/errorview instance
    // set symbol to undefined to avoid "This component has already been destroyed" message
    if (this._app) {
      this._app.$destroy()
      this._app = undefined
    }



    let errors = []
    //console.log(this.open_file_path)

    // during startup (before first db update is completed) show loading message
    if (this.db.database_loading) {
      errors.push("Updating...")
    }

    // make sure the database is usable
    else if (!this.db.database_complete) {
      //TODO: try once to this.db.update()
      errors.push(`Your Map of Content couldn't be created.<br><br> Make sure your Central Note path '${this.plugin.getSettingValue("CN_path")}' is correct. You can change this path in the settings tab.`)
    }

    // make sure a file is opened
    else if (this.app.workspace.getActiveFile() == null) {
      errors.push("No file is open")
    }
    else if (this.plugin.isExludedFile(this.app.workspace.getActiveFile())) {
      errors.push("This file has been excluded from the Map of Content.")
    }
    // get path of open note 
    else {
      this.open_file_path = this.app.workspace.getActiveFile().path
      if (this.db.getNoteFromPath(this.open_file_path) == undefined) {
        errors.push("Updating...")
        this.db.update(true)
      }
    }
    if (errors.length > 0) {
      this.open_file_path = "None"
      var paths = []
    } else {
      // get paths to open note
      let all_paths = this.db.findPaths(this.open_file_path)
      if (all_paths.length == 0) {
        Log("No paths to this note", true)
      }

      paths = all_paths.map((p: Path) =>
        p.items.slice()
      )
    }

    // create new pathview 
    this._app = new View({
      target: (this as any).contentEl,
      props: { plugin: this.plugin, view: this, paths: paths, app: this.app, db: this.db, cn_path: this.plugin.getSettingValue("CN_path"), open_note_path: this.open_file_path, errors: errors },

    })
  }

  onClose(): Promise<void> {
    // destroy old pathview/errorview instance
    // set symbol to undefined to avoid "This component has already been destroyed" message

    Log("View closing", true)

    if (this._app) {
      this._app.$destroy()
      this._app = undefined
    }

    this.plugin.unregisterViewInstance(this)

    return Promise.resolve();

  }

  async monitorNote() {
    let active_file=this.app.workspace.getActiveFile()
    if (active_file == null) {
      return
    }
    if (!this.plugin.getSettingValue("auto_update_on_file_change")) {
      Log("not monitoring note because disabled",true)
      return
    }
    if (active_file == null || this.plugin.isExludedFile(active_file)) {
      Log("not monitoring because no file / excluded file", true)
      return
    }
    if (this.monitoring_note&&this.app.metadataCache.getCache(this.monitoring_note)==undefined) {
      Log("note name must have changed",true)
    }
    let path = active_file.path

    Log("Monitornote called on: " + path,true)
    Log("Old monitoring note: "+this.monitoring_note,true)
    let rerender = false;
    if (this.monitoring_note&&this.app.metadataCache.getCache(this.monitoring_note)) {
      if (!(path === this.monitoring_note)) {

        let now_links = this.db.getLinksFromNote(this.monitoring_note)
        if (!(JSON.stringify(now_links) == JSON.stringify(this.monitoring_note_links))) {
          console.log("links changed!")
          rerender = true
        }
      }


    }
    this.monitoring_note = path
    this.monitoring_note_links = this.db.getLinksFromNote(path)
    if (rerender) {
      this.db.update(true)
    }
  }


  getViewType(): string {
    return MOC_VIEW_TYPE
  }

  getDisplayText(): string {
    return "Map of Content"
  }

  getIcon(): string {
    return "stacked-levels"
  }

}
