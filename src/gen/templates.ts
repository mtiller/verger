import { Just, Maybe } from "purify-ts/Maybe";
import {
  ASTBaseType,
  ASTLeafType,
  ASTSpec,
  ASTUnionType,
  Field,
  NodeField,
} from "../specification";
import {
  fieldType,
  childFieldEntries,
  fieldName,
  unionLeaves,
} from "./properties";

/** Generate code for each union node */
export function unionCode(a: ASTUnionType, spec: ASTSpec): string {
  const type = `export type ${a.name} = ${a.subtypes.join(" | ")};`;
  const leaves = unionLeaves(a, spec);
  const classDef = lines(
    `namespace ${a.name} {`,
    lines(
      `  export const match = <R>(n: ${a.name}, f: ${matchPayload(
        leaves
      )}) => ${matchBody(a.name, leaves, spec)}`,
      `  export const partialMatch = <R>(n: ${
        a.name
      }, f: Partial<${matchPayload(leaves)}>, orElse: R) => ${partialMatchBody(
        leaves
      )}`
    ),
    "}"
  );
  return lines(type, classDef);
}

export function matchBody(type: string, leaves: ASTLeafType[], spec: ASTSpec) {
  const ret: string[] = ["{"];
  ret.push(`    switch(n.${spec.tagName}) {`);
  for (const leaf of leaves) {
    ret.push(`      case "${leaf.tag}": return f.${leaf.name}(n)`);
  }
  ret.push(
    `      default: { const x: never = n; throw new Error("Instance of ${type} has unexpected value for ${spec.tagName}: "+(n as any).tag)}`
  );
  ret.push("    }");
  ret.push("  }");
  return lines(...ret);
}

export function partialMatchBody(leaves: ASTLeafType[]) {
  const ret: string[] = ["{"];
  for (const leaf of leaves) {
    ret.push(`      if (f.${leaf.name}) return f.${leaf.name};`);
  }
  ret.push(`      return orElse;`);
  ret.push("    }");
  return lines(...ret);
}

export function matchPayload(leaves: ASTLeafType[]): string {
  const ret: string[] = ["{"];
  for (const leaf of leaves) {
    ret.push(`    ${leaf.name}: (n: ${leaf.name}) => R`);
  }
  ret.push("  }");
  return lines(...ret);
}

/** Formulate the extends clause for a leaf node */
export function extendsClause(a: string[]): string {
  if (a.length === 0) return "";
  return `extends ${a.join(",")}`;
}

/** Generate code for a base or leaf node */
export function baseCode(
  a: ASTBaseType | ASTLeafType,
  tag: Maybe<string>, // Tag value if this is a leaf node
  spec: ASTSpec
): string {
  /** Generate declarations for all fields. */
  let decls = [...a.fields.entries()].map(
    (f) => `    ${fieldName(f[0], f[1], spec)}: ${fieldType(f[1], spec)};`
  );
  /** If a 'tag' is provided (for leaf nodes), add that. */
  decls = tag
    .map((v) => [`    ${spec.tagName}: "${v}";`, ...decls])
    .orDefault(decls);

  /** Pull all this together into an interface definition. */
  return lines(
    `export interface ${a.name} ${extendsClause(a.extends)} {`,
    lines(...decls),
    "}"
  );
}

/** Generate code for a leaf node */
export function leafCode(a: ASTLeafType, spec: ASTSpec): string {
  /** We start be generating the same interface we do for a base class */
  const common = baseCode(a, Just(a.tag), spec);

  /** Now we write out a bunch of utility functions for leaf nodes */

  /** We will need the complete list (including from base classes) of all fields */
  const children = childFieldEntries(a, spec);

  /**
   * We sort these so scalars are first (so that all 'variability'
   * in the structure of the resulting return type is at the end)
   **/
  children.sort(compareFields);

  /** Now generate the class definition associated with this leaf node. */
  const nodeClass = [
    `export class ${a.name} {`,
    `    static is = (x: ${a.rootUnion}): x is ${a.name} => { return x.${spec.tagName}==="${a.tag}" }`,
    `    static children = (x: ${a.name}) => { return [${children
      .map((x) => fieldChildren("x", x[0], x[1]))
      .join(", ")}] as const }`,
    `    static tag = "${a.tag}"`,
    `}`,
  ];

  /** Concatenate the common stuff and this special class */
  return lines(common, ...nodeClass);
}

/** Used to ensure scalar fields are processed first */
function compareFields(a: [string, NodeField], b: [string, NodeField]) {
  const ascore = a[1].struct === "scalar" ? -1 : 0;
  const bscore = b[1].struct === "scalar" ? -1 : 0;
  return ascore - bscore;
}

/** Generate an expression for all children resulting from a given field. */
export function fieldChildren(v: string, field: string, f: Field): string {
  switch (f.struct) {
    case "scalar":
      return `${v}.${field}`;
    case "array":
      return `...${v}.${field}`;
    case "set":
      return `...${v}.${field}`;
    case "map":
      return `...Object.entries(${v}.${field}).map(x => x[1])`;
    // TODO: optional
    // TODO: map
    default: {
      throw new Error(`Unknown data structure: '${f.struct}'`);
    }
  }
}

/** A help function for listing lines to be joined. */
export function lines(...lines: string[]): string {
  return lines.join("\n");
}
