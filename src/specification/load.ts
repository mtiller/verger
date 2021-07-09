import { ASTSpec } from "./specification";
import { walkNames, walkNode, walksBase } from "./walk";

export function loadSpec(spec: any): ASTSpec {
  const types: ASTSpec = {
    tagName: "tag",
    names: new Set(),
    unions: new Map(),
    bases: new Map(),
    leaves: new Map(),
    options: {
      optional: "json",
      maps: "json",
    },
  };
  if (spec.hasOwnProperty("options")) {
    loadOptions(spec["options"], spec);
  }
  const bases: any = spec["bases"] ?? {};
  const root: any = spec["nodes"];

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
    walkNode(name, name, content, types);
  }

  return types;
}

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

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
      case "maps": {
        spec.options.maps = assertOptions(key, ["json", "map"], val);
      }
      default: {
        throw new Error(`Unknown option ${key}`);
      }
    }
  }
  if (map.has("optional")) {
  }
  if (options["optional"]) {
    const val = options["optional"];
    if (typeof val === "string") {
    } else {
      throw new Error(`Expected value of `);
    }
  }
}
