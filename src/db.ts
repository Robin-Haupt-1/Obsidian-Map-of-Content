import {
  LINKED_BOTH,
  LINKED_CN as LINKED_CN,
  LINKED_FROM,
  LINKED_TO,
} from "./constants";
import type {
  App,
  EmbedCache,
  FrontmatterLinkCache,
  LinkCache,
  Vault,
} from "obsidian";
import { Notice } from "obsidian";
import type { DB, FileItem, Path } from "./types";
import { getFileNameFromPath, devLog } from "./utils";
import type MOCPlugin from "./main";
import type { SettingsManager } from "./settings";

export class DBManager {
  db: DB = {};
  settings: SettingsManager;
  dbEntries: any[];
  dbKeys: string[];
  app: App;
  plugin: MOCPlugin;
  vault: Vault;
  allPaths: Path[] = [];
  descendants: Map<string, Set<string>>;
  fileHasDuplicatedName: Map<string, boolean>;
  isDatabaseComplete: boolean = false;
  isDatabaseUpdating: boolean = true;
  timesGetPathRan: number;

  constructor(plugin: MOCPlugin) {
    this.app = plugin.app;
    this.plugin = plugin;
    this.settings = plugin.settings;
    this.dbEntries = Object.entries(this.db);
  }

  async update(silent: boolean = false) {
    this.isDatabaseComplete = false;
    this.isDatabaseUpdating = true;

    try {
      if (this.plugin.CNexists()) {
        let startTime = Date.now();
        if (!silent) {
          new Notice("Updating the Map of Content...");
        }
        devLog("Updating the Map of Content...");
        await new Promise((r) => setTimeout(r, 0));
        this.updateDB();
        await new Promise((r) => setTimeout(r, 0));

        this.timesGetPathRan = 0;
        this.updateDepthInformation();

        this.allPaths.length = 0;
        let pathSoFar: Path = {
          allMembers: [this.settings.get("CN_path")],
          items: [[this.settings.get("CN_path"), LINKED_CN]],
        };
        await new Promise((r) => setTimeout(r, 0));

        this.followPaths(pathSoFar);
        await new Promise((r) => setTimeout(r, 0));

        this.updateDescendants();

        if (!silent) {
          new Notice("Update complete");
        }
        devLog(
          `Update complete, took ${String(
            (Date.now() - startTime) / 1000
          )} seconds`
        );
        devLog(`get paths ran ${this.timesGetPathRan} times`);

        this.isDatabaseComplete = true;
      }
    } finally {
      this.isDatabaseUpdating = false;
      this.plugin.rerender();
    }
  }

  getNoteFromPath(path: string): FileItem | undefined {
    return this.db?.[path];
  }

  /** return all paths that include a certain note. Only return the path up to that note*/
  findPaths(path: string): Path[] {
    let filteredPaths: Path[] = [];
    let filteredPathsAsJson = JSON.stringify(filteredPaths);
    this.allPaths.forEach((p: Path) => {
      if (p.allMembers.includes(path)) {
        if (p.allMembers.last() === path) {
          filteredPaths.push(p);
        } else {
          let index = p.allMembers.indexOf(path) + 1;
          let choppedOffPath = p.items.slice(0, index);
          if (!filteredPathsAsJson.includes(JSON.stringify(choppedOffPath))) {
            // return a path element containing only the parts of the path information up to the note in question
            filteredPaths.push({
              allMembers: p.allMembers.slice(0, index),
              items: p.items.slice(0, index),
            });
            filteredPathsAsJson = JSON.stringify(filteredPaths);
          }
        }
      }
    });

    return filteredPaths;
  }

  allNotes(): FileItem[] {
    return this.dbEntries.map(([key, value]) => value);
  }

  updateDB() {
    devLog("Updating the library...");
    // TODO - this is a hacky way to clear the db, find a better way - why is this necessary?
    for (let note in this.db) {
      delete this.db[note];
    }
    let vaultFiles = this.app.vault.getFiles();
    devLog(`Total number of files in vault: ${vaultFiles.length}`);
    let entriesCreatedCount = 0;
    vaultFiles.forEach((file) => {
      if (this.settings.isExcludedFile(file)) {
        return;
      }
      entriesCreatedCount += 1;
      this.db[file.path] = {
        path: file.path,
        extension: file.extension,
        linksTo: new Set<string>(),
        linkedFrom: new Set<string>(),
        distanceFromCn: null,
      };
    });

    devLog(`Created ${entriesCreatedCount} new db entries`);

    this.dbEntries = Object.entries(this.db);
    this.dbKeys = Object.keys(this.db);

    this.fileHasDuplicatedName = new Map<string, boolean>();
    let duplicateCheckedFilesCount = 0;
    this.allNotes().forEach((note) => {
      let fileName = getFileNameFromPath(note.path);

      duplicateCheckedFilesCount += 1;
      // TODO use something like a counter here that just counts up the occurrences of each file name
      if (this.fileHasDuplicatedName.has(fileName)) {
        // If the file name is encountered twice or more, set it's duplicate status to true
        this.fileHasDuplicatedName.set(fileName, true);
      } else {
        this.fileHasDuplicatedName.set(fileName, false);
      }
    });

    devLog(`Checked ${duplicateCheckedFilesCount} files for duplicate names`);

    this.dbEntries = Object.entries(this.db);

    devLog("Analyzing links");

    const markdownNotes = this.allNotes().filter(
      (note) => note.extension === "md"
    );

    markdownNotes.forEach((note: FileItem) => {
      let linksFromNote = this.getValidatedLinksFromNote(note.path, note.path);

      this.db[note.path].linksTo = linksFromNote;

      linksFromNote.forEach((link: string) => {
        if (!this.db[link]) {
          return;
        }
        if (!this.db[link].linkedFrom.has(note.path)) {
          this.db[link].linkedFrom.add(note.path);
        }
      });
    });
  }

  /** starting from the CN, follow all paths and store the information on how long the shortest path to each note is*/
  updateDepthInformation() {
    devLog(
      "Analyzing distance from Central Note. CN path: " +
        this.settings.get("CN_path")
    );
    let distanceFromCn = 1;
    let previouslyCheckedLinks: string[] = []; // all the notes that have already been visited. dont visit them again to prevent endless loops
    let links = [this.settings.get("CN_path")];
    while (links.length > 0) {
      let nextLoopsLinks = new Set<string>();
      links.forEach((link: string) => {
        let note = this.getNoteFromPath(link);
        if (!note) {
          return;
        }
        [...note.linksTo, ...note.linkedFrom].forEach((link: string) => {
          if (!previouslyCheckedLinks.contains(link)) {
            nextLoopsLinks.add(link);
          }
        });
        if (
          note.distanceFromCn == null ||
          note.distanceFromCn > distanceFromCn
        ) {
          note.distanceFromCn = distanceFromCn;
        }
        previouslyCheckedLinks.push(link);
      });
      links = Array.from(nextLoopsLinks);
      distanceFromCn += 1;
    }
  }

  /**
   * Recursive function that follows all possible paths from the CN that aren't unreasonably long or circular and stores them
   * @param basePath the path to be extended in this iteration
   */
  followPaths(basePath: Path) {
    this.timesGetPathRan += 1;

    const note = this.db[basePath.allMembers.last()];

    if (!note) {
      return;
    }

    const newPathsToFollow: Path[] = [];
    const notesLinkingToThisNoteToFollow = new Set(note.linkedFrom);

    note.linksTo.forEach((link: string) => {
      if (basePath.allMembers.includes(link)) {
        return;
      }
      let linkDirectionToken = LINKED_TO;
      if (notesLinkingToThisNoteToFollow.has(link)) {
        notesLinkingToThisNoteToFollow.delete(link);
        linkDirectionToken = LINKED_BOTH;
      }
      newPathsToFollow.push({
        allMembers: basePath.allMembers.concat(link),
        items: basePath.items.concat([[link, linkDirectionToken]]),
      });
    });

    notesLinkingToThisNoteToFollow.forEach((link: string) => {
      if (basePath.allMembers.includes(link)) {
        return;
      }
      newPathsToFollow.push({
        allMembers: basePath.allMembers.concat(link),
        items: basePath.items.concat([[link, LINKED_FROM]]),
      });
    });

    let pathHasNovelChildPath = false;

    newPathsToFollow.forEach((newPath: Path) => {
      // prevent meandering paths that are longer than the shortest path to the note
      if (
        newPath.allMembers.length >
        this.getNoteFromPath(newPath.allMembers.last()).distanceFromCn
      ) {
        return;
      }

      this.followPaths(newPath);
      pathHasNovelChildPath = true;
    });

    if (pathHasNovelChildPath) {
      return;
    }

    this.allPaths.push(basePath);
  }

  /** for every note, store all notes that come right after it in any path. this is for displaying the tree view */
  updateDescendants() {
    this.descendants = new Map();

    let updateDescendantsLoopRanCounter = 0;
    this.allPaths.forEach((path: Path) => {
      path.allMembers
        .slice(0, -1)
        .forEach((notePath: string, index: number) => {
          if (!this.descendants.has(notePath)) {
            this.descendants.set(
              notePath,
              new Set<string>([path.allMembers[index + 1]])
            );
            return;
          }
          this.descendants.get(notePath).add(path.allMembers[index + 1]);
        });
      updateDescendantsLoopRanCounter += 1;
    });
    devLog(
      `update descendants loop ran ${updateDescendantsLoopRanCounter} times`
    );
  }

  getValidatedLinkPath(link: string, notePath: string): string | undefined {
    const linkWithoutAnchor = link.split("#")[0].split("^")[0];

    const linkDestination = this.app.metadataCache.getFirstLinkpathDest(
      linkWithoutAnchor,
      notePath
    );

    if (!linkDestination) {
      return;
    }

    if (this.dbKeys && !this.dbKeys.contains(linkDestination.path)) {
      // TODO why is this called before dbKeys is set?
      return null;
    }

    return linkDestination.path;
  }

  getValidatedLinksFromNote(notePath: string, sourcePath: string): Set<string> {
    const cachedMetadata = this.app.metadataCache.getCache(notePath);

    const linkCaches = [
      ...(cachedMetadata.links ?? []),
      ...(cachedMetadata.embeds ?? []),
      ...(cachedMetadata.frontmatterLinks ?? []),
    ];

    const validatedLinks = new Set<string>();

    for (const linkCache of linkCaches) {
      const validatedLink = this.getValidatedLinkPath(
        linkCache.link,
        sourcePath
      );
      if (!validatedLink) {
        continue;
      }
      validatedLinks.add(validatedLink);
    }

    return validatedLinks;
  }
}
