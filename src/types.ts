export interface FileItem {
  path: string;
  extension: string;
  linksTo: Set<string>;
  linkedFrom: Set<string>;
  distanceFromCn: number | null;
}

export interface DB {
  [index: string]: FileItem;
}

export interface Path {
  items: [string, any][];
  allMembers: string[];
}
