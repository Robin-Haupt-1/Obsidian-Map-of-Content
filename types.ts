import { TFile, App, Vault, Notice } from "obsidian";

export class note {
    file: TFile
    path: string
    links_to: string[]
    linked_from: string[]
    distance_from_TLI: number
    is_linked_to_TLI: boolean

    constructor(file: TFile,
        path: string,
        links_to: string[],
        linked_from: string[],
        distance_from_TLI: number,
        is_linked_to_TLI: boolean) {
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

export class libkeeper {
    lib: note[]
    app: App
    vault: Vault
    constructor(app: App) {
        this.lib = [];
        this.app = app;
        this.vault = app.vault
    }


    add(note: note) {
        this.lib.push(note)
    }

    refresh() {
        let l = this.lib
        l.length=0 // clear lib
        const v: Vault = this.vault
        const md_files = v.getMarkdownFiles()

        md_files.forEach((file) => {
            if (!file.path.endsWith(".md")) return // unnecessary

            let path = file.path.slice(0, -3) // remove .md
            let mynote = new note(file, path, [], [], 1000000, false);
            this.add(mynote);
        })

	}
    count() {
        return this.lib.length
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
