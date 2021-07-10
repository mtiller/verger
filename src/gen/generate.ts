import { Nothing } from "purify-ts/Maybe";
import { ASTSpec } from "../specification";
import { leafCode } from "./leaf";
import { baseCode } from "./base";
import { comment, lines } from "./utils";
import { unionCode } from "./union";
import prettier from "prettier";
import { imports } from "./imports";

/**
 * This is the top level function to generate Javascript code.
 */
export function generate(spec: ASTSpec): string {
  const imps = imports(spec);
  const leaves = [...spec.leaves.values()];
  const bases = [...spec.bases.values()];
  const unions = [...spec.unions.values()];
  const leafDefs = leaves.map((a) => leafCode(a, spec));
  const baseDefs = bases.map((a) => baseCode(a, Nothing, spec));
  const unionDefs = unions.map((a) => unionCode(a, spec));

  const preamble = comment(
    "DO NOT EDIT - This file was generated by verger.  If you want to change something",
    "edit the upstream AST specification and regenerate this file"
  );

  const file = lines(
    imps,
    preamble,
    lines(...baseDefs),
    lines(...leafDefs),
    lines(...unionDefs)
  );

  const pretty = prettier.format(file, { parser: "babel-ts" });

  return pretty;
}
