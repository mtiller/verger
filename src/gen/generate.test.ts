import fs from "fs";
import path from "path";
import yaml from "yaml";
import { loadSpec } from "../specification";
import { generate } from "./generate";

describe("Test sample AST specifications", () => {
  ["expr"].forEach((file) => {
    it(`should generate proper output for ${file}.yaml`, () => {
      const raw = fs.readFileSync(
        path.join(__dirname, "..", "..", "samples", `${file}.yaml`)
      );
      const spec = yaml.parse(raw.toString());
      const types = loadSpec(spec);
      const output = generate(types);

      expect(output).toMatchSnapshot();
    });
    it(`should generate proper output for ${file}.yaml using purify`, () => {
      const raw = fs.readFileSync(
        path.join(__dirname, "..", "..", "samples", `${file}.yaml`)
      );
      const spec = yaml.parse(raw.toString());
      spec.options.optional = "purify";
      const types = loadSpec(spec);
      const output = generate(types);

      expect(output).toMatchSnapshot();
    });
  });
});
