import 'svelte'

import { TLI_VIEW_TYPE } from './constants'
import { ItemView, Notice, TFile, WorkspaceLeaf } from 'obsidian'


import type TLIPlugin from './main'
import type { path } from './types'
import type { LibKeeper } from './libkeeper'
import PathView from './PathView.svelte'


export default class TLIView extends ItemView {
  lib: LibKeeper
  _app: PathView
  plugin: TLIPlugin
  open_file_path: string


  constructor(leaf: WorkspaceLeaf, plugin: TLIPlugin, lib: LibKeeper) {
    super(leaf)
    this.lib = lib
    this.app = plugin.app
    this.plugin = plugin

    // update the path view every time a file is opened
    this.registerEvent(this.app.workspace.on("file-open", (file: TFile) => this.fileChanged(file)))


  }

  async onOpen(): Promise<void> {
    this._app = new PathView({
      target: (this as any).contentEl,
      props: { paths: [], app: this.app, lib: this.lib, plugin: this.plugin,tli_path:this.plugin.getTliPath(),open_note_path:this.plugin.getTliPath()},

    })

  }

  fileChanged(file: TFile) {
    this.open_file_path = file.path
    this.rerender()
  }
  rerender(): void {
    console.log("rerender called")
    let all_paths = this.lib.findPaths(this.open_file_path)
    if (all_paths.length>0) {
      let paths = all_paths.map((p: path) =>
        p.items.slice()

      )
      let str = JSON.stringify(paths); 
      console.log(str)
      
      this._app.$set({ paths: paths, app: this.app ,tli_path:this.plugin.getTliPath(),open_note_path:this.open_file_path })
      this._app.$destroy()
      this._app = new PathView({
        target: (this as any).contentEl,
        props: { paths: paths, app: this.app,lib:this.lib ,tli_path:this.plugin.getTliPath(),open_note_path:this.open_file_path },
  
      })
    } else {
      console.log("no paths")
      this._app.$set({ paths: [], app: this.app,tli_path:this.plugin.getTliPath(),open_note_path:this.open_file_path })
    }





  }

  getViewType(): string {
    return TLI_VIEW_TYPE
  }
  getDisplayText(): string {
    return "TLI"
  }

  getIcon(): string {
    return "dice"
  }

  async onload() {

  }


}
