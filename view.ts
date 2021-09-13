import 'svelte'

import { TLI_VIEW_TYPE } from './constants'
import { ItemView, Notice, TFile, WorkspaceLeaf } from 'obsidian'

import { log } from './utils';

import type TLIPlugin from './main'
import type { path } from './types'
import type { LibKeeper } from './libkeeper'
import PathView from './PathView.svelte'


export default class TLIView extends ItemView {
  lib: LibKeeper
  _app: PathView
  plugin: TLIPlugin
  open_file_path: string


  constructor(leaf: WorkspaceLeaf) {
    super(leaf)
  }

  _init(plugin: TLIPlugin, lib: LibKeeper) {
    this.lib = lib
    this.app = plugin.app
    this.plugin = plugin

    // update the path view every time a file is opened
    this.registerEvent(this.app.workspace.on("file-open", (file: TFile) => this.fileChanged(file)))
    
    log("open path: " + this.app.workspace.getActiveFile().path, true)

    this.rerender()
  }
  async onOpen(): Promise<void> {



  }

  fileChanged(file: TFile) {
    //this.open_file_path = file.path
    this.rerender()
  }

  rerender(): void {
    this.open_file_path = this.app.workspace.getActiveFile().path
    log("rerender called", true)
    let all_paths = this.lib.findPaths(this.open_file_path)
    if (all_paths.length == 0) {
      log("No paths to this note", true)
    }
    let paths = all_paths.map((p: path) =>
      p.items.slice()
    )
    let str = JSON.stringify(paths);
    log("Paths to note: " + str, true)

    //this._app.$set({ paths: paths, app: this.app ,tli_path:this.plugin.getTliPath(),open_note_path:this.open_file_path })
    if (this._app) this._app.$destroy()
    this._app = new PathView({
      target: (this as any).contentEl,
      props: { paths: paths, app: this.app, lib: this.lib, tli_path: this.plugin.getTliPath(), open_note_path: this.open_file_path },

    })






  }

  getViewType(): string {
    return TLI_VIEW_TYPE
  }
  getDisplayText(): string {
    return "Automatic MOC"
  }

  getIcon(): string {
    return ""
  }


  onClose(): Promise<void> {
    if (this._app) {
      this._app.$destroy();
    }
    return Promise.resolve();
  }

}
