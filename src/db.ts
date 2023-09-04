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
import { DB, FileItem, Path } from "./types";
import { getFileNameFromPath, devLog } from "./utils";
import type MOCPlugin from "./main";
import type { SettingsManager } from "./settings";

export class DBManager {
  db: DB;
  settings: SettingsManager;
  dbEntries: any[];
  dbKeys: string[];
  app: App;
  plugin: MOCPlugin;
  vault: Vault;
  allPaths: Path[];
  descendants: Map<string, string[]>;
  fileHasDuplicatedName: Map<string, boolean>;
  isDatabaseComplete: boolean = false;
  isDatabaseUpdating: boolean = true;
  timesGetPathRan: number;

  constructor(plugin: MOCPlugin) {
    this.app = plugin.app;
    this.plugin = plugin;
    this.settings = plugin.settings;
    this.allPaths = [];
    this.db = {};
    this.dbEntries = Object.entries(this.db);
  }

  init() {}

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

  getNoteFromPath(path: string): FileItem {
    if (path in this.db) {
      return this.db[path];
    }
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
      this.db[file.path] = new FileItem(
        file.path,
        file.extension,
        [],
        [],
        null
      );
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
        if (!this.db[link].linkedFrom.includes(note.path)) {
          this.db[link].linkedFrom.push(note.path);
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
        // extract all active and passive connections (linked to or from) for the next iteration of link-following
        let note = this.getNoteFromPath(link);
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
   * @param pathSoFar the path to be extended in this iteration
   */
  followPaths(pathSoFar: Path) {
    this.timesGetPathRan += 1;

    let note = this.db[pathSoFar.allMembers.last()];
    let allPathMembers = pathSoFar.allMembers;
    let items = pathSoFar.items;

    let newPathsToFollow: Path[] = [];
    let noteLinksTo = note.linksTo.slice();
    let noteIsLinkedFrom = note.linkedFrom.slice();

    noteLinksTo.forEach((link: string) => {
      // check whether the linked note also links to the current note
      let linkDirectionToken = LINKED_TO;
      if (noteIsLinkedFrom.contains(link)) {
        // remove it from the passive links to be followed later
        let index = noteIsLinkedFrom.indexOf(link, 0);
        noteIsLinkedFrom.splice(index, 1);
        linkDirectionToken = LINKED_BOTH;
      }
      let newPath: Path = {
        allMembers: allPathMembers.concat(link),
        items: items.concat([[link, linkDirectionToken]]),
      };
      newPathsToFollow.push(newPath);
    });

    newPathsToFollow = newPathsToFollow.concat(
      noteIsLinkedFrom.map((link) => ({
        allMembers: allPathMembers.concat(link),
        items: items.concat([[link, LINKED_FROM]]),
      }))
    );

    let pathHasNovelChildPath: boolean = false;

    newPathsToFollow.forEach((path: Path) => {
      // the path without the next note that is to be explored
      // stop if this note is already part of the explored path

      if (path.allMembers.slice(0, -1).includes(path.allMembers.last())) {
        return;
      }

      // stop if the path isn't the shortest path to the note
      if (
        path.allMembers.length >
        this.getNoteFromPath(path.allMembers.last()).distanceFromCn
      ) {
        return;
      }

      this.followPaths(path);
      pathHasNovelChildPath = true;
    });

    // only add the path if it doesn't lead anywhere else. No need to have paths that are included in other paths
    if (pathHasNovelChildPath) {
      return;
    }
    this.allPaths.push(pathSoFar);
  }

  /** for every note, store all notes that come right after it in any path. this is for generating the Map Of Content later on */
  updateDescendants() {
    this.descendants = new Map();

    let updateDescendantsLoopRanCounter = 0;
    this.allPaths.forEach((p: Path) => {
      p.allMembers.forEach((notePath: string, index: number) => {
        // make sure it's not the last member of the path
        if (!(index === p.allMembers.length - 1)) {
          // create entry in descendants if it doesn't exist
          if (!this.descendants.has(notePath)) {
            this.descendants.set(notePath, []);
          }
          // logging
          updateDescendantsLoopRanCounter += 1;
          // add note as descendant if it isn't already stored in array
          if (
            !this.descendants.get(notePath).includes(p.allMembers[index + 1])
          ) {
            this.descendants.set(
              notePath,
              this.descendants.get(notePath).concat(p.allMembers[index + 1])
            );
          }
        }
      });
    });
    devLog(
      `update descendants loop ran ${updateDescendantsLoopRanCounter} times`
    );
  }

  getValidatedLinkPath(link: string, notePath: string): string | null {
    const linkWithoutAnchor = link.split("#")[0].split("^")[0];

    const linkDestination = this.app.metadataCache.getFirstLinkpathDest(
      linkWithoutAnchor,
      notePath
    );

    if (!linkDestination) {
      return null;
    }

    if (this.dbKeys && !this.dbKeys.contains(linkDestination.path)) {
      // TODO why is this called before dbKeys is set?
      return null;
    }

    return linkDestination.path;
  }

  getValidatedLinksFromNote(notePath: string, sourcePath: string): string[] {
    const cachedMetadata = this.app.metadataCache.getCache(notePath);

    const unvalidatedLinks = new Set<string>();

    cachedMetadata.links?.forEach((val: LinkCache) => {
      unvalidatedLinks.add(val.link);
    });

    cachedMetadata.embeds?.forEach((val: EmbedCache) => {
      unvalidatedLinks.add(val.link);
    });

    cachedMetadata.frontmatterLinks?.forEach((val: FrontmatterLinkCache) => {
      unvalidatedLinks.add(val.link);
    });

    return Array.from(unvalidatedLinks)
      .map((link: string) => this.getValidatedLinkPath(link, sourcePath))
      .filter((link) => link != null);
  }
}
