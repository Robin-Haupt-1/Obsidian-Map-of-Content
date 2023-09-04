import type { DBManager } from "./db";
import type { App, TFile, WorkspaceLeaf } from "obsidian";
import { MOC_VIEW_TYPE } from "./constants";

export const devLog = (message: string) => {
  const printLog = true;
  if (printLog) console.log("[Map of Content] " + message);
};

export const removeExtension = (path: string, extension: string = ".md") => {
  if (path.endsWith(extension)) {
    return path.slice(0, -extension.length);
  }
  return path;
};

/**@returns True if CTRL / Meta is pressed */
export const isCtrlPressed = (e: MouseEvent): boolean => {
  return window.navigator.userAgent.includes("Macintosh")
    ? e.metaKey
    : e.ctrlKey;
};

/**  Returns only the name of the actual file  */
export const getFileNameFromPath = (path: string): string => {
  return path.split("/").last();
};

/**  return the full path if there are two or more notes with the same filename and extension, else only the filename  */
export const getDisplayName = (path: string, db: DBManager): string => {
  const fileName = getFileNameFromPath(path);

  if (db.fileHasDuplicatedName.get(fileName) === true) {
    return removeExtension(path);
  }

  return removeExtension(fileName);
};

export const NavigateToFile = async (
  app: App,
  path: string,
  event: MouseEvent
) => {
  if (!app.metadataCache.getFirstLinkpathDest(path, "/")) return;

  app.workspace.openLinkText(path, "/", isCtrlPressed(event));
};

/** Get the paths of all folders in the vault, empty or not */
export const GetAllFolders = (app: App): string[] => {
  const allFolderPaths = [];
  app.vault.getFiles().forEach((file) => {
    // cut of filename
    const folderPath = file.path.slice(
      0,
      file.path.length - (file.basename.length + file.extension.length + 1)
    );
    // add path to collected paths
    if (folderPath.length && !allFolderPaths.contains(folderPath)) {
      allFolderPaths.push(folderPath);
    }
  });

  // store all parent folder paths as unique paths if they aren't yet because they don't include any notes directly
  allFolderPaths.forEach((path) => {
    const allSubPaths = path.split("/");
    for (let i = 1; i < allSubPaths.length - 1; i++) {
      const partialPath = allSubPaths.slice(0, i).join("/") + "/";
      if (!allFolderPaths.contains(partialPath)) {
        allFolderPaths.push(partialPath);
      }
    }
  });

  return allFolderPaths;
};
