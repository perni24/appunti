import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/WASI.md",
).tree.children.filter((node) => node.type === "code");
const shell = blocks
  .filter((node) => node.lang === "sh")
  .map((node) => node.value);
const targets = ["wasm32-wasip1", "wasm32-wasip2"];
const cli = process.env.WASMTIME_CLI || "wasmtime";
const wasm = (target) => `target/${target}/release/conta-righe.wasm`;

test("WASI: la CLI del Markdown su Wasmtime P1 e P2", async (t) => {
  const temp = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(temp, "vault-wasi-"));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(dir)), temp);
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const run = (exe, args, cwd) =>
    execFileSync(exe, args, { cwd, encoding: "utf8", windowsHide: true });
  const project = path.join(dir, "conta-righe");
  run("cargo", ["new", "--vcs", "none", "--bin", "conta-righe"], dir);
  const rust = blocks.filter((b) => b.lang === "rust");
  assert.equal(rust.length, 1);
  fs.writeFileSync(path.join(project, "src", "main.rs"), rust[0].value);
  const builds = shell.filter((cmd) => cmd.startsWith("cargo build "));
  assert.equal(builds.length, 2);
  for (const cmd of builds) run("cargo", cmd.split(" ").slice(1), project);
  console.log(
    run(cli, ["--version"], project).trim(),
    run("rustc", ["--version"], project).trim(),
  );
  const samples = path.join(project, "campioni");
  fs.mkdirSync(samples);
  fs.writeFileSync(path.join(samples, "input.txt"), "alfa\nbeta");
  fs.writeFileSync(path.join(samples, "non-utf8.bin"), Buffer.from([0xff]));
  function invoke(args, input = "") {
    const res = spawnSync(cli, args, {
      cwd: project,
      input,
      encoding: "utf8",
      timeout: 20000,
      windowsHide: true,
      env: { ...process.env, REPORT_LABEL: "solo-host" },
    });
    if (res.error) throw res.error;
    assert.equal(res.signal, null, res.stderr);
    return { code: res.status, out: res.stdout.trim(), err: res.stderr.trim() };
  }
  const ok = (r, output) => {
    assert.equal(r.code, 0, r.err);
    assert.equal(r.out, output);
  };
  const fails = (r, msg) => {
    assert.notEqual(r.code, 0);
    assert.equal(r.out, "");
    assert.match(r.err, msg);
  };
  const mount = ["--dir", "campioni::/letture"];
  await t.test("formato: modulo core con import P1 e componente P2", () => {
    const p1 = fs.readFileSync(path.join(project, wasm(targets[0])));
    const p2 = fs.readFileSync(path.join(project, wasm(targets[1])));
    assert.ok(
      WebAssembly.Module.imports(new WebAssembly.Module(p1)).some(
        (i) => i.module === "wasi_snapshot_preview1",
      ),
    );
    assert.deepEqual([...p2.subarray(0, 8)], [0, 97, 115, 109, 13, 0, 1, 0]);
  });
  await t.test(
    "i tre comandi wasmtime della nota danno i risultati previsti",
    () => {
      const args = shell
        .filter((cmd) => cmd.startsWith("wasmtime run "))
        .map((cmd) => cmd.split(" ").slice(1));
      assert.equal(args.length, 3);
      fails(invoke(args[0]), /lettura non riuscita/);
      ok(invoke(args[1]), "righe=2 byte=9");
      ok(invoke(args[2]), "lines=2 byte=9");
    },
  );
  await t.test(
    "stdin senza directory: vuoto, CRLF e ultima riga UTF-8 senza newline",
    () => {
      for (const target of targets) {
        const args = ["run", wasm(target), "-"];
        ok(invoke(args), "righe=0 byte=0");
        ok(invoke(args, "caffè\r\nz"), "righe=2 byte=9");
      }
    },
  );
  await t.test(
    "il file host esiste: serve una preopen con il nome guest corretto",
    () => {
      for (const target of targets) {
        const guest = [wasm(target), "/letture/input.txt"];
        fails(invoke(["run", ...guest]), /lettura non riuscita/);
        fails(
          invoke(["run", "--dir", "campioni::/altra", ...guest]),
          /lettura non riuscita/,
        );
        ok(invoke(["run", ...mount, ...guest]), "righe=2 byte=9");
      }
    },
  );
  await t.test(
    "l'ambiente va passato separatamente e le opzioni dopo il Wasm sono argomenti guest",
    () => {
      for (const target of targets) {
        ok(
          invoke(
            ["run", "--env", "REPORT_LABEL=esplicita", wasm(target), "-"],
            "x",
          ),
          "esplicita=1 byte=1",
        );
        fails(
          invoke(["run", wasm(target), "-", "--env", "REPORT_LABEL=esplicita"]),
          /uso: conta-righe/,
        );
      }
    },
  );
  await t.test(
    "uso errato, file assente e file non UTF-8 producono solo una diagnosi su stderr",
    () => {
      for (const target of targets) {
        fails(invoke(["run", wasm(target)]), /uso: conta-righe/);
        for (const name of ["assente.txt", "non-utf8.bin"])
          fails(
            invoke(["run", ...mount, wasm(target), "/letture/" + name]),
            /lettura non riuscita/,
          );
      }
    },
  );
});
