import {
  ASTBaseType,
  ASTLeafType,
  ASTSpec,
  Field,
  FieldStruct,
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
export function fieldType(x: Field, spec: ASTSpec): string {
  return fieldStruct(x.struct, fieldTypeName(x.type, spec), spec);
}

export function fieldTypeName(x: FieldType, spec: ASTSpec): string {
  switch (x.kind) {
    case "builtin":
    case "node":
      return x.types.join(" | ");
    case "enum":
      return x.tags.map((x) => `"${x}"`).join(" | ");
    default: {
      throw new Error(`Unrecognized field type kind: '${(x as any).kind}'`);
    }
  }
}

export function fieldStruct(
  struct: FieldStruct,
  typename: string,
  spec: ASTSpec
): string {
  switch (struct) {
    case "scalar":
      return typename;
    case "array":
      return `${typename}[]`;
    case "optional":
      switch (spec.options.optional) {
        case "expnull":
          return `${typename} | null`;
        case "purify":
          return `Maybe<${typename}>`;
        case "json":
          return `${typename}`;
        default: {
          throw new Error(
            `Unrecognized optional handler: '${spec.options.optional}'`
          );
        }
      }
    case "map":
      switch (spec.options.maps) {
        case "json":
          return `Record<string,${typename}>`;
        case "map":
          return `Map<string,${typename}>`;
        default: {
          throw new Error(`Unrecognized maps option: '${spec.options.maps}'`);
        }
      }
    case "set":
      return `Set<${typename}>`;
    default: {
      throw new Error(`Unrecognized data structure: '${struct}'`);
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
export function childFieldEntries(
  a: ASTLeafType | ASTBaseType,
  spec: ASTSpec
): Array<[string, NodeField]> {
  let ret: Array<[string, NodeField]> = [];
  a.extends.forEach((baseName) => {
    const base = spec.bases.get(baseName);
    if (base === undefined) throw new Error(`Unknown base type ${baseName}`);
    const entries = childFieldEntries(base, spec);
    ret = [...ret, ...entries];
  });
  const entries = [...a.fields.entries()].filter(isNodeFieldEntry);
  const dup = entries.find((e) => ret.some((r) => r[0] === e[0]));
  if (dup !== undefined) {
    throw new Error("Field ${dup[0]} is no unique");
  }
  return [...ret, ...entries];
}
