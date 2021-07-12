import fs from "fs";
import path from "path";
import yaml from "yaml";
import { loadSpec } from "../specification";
import { generate } from "./generate";

describe("Test sample AST specifications", () => {
  ["expr", "repmin", "kitchen"].forEach((file) => {
    it(`should generate proper output for ${file}.yaml using json`, () => {
      const raw = fs.readFileSync(
        path.join(__dirname, "..", "..", "samples", `${file}.yaml`)
      );
      const spec = yaml.parse(raw.toString());
      const types = loadSpec(spec);
      types.options.optional = "json";
      const output = generate(types);

      expect(types).toMatchSnapshot();
      expect(output).toMatchSnapshot();
    });
    it(`should generate proper output for ${file}.yaml using purify`, () => {
      const raw = fs.readFileSync(
        path.join(__dirname, "..", "..", "samples", `${file}.yaml`)
      );
      const spec = yaml.parse(raw.toString());
      const types = loadSpec(spec);
      types.options.optional = "purify";
      const output = generate(types);

      expect(types).toMatchSnapshot();
      expect(output).toMatchSnapshot();
    });
  });
});
