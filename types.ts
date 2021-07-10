import { TFile } from "obsidian";

export type LibEntry ={
    internal_file:TFile
    links_to_object:TFile[]
    links_to_string:string[]
    linked_from_object:TFile[]
    linked_from_string:TFile[]
    distance_from_TLI:number
    is_linked_to_TLI:boolean
}
export type LibEntry2 ={
    internal_file:TFile
    links_to:string[]
}