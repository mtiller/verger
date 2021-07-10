import { ASTLeafType, ASTSpec, ASTUnionType } from "../specification";
import { unionLeaves } from "./properties";
import { comment, lines } from "./utils";

/** Generate code for each union node */
export function unionCode(a: ASTUnionType, spec: ASTSpec): string {
  const header = comment(
    "This code implements the types and functions associated with",
    `the union type ${a.name}.`
  );
  const type = `export type ${a.name} = ${a.subtypes.join(" | ")};`;
  const leaves = unionLeaves(a, spec);
  const classDef = lines(
    `namespace ${a.name} {`,
    lines(
      comment(
        `Given an instance of type ${a.name}, map that value depending on the`,
        "specific underlying node type"
      ),
      `  export const match = <R>(n: ${a.name}, f: ${matchPayload(
        leaves,
        "R"
      )}) => ${matchBody(a.name, leaves, spec)}`,
      comment(
        `Given an instance of type ${a.name}, map that value for certain subtypes`,
        "and for all others, simply return the `orElse` argument"
      ),
      `  export const partialMatch = <R>(n: ${
        a.name
      }, f: Partial<${matchPayload(
        leaves,
        "R"
      )}>, orElse: R) => ${partialMatchBody(leaves, spec, false)}`,
      comment(
        `Given an instance of type ${a.name}, take action depending on the`,
        "specific underlying node type"
      ),
      `  export const forEach = (n: ${a.name}, f: ${matchPayload(
        leaves,
        "void"
      )}): void => ${matchBody(a.name, leaves, spec)}`,
      comment(
        `Given an instance of type ${a.name}, take action for certain subtypes`,
        "and for all others, simply return the `orElse` argument"
      ),
      `  export const partialForEach = (n: ${a.name}, f: Partial<${matchPayload(
        leaves,
        "void"
      )}>, orElse?: (n: ${a.name}) => void) => ${partialMatchBody(
        leaves,
        spec,
        true
      )}`
    ),
    "}"
  );
  return lines("", header, type, classDef, "");
}

function matchBody(type: string, leaves: ASTLeafType[], spec: ASTSpec) {
  const ret: string[] = ["{"];
  ret.push(`    switch(n.${spec.options.tagName}) {`);
  for (const leaf of leaves) {
    ret.push(`      case "${leaf.tag}": return f.${leaf.name}(n)`);
  }
  ret.push(
    `      default: { const x: never = n; throw new Error("Instance of ${type} has unexpected value for ${spec.options.tagName}: "+(n as any).tag)}`
  );
  ret.push("    }");
  ret.push("  }");
  return lines(...ret);
}

function partialMatchBody(
  leaves: ASTLeafType[],
  spec: ASTSpec,
  foreach: boolean
) {
  const ret: string[] = ["{"];
  for (const leaf of leaves) {
    ret.push(
      `      if (n.${spec.options.tagName}==="${leaf.tag}" && f.${leaf.name}) return f.${leaf.name}(n);`
    );
  }
  if (foreach) {
    ret.push(`      if (orElse) return orElse(n)`);
  } else {
    ret.push(`      return orElse;`);
  }
  ret.push("    }");
  return lines(...ret);
}

function matchPayload(leaves: ASTLeafType[], r: string): string {
  const ret: string[] = ["{"];
  for (const leaf of leaves) {
    ret.push(`    ${leaf.name}: (n: ${leaf.name}) => ${r}`);
  }
  ret.push("  }");
  return lines(...ret);
}
