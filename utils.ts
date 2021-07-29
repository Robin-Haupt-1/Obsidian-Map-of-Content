import { LibKeeper } from "libkeeper"

export const cleanExtension = (path: string, extension: string = ".md") => {
    if (path.endsWith(extension)) {
        return path.slice(0, -extension.length)
    }
    return path
}
export const fileNameFromPath = (path: string): string => {
    return path.split("/").last()
}


export const getDisplayName=(path: string,lib:LibKeeper): string =>{
    // return the full path if there are two or more notes with the same filename and extension, else only the name of file
    let file_name = fileNameFromPath(path)
    let display_name = null

    if (lib.duplicate_file_status.get(file_name)) {
        display_name = cleanExtension(path)
    } else {
        display_name = cleanExtension(file_name)
    }
    return display_name
}