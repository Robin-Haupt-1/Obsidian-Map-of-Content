import { TFile, App, Vault, Notice, LinkCache, getLinkpath } from "obsidian";

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
export class libkeeper {
    lib: note[]
    libdict: libdict
    app: App
    vault: Vault
    constructor(app: App) {
        this.lib = [];
        this.app = app;
        this.vault = app.vault
        this.libdict = {}
    }


    add(note: note) {
        this.lib.push(note)
        this.libdict[note.path] = note
    }

    refresh() {
        // step 1. read files
        let l = this.lib
        l.length = 0 // clear lib
        let md_files = this.vault.getMarkdownFiles()

        md_files.forEach((file) => {
            if (!file.path.endsWith(".md")) return // unnecessary because mdfiles() only gives .md files
            //new Notice("file.path: "+file.path+"\nfile.basename: "+file.basename+"\nfile.extension: "+file.extension+"\nfile.parent: "+file.parent+"\nfile.stat: "+file.stat+"\nfile.vault: "+file.vault)
            let path = file.path //.slice(0, -3) // remove .md
            let mynote = new note(file, path, [], [], 1000000, false);
            this.add(mynote);
        })

        // step 2. analyze links
        l.forEach((note: note) => {
            let linkcache = this.app.metadataCache.getCache(note.path).links
            if (!linkcache) return // no links
            let links_str = linkcache.map((val: LinkCache) => this.app.metadataCache.getFirstLinkpathDest(val.link, "/").path);
            // let links_str=linkcache.map((val: LinkCache) => val.link); // links without extension or folder
            note.links_to = links_str
            links_str.forEach((link: string) => {

            })
            /*
            linkcache.forEach(async (val: string) => {
                let link_path = getLinkpath(val)

                new Notice("link path: " + link_path + " from " + val)
                let linked_file = app.metadataCache.getFirstLinkpathDest(val, "/")
                new Notice("basename: " + linked_file.basename)*/

        })

    }
    count() {
        return this.libdict["fi1.md"].path
        return this.lib.length
    }
    overview(): string {
        let array = this.lib.map((note: note) => note.path + " - " + note.links_to.toString()).join("\n\n\n ")
        return array
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
