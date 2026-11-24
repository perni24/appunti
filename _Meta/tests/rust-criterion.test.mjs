import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote("Programmazione/Rust/Pagine/Benchmarking con Criterion.md").tree.children;
const snippets = (lang) => blocks.filter((b) => b.type === "code" && b.lang === lang).map((b) => b.value);
const [lib, bench] = snippets("rust"), [manifest] = snippets("toml");
const [create, unit, smoke, full, save, compare] = snippets("sh").map((s) => {
  const [program, ...args] = s.split(" ");
  assert.equal(program, "cargo");
  return args.map((arg) => arg.replace(/^'|'$/g, ""));
});
const root = fs.realpathSync(os.tmpdir()), prefix = "vault-cr-";
const short = ["--noplot", "--sample-size", "10", "--warm-up-time", "0.1", "--measurement-time", "0.2", "--nresamples", "1000"];
let dir, cwd, results;
function cargo(args, pass = true) {
  const env = { ...process.env, CARGO_TERM_COLOR: "never", CARGO_TARGET_DIR: path.join(dir, "t"), CRITERION_HOME: results };
  const r = spawnSync("cargo", args, { cwd, env, encoding: "utf8", timeout: 360000, windowsHide: true });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  const out = r.stdout + r.stderr;
  assert.equal(r.status === 0, pass, out);
  return out;
}
before(() => {
  dir = fs.mkdtempSync(path.join(root, prefix));
  cwd = dir;
  results = path.join(dir, "t", "criterion");
  cargo(create);
  cwd = path.join(dir, "sum_notes");
  fs.appendFileSync(path.join(cwd, "Cargo.toml"), "\n" + manifest + "\n");
  fs.writeFileSync(path.join(cwd, "src/lib.rs"), lib + "\n");
  fs.mkdirSync(path.join(cwd, "benches"));
  fs.writeFileSync(path.join(cwd, "benches/sum.rs"), bench + "\n");
});
after(() => {
  if (!dir) return;
  assert.equal(path.dirname(fs.realpathSync(dir)), root);
  assert.ok(path.basename(dir).startsWith(prefix));
  fs.rmSync(dir, { recursive: true, maxRetries: 3 });
});
const ids = ["manual", "iterator"].flatMap((strategy) => [64, 4096].map((n) => `sum/${strategy}/${n}`));
function read(id, name, file) {
  return fs.readFileSync(path.join(results, id, name, file), "utf8");
}

test("Entrambe le somme superano gli stessi casi, inclusa la somma oltre u32", () => {
  assert.match(cargo(unit), /1 passed; 0 failed/);
  const source = path.join(cwd, "src/lib.rs");
  fs.writeFileSync(source, lib.replace("total += u64::from(value);", "total = u64::from((total as u32).wrapping_add(value));"));
  try { assert.match(cargo(unit, false), /left: 4294967294\s+right: 8589934590/); }
  finally { fs.writeFileSync(source, lib); }
});
test("La prova del target attraversa tutti gli ID senza campionare", () => {
  const out = cargo(smoke);
  for (const id of ids) {
    assert.ok(out.includes(id), out);
    assert.ok(!fs.existsSync(path.join(results, id, "new/sample.json")));
  }
});
test("Il profilo bench genera campioni reali e throughput per ciascuna dimensione", () => {
  const out = cargo([...full, "--", ...short]);
  for (const id of ids) {
    assert.ok(out.includes(id), out);
    assert.ok(JSON.parse(read(id, "new", "sample.json")).times.length >= 10);
    const metadata = JSON.parse(read(id, "new", "benchmark.json"));
    assert.deepEqual(metadata.throughput, { Elements: Number(id.split("/").at(-1)) });
    assert.ok(JSON.parse(read(id, "new", "estimates.json")).mean.point_estimate > 0);
  }
});
test("La baseline filtrata resta immutata e non vale per un ID diverso", () => {
  const id = "sum/manual/4096";
  cargo([...save, ...short]);
  const baseline = read(id, "prima", "sample.json");
  const source = path.join(cwd, "src/lib.rs");
  fs.writeFileSync(source, lib.replace("total += u64::from(value);", "total = total.wrapping_add(u64::from(value));"));
  try {
    assert.match(cargo(unit), /1 passed; 0 failed/);
    assert.match(cargo([...compare, ...short]), /change:/i);
    assert.equal(read(id, "prima", "sample.json"), baseline);
    const wrongId = compare.map((a) => a === id ? "sum/manual/64" : a);
    assert.match(cargo([...wrongId, ...short], false), /Baseline 'prima' must exist/i);
  } finally { fs.writeFileSync(source, lib); }
});
