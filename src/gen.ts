import {
  ASTBaseType,
  ASTLeafType,
  ASTSpec,
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
      if (spec.has(x)) {
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

function extendsClause(a: string[]): string {
  if (a.length === 0) return "";
  return `extends ${a.join(", ")}`;
}

function leafOrBaseCode(a: ASTLeafType | ASTBaseType, spec: ASTSpec): string {
  let decls = [...a.fields.entries()].map(
    (f) => `  ${f[0]}: ${fieldType(f[0], f[1], spec)};`
  );
  if (a.type==="leaf") {
    decls = [`  tag: "${a.tag}";`, ...decls]
  }
  return lines(
    `export interface ${a.name} ${extendsClause(a.extends)} {`,
    lines(...decls),
    "}"
  );
}

export function generate(spec: ASTSpec): string {
  const entries = [...spec.entries()];
  const leaves = entries.map((a) => a[1]).filter(isLeaf);
  const bases = entries.map((a) => a[1]).filter(isBase);
  const unions = entries.map((a) => a[1]).filter(isUnion);
  const baseDefs = bases.map((a) => leafOrBaseCode(a, spec));
  const leafDefs = leaves.map((a) => leafOrBaseCode(a, spec));

  const stats = `// Types: ${entries.map((a) => a[0])}}
//   Unions: ${unions.map((a) => a.name)}
//   Bases: ${bases.map((a) => a.name)}
//   Leaves: ${leaves.map((a) => a.name)}
`;

  const preamble = `// DO NOT EDIT
// This file was automatically generated

${stats}
`;

  return lines(preamble, lines(...baseDefs), lines(...leafDefs));
}
