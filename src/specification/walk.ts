import { parseField } from "./fields";
import {
  astLeafType,
  ASTTree,
  astUnionType,
  ASTUnionType,
  enumType,
  Field,
} from "./nodes";
import { ASTSpec } from "./nodes";

const extendsKeyword = "^";

/** This function walks the `node` part of the specification */
export function walkNode(
  n: string,
  rootUnion: ASTUnionType,
  children: any,
  spec: ASTSpec
): ASTTree {
  /** If the content is empty, we this is an error */
  if (children === null || children === undefined)
    throw new Error(`Missing content for ${n}`);
  /**
   * If the content is an array, then this is a leaf and the
   * array is the set of fields.
   */
  if (Array.isArray(children)) {
    const ret = astLeafType(n.toLowerCase(), rootUnion, n, [], new Map());

    /** Walk the specified fields end "decode" what you find. */
    walkFields(children, ret.bases, ret.fields, spec);
    /** Add this leaf node to the set of leaves. */
    spec.leaves.set(ret.name, ret);
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
    for (const [subtype, contents] of Object.entries(children)) {
      ret.subtypes.push(subtype);
      /** Now walk those subtype nodes and parse them */
      walkNode(subtype, rootUnion, contents, spec);
    }
    /** Record this union node type */
    spec.unions.set(ret.name, ret);
    return ret;
  }
}

/**
 * Walk the fields associated with a node.
 * @param content
 * @param supers
 * @param fields
 * @param spec
 */
function walkFields(
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
      if (fieldName === extendsKeyword) {
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
