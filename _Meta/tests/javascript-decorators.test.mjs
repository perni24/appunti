import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve, sep } from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { parseNote } from "../../site/scripts/vault.mjs";
import { snippet } from "./note-examples.mjs";
import {
  cases,
  compileExample,
  config,
  esbuild,
  markers,
} from "./decorators-examples.mjs";

console.log(
  `Decorator compiler: esbuild ${esbuild.version}; runtime ${process.version}`,
);

for (const item of cases) {
  test(`Decorators: ${item.name}`, async () => {
    const code = await compileExample(item.marker, item.tail);
    const result = await vm.runInNewContext(code, {}, { timeout: 1000 });
    assert.deepEqual(structuredClone(result), item.expected);
  });
}

test("Decorators: tutti i blocchi JS sono trasformati e hanno sintassi valida", async () => {
  const { tree } = parseNote("Programmazione/JavaScript/Pagine/Decorators.md");
  const blocks = tree.children.filter(
    (node) => node.type === "code" && node.lang === "js",
  );
  assert.equal(blocks.length, markers.length);
  for (const marker of markers) {
    const code = await compileExample(marker);
    assert.doesNotThrow(() => new vm.Script(code));
  }
  assert.equal(config.compilerOptions.experimentalDecorators, false);
  assert.equal(config.compilerOptions.useDefineForClassFields, true);
});

test("Decorators: comando CLI della nota produce un modulo ESM eseguibile", async () => {
  const require = createRequire(
    new URL("../../site/package.json", import.meta.url),
  );
  const root = await realpath(tmpdir());
  const directory = await mkdtemp(join(root, "appunti-decorators-"));
  try {
    await writeFile(
      join(directory, "demo.js"),
      snippet("Decorators", "function logged"),
    );
    await writeFile(join(directory, "tsconfig.json"), JSON.stringify(config));
    const command = snippet("Decorators", "npx --no-install esbuild", "sh");
    const args = command.trim().split(/\s+/).slice(3);
    const build = spawnSync(
      process.execPath,
      [require.resolve("esbuild/bin/esbuild"), ...args],
      {
        cwd: directory,
        encoding: "utf8",
        timeout: 15_000,
      },
    );
    assert.equal(build.status, 0, build.stderr || build.error?.message);
    const run = spawnSync(process.execPath, ["dist/demo.mjs"], {
      cwd: directory,
      encoding: "utf8",
      timeout: 10_000,
    });
    assert.equal(run.status, 0, run.stderr || run.error?.message);
    assert.equal(
      run.stdout.replace(/\r\n/g, "\n").trim(),
      "Calling run\nreport:7",
    );
  } finally {
    const target = await realpath(directory);
    assert.ok(target.startsWith(resolve(root) + sep));
    assert.ok(basename(target).startsWith("appunti-decorators-"));
    await rm(target, { recursive: true, force: true });
  }
});
