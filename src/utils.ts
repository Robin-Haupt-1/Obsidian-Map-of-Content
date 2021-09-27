import type { DBManager } from "./db"
import type { App } from "obsidian";


/** log to the console */
export const Log = (message: string,dev:boolean=false) => {
    let log_dev=true // weether to print development log messages
    if (!dev || log_dev) console.log("[Automatic MOC] "+message)
    
}

/**  remove the given extension (by default ".md") from path  */
export const CleanExtension = (path: string, extension: string = ".md") => {
    if (path.endsWith(extension)) {
        return path.slice(0, -extension.length)
    }
    return path
}

/**@returns True if CTRL / Meta is pressed */
export const IsCtrlPressed = (e: MouseEvent): boolean => {
    console.log(window.navigator.userAgent)
    return window.navigator.userAgent.includes("Macintosh") ? e.metaKey : e.ctrlKey
}

/**  Returns only the name of the actual file  */
export const FileNameFromPath = (path: string): string => {
    return path.split("/").last()
}

/**  return the full path if there are two or more notes with the same filename and extension, else only the filename  
 * @todo only return as many segments (folders) of the path as are neccessary to uniquely differentiate the note
*/
export const GetDisplayName = (path: string, lib: DBManager): string => {
    let file_name = FileNameFromPath(path)
    let display_name = null

    if (lib.duplicate_file_status.get(file_name)) {
        display_name = CleanExtension(path)
    } else {
        display_name = CleanExtension(file_name)
    }
    return display_name
}


export const NavigateToFile = async (
    app: App,
    path: string,
    event: MouseEvent
) => {
     

    let file = app.metadataCache.getFirstLinkpathDest(path, "/");

    if (!file) return;
    const leaf = IsCtrlPressed(event)
        ? app.workspace.splitActiveLeaf()
        : app.workspace.getUnpinnedLeaf();
    app.workspace.openLinkText(path,"/")
    //await leaf.openFile(file);
};