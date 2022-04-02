import { ExternalNode, IRRoot } from "../irepr/nodes";
import { generateImports } from "./imports";
import { generateLeaves } from "./leaves";
import { generateUnions } from "./unions";
import { lines } from "./utils";

export function generate2(ir: IRRoot): string {
  const imports = generateImports(ir);

  const leaves = generateLeaves(ir);

  const unions = generateUnions(ir);

  return lines(imports, leaves, unions);
}
