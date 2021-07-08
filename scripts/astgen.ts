import { readFile } from "fs-extra";
import { Cli, Command, Option } from "clipanion";
import yaml from "yaml";
import { createASTTree } from "../src/specification";
import { generate } from "../src/gen";

const [node, app, ...args] = process.argv;

const cli = new Cli({
    binaryLabel: `AST Generator`,
    binaryName: `${node} ${app}`,
    binaryVersion: `1.0.0`,
})

class GenerateCommand extends Command {
    inputFile = Option.String();
    async execute() {
        console.log("Run");
        const raw = await readFile(this.inputFile);
        const spec = yaml.parse(raw.toString());
        const types = createASTTree(spec);
        const output = generate(types);
        console.log(output);
    }
}

cli.register(GenerateCommand);
cli.runExit(args, Cli.defaultContext);