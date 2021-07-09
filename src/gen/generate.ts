import { Nothing } from "purify-ts/Maybe";
import { ASTSpec } from "../specification";
import { baseCode, leafCode, unionCode } from "./templates";
import { lines } from "./text";

export function generate(spec: ASTSpec): string {
  const leaves = [...spec.leaves.values()];
  const bases = [...spec.bases.values()];
  const unions = [...spec.unions.values()];
  const leafDefs = leaves.map((a) => leafCode(a, spec));
  const baseDefs = bases.map((a) => baseCode(a, Nothing, spec));
  const unionDefs = unions.map((a) => unionCode(a, spec));

  const preamble = `// DO NOT EDIT\n// This file was automatically generated
`;

  return lines(
    preamble,
    lines(...baseDefs),
    lines(...leafDefs),
    lines(...unionDefs)
  );
}
