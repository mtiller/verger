import { Just } from "purify-ts/Maybe";
import { ASTLeafType, ASTSpec, Field, NodeField } from "../specification";
import { baseCode } from "./base";
import { allFieldEntries, childFieldEntries, fieldType } from "./properties";
import { comment, lines } from "./utils";

/** Generate code for a leaf node */
export function leafCode(a: ASTLeafType, spec: ASTSpec): string {
  /** We start be generating the same interface we do for a base class */
  const common = baseCode(a, Just(a.tag), spec);

  /** Now we write out a bunch of utility functions for leaf nodes */

  /** We will need the complete list (including from base classes) of all fields */
  const children = childFieldEntries(a, spec);

  /**
   * We sort these so scalars are first (so that all 'variability'
   * in the structure of the resulting return type is at the end)
   **/
  children.sort(compareFields);

  /** Now generate the class definition associated with this leaf node. */
  const nodeClass = [
    `export class ${a.name} {`,
    comment(
      `A predicate function that take an instance of type ${a.rootUnion.name} and determines if it is an instance of ${a.name}`
    ),
    `    static is = (x: ${a.rootUnion.name}): x is ${a.name} => { return x.${spec.options.tagName}==="${a.tag}" }`,
    comment(
      `Given an instance of ${a.name}, determine all children that are instances of ${a.rootUnion.name}`
    ),
    `    static children = (x: ${a.name}) => { return [${children
      .map((x) => fieldChildren("x", x[0], x[1], spec))
      .join(", ")}] as const }`,
    comment(
      `Although generally not necessary, this tag can be used to identify instances of ${a.name}`
    ),
    `    static tag = "${a.tag}"`,
    `}`,
  ];

  const constructor =
    spec.options.constructor === "obj"
      ? [
          `export function ${constructorName(a.name)}(fields: Omit<${
            a.name
          }, "${spec.options.tagName}">): ${a.name} {`,
          `    return { "${spec.options.tagName}": "${a.tag}", ...fields };`,
          "}",
        ]
      : [
          `export function ${constructorName(a.name)}(${constructorArgs(
            a,
            spec
          )}): ${a.name} {`,
          `    return { "${spec.options.tagName}": "${
            a.tag
          }", ${constructorField(a, spec)} };`,
          "}",
        ];

  /** Concatenate the common stuff and this special class */
  return lines(
    common,
    ...nodeClass,
    comment(
      `This function can be invoked to create a new instance of ${a.name}`
    ),
    ...constructor
  );
}

function constructorField(leaf: ASTLeafType, spec: ASTSpec): string {
  return allFieldEntries(leaf, spec)
    .map(([n]) => n)
    .join(", ");
}
/** Used to ensure scalar fields are processed first */
function compareFields(a: [string, NodeField], b: [string, NodeField]) {
  const ascore = a[1].struct === "scalar" ? -1 : 0;
  const bscore = b[1].struct === "scalar" ? -1 : 0;
  return ascore - bscore;
}

function constructorArgs(leaf: ASTLeafType, spec: ASTSpec): string {
  return allFieldEntries(leaf, spec)
    .map(([n, field]) => `${n}: ${fieldType(field, true, spec)}`)
    .join(", ");
}

function constructorName(s: string) {
  let i = 0;
  for (; s[i] === s[i].toUpperCase(); i++) {}
  const n = Math.max(1, i - 1);
  return s.slice(0, n).toLowerCase() + s.slice(n);
}

/** Generate an expression for all children resulting from a given field. */
function fieldChildren(
  v: string,
  field: string,
  f: Field,
  spec: ASTSpec
): string {
  switch (f.struct) {
    case "scalar":
      return `${v}.${field}`;
    case "array":
      return `...${v}.${field}`;
    case "set":
      return `...${v}.${field}`;
    case "map":
      return `...Object.entries(${v}.${field}).map(x => x[1])`;
    case "optional":
      switch (spec.options.optional) {
        case "json":
        case "expnull":
          return `...(${v}.${field} ? [${v}.${field}] : [])`;
        case "purify":
          return `...${v}.${field}.map( x => [x]).orDefault([])`;
      }
    // TODO: map
    default: {
      throw new Error(`Unknown data structure: '${f.struct}'`);
    }
  }
}
