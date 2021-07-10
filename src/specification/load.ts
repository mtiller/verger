import { ASTUnionType } from "./nodes";
import { ASTSpec } from "./specification";
import { validName, walkNames, walkNode, walksBase } from "./walk";

/**
 * Load an AST specification by traversing data provided
 * (generally from YAML).
 */
export function loadSpec(spec: any): ASTSpec {
  /** Create the spec we will return. */
  const types: ASTSpec = {
    names: new Set(),
    unions: new Map(),
    bases: new Map(),
    leaves: new Map(),
    options: {
      tagName: "tag",
      optional: "json",
      maps: "json",
    },
  };

  /** Parse any options first. */
  if (spec.hasOwnProperty("options")) {
    loadOptions(spec["options"], types);
  }

  /** Create the nodes for bases (base class types) and nodes  */
  const bases: any = spec["bases"] ?? {};
  const root: any = spec["nodes"];

  /** If no nodes are specified, this is an error */
  if (root === undefined) {
    throw new Error("Missing nodes field");
  }

  /** First pass...just grab names */
  walkNames(root, types);
  walkNames(bases, types);

  /** Second pass, extract structure of types */
  for (const [name, content] of Object.entries(bases)) {
    walksBase(name, content, types);
  }

  for (const [name, content] of Object.entries(root)) {
    /**
     * If we get here, then we assume the contents are nested nodes
     * and the current node is a union of those nested nodes.
     */
    const rootUnion: ASTUnionType = {
      type: "union",
      name: name,
      subtypes: [],
    };

    walkNode(name, rootUnion, rootUnion, content, types);
  }

  /** Return the resulting specification */
  return types;
}

/**
 * A nice way to verify (in a type safe way) that a given
 * string belongs to a set of possible values.
 */
function assertOptions<K extends string>(
  name: string,
  possible: K[],
  actual: string
): K {
  if (possible.includes(actual as K)) return actual as K;
  if (typeof actual !== "string")
    throw new Error(`Expected string for option ${name}, got ${typeof actual}`);
  throw new Error(
    `For option '${name}' got '${actual}' but expected on of ${possible
      .map((x) => `'${x}'`)
      .join(", ")}`
  );
}

/**
 * Read in a collection of key-value pairs and use them to initial options.
 * @param options
 * @param spec
 */
export function loadOptions(options: any, spec: ASTSpec) {
  const map = new Map<string, string>();
  for (const [name, content] of Object.entries(options)) {
    if (typeof content === "string") {
      map.set(name, content);
    } else {
      throw new Error(
        `Expected option ${name} to be a string, but it was '${typeof content}'`
      );
    }
  }
  for (const [key, val] of map.entries()) {
    switch (key) {
      case "optional": {
        spec.options.optional = assertOptions(
          key,
          ["json", "expnull", "purify"],
          val
        );
        break;
      }
      case "tagName": {
        if (!validName(val)) {
          throw new Error(
            `The tagName option must be a valid Javascript identifier, but '${val}' is not.`
          );
        }
        spec.options.tagName = val;
        break;
      }
      case "maps": {
        spec.options.maps = assertOptions(key, ["json", "map"], val);
        break;
      }
      default: {
        throw new Error(`Unknown option ${key}`);
      }
    }
  }
}
