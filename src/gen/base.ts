import { Maybe } from "purify-ts/Maybe";
import { ASTBaseType, ASTLeafType, ASTSpec } from "../specification";
import { fieldName, fieldType } from "./properties";
import { comment, lines } from "./utils";

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
    `the ${tag.map(() => "leaf").orDefault("interface")} type ${a.name}.`
  );

  /** Generate declarations for all fields. */
  let decls = [...a.fields.entries()].map(
    (f) =>
      `    ${fieldName(f[0], f[1], spec)}: ${fieldType(f[1], false, spec)};`
  );
  /** If a 'tag' is provided (for leaf nodes), add that. */
  decls = tag
    .map((v) => [`    ${spec.options.tagName}: "${v}";`, ...decls])
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
