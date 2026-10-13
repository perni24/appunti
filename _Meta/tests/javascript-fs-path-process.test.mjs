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
  stat,
  lstat,
  symlink,
  readdir,
  access,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { snippet } from "./note-examples.mjs";

const exec = promisify(execFile);
const fsNote = "File System fs";
const pathNote = "Path e Process";
const moduleFrom = (source) =>
  import(
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
  );
const { readOptionalText } = await moduleFrom(
  snippet(fsNote, "export async function readOptionalText"),
);
const { readFirstBlock } = await moduleFrom(
  snippet(fsNote, "export async function readFirstBlock"),
);
const { exportUpdatedConfig } = await moduleFrom(
  snippet(fsNote, "export async function exportUpdatedConfig"),
);
const { copyWithStreams } = await moduleFrom(
  snippet(fsNote, "export async function copyWithStreams"),
);
const settingsSource = snippet(pathNote, "export function parsePort");
const { parsePort, parseBoolean, readSettings } =
  await moduleFrom(settingsSource);
const configSource = snippet(fsNote, '"enabled": true', "json");
const appSource = snippet(pathNote, '"appName": "demo"', "json");
const exists = (file) =>
  access(file).then(
    () => true,
    () => false,
  );

async function fixture(t) {
  const temp = await realpath(tmpdir());
  const root = await mkdtemp(path.join(temp, "appunti-fs-path-"));
  t.after(async () => {
    const actual = await realpath(root);
    assert.equal(actual, root);
    assert.ok(actual.startsWith(path.resolve(temp) + path.sep));
    assert.ok(path.basename(actual).startsWith("appunti-fs-path-"));
    await rm(actual, { recursive: true, force: true });
  });
  const file = (...parts) => path.join(root, ...parts);
  await mkdir(file("config"));
  const files = {
    "config.json": configSource,
    "config/app.json": appSource,
    "config-file.mjs": snippet(
      fsNote,
      "export async function exportUpdatedConfig",
    ),
    "export-demo.mjs": snippet(fsNote, "import { exportUpdatedConfig }"),
    "settings.mjs": settingsSource,
    "main.mjs": snippet(pathNote, "async function main()"),
    "path-demo.mjs": snippet(pathNote, 'path.posix.join("data"'),
    "path-parts.mjs": snippet(pathNote, "const posixPath ="),
    "module-location.mjs": snippet(pathNote, "const moduleDir ="),
    "argv-demo.mjs": snippet(pathNote, "nodeOptions: process.execArgv"),
  };
  for (const [name, source] of Object.entries(files))
    await writeFile(file(name), source);
  // Do not inherit secrets, NODE_OPTIONS or the user's application configuration.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      /^(PATH|SYSTEMROOT|WINDIR|COMSPEC|PATHEXT|TEMP|TMP|HOME|USERPROFILE)$/i.test(
        key,
      ),
    ),
  );
  async function run(args, options = {}) {
    try {
      const result = await exec(process.execPath, args, {
        cwd: options.cwd || root,
        env: { ...env, ...options.env },
        encoding: "utf8",
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
  async function runSnippet(marker) {
    await writeFile(file("snippet.mjs"), snippet(fsNote, marker));
    return run(["snippet.mjs"]);
  }
  return { root, file, run, runSnippet };
}

function success(result, output) {
  assert.equal(result.code, 0, result.stderr);
  assert.equal(result.stderr, "");
  if (output !== undefined) assert.equal(result.stdout, output);
}

test("fs: readFile distinguishes Buffer from decoded text", async (t) => {
  const f = await fixture(t);
  success(await f.runSnippet("const bytes = await readFile"), "true\nstring\n");
});

test("fs: optional missing path is null, empty file is not missing", async (t) => {
  const f = await fixture(t);
  assert.equal(await readOptionalText(f.file("missing")), null);
  await writeFile(f.file("empty"), "");
  assert.equal(await readOptionalText(f.file("empty")), "");
});

test("fs: optional reader accepts file URLs and preserves text", async (t) => {
  const f = await fixture(t);
  const target = f.file("spazi # percent %.txt");
  await writeFile(target, "Caff\u00e8\n");
  assert.equal(await readOptionalText(pathToFileURL(target)), "Caff\u00e8\n");
});

test("fs: optional reader propagates invalid paths instead of returning a default", async (t) => {
  await fixture(t);
  await assert.rejects(readOptionalText("bad\0path"), {
    code: "ERR_INVALID_ARG_VALUE",
  });
});

test("fs: optional reader propagates an already-aborted signal", async (t) => {
  const f = await fixture(t);
  await assert.rejects(
    readOptionalText(f.file("config.json"), { signal: AbortSignal.abort() }),
    { name: "AbortError" },
  );
});

test("fs: exclusive creation refuses overwrite", async (t) => {
  const f = await fixture(t);
  success(await f.runSnippet('await writeFile("demo-output.txt"'));
  const original = await readFile(f.file("demo-output.txt"), "utf8");
  assert.equal(original, "prima riga\n");
  const result = await f.runSnippet('await writeFile("demo-output.txt"');
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /EEXIST/);
  assert.equal(await readFile(f.file("demo-output.txt"), "utf8"), original);
});

test("fs: append creates then adds without truncating", async (t) => {
  const f = await fixture(t);
  success(await f.runSnippet('await appendFile("demo-log.txt"'));
  success(await f.runSnippet('await appendFile("demo-log.txt"'));
  assert.equal(
    await readFile(f.file("demo-log.txt"), "utf8"),
    "nuova riga\nnuova riga\n",
  );
});

test("fs: directory listing is sorted and excludes directories", async (t) => {
  const f = await fixture(t);
  await mkdir(f.file("demo-dist"));
  await writeFile(f.file("demo-dist", "z.txt"), "z");
  await writeFile(f.file("demo-dist", "a.txt"), "a");
  const result = await f.runSnippet('await mkdir("demo-dist/assets"');
  success(result, "[ 'a.txt', 'z.txt' ]\n");
  assert.ok((await stat(f.file("demo-dist", "assets"))).isDirectory());
});

test("fs: metadata size counts bytes rather than string length", async (t) => {
  const f = await fixture(t);
  await writeFile(f.file("demo-output.txt"), "\u00e8");
  success(
    await f.runSnippet('const info = await stat("demo-output.txt")'),
    "true\n2\n",
  );
});

test("fs: removal snippet deletes only its named demo file", async (t) => {
  const f = await fixture(t);
  await writeFile(f.file("demo-output.txt"), "demo");
  success(await f.runSnippet('await rm("demo-output.txt")'));
  assert.equal(await exists(f.file("demo-output.txt")), false);
  assert.equal(await readFile(f.file("config.json"), "utf8"), configSource);
});

test("fs: first block handles short and empty files", async (t) => {
  const f = await fixture(t);
  await writeFile(f.file("short"), "abc");
  await writeFile(f.file("empty"), "");
  assert.deepEqual(await readFirstBlock(f.file("short")), Buffer.from("abc"));
  assert.equal((await readFirstBlock(f.file("empty"))).length, 0);
});

test("fs: first block is bounded to 16 bytes and starts at zero", async (t) => {
  const f = await fixture(t);
  const data = Buffer.from(Array.from({ length: 128 }, (_, i) => i));
  await writeFile(f.file("binary"), data);
  const block = await readFirstBlock(f.file("binary"));
  assert.ok(block.length > 0 && block.length <= 16);
  assert.deepEqual(block, data.subarray(0, block.length));
  assert.deepEqual(await readFirstBlock(f.file("binary")), block);
});

test("fs: first block propagates an open failure", async (t) => {
  const f = await fixture(t);
  await assert.rejects(readFirstBlock(f.file("missing")), { code: "ENOENT" });
});

test("fs: config export selects fields, timestamps output and preserves source", async (t) => {
  const f = await fixture(t);
  const source = JSON.stringify({
    appName: "sample",
    enabled: false,
    secret: "omit-me",
  });
  await writeFile(f.file("config.json"), source);
  const before = Date.now();
  const result = await exportUpdatedConfig(
    f.file("config.json"),
    f.file("updated.json"),
  );
  assert.equal(result.appName, "sample");
  assert.equal(result.enabled, false);
  assert.deepEqual(Object.keys(result), ["appName", "enabled", "updatedAt"]);
  assert.ok(
    Date.parse(result.updatedAt) >= before &&
      Date.parse(result.updatedAt) <= Date.now(),
  );
  assert.deepEqual(
    JSON.parse(await readFile(f.file("updated.json"), "utf8")),
    result,
  );
  assert.equal(await readFile(f.file("config.json"), "utf8"), source);
});

for (const [label, value] of [
  ["null", null],
  ["array", []],
  ["number", 12],
  ["missing appName", { enabled: true }],
  ["empty appName", { appName: " ", enabled: true }],
  ["wrong appName", { appName: 1, enabled: true }],
  ["missing enabled", { appName: "demo" }],
  ["string enabled", { appName: "demo", enabled: "false" }],
]) {
  test(`fs: invalid config ${label} does not create an output`, async (t) => {
    const f = await fixture(t);
    await writeFile(f.file("config.json"), JSON.stringify(value));
    await assert.rejects(
      exportUpdatedConfig(f.file("config.json"), f.file("updated.json")),
      TypeError,
    );
    assert.equal(await exists(f.file("updated.json")), false);
  });
}

test("fs: malformed JSON is not rewritten or exported", async (t) => {
  const f = await fixture(t);
  await writeFile(f.file("config.json"), "{invalid");
  await assert.rejects(
    exportUpdatedConfig(f.file("config.json"), f.file("updated.json")),
    SyntaxError,
  );
  assert.equal(await exists(f.file("updated.json")), false);
  assert.equal(await readFile(f.file("config.json"), "utf8"), "{invalid");
});

test("fs: config export refuses source as destination and existing output", async (t) => {
  const f = await fixture(t);
  await assert.rejects(
    exportUpdatedConfig(f.file("config.json"), f.file("config.json")),
    { code: "EEXIST" },
  );
  await writeFile(f.file("updated.json"), "keep");
  await assert.rejects(
    exportUpdatedConfig(f.file("config.json"), f.file("updated.json")),
    { code: "EEXIST" },
  );
  assert.equal(await readFile(f.file("config.json"), "utf8"), configSource);
  assert.equal(await readFile(f.file("updated.json"), "utf8"), "keep");
});

test("fs: missing parent is an error, not an implicit mkdir", async (t) => {
  const f = await fixture(t);
  await assert.rejects(
    exportUpdatedConfig(f.file("config.json"), f.file("missing", "out.json")),
    { code: "ENOENT" },
  );
});

test("fs: export CLI succeeds once then reports EEXIST without dumping input", async (t) => {
  const f = await fixture(t);
  success(
    await f.run(["export-demo.mjs"]),
    "Creato config.updated.json; sorgente conservato\n",
  );
  const result = await f.run(["export-demo.mjs"]);
  assert.equal(result.code, 1);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "Esportazione fallita: EEXIST\n");
});

test("fs: stream pipeline copies binary content", async (t) => {
  const f = await fixture(t);
  const data = Buffer.alloc(200000, 173);
  await writeFile(f.file("source.bin"), data);
  await copyWithStreams(f.file("source.bin"), f.file("copy.bin"));
  assert.deepEqual(await readFile(f.file("copy.bin")), data);
});

test("fs: stream pipeline refuses existing destination", async (t) => {
  const f = await fixture(t);
  await writeFile(f.file("copy.bin"), "keep");
  await assert.rejects(
    copyWithStreams(f.file("config.json"), f.file("copy.bin")),
    { code: "EEXIST" },
  );
  assert.equal(await readFile(f.file("copy.bin"), "utf8"), "keep");
});

test("fs: stream pipeline propagates missing source and target parent errors", async (t) => {
  const f = await fixture(t);
  await assert.rejects(copyWithStreams(f.file("missing"), f.file("copy.bin")), {
    code: "ENOENT",
  });
  await assert.rejects(
    copyWithStreams(f.file("config.json"), f.file("absent", "copy.bin")),
    { code: "ENOENT" },
  );
});

test("paths: link target differs from lexical containment and lstat sees the link", async (t) => {
  const f = await fixture(t);
  await mkdir(f.file("base"));
  await mkdir(f.file("outside"));
  await writeFile(f.file("outside", "demo.txt"), "linked");
  await symlink(
    f.file("outside"),
    f.file("base", "link"),
    process.platform === "win32" ? "junction" : "dir",
  );
  const linked = f.file("base", "link", "demo.txt");
  assert.ok(linked.startsWith(f.file("base") + path.sep));
  assert.equal(await realpath(linked), f.file("outside", "demo.txt"));
  assert.ok((await lstat(f.file("base", "link"))).isSymbolicLink());
  assert.ok((await stat(f.file("base", "link"))).isDirectory());
  const entries = await readdir(f.file("base"), { withFileTypes: true });
  assert.equal(entries[0].isFile(), false);
  assert.equal(await readOptionalText(linked), "linked");
});

test("paths: explicit POSIX operations produce the documented results on any host", async (t) => {
  const f = await fixture(t);
  success(
    await f.run(["path-demo.mjs"]),
    "data/users.json\n/tmp/report.pdf\n/srv/private/key.txt\n../app2/file.txt\n",
  );
});

test("paths: path parts and Windows drive-relative form", async (t) => {
  const f = await fixture(t);
  success(
    await f.run(["path-parts.mjs"]),
    "report.pdf\n/tmp\n.pdf\n/tmp/report.pdf\nreport.pdf\nfalse\n",
  );
});

test("paths: module location and file URL round-trip do not depend on cwd", async (t) => {
  const f = await fixture(t);
  const result = await f.run([f.file("module-location.mjs")], {
    cwd: f.file("config"),
  });
  success(result);
  assert.deepEqual(JSON.parse(result.stdout), {
    cwd: f.file("config"),
    moduleDir: f.root,
    resourcePath: f.file("config", "app.json"),
    samePath: true,
  });
});

test("process: runtime options and application args remain separate", async (t) => {
  const f = await fixture(t);
  const result = await f.run([
    "--trace-warnings",
    "argv-demo.mjs",
    "--verbose",
    "dati con spazi",
  ]);
  success(result);
  assert.deepEqual(JSON.parse(result.stdout), {
    args: ["--verbose", "dati con spazi"],
    nodeOptions: ["--trace-warnings"],
  });
});

for (const [raw, expected] of [
  [undefined, 3000],
  ["1", 1],
  ["65535", 65535],
  ["003000", 3000],
]) {
  test(`process: valid PORT ${String(raw)}`, () =>
    assert.equal(parsePort(raw), expected));
}
for (const raw of [
  "",
  " ",
  "0",
  "65536",
  "1.5",
  "1e3",
  "-1",
  "3000x",
  "3000\n",
  "Infinity",
  3000,
  null,
]) {
  test(`process: invalid PORT ${JSON.stringify(raw)}`, () =>
    assert.throws(() => parsePort(raw)));
}
for (const [raw, expected] of [
  [undefined, false],
  ["true", true],
  ["false", false],
]) {
  test(`process: valid VERBOSE ${String(raw)}`, () =>
    assert.equal(parseBoolean(raw), expected));
}
for (const raw of ["", "0", "1", "FALSE", " true", true, false, null]) {
  test(`process: invalid VERBOSE ${JSON.stringify(raw)}`, () =>
    assert.throws(() => parseBoolean(raw), TypeError));
}

test("process: settings defaults and CLI precedence", async (t) => {
  const f = await fixture(t);
  assert.deepEqual(readSettings([], {}, f.root), {
    configPath: f.file("config", "app.json"),
    port: 3000,
    verbose: false,
  });
  assert.deepEqual(
    readSettings(
      ["-c", "with spaces", "-v"],
      { CONFIG_DIR: "ignored", PORT: "8000", VERBOSE: "false" },
      f.root,
    ),
    {
      configPath: f.file("with spaces", "app.json"),
      port: 8000,
      verbose: true,
    },
  );
});

test("process: explicit absolute config directory and env defaults", async (t) => {
  const f = await fixture(t);
  const expected = {
    configPath: f.file("config", "app.json"),
    port: 3000,
    verbose: true,
  };
  assert.deepEqual(
    readSettings([], { CONFIG_DIR: f.file("config"), VERBOSE: "true" }, f.root),
    expected,
  );
});

for (const args of [
  ["--unknown"],
  ["positional"],
  ["--config"],
  ["--config="],
  ["--config", "   "],
  ["--verbose=false"],
  ["--no-verbose"],
]) {
  test(`process: invalid CLI ${JSON.stringify(args)}`, () =>
    assert.throws(() => readSettings(args, {})));
}

test("process: blank, nonstring and NUL configuration directories are rejected", () => {
  for (const CONFIG_DIR of ["", " ", 1, "bad\0path"])
    assert.throws(() => readSettings([], { CONFIG_DIR }), TypeError);
});

test("process: main prints only public selected fields", async (t) => {
  const f = await fixture(t);
  await writeFile(
    f.file("config", "app.json"),
    JSON.stringify({ appName: "demo", secret: "do-not-log" }),
  );
  const result = await f.run(["main.mjs"]);
  success(result);
  assert.deepEqual(JSON.parse(result.stdout), {
    appName: "demo",
    port: 3000,
    verbose: false,
  });
  assert.doesNotMatch(result.stdout, /do-not-log|secret/);
});

test("process: CLI with spaced directory, custom env and short flags", async (t) => {
  const f = await fixture(t);
  await mkdir(f.file("config di prova"));
  await writeFile(f.file("config di prova", "app.json"), appSource);
  const result = await f.run(["main.mjs", "-c", "config di prova", "-v"], {
    env: { PORT: "8080", VERBOSE: "false", CONFIG_DIR: "absent" },
  });
  success(result);
  assert.deepEqual(JSON.parse(result.stdout), {
    appName: "demo",
    port: 8080,
    verbose: true,
  });
});

test("process: invalid environment prevents a read and reports failure", async (t) => {
  const f = await fixture(t);
  const result = await f.run(["main.mjs"], {
    env: { PORT: "", CONFIG_DIR: "missing" },
  });
  assert.equal(result.code, 1);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "Avvio fallito: TypeError\n");
});

for (const [label, text, kind] of [
  ["invalid JSON", '{"secret":"do-not-log",', "SyntaxError"],
  ["invalid schema", "[]", "TypeError"],
]) {
  test(`process: ${label} does not leak input in diagnostics`, async (t) => {
    const f = await fixture(t);
    await writeFile(f.file("config", "app.json"), text);
    const result = await f.run(["main.mjs"]);
    assert.equal(result.code, 1);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr, `Avvio fallito: ${kind}\n`);
  });
}

test("process: missing config is reported without pretending to use defaults", async (t) => {
  const f = await fixture(t);
  const result = await f.run(["main.mjs", "--config", "missing"]);
  assert.equal(result.code, 1);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "Avvio fallito: ENOENT\n");
});
