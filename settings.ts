import { App, PluginSettingTab, Setting } from 'obsidian'

import type TLIPlugin from "./main"

export interface TLISettings {
    TLI_path: string // path of the note that serves as Top Level Index
    TLI_path_per_vault:[string,string][]
    all_paths // test: store path objects between sessions?

}

export const DEFAULT_SETTINGS: TLISettings = {
    TLI_path: "Top Level Index.md",
    TLI_path_per_vault:[],
    all_paths:null
}
