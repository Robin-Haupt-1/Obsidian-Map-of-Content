import { LINKED_BOTH, LINKED_CN as LINKED_CN, LINKED_TO , LINKED_FROM} from "./constants"; 
import type {  App, Vault, LinkCache } from "obsidian";
import { Notice } from 'obsidian'
import { Note, DB, Path } from './types'
import { FileNameFromPath } from "./utils"
import type MOCPlugin from "./main"
import { Log } from "./utils";


export class DBManager {
    db: DB
    db_entries: any[]
    app: App
    plugin: MOCPlugin
    vault: Vault
    all_paths: Path[]
    get_paths_ran: number
    descendants: Map<string, string[]>
    duplicate_file_status: Map<string, boolean>
    database_complete:boolean // whether the db etc. are in a good state and can be used

    constructor(app: App, plugin: MOCPlugin) {
        this.app = app;
        this.plugin = plugin
        this.all_paths = []
        this.db = {}
        this.db_entries = Object.entries(this.db)
        this.update()
    }

    update() {
        this.database_complete=false

        // make sure the Central note exists
        if(!this.plugin.CNexists()){
            new Notice("Central note '"+this.plugin.getCNPath()+"' does not exist")
            return
        }

        // save timestamp for tracking duration of rebuilding
        let start_tmsp = Date.now()

        new Notice('Rebuilding Map of Content...');
        Log("Rebuilding Map of Content...")

        // update db
        this.updateDB()
        this.get_paths_ran = 0
        this.updateDepthInformation() 

        // delete old path information
        this.all_paths.length = 0
        let path_so_far: Path = { all_members: [this.plugin.getCNPath()], items: [[this.plugin.getCNPath(), LINKED_CN]] }
        this.followPaths(path_so_far) 
        this.updateDescendants()

        // mark database as complete
        this.database_complete=true
        new Notice("Rebuilding complete")
        Log("Rebuilding complete")


        let end_tmsp = Date.now()
        Log("Took " + String((end_tmsp - start_tmsp) / 1000))

    }

    /**Return the internal note representation object for a given path */
    getNoteFromPath(path: string) {
        if (path in this.db) {
            return this.db[path]
        }

    }

    /** return all paths that include a certain note. Only return the path up to that note*/
    findPaths(path: string): Path[] {
        let filtered_paths: Path[] = []
        let filtered_paths_json = JSON.stringify(filtered_paths)
        this.all_paths.forEach((p: Path) => {
            if (p.all_members.includes(path)) {
                if (p.all_members.last() == path) {
                    filtered_paths.push(p)

                } else {
                    let index = p.all_members.indexOf(path) + 1
                    let chopped_of_path = p.items.slice(0, index)
                    if (!filtered_paths_json.includes(JSON.stringify(chopped_of_path))) {
                        // return a path element containing only the parts of the path information up to the note in question
                        filtered_paths.push({ all_members: p.all_members.slice(0, index), items: p.items.slice(0, index) })
                        filtered_paths_json = JSON.stringify(filtered_paths)
                    }
                }


            }
        })

        return filtered_paths

    }

    all_notes(): Note[] {
        return this.db_entries.map(([key, value]) => value)
    }

    updateDB() {
        // step 1: update the plugins internal representation of all notes in the vault
        Log("Updating the library...", true)
        // delete old state 
        for (let note in this.db) { delete this.db[note]; }
        // read all files
        let vault_files = this.app.vault.getFiles()
        this.duplicate_file_status = new Map<string, boolean>();
        Log("Total number of files in vault: " + String(vault_files.length), true)

        // check for duplicate files
        let checked_files = 0
        vault_files.forEach((file) => {
            let file_name = FileNameFromPath(file.path)
            // logging
            checked_files += 1
            if (checked_files % 1000 == 0) {
                Log("checked for duplicates: " + String(checked_files), true)
            }
            if (this.duplicate_file_status.has(file_name)) { // If the file name is encountered twice or more, set it's duplicate status to true
                this.duplicate_file_status.set(file_name, true)
            } else {
                this.duplicate_file_status.set(file_name, false)
            }


        })

        // create new db entries
        checked_files = 0
        vault_files.forEach((file) => {
            // logging
            checked_files += 1
            if (checked_files % 1000 == 0) {
                Log("Created new db entries: " + String(checked_files), true)
            }
            let path = file.path
            let new_note = new Note(path, file.extension, [], [], null);

            // update the db
            this.db[new_note.path] = new_note

        })
        // update the db_entries representation of the db
        this.db_entries = Object.entries(this.db)

        // step 2: analyze links 
        Log("analyzing links", true)
        this.all_notes().forEach((note: Note) => {
            if (note.extension != "md") {
                // skip if its not an md file. Other file types can't link to anything
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

            // save links_to information to db
            this.db[note.path].links_to = this_links_to

            // second: add a "linked_from" reference to the db entry of all notes that are linked to from this note
            this_links_to.forEach((link: string) => {
                if (!this.db[link].linked_from.includes(note.path)) {
                    this.db[link].linked_from.push(note.path)
                }
            })
        })
    }

    /** starting from the CN, follow all paths and store the information on how long the shortest path to each note is*/
    updateDepthInformation() {
        Log("Analyzing distance from Central Note. CN path: " + this.plugin.getCNPath(), true)
        let depth = 0 // distance from the CN. starts at zero 
        let checked_links: string[] = []  // all the notes that have already been visited. dont visit them again to prevent endless loops
        let do_continue = true
        // start at the the CN
        let links = [this.plugin.getCNPath()]
        while (do_continue) {
            let next_links: string[] = []
            links.forEach((link: string) => {
                // extract all active and passive connections (linked to or from) for the next iteration of link-following
                let note = this.getNoteFromPath(link)
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
                // update the info on how far the note is removed from CN
                if (note.distance_from_CN == null || note.distance_from_CN > depth) {
                    note.distance_from_CN = depth
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
     * Recursive function that follows all possible paths from the CN that aren't unreasonably long or circular and stores them
     * @param path_so_far the path to be extended in this iteration
     */
    followPaths(path_so_far: Path) {
        // logging
        this.get_paths_ran += 1 
        if (this.get_paths_ran % 10000 == 0) {
            Log("get paths ran " + String(this.get_paths_ran), true) 
        }

        let note = this.db[path_so_far.all_members.last()]
        let all_members = path_so_far.all_members
        let items = path_so_far.items

        let new_paths_to_follow: Path[] = []
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
            let new_path: Path = { all_members: all_members.concat(link), items: items.concat([[link, linked_to_or_both_ways]]) }
            new_paths_to_follow.push(new_path)
        })

        note_linked_from.forEach((link: string) => {
            let new_path: Path = { all_members: all_members.concat(link), items: items.concat([[link, LINKED_FROM]]) }
            new_paths_to_follow.push(new_path)
        })
        let called_itself: boolean = false // whether the function called itself

        // function calls itself to explore every new path  
        new_paths_to_follow.forEach((path: Path) => {
            // the path without the next note that is to be explored
            let all_items_so_far = path.all_members.slice(0, -1)
            let last_item_path = path.all_members.last()
            let last_item = this.getNoteFromPath(last_item_path)

            // stop if this note is already part of the explored path
            if (all_items_so_far.includes(last_item_path)) {
                return
            }

            // stop if the path meanders too much 
            if ((path.all_members.length - last_item.distance_from_CN) > 1) {
                return
            }
 
            this.followPaths(path)
            called_itself = true
        })
        if (!called_itself) {
            // only add the path if it does't lead anywhere else. No need to have paths that are parts of other paths
            this.all_paths.push(path_so_far)
        }

    } 

    /** for every note, store all notes that come right after it in any path. this is for generating the Map Of Content later on */
    updateDescendants() {

        // delete old Information
        this.descendants = new Map()

        let descendants_ran = 0
        this.all_paths.forEach((p: Path) => {

            p.all_members.forEach((note_path: string, index: number) => {

                // make sure it's not the last member of the path
                if (!(index == p.all_members.length - 1)) {
                    // create entry in descendants if it doesn't exist
                    if (!this.descendants.has(note_path)) {
                        this.descendants.set(note_path, [])
                    } 
                    // logging
                    descendants_ran += 1
                    if (descendants_ran % 1000 == 0) {
                        Log("descendants ran " + String(descendants_ran), true)
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

   


}