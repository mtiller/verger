export interface ASTUnionType {
    type: "union";
    name: string;
    subtypes: string[];
}

export interface ASTLeafType {
    type: "leaf";
    name: string;
    fields: Map<string, string>;
}

export type ASTTree = ASTUnionType | ASTLeafType;

export function createASTTree(spec: any) {
    const types = new Map<string, ASTTree>();
    if (spec.hasOwnProperty("nodes")) {
        const root = spec["nodes"];
        for(const [name, content] of Object.entries(root)) {
            processSpecNode(name, content, types);            
        }
        for(const [name, node] of types) {
            console.log(`${name}: ${node.type}`)
        }
        return types;
    } else {
        throw new Error("Missing nodes field")
    }
}

function processSpecNode(name: string, content: any, types: Map<string, ASTTree>): ASTTree {
    if (content===null || content===undefined) throw new Error(`Missing content for ${name}`)
    if (Array.isArray(content)) {
        const ret: ASTLeafType = {
            type: "leaf",
            name: name,
            fields: new Map<string, string>(),
        }
        for(const item of content) {
            const keys = Object.keys(item);
            if (keys.length!==1) {
                throw new Error(`Unexpected field type specification: ${JSON.stringify(item)}`)
            } else {
                ret.fields.set(keys[0], item[keys[0]])
            }
        }
        if (types.has(name)) {
            throw new Error(`Multiple definitions for type ${name}`)
        }
        types.set(name, ret);
        return ret;
    } else {
        const subtypes = Object.keys(content);
        const ret: ASTUnionType = {
            type: "union",
            name: name,
            subtypes
        }
        for(const [subtype, contents] of Object.entries(content)) {
            ret.subtypes.push(subtype);
            processSpecNode(subtype,contents, types);
        }
        if (types.has(name)) {
            throw new Error(`Multiple definitions for type ${name}`)
        }
        types.set(name, ret);
        return ret;
    }
}