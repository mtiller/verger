import { FieldType } from "./fields";
import { ASTBaseType, ASTLeafType, ASTTree, ASTUnionType } from "./nodes";
import { ASTSpec } from "./specification";

export function walkNode(
  n: string,
  rootUnion: string,
  content: any,
  types: ASTSpec
): ASTTree {
  if (content === null || content === undefined)
    throw new Error(`Missing content for ${name}`);
  if (Array.isArray(content)) {
    const ret: ASTLeafType = {
      type: "leaf",
      name: n,
      tag: n.toLowerCase(),
      rootUnion: rootUnion,
      extends: [],
      fields: new Map<string, FieldType>(),
    };

    walkFields(ret.name, content, types.bases, ret.extends, ret.fields);
    if (types.names.has(ret.name)) {
      throw new Error(`Multiple definitions for type ${ret.name}`);
    }
    if (validName(ret.name)) {
      types.names.add(ret.name);
      types.leaves.set(ret.name, ret);
    } else {
      throw new Error(`Invalid name ${ret.name} for AST node type`);
    }
    return ret;
  } else {
    const ret: ASTUnionType = {
      type: "union",
      name: n,
      subtypes: [],
    };
    for (const [subtype, contents] of Object.entries(content)) {
      if (!subtype.startsWith("^")) ret.subtypes.push(subtype);
      walkNode(subtype, rootUnion, contents, types);
    }
    if (types.names.has(ret.name)) {
      throw new Error(`Multiple definitions for type ${name}`);
    }
    if (validName(ret.name)) {
      types.names.add(ret.name);
      types.unions.set(ret.name, ret);
    } else {
      throw new Error(`Invalid name ${ret.name} for AST node type`);
    }
    return ret;
  }
}

export function walksBase(name: string, content: unknown, types: ASTSpec) {
  const base: ASTBaseType = {
    name: name,
    extends: [],
    fields: new Map(),
  };
  if (Array.isArray(content)) {
    walkFields(name, content, types.bases, base.extends, base.fields);
    types.names.add(name);
    types.bases.set(name, base);
  } else {
    throw new Error(
      `Expected contents of ${name} to be an array (of fields) but it wasn't`
    );
  }
}

function walkFields(
  className: string,
  content: any[],
  bases: Map<string, ASTBaseType>,
  supers: string[],
  fields: Map<string, FieldType>
) {
  for (const item of content) {
    const keys = Object.keys(item);
    if (keys.length !== 1) {
      throw new Error(
        `Unexpected field type specification: ${JSON.stringify(item)}`
      );
    } else {
      const fieldName = keys[0];
      let type = item[fieldName];
      if (typeof type === "string") {
        let optional = false;
        if (type.endsWith("?")) {
          type = type.slice(0, type.length - 2);
          optional = true;
        }

        if (fieldName === "extends") {
          const base = bases.get(type);
          if (base === undefined) {
            throw new Error(
              `Type ${className} cannot extend from unknown (not yet defined) base type ${type}`
            );
          }
          supers.push(type);
        } else {
          if (type === "string" || type === "number" || type === "boolean") {
            fields.set(fieldName, { type: "scalar", optional, name: type });
          } else {
            fields.set(fieldName, { type: "node", optional, name: type });
          }
        }
      } else if (Array.isArray(type)) {
        if (type.every((x) => typeof x === "string")) {
          fields.set(fieldName, {
            type: "literals",
            optional: false,
            tags: type,
          });
        }
      } else {
        throw new Error(
          `Unexpected value for field ${fieldName}: ${JSON.stringify(type)}}`
        );
      }
    }
  }
}

const idRegExp = /^[$A-Z_][0-9A-Z_$]*$/i;
function validName(n: string): boolean {
  return idRegExp.test(n);
}
