import type MOCPlugin from "../../main";
import {
  GetDisplayName,
  IsCtrlPressed,
  NavigateToFile,
  Log,
} from "../../utils";
import { onMount } from "svelte";

export class expandManager {
  constructor() {
    Log("expandManager created");
  }

  initial_max_indent = 3;
  redrawCallbacks = [];
  manually_expanded = false;

  expand() {
    if (this.manually_expanded) {
      this.rerenderDescendants(this.initial_max_indent);
      this.manually_expanded = false;
    } else {
      this.rerenderDescendants(this.initial_max_indent + 1);
    }
  }

  contract() {
    if (this.initial_max_indent > 1) {
      this.rerenderDescendants(this.initial_max_indent - 1);
      this.initial_max_indent -= 1;
    }
  }

  rerenderDescendants(new_max_indent) {
    Log("redrawing, new max_indent " + String(new_max_indent));
    for (let func of this.redrawCallbacks) {
      func(new_max_indent);
    }
  }
  registerRedrawDescendantCallback(redraw: Function) {
    this.redrawCallbacks.push(redraw);
  }

  logIndent(indent: number) {
    Log("indentation registered: " + String(indent));
    if (indent > this.initial_max_indent) {
      this.initial_max_indent = indent;
    }
  }
  onManualExpand() {
    this.manually_expanded = true;
  }
}
