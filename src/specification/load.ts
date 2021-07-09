import { ASTSpec } from "./nodes";
import { walkNode, walksBase } from "./walk";

export function loadSpec(spec: any): ASTSpec {
  const types: ASTSpec = {
    tagName: "tag",
    names: new Set(),
    unions: new Map(),
    bases: new Map(),
    leaves: new Map(),
  };
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
