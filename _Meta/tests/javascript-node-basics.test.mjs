import assert from "node:assert/strict";
import { test } from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  realpath,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, basename, sep, dirname } from "node:path";
import { snippet } from "./note-examples.mjs";

const exec = promisify(execFile);
const note = "Node.js Basics";
const config = snippet(note, "export function readPreviewLength");
const { readPreviewLength } = await import(
  `data:text/javascript;base64,${Buffer.from(config).toString("base64")}`
);
const manifest = snippet(note, '"name": "node-basics-demo"', "json");
const readme = snippet(note, "# Demo Node", "markdown");
const cli =
  process.env.NPM_CLI_PATH ||
  join(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js");

async function fixture(t) {
  const temp = await realpath(tmpdir());
  const root = await mkdtemp(join(temp, "appunti-node-basics-"));
  t.after(async () => {
    const actual = await realpath(root);
    assert.equal(actual, root);
    assert.ok(actual.startsWith(resolve(temp) + sep));
    assert.ok(basename(actual).startsWith("appunti-node-basics-"));
    await rm(actual, { recursive: true, force: true });
  });
  await mkdir(join(root, "src"));
  await mkdir(join(root, "test"));
  const files = {
    "package.json": manifest,
    "README.md": readme,
    ".env": snippet(note, "PREVIEW_LENGTH=8", "dotenv"),
    ".gitignore": snippet(note, "node_modules/", "gitignore"),
    "src/config.js": config,
    "src/main.js": snippet(note, "async function main()"),
    "test/config.test.js": snippet(note, 'test("lunghezza:'),
    "runtime.mjs": snippet(note, "console.log(process.version)"),
    "event-loop.mjs": snippet(note, 'console.log("start")'),
    "module-demo.mjs": snippet(
      note,
      'import path from "node:path";\n\nconsole.log',
    ),
    "module-demo.cjs": snippet(note, 'const path = require("node:path")'),
    "user.npmrc": "",
    "global.npmrc": "",
  };
  for (const [file, source] of Object.entries(files)) {
    await writeFile(join(root, file), source);
  }
  // Only inherit OS essentials, not secrets or runtime/npm configuration.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      /^(PATH|SYSTEMROOT|WINDIR|COMSPEC|PATHEXT|TEMP|TMP|HOME|USERPROFILE)$/i.test(
        key,
      ),
    ),
  );
  Object.assign(env, {
    npm_config_userconfig: join(root, "user.npmrc"),
    npm_config_globalconfig: join(root, "global.npmrc"),
    npm_config_cache: join(root, "cache"),
    npm_config_offline: "true",
    npm_config_update_notifier: "false",
    npm_config_audit: "false",
    npm_config_fund: "false",
    npm_config_registry: "http://127.0.0.1:9/",
  });
  async function run(args, options = {}) {
    try {
      const result = await exec(process.execPath, args, {
        cwd: options.cwd || root,
        env: { ...env, ...options.env },
        timeout: 15000,
        maxBuffer: 1024 * 1024,
        windowsHide: true,
      });
      return { code: 0, ...result };
    } catch (error) {
      if (typeof error.code !== "number" || error.killed) throw error;
      return { code: error.code, stdout: error.stdout, stderr: error.stderr };
    }
  }
  return { root, run };
}

function success(result, output) {
  assert.equal(result.code, 0, result.stderr);
  assert.equal(result.stderr, "");
  if (output !== undefined) assert.equal(result.stdout, output);
}

for (const [value, expected] of [
  [undefined, 200],
  ["1", 1],
  ["8", 8],
  ["999", 999],
  ["1000", 1000],
]) {
  test(`config: accepts ${String(value)}`, () => {
    assert.equal(readPreviewLength(value), expected);
  });
}

for (const value of [
  "",
  "0",
  "1001",
  "-1",
  "1.5",
  "1e2",
  "01",
  " 8",
  "8 ",
  "8\n",
  "8\r\n",
  "false",
  "Infinity",
  8,
  null,
  false,
]) {
  test(`config: rejects ${JSON.stringify(value)}`, () => {
    assert.throws(() => readPreviewLength(value), TypeError);
  });
}

test("CLI: default does not load an existing .env", async (t) => {
  const { root, run } = await fixture(t);
  success(await run(["src/main.js"]), readme + "\n");
  assert.equal(await readFile(join(root, "README.md"), "utf8"), readme);
});

test("CLI: explicit env-file loads the documented preview length", async (t) => {
  const { run } = await fixture(t);
  const args = snippet(note, "node --env-file=.env", "sh")
    .split(/\s+/)
    .slice(1);
  success(await run(args), "# Demo N\n");
});

test("CLI: process environment takes precedence over env-file", async (t) => {
  const { run } = await fixture(t);
  success(
    await run(["--env-file=.env", "src/main.js"], {
      env: { PREVIEW_LENGTH: "1" },
    }),
    "#\n",
  );
});

test("CLI: invalid environment exits 1 on stderr without reading a missing file", async (t) => {
  const { run } = await fixture(t);
  const result = await run(["src/main.js", "missing.md"], {
    env: { PREVIEW_LENGTH: "" },
  });
  assert.equal(result.code, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /PREVIEW_LENGTH deve essere/);
  assert.doesNotMatch(
    result.stderr,
    /File non trovato|UnhandledPromiseRejection/,
  );
});

test("CLI: missing file has a controlled error and nonzero exit", async (t) => {
  const { run } = await fixture(t);
  const result = await run(["src/main.js", "missing.md"]);
  assert.equal(result.code, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /^File non trovato:/);
  assert.doesNotMatch(result.stderr, /at main|UnhandledPromiseRejection/);
});

test("CLI: too many arguments are rejected", async (t) => {
  const { run } = await fixture(t);
  const result = await run(["src/main.js", "README.md", "extra"]);
  assert.equal(result.code, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /^Uso:/);
});

test("CLI: paths with spaces and empty files", async (t) => {
  const { root, run } = await fixture(t);
  await writeFile(join(root, "my file.txt"), "");
  success(await run(["src/main.js", "my file.txt"]), "\n");
});

test("CLI: working directory affects data paths, not module imports", async (t) => {
  const { root, run } = await fixture(t);
  const other = join(root, "other");
  await mkdir(other);
  await writeFile(join(other, "README.md"), "Other directory");
  success(
    await run([join(root, "src/main.js")], { cwd: other }),
    "Other directory\n",
  );
});

test("CLI: an absolute data path is independent of working directory", async (t) => {
  const { root, run } = await fixture(t);
  success(
    await run([join(root, "src/main.js"), join(root, "README.md")], {
      cwd: join(root, "src"),
    }),
    readme + "\n",
  );
});

test("CLI: a missing env-file stops execution", async (t) => {
  const { run } = await fixture(t);
  const result = await run(["--env-file=missing.env", "src/main.js"]);
  assert.notEqual(result.code, 0);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /missing.env/);
});

test("runtime: no DOM, but native fetch is present", async (t) => {
  const { run } = await fixture(t);
  success(
    await run(["runtime.mjs"]),
    `${process.version}\n${process.platform}\nundefined\nfunction\n`,
  );
});

test("event loop: zero-delay timer follows synchronous output", async (t) => {
  const { run } = await fixture(t);
  success(await run(["event-loop.mjs"]), "start\nend\ntimer\n");
});

test("modules: mjs and cjs both work inside a type-module package", async (t) => {
  const { run } = await fixture(t);
  success(await run(["module-demo.mjs"]), "README.md\n");
  success(await run(["module-demo.cjs"]), "README.md\n");
});

test("modules: explicit type-commonjs accepts the CommonJS snippet as .js", async (t) => {
  const { root, run } = await fixture(t);
  const dir = join(root, "commonjs");
  await mkdir(dir);
  await writeFile(
    join(dir, "package.json"),
    JSON.stringify({ type: "commonjs" }),
  );
  await writeFile(
    join(dir, "main.js"),
    snippet(note, 'const path = require("node:path")'),
  );
  success(await run(["commonjs/main.js"]), "README.md\n");
});

test("modules: require is not implicitly available in ESM", async (t) => {
  const { root, run } = await fixture(t);
  await writeFile(
    join(root, "wrong.js"),
    snippet(note, 'const path = require("node:path")'),
  );
  const result = await run(["wrong.js"]);
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /require is not defined/);
});

test("npm: start and argument forwarding use the note's package.json", async (t) => {
  const { root, run } = await fixture(t);
  const version = await run([cli, "--version"]);
  success(version, "11.19.0\n");
  const start = await run([cli, "--silent", "start"]);
  success(start, readme + "\n");
  await writeFile(join(root, "my file.txt"), "Selected file");
  success(
    await run([cli, "--silent", "run", "start", "--", "my file.txt"]),
    "Selected file\n",
  );
});

test("npm: the documented test script runs an actual passing test", async (t) => {
  const { run } = await fixture(t);
  const result = await run([cli, "--silent", "test"]);
  success(result);
  assert.match(result.stdout, /tests 1/);
  assert.match(result.stdout, /pass 1/);
  assert.match(result.stdout, /fail 0/);
});
