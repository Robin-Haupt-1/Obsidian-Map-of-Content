import { App, PluginSettingTab, Setting } from 'obsidian'

import type MOCPlugin from "./main"

export interface MOCSettings {
    CN_path: string // path of the note that serves as Central Note
    CN_path_per_vault:[string,string][] 

}

export const DEFAULT_SETTINGS: MOCSettings = {
    CN_path: "Central Note.md",
    CN_path_per_vault:[]
}
