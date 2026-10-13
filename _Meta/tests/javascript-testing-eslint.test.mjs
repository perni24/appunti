import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mkdtemp,
  realpath,
  mkdir,
  readFile,
  writeFile,
  rm,
  symlink,
} from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { snippet } from "./note-examples.mjs";

const exec = promisify(execFile);
const toolsDir = path.resolve(
  process.env.ESLINT_TOOLS_DIR ?? path.join(tmpdir(), "appunti-eslint-tools"),
);
const deps = await realpath(path.join(toolsDir, "node_modules"));
const requireTools = createRequire(path.join(toolsDir, "package.json"));
const { ESLint } = requireTools("eslint");
const eslintCli = path.join(deps, "eslint/bin/eslint.js");
const npmCli = process.env.NPM_CLI_PATH;
assert.ok(
  npmCli,
  "Set NPM_CLI_PATH to the installed npm CLI JavaScript entry point",
);
const asModule = (code) =>
  import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
const discountSource = snippet("Testing", "export function applyDiscount");
const loaderSource = snippet("Testing", "export function createUserLoader");
const { applyDiscount } = await asModule(discountSource);
const { createUserLoader } = await asModule(loaderSource);

async function fixture(t) {
  const temp = await realpath(tmpdir());
  const root = await mkdtemp(path.join(temp, "appunti-testing-eslint-"));
  t.after(async () => {
    const actual = await realpath(root);
    assert.equal(actual, root);
    assert.ok(actual.startsWith(path.resolve(temp) + path.sep));
    assert.ok(path.basename(actual).startsWith("appunti-testing-eslint-"));
    await rm(actual, { recursive: true, force: true });
  });
  const file = (name) => path.join(root, name);
  async function put(name, source) {
    await mkdir(path.dirname(file(name)), { recursive: true });
    await writeFile(file(name), source);
  }
  await symlink(
    deps,
    file("node_modules"),
    process.platform === "win32" ? "junction" : "dir",
  );
  for (const [name, note, marker, language = "js"] of [
    ["src/discount.mjs", "Testing", "export function applyDiscount"],
    ["src/user-loader.mjs", "Testing", "export function createUserLoader"],
    ["test/discount.test.mjs", "Testing", 'test("applica uno sconto'],
    ["test/user-loader.test.mjs", "Testing", 'test("restituisce solo i campi'],
    ["package.json", "ESLint", '"name": "javascript-quality-demo"', "json"],
    ["eslint.config.mjs", "ESLint", "export default defineConfig"],
    ["src/shared/total.mjs", "ESLint", "return items.reduce"],
    ["src/browser/title.mjs", "ESLint", "export function setTitle"],
    ["src/server/runtime.mjs", "ESLint", "export function runtimeVersion"],
    ["test/total.test.mjs", "ESLint", 'test("somma prezzi numerici'],
  ])
    await put(name, snippet(note, marker, language));
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      /^(PATH|SYSTEMROOT|WINDIR|COMSPEC|PATHEXT|TEMP|TMP|HOME|USERPROFILE)$/i.test(
        key,
      ),
    ),
  );
  async function run(args, options = {}) {
    try {
      return {
        code: 0,
        ...(await exec(process.execPath, args, {
          cwd: root,
          env,
          encoding: "utf8",
          windowsHide: true,
          timeout: 20_000,
          maxBuffer: 2 * 1024 * 1024,
          ...options,
        })),
      };
    } catch (error) {
      if (typeof error.code !== "number" || error.killed) throw error;
      return { code: error.code, stdout: error.stdout, stderr: error.stderr };
    }
  }
  return {
    root,
    file,
    put,
    run,
    lint: (options = {}) => new ESLint({ cwd: root, ...options }),
    cli: (args) => run([eslintCli, ...args]),
    npm: (args) => run([npmCli, ...args]),
    text: async (code, name = "src/shared/sample.mjs") =>
      (
        await new ESLint({ cwd: root }).lintText(code, { filePath: file(name) })
      )[0],
  };
}
function success(result) {
  assert.equal(result.code, 0, result.stderr + result.stdout);
}
const ids = (result) => result.messages.map((m) => m.ruleId);

test("ESLint baseline: exact tool and preset versions", async () => {
  assert.equal(ESLint.version, "10.12.0");
  assert.equal(
    JSON.parse(await readFile(path.join(deps, "@eslint/js/package.json")))
      .version,
    "10.0.1",
  );
  assert.equal(
    JSON.parse(await readFile(path.join(deps, "globals/package.json"))).version,
    "17.13.0",
  );
});

for (const [price, rate, expected] of [
  [0, 100, 0],
  [100, 0, 100],
  [100, 100, 0],
  [10000, 10, 9000],
  [1, 50, 1],
  [3, 50, 2],
  [1000000000, 1, 990000000],
]) {
  test("discount contract: " + price + " at " + rate, () => {
    assert.equal(applyDiscount(price, rate), expected);
  });
}
for (const price of [
  -1,
  1.1,
  1000000001,
  "100",
  null,
  undefined,
  NaN,
  Infinity,
]) {
  test("discount invalid cents: " + String(price), () => {
    assert.throws(() => applyDiscount(price, 10), RangeError);
  });
}
for (const rate of [-1, 101, 1.5, "10", null, undefined, NaN, Infinity]) {
  test("discount invalid percentage: " + String(rate), () => {
    assert.throws(() => applyDiscount(100, rate), RangeError);
  });
}
test("loader requires a repository function", () => {
  for (const value of [null, {}, 1, undefined])
    assert.throws(() => createUserLoader(value), TypeError);
});
test("loader returns a public copy without mutating repository record", async () => {
  const record = Object.freeze({ id: 7, name: " Ada ", secret: "fixture" });
  const result = await createUserLoader(async () => record)(7);
  assert.deepEqual(result, { id: 7, name: "Ada" });
  assert.notEqual(result, record);
  assert.equal(record.name, " Ada ");
});
test("loader absence is null, not an exception", async () => {
  assert.equal(await createUserLoader(async () => null)(7), null);
});
test("loader preserves asynchronous and synchronous repository failures", async () => {
  const failure = new Error("controlled");
  for (const repository of [
    () => {
      throw failure;
    },
    async () => {
      throw failure;
    },
  ]) {
    await assert.rejects(
      createUserLoader(repository)(7),
      (error) => error === failure,
    );
  }
});
for (const id of [0, -1, 1.5, "7", null, Number.MAX_SAFE_INTEGER + 1]) {
  test("loader rejects id before repository: " + String(id), async () => {
    let called = false;
    const load = createUserLoader(async () => {
      called = true;
      return null;
    });
    await assert.rejects(load(id), RangeError);
    assert.equal(called, false);
  });
}
for (const record of [
  undefined,
  [],
  "Ada",
  {},
  { id: 8, name: "Ada" },
  { id: 7, name: " " },
  { id: 7, name: 42 },
]) {
  test("loader rejects record: " + JSON.stringify(record), async () => {
    await assert.rejects(createUserLoader(async () => record)(7), TypeError);
  });
}

test("Testing: complete documented run contains 11 passing tests", async (t) => {
  const f = await fixture(t);
  const result = await f.run([
    "--test",
    "--test-reporter=tap",
    "test/discount.test.mjs",
    "test/user-loader.test.mjs",
  ]);
  success(result);
  assert.match(result.stdout, /# tests 11\b/);
  assert.match(result.stdout, /# pass 11\b/);
  assert.match(result.stdout, /# fail 0\b/);
});
test("Testing: name filter selects the declared async test", async (t) => {
  const f = await fixture(t);
  const result = await f.run([
    "--test",
    "--test-reporter=tap",
    "--test-name-pattern=input invalido",
    "test/user-loader.test.mjs",
  ]);
  success(result);
  assert.match(result.stdout, /ok \d+ - input invalido/);
  assert.match(result.stdout, /# pass 1\b/);
});
test("Testing: documented coverage command executes and reports source", async (t) => {
  const f = await fixture(t);
  const result = await f.run([
    "--test",
    "--experimental-test-coverage",
    "--test-coverage-include=src/**/*.mjs",
    "test/discount.test.mjs",
    "test/user-loader.test.mjs",
  ]);
  success(result);
  assert.match(result.stdout, /discount\.mjs/);
  assert.match(result.stdout, /user-loader\.mjs/);
  assert.match(result.stdout, /coverage/i);
});
for (const [label, file, broken] of [
  [
    "wrong discount",
    "src/discount.mjs",
    discountSource.replace(
      "Math.round(priceCents * (100 - percent) / 100)",
      "priceCents",
    ),
  ],
  [
    "wrong absence",
    "src/user-loader.mjs",
    loaderSource.replace(
      "if (user === null) return null;",
      'if (user === null) return { id, name: "Unknown" };',
    ),
  ],
]) {
  test("Testing: documented suite detects " + label, async (t) => {
    const f = await fixture(t);
    await f.put(file, broken);
    const result = await f.run([
      "--test",
      "--test-reporter=tap",
      "test/discount.test.mjs",
      "test/user-loader.test.mjs",
    ]);
    assert.equal(result.code, 1);
    assert.match(result.stdout, /not ok/);
    assert.doesNotMatch(result.stdout, /# fail 0\b/);
  });
}

test("ESLint: corrected project is clean via real config and CLI", async (t) => {
  const f = await fixture(t);
  const results = await f.lint().lintFiles(["."]);
  assert.ok(results.length >= 9);
  assert.deepEqual(
    results.flatMap((r) => r.messages),
    [],
  );
  success(await f.cli([".", "--max-warnings", "0"]));
});
test("ESLint: npm scripts lint and test use installed local tools", async (t) => {
  const f = await fixture(t);
  success(await f.npm(["run", "lint"]));
  success(await f.npm(["test"]));
});
test("ESLint: map callback example fails with the named rule", async (t) => {
  const f = await fixture(t);
  await f.put("src/shared/total.mjs", snippet("ESLint", "items.map((item)"));
  const result = await f.cli(["src/shared/total.mjs", "--format", "json"]);
  assert.equal(result.code, 1);
  assert.deepEqual(ids(JSON.parse(result.stdout)[0]), [
    "array-callback-return",
  ]);
});
test("ESLint: adding an unused map result bypasses that one rule", async (t) => {
  const f = await fixture(t);
  const code = snippet("ESLint", "items.map((item)").replace(
    "total += item.price;",
    "total += item.price; return item;",
  );
  assert.deepEqual(ids(await f.text(code)), []);
});
for (const [name, code, expected] of [
  ["src/browser/sample.mjs", "export const value = document.title;", []],
  ["src/server/sample.mjs", "export const value = process.version;", []],
  [
    "src/shared/sample.mjs",
    "export const value = document.title;",
    ["no-undef"],
  ],
  [
    "src/shared/sample.mjs",
    "export const value = process.version;",
    ["no-undef"],
  ],
  [
    "src/browser/sample.mjs",
    "export const value = process.version;",
    ["no-undef"],
  ],
  [
    "src/server/sample.mjs",
    "export const value = window.location;",
    ["no-undef"],
  ],
  [
    "src/server/sample.mjs",
    'export const value = require("node:fs");',
    ["no-undef"],
  ],
  ["src/server/sample.cjs", 'module.exports = require("node:fs");', []],
  ["test/sample.mjs", 'test("missing import", () => {});', ["no-undef"]],
  [
    "src/shared/sample.mjs",
    'import value from "./not-present.mjs"; export { value };',
    [],
  ],
  [
    "src/shared/sample.mjs",
    "export const same = (a, b) => a == b;",
    ["eqeqeq"],
  ],
  ["src/shared/sample.mjs", "const value = 1;", ["no-unused-vars"]],
]) {
  test("ESLint scope: " + name + " / " + code, async (t) => {
    const f = await fixture(t);
    assert.deepEqual(ids(await f.text(code, name)), expected);
  });
}
test("ESLint: browser-only no-console warning", async (t) => {
  const f = await fixture(t);
  const browser = await f.text(
    'console.info("demo");',
    "src/browser/sample.mjs",
  );
  assert.deepEqual(ids(browser), ["no-console"]);
  assert.equal(browser.messages[0].severity, 1);
  assert.deepEqual(
    ids(await f.text('console.info("demo");', "src/server/sample.mjs")),
    [],
  );
});
test("ESLint: warning exit code differs with max-warnings", async (t) => {
  const f = await fixture(t);
  await f.put("src/shared/warning.mjs", "let value = 1; export { value };");
  const normal = await f.cli(["src/shared/warning.mjs", "--format", "json"]);
  success(normal);
  assert.deepEqual(ids(JSON.parse(normal.stdout)[0]), ["prefer-const"]);
  assert.equal(
    (await f.cli(["src/shared/warning.mjs", "--max-warnings", "0"])).code,
    1,
  );
});
test("ESLint: global ignores exclude generated files at nested paths", async (t) => {
  const f = await fixture(t);
  for (const name of [
    "dist/bad.mjs",
    "coverage/bad.mjs",
    "src/vendor/bad.mjs",
  ]) {
    await f.put(name, "not valid javascript ???");
    assert.equal(await f.lint().isPathIgnored(f.file(name)), true);
  }
  success(await f.cli([".", "--max-warnings", "0"]));
});
test("ESLint: gitignore is not imported as flat-config ignores", async (t) => {
  const f = await fixture(t);
  await f.put(".gitignore", "src/shared/ignored.mjs\n");
  await f.put("src/shared/ignored.mjs", "unknownName();");
  assert.equal(
    await f.lint().isPathIgnored(f.file("src/shared/ignored.mjs")),
    false,
  );
  assert.equal((await f.cli(["src/shared/ignored.mjs"])).code, 1);
});
test("ESLint: unnecessary disable is reported as an error", async (t) => {
  const f = await fixture(t);
  const result = await f.text(
    "// eslint-disable-next-line eqeqeq -- stale exception\nexport const value = 1;",
  );
  assert.equal(result.errorCount, 1);
  assert.match(result.messages[0].message, /Unused eslint-disable directive/);
});
test("ESLint: documented scoped suppression is used", async (t) => {
  const f = await fixture(t);
  assert.deepEqual(
    ids(
      await f.text(
        snippet("ESLint", "eslint-disable-next-line no-console"),
        "src/browser/diagnostic.mjs",
      ),
    ),
    [],
  );
});
test("ESLint: dry-run leaves file intact, fix writes available correction", async (t) => {
  const f = await fixture(t);
  const before = "let value = 1; export { value };";
  await f.put("src/shared/fixable.mjs", before);
  const dry = await f.cli([
    "src/shared/fixable.mjs",
    "--fix-dry-run",
    "--format",
    "json",
  ]);
  success(dry);
  assert.match(JSON.parse(dry.stdout)[0].output, /^const value/);
  assert.equal(
    await readFile(f.file("src/shared/fixable.mjs"), "utf8"),
    before,
  );
  success(await f.npm(["run", "lint:fix"]));
  assert.match(
    await readFile(f.file("src/shared/fixable.mjs"), "utf8"),
    /^const value/,
  );
});
test("ESLint: map return error has no automatic semantic repair", async (t) => {
  const f = await fixture(t);
  const source = snippet("ESLint", "items.map((item)");
  await f.put("src/shared/total.mjs", source);
  assert.equal((await f.cli(["src/shared/total.mjs", "--fix"])).code, 1);
  assert.equal(await readFile(f.file("src/shared/total.mjs"), "utf8"), source);
});
test("ESLint: invalid rule produces configuration exit code 2", async (t) => {
  const f = await fixture(t);
  await f.put(
    "eslint.config.mjs",
    'export default [{ rules: { "rule-that-does-not-exist": "error" } }];',
  );
  const result = await f.cli(["src/shared/total.mjs"]);
  assert.equal(result.code, 2);
  assert.match(result.stderr, /rule-that-does-not-exist/);
});
test("ESLint: npm print-config and debug commands work as documented", async (t) => {
  const f = await fixture(t);
  const printed = await f.npm([
    "run",
    "lint:config",
    "--",
    "src/browser/title.mjs",
  ]);
  success(printed);
  const config = JSON.parse(printed.stdout.slice(printed.stdout.indexOf("{")));
  assert.equal(config.rules["no-console"][0], 1);
  assert.equal(config.languageOptions.globals.document, false);
  assert.equal(config.languageOptions.ecmaVersion, 2022);
  success(await f.npm(["run", "lint", "--", "--debug"]));
});
test("ESLint v10: config lookup starts from the linted file", async (t) => {
  const f = await fixture(t);
  await f.put(
    "nested/eslint.config.mjs",
    'export default [{ files: ["**/*.mjs"], rules: { eqeqeq: "off" } }];',
  );
  await f.put("nested/sample.mjs", "export const same = (a, b) => a == b;");
  success(await f.cli(["nested/sample.mjs"]));
});
test("ESLint: ecmaVersion rejects later syntax without transpiling", async (t) => {
  const f = await fixture(t);
  const result = await f.text("using resource = acquire();");
  assert.equal(result.fatalErrorCount, 1);
  assert.equal(result.messages[0].ruleId, null);
});
