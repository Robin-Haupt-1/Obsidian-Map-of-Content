

import { TLI_VIEW_TYPE } from './constants'
import { ItemView, Notice, TFile, WorkspaceLeaf } from 'obsidian'

import MyPlugin from './main'
import { path } from 'types'
import { LibKeeper } from 'libkeeper'

export default class TLIView extends ItemView {
  lib: LibKeeper

  constructor(leaf: WorkspaceLeaf, private plugin: MyPlugin, lib: LibKeeper) {
    super(leaf)
    this.lib = lib
    this.containerEl.setText("test")

    this.registerEvent(this.app.workspace.on("file-open", (file: TFile) => {
      new Notice(file.path)
      this.containerEl.empty();
      let all_paths = lib.findPaths(file.path)
      this.containerEl.createEl('h2', { text: file.path });
      console.log("displaying paths")
      if (all_paths){
        all_paths.forEach((p: path) => {
        this.containerEl.createEl('h3', { text: lib.compilePath(p.items) })

      })
      }
        
    }))
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
  async onOpen(): Promise<void> {

  }


}
