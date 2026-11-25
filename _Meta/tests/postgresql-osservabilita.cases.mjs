import assert from "node:assert/strict";
import { once } from "node:events";
import fs from "node:fs";
import { before, describe, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

export function observabilityCases({
  run,
  flags,
  blocks,
  openPeer,
  serverLog,
}) {
  const db = "lab_observability";
  const sql = (...stmts) =>
    run("psql", flags, stmts.join("\n"), 0, { PGDATABASE: db }).stdout.trim();
  const [slow, ranking, explain] = blocks("Slow query log", 3);
  const [pairs, waiting, hold, wait, releaseA, releaseB] = blocks(
    "Lock monitoring",
    6,
  );
  const [sessions, sample, slots] = blocks("Metriche e alerting", 3);
  const rows = (s) =>
    s
      .split(/\r?\n/)
      .filter(Boolean)
      .map((x) => x.split("|"));
  async function until(check, label) {
    for (let i = 0; i < 65; i++) {
      if (check()) return;
      await delay(60);
    }
    assert.fail(label);
  }
  function newLog() {
    const file = serverLog(),
      offset = fs.statSync(file).size;
    return () => fs.readFileSync(file).subarray(offset).toString("utf8");
  }
  describe("Osservabilità e troubleshooting", () => {
    before(() => run("createdb", [db]));
    test("La query oltre soglia compare nel log e la modifica locale termina al commit", async () => {
      const log = newLog();
      assert.deepEqual(
        rows(
          sql(
            "SET log_min_duration_statement=-1;",
            slow,
            "SHOW log_min_duration_statement;",
            "SELECT 1 AS lab_fuori_finestra;",
          ),
        ),
        [["-1"], ["1"]],
      );
      await until(
        () =>
          /duration:[^\r\n]*statement:\s*SELECT pg_sleep\(0\.1\) AS lab_query_lenta/i.test(
            log(),
          ),
        "Voce di durata non trovata",
      );
      assert.doesNotMatch(
        log(),
        /statement:\s*SELECT 1 AS lab_fuori_finestra/i,
      );
    });
    test("auto_explain registra il piano dello statement eseguito, non solo il testo", async () => {
      const log = newLog();
      assert.equal(sql(explain), "55");
      await until(
        () =>
          /Query Text: SELECT sum\(i\) AS lab_piano/i.test(log()) &&
          /Aggregate/i.test(log()),
        "Piano della query di laboratorio assente",
      );
      const node = log()
        .split(/\r?\n/)
        .find((line) => /Aggregate/.test(line));
      const actual = node.match(/actual rows=([\d.]+) loops=(\d+)/);
      assert.ok(actual, node);
      assert.deepEqual(actual.slice(1).map(Number), [1, 1]);
    });
    test("pg_stat_statements aggrega le costanti e conta la differenza tra campioni", () => {
      sql(
        "CREATE EXTENSION pg_stat_statements; CREATE TABLE lab_obs_importi(n integer); INSERT INTO lab_obs_importi SELECT generate_series(1,50);",
      );
      const sum = (n) =>
        sql("SELECT sum(n) FROM lab_obs_importi WHERE n > " + n + ";");
      const findRow = () => {
        const result = rows(sql(ranking));
        const matches = result.filter((row) =>
          /^SELECT sum\(n\) FROM lab_obs_importi WHERE n > \$\d/i.test(
            row[6] ?? "",
          ),
        );
        assert.equal(matches.length, 1);
        return matches[0];
      };
      sum(0);
      sum(1);
      const first = findRow();
      assert.equal(first[2], "2");
      assert.match(first[1], /^-?\d+$/);
      assert.ok(first[5]);
      sum(10);
      sum(40);
      sum(45);
      const last = findRow();
      assert.equal(last[2], "5");
      assert.deepEqual(
        [last[0], last[1], last[5]],
        [first[0], first[1], first[5]],
      );
      assert.ok(Number(last[3]) >= Number(first[3]));
    });
    test("Tre sessioni: titolare fermo, richiedente in coda e scomparsa del blocco", async () => {
      const peers = [];
      function open(label) {
        const child = openPeer(label, db);
        const ended = once(child, "close");
        child.stdout.resume();
        child.stderr.resume();
        peers.push({ child, ended });
        return child;
      }
      const holder = open("obs-hold"),
        waiter = open("obs-wait");
      const state = (label) =>
        sql(
          "SELECT state FROM pg_stat_activity WHERE application_name='" +
            label +
            "'",
        );
      try {
        holder.stdin.write(hold + "\n");
        await until(
          () =>
            sql(
              "SELECT count(*) FROM pg_locks l JOIN pg_stat_activity a USING (pid) WHERE a.application_name='obs-hold' AND a.state='idle in transaction' AND l.locktype='advisory' AND l.granted;",
            ) === "1",
          "A non ha acquisito il lock",
        );
        waiter.stdin.write(wait + "\n");
        let edge;
        await until(() => {
          edge = rows(sql(pairs)).find(
            (r) => r[1] === "obs-wait" && r[3] === "obs-hold",
          );
          return edge;
        }, "C non vede B in attesa di A");
        assert.notEqual(edge[0], edge[2]);
        assert.equal(edge[4], "idle in transaction");
        assert.ok(edge[5]);
        const entry = rows(sql(waiting)).find((r) => r[0] === edge[0]);
        assert.ok(entry);
        assert.equal(entry[1], "advisory");
        assert.ok(entry[3] && entry[4]);
        const states = new Map(rows(sql(sessions)));
        assert.ok(Number(states.get("active")) >= 2);
        assert.ok(Number(states.get("idle in transaction")) >= 1);
        holder.stdin.end(releaseA + "\n");
        await until(
          () => state("obs-wait") === "idle in transaction",
          "B non ha ottenuto il lock",
        );
        assert.ok(!rows(sql(pairs)).some((r) => r[0] === edge[0]));
        waiter.stdin.end(releaseB + "\n");
        for (const { ended } of peers) assert.equal((await ended)[0], 0);
      } finally {
        for (const { child } of peers)
          if (child.exitCode === null && child.signalCode === null)
            child.kill();
        await Promise.all(peers.map((p) => p.ended));
      }
    });
    test("Il contatore dei rollback aumenta tra due campioni comparabili", async () => {
      const get = () => rows(sql(sample))[0];
      const first = get();
      assert.ok(first[0] && first[1]);
      assert.equal(first.length, 6);
      sql("BEGIN; SELECT 1; ROLLBACK;");
      let last;
      await until(() => {
        last = get();
        return BigInt(last[4]) > BigInt(first[4]);
      }, "Rollback non osservato");
      assert.deepEqual(last.slice(1, 3), first.slice(1, 3));
      assert.equal(BigInt(last[4]) - BigInt(first[4]), 1n);
      assert.equal(last[5], first[5]);
    });
    test("Uno slot riservato inattivo mostra una distanza WAL, poi scompare dopo la rimozione", () => {
      const slot = "lab_obs_wal";
      const get = () => rows(sql(slots)).find((r) => r[0] === slot);
      assert.equal(get(), undefined);
      sql("SELECT pg_create_physical_replication_slot('lab_obs_wal',true);");
      try {
        sql(
          "CREATE TABLE lab_obs_wal_probe(i integer); INSERT INTO lab_obs_wal_probe VALUES (1);",
        );
        const entry = get();
        assert.ok(entry);
        assert.equal(entry[1], "f");
        assert.equal(entry[2], "reserved");
        assert.match(entry[3], /^[0-9A-F]+\/[0-9A-F]+$/);
        assert.ok(BigInt(entry[4]) > 0n);
      } finally {
        sql("SELECT pg_drop_replication_slot('lab_obs_wal');");
      }
      assert.equal(get(), undefined);
    });
  });
}
