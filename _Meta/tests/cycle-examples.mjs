import assert from "node:assert/strict";
import { snippet } from "./note-examples.mjs";

const cases = {
  tdz: ["a.mjs", "b.mjs"],
  late: ["a.mjs", "b.mjs", "main.mjs"],
  classes: ["user.mjs", "admin.mjs"],
  composed: ["roles.mjs", "permissions.mjs", "repository.mjs", "main.mjs"],
  cjs: ["a.cjs", "b.cjs", "main.cjs"],
  lazy: ["core.mjs", "feature.mjs", "main.mjs"],
  waiting: ["a.mjs", "b.mjs"],
};

export function cycleFiles(name) {
  if (name === "replacement") {
    return {
      ...cycleFiles("cjs"),
      "a.cjs": snippet("Circular Dependencies", "// replacement/a.cjs:"),
    };
  }
  assert.ok(Object.hasOwn(cases, name), `Caso non previsto: ${name}`);
  return Object.fromEntries(
    cases[name].map((file) => [
      file,
      snippet("Circular Dependencies", `// ${name}/${file}\n`),
    ]),
  );
}
