import {
  ASTBaseType,
  ASTLeafType,
  ASTSpec,
  FieldType,
  isNodeFieldEntry,
  NodeField,
} from "../specification";

/**
 * Determine the type associated with a given field
 * @param fieldName The name of the field
 * @param x The `FieldType` instance
 * @param spec The AST specification
 * @returns
 */
export function fieldType(x: FieldType, spec: ASTSpec): string {
  switch (x.type) {
    case "literals": {
      return x.tags.map((a) => `"${a}"`).join(" | ");
    }
    case "node": {
      if (spec.names.has(x.name)) {
        return x.name;
      } else {
        throw new Error(`Unknown node type '${x.name}'`);
      }
    }
    case "scalar": {
      return x.name;
    }
  }
}

/**
 * Construct "entries" (like the ones you would get from calling
 * Object.entries on the `fields` member) but taking into account
 * fields inherited from base classes as well.
 * @param a Leaf or base type node
 * @param spec AST specification
 * @returns
 */
export function fieldEntries(
  a: ASTLeafType | ASTBaseType,
  spec: ASTSpec
): Array<[string, NodeField]> {
  let ret: Array<[string, NodeField]> = [];
  a.extends.forEach((baseName) => {
    const base = spec.bases.get(baseName);
    if (base === undefined) throw new Error(`Unknown base type ${baseName}`);
    const entries = fieldEntries(base, spec);
    ret = [...ret, ...entries];
  });
  const entries = [...a.fields.entries()].filter(isNodeFieldEntry);
  const dup = entries.find((e) => ret.some((r) => r[0] === e[0]));
  if (dup !== undefined) {
    throw new Error("Field ${dup[0]} is no unique");
  }
  return [...ret, ...entries];
}
