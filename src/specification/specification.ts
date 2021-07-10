import { ASTBaseType, ASTLeafType, ASTUnionType } from "./nodes";

/** Represents options for the code generator */
export interface Options {
  tagName: string;
  optional: "json" | "expnull" | "purify";
  maps: "json" | "map";
}

/**
 * This is the complete specification of the abstract
 * syntax tree being described and then generated.
 */
export interface ASTSpec {
  names: Set<string>;
  unions: Map<string, ASTUnionType>;
  bases: Map<string, ASTBaseType>;
  leaves: Map<string, ASTLeafType>;
  options: Options;
}
