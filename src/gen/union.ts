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
  const leafNames = unionLeaves(a, spec);

  const classDef = lines(
    `export namespace ${a.name} {`,
    lines(
      comment(
        `Given an instance of \`any\` determine it is an instance of any of the leaf types of ${a.name}`
      ),
      `  export const anyIs = (n: any): n is ${a.name} => {
        ${leafNames
          .map((leafName) => `if (${leafName.name}.anyIs(n)) return true;`)
          .join("\n")}
        return false;
}`,
      /**
       * NB - the `.map(x => x as any).filter(anyIs)` here is a way of identifying only those children
       * that are instances of the root union here.  Unfortunately, this implementation is making this
       * determination at **runtime**.  It should be possible to refactor this code and **statically**
       * determine what fields to include.  This is a potential future enhancement.
       *
       * TODO - Determine appropriately typed children statically
       */
      comment(`Given an instance of ${a.name}, return a list of all children`),
      `  export const children = (n: ${a.name}): readonly ${
        a.name
      }[] => map(n, {${leafNames
        .map(
          (leafName) =>
            `${leafName.name}: (c): readonly ${a.name}[] => ${leafName.name}.children(c).map(x => x as any).filter(anyIs)`
        )
        .join(",")}})`,
      comment(
        `Given an instance of type ${a.name}, map that value depending on the`,
        "specific underlying node type"
      ),
      `  export const map = <R>(n: ${a.name}, f: ${matchPayload(
        leafNames,
        "R"
      )}) => ${matchBody(a.name, leafNames, spec)}`,
      comment(
        `Given an instance of type ${a.name}, map that value for certain subtypes`,
        "and for all others, simply return the `orElse` argument"
      ),
      `  export const partialMap = <R>(n: ${a.name}, f: Partial<${matchPayload(
        leafNames,
        "R"
      )}>, orElse: R) => ${partialMatchBody(leafNames, spec, false)}`,
      comment(
        `Given an instance of type ${a.name}, take action depending on the`,
        "specific underlying node type"
      ),
      `  export const match = (n: ${a.name}, f: ${matchPayload(
        leafNames,
        "void"
      )}): void => ${matchBody(a.name, leafNames, spec)}`,
      comment(
        `Given an instance of type ${a.name}, take action for certain subtypes`,
        "and for all others, simply return the `orElse` argument"
      ),
      `  export const partialMatch = (n: ${a.name}, f: Partial<${matchPayload(
        leafNames,
        "void"
      )}>, orElse?: (n: ${a.name}) => void) => ${partialMatchBody(
        leafNames,
        spec,
        true
      )}`,
      "}"
    )
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
