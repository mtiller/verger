import { IRRoot, LeafNode, UnionNode } from "../irepr/nodes";
import { ASTLeafType } from "../specification/nodes";
import { comment, lines } from "./utils";

export function generateUnions(ir: IRRoot): string {
  const unions = [...ir.nodes.entries()].filter((x): x is [string, UnionNode] =>
    UnionNode.is(x[1])
  );
  const unionSource = unions.map((x) => generateUnion(ir, x[0], x[1]));
  return lines(...unionSource);
}

/** Generate code for each union node */
export function generateUnion(ir: IRRoot, n: string, union: UnionNode): string {
  const header = comment(
    "This code implements the types and functions associated with",
    `the union type ${n}.`
  );
  const type = `export type ${n} = ${union.members.join(" | ")};`;
  const leafNames = unionLeaves(n, union, ir);

  const classDef = lines(
    `export namespace ${n} {`,
    lines(
      comment(
        `Given an instance of \`any\` determine it is an instance of any of the leaf types of ${n}`
      ),
      `  export const anyIs = (n: any): n is ${n} => {
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
      comment(`Given an instance of ${n}, return a list of all children`),
      `  export const children = (n: ${n}): readonly ${n}[] => map(n, {${leafNames
        .map(
          (leafName) =>
            `${leafName.name}: (c): readonly ${n}[] => ${leafName.name}.children(c).map(x => x as any).filter(anyIs)`
        )
        .join(",")}})`,
      comment(
        `Given an instance of type ${n}, map that value depending on the`,
        "specific underlying node type"
      ),
      `  export const map = <R>(n: ${n}, f: ${matchPayload(
        leafNames,
        "R"
      )}) => ${matchBody(n, leafNames, ir)}`,
      comment(
        `Given an instance of type ${n}, map that value for certain subtypes`,
        "and for all others, simply return the `orElse` argument"
      ),
      `  export const partialMap = <R>(n: ${n}, f: Partial<${matchPayload(
        leafNames,
        "R"
      )}>, orElse: R) => ${partialMatchBody(leafNames, ir, false)}`,
      comment(
        `Given an instance of type ${n}, take action depending on the`,
        "specific underlying node type"
      ),
      `  export const match = (n: ${n}, f: ${matchPayload(
        leafNames,
        "void"
      )}): void => ${matchBody(n, leafNames, ir)}`,
      comment(
        `Given an instance of type ${n}, take action for certain subtypes`,
        "and for all others, simply return the `orElse` argument"
      ),
      `  export const partialMatch = (n: ${n}, f: Partial<${matchPayload(
        leafNames,
        "void"
      )}>, orElse?: (n: ${n}) => void) => ${partialMatchBody(
        leafNames,
        ir,
        true
      )}`,
      "}"
    )
  );
  return lines("", header, type, classDef, "");
}

function matchBody(type: string, leaves: LeafNode[], ir: IRRoot) {
  const ret: string[] = ["{"];
  ret.push(`    switch(n.${ir.options.tagName}) {`);
  for (const leaf of leaves) {
    ret.push(`      case "${leaf.tag}": return f.${leaf.name}(n)`);
  }
  ret.push(
    `      default: { const x: never = n; throw new Error("Instance of ${type} has unexpected value for ${ir.options.tagName}: "+(n as any).tag)}`
  );
  ret.push("    }");
  ret.push("  }");
  return lines(...ret);
}

function partialMatchBody(leaves: LeafNode[], ir: IRRoot, foreach: boolean) {
  const ret: string[] = ["{"];
  for (const leaf of leaves) {
    ret.push(
      `      if (n.${ir.options.tagName}==="${leaf.tag}" && f.${leaf.name}) return f.${leaf.name}(n);`
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

function matchPayload(leaves: LeafNode[], r: string): string {
  const ret: string[] = ["{"];
  for (const leaf of leaves) {
    ret.push(`    ${leaf.name}: (n: ${leaf.name}) => ${r}`);
  }
  ret.push("  }");
  return lines(...ret);
}

function unionLeaves(n: string, u: UnionNode, ir: IRRoot): LeafNode[] {
  let ret: LeafNode[] = [];
  for (const member of u.members) {
    const node = ir.nodes.get(member);
    if (node === undefined) {
      throw new Error(`Unknown member type ${member} of union ${n}.`);
    }
    if (UnionNode.is(node)) {
      ret = [...ret, ...unionLeaves(member, node, ir)];
    } else if (LeafNode.is(node)) {
      ret.push(node);
    } else {
      // Skip
    }
  }
  return ret;
}
