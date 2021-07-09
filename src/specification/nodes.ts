import { Maybe } from "purify-ts/Maybe";

export interface ASTBaseType {
  name: string;
  extends: string[];
  fields: Map<string, FieldType>;
}

export interface ASTUnionType {
  type: "union";
  name: string;
  subtypes: string[];
}

export function isUnion(a: ASTTree): a is ASTUnionType {
  return a.type === "union";
}

export interface ScalarField {
  type: "scalar";
  name: string;
}

export interface LiteralValues {
  type: "literals";
  tags: string[];
}

export interface NodeField {
  type: "node";
  name: string;
}
export const isNodeField = (x: FieldType): x is NodeField => {
  return x.type === "node";
};
export const isNodeFieldEntry = (
  x: [string, FieldType]
): x is [string, NodeField] => {
  return isNodeField(x[1]);
};

export type FieldType = ScalarField | LiteralValues | NodeField;

export interface ASTLeafType {
  type: "leaf";
  tag: string;
  rootUnion: string;
  name: string;
  extends: string[];
  fields: Map<string, FieldType>;
}

export function isLeaf(a: ASTTree): a is ASTLeafType {
  return a.type === "leaf";
}

export type ASTTree = ASTUnionType | ASTLeafType;
export interface ASTSpec {
  tagName: string;
  names: Set<string>;
  unions: Map<string, ASTUnionType>;
  bases: Map<string, ASTBaseType>;
  leaves: Map<string, ASTLeafType>;
}
