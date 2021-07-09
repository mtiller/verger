import { ASTSpec } from "./specification";
import { validName } from "./walk";

export type FieldStruct = "scalar" | "optional" | "map" | "array" | "set";

export type BuiltinTypes = "string" | "number" | "boolean";

/** Covers singleton or union */
export interface BuiltinType {
  kind: "builtin";
  types: Array<BuiltinTypes>;
}

export interface EnumType {
  kind: "enum";
  tags: string[];
}

/** Covers singleton or union */
export interface NodeType {
  kind: "node";
  types: string[];
}

export type NodeField = {
  type: NodeType;
  struct: FieldStruct;
};
export const isNodeField = (x: Field): x is NodeField => {
  return x.type.kind === "node";
};

export const isNodeFieldEntry = (
  x: [string, Field]
): x is [string, NodeField] => {
  return isNodeField(x[1]);
};

export interface Field {
  type: FieldType;
  struct: FieldStruct;
}
export type FieldType = BuiltinType | EnumType | NodeType;

function isBuiltin(x: string): x is BuiltinTypes {
  switch (x) {
    case "string":
    case "boolean":
    case "number":
      return true;
  }
  return false;
}

export function parseType(str: string, spec: ASTSpec): FieldType {
  const types = str.split("|").map((x) => x.trim());
  if (types.every((x) => validName(x))) {
    if (types.every(isBuiltin)) {
      return {
        kind: "builtin",
        types: types.filter(isBuiltin),
      };
    }
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
export function parseField(str: string, spec: ASTSpec): Field {
  if (str.endsWith("?")) {
    const type = str.slice(0, str.length - 1);
    return {
      struct: "optional",
      type: parseType(type, spec),
    };
  }
  if (str.endsWith("[]")) {
    const type = str.slice(0, str.length - 2);
    return {
      struct: "array",
      type: parseType(type, spec),
    };
  }
  return {
    struct: "scalar",
    type: parseType(str, spec),
  };
}
