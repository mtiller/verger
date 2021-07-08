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
  extends: string[];
  fields: Map<string, string | string[]>;
}

export function isBase(a: ASTTree): a is ASTBaseType {
  return a.type === "base";
}

export interface ASTLeafType {
  type: "leaf";
  tag: string;
  name: string;
  extends: string[];
  fields: Map<string, string | string[]>;
}

export function isLeaf(a: ASTTree): a is ASTLeafType {
  return a.type === "leaf";
}

export type ASTTree = ASTUnionType | ASTBaseType | ASTLeafType;
export type ASTSpec = Map<string, ASTTree>;

export function createASTTree(spec: any): ASTSpec {
  const types: ASTSpec = new Map();
  if (spec.hasOwnProperty("nodes")) {
    const root = spec["nodes"];
    for (const [name, content] of Object.entries(root)) {
      processSpecNode(name, content, types);
    }
    for (const [name, node] of types) {
      console.log(`${name}: ${node.type}`);
    }
    return types;
  } else {
    throw new Error("Missing nodes field");
  }
}

function processSpecNode(
  name: string,
  content: any,
  types: Map<string, ASTTree>
): ASTTree {
  if (content === null || content === undefined)
    throw new Error(`Missing content for ${name}`);
  if (Array.isArray(content)) {
    const base = name.startsWith("^");
    const ret: ASTLeafType | ASTBaseType = base ? {
        type: "base",
        name: name.slice(1),
        extends: [],
        fields: new Map<string, string>()
    } : {
        type: "leaf",
        name: name,
        tag: name.toLowerCase(),
        extends: [],
        fields: new Map<string, string>()
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
            const base = types.get(type);
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
            ret.extends.push(type);
          } else {
            ret.fields.set(fieldName, type);
          }
        } else if (Array.isArray(type)) {
          if (type.every((x) => typeof x === "string")) {
            ret.fields.set(fieldName, type as string[]);
          }
        } else {
          throw new Error(
            `Unexpected value for field ${fieldName}: ${JSON.stringify(type)}}`
          );
        }
      }
    }
    if (types.has(name)) {
      throw new Error(`Multiple definitions for type ${name}`);
    }
    types.set(ret.name, ret);
    return ret;
  } else {
    const subtypes = Object.keys(content);
    const ret: ASTUnionType = {
      type: "union",
      name: name,
      subtypes,
    };
    for (const [subtype, contents] of Object.entries(content)) {
      ret.subtypes.push(subtype);
      processSpecNode(subtype, contents, types);
    }
    if (types.has(name)) {
      throw new Error(`Multiple definitions for type ${name}`);
    }
    types.set(ret.name, ret);
    return ret;
  }
}
