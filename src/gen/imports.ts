import { ASTSpec } from "../specification";
import { lines } from "./utils";

export function imports(spec: ASTSpec): string {
  const imports: string[] = [];
  let optionals = false;
  for (const [_, leaf] of spec.leaves) {
    for (const [_, type] of leaf.fields.entries()) {
      optionals = optionals || type.struct === "optional";
    }
  }
  if (optionals && spec.options.optional === "purify") {
    imports.push("import { Maybe } from 'purify-ts/Maybe';");
  }
  return lines(...imports);
}
