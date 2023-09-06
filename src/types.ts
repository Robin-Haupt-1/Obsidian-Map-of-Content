export interface FileItem {
  path: string;
  extension: string;
  linksTo: string[];
  linkedFrom: string[];
  distanceFromCn: number | null;
}

export interface DB {
  [index: string]: FileItem;
}

export interface Path {
  items: [string, any][];
  allMembers: string[];
}
