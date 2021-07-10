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
  const header = comment(
    "This code implements the types and functions associated with",
    `the union type ${a.name}.`
  );
  const type = `export type ${a.name} = ${a.subtypes.join(" | ")};`;
  const leaves = unionLeaves(a, spec);
  const classDef = lines(
    `namespace ${a.name} {`,
    lines(
      comment(
        `Given an instance of type ${a.name}, map that value depending on the`,
        "specific underlying node type"
      ),
      `  export const match = <R>(n: ${a.name}, f: ${matchPayload(
        leaves,
        "R"
      )}) => ${matchBody(a.name, leaves, spec)}`,
      comment(
        `Given an instance of type ${a.name}, map that value for certain subtypes`,
        "and for all others, simply return the `orElse` argument"
      ),
      `  export const partialMatch = <R>(n: ${
        a.name
      }, f: Partial<${matchPayload(
        leaves,
        "R"
      )}>, orElse: R) => ${partialMatchBody(leaves, spec, false)}`,
      comment(
        `Given an instance of type ${a.name}, take action depending on the`,
        "specific underlying node type"
      ),
      `  export const forEach = (n: ${a.name}, f: ${matchPayload(
        leaves,
        "void"
      )}): void => ${matchBody(a.name, leaves, spec)}`,
      comment(
        `Given an instance of type ${a.name}, take action for certain subtypes`,
        "and for all others, simply return the `orElse` argument"
      ),
      `  export const partialForEach = (n: ${a.name}, f: Partial<${matchPayload(
        leaves,
        "void"
      )}>, orElse?: (n: ${a.name}) => void) => ${partialMatchBody(
        leaves,
        spec,
        true
      )}`
    ),
    "}"
  );
  return lines("", header, type, classDef, "");
}

export function matchBody(type: string, leaves: ASTLeafType[], spec: ASTSpec) {
  const ret: string[] = ["{"];
  ret.push(`    switch(n.${spec.options.tagName}) {`);
  for (const leaf of leaves) {
    ret.push(`      case "${leaf.tag}": return f.${leaf.name}(n)`);
  }
  ret.push(
    `      default: { const x: never = n; throw new Error("Instance of ${type} has unexpected value for ${spec.options.tagName}: "+(n as any).tag)}`
  );
  ret.push("    }");
  ret.push("  }");
  return lines(...ret);
}

export function partialMatchBody(
  leaves: ASTLeafType[],
  spec: ASTSpec,
  foreach: boolean
) {
  const ret: string[] = ["{"];
  for (const leaf of leaves) {
    ret.push(
      `      if (n.${spec.options.tagName}==="${leaf.tag}" && f.${leaf.name}) return f.${leaf.name}(n);`
    );
  }
  if (foreach) {
    ret.push(`      if (orElse) return orElse(n)`);
  } else {
    ret.push(`      return orElse;`);
  }
  ret.push("    }");
  return lines(...ret);
}

export function matchPayload(leaves: ASTLeafType[], r: string): string {
  const ret: string[] = ["{"];
  for (const leaf of leaves) {
    ret.push(`    ${leaf.name}: (n: ${leaf.name}) => ${r}`);
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
  const header = comment(
    "This code implements the types and functions associated with",
    `the ${tag.map(() => "leaf").orDefault("base")} type ${a.name}.`
  );

  /** Generate declarations for all fields. */
  let decls = [...a.fields.entries()].map(
    (f) => `    ${fieldName(f[0], f[1], spec)}: ${fieldType(f[1], spec)};`
  );
  /** If a 'tag' is provided (for leaf nodes), add that. */
  decls = tag
    .map((v) => [`    ${spec.options.tagName}: "${v}";`, ...decls])
    .orDefault(decls);

  /** Pull all this together into an interface definition. */
  return lines(
    "",
    header,
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
    comment(
      `A predicate function that take an instance of type ${a.rootUnion.name} and determines if it is an instance of ${a.name}`
    ),
    `    static is = (x: ${a.rootUnion.name}): x is ${a.name} => { return x.${spec.options.tagName}==="${a.tag}" }`,
    comment(
      `Given an instance of ${a.name}, determine all children that are instances of ${a.rootUnion.name}`
    ),
    `    static children = (x: ${a.name}) => { return [${children
      .map((x) => fieldChildren("x", x[0], x[1]))
      .join(", ")}] as const }`,
    comment(
      `Although generally not necessary, this tag can be used to identify instances of ${a.name}`
    ),
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

export function comment(...lines: string[]): string {
  const starred = lines.map((x) => ` * ${x}`);
  const bookended = ["/**", ...starred, " **/"];
  return bookended.join("\n");
}
