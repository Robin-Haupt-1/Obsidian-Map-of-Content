import { LINKED_BOTH, LINKED_TLI, LINKED_TO } from "./constants";
import { LINKED_FROM } from "./constants";
import { TLI_NOTE_PATH } from "./constants";
import type { TFile, App, Vault, Notice, LinkCache, getLinkpath, ValueComponent, Modal } from "obsidian";
import { note, libdict, path, PATHModal } from './types'
import { fileNameFromPath, getDisplayName } from "./utils"


export class LibKeeper {
    libdict: libdict
    l_entries: any[]
    app: App
    vault: Vault
    declare all_paths: path[]
    get_paths_ran: number
    get_paths_stats: {}
    duplicate_file_status: Map<string, boolean> // Todo: map with the count instead of binary status to count up/down on file rename

    constructor(app: App) {
        this.app = app;
        this.all_paths = []
        this.vault = app.vault
        this.libdict = {}
        this.l_entries = Object.entries(this.libdict)
        this.updateLib()
        this.updatePaths()
    }
    /**Return the internal note representation object for a given path */
    getNoteByPath(path: string) {
        if (path in this.libdict) {
            return this.libdict[path]
        }

    }

    /** return all paths that end at a certain note*/
    findPaths(path: string): path[] {
        let filtered_paths: path[] = []
        this.all_paths.forEach((p: path) => {
            if (p.all_members.includes(path)) {
                if (p.all_members.last() == path) {
                    filtered_paths.push(p)
                }

            }
        })
        if (filtered_paths.length > 0) {
            return filtered_paths
        }
        console.log("no paths found for " + path)
    }

    get_all_notes(): note[] {
        return this.l_entries.map(([key, value]) => value)
    }

    updateLib() {
        // step 1: update the plugins internal representation of all notes in the vault
        console.log("Updating the library...")
        // delete old state
        let l = this.libdict
        for (let note in l) { { delete l[note]; } }
        // read all files
        let md_files = this.vault.getFiles()
        this.duplicate_file_status = new Map<string, boolean>();
        console.log("md files in collection: " + String(md_files.length))
        // check for duplicate files
        md_files.forEach((file) => {
            let file_name = fileNameFromPath(file.path)

            console.log(file_name)
            if (this.duplicate_file_status.has(file_name)) { // If the file name is encountered twice or more, set it's duplicate status to true
                this.duplicate_file_status.set(file_name, true)
                //console.log("duplicate: " + file_name)
            } else {
                this.duplicate_file_status.set(file_name, false)
                //console.log("unique so far: " + file_name)
            }


        })

        // create new library entries
        md_files.forEach((file) => {
            let path = file.path

            let new_note = new note(file, path, file.extension, [], [], null, false, []);

            // update the libdict and the l_entries representation of it
            this.libdict[new_note.path] = new_note
            this.l_entries = Object.entries(this.libdict)
        })

        // step 2: analyze links
        let all_notes = this.get_all_notes()
        console.log("total number of notes in library: " + String(all_notes.length))
        console.log("analyzing links")
        all_notes.forEach((note: note) => {
            if (note.extension != "md") {
                // skip if its not an md file. other file types can't link to anything
                return
            }

            // first: save all the links this note links to
            let linkcache = this.app.metadataCache.getCache(note.path).links
            if (!linkcache) return // no links
            let this_links_to: string[] = []
            linkcache.forEach((val: LinkCache) => {
                // check if the link is valid 
                let link_dest = this.app.metadataCache.getFirstLinkpathDest(val.link, "/")
                if (link_dest && !this_links_to.includes(link_dest.path)) {
                    this_links_to.push(link_dest.path)

                }
            })
            this.libdict[note.path].links_to = this_links_to

            // second: add a passive reference to the lib entry of all notes that are linked to from this note
            this_links_to.forEach((link: string) => {
                if (!this.libdict[link].linked_from.includes(note.path)) {
                    this.libdict[link].linked_from.push(note.path)
                }
            })
        })
    }

    /** starting from the TLI, follow all paths and store the information on how long the shortest path to each note is*/
    updateDepthInformation() {
        console.log("Analyzing distance from TLI")
        let depth = 0 // distance from the TLI. starts at zero 
        let checked_links: string[] = []  // all the notes that have already been visited. dont visit them again to prevent endless loops
        let do_continue = true
        // start at the the TLI
        let links = [TLI_NOTE_PATH]
        while (do_continue) {
            let next_links: string[] = []
            links.forEach((link: string) => {
                // extract all active and passive connections (linked to or from) for the next iteration of link-following
                let note = this.getNoteByPath(link)
                note.links_to.forEach((link: string) => {
                    if (!checked_links.contains(link) && !next_links.contains(link)) {
                        next_links.push(link)
                    }
                })
                note.linked_from.forEach((link: string) => {
                    if (!checked_links.contains(link) && !next_links.contains(link)) {
                        next_links.push(link)
                    }
                })
                // save the info that the note can be reached from the TLI
                note.is_linked_to_TLI = true
                // update the info on how far the note is removed from TLI
                if (note.distance_from_TLI == null || note.distance_from_TLI > depth) {
                    note.distance_from_TLI = depth
                }
                checked_links.push(link)
            })
            links = next_links.slice()
            if (links.length == 0) {
                do_continue = false
            }
            depth += 1

        }

    }
    /**
     * Recursive function that follows all possible paths from the TLI that aren't unreasonably long or circular and stores them
     * @param path_so_far the path to be extended in this iteration
     */
    followPaths(path_so_far: path) {
        // logging
        this.get_paths_ran += 1
        if (this.get_paths_ran % 100 == 0) {
            console.log("get paths ran " + String(this.get_paths_ran))
            console.log(path_so_far.all_members.join(" "))
        }

        let note = this.libdict[path_so_far.all_members.last()]
        let depth = path_so_far.depth
        let all_members = path_so_far.all_members
        let items = path_so_far.items

        //note.paths_from_TLI.push(path_so_far)
        this.all_paths.push(path_so_far)
        //note.is_linked_to_TLI = true
        //note.distance_from_TLI = depth
        let new_paths_to_follow: path[] = []
        let note_links_to = note.links_to.slice()
        let note_linked_from = note.linked_from.slice()

        note_links_to.forEach((link: string) => {
            // check whether the linked note also links to the current note
            let linked_to_or_both_ways = LINKED_TO
            if (note_linked_from.contains(link)) {
                // remove it from the passive links to be followed later
                let index = note_linked_from.indexOf(link, 0);
                note_linked_from.splice(index, 1);
                linked_to_or_both_ways = LINKED_BOTH

            }
            let new_path: path = { depth: depth + 1, all_members: all_members.concat(link), items: items.concat([[link, linked_to_or_both_ways]]) }
            new_paths_to_follow.push(new_path)
        })

        note_linked_from.forEach((link: string) => {
            let new_path: path = { depth: depth + 1, all_members: all_members.concat(link), items: items.concat([[link, LINKED_FROM]]) }
            new_paths_to_follow.push(new_path)
        })

        // function calls itself to explore every new path  
        new_paths_to_follow.forEach((path: path) => {
            // the path without the next note that is to be explored
            let all_items_so_far = path.all_members.slice(0, -1)
            let last_item_path = path.all_members.last()
            let last_item = this.getNoteByPath(last_item_path)

            // stop if this note is already part of the explored path
            if (all_items_so_far.includes(last_item_path)) {
                return
            }



            // stop if the path is too long. if it's shorter than 6 members, allow some meandering, otherwise none. 
            if (last_item.distance_from_TLI) {
                if (path.all_members.length < 6) {
                    if ((path.depth - last_item.distance_from_TLI) > 1) {
                        return
                    }
                } else {
                    if ((path.depth - last_item.distance_from_TLI) > 0) {
                        return
                    }
                }
            }
            this.followPaths(path)
        })





    }

    updatePathsRecursively() {
        //this.updateLib()
        this.all_paths = []
        let path_so_far: path = { depth: 0, all_members: [TLI_NOTE_PATH], items: [[TLI_NOTE_PATH, LINKED_TLI]] }
        this.followPaths(path_so_far)

    }

    updatePaths() {
        this.get_paths_ran = 0
        this.get_paths_stats = { "ran": 0, "skipped": 0 }
        this.updateDepthInformation()
        this.updatePathsRecursively()
    }

    /**deprecated: compile a path object into a string */
    compilePath(path: [string, string][], reverse: Boolean = false): string {
        let str: string = getDisplayName(path[0][0], this) // TLI linkedtoorform is null
        if (reverse == true) {
            // show path starting from Top Level Index
            path.slice(1).forEach((path: string[]) => {
                let filename = getDisplayName(path[0], this)
                str = str.concat(` ${path[1]} ${filename}`); // => note  for example
            })
            return str
        }
        else {
            // show path ending at Top Level Index  
            path.slice(1).forEach((path: string[]) => {
                let filename = getDisplayName(path[0], this)
                let arrow = path[1]
                if (arrow == LINKED_FROM) {
                    arrow = LINKED_TO
                } else if (arrow == LINKED_TO) {
                    arrow = LINKED_FROM
                }
                // reverse the arrow

                str = `${filename}  ${arrow} `.concat(str); // => note  for example
            })
            return str
        }

    }

    /** 
     * @returns the amount of entries in the libdict */
    count_notes() {
        return this.l_entries.length

    }
    /**@returns a string overview of the entire libdict. hardly readable */
    overview(): string {
        let all_keys = this.l_entries.map(([key, value]) => key + " links to: " + value.links_to.join(" - ") + " linked from:  " + value.linked_from.join(" - ")).join(", ")
        return all_keys + "test"
    }


}