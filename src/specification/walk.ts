import { parseField } from "./fields";
import {
  ASTBaseType,
  astLeafType,
  ASTTree,
  astUnionType,
  ASTUnionType,
  enumType,
  Field,
} from "./nodes";
import { ASTSpec } from "./specification";

/** This function walks the `node` part of the specification */
export function walkNode(
  n: string,
  rootUnion: ASTUnionType,
  parentUnion: ASTUnionType,
  content: any,
  types: ASTSpec
): ASTTree {
  /** If the content is empty, we this is an error */
  if (content === null || content === undefined)
    throw new Error(`Missing content for ${name}`);
  /**
   * If the content is an array, then this is a leaf and the
   * array is the set of fields.
   */
  if (Array.isArray(content)) {
    const ret = astLeafType(n.toLowerCase(), rootUnion, n, [], new Map());

    /** Walk the specified fields end "decode" what you find. */
    walkFields(ret.name, content, ret.bases, ret.fields, types);
    if (!types.names.has(ret.name)) {
      throw new Error(`Unknown name ${ret.name}`);
    }
    /** Add this leaf node to the set of leaves. */
    types.leaves.set(ret.name, ret);
    return ret;
  } else {
    /**
     * If we get here, then we assume the contents are nested nodes
     * and the current node is a union of those nested nodes.
     */
    const ret = astUnionType(n, []);
    /**
     * Loop over each "subtype" node listed under our union node
     */
    for (const [subtype, contents] of Object.entries(content)) {
      /** Add this subtype to the list of subtypes associated with our union */
      if (types.names.has(subtype)) {
        ret.subtypes.push(subtype);
      } else {
        throw new Error(`Unrecognized name ${subtype}`);
      }
      /** Now walk those subtype nodes and parse them */
      walkNode(subtype, rootUnion, ret, contents, types);
    }
    if (!types.names.has(ret.name)) {
      throw new Error(`Unknown name ${ret.name}`);
    }
    /** Record this union node type */
    types.unions.set(ret.name, ret);
    return ret;
  }
}

/**
 * This function walks the base class specification
 * @param name
 * @param content
 * @param types
 */
export function walksBase(name: string, content: unknown, types: ASTSpec) {
  const base: ASTBaseType = {
    name: name,
    bases: [],
    fields: new Map(),
  };
  /** Each base class must be a collection of fields (no nesting is allowed for base classes) */
  if (Array.isArray(content)) {
    walkFields(name, content, base.bases, base.fields, types);
    if (!types.names.has(name)) {
      throw new Error(`Unrecognized name ${name}`);
    }
    types.bases.set(name, base);
  } else {
    throw new Error(
      `Expected contents of ${name} to be an array (of fields) but it wasn't`
    );
  }
}

/**
 * Walk the fields associated with a node.
 * @param className
 * @param content
 * @param supers
 * @param fields
 * @param spec
 */
function walkFields(
  className: string,
  content: any[],
  supers: string[],
  fields: Map<string, Field>,
  spec: ASTSpec
) {
  /** We now the content here is an array. */
  for (const item of content) {
    /** We expect that each item is an object with a single key and value */
    const keys = Object.keys(item);
    if (keys.length !== 1) {
      throw new Error(
        `Unexpected field type specification: ${JSON.stringify(item)}`
      );
    }
    /** Extract the name of the single key... */
    const fieldName = keys[0];

    if (fieldName === spec.options.tagName)
      throw new Error(
        `'${spec.options.tagName}' is a reserved name (controlled by the options.tagName option (${spec.options.tagName})`
      );
    /** ...and the value associated with that single key */
    let type = item[fieldName];

    /** If the value is a string, then it is a type name */
    if (typeof type === "string") {
      /** If the field name is "extends" then this type name is actually a base class. */
      if (fieldName === "extends") {
        /** Verify there is such a base class in the spec */
        const base = spec.bases.get(type);
        if (base === undefined) {
          throw new Error(
            `Type ${className} cannot extend from unknown (not yet defined) base type ${type}`
          );
        }
        /** Add that base class to the set of super classes of this node */
        supers.push(type);
      } else {
        /**
         * If we get here, this is a normal member of the node.  So,
         * parse the field description given by `type` and associate
         * it with the field.
         */
        const field = parseField(type, spec);
        fields.set(fieldName, field);
      }
    } else if (Array.isArray(type)) {
      /** If the value is an array, then it is treated as an enumeration of string literals. */

      /** Ensure each element in the array is actually a string */
      if (type.every((x) => typeof x === "string")) {
        /** If so, add a new enum field. */
        const struct: Field["struct"] = "scalar";
        fields.set(fieldName, {
          type: enumType(type),
          struct,
        });
      }
    } else {
      throw new Error(
        `Unexpected value for field ${fieldName}: ${JSON.stringify(type)}}`
      );
    }
  }
}

/**
 * This is used durign a first pass of parsing the input
 * data to build a "symbol table" which, in this case, is
 * just a set of names that are defined in the specification.
 *
 * This function will be called once for the bases and once
 * for the nodes.
 * @param a
 * @param spec
 */
export function walkNames(a: any, spec: ASTSpec) {
  if (typeof a === "object" && !Array.isArray(a) && a !== null) {
    for (const [name, content] of Object.entries(a)) {
      if (spec.names.has(name)) {
        throw new Error(`Name ${name} defined multiple times`);
      }
      if (validType(name)) {
        /** If this is a valid name, add it and recurse. */
        spec.names.add(name);
        walkNames(content, spec);
      } else {
        throw new Error(`Invalid name '${name}'`);
      }
    }
  }
}

/**
 * This function checks if a given string is a valid Javascript identifier.
 * It turns out that there are other valid identifiers that will
 * fail this test (strings with unicode in them).  But if it passes this test
 * it is belongs to a legal subset of possible legal identifiers.
 **/
const idRegExp = /^[$A-Z_][0-9A-Z_$]*$/i;
export function validName(n: string): boolean {
  return idRegExp.test(n);
}
export function validType(n: string): boolean {
  if (n[0].toLowerCase() === n[0]) return false;
  return validName(n);
}
