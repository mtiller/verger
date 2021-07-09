import { registerDynamic } from "clipanion/lib/core";
import { Just, Maybe, Nothing } from "purify-ts/Maybe";
import { scalarOptions } from "yaml";

export interface ASTUnionType {
  type: "union";
  name: string;
  subtypes: string[];
}

export function isUnion(a: ASTTree): a is ASTUnionType {
  return a.type === "union";
}

export interface ASTBaseType {
  type: "base";
  name: string;
  extends: Maybe<string>;
  fields: Map<string, FieldType>;
}

export function isBase(a: ASTTree): a is ASTBaseType {
  return a.type === "base";
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
    return x.type==="node";
}
export const isNodeFieldEntry = (x: [string, FieldType]): x is [string, NodeField] => {
    return isNodeField(x[1]);
}

export type FieldType = ScalarField | LiteralValues | NodeField;

export interface ASTLeafType {
  type: "leaf";
  tag: string;
  rootUnion: string;
  name: string;
  extends: Maybe<string>;
  fields: Map<string, FieldType>;
}

export function isLeaf(a: ASTTree): a is ASTLeafType {
  return a.type === "leaf";
}

export type ASTTree = ASTUnionType | ASTBaseType | ASTLeafType;
export interface ASTSpec {
  tagName: string;
  names: Set<string>;
  unions: Map<string, ASTUnionType>;
  bases: Map<string, ASTBaseType>;
  leaves: Map<string, ASTLeafType>;
}

export function createASTTree(spec: any): ASTSpec {
  const types: ASTSpec = {
    tagName: "tag",
    names: new Set(),
    unions: new Map(),
    bases: new Map(),
    leaves: new Map(),
  };
  if (spec.hasOwnProperty("nodes")) {
    const root = spec["nodes"];
    for (const [name, content] of Object.entries(root)) {
      processSpecNode(name, name, content, types);
    }
    return types;
  } else {
    throw new Error("Missing nodes field");
  }
}

function processSpecNode(
  n: string,
  rootUnion: string,
  content: any,
  types: ASTSpec
): ASTTree {
  if (content === null || content === undefined)
    throw new Error(`Missing content for ${name}`);
  if (Array.isArray(content)) {
    const base = n.startsWith("^");
    const ret: ASTLeafType | ASTBaseType = base
      ? {
          type: "base",
          name: n.slice(1),
          extends: Nothing,
          fields: new Map<string, FieldType>(),
        }
      : {
          type: "leaf",
          name: n,
          tag: n.toLowerCase(),
          rootUnion: rootUnion,
          extends: Nothing,
          fields: new Map<string, FieldType>(),
        };
    for (const item of content) {
      const keys = Object.keys(item);
      if (keys.length !== 1) {
        throw new Error(
          `Unexpected field type specification: ${JSON.stringify(item)}`
        );
      } else {
        const fieldName = keys[0];
        const type = item[fieldName];
        if (typeof type === "string") {
          if (fieldName === "extends") {
            const base = types.bases.get(type);
            if (base === undefined) {
              throw new Error(
                `Type ${ret.name} cannot extend from unknown (not yet defined) base type ${type}`
              );
            }
            if (base.type !== "base") {
              throw new Error(
                `Node ${ret.name} cannot extend from non-base type ${type}`
              );
            }
            ret.extends.caseOf({
                Nothing: () => { ret.extends = Just(type) },
                Just: (v) => { throw new Error(`Node ${ret.name} cannot extends from ${type}, it already extends from ${v}`) }
            })
          } else {
            if (type === "string" || type === "number" || type === "boolean") {
              ret.fields.set(fieldName, { type: "scalar", name: type });
            } else {
              ret.fields.set(fieldName, { type: "node", name: type });
            }
          }
        } else if (Array.isArray(type)) {
          if (type.every((x) => typeof x === "string")) {
            ret.fields.set(fieldName, { type: "literals", tags: type });
          }
        } else {
          throw new Error(
            `Unexpected value for field ${fieldName}: ${JSON.stringify(type)}}`
          );
        }
      }
    }
    if (types.names.has(ret.name)) {
      throw new Error(`Multiple definitions for type ${ret.name}`);
    }
    types.names.add(ret.name);
    if (ret.type === "base") types.bases.set(ret.name, ret);
    else types.leaves.set(ret.name, ret);
    return ret;
  } else {
    const ret: ASTUnionType = {
      type: "union",
      name: n,
      subtypes: [],
    };
    for (const [subtype, contents] of Object.entries(content)) {
      if (!subtype.startsWith("^")) ret.subtypes.push(subtype);
      processSpecNode(subtype, rootUnion, contents, types);
    }
    if (types.names.has(ret.name)) {
      throw new Error(`Multiple definitions for type ${name}`);
    }
    types.names.add(ret.name);
    types.unions.set(ret.name, ret);
    return ret;
  }
}
