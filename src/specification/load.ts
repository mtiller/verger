import { ASTSpec } from "./specification";
import { walkNode, walksBase } from "./walk";

export function loadSpec(spec: any): ASTSpec {
  const types: ASTSpec = {
    tagName: "tag",
    names: new Set(),
    unions: new Map(),
    bases: new Map(),
    leaves: new Map(),
    options: {
      optional: "expnull",
    },
  };
  if (spec.hasOwnProperty("options")) {
    loadOptions(spec["options"], spec);
  }
  if (spec.hasOwnProperty("bases")) {
    const bases = spec["bases"];
    for (const [name, content] of Object.entries(bases)) {
      walksBase(name, content, types);
    }
  }
  if (spec.hasOwnProperty("nodes")) {
    const root = spec["nodes"];
    for (const [name, content] of Object.entries(root)) {
      walkNode(name, name, content, types);
    }
  } else {
    throw new Error("Missing nodes field");
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
  throw new Error(
    `For option ${name} got '${actual}' but expected on of ${possible
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
          ["undefined", "expnull", "purify"],
          val
        );
        break;
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
