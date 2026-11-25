import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { parseNote } from "../../site/scripts/vault.mjs";

function snippet(note, lang) {
  const list = parseNote(
    "Programmazione/PostgreSQL/Pagine/" + note + ".md",
  ).tree.children.filter((n) => n.type === "code" && n.lang === lang);
  assert.equal(list.length, 1);
  return list[0].value;
}

export function scalingCases({
  run,
  flags,
  blocks,
  freePort,
  startServer,
  fixture,
}) {
  const sql = (s, session = {}) =>
    run("psql", flags, s, 0, session).stdout.trim();
  const lines = (s) => s.split(/\r?\n/);
  async function until(f, label) {
    for (let i = 0; i < 100; i++) {
      if (f()) return;
      await delay(100);
    }
    assert.fail(label);
  }
  function stop(dir) {
    if (fs.existsSync(path.join(dir, "postmaster.pid")))
      run("pg_ctl", ["-D", dir, "-m", "fast", "-w", "stop"]);
  }
  test("Scalabilità: instradamento, pruning, detach e intervallo mancante", () => {
    const [setup, rows, plan, detach] = blocks("Partitioning", 4);
    const out = lines(sql([setup, rows, plan, detach].join("\n")));
    assert.deepEqual(out.slice(0, 2), [
      "1|2026-01-31|lab_jan",
      "1|2026-02-01|lab_feb",
    ]);
    assert.match(out.slice(2, -2).join(" "), /lab_feb/);
    assert.doesNotMatch(out.slice(2, -2).join(" "), /lab_jan/);
    assert.deepEqual(out.slice(-2), ["1", "1"]);
    const err = run(
      "psql",
      [...flags, "-v", "VERBOSITY=verbose"],
      setup + "\nINSERT INTO lab_orders VALUES (2, '2026-03-01');",
      3,
    );
    assert.match(err.stderr, /23514/);
  });
  test("Scalabilità: SET LOCAL termina al commit", () => {
    const snippets = blocks("Connection Pooling", 3);
    assert.deepEqual(
      lines(sql(["SET statement_timeout='9s';", ...snippets].join("\n"))),
      ["9s", "5s", "9s"],
    );
  });
  test("Scalabilità: routing per tenant, incluso un tenant sconosciuto", () => {
    assert.deepEqual(lines(sql(blocks("Sharding", 1)[0])), [
      "10|eu_1",
      "20|eu_2",
      "99|",
    ]);
  });
  test("Scalabilità: base backup, lettura dopo replay e selezione del writer", async () => {
    const { root, env } = fixture();
    const port = String(await freePort());
    const peer = { PGPORT: port };
    const dir = path.join(root, "standby-data");
    const phys = blocks("Replicazione Fisica", 2),
      reads = blocks("Read replicas", 2);
    const role = blocks("Failover e Load Balancing", 1)[0];
    sql("CREATE TABLE lab_visible (id integer PRIMARY KEY);");
    try {
      const command = snippet("Replicazione Fisica", "bash").split(" ");
      assert.equal(command.shift(), "pg_basebackup");
      run("pg_basebackup", [
        ...command.map((a) => a.replaceAll('"', "")),
        "--checkpoint=fast",
        "-w",
      ]);
      assert.ok(fs.existsSync(path.join(dir, "standby.signal")));
      fs.appendFileSync(
        path.join(dir, "postgresql.auto.conf"),
        "\nport = " +
          port +
          "\nprimary_conninfo = 'service=vault_primary application_name=lab_standby'\n",
      );
      startServer(dir);
      await until(
        () => sql(phys[0]).includes("lab_standby|streaming|"),
        "standby non in streaming",
      );
      assert.match(
        sql(phys[1], peer),
        /^t\|[0-9A-F]+\/[0-9A-F]+\|[0-9A-F]+\/[0-9A-F]+$/,
      );
      assert.equal(sql(role, peer), "t|on");
      assert.equal(sql("BEGIN READ ONLY;\n" + role + "\nROLLBACK;"), "f|on");
      const writer = snippet("Failover e Load Balancing", "text")
        .replace("db-a,db-b", "127.0.0.1,127.0.0.1")
        .replace("port=5432", "port=" + port + "," + env.PGPORT)
        .replace("dbname=app", "dbname=postgres");
      assert.equal(
        run("psql", [...flags, "-d", writer], role).stdout.trim(),
        "f|off",
      );
      const rejected = run(
        "psql",
        [...flags, "-v", "VERBOSITY=verbose"],
        "INSERT INTO lab_visible VALUES (2);",
        3,
        peer,
      );
      assert.match(rejected.stderr, /25006/);
      sql("SELECT pg_wal_replay_pause();", peer);
      sql("INSERT INTO lab_visible VALUES (1);");
      await until(
        () => sql("SELECT pg_get_wal_replay_pause_state();", peer) === "paused",
        "replay non in pausa",
      );
      // This second commit occurs after the standby acknowledged the pause.
      sql("INSERT INTO lab_visible VALUES (3);");
      const target = sql(reads[1]);
      assert.match(target, /^[0-9A-F]+\/[0-9A-F]+$/);
      await until(
        () =>
          sql(
            "SELECT pg_last_wal_receive_lsn() >= '" + target + "'::pg_lsn;",
            peer,
          ) === "t",
        "WAL non ricevuto",
      );
      const diag = sql(reads[0], peer).split("|");
      assert.equal(diag[0], "t");
      assert.ok(Number(diag[1]) > 0);
      const f = path.join(root, "check-target.psql");
      fs.writeFileSync(f, snippet("Read replicas", "psql"));
      const ready = () =>
        run("psql", [...flags, "-f", f], target + "\n", 0, peer)
          .stdout.trim()
          .slice(-1);
      assert.equal(ready(), "f");
      assert.equal(
        sql("SELECT count(*) FROM lab_visible WHERE id=3;", peer),
        "0",
      );
      sql("SELECT pg_wal_replay_resume();", peer);
      await until(() => ready() === "t", "soglia di replay non raggiunta");
      assert.equal(
        sql("SELECT count(*) FROM lab_visible WHERE id=3;", peer),
        "1",
      );
    } finally {
      stop(dir);
      sql(
        "SELECT pg_drop_replication_slot(slot_name) FROM pg_replication_slots WHERE slot_name='lab_standby'; DROP TABLE lab_visible;",
      );
    }
  });
  test("Scalabilità: subscription reale, copia iniziale e modifiche di riga", async () => {
    const { root, env } = fixture();
    const port = String(await freePort());
    const peer = { PGPORT: port };
    const dir = path.join(root, "subscriber");
    const pass = path.join(root, "subscriber.pass");
    fs.writeFileSync(pass, env.PGPASSWORD + "\n", { mode: 0o600 });
    const [ddl, pub, sub, status] = blocks("Replicazione Logica", 4);
    try {
      run("initdb", [
        "-D",
        dir,
        "-U",
        env.PGUSER,
        "--auth=scram-sha-256",
        "--pwfile",
        pass,
        "--locale=C",
        "-E",
        "UTF8",
      ]);
      fs.unlinkSync(pass);
      fs.appendFileSync(
        path.join(dir, "postgresql.conf"),
        "\nlisten_addresses='127.0.0.1'\nunix_socket_directories=''\nport=" +
          port +
          "\n",
      );
      startServer(dir);
      sql(ddl + "\n" + pub);
      sql(ddl, peer);
      sql(sub, peer);
      await until(
        () => sql(status, peer) === "lab_orders_sync|r",
        "copia iniziale non completata",
      );
      const values = () =>
        sql("SELECT id,status FROM public.lab_orders_sync ORDER BY id;", peer);
      assert.equal(values(), "1|aperto");
      sql(
        "UPDATE public.lab_orders_sync SET status='chiuso' WHERE id=1; INSERT INTO public.lab_orders_sync VALUES (2,'nuovo');",
      );
      await until(
        () => lines(values()).join(",") === "1|chiuso,2|nuovo",
        "UPDATE/INSERT non applicati",
      );
      sql("DELETE FROM public.lab_orders_sync WHERE id=1;");
      await until(() => values() === "2|nuovo", "DELETE non applicato");
      sql("DROP SUBSCRIPTION lab_orders_sub;", peer);
      assert.equal(
        sql(
          "SELECT count(*) FROM pg_replication_slots WHERE slot_name='lab_orders_sub';",
        ),
        "0",
      );
    } finally {
      stop(dir);
      sql(
        "DROP PUBLICATION IF EXISTS lab_orders_pub; DROP TABLE IF EXISTS public.lab_orders_sync;",
      );
    }
  });
}
