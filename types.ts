
import { TFile, App, Modal } from "obsidian";
export class note {
    file: TFile
    path: string
    extension: string
    links_to: string[]
    linked_from: string[]
    distance_from_TLI: number
    is_linked_to_TLI: boolean
    paths_from_TLI: path[]

    constructor(
        file: TFile,
        path: string,
        extension: string,
        links_to: string[],
        linked_from: string[],
        distance_from_TLI: number,
        is_linked_to_TLI: boolean,
        paths_from_TLI: path[]

    ) {
        this.file = file
        this.path = path
        this.extension = extension
        this.links_to = links_to
        this.linked_from = linked_from
        this.distance_from_TLI = distance_from_TLI
        this.is_linked_to_TLI = is_linked_to_TLI
        this.paths_from_TLI = paths_from_TLI
    }

    sayName() {
        return this.path
    }

    trimPaths(n: number) {
        //Todo: delete all paths longer than n members
    }

}
export interface libdict {
    [index: string]: note
}
export interface path {
    depth: number
    items: [string, any][]
    all_members: string[]


}

export class PATHModal extends Modal {
    paths: string;
    paths_array: string[];
    constructor(app: App, paths: string, paths_array: string[]) {
        super(app);
        this.paths = paths
        this.paths_array = paths_array
    }

    onOpen() {
        let { contentEl } = this;
        contentEl.setText(this.paths);
        this.paths_array.forEach((str) => {
            contentEl.createEl('h2', { text: str });
        })

    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
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
