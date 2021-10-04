import type MOCView from "./view"
export const CENTRAL_NOTE_PATH_DEFAULT = "Central Note.md"
export const LINKED_TO = " => "
export const LINKED_FROM = " <= "
export const LINKED_CN = "None"
export const LINKED_BOTH = " <=> "
export const MOC_VIEW_TYPE = "map-of-content"


export interface ViewCallback{
    (view:MOCView):void;
}
