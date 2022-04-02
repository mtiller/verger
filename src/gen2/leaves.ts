import { IRRoot, LeafNode } from "../irepr/nodes";
import { comment, lines } from "./utils";
import { Field } from "../specification/nodes";
import {
  allFieldEntries,
  childFieldEntries,
  fieldTypeName,
  fieldName,
  fieldType,
} from "./properties";
import { NodeField } from "../specification/fields";

export function generateLeaves(ir: IRRoot): string {
  const unions = [...ir.nodes.entries()].filter((x): x is [string, LeafNode] =>
    LeafNode.is(x[1])
  );
  const unionSource = unions.map((x) => generateLeaf(ir, x[0], x[1]));
  return lines(...unionSource);
}

function generateLeaf(ir: IRRoot, n: string, leaf: LeafNode): string {
  /** We start be generating the same interface we do for a base class */
  const common = baseCode(leaf, Just(leaf.tag), ir);

  /** Now we write out a bunch of utility functions for leaf nodes */

  /** We will need the complete list (including from base classes) of all fields */
  const children = childFieldEntries(leaf, ir);

  /**
   * We sort these so scalars are first (so that all 'variability'
   * in the structure of the resulting return type is at the end)
   **/
  children.sort(compareFields);

  /** Now generate the class definition associated with this leaf node. */
  const nodeClass = [
    `export class ${leaf.name} {`,
    comment(
      `A predicate function that take an instance of \`any\` and determines if it is an instance of ${leaf.name}`
    ),
    `    static anyIs = (x: any, allowExtra: boolean = false): x is ${
      leaf.name
    } => { 
      if (x===null || x===undefined) return false;
      if (typeof x!=="object") return false;
      const keys = Object.keys(x);
      if (!allowExtra && keys.length!==${leaf.fields.size + 1}) return false;
      ${[...leaf.fields.entries()]
        .map((v) => `if (!keys.includes("${v[0]}")) return false;`)
        .join("\n")}
      if (!keys.includes("${ir.options.tagName}")) return false;
      return x.${ir.options.tagName}==="${leaf.tag}"
}`,
    comment(
      `A predicate function that take an instance of type ${leaf.rootUnion} and determines if it is an instance of ${leaf.name}`
    ),
    `    static is = (x: ${leaf.rootUnion}): x is ${leaf.name} => { return x.${ir.options.tagName}==="${leaf.tag}" }`,
    comment(
      `Given an instance of ${leaf.name}, determine all children that are instances of ${leaf.rootUnion}`
    ),
    `    static children = (x: ${leaf.name}) => { return [${children
      .map((x) => fieldChildren("x", x[0], x[1], ir))
      .join(", ")}] as const }`,
    comment(
      `Although generally not necessary, this tag can be used to identify instances of ${leaf.name}`
    ),
    `    static tag = "${leaf.tag}"`,
    `}`,
  ];

  const constructor =
    ir.options.constructor === "obj"
      ? [
          `export function ${constructorName(leaf.name)}(fields: Omit<${
            leaf.name
          }, "${ir.options.tagName}">): ${leaf.name} {`,
          `    return { "${ir.options.tagName}": "${leaf.tag}", ...fields };`,
          "}",
        ]
      : [
          `export function ${constructorName(leaf.name)}(${constructorArgs(
            leaf,
            ir
          )}): ${leaf.name} {`,
          `    return { "${ir.options.tagName}": "${
            leaf.tag
          }", ${constructorField(leaf, ir)} };`,
          "}",
        ];

  /** Concatenate the common stuff and this special class */
  return lines(
    common,
    ...nodeClass,
    comment(
      `This function can be invoked to create a new instance of ${leaf.name}`
    ),
    ...constructor
  );
}

function constructorField(leaf: LeafNode, ir: IRRoot): string {
  return allFieldEntries(leaf, ir)
    .map(([n]) => n)
    .join(", ");
}
/** Used to ensure scalar fields are processed first */
function compareFields(a: [string, NodeField], b: [string, NodeField]) {
  const ascore = a[1].struct === "scalar" ? -1 : 0;
  const bscore = b[1].struct === "scalar" ? -1 : 0;
  return ascore - bscore;
}

function constructorArgs(leaf: LeafNode, ir: IRRoot): string {
  return allFieldEntries(leaf, ir)
    .map(([n, field]) => `${n}: ${fieldType(field, true, ir)}`)
    .join(", ");
}

function constructorName(s: string) {
  let i = 0;
  for (; s[i] === s[i].toUpperCase(); i++) {}
  const n = Math.max(1, i - 1);
  return s.slice(0, n).toLowerCase() + s.slice(n);
}

/** Generate an expression for all children resulting from a given field. */
function fieldChildren(v: string, field: string, f: Field, ir: IRRoot): string {
  switch (f.struct) {
    case "scalar":
      return `${v}.${field}`;
    case "array":
      return `...${v}.${field}`;
    case "set":
      return `...${v}.${field}`;
    case "map":
      return `...Object.entries(${v}.${field}).map(x => x[1] as ${fieldTypeName(
        f.type
      )})`;
    case "optional":
      switch (ir.options.optional) {
        case "json":
        case "expnull":
          return `...(${v}.${field} ? [${v}.${field}] : [])`;
        case "purify":
          return `...${v}.${field}.map( x => [x]).orDefault([])`;
      }
    default: {
      throw new Error(`Unknown data structure: '${f.struct}'`);
    }
  }
}
