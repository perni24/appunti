import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/Tracing con tracing.md",
).tree.children.filter((b) => b.type === "code");
const tmp = fs.realpathSync(os.tmpdir());
const suffix = process.platform === "win32" ? ".exe" : "";
let root, dir, env;

function snippet(lang, marker) {
  const matches = blocks.filter(
    (b) => b.lang === lang && b.value.includes(marker),
  );
  assert.equal(matches.length, 1, marker);
  return matches[0].value;
}
function run(tool, args, { cwd = dir, filter, status = 0 } = {}) {
  const childEnv = { ...env };
  if (filter !== undefined) childEnv.RUST_LOG = filter;
  const r = spawnSync(tool, args, {
    cwd,
    env: childEnv,
    encoding: "utf8",
    windowsHide: true,
    timeout: 180000,
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  assert.equal(
    r.status,
    status,
    tool + " " + args.join(" ") + "\n" + r.stdout + r.stderr,
  );
  return {
    out: r.stdout.replaceAll("\r\n", "\n"),
    err: r.stderr.replaceAll("\r\n", "\n"),
  };
}
before(() => {
  root = fs.mkdtempSync(path.join(tmp, "vault-trace-"));
  dir = path.join(root, "trace-demo");
  env = {
    ...process.env,
    CARGO_HOME: process.env.CARGO_HOME || path.join(root, "c"),
    CARGO_TARGET_DIR: path.join(root, "t"),
    CARGO_TERM_COLOR: "never",
  };
  for (const k of Object.keys(env))
    if (k.toUpperCase() === "RUST_LOG") delete env[k];
  run("cargo", snippet("sh", "cargo new").split(/\s+/).slice(1), { cwd: root });
  fs.appendFileSync(
    path.join(dir, "Cargo.toml"),
    snippet("toml", "tracing-subscriber =") + "\n",
  );
  const src = snippet("rust", "fn init_tracing");
  fs.writeFileSync(path.join(dir, "src/main.rs"), src + "\n");
  // Il solo fattore variato nei due controlli è la strumentazione della future passata a spawn.
  const child = 'lavoro.instrument(info_span!("worker"))';
  assert.equal(src.split(child).length, 2);
  fs.mkdirSync(path.join(dir, "src/bin"));
  for (const [name, replacement] of [
    ["isolato", "lavoro"],
    ["ereditato", "lavoro.in_current_span()"],
  ]) {
    fs.writeFileSync(
      path.join(dir, "src/bin", name + ".rs"),
      src.replace(child, replacement) + "\n",
    );
  }
  // Un singolo poll manuale rende osservabile la sospensione senza ipotesi sullo scheduler.
  fs.writeFileSync(
    path.join(dir, "src/bin/guardia.rs"),
    `
use std::{future::{pending, Future}, io, task::{Context, Waker}};
use tracing::{info, info_span, Instrument};

fn osserva(f: impl Future<Output = ()>) {
    let mut future = Box::pin(f);
    assert!(future.as_mut().poll(&mut Context::from_waker(Waker::noop())).is_pending());
    info!("altra operazione");
    drop(future);
    info!("dopo il rilascio");
}

fn main() {
    tracing_subscriber::fmt().json().with_current_span(false).with_span_list(true)
        .with_writer(io::stderr).init();
    let span = info_span!("operazione_A");
    if std::env::args().nth(1).as_deref() == Some("enter") {
        osserva(async {
            let _guard = span.enter();
            pending::<()>().await;
        });
    } else {
        osserva(pending::<()>().instrument(span));
    }
}
`,
  );
  run("cargo", ["fetch"]);
  env.CARGO_NET_OFFLINE = "true";
  run("cargo", ["build", "--locked", "--bins"]);
});
after(() => {
  if (!root) return;
  const actual = fs.realpathSync(root);
  assert.equal(path.dirname(actual), tmp);
  assert.ok(path.basename(actual).startsWith("vault-trace-"));
  fs.rmSync(actual, { recursive: true, maxRetries: 3 });
});
function invoke(name, options) {
  return run(
    path.join(env.CARGO_TARGET_DIR, "debug", name + suffix),
    [],
    options,
  );
}
function records(name = "trace-demo", filter) {
  const { out, err } = invoke(name, { filter });
  assert.equal(out, "5\n");
  return err.trim()
    ? err
        .trimEnd()
        .split("\n")
        .map((line) => JSON.parse(line))
    : [];
}
function select(rows, message) {
  return rows.filter((e) => e.fields.message === message);
}
function checkDocs(events, spans) {
  assert.deepEqual(
    events.map((e) => e.spans[0].doc_id).sort((a, b) => a - b),
    [17, 42],
  );
  for (const e of events)
    assert.deepEqual(
      e.spans.map((s) => s.name),
      spans,
    );
}

test("il JSON pubblicato corrisponde al worker 17 e ciascun risultato ha il padre giusto", () => {
  const rows = records();
  assert.equal(rows.length, 4);
  const workers = select(rows, "conteggio completato");
  checkDocs(workers, ["documento", "worker"]);
  assert.deepEqual(
    workers.find((e) => e.spans[0].doc_id === 17),
    JSON.parse(snippet("json", "conteggio completato")),
  );
  assert.equal(workers.find((e) => e.spans[0].doc_id === 42).fields.parole, 2);
  checkDocs(select(rows, "documento pronto"), ["documento"]);
});
test("il filtro per target aggiunge due eventi DEBUG ma non registra gli argomenti saltati", () => {
  const rows = records("trace-demo", "warn,trace_demo=debug");
  assert.equal(rows.length, 6);
  const debug = select(rows, "preparazione");
  checkDocs(debug, ["documento"]);
  for (const e of debug) assert.equal(e.level, "DEBUG");
  assert.doesNotMatch(
    JSON.stringify(rows),
    /prima bozza locale|seconda bozza|"testo"/,
  );
});
test("con RUST_LOG=off lo stdout resta identico e stderr è vuoto", () => {
  assert.deepEqual(invoke("trace-demo", { filter: "off" }), {
    out: "5\n",
    err: "",
  });
});
test("la guardia attraversa Pending e attribuisce ad A il lavoro estraneo; Instrument no", () => {
  const exe = path.join(env.CARGO_TARGET_DIR, "debug", "guardia" + suffix);
  for (const [mode, expected] of [
    ["enter", ["operazione_A"]],
    ["instrument", []],
  ]) {
    const { out, err } = run(exe, [mode]);
    assert.equal(out, "");
    const rows = err
      .trimEnd()
      .split("\n")
      .map((s) => JSON.parse(s));
    assert.deepEqual(
      rows.map((e) => e.fields.message),
      ["altra operazione", "dopo il rilascio"],
    );
    assert.deepEqual(
      (rows[0].spans ?? []).map((s) => s.name),
      expected,
    );
    assert.deepEqual(rows[1].spans ?? [], []);
  }
});
test("una direttiva invalida non viene trattata come filtro assente", () => {
  const r = invoke("trace-demo", {
    filter: "trace_demo=inesistente",
    status: 1,
  });
  assert.equal(r.out, "");
  assert.equal(r.err, "RUST_LOG: direttiva non valida\n");
});
test("senza instrument i due worker perdono il contesto ma i chiamanti lo conservano", () => {
  const rows = records("isolato", "info");
  assert.equal(rows.length, 4);
  const workers = select(rows, "conteggio completato");
  assert.deepEqual(
    workers.map((e) => e.fields.parole).sort((a, b) => a - b),
    [2, 3],
  );
  for (const e of workers) assert.deepEqual(e.spans ?? [], []);
  checkDocs(select(rows, "documento pronto"), ["documento"]);
});
test("in_current_span conserva il padre senza creare uno span worker", () => {
  const rows = records("ereditato", "info");
  assert.equal(rows.length, 4);
  const workers = select(rows, "conteggio completato");
  checkDocs(workers, ["documento"]);
  for (const e of workers)
    assert.equal(e.fields.parole, e.spans[0].doc_id === 17 ? 3 : 2);
  checkDocs(select(rows, "documento pronto"), ["documento"]);
});
