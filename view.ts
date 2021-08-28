import 'svelte'

import { TLI_VIEW_TYPE } from './constants'
import { ItemView, Notice, TFile, WorkspaceLeaf } from 'obsidian'
import { cleanExtension, fileNameFromPath, getDisplayName } from "./utils"


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


    //this.containerEl.setText("test") 

    this.registerEvent(this.app.workspace.on("file-open", (file: TFile) => {
      new Notice(file.path)

      //this.containerEl.empty();
      /*
      this._app = new App({
        target: (this as any).contentEl,
        props: { pathes: ["test", "testing!F"] },
      })*/


      let all_paths = lib.findPaths(file.path)
      //this.containerEl.createEl('h2', { text: file.path });

      if (all_paths) {
        console.log("displaying paths")
        // get the items from all paths and replace the absolute path information with DisplayName
        

        let props = all_paths.map((p: path) => 
          p.items.slice()
        )
        let str = JSON.stringify(props );
        console.log(str)
        this._app.$set({ pathes: props, app: this.app })

        //this._app
        //all_paths.forEach((p: path) => {
        //  this.containerEl.createEl('p', { text: lib.compilePath(p.items) })
        //})
      }

    }))
    

  }
  
  async onOpen(): Promise<void> {

    this._app = new App({
      target: (this as any).contentEl,
      props: { pathes: [] ,app:this.app,lib:this.lib},
    })

  }

  setText(str: string) {
    this.containerEl.setText(str)
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
 