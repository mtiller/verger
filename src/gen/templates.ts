import { Just, Maybe } from "purify-ts/Maybe";
import {
  ASTBaseType,
  ASTLeafType,
  ASTSpec,
  ASTUnionType,
  Field,
  NodeField,
} from "../specification";
import { fieldType, childFieldEntries } from "./properties";
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

  const children = childFieldEntries(a, spec);
  children.sort(compareFields);
  const typeClass = [
    `export class ${a.name} {`,
    `    static is = (x: ${a.rootUnion}): x is ${a.name} => { return x.${spec.tagName}==="${a.tag}" }`,
    `    static children = (x: ${a.name}) => { return [${children
      .map((x) => fieldChildren("x", x[0], x[1]))
      .join(", ")}] as const }`,
    `    static tag = "${a.tag}"`,
    `}`,
  ];

  return lines(common, ...typeClass);
}

function compareFields(a: [string, NodeField], b: [string, NodeField]) {
  const ascore = a[1].struct === "scalar" ? -1 : 0;
  const bscore = b[1].struct === "scalar" ? -1 : 0;
  return ascore - bscore;
}

export function fieldChildren(v: string, field: string, f: Field): string {
  switch (f.struct) {
    case "scalar":
      return `${v}.${field}`;
    case "array":
      return `...${v}.${field}`;
    default: {
      throw new Error(`Unknown data structure: '${f.struct}'`);
    }
  }
}
