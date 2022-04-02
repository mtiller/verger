import { ExternalNode, IRRoot } from "../irepr/nodes";
import { lines } from "./utils";

export function generateImports(ir: IRRoot): string {
  const map = new Map<string, string[]>();
  for (const [n, node] of ir.nodes) {
    if (ExternalNode.is(node)) {
      const symbols: string[] = map.get(node.from) ?? [];
      symbols.push(node.symbol);
      map.set(node.from, symbols);
    }
  }

  return lines(
    ...[...map.entries()].map(
      ([from, symbols]) => `import { ${symbols.join(", ")} } from "${from}";`
    )
  );
}
