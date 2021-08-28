import 'svelte'

import { TLI_VIEW_TYPE } from './constants'
import { ItemView, Notice, TFile, WorkspaceLeaf } from 'obsidian' 


import type MyPlugin from './main'
import type { path } from './types'
import type { LibKeeper } from './libkeeper'
import App from './App.svelte'


export default class TLIView extends ItemView {
  lib: LibKeeper
  private _app: App


  constructor(leaf: WorkspaceLeaf, private plugin: MyPlugin, lib: LibKeeper) {
    super(leaf)
    this.lib = lib
    this.app = plugin.app 

    // update the path view every time a file is opened
    this.registerEvent(this.app.workspace.on("file-open", (file: TFile) => { 
      let all_paths = lib.findPaths(file.path)

      if (all_paths) {  
        let props = all_paths.map((p: path) =>
          p.items.slice()
        )
        let str = JSON.stringify(props);
        console.log(str)
        this._app.$set({ pathes: props, app: this.app })


      }

    }))


  }

  async onOpen(): Promise<void> {
    this._app = new App({
      target: (this as any).contentEl,
      props: { pathes: [], app: this.app, lib: this.lib },
    })

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
