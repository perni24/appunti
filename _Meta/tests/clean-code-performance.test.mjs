import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

function snippets(note, lang = "js") {
  return parseNote(`Programmazione/Clean Code/Pagine/${note}.md`).tree.children
    .filter(n => n.type === "code" && n.lang === lang).map(n => n.value);
}
function example(note, names) {
  const blocks = snippets(note);
  assert.equal(blocks.length, 1, note);
  return Function('"use strict";\n' + blocks[0] + "\nreturn ({" + names + "});")();
}

test("Filtro: scansione e indice preservano ordine, riferimenti e ripetizioni", () => {
  const { allowedUsersScan, allowedUsersIndexed } = example("Performance e leggibilita", "allowedUsersScan, allowedUsersIndexed");
  const a = { groupId: "007" }, b = { groupId: "7" }, c = { groupId: "other" };
  const users = Object.freeze([a, b, c, a]);
  for (const filter of [allowedUsersScan, allowedUsersIndexed]) {
    assert.deepEqual(filter(users, []), []);
    assert.deepEqual(filter([], ["007"]), []);
    const selected = filter(users, ["7", "007", "007"]);
    assert.equal(selected.length, 3);
    assert.equal(selected[0], a);
    assert.equal(selected[1], b);
    assert.equal(selected[2], a);
    selected.pop();
    assert.equal(users.length, 4);
  }
});

test("Mappa di lotto: un accesso per codice distinto, anche null; errori e lotti indipendenti", async () => {
  const { describeBatch } = example("Ottimizzazione prematura", "describeBatch");
  const calls = [];
  let description = "prima";
  const read = async code => { calls.push(code); return code === "B" ? null : description; };
  assert.deepEqual(await describeBatch([], read), []);
  assert.deepEqual(await describeBatch(["A", "B", "A", "B"], read), ["prima", null, "prima", null]);
  assert.deepEqual(calls, ["A", "B"]);
  description = "dopo";
  assert.deepEqual(await describeBatch(["A"], read), ["dopo"]);
  assert.deepEqual(calls, ["A", "B", "A"]);
  const error = new Error("archivio");
  const attempted = [];
  await assert.rejects(describeBatch(["A", "B", "C"], async code => {
    attempted.push(code); if (code === "B") throw error; return code;
  }), e => e === error);
  assert.deepEqual(attempted, ["A", "B"]);
});

test("Profiling: conteggio delle esecuzioni SQLite e conservazione dei progetti senza attività", t => {
  const { countsByProject, countsByJoin } = example("Profiling prima del refactoring", "countsByProject, countsByJoin");
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  db.exec("CREATE TABLE projects(id INTEGER PRIMARY KEY); CREATE TABLE tasks(id INTEGER PRIMARY KEY, project_id INTEGER NOT NULL)");
  let executions = 0;
  const observed = { prepare(sql) {
    const stmt = db.prepare(sql);
    return {
      all(...args) { executions++; return stmt.all(...args); },
      get(...args) { executions++; return stmt.get(...args); },
    };
  } };
  function check(fn, expected, count) {
    executions = 0;
    assert.deepEqual(fn(observed).map(r => ({ id: r.id, n: r.n })), expected);
    assert.equal(executions, count);
  }
  check(countsByProject, [], 1);
  check(countsByJoin, [], 1);
  db.exec("INSERT INTO projects VALUES (3),(1),(2); INSERT INTO tasks VALUES (11,1),(12,3),(13,1)");
  const expected = [{ id: 1, n: 2 }, { id: 2, n: 0 }, { id: 3, n: 1 }];
  check(countsByProject, expected, 4);
  check(countsByJoin, expected, 1);
});

test("Hot path: il comando pubblicato elabora il lotto e produce un profilo V8 leggibile", t => {
  const note = "Hot path";
  const blocks = snippets(note);
  assert.equal(blocks.length, 2);
  assert.deepEqual(snippets(note, "sh"), ["node --cpu-prof --cpu-prof-name=region.cpuprofile region.mjs"]);
  const [, ...args] = snippets(note, "sh")[0].split(" ");
  const dir = mkdtempSync(join(tmpdir(), "clean-code-cpu-"));
  const script = join(dir, "region.mjs"), profile = join(dir, "region.cpuprofile");
  t.after(() => {
    for (const file of [script, profile]) if (existsSync(file)) unlinkSync(file);
    rmdirSync(dir);
  });
  writeFileSync(script, blocks.join("\n\n"), { flag: "wx" });
  const run = spawnSync(process.execPath, args, { cwd: dir, encoding: "utf8", timeout: 30000 });
  assert.equal(run.status, 0, run.error?.message ?? run.stderr);
  assert.equal(run.stdout.trim(), "400000");
  const parsed = JSON.parse(readFileSync(profile, "utf8"));
  assert.ok(parsed.nodes.some(n => typeof n.callFrame?.functionName === "string"));
  assert.ok(parsed.endTime >= parsed.startTime);
});

test("Allocazioni: stesso output per record ordinari, letture diverse per getter e array sparsi", () => {
  const { activeNamesPipeline, activeNamesSinglePass } = example("Allocazioni inutili", "activeNamesPipeline, activeNamesSinglePass");
  const rows = [{ active: false, name: "X" }, { active: true, name: "A" }, { active: true, name: "A" }];
  for (const names of [activeNamesPipeline, activeNamesSinglePass]) {
    assert.deepEqual(names([]), []);
    const previous = names(rows);
    names(rows).pop();
    assert.deepEqual(previous, ["A", "A"]);
  }
  function withGetters() {
    let name = "prima";
    return [{ active: true, get name() { return name; } }, { get active() { name = "dopo"; return false; } }];
  }
  assert.deepEqual(activeNamesPipeline(withGetters()), ["dopo"]);
  assert.deepEqual(activeNamesSinglePass(withGetters()), ["prima"]);
  assert.deepEqual(activeNamesPipeline(Array(1)), []);
  assert.throws(() => activeNamesSinglePass(Array(1)), TypeError);
});

test("Deploy: readiness indipendente dalla liveness; il drain non viene annullato da esiti tardivi", () => {
  const { serviceHealth } = example("Codice pronto al deploy", "serviceHealth");
  const h = serviceHealth();
  const check = expected => {
    assert.equal(h.probeStatus("/live"), 200);
    assert.equal(h.probeStatus("/ready"), expected ? 200 : 503);
    assert.equal(h.canAcceptWork(), expected);
  };
  check(false);
  assert.equal(h.probeStatus("/unknown"), 404);
  h.setDependencyAvailable(true); check(false);
  h.initialized(); check(true);
  h.setDependencyAvailable(false); check(false);
  h.setDependencyAvailable(true); check(true);
  h.beginDrain(); check(false);
  h.initialized(); h.setDependencyAvailable(true); check(false);
  const other = serviceHealth();
  other.initialized();
  assert.equal(other.canAcceptWork(), false);
});
