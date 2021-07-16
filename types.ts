import { LINKED_TO } from "constants";
import { LINKED_FROM } from "constants";
import { TLI_NAME } from "constants";
import { TFile, App, Vault, Notice, LinkCache, getLinkpath, ValueComponent, Modal } from "obsidian";
import * as path from "path";

export class note {
    file: TFile
    path: string
    links_to: string[]
    linked_from: string[]
    distance_from_TLI: number
    is_linked_to_TLI: boolean

    constructor(
        file: TFile,
        path: string,
        links_to: string[],
        linked_from: string[],
        distance_from_TLI: number,
        is_linked_to_TLI: boolean
    ) {
        this.file = file
        this.path = path
        this.links_to = links_to
        this.linked_from = linked_from
        this.distance_from_TLI = distance_from_TLI
        this.is_linked_to_TLI = is_linked_to_TLI
    }

    sayName() {
        return this.path
    }

}
interface libdict {
    [index: string]: note
}
interface path {
    depth: number
    items: [string, any][]
    all_members: string[]


}

class PATHModal extends Modal {
    paths: string;
    paths_array:string[];
    constructor(app: App, paths: string,paths_array:string[]) {
        super(app);
        this.paths = paths
        this.paths_array=paths_array
    }

    onOpen() {
        let { contentEl } = this;
        contentEl.setText(this.paths);
        this.paths_array.forEach((str)=>{
            contentEl.createEl('h2', { text: str });
        })
        
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}

export class LibKeeper {
    libdict: libdict
    l_entries: any[]
    app: App
    vault: Vault
    declare all_paths: path[]

    constructor(app: App) {
        this.app = app;
        this.all_paths = []
        this.vault = app.vault
        this.libdict = {}
        this.l_entries = Object.entries(this.libdict)
    }


    addNote(note: note) {
        this.libdict[note.path] = note
    }
    get_all_notes(): note[] {
        return this.l_entries.map(([key, value]) => value)
    }
    refresh() {
        // step 1: read files
        let l = this.libdict
        for (let note in l) { { delete l[note]; } }

        let md_files = this.vault.getMarkdownFiles()

        md_files.forEach((file) => {
            if (!file.path.endsWith(".md")) return // unnecessary because mdfiles() only gives .md files
            //new Notice("file.path: "+file.path+"\nfile.basename: "+file.basename+"\nfile.extension: "+file.extension+"\nfile.parent: "+file.parent+"\nfile.stat: "+file.stat+"\nfile.vault: "+file.vault)
            let path = file.path //.slice(0, -3) // remove .md
            let mynote = new note(file, path, [], [], null, false);
            this.addNote(mynote);
        })

        // step 2: analyze links
        this.get_all_notes().forEach((note: note) => {

            let linkcache = this.app.metadataCache.getCache(note.path).links
            if (!linkcache) return // no links
            let this_links_to: string[] = []
            //let links_str = linkcache.map((val: LinkCache) => this.app.metadataCache.getFirstLinkpathDest(val.link, "/").path);
            linkcache.forEach((val: LinkCache) => {
                try { // if the link is not valid it breaks here
                    let link_path = this.app.metadataCache.getFirstLinkpathDest(val.link, "/").path
                    this_links_to.push(link_path)
                }
                catch {




                }


            })
            // let links_str=linkcache.map((val: LinkCache) => val.link); // links without extension or folder
            this.libdict[note.path].links_to = this_links_to

            this_links_to.forEach((link: string) => {
                this.libdict[link].linked_from.push(note.path)
            })

        })



        // step 3: generate path information
        // Todo: implement as non-recursive function that iterates over a single array of paths again and again until there are no more unexplored connections
        // this could result in exponentially growing array (problem?)
        // implement member und linked to/from as interface
        let start_note = TLI_NAME

        let now_paths: path[] = []
        now_paths.push({ depth: 0, items: [[start_note, null]], all_members: [start_note] })
        let explored_paths: path[] = []
        while (now_paths.length > 0) {

            let new_paths: path[] = []

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
            now_paths = new_paths
        }


        //this.all_paths.push()


        new Notice(String(explored_paths.length))
        let all_paths = ""
        let all_paths_array:string[]=[]
        explored_paths.forEach((path: path) => {
            let this_path=this.compilePath(path.items)
            new Notice(this_path)
            all_paths=all_paths.concat("                                    "+this_path)
            all_paths_array.push(this_path)


        })
        new PATHModal(this.app,all_paths,all_paths_array).open()
        /*
        linkcache.forEach(async (val: string) => {
            let link_path = getLinkpath(val)

            new Notice("link path: " + link_path + " from " + val)
            let linked_file = app.metadataCache.getFirstLinkpathDest(val, "/")
            new Notice("basename: " + linked_file.basename)


    })*/
        this.l_entries = Object.entries(this.libdict)
    }

    compilePath(path: [string, string][]): string {
        let str: string = path[0][0] // TLI linkedtoorform is null
        path.slice(1).forEach((path: string[]) => {
            str = str.concat(` ${path[1]} ${path[0]}`); // => note  for example
        })
        return str
    }
    count() {
        return this.l_entries.length

    }
    overview(): string {
        let all_keys = this.l_entries.map(([key, value]) => key + "  " + value.links_to[0] + "  " + value.linked_from[0]).join(", ")

        return all_keys
    }


}

export type LibEntry = {
    internal_file: TFile
    links_to_object: TFile[]
    links_to_string: string[]
    linked_from_object: TFile[]
    linked_from_string: TFile[]
    distance_from_TLI: number
    is_linked_to_TLI: boolean
}
export type LibEntry2 = {
    internal_file: TFile
    links_to: string[]
}
