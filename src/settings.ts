import type { App } from 'obsidian'

import type MOCPlugin from "./main"
import { Log } from './utils'

export interface MOCSettings {
    CN_path: string // path of the note that serves as Central Note
    exluded_folders: string[],
    exluded_filename_components: string[],
    settings_version:"0.1.10"

}

export const DEFAULT_SETTINGS: MOCSettings = {
    CN_path: "Central Note.md",
    exluded_folders: [],
    exluded_filename_components: [],
    settings_version:"0.1.10"

}

/** take a legacy settings object and transform it till it conforms to the current version */
export function UpgradeSettings(object: any, app: App) {
    try {
         // abort if settings are already in current version format
        if (object["settings_version"] === DEFAULT_SETTINGS["settings_version"]) {
            Log("Settings already in current version", true)
            return object
        }

        // clone the object
        object = JSON.parse(JSON.stringify(object))

        let object_keys = Object.keys(object)
        console.log(object_keys)
        let old_version = undefined

        // determine which version the legacy object is from
        if (!object_keys.contains("settings_version")) {
            old_version = "pre-0.1.10"
        }
        else {
            old_version = object["settings_version"]
        }

        console.log("old settings version: " + old_version)

        if (old_version === "pre-0.1.10") {
            // extract the CN path from CN_path_per_vault and save it as CN_path
            Log("Converting CN path from pre-0.1.10 to 0.1.10",true)

            // get just the name of all vaults there's a CN stored for
            let cn_settings_vault_names = object["CN_path_per_vault"].map((val: [string, string]) => val[0])
            if (cn_settings_vault_names.contains(app.vault.getName())) {
                object["CN_path"] = object["CN_path_per_vault"][cn_settings_vault_names.indexOf(app.vault.getName())][1]
            } else {
                // delete the CN_path entry. it will then be filled with default_settings data later
                delete object["CN_path"]
            }

            // delete the legacy CN_path_per_vault entry
            delete object["CN_path_per_vault"]

            //set new settings_version
            object["settings_version"]="0.1.10"

        }
        return object
    } catch {
        // it things don't work out, delete all old settings data (better than breaking the plugin)
        return {}
    }
}