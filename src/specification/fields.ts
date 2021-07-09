import { ASTSpec } from "./specification";
import { validName } from "./walk";

export type FieldStruct = "scalar" | "optional" | "map" | "array" | "set";

export type BuiltinTypes = "string" | "number" | "boolean";

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

export interface Field {
  type: FieldType;
  struct: FieldStruct;
}

/**
 * A subtype of `Field` where we know the field references
 * an AST Node (a child).
 */
export type NodeField = {
  type: NodeType;
  struct: FieldStruct;
};
/** Predicate for identifying a NodeField */
export const isNodeField = (x: Field): x is NodeField => {
  return x.type.kind === "node";
};
/** Another predicate for identifying an entry with a NodeField value */
export const isNodeFieldEntry = (
  x: [string, Field]
): x is [string, NodeField] => {
  return isNodeField(x[1]);
};

/** Predicate to determine if a string is one of the builtin types */
function isBuiltin(x: string): x is BuiltinTypes {
  switch (x) {
    case "string":
    case "boolean":
    case "number":
      return true;
  }
  return false;
}

/**
 * Parses a string and formulates the FieldType.  This has to
 * cover cases of singleton or unions involving only builtin types or
 * only node types.
 * @param str String to parse
 * @param spec AST specification (used to validate type names)
 * @returns
 */
export function parseType(str: string, spec: ASTSpec): FieldType {
  /** If this expresses a union type, split it up */
  const types = str.split("|").map((x) => x.trim());
  /** Ensure every member of the union is a valid type name */
  if (types.every((x) => validName(x))) {
    /** If they are all builtins, then this is a builtin node */
    if (types.every(isBuiltin)) {
      return {
        kind: "builtin",
        types: types.filter(isBuiltin),
      };
    }
    /** If they are all names of node types, then this is a "node" node */
    if (types.every((x) => spec.names.has(x))) {
      return {
        kind: "node",
        types: types,
      };
    }
    throw new Error(`Unrecognized type name: '${str}'`);
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
      type: parseType(type, spec),
    };
  }
  /** If it ends with "[]" then it is an array */
  if (str.endsWith("[]")) {
    const type = str.slice(0, str.length - 2);
    return {
      struct: "array",
      type: parseType(type, spec),
    };
  }
  /** If what is left is a valid Javascript identifier, then assume it is a scalar */
  if (validName(str)) {
    return {
      struct: "scalar",
      type: parseType(str, spec),
    };
  } else {
    throw new Error(`Unrecognized field syntax in '${str}'`);
  }
}
