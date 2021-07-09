import { Maybe } from "purify-ts/Maybe";
import {
  ASTBaseType,
  ASTLeafType,
  ASTSpec,
  ASTUnionType,
  FieldType,
  isNodeFieldEntry,
  NodeField,
} from "./specification";

function lines(...lines: string[]): string {
  return lines.join("\n");
}

function fieldType(fieldName: string, x: FieldType, spec: ASTSpec): string {
  switch (x.type) {
    case "literals": {
      return x.tags.map((a) => `"${a}"`).join(" | ");
    }
    case "node": {
      if (spec.names.has(x.name)) {
        return x.name;
      } else {
        throw new Error(`Unknown node type '${x}'`);
      }
    }
    case "scalar": {
        return x.name;
    }
  }
}

export interface Foo {
  x: number;
}

function extendsClause(a: Maybe<string>): string {
    return a.caseOf({
        Nothing: () => "",
        Just: (v) => `extends ${v}`
    })
}

function unionCode(a: ASTUnionType, spec: ASTSpec): string {
  return `export type ${a.name} = ${a.subtypes.join(" | ")};`;
}

function fieldEntries(a: ASTLeafType | ASTBaseType, spec: ASTSpec): Array<[string, NodeField]> {
    let ret: Array<[string, NodeField]> = [];
    a.extends.caseOf({
        Nothing: () => {},
        Just: (baseName) => {
            const base = spec.bases.get(baseName)
            if (base===undefined) throw new Error(`Unknown base type ${baseName}`);
            const entries = fieldEntries(base, spec);
            ret = [...ret, ...entries];    
        }
    })
    const entries = [...a.fields.entries()].filter(isNodeFieldEntry);
    const dup = entries.find(e => ret.some(r => r[0]===e[0]));
    if (dup!==undefined) {
        throw new Error('Field ${dup[0]} is no unique')
    }
    return [...ret, ...entries];
}

// function baseLeaves(a: ASTBaseType, spec: ASTSpec): ASTLeafType[] {

// }

// function unionLeaves(a: ASTUnionType, spec: ASTSpec): ASTLeafType[] {
//     return a.subtypes.reduce<ASTLeafType[]>((p, c) => {

//     }, [])
// }

function leafOrBaseCode(a: ASTLeafType | ASTBaseType, spec: ASTSpec): string {
  let decls = [...a.fields.entries()].map(
    (f) => `    ${f[0]}: ${fieldType(f[0], f[1], spec)};`
  );
  if (a.type === "leaf") {
    decls = [`    ${spec.tagName}: "${a.tag}";`, ...decls];
  }

  const children = fieldEntries(a, spec);
  const typeClass =
    a.type === "leaf"
      ? [
          `export class ${a.name} {`,
          `    static is = (x: ${a.rootUnion}): x is ${a.name} => { return x.${spec.tagName}==="${a.tag}" }`,
          `    static children = (x: ${a.name}): [${children.map(x => `${x[0]}: ${x[1].name}`).join(", ")}] => { return [${children.map(x => `x.${x[0]}`).join(", ")}] }`,
          `    static tag = "${a.tag}"`,
          `}`,
        ]
      : [];

  return lines(
    `export interface ${a.name} ${extendsClause(a.extends)} {`,
    lines(...decls),
    "}",
    ...typeClass
  );
}

export class Foo {
  static is = (x: any): x is Foo => {
    return true;
  };
  static tag = "foo";
}

export function generate(spec: ASTSpec): string {
  const leaves = [...spec.leaves.values()];
  const bases = [...spec.bases.values()];
  const unions = [...spec.unions.values()];
  const baseDefs = bases.map((a) => leafOrBaseCode(a, spec));
  const leafDefs = leaves.map((a) => leafOrBaseCode(a, spec));
  const unionDefs = unions.map((a) => unionCode(a, spec));
  const stats = `//   Unions: ${unions.map((a) => a.name)}
//   Bases: ${bases.map((a) => a.name)}
//   Leaves: ${leaves.map((a) => a.name)}
`;

  const preamble = `// DO NOT EDIT
// This file was automatically generated

${stats}
`;

  return lines(
    preamble,
    lines(...baseDefs),
    lines(...leafDefs),
    lines(...unionDefs)
  );
}
