import { devLog } from "../../utils";

export class expandManager {
  constructor() {
    devLog("expandManager created");
  }

  initialMaxIndent = 3;
  redrawCallbacks = [];
  isManuallyExpanded = false;

  expand() {
    if (this.isManuallyExpanded) {
      this.rerenderDescendants(this.initialMaxIndent);
      this.isManuallyExpanded = false;
    } else {
      this.rerenderDescendants(this.initialMaxIndent + 1);
    }
  }

  contract() {
    if (this.initialMaxIndent > 1) {
      this.rerenderDescendants(this.initialMaxIndent - 1);
      this.initialMaxIndent -= 1;
    }
  }

  rerenderDescendants(newMaxIndent) {
    devLog("redrawing, new max_indent " + String(newMaxIndent));
    for (let func of this.redrawCallbacks) {
      func(newMaxIndent);
    }
  }

  registerRedrawDescendantCallback(redraw: Function) {
    this.redrawCallbacks.push(redraw);
  }

  logIndent(indent: number) {
    devLog("indentation registered: " + String(indent));
    if (indent > this.initialMaxIndent) {
      this.initialMaxIndent = indent;
    }
  }

  onManualExpand() {
    this.isManuallyExpanded = true;
  }
}
