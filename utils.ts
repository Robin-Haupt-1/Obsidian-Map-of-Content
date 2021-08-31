import type { LibKeeper } from "./libkeeper"

/**  remove the given extension (by default ".md") from path  */
export const cleanExtension = (path: string, extension: string = ".md") => {
    if (path.endsWith(extension)) {
        return path.slice(0, -extension.length)
    }
    return path
}

/**@returns True if CTRL / Meta is pressed */
export const isCtrlPressed = (e: MouseEvent): boolean => {
    console.log(window.navigator.userAgent)
    return window.navigator.userAgent.includes("Macintosh") ? e.metaKey : e.ctrlKey
}

/**  Returns only the name of the actual file  */
export const fileNameFromPath = (path: string): string => {
    return path.split("/").last()
}

/**  return the full path if there are two or more notes with the same filename and extension, else only the filename  
 * @todo only return as many segments (folders) of the path as are neccessary to uniquely differentiate the note
*/
export const getDisplayName = (path: string, lib: LibKeeper): string => {
    let file_name = fileNameFromPath(path)
    let display_name = null

    if (lib.duplicate_file_status.get(file_name)) {
        display_name = cleanExtension(path)
    } else {
        display_name = cleanExtension(file_name)
    }
    return display_name
}

 