
export class FileItem {
    path: string
    extension: string
    links_to: string[]
    linked_from: string[]
    distance_from_CN: number

    constructor(
        path: string,
        extension: string,
        links_to: string[],
        linked_from: string[],
        distance_from_CN: number

    ) {
        this.path = path
        this.extension = extension
        this.links_to = links_to
        this.linked_from = linked_from
        this.distance_from_CN = distance_from_CN
    }

}
export interface DB {
    [index: string]: FileItem
}
export interface Path {
    items: [string, any][]
    all_members: string[]


}
