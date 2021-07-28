// Todo: index TLI by parent note(s) to allow for live path rebuilding taking into account diverging paths to the note 
// that are significant because they are very different (another great idea: just compare how many notes are different from the shortest existing path,
// weighted by closeness to TLI)


import { LINKED_BOTH, LINKED_TLI, LINKED_TO } from "./constants";
import { LINKED_FROM } from "./constants";
import { TLI_NAME } from "./constants";
import { TFile, App, Vault, Notice, LinkCache, getLinkpath, ValueComponent, Modal } from "obsidian";
import { LibEntry, LibEntry2, note, libdict, path, PATHModal } from './types'
import { strict } from "assert";
import { pathToFileURL } from "url";
import { networkInterfaces } from "os";


export class LibKeeper {
    libdict: libdict
    l_entries: any[]
    app: App
    vault: Vault
    declare all_paths: path[]
    get_paths_ran: number
    duplicate_file_status: Map<string, boolean> // Todo: map with the count instead of binary status to count up/down on file rename

    constructor(app: App) {
        this.app = app;
        this.all_paths = []
        this.vault = app.vault
        this.libdict = {}
        this.l_entries = Object.entries(this.libdict)
        this.updateLib()
        this.updatePaths()
        //this.updatePathslinearly()
    }

    getNoteByPath(path: string) {
        if (path in this.libdict) {
            return this.libdict[path]
        }

    }
    findPaths(filename: string): path[] {
        let filtered_paths: path[] = []

        this.all_paths.forEach((p: path) => {
            //new Notice(String(p.all_members))
            if (p.all_members.includes(filename)) {
                if (p.all_members.last() == filename) {
                    filtered_paths.push(p)
                }

            }
        })
        if (filtered_paths.length > 0) {
            return filtered_paths
        }
    }

    addNote(note: note) {
        this.libdict[note.path] = note
        this.l_entries = Object.entries(this.libdict)

    }
    get_all_notes(): note[] {
        return this.l_entries.map(([key, value]) => value)
    }
    updateLib() {
        console.log("updating lib")
        // step 1: read files
        let l = this.libdict
        for (let note in l) { { delete l[note]; } }

        let md_files = this.vault.getFiles()
        this.duplicate_file_status = new Map<string, boolean>();

        console.log("md files in collection: " + String(md_files.length))
        console.log("checking for duplicate files")
        md_files.forEach((file) => {


            let file_name = this.fileNameFromPath(file.path)

            console.log(file_name)
            if (this.duplicate_file_status.has(file_name)) { // If the file name is encountered twice or more, set it's duplicate status to true
                this.duplicate_file_status.set(file_name, true)
                //console.log("duplicate: " + file_name)
            } else {
                this.duplicate_file_status.set(file_name, false)
                //console.log("unique so far: " + file_name)
            }

            //console.log(filename[0])
            //console.log(file.extension)
            //let mynote = new note(file,path, path, file.extension, [], [], null, false, []);
            //this.addNote(mynote);

        })
        md_files.forEach((file) => {
            return
            let path = file.path //.slice(0, -3) // remove .md
            //console.log(path)

            let filename = path.split("/")
            let file_name = filename.last()
            if (this.duplicate_file_status.get(file_name)) {
                this.duplicate_file_status.set(file_name, true)
                console.log("duplicate: " + file_name)
            } else {

                console.log("unique: " + file_name)
            }


            //console.log(filename[0])
            //console.log(file.extension)
            //let mynote = new note(file,path, path, file.extension, [], [], null, false, []);
            //this.addNote(mynote);
        })

        console.log("creating lib entries")
        md_files.forEach((file) => {
            //console.log("creating lib entry for " + file.path)
            //if (!file.path.endsWith(".md")) return // unnecessary because mdfiles() only gives .md files
            //new Notice("file.path: "+file.path+"\nfile.basename: "+file.basename+"\nfile.extension: "+file.extension+"\nfile.parent: "+file.parent+"\nfile.stat: "+file.stat+"\nfile.vault: "+file.vault)
            let path = file.path //.slice(0, -3) // remove .md
            //console.log(file.extension)


            let mynote = new note(file, path, file.extension, [], [], null, false, []);
            this.addNote(mynote);
        })

        // step 2: analyze links
        let all_notes = this.get_all_notes()
        console.log("total number of notes in lib: " + String(all_notes.length))
        console.log("analysiere links")
        all_notes.forEach((note: note) => {
            //console.log("analysiere links für: " + note.path)
            if (note.extension != "md") {
                //console.log("überspringe weil nicht .md: " + note.path)
                return
            }

            //console.log("reading links of" + note.path)
            let linkcache = this.app.metadataCache.getCache(note.path).links
            if (!linkcache) return // no links
            let this_links_to: string[] = []
            //let links_str = linkcache.map((val: LinkCache) => this.app.metadataCache.getFirstLinkpathDest(val.link, "/").path);
            linkcache.forEach((val: LinkCache) => {
                let link_path = this.app.metadataCache.getFirstLinkpathDest(val.link, "/") // check if the link is not valid 
                if (link_path) {
                    this_links_to.push(link_path.path)

                }


            })
            // let links_str=linkcache.map((val: LinkCache) => val.link); // links without extension or folder
            this.libdict[note.path].links_to = this_links_to

            this_links_to.forEach((link: string) => {
                //console.log("working on linked from of " + link)
                if (!this.libdict[link].linked_from.contains(note.path)) { // is this neccessary ?
                    this.libdict[link].linked_from.push(note.path)
                }
            })

        })


    }

    updatePathslinearly() {


        // step 3: generate path information
        // implemented as non-recursive function that iterates over a single array of paths again and again until there are no more unexplored connections
        // this could result in exponentially growing array (problem?)
        // implement member und linked to/from as interface
        let start_note = TLI_NAME

        let now_paths: path[] = []
        now_paths.push({ depth: 0, items: [[start_note, null]], all_members: [start_note] })
        let explored_paths: path[] = []
        let new_paths: path[] = []
        while (now_paths.length > 0) {

            now_paths.forEach((this_path: path) => {

                let depth = this_path.depth + 1
                let last_member_name = this_path.items.last()[0]
                new Notice(last_member_name)
                this.libdict[last_member_name].links_to.forEach((link: string) => {
                    if (!this_path.all_members.includes(link)) {
                        new_paths.push({ depth: depth, items: this_path.items.concat([[link, LINKED_TO]]), all_members: this_path.all_members.concat([link]) })
                    }

                })

                this.libdict[last_member_name].linked_from.forEach((link: string) => {
                    if (!this_path.all_members.includes(link)) {
                        new_paths.push({ depth: depth, items: this_path.items.concat([[link, LINKED_FROM]]), all_members: this_path.all_members.concat([link]) })
                    }

                })

                explored_paths.push(this_path)

            })
            now_paths = new_paths.slice()
            new_paths.length = 0
        }


        //this.all_paths.push()


        new Notice(String(explored_paths.length))
        let all_paths = ""
        let all_paths_array: string[] = []
        explored_paths.forEach((path: path) => {
            let this_path = this.compilePath(path.items)
            new Notice(this_path)
            all_paths = all_paths.concat("                                    " + this_path)
            all_paths_array.push(this_path)


        })

        new PATHModal(this.app, all_paths, all_paths_array).open()

        /*
        linkcache.forEach(async (val: string) => {
            let link_path = getLinkpath(val)

            new Notice("link path: " + link_path + " from " + val)
            let linked_file = app.metadataCache.getFirstLinkpathDest(val, "/")
            new Notice("basename: " + linked_file.basename)
        })*/
        this.all_paths = explored_paths
        this.l_entries = Object.entries(this.libdict)
    }

    updateDepthInformation() {
        console.log("analysiere tiefe")
        let depth = 0
        let docontinue = true
        let links = [TLI_NAME]
        let checked_links: string[] = []
        let times_checked_depth = 0
        while (docontinue) {

            let next_links: string[] = []
            links.forEach((link: string) => {
                times_checked_depth += 1

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
                note.is_linked_to_TLI = true
                if (note.distance_from_TLI == null || note.distance_from_TLI > depth) {
                    note.distance_from_TLI = depth
                }
                checked_links.push(link)
            })
            links = next_links.slice()
            if (links.length == 0) {
                docontinue = false
            }
            depth += 1

        }
        console.log("checked depth times: " + times_checked_depth)

    }

    followPaths(path_so_far: path) {
        this.get_paths_ran += 1
        if (this.get_paths_ran % 100 == 0) {
            console.log("get paths ran " + String(this.get_paths_ran))
        }

        let notepath = path_so_far.all_members.last()
        //console.log(notepath)

        let next_links: String[] = []
        //let note = this.getNoteByPath(notepath)
        let note = this.libdict[notepath]
        let depth = path_so_far.depth
        let all_members = path_so_far.all_members
        let items = path_so_far.items

        note.paths_from_TLI.push(path_so_far)
        this.all_paths.push(path_so_far)
        note.is_linked_to_TLI = true
        note.distance_from_TLI = depth
        let new_paths_to_follow: path[] = []
        let note_links_to = note.links_to.slice()
        let note_linked_from = note.linked_from.slice()

        note_links_to.forEach((link: string) => {
            //console.log("links to " + String(link))
            // check if a note is both linked from this note and it links to this note
            let linked_to_or_both_ways = LINKED_TO
            if (note_linked_from.contains(link)) {
                let index = note_linked_from.indexOf(link, 0);
                if (index > -1) {
                    console.log("lösche aus linked from array: " + link)
                    console.log("alte lengh: " + String(note_linked_from.length))
                    note_linked_from.splice(index, 1);
                    console.log("neue lengh: " + String(note_linked_from.length))

                    console.log("array: " + String(note_linked_from))
                }
                linked_to_or_both_ways = LINKED_BOTH

            }
            let new_path: path = { depth: depth + 1, all_members: all_members.concat(link), items: items.concat([[link, linked_to_or_both_ways]]) }
            new_paths_to_follow.push(new_path)
        })

        note_linked_from.forEach((link: string) => {
            //console.log("linked from " + String(link))
            let new_path: path = { depth: depth + 1, all_members: all_members.concat(link), items: items.concat([[link, LINKED_FROM]]) }
            new_paths_to_follow.push(new_path)
        })

        new_paths_to_follow.forEach((path: path) => {
            let all_items_so_far = path.all_members.slice(0, -1)

            let last_item_path = path.all_members.last()
            let last_item = this.getNoteByPath(last_item_path)
            if (!last_item) {
                return
            }

            if (all_items_so_far.includes(last_item_path)) {
                //console.log("uberspringe pfad weil recursive: " + this.compilePath(path.items))
                return
            }

            if (last_item.distance_from_TLI) {
                if (path.all_members.length < 6) {
                    if ((path.depth - last_item.distance_from_TLI) > 1) {
                        //console.log("überspringe pfad weil zu lang: " + this.compilePath(path.items))
                        //console.log("last item: " + last_item_path)
                        //console.log("depth: " + path.depth)
                        //console.log("last item tli n: " + last_item.distance_from_TLI)
                        return
                    }
                } else {
                    if ((path.depth - last_item.distance_from_TLI) > 0) {
                        //console.log("überspringe pfad weil zu lang: " + this.compilePath(path.items))
                        //console.log("last item: " + last_item_path)
                        //console.log("depth: " + path.depth)
                        //console.log("last item tli n: " + last_item.distance_from_TLI)
                        return
                    }
                }
            }

            if (path.depth > 10) {
                //console.log("uberspringe pfad weil länger als 10")
                //return
            }
            //console.log("following path " + this.compilePath(path.items))
            this.followPaths(path)
        })





    }

    updatePathsRecursively() {
        //this.updateLib()
        this.all_paths = []
        let path_so_far: path = { depth: 0, all_members: [TLI_NAME], items: [[TLI_NAME, LINKED_TLI]] }
        let tli = this.getNoteByPath(TLI_NAME)
        console.log("links to len: " + tli.links_to.length)
        this.followPaths(path_so_far)

    }

    updatePaths() {
        this.get_paths_ran = 0
        this.updateDepthInformation()
        this.updatePathsRecursively()
    }

    cleanExtension(path: string, extension: string = ".md") {
        if (path.endsWith(extension)) {
            return path.slice(0, -extension.length)
        }
        return path
    }
    fileNameFromPath(path: string): string {
        return path.split("/").last()
    }
    getDisplayName(path: string): string {
        // return the full path if there are two or more notes with the same filename and extension, else only the name of file
        let file_name = this.fileNameFromPath(path)
        let display_name = null

        if (this.duplicate_file_status.get(file_name)) {
            display_name = this.cleanExtension(path)
        } else {
            display_name = this.cleanExtension(file_name)
        }
        return display_name
    }
    compilePath(path: [string, string][], reverse: Boolean = false): string {
        let str: string = this.getDisplayName(path[0][0]) // TLI linkedtoorform is null
        if (reverse == true) {
            path.slice(1).forEach((path: string[]) => {
                let filename = this.getDisplayName(path[0])
                str = str.concat(` ${path[1]} ${filename}`); // => note  for example
            })
            return str
        }
        else {


            path.slice(1).forEach((path: string[]) => {
                let filename = this.getDisplayName(path[0])

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
    count() {
        return this.l_entries.length

    }
    overview(): string {
        let all_keys = this.l_entries.map(([key, value]) => key + "  " + value.links_to[0] + "  " + value.linked_from[0]).join(", ")

        return all_keys
    }


}
