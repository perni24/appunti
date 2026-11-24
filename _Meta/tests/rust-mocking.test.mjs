import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const { children } = parseNote("Programmazione/Rust/Pagine/Mocking.md").tree;
const snippets = (lang) => children.filter((n) => n.type === "code" && n.lang === lang).map((n) => n.value);
const [lib, doubles, cases] = snippets("rust");
const [create, run] = snippets("sh").map((s) => {
  const [program, ...args] = s.split(" ");
  assert.equal(program, "cargo");
  return args;
});
const root = fs.realpathSync(os.tmpdir()), prefix = "vault-mock-";
let dir, src;
function cargo(args, expected) {
  const r = spawnSync("cargo", args, {
    cwd: dir, encoding: "utf8", timeout: 90000, windowsHide: true,
    env: { ...process.env, CARGO_TERM_COLOR: "never", CARGO_NET_OFFLINE: "true", CARGO_TARGET_DIR: path.join(dir, "t") },
  });
  assert.ifError(r.error);
  const out = r.stdout + r.stderr;
  assert.equal(r.signal, null);
  assert.equal(r.status === 0, expected, out);
  return out;
}
before(() => {
  dir = fs.mkdtempSync(path.join(root, prefix));
  cargo(create, true);
  src = path.join(dir, "reminder_notes", "src");
  fs.writeFileSync(path.join(src, "tests.rs"), doubles + "\n\n" + cases + "\n");
});
after(() => {
  if (!dir) return;
  assert.equal(path.dirname(fs.realpathSync(dir)), root);
  assert.ok(path.basename(dir).startsWith(prefix));
  fs.rmSync(dir, { recursive: true, maxRetries: 3 });
});

test("I comandi pubblicati creano una libreria con tutti e tre i casi verdi", () => {
  fs.writeFileSync(path.join(src, "lib.rs"), lib);
  assert.match(cargo(run, true), /3 passed; 0 failed/);
});

const send = 'sender.send(to, "Reminder")?;';
const mutants = [
  ["Scadenza esclusiva: fallisce solo il caso esattamente al limite", "< deadline", "<= deadline",
    ["sends_at_deadline"], /left: Ok\(NotDue\)\s+right: Ok\(Sent\)/],
  ["Invio mancante: l'esito Sent non soddisfa il mock", send, "",
    ["sends_at_deadline", "propagates_sender_error"], /missing send/],
  ["Doppio invio: il mock rifiuta la seconda chiamata", send, send + "\n    " + send,
    ["sends_at_deadline"], /unexpected send/],
  ["Destinatario sbagliato: il risultato del mittente da solo non basta", send,
    'sender.send("other@example.org", "Reminder")?;',
    ["sends_at_deadline", "propagates_sender_error"], /wrong message/],
  ["Errore inghiottito: il destinatario è corretto ma il risultato no", send,
    'let _ = sender.send(to, "Reminder");',
    ["propagates_sender_error"], /left: Ok\(Sent\)\s+right: Err\(SendError\)/],
];
for (const [name, find, replace, failures, diagnostic] of mutants) {
  test(name, () => {
    assert.equal(lib.split(find).length, 2, "La modifica deve individuare una sola riga del servizio");
    fs.writeFileSync(path.join(src, "lib.rs"), lib.replace(find, replace));
    const out = cargo(run, false);
    const failed = [...out.matchAll(/^test tests::(\w+) \.\.\. FAILED\s*$/gm)].map((m) => m[1]).sort();
    assert.deepEqual(failed, failures.toSorted(), out);
    assert.match(out, diagnostic);
  });
}
