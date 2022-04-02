import { ExternalNode, IRRoot } from "../irepr/nodes";
import { generateBases } from "./base";
import { generateImports } from "./imports";
import { generateLeaves } from "./leaves";
import { generateUnions } from "./unions";
import { lines } from "./utils";

export function generate2(ir: IRRoot): string {
  const imports = generateImports(ir);

  const bases = generateBases(ir);

  const leaves = generateLeaves(ir);

  const unions = generateUnions(ir);

  return lines(imports, bases, leaves, unions);
}
