export interface ScalarField {
  type: "scalar";
  optional: boolean;
  name: string;
}

export interface LiteralValues {
  type: "literals";
  optional: boolean;
  tags: string[];
}

export interface NodeField {
  type: "node";
  optional: boolean;
  name: string;
}

export const isNodeField = (x: FieldType): x is NodeField => {
  return x.type === "node";
};

export const isNodeFieldEntry = (
  x: [string, FieldType]
): x is [string, NodeField] => {
  return isNodeField(x[1]);
};

export type FieldType = ScalarField | LiteralValues | NodeField;
