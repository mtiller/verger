import { BuiltinTypes, Field } from "./fields";

/** Covers singleton or union */
export interface BuiltinType {
  kind: "builtin";
  types: Array<BuiltinTypes>;
}

/** Represents a string enumeration */
export interface EnumType {
  kind: "enum";
  tags: string[];
}

/** Covers singleton or union */
export interface NodeType {
  kind: "node";
  types: string[];
}

/** The union of possible field types */
export type FieldType = BuiltinType | EnumType | NodeType;

/**
 * This is just a simple interface (that will not appear
 * in any union) for storing information about fields.
 **/
export interface ASTBaseType {
  name: string;
  extends: string[];
  fields: Map<string, Field>;
}

/**
 * This is used to represent a union type node
 */
export interface ASTUnionType {
  type: "union";
  name: string;
  subtypes: string[];
}

/** A predicate for identifying union nodes */
export function isUnion(a: ASTTree): a is ASTUnionType {
  return a.type === "union";
}

/**
 * This is used to represent leave nodes
 */
export interface ASTLeafType {
  type: "leaf";
  tag: string;
  rootUnion: ASTUnionType;
  parentUnion: ASTUnionType;
  name: string;
  extends: string[];
  fields: Map<string, Field>;
}

/** Predicate for identifying leaf nodes */
export function isLeaf(a: ASTTree): a is ASTLeafType {
  return a.type === "leaf";
}

/** This is our ASTTree type which is just a basic union of union types and leaf types. */
export type ASTTree = ASTUnionType | ASTLeafType;
