import {
  ASTLeafType,
  ASTSpec,
  ASTTree,
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
            throw new Error(`Unknown node type '${x}'`)
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
      return x.map(a => `"${a}"`).join(" | ")
  }
}

function leafCode(a: ASTLeafType, spec: ASTSpec): string {
  const decls = [...a.fields.entries()].map(
    (f) => `  ${f[0]}: ${fieldType(f[0], f[1], spec)};`
  );
  return lines(`export interface ${a.name} {`, lines(...decls), "}");
}

export function generate(spec: ASTSpec): string {
  const entries = [...spec.entries()];
  const leaves = entries.map((a) => a[1]).filter(isLeaf);
  const unions = entries.map((a) => a[1]).filter(isUnion);
  const leafDefs = leaves.map((a) => leafCode(a, spec));

  const stats = `// Types: ${entries.map((a) => a[0])}}
//   Unions: ${unions.map((a) => a.name)}
//   Leaves: ${leaves.map((a) => a.name)}
`;

  const preamble = `// DO NOT EDIT
// This file was automatically generated

${stats}
`;

  return preamble + leafDefs.join("\n");
}
