import 'svelte'

import { ItemView, Notice, TFile, WorkspaceLeaf } from 'obsidian'


import { Log } from './utils';
import { MOC_VIEW_TYPE } from './constants'
import type MOCPlugin from './main'
import type { Path } from './types'
import type { DBManager } from './db'

import Error from './svelte/Error.svelte'

import PathView from './svelte/PathView.svelte'
export default class MOCView extends ItemView {
  db: DBManager
  _app: PathView
  errorview: Error
  plugin: MOCPlugin
  open_file_path: string


  constructor(leaf: WorkspaceLeaf,plugin: MOCPlugin) {
    super(leaf)
    this.plugin = plugin
    this.db = this.plugin.db
    this.app = this.plugin.app
    this.plugin.app.workspace.onLayoutReady(() => this.init())


  }
  init(){ 
 
    // update the path view every time a file is opened
    this.registerEvent(this.app.workspace.on("file-open", (file: TFile) => this.rerender()))  
 
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

    if (this.errorview) {
      this.errorview.$destroy()
      this.errorview = undefined
    }


    let errors = []
    //console.log(this.open_file_path)

    // during startup (before first db update is completed) show loading message
    if (this.db.database_complete=="boot") {
      errors.push("Please wait...")
    }
    // make sure the database is usable
    if (this.db.database_complete=="no") {
      //TODO: try once to this.db.update()
      errors.push("Your vault could not be analyzed. Try updating the Map of Content again and make sure your Central Note exists")
    }
    // make sure a file is opened
    let open_file = this.app.workspace.getActiveFile()
    if (open_file == null) {
      errors.push("No note has been opened")
    }
    // get path of open note 
    else {
      this.open_file_path = open_file.path
      if (this.db.getNoteFromPath(this.open_file_path) == undefined) {
        // make sure file is in library   
        errors.push("This note has not been indexed yet. Update the Map of Content")
      }
    }

    // Show error message if necessary
    if (errors.length > 0) {
      this.errorview = new Error({
        target: (this as any).contentEl,
        props: { message: errors[0] },

      })
      return
    }
    // get paths to open note
    let all_paths = this.db.findPaths(this.open_file_path)
    if (all_paths.length == 0) {
      Log("No paths to this note", true)
    }

    // 
    let paths = all_paths.map((p: Path) =>
      p.items.slice()
    )

    // create new pathview
    this._app = new PathView({
      target: (this as any).contentEl,
      props: { paths: paths, app: this.app, db: this.db, cn_path: this.plugin.getCNPath(), open_note_path: this.open_file_path },

    })
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


  onClose(): Promise<void> {
    // destroy old pathview/errorview instance
    // set symbol to undefined to avoid "This component has already been destroyed" message
    if (this._app) {
      this._app.$destroy()
      this._app = undefined
    }

    if (this.errorview) {
      this.errorview.$destroy()
      this.errorview = undefined
    }

    return Promise.resolve();
  }

}
