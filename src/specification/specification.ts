import { ASTBaseType, ASTLeafType, ASTUnionType } from "./nodes";

export interface Options {
  optional: "json" | "expnull" | "purify";
  maps: "json" | "map";
}

export interface ASTSpec {
  tagName: string;
  names: Set<string>;
  unions: Map<string, ASTUnionType>;
  bases: Map<string, ASTBaseType>;
  leaves: Map<string, ASTLeafType>;
  options: Options;
}
