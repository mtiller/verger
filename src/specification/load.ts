import { validName } from "../utils";
import { astUnionType, ASTUnionType, ASTSpec } from "./nodes";
import { walkNode } from "./walk";

/**
 * Load an AST specification by traversing data provided
 * (generally from YAML).
 */
export function loadSpec(ydata: any): ASTSpec {
  /** Create the spec we will return. */
  const spec: ASTSpec = {
    unions: new Map(),
    leaves: new Map(),
    externs: new Map(),
    options: {
      tagName: "tag",
      optional: "json",
      maps: "json",
      constructor: "inline",
    },
  };

  /** Parse any options first. */
  if (ydata.hasOwnProperty("options")) {
    loadOptions(ydata["options"], spec);
  }

  /** Create the nodes for bases (base class types) and nodes  */
  const nodes: any = ydata["nodes"];
  const externs: any = ydata["externs"];

  /** If no nodes are specified, this is an error */
  if (nodes === undefined) {
    throw new Error("Missing nodes field");
  }

  /** Walk nodes */
  for (const [name, content] of Object.entries(nodes)) {
    const rootUnion: ASTUnionType = astUnionType(name, []);

    walkNode(name, rootUnion, content, spec);
  }

  /** Read in any external definitions */
  if (externs) {
    if (!Array.isArray(externs)) {
      throw new Error(`exected 'externs' to be an array`);
    }
    for (const extern of externs) {
      const keys = Object.keys(extern);
      if (keys.length !== 1) {
        throw new Error(
          `Exected extern to have 1 key, instead got: ${JSON.stringify(keys)}`
        );
      }
      const symbol = keys[0];
      const from = extern[symbol];
      spec.externs.set(symbol, from);
    }
  }

  /** Return the resulting specification */
  return spec;
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
    if (typeof content !== "string")
      throw new Error(
        `Expected option ${name} to be a string, but it was '${typeof content}'`
      );
    map.set(name, content);
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
      case "constructor": {
        spec.options.constructor = assertOptions(key, ["inline", "obj"], val);
      }
      default: {
        throw new Error(`Unknown option ${key}`);
      }
    }
  }
}
