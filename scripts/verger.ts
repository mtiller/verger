#!/usr/bin/env node
import { readFile, writeFile } from "fs-extra";
import { Cli, Command, Option } from "clipanion";
import yaml from "yaml";
import { loadSpec } from "../src/specification";
import { generate } from "../src/gen";

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
    const output = generate(types);
    await writeFile(this.outputFile, output);
  }
}

cli.register(GenerateCommand);
cli.runExit(args, Cli.defaultContext);
