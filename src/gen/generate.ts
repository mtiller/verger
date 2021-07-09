import { ASTSpec } from "../specification";
import { leafOrBaseCode, unionCode } from "./templates";
import { lines } from "./text";

export function generate(spec: ASTSpec): string {
  const leaves = [...spec.leaves.values()];
  const bases = [...spec.bases.values()];
  const unions = [...spec.unions.values()];
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

  return lines(preamble, lines(...leafDefs), lines(...unionDefs));
}
