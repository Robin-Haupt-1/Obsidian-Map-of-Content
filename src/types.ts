export class FileItem {
  // TODO rename this or use the same naming where it's used
  // TODO also, just use an interface ?!
  path: string;
  extension: string;
  linksTo: string[];
  linkedFrom: string[];
  distanceFromCn: number | null;

  constructor(
    path: string,
    extension: string,
    linksTo: string[],
    linkedFrom: string[],
    distanceFromCn: number
  ) {
    this.path = path;
    this.extension = extension;
    this.linksTo = linksTo;
    this.linkedFrom = linkedFrom;
    this.distanceFromCn = distanceFromCn;
  }
}

export interface DB {
  [index: string]: FileItem;
}

export interface Path {
  items: [string, any][];
  allMembers: string[];
}
