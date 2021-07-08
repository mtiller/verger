import {
  ASTBaseType,
  ASTLeafType,
  ASTSpec,
  ASTUnionType,
  isBase,
  isLeaf,
  isUnion,
} from "./specification";

function lines(...lines: string[]): string {
  return lines.join("\n");
}

function fieldType(
  fieldName: string,
  x: string | string[],
  spec: ASTSpec
): string {
  if (typeof x === "string") {
    if (x[0] === x[0].toUpperCase()) {
      if (spec.names.has(x)) {
        return x;
      } else {
        throw new Error(`Unknown node type '${x}'`);
      }
    } else {
      switch (x) {
        case "number":
        case "string":
        case "boolean":
          return x;
      }
      throw new Error(
        `Type of field ${fieldName} is unrecognized scalar type '${x[0]}'`
      );
    }
  } else {
    return x.map((a) => `"${a}"`).join(" | ");
  }
}

export interface Foo {
  x: number;
}

function extendsClause(a: string[]): string {
  if (a.length === 0) return "";
  return `extends ${a.join(", ")}`;
}

function unionCode(a: ASTUnionType, spec: ASTSpec): string {
  return `export type ${a.name} = ${a.subtypes.join(" | ")};`;
}

function leafOrBaseCode(a: ASTLeafType | ASTBaseType, spec: ASTSpec): string {
  let decls = [...a.fields.entries()].map(
    (f) => `    ${f[0]}: ${fieldType(f[0], f[1], spec)};`
  );
  if (a.type === "leaf") {
    decls = [`    ${spec.tagName}: "${a.tag}";`, ...decls];
  }

  const typeClass =
    a.type === "leaf"
      ? [
          `export class ${a.name} {`,
          `    static is = (x: ${a.rootUnion}): x is ${a.name} => { return x.${spec.tagName}==="${a.tag}" }`,
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

  return lines(preamble, lines(...baseDefs), lines(...leafDefs), lines(...unionDefs));
}
