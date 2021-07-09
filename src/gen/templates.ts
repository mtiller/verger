import { Just, Maybe } from "purify-ts/Maybe";
import {
  ASTBaseType,
  ASTLeafType,
  ASTSpec,
  ASTUnionType,
} from "../specification";
import { fieldType, fieldEntries } from "./properties";
import { lines } from "./text";

export function unionCode(a: ASTUnionType, spec: ASTSpec): string {
  return `export type ${a.name} = ${a.subtypes.join(" | ")};`;
}

export function extendsClause(a: string[]): string {
  if (a.length === 0) return "";
  return `extends ${a.join(",")}`;
}

export function baseCode(
  a: ASTBaseType | ASTLeafType,
  tag: Maybe<string>,
  spec: ASTSpec
): string {
  let decls = [...a.fields.entries()].map(
    (f) => `    ${f[0]}: ${fieldType(f[1], spec)};`
  );
  decls = tag
    .map((v) => [`    ${spec.tagName}: "${v}";`, ...decls])
    .orDefault(decls);

  return lines(
    `export interface ${a.name} ${extendsClause(a.extends)} {`,
    lines(...decls),
    "}"
  );
}

export function leafCode(a: ASTLeafType, spec: ASTSpec): string {
  const common = baseCode(a, Just(a.tag), spec);

  const children = fieldEntries(a, spec);
  const typeClass = [
    `export class ${a.name} {`,
    `    static is = (x: ${a.rootUnion}): x is ${a.name} => { return x.${spec.tagName}==="${a.tag}" }`,
    `    static children = (x: ${a.name}): [${children
      .map((x) => `${x[0]}: ${x[1].name}`)
      .join(", ")}] => { return [${children
      .map((x) => `x.${x[0]}`)
      .join(", ")}] }`,
    `    static tag = "${a.tag}"`,
    `}`,
  ];

  return lines(common, ...typeClass);
}
