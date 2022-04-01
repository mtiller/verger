import {
  ASTBaseType,
  ASTLeafType,
  ASTSpec,
  ASTUnionType,
  Field,
  FieldType,
  isNodeFieldEntry,
} from "../specification";

/**
 * Determine the Javascript type associated with a given field
 * @param fieldName The name of the field
 * @param x The `FieldType` instance
 * @param spec The AST specification
 * @returns
 */
export function fieldType(x: Field, arg: boolean, spec: ASTSpec): string {
  const typename = fieldTypeName(x.type, spec);
  const struct = fieldStruct(x.struct, typename, arg, spec);
  return struct;
}

/**
 * Determines how a given field's name should appear in the declaration.
 *
 * This is mainly handling the case of optional fields represnted in native
 * JSON...in which case the field name needs to end with "?".
 * @param name
 * @param x
 * @param spec
 * @returns
 */
export function fieldName(name: string, x: Field, spec: ASTSpec): string {
  switch (x.struct) {
    case "optional": {
      switch (spec.options.optional) {
        case "json":
          return `${name}?`;
        case "expnull":
        case "purify":
          return name;
        default: {
          throw new Error(`Unknown optional type: ${spec.options.optional}`);
        }
      }
    }
    case "set":
    case "map":
    case "array":
    case "scalar":
      return name;
  }
}

/**
 * Determine the underlying type (independent of the structure)
 * @param x
 * @param spec
 * @returns
 */
export function fieldTypeName(x: FieldType, spec: ASTSpec): string {
  return FieldType.map(x, {
    BuiltinType: (v) => [...v.types].join(" | "),
    NodeType: (v) => [...v.types].join(" | "),
    EnumType: (v) => v.tags.map((x) => `"${x}"`).join(" | "),
  });
}

/**
 * Generate code associated with the given structure (given the
 * underlying type stored in the structure).
 */
export function fieldStruct(
  struct: Field["struct"],
  typename: string,
  arg: boolean,
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
          return arg ? `${typename} | undefined` : typename;
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
export function allFieldEntries(
  a: ASTLeafType | ASTBaseType,
  spec: ASTSpec
): Array<[string, Field]> {
  let ret: Array<[string, Field]> = [];
  /** We start by expanding contents of the base classes */
  a.bases.forEach((baseName) => {
    const base = spec.leaves.get(baseName);
    if (base === undefined) throw new Error(`Unknown base type ${baseName}`);
    const entries = allFieldEntries(base, spec);
    ret = [...ret, ...entries];
  });
  /** Now we get the contents from the node description itself */
  const entries = [...a.fields.entries()];

  /** Finally, we unsure that we don't end up with two fields with the same name. */
  const dup = entries.find((e) => ret.some((r) => r[0] === e[0]));
  if (dup !== undefined) {
    throw new Error("Field ${dup[0]} is no unique");
  }
  return [...ret, ...entries];
}

export function childFieldEntries(a: ASTLeafType | ASTBaseType, spec: ASTSpec) {
  return allFieldEntries(a, spec).filter(isNodeFieldEntry);
}

export function unionLeaves(u: ASTUnionType, spec: ASTSpec): ASTLeafType[] {
  let ret: ASTLeafType[] = [];
  for (const subtype of u.subtypes) {
    const union = spec.unions.get(subtype);
    const leaf = spec.leaves.get(subtype);
    if (union && leaf) {
      throw new Error(
        `Subtype ${subtype} of ${u.name} is both a union and a leaf?!?`
      );
    }
    if (union !== undefined) {
      ret = [...ret, ...unionLeaves(union, spec)];
    } else if (leaf !== undefined) {
      ret = [...ret, leaf];
    } else {
      throw new Error(`Unable to find subtype ${subtype} of union ${u.name}`);
    }
  }
  return ret;
}
