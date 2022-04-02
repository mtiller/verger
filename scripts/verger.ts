#!/usr/bin/env node
import { readFile, writeFile } from "fs-extra";
import { Cli, Command, Option } from "clipanion";
import yaml from "yaml";
import { loadSpec } from "../src/specification";
import { generate } from "../src/gen";
import { buildIR } from "../src/irepr/build";
import { generate2 } from "../src/gen2";

const [node, app, ...args] = process.argv;

const cli = new Cli({
  binaryLabel: `AST Generator`,
  binaryName: `${node} ${app}`,
  binaryVersion: `1.0.0`,
});

class GenerateCommand extends Command {
  inputFile = Option.String();
  outputFile = Option.String();
  async execute() {
    const raw = await readFile(this.inputFile);
    const spec = yaml.parse(raw.toString());
    const types = loadSpec(spec);
    const ir = buildIR(types);
    const output = generate(types);
    const output2 = generate2(ir);
    await writeFile(this.outputFile, output2);
  }
}

cli.register(GenerateCommand);
cli.runExit(args, Cli.defaultContext);
