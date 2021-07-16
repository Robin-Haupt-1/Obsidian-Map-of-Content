

import { TLI_VIEW_TYPE } from './constants'
import {ItemView, Notice, TFile, WorkspaceLeaf} from 'obsidian'

import MyPlugin from './main'

export default class TLIView extends ItemView {

  constructor(leaf: WorkspaceLeaf, private plugin: MyPlugin) {
    super(leaf)
    this.containerEl.setText("test")
    this.registerEvent(this.app.workspace.on("file-open", (file:TFile) => {
			new Notice(file.path)
        
      this.containerEl.empty();

      this.containerEl.createEl('h2', { text: file.path });
		}))
  }
  setText(str:string){
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

  async onload(){
   
  }
  async onOpen(): Promise<void> {
    
  }

  
}
