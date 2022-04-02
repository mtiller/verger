import { ASTSpec } from "../specification/nodes";
import {
  baseNode,
  externalNode,
  IRNode,
  irRoot,
  IRRoot,
  leafNode,
  unionNode,
} from "./nodes";

export function buildIR(spec: ASTSpec): IRRoot {
  const issues: string[] = [];
  const nodes = new Map<string, IRNode>();

  const checkName = (n: string, kind: string) => {
    if (nodes.has(n))
      issues.push(
        `${kind} named ${n} was already defined as a(n) ${nodes.get(n)!.kind}`
      );
  };

  for (const [symbol, from] of spec.externs) {
    checkName(symbol, "external type");
    nodes.set(symbol, externalNode(from, symbol));
  }

  for (const [n, union] of spec.unions) {
    checkName(n, "union type");
    nodes.set(n, unionNode(n, union.subtypes));
  }

  const bases = new Set<string>();

  for (const [n, leaves] of spec.leaves) {
    checkName(n, "leaf type");
    for (const base of leaves.bases) {
      bases.add(base);
    }
  }

  for (const [n, leaf] of spec.leaves) {
    if (bases.has(n)) {
      nodes.set(n, baseNode(leaf.bases, leaf.fields));
    } else {
      nodes.set(
        n,
        leafNode(
          leaf.tag,
          leaf.name,
          leaf.rootUnion.name,
          leaf.bases,
          leaf.fields
        )
      );
    }
  }
  return irRoot(nodes, spec.options);
}
