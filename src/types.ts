
export class Note {
    path: string
    extension: string
    links_to: string[]
    linked_from: string[]
    distance_from_TLI: number

    constructor(
        path: string,
        extension: string,
        links_to: string[],
        linked_from: string[],
        distance_from_TLI: number

    ) {
        this.path = path
        this.extension = extension
        this.links_to = links_to
        this.linked_from = linked_from
        this.distance_from_TLI = distance_from_TLI
    }
  
}
export interface DB {
    [index: string]: Note
}
export interface Path {
    items: [string, any][]
    all_members: string[]


}
 