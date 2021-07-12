/**
 * DO NOT EDIT - This file was generated by verger.  If you want to change something
 * edit the upstream AST specification and regenerate this file
 **/

/**
 * This code implements the types and functions associated with
 * the base type ASTBaseType.
 **/
export interface ASTBaseType {
  name: string;
  bases: string[];
  fields: Map<string, Field>;
}

/**
 * This code implements the types and functions associated with
 * the base type Field.
 **/
export interface Field {
  type: FieldType;
  struct: "scalar" | "optional" | "map" | "array" | "set";
}

/**
 * This code implements the types and functions associated with
 * the leaf type BuiltinType.
 **/
export interface BuiltinType {
  kind: "builtintype";
  types: Set<string>;
}
export class BuiltinType {
  /**
   * A predicate function that take an instance of type FieldType and determines if it is an instance of BuiltinType
   **/
  static is = (x: FieldType): x is BuiltinType => {
    return x.kind === "builtintype";
  };
  /**
   * Given an instance of BuiltinType, determine all children that are instances of FieldType
   **/
  static children = (x: BuiltinType) => {
    return [] as const;
  };
  /**
   * Although generally not necessary, this tag can be used to identify instances of BuiltinType
   **/
  static tag = "builtintype";
}
/**
 * This function can be invoked to create a new instance of BuiltinType
 **/
export function builtinType(types: Set<string>): BuiltinType {
  return { kind: "builtintype", types };
}

/**
 * This code implements the types and functions associated with
 * the leaf type EnumType.
 **/
export interface EnumType {
  kind: "enumtype";
  tags: string[];
}
export class EnumType {
  /**
   * A predicate function that take an instance of type FieldType and determines if it is an instance of EnumType
   **/
  static is = (x: FieldType): x is EnumType => {
    return x.kind === "enumtype";
  };
  /**
   * Given an instance of EnumType, determine all children that are instances of FieldType
   **/
  static children = (x: EnumType) => {
    return [] as const;
  };
  /**
   * Although generally not necessary, this tag can be used to identify instances of EnumType
   **/
  static tag = "enumtype";
}
/**
 * This function can be invoked to create a new instance of EnumType
 **/
export function enumType(tags: string[]): EnumType {
  return { kind: "enumtype", tags };
}

/**
 * This code implements the types and functions associated with
 * the leaf type NodeType.
 **/
export interface NodeType {
  kind: "nodetype";
  types: string[];
}
export class NodeType {
  /**
   * A predicate function that take an instance of type FieldType and determines if it is an instance of NodeType
   **/
  static is = (x: FieldType): x is NodeType => {
    return x.kind === "nodetype";
  };
  /**
   * Given an instance of NodeType, determine all children that are instances of FieldType
   **/
  static children = (x: NodeType) => {
    return [] as const;
  };
  /**
   * Although generally not necessary, this tag can be used to identify instances of NodeType
   **/
  static tag = "nodetype";
}
/**
 * This function can be invoked to create a new instance of NodeType
 **/
export function nodeType(types: string[]): NodeType {
  return { kind: "nodetype", types };
}

/**
 * This code implements the types and functions associated with
 * the leaf type ASTUnionType.
 **/
export interface ASTUnionType {
  kind: "astuniontype";
  name: string;
  subtypes: string[];
}
export class ASTUnionType {
  /**
   * A predicate function that take an instance of type ASTTree and determines if it is an instance of ASTUnionType
   **/
  static is = (x: ASTTree): x is ASTUnionType => {
    return x.kind === "astuniontype";
  };
  /**
   * Given an instance of ASTUnionType, determine all children that are instances of ASTTree
   **/
  static children = (x: ASTUnionType) => {
    return [] as const;
  };
  /**
   * Although generally not necessary, this tag can be used to identify instances of ASTUnionType
   **/
  static tag = "astuniontype";
}
/**
 * This function can be invoked to create a new instance of ASTUnionType
 **/
export function astUnionType(name: string, subtypes: string[]): ASTUnionType {
  return { kind: "astuniontype", name, subtypes };
}

/**
 * This code implements the types and functions associated with
 * the leaf type ASTLeafType.
 **/
export interface ASTLeafType {
  kind: "astleaftype";
  tag: string;
  rootUnion: ASTUnionType;
  name: string;
  bases: string[];
  fields: Map<string, Field>;
}
export class ASTLeafType {
  /**
   * A predicate function that take an instance of type ASTTree and determines if it is an instance of ASTLeafType
   **/
  static is = (x: ASTTree): x is ASTLeafType => {
    return x.kind === "astleaftype";
  };
  /**
   * Given an instance of ASTLeafType, determine all children that are instances of ASTTree
   **/
  static children = (x: ASTLeafType) => {
    return [x.rootUnion, ...Object.entries(x.fields).map((x) => x[1])] as const;
  };
  /**
   * Although generally not necessary, this tag can be used to identify instances of ASTLeafType
   **/
  static tag = "astleaftype";
}
/**
 * This function can be invoked to create a new instance of ASTLeafType
 **/
export function astLeafType(
  tag: string,
  rootUnion: ASTUnionType,
  name: string,
  bases: string[],
  fields: Map<string, Field>
): ASTLeafType {
  return { kind: "astleaftype", tag, rootUnion, name, bases, fields };
}

/**
 * This code implements the types and functions associated with
 * the union type FieldType.
 **/
export type FieldType = BuiltinType | EnumType | NodeType;
export namespace FieldType {
  /**
   * Given an instance of type FieldType, map that value depending on the
   * specific underlying node type
   **/
  export const map = <R>(
    n: FieldType,
    f: {
      BuiltinType: (n: BuiltinType) => R;
      EnumType: (n: EnumType) => R;
      NodeType: (n: NodeType) => R;
    }
  ) => {
    switch (n.kind) {
      case "builtintype":
        return f.BuiltinType(n);
      case "enumtype":
        return f.EnumType(n);
      case "nodetype":
        return f.NodeType(n);
      default: {
        const x: never = n;
        throw new Error(
          "Instance of FieldType has unexpected value for kind: " +
            (n as any).tag
        );
      }
    }
  };
  /**
   * Given an instance of type FieldType, map that value for certain subtypes
   * and for all others, simply return the `orElse` argument
   **/
  export const partialMap = <R>(
    n: FieldType,
    f: Partial<{
      BuiltinType: (n: BuiltinType) => R;
      EnumType: (n: EnumType) => R;
      NodeType: (n: NodeType) => R;
    }>,
    orElse: R
  ) => {
    if (n.kind === "builtintype" && f.BuiltinType) return f.BuiltinType(n);
    if (n.kind === "enumtype" && f.EnumType) return f.EnumType(n);
    if (n.kind === "nodetype" && f.NodeType) return f.NodeType(n);
    return orElse;
  };
  /**
   * Given an instance of type FieldType, take action depending on the
   * specific underlying node type
   **/
  export const match = (
    n: FieldType,
    f: {
      BuiltinType: (n: BuiltinType) => void;
      EnumType: (n: EnumType) => void;
      NodeType: (n: NodeType) => void;
    }
  ): void => {
    switch (n.kind) {
      case "builtintype":
        return f.BuiltinType(n);
      case "enumtype":
        return f.EnumType(n);
      case "nodetype":
        return f.NodeType(n);
      default: {
        const x: never = n;
        throw new Error(
          "Instance of FieldType has unexpected value for kind: " +
            (n as any).tag
        );
      }
    }
  };
  /**
   * Given an instance of type FieldType, take action for certain subtypes
   * and for all others, simply return the `orElse` argument
   **/
  export const partialMatch = (
    n: FieldType,
    f: Partial<{
      BuiltinType: (n: BuiltinType) => void;
      EnumType: (n: EnumType) => void;
      NodeType: (n: NodeType) => void;
    }>,
    orElse?: (n: FieldType) => void
  ) => {
    if (n.kind === "builtintype" && f.BuiltinType) return f.BuiltinType(n);
    if (n.kind === "enumtype" && f.EnumType) return f.EnumType(n);
    if (n.kind === "nodetype" && f.NodeType) return f.NodeType(n);
    if (orElse) return orElse(n);
  };
}

/**
 * This code implements the types and functions associated with
 * the union type ASTTree.
 **/
export type ASTTree = ASTUnionType | ASTLeafType;
export namespace ASTTree {
  /**
   * Given an instance of type ASTTree, map that value depending on the
   * specific underlying node type
   **/
  export const map = <R>(
    n: ASTTree,
    f: {
      ASTUnionType: (n: ASTUnionType) => R;
      ASTLeafType: (n: ASTLeafType) => R;
    }
  ) => {
    switch (n.kind) {
      case "astuniontype":
        return f.ASTUnionType(n);
      case "astleaftype":
        return f.ASTLeafType(n);
      default: {
        const x: never = n;
        throw new Error(
          "Instance of ASTTree has unexpected value for kind: " + (n as any).tag
        );
      }
    }
  };
  /**
   * Given an instance of type ASTTree, map that value for certain subtypes
   * and for all others, simply return the `orElse` argument
   **/
  export const partialMap = <R>(
    n: ASTTree,
    f: Partial<{
      ASTUnionType: (n: ASTUnionType) => R;
      ASTLeafType: (n: ASTLeafType) => R;
    }>,
    orElse: R
  ) => {
    if (n.kind === "astuniontype" && f.ASTUnionType) return f.ASTUnionType(n);
    if (n.kind === "astleaftype" && f.ASTLeafType) return f.ASTLeafType(n);
    return orElse;
  };
  /**
   * Given an instance of type ASTTree, take action depending on the
   * specific underlying node type
   **/
  export const match = (
    n: ASTTree,
    f: {
      ASTUnionType: (n: ASTUnionType) => void;
      ASTLeafType: (n: ASTLeafType) => void;
    }
  ): void => {
    switch (n.kind) {
      case "astuniontype":
        return f.ASTUnionType(n);
      case "astleaftype":
        return f.ASTLeafType(n);
      default: {
        const x: never = n;
        throw new Error(
          "Instance of ASTTree has unexpected value for kind: " + (n as any).tag
        );
      }
    }
  };
  /**
   * Given an instance of type ASTTree, take action for certain subtypes
   * and for all others, simply return the `orElse` argument
   **/
  export const partialMatch = (
    n: ASTTree,
    f: Partial<{
      ASTUnionType: (n: ASTUnionType) => void;
      ASTLeafType: (n: ASTLeafType) => void;
    }>,
    orElse?: (n: ASTTree) => void
  ) => {
    if (n.kind === "astuniontype" && f.ASTUnionType) return f.ASTUnionType(n);
    if (n.kind === "astleaftype" && f.ASTLeafType) return f.ASTLeafType(n);
    if (orElse) return orElse(n);
  };
}
