import { Field, FieldStruct, parseField } from "./fields";
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
      fields: new Map<string, Field>(),
    };

    walkFields(ret.name, content, ret.extends, ret.fields, types);
    if (!types.names.has(ret.name)) {
      throw new Error(`Unknown name ${ret.name}`);
    }
    types.leaves.set(ret.name, ret);
    return ret;
  } else {
    const ret: ASTUnionType = {
      type: "union",
      name: n,
      subtypes: [],
    };
    for (const [subtype, contents] of Object.entries(content)) {
      if (types.names.has(subtype)) {
        ret.subtypes.push(subtype);
      } else {
        throw new Error(`Unrecognized name ${subtype}`);
      }
      walkNode(subtype, rootUnion, contents, types);
    }
    if (!types.names.has(ret.name)) {
      throw new Error(`Unknown name ${ret.name}`);
    }
    types.unions.set(ret.name, ret);
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
    walkFields(name, content, base.extends, base.fields, types);
    if (!types.names.has(name)) {
      throw new Error(`Unrecognized name ${name}`);
    }
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
  supers: string[],
  fields: Map<string, Field>,
  spec: ASTSpec
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
        if (fieldName === "extends") {
          const base = spec.bases.get(type);
          if (base === undefined) {
            throw new Error(
              `Type ${className} cannot extend from unknown (not yet defined) base type ${type}`
            );
          }
          supers.push(type);
        } else {
          const field = parseField(type, spec);
          fields.set(fieldName, field);
        }
      } else if (Array.isArray(type)) {
        if (type.every((x) => typeof x === "string")) {
          const struct: FieldStruct = "scalar";
          fields.set(fieldName, {
            type: {
              kind: "enum",
              tags: type,
            },
            struct,
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

export function walkNames(a: any, spec: ASTSpec) {
  if (typeof a === "object" && !Array.isArray(a) && a !== null) {
    for (const [name, content] of Object.entries(a)) {
      if (spec.names.has(name)) {
        throw new Error(`Name ${name} defined multiple times`);
      }
      if (validName(name)) {
        spec.names.add(name);
        walkNames(content, spec);
      } else {
        throw new Error(`Invalid name ${name}`);
      }
    }
  }
}

const idRegExp = /^[$A-Z_][0-9A-Z_$]*$/i;
export function validName(n: string): boolean {
  return idRegExp.test(n);
}
