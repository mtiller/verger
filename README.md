## AST Generation

The purpose of this package is to take relatively simple specifications of
abstract syntax tree (AST) node types (and their relationships to each other) and
generate a collection of TypeScript types and functions associated with each
node type.

## Specification

A basic example of the AST specification would be:

```yaml
nodes:
  Expr:
    Literal:
      - value: number
    ArithmeticOp:
      - op: ["+", "-", "*", "/"]
      - left: Expr
      - right: Expr
    UnaryOp:
      - expr: Expr
      - op: ["()", "+", "-"]
    RelOp:
      - op: [">", "<", ">=", "<=", "=="]
      - left: Expr
      - right: Expr
```

The `nodes` field in this document identifies the start of the AST node
specification. In this case, it features a single child called `Expr`. The
tree (or trees, more on that later) under the `nodes` field represents nested
set of union types. So in this example, what we see here is that an `Expr` node
has 4 possible types, `Literal`, `ArithmeticOp`, `UnaryOp` and `RelOp`.

### Union Nodes vs. Leaf Nodes

In the above example, the `Expr` type is a union type in our AST. What that
means is that it doesn't represent a concrete node with any data. Instead, it
represents a collection of possible node types. In TypeScript, this would be
expressed as:

```typescript
export type Expr = Literal | ArithmeticOp | UnaryOp | RelOp;
```

On the other hand, the `Literal` type here is a leaf type in our AST. This
means that is has concrete data associated with it. It could be represented in
TypeScript as:

```typescript
export interface Literal {
  value: number;
}
```

So how do we specify whether a given node type, _e.g.,_ `Expr` or `Literal`,
represent a union type or a leaf type?

### Objects vs. Arrays

The distinction between union types and leaf types depends on whether that part
of the tree contains nested objects or an array of objects. Looking at the
value of `Expr` in the YAML specification, we see that it has fields (_e.g.,_
`Literal`). As such, `Expr` is an object which means `Expr` is a union type.

On the other hand, if we look at the value of `Literal` in the YAML
specification, we see that does not have any fields. It is not an object in
YAML. Instead, its value is an _array_. Any field in our specification that is
an array is treated as a leaf node.

### Fields

In the case of `Literal`, the YAML specification includes an array of objects.
The first object in that array has a key called `value` and that key's value is
the _string_ `number`. On the other hand, if we look at `UnaryOp`, we see that
it contains an array of two objects. The first has a key of `expr` and that
key's value is a string, `Expr`. However, the next element in the array is
another object with a key of `op` and the `op` key has a value that is an array.

There are many possible variations for field specifications. Fields are always
specified as an array of objects. Each of those objects must have a **single
key**. That single key is the name of the field. The value of the field
specifies the field type. But, as shown in [#field-types], there are many different variations for
specifying a field type.

### What is the point?

OK, so we have this specification of a simple abstract expression tree. What is
the point of creating this specification? Well, the main point is to avoid
writing lots of tedious code. To use such an abstract syntax tree in
TypeScript, we'd of course have to define interfaces for all these types. We'd
probably also want to implement "constructors" to make it easy to build these
nodes. Then we'd probably want to write some functions that allow us to walk
these trees and/or identify the types of nodes.

The key point here is that we don't really need to write all that code. We
simply need to write a specification like the one above and then we can
_generate_ all that code. For example, if we compile the specification above we
will get a TypeScript file that contains 343 lines of code containing type
definitions for all these nodes as well as functions to instantiate nodes,
determine the types of nodes and enumerate the children of nodes.

### DRY

Looking at the above specification, we see two different leaf types that feature
both a `left` and a `right` value that are both of type `Expr`. We can avoid
this duplication by writing our specification as follows:

```yaml
nodes:
  BinaryOp:
    - left: Expr
    - right: Expr
  Expr:
    Literal:
      - value: number
    ArithmeticOp:
      - ^: BinaryOp
      - op: ["+", "-", "*", "/"]
    UnaryOp:
      - expr: Expr
      - op: ["()", "+", "-"]
    RelOp:
      - ^: BinaryOp
      - op: [">", "<", ">=", "<=", "=="]
```

What is different here is that we introduced another type `BinaryOp` under our
`nodes` specification. This is _not_ a union type. Instead, it will simply be
resolved to a TypeScript leaf type (that doesn't belong to any union type). But
with that leaf type defined, we can extend from that type. We see this done in
both the `ArithmeticOp` and `RelOp` types. If a leaf type node includes any
fields named `^`, we don't treat them as fields but instead treat them
as identifying interfaces that this leaf (interface) extends from.

So, the specification of `RelOp` in this case will look something like this in
TypeScript:

```typescript
export interface RelOp extends BinaryOp {
  op: ">" | "<" | ">=" | "<=" | "==";
}
```

### Field Types

Here is a "cheatsheet" of how field values are translated into TypeScript types:

| Field Spec | Meaing | TypeScript |
| `name: string` | Simple field | `name: string ` |
| `bases: string[]` | Array | `bases: string[]` |
| `fields: Field{}` | Map/Object (configurable) | `fields: Map<string, Field>` or
`fields:Record<string, Field>` |
| `struct: .scalar|.optional|.map` | Union of strings | `struct: "scalar" | "optional" | "map"` |
| `types: <string>` | Set | `types: Set<string>` |
| `else: Expr?` | Optional | `else?: Expr` |

This shorthand syntax not only allows for a succint way of specifying the types,
it provides a complete specification of the types that we will use later as well.
