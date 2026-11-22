import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/Performance e profiling.md",
).tree.children.filter((b) => b.type === "code");
const temp = fs.realpathSync(os.tmpdir());
let root, dir;

function snippet(lang, marker) {
  const hits = blocks.filter(
    (b) => b.lang === lang && b.value.includes(marker),
  );
  assert.equal(hits.length, 1, marker);
  return hits[0].value;
}

function run(cmd, cwd = dir, failure = false) {
  const [tool, ...args] = cmd.split(/\s+/);
  const r = spawnSync(tool, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    timeout: 120000,
    env: {
      ...process.env,
      // I percorsi intermedi di MSVC possono superare il limite in una temp Windows lunga.
      CARGO_TARGET_DIR: path.join(root, "t"),
      CARGO_NET_OFFLINE: "true",
    },
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  assert.equal(r.status === 0, !failure, cmd + "\n" + r.stdout + r.stderr);
  return failure ? r.stdout + r.stderr : r.stdout.trim();
}

before(() => {
  root = fs.mkdtempSync(path.join(temp, "vault-rust-perf-"));
  dir = path.join(root, "profilo-demo");
  run(snippet("sh", "cargo new"), root);
  fs.writeFileSync(
    path.join(dir, "src/lib.rs"),
    snippet("rust", "pub fn grow") + "\n",
  );
  fs.writeFileSync(
    path.join(dir, "src/main.rs"),
    snippet("rust", "fn main()") + "\n",
  );
  fs.appendFileSync(
    path.join(dir, "Cargo.toml"),
    "\n" + snippet("toml", "[profile.profiling]") + "\n",
  );
});

after(() => {
  if (!root) return;
  assert.equal(path.dirname(fs.realpathSync(root)), temp);
  assert.ok(path.basename(root).startsWith("vault-rust-perf-"));
  fs.rmSync(root, { recursive: true, maxRetries: 3 });
});

test("i test pubblicati preservano byte UTF-8, input vuoto e separatore finale", () => {
  assert.match(
    run(snippet("sh", "cargo test --release")),
    /stessa_uscita_in_byte \.\.\. ok/,
  );
});

test("le due CLI ottimizzate producono cinque medie di lotto, senza soglia di velocità", () => {
  run(snippet("sh", "cargo build --profile"));
  for (const mode of ["grow", "reserve"]) {
    const rows = run(snippet("sh", "-- " + mode + " 500")).split(/\r?\n/);
    assert.equal(rows.length, 5);
    for (const [i, row] of rows.entries()) {
      assert.match(
        row,
        new RegExp("^" + mode + " lotto=" + (i + 1) + " ns_per_join=\\d+$"),
      );
    }
  }
});

test("un lotto da zero iterazioni viene rifiutato prima della misura", () => {
  assert.match(
    run("cargo run --profile profiling -- grow 0", dir, true),
    /numero di iterazioni deve essere positivo/,
  );
});

test("sul dataset del laboratorio la capienza prenotata non cresce durante le append", () => {
  // Prova separata: osservare il buffer non altera il tratto cronometrato della CLI pubblicata.
  fs.appendFileSync(
    path.join(dir, "src/lib.rs"),
    `
#[test]
fn osserva_capacita() {
    let words = ["uno", "caffè", "", "blu"].repeat(512);
    let bytes = words.iter().map(|s| s.len() + 1).sum::<usize>();
    assert_eq!((words.len(), bytes), (2048, 8192));
    let expected = grow(&words);
    assert_eq!(expected, reserve(&words));
    assert_eq!(expected.len(), bytes);
    for (mut out, reserved) in [(String::new(), false), (String::with_capacity(bytes), true)] {
        let mut changes = 0;
        for word in &words {
            let before = out.capacity();
            append_words(&mut out, std::slice::from_ref(word));
            if out.capacity() != before { changes += 1; }
        }
        assert_eq!(out, expected);
        assert_eq!(changes == 0, reserved);
    }
}
`,
  );
  assert.match(
    run("cargo test --release --lib osserva_capacita"),
    /osserva_capacita \.\.\. ok/,
  );
});
