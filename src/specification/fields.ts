import {
  builtinType,
  enumType,
  Field,
  FieldType,
  nodeType,
  NodeType,
} from "./nodes";
import { ASTSpec } from "./nodes";
import { validName } from "../utils";

export type BuiltinTypes = "string" | "number" | "boolean";
export function isBuiltinType(x: string): x is BuiltinTypes {
  return x === "string" || x === "number" || x === "boolean";
}

/**
 * A subtype of `Field` where we know the field references
 * an AST Node (a child).
 */
export type NodeField = {
  type: NodeType;
  struct: Field["struct"];
};

/** Predicate for identifying a NodeField */
const isNodeField = (x: Field): x is NodeField => {
  return NodeType.is(x.type);
};
/** Another predicate for identifying an entry with a NodeField value */
export const isNodeFieldEntry = (
  x: [string, Field]
): x is [string, NodeField] => {
  return isNodeField(x[1]);
};

/**
 * Parses a string and formulates the FieldType.  This has to
 * cover cases of singleton or unions involving only builtin types or
 * only node types.
 * @param str String to parse
 * @param spec AST specification (used to validate type names)
 * @returns
 */
export function parseType(str: string): FieldType {
  /** If this expresses a union type, split it up */
  const types = str.split("|").map((x) => x.trim());
  /** Ensure every member of the union is a valid type name */
  if (
    types.every((x) => (x[0] === "." ? validName(x.slice(1)) : validName(x)))
  ) {
    /** If they are all builtins, then this is a builtin node */
    if (types.every(isBuiltinType)) {
      return builtinType(new Set(types.filter(isBuiltinType)));
    }
    /** If names start with a '.', assume these are string literals */
    if (types.every((x) => x.startsWith("."))) {
      const tags = types.map((x) => x.slice(1));
      return enumType(tags);
    }
    return nodeType(types);
  } else {
    throw new Error(`${str} is not a valid type name`);
  }
}

/**
 * This function parses the field description.
 *
 * The first step is figuring out the structure and then,
 * once the structure is known, determining the underlying
 * FieldType.
 **/
export function parseField(str: string, spec: ASTSpec): Field {
  /** If it ends with "?", it is optional */
  if (str.endsWith("?")) {
    const type = str.slice(0, str.length - 1);
    return {
      struct: "optional",
      type: parseType(type),
    };
  }
  /** If it ends with "[]" then it is an array */
  if (str.endsWith("[]")) {
    const type = str.slice(0, str.length - 2);
    return {
      struct: "array",
      type: parseType(type),
    };
  }
  /** If it ends with "{}" then it is a map */
  if (str.endsWith("{}")) {
    const type = str.slice(0, str.length - 2);
    return {
      struct: "map",
      type: parseType(type),
    };
  }
  /** Check if this is a set */
  if (str.startsWith("<") && str.endsWith(">")) {
    const type = str.slice(1, str.length - 1);
    return {
      struct: "set",
      type: parseType(type),
    };
  }
  /** If what is left is a valid Javascript identifier, then assume it is a scalar */
  if (str.startsWith(".") || validName(str)) {
    return {
      struct: "scalar",
      type: parseType(str),
    };
  } else {
    throw new Error(`Unrecognized field syntax in '${str}'`);
  }
}
