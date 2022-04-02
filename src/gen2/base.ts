import { Maybe, Nothing } from "purify-ts/Maybe";
import { BaseNode, IRRoot, LeafNode } from "../irepr/nodes";
import { fieldName, fieldType } from "./properties";
import { comment, lines } from "./utils";

export function generateBases(ir: IRRoot): string {
  const bases = [...ir.nodes.entries()].filter((x): x is [string, BaseNode] =>
    BaseNode.is(x[1])
  );
  const baseSource = bases.map((x) => generateBase(x[1], Nothing, ir));
  return lines(...baseSource);
}

/** Generate code for a base or leaf node */
export function generateBase(
  a: BaseNode | LeafNode,
  tag: Maybe<string>, // Tag value if this is a leaf node
  ir: IRRoot
): string {
  const header = comment(
    "This code implements the types and functions associated with",
    `the ${tag.map(() => "leaf").orDefault("interface")} type ${a.name}.`
  );

  /** Generate declarations for all fields. */
  let decls = [...a.fields.entries()].map(
    (f) => `    ${fieldName(f[0], f[1], ir)}: ${fieldType(f[1], false, ir)};`
  );
  /** If a 'tag' is provided (for leaf nodes), add that. */
  decls = tag
    .map((v) => [`    ${ir.options.tagName}: "${v}";`, ...decls])
    .orDefault(decls);

  /** Pull all this together into an interface definition. */
  return lines(
    "",
    header,
    `export interface ${a.name} ${extendsClause(a.bases)} {`,
    lines(...decls),
    "}"
  );
}

/** Formulate the extends clause for a leaf node */
function extendsClause(a: string[]): string {
  if (a.length === 0) return "";
  return `extends ${a.join(",")}`;
}
