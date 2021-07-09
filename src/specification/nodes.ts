import { Field } from "./fields";

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
  rootUnion: string;
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
