import { LINKED_BOTH, LINKED_TLI, LINKED_TO, TLI_NOTE_PATH_DEFAULT } from "./constants";
import { LINKED_FROM } from "./constants";
import type { TFile, App, Vault, LinkCache, getLinkpath, ValueComponent, Modal } from "obsidian";
import { Notice } from 'obsidian'
import { note, libdict, path } from './types'
import { fileNameFromPath, getDisplayName } from "./utils"
import type TLIPlugin from "./main"
import { log } from "./utils";


/**
 * 
 * Todo: maybe delete depth parameter from path object
 */

export class LibKeeper {
    libdict: libdict
    l_entries: any[]
    app: App
    plugin: TLIPlugin
    vault: Vault
    all_paths: path[]
    get_paths_ran: number
    descendants: Map<string, string[]>
    duplicate_file_status: Map<string, boolean> // Todo: map with the count instead of binary status to count up/down on file rename

    constructor(app: App, plugin: TLIPlugin) {
        this.app = app;
        this.plugin = plugin
        this.all_paths = []
        this.vault = app.vault
        this.libdict = {}
        this.l_entries = Object.entries(this.libdict)
        this.updateEverything()
    }
    updateEverything(update_lib: boolean = true) {
        new Notice('Updating paths...');
        log("Updating paths")
        if (update_lib) this.updateLib()
        this.updatePaths()
        this.updateDescendants()
        new Notice("Paths updated")
        log("Update complete")
    }
    /**Return the internal note representation object for a given path */
    getNoteByPath(path: string) {
        if (path in this.libdict) {
            return this.libdict[path]
        }

    }

    /** return all paths that include a certain note. Only return the path up to that note*/
    findPaths(path: string): path[] {
        let filtered_paths: path[] = []
        let filtered_paths_json = JSON.stringify(filtered_paths)
        this.all_paths.forEach((p: path) => {
            if (p.all_members.includes(path)) {
                if (p.all_members.last() == path) {
                    filtered_paths.push(p)

                } else {
                    let index = p.all_members.indexOf(path) + 1
                    let chopped_of_path = p.items.slice(0, index)
                    if (!filtered_paths_json.includes(JSON.stringify(chopped_of_path))) {
                        // return a path element containing only the parts of the path information up to the note in question
                        // Todo: make sure depth:index-1 is correct
                        filtered_paths.push({ all_members: p.all_members.slice(0, index), depth: index - 1, items: p.items.slice(0, index) })
                        filtered_paths_json = JSON.stringify(filtered_paths)
                    }
                }


            }
        })

        return filtered_paths

    }

    get_all_notes(): note[] {
        return this.l_entries.map(([key, value]) => value)
    }

    async updateLib() {
        // step 1: update the plugins internal representation of all notes in the vault
        log("Updating the library...", true)
        // delete old state
        let l = this.libdict
        for (let note in l) { delete l[note]; }
        // read all files
        let vault_files = this.vault.getFiles()
        this.duplicate_file_status = new Map<string, boolean>();
        log("total files in collection: " + String(vault_files.length), true)

        // check for duplicate files
        let checked_files = 0
        vault_files.forEach((file) => {
            let file_name = fileNameFromPath(file.path)
            // logging
            checked_files += 1
            if (checked_files % 1000 == 0) {
                log("checked for duplicates " + String(checked_files), true)
            }
            if (this.duplicate_file_status.has(file_name)) { // If the file name is encountered twice or more, set it's duplicate status to true
                this.duplicate_file_status.set(file_name, true)
            } else {
                this.duplicate_file_status.set(file_name, false)
            }


        })

        // create new library entries
        checked_files = 0
        vault_files.forEach((file) => {
            // logging
            checked_files += 1
            if (checked_files % 1000 == 0) {
                log("created new lib entries " + String(checked_files), true)
            }
            let path = file.path
            let new_note = new note(file, path, file.extension, [], [], null, false, []);

            // update the libdict and the l_entries representation of it
            this.libdict[new_note.path] = new_note
            this.l_entries = Object.entries(this.libdict)
        })

        // step 2: analyze links
        let all_notes = this.get_all_notes()
        log("total number of notes in library: " + String(all_notes.length), true)
        log("analyzing links", true)
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
    async updateDepthInformation() {
        log("Analyzing distance from TLI. Tli path: " + this.plugin.getTliPath(), true)
        let depth = 0 // distance from the TLI. starts at zero 
        let checked_links: string[] = []  // all the notes that have already been visited. dont visit them again to prevent endless loops
        let do_continue = true
        // start at the the TLI
        let links = [this.plugin.getTliPath()]
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
        if (this.get_paths_ran % 1000 == 0) {
            log("get paths ran " + String(this.get_paths_ran), true)
            log(path_so_far.all_members.join(" "), true)
        }

        let note = this.libdict[path_so_far.all_members.last()]
        let depth = path_so_far.depth
        let all_members = path_so_far.all_members
        let items = path_so_far.items

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
        let called_itself: number = 0 // how often the function called itself
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
                    if ((path.depth - last_item.distance_from_TLI) > 0) {
                        return
                    }
                } else {
                    if ((path.depth - last_item.distance_from_TLI) > 0) {
                        return
                    }
                }
            }
            this.followPaths(path)
            called_itself += 1
        })
        if (called_itself == 0) {
            // only add the path if it does't lead anywhere else. No need to have paths that are parts of other paths
            //note.paths_from_TLI.push(path_so_far)
            this.all_paths.push(path_so_far)
        }





    }

    async updatePathsRecursively() {
        //this.updateLib()
        this.all_paths.length = 0
        let path_so_far: path = { depth: 0, all_members: [this.plugin.getTliPath()], items: [[this.plugin.getTliPath(), LINKED_TLI]] }
        this.followPaths(path_so_far)

    }
    /** for every note, store all notes that come right after it in any path. this is for generating the Map Of Content later on */
    async updateDescendants() {

        // delete old Information
        this.descendants = new Map()

        let descendants_run = 0
        this.all_paths.forEach((p: path) => {

            p.all_members.forEach((note_path: string, index: number) => {

                if (!(index == p.all_members.length - 1)) {
                    if (!this.descendants.has(note_path)) {
                        this.descendants.set(note_path, [])
                    }
                    descendants_run += 1
                    // logging
                    descendants_run += 1
                    if (descendants_run % 1000 == 0) {
                        log("descendants ran " + String(descendants_run), true)
                    }
                    let next_path_member = p.all_members[index + 1]
                    // add note as descendant if it isn't already stored in array
                    if (!this.descendants.get(note_path).includes(next_path_member)) {
                        this.descendants.set(note_path, this.descendants.get(note_path).concat(next_path_member))
                    }
                }

            }

            )
        })

    }
    async updatePaths() {
        this.get_paths_ran = 0
        await this.updateDepthInformation()
        await this.updatePathsRecursively()
        await this.updateDescendants()


    }
    /**
     * @returns a [string, string[]][] of all descendants and their descendants. recursive function
     * @param starting_path note to start with
     * @param levels how many levels to go down
     * @todo figure out how to correctly specify the types of the arrays
     */
    getDescendants(starting_path: string, levels: number = 3) {
        log("descendants runing: " + starting_path, true)
        let return_array: any[] = [starting_path, []]
        if (this.descendants.has(starting_path)) {
            let descendants = this.descendants.get(starting_path)
            if (levels > 0) {
                descendants.forEach((note_path: string) => {
                    let second_descendants = this.getDescendants(note_path, levels = levels - 1)
                    return_array[1].push([starting_path, return_array])

                })
            }
        }
        return return_array

    }
    /**deprecated: compile a path object into a string Todo: delete*/
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