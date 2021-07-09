import { Field, FieldType } from "./fields";

export interface ASTBaseType {
  name: string;
  extends: string[];
  fields: Map<string, Field>;
}

export interface ASTUnionType {
  type: "union";
  name: string;
  subtypes: string[];
}

export function isUnion(a: ASTTree): a is ASTUnionType {
  return a.type === "union";
}

export interface ASTLeafType {
  type: "leaf";
  tag: string;
  rootUnion: string;
  name: string;
  extends: string[];
  fields: Map<string, Field>;
}

export function isLeaf(a: ASTTree): a is ASTLeafType {
  return a.type === "leaf";
}

export type ASTTree = ASTUnionType | ASTLeafType;
