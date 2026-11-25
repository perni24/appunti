import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { before, describe, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { parseNote } from "../../site/scripts/vault.mjs";

function snippet(note, lang) {
  const list = parseNote(
    "Programmazione/PostgreSQL/Pagine/" + note + ".md",
  ).tree.children.filter((n) => n.type === "code" && n.lang === lang);
  assert.equal(list.length, 1, note);
  return list[0].value;
}
export function applicationCases({ run, flags, blocks, openPeer, fixture }) {
  const db = "lab_app";
  const sql = (q, database = db, env = {}) =>
    run("psql", flags, q, 0, { PGDATABASE: database, ...env }).stdout.trim();
  const lines = (s) => s.split(/\r?\n/).filter(Boolean);
  const [prepare, execute, inspect] = blocks("Prepared statements", 3);
  const [models, report] = blocks("ORM", 2);
  const [outbox, pay, pending, consumer, apply] = blocks("Pattern outbox", 5);
  const [jobs, claim, reap] = blocks("Code e job table", 3);
  const ack = snippet("Code e job table", "psql");
  const python = process.env.PG_APP_PYTHON;
  const needsPy = {
    skip: python
      ? false
      : "Richiede PG_APP_PYTHON con Psycopg 3 e SQLAlchemy 2",
  };
  let appEnv, ackFile;
  function py(code) {
    const { root } = fixture();
    const r = spawnSync(python, ["-I", "-"], {
      cwd: root,
      env: appEnv,
      input: code,
      encoding: "utf8",
      timeout: 20000,
      windowsHide: true,
    });
    assert.ifError(r.error);
    assert.equal(r.status, 0, r.stderr);
    return lines(r.stdout.trim());
  }
  function finish(database, id, token) {
    const out = run(
      "psql",
      [...flags, "-f", ackFile],
      id + "\n" + token + "\n",
      0,
      { PGDATABASE: database },
    ).stdout;
    return out.match(/(\d+\|done)\s*$/)?.[1] ?? null;
  }
  describe("Integrazione applicativa", () => {
    before(() => {
      const { root, env } = fixture();
      run("createdb", [db]);
      ackFile = path.join(root, "lab-complete.psql");
      fs.writeFileSync(ackFile, ack);
      const secret = randomBytes(24).toString("hex");
      sql(
        "\\getenv runtime_pass LAB_RUNTIME_PASS\nCREATE ROLE lab_app_user LOGIN PASSWORD :'runtime_pass';",
        db,
        { LAB_RUNTIME_PASS: secret },
      );
      const service = path.join(root, "lab-app.conf"),
        pass = path.join(root, "lab-app.pgpass");
      fs.writeFileSync(
        service,
        "[lab_app]\nhost=127.0.0.1\nport=" +
          env.PGPORT +
          "\ndbname=lab_app\nuser=lab_app_user\nsslmode=disable\n",
        { mode: 0o600 },
      );
      fs.writeFileSync(
        pass,
        ["127.0.0.1", env.PGPORT, db, "lab_app_user", secret].join(":") + "\n",
        { mode: 0o600 },
      );
      appEnv = {
        ...Object.fromEntries(
          Object.entries(env).filter(([k]) => !/^PG/i.test(k)),
        ),
        PGSERVICEFILE: service,
        PGPASSFILE: pass,
        PGCONNECT_TIMEOUT: "3",
      };
    });
    test(
      "Driver: servizio libpq, login runtime e application_name osservati dal server",
      needsPy,
      () => {
        assert.deepEqual(py(snippet("Driver e connection string", "python")), [
          "lab_app | lab_app_user | orders-api",
        ]);
      },
    );
    test("PREPARE: risultati, conteggio dei piani e rimozione del nome", () => {
      assert.deepEqual(
        lines(
          sql(
            [
              prepare,
              execute,
              inspect,
              "SELECT count(*) FROM pg_prepared_statements WHERE name='lab_price';",
            ].join("\n"),
          ),
        ),
        ["9.00", "13.50", "lab_price|t|2", "0"],
      );
      const out = run(
        "psql",
        [...flags, "-v", "VERBOSITY=verbose"],
        "EXECUTE lab_price(2,4.50);",
        3,
        { PGDATABASE: db },
      );
      assert.match(out.stderr, /26000/);
    });
    test(
      "Psycopg: binding del valore anche senza preparazione persistente",
      needsPy,
      () => {
        assert.deepEqual(py(snippet("Prepared statements", "python")), [
          "D'Amico",
        ]);
      },
    );
    test(
      "ORM: stessi clienti, 4 o 2 SELECT sui dati; aggregazione SQL in un viaggio",
      needsPy,
      () => {
        sql(models);
        const countSelects = [
          "from sqlalchemy import event",
          "from sqlalchemy.engine import Engine",
          "data_selects = []",
          "@event.listens_for(Engine, 'before_cursor_execute')",
          "def note_select(conn, cursor, statement, parameters, context, executemany):",
          "    if statement.lstrip().upper().startswith('SELECT') and ('lab_customers' in statement or 'lab_customer_orders' in statement):",
          "        data_selects.append(statement)",
        ].join("\n");
        const out = py(
          countSelects +
            "\n" +
            snippet("ORM", "python") +
            "\nprint([('lab_customer_orders' in s, ' IN (' in s) for s in data_selects])",
        );
        const expected = "[(1, 2), (2, 1), (3, 0)]";
        assert.deepEqual(out, [
          expected,
          expected,
          "[(False, False), (True, False), (True, False), (True, False), (False, False), (True, True)]",
        ]);
        assert.deepEqual(lines(sql(report)), ["1|2", "2|1", "3|0"]);
      },
    );
    test("Outbox: ordine inesistente, transizione ripetuta ed errore nella scrittura evento", () => {
      const q = [
        "BEGIN;",
        outbox,
        "ALTER TABLE lab_outbox ADD CONSTRAINT lab_stop CHECK (false);",
        "SAVEPOINT blocked;",
        "\\set ON_ERROR_STOP off",
        pay,
        "\\echo :SQLSTATE",
        "\\set ON_ERROR_STOP on",
        "ROLLBACK TO blocked;",
        "SELECT status FROM lab_orders WHERE id=42;",
        "ALTER TABLE lab_outbox DROP CONSTRAINT lab_stop;",
        "SAVEPOINT absent; DELETE FROM lab_orders WHERE id=42;",
        pay,
        "SELECT count(*) FROM lab_outbox;",
        "ROLLBACK TO absent;",
        pay,
        pay,
        "SELECT count(*),count(DISTINCT event_id) FROM lab_outbox;",
        "ROLLBACK;",
      ].join("\n");
      assert.deepEqual(lines(sql(q)), [
        "23514",
        "pending",
        "0",
        "42|order.paid",
        "1|1",
      ]);
    });
    test("Outbox: riconsegna simulata e rollback sul destinatario", () => {
      const out = lines(
        sql(
          [
            "BEGIN;",
            outbox,
            pay,
            pending,
            consumer,
            "SAVEPOINT first_delivery;",
            apply,
            "ROLLBACK TO first_delivery;",
            apply,
            apply,
            "SELECT (SELECT count(*) FROM lab_seen_payments), (SELECT count(*) FROM lab_payment_receipts);",
            "ROLLBACK;",
          ].join("\n"),
        ),
      );
      assert.equal(out[0], "42|order.paid");
      assert.match(
        out[1],
        /^[0-9a-f-]{36}\|42\|order\.paid\|\{"order_id": 42\}$/,
      );
      assert.deepEqual(out.slice(2), ["42", "42", "1|1"]);
    });
    test("Job: due worker saltano il lock e confermano solo la loro prenotazione", async () => {
      const database = "lab_jobs_peers";
      run("createdb", [database]);
      sql(jobs, database);
      const peer = openPeer("lab-job-A", database),
        ended = once(peer, "close");
      let stdout = "",
        stderr = "";
      peer.stdout.on("data", (s) => (stdout += s));
      peer.stderr.on("data", (s) => (stderr += s));
      try {
        peer.stdin.write("BEGIN;\n" + claim + "\nSELECT 'lab-claim-ready';\n");
        const edge =
          "SELECT count(*) FROM pg_stat_activity WHERE application_name='lab-job-A' AND state='idle in transaction' AND query=$q$SELECT 'lab-claim-ready';$q$;";
        let ready = false;
        for (let i = 0; i < 70; i++) {
          if (sql(edge, database) === "1") {
            ready = true;
            break;
          }
          await delay(35);
        }
        assert.ok(ready, stderr || "A non pronto");
        const b = sql(claim, database).split("|");
        assert.equal(b[0], "2");
        assert.equal(b[2], "1");
        peer.stdin.end("COMMIT;\n");
        assert.equal((await ended)[0], 0, stderr);
        const a = lines(stdout)[0].split("|");
        assert.equal(a[0], "1");
        assert.notEqual(a[1], b[1]);
        assert.equal(finish(database, a[0], b[1]), null);
        assert.equal(finish(database, a[0], a[1]), "1|done");
        assert.equal(finish(database, b[0], b[1]), "2|done");
        assert.equal(
          sql("SELECT count(*) FROM lab_jobs WHERE state='done';", database),
          "2",
        );
      } finally {
        if (peer.exitCode === null && peer.signalCode === null) peer.kill();
        await ended;
      }
    });
    test("Job: scadenza, ritardo del retry, vecchio token e limite di tre tentativi", () => {
      const database = "lab_jobs_retry";
      run("createdb", [database]);
      const exec = (q) => sql(q, database);
      exec(jobs);
      exec(
        "UPDATE lab_jobs SET available_at=now()+interval '1 day' WHERE id=2;",
      );
      let lastToken = null;
      for (let n = 1; n <= 3; n++) {
        const [id, token, attempts] = exec(claim).split("|");
        assert.equal(id, "1");
        assert.equal(attempts, String(n));
        assert.notEqual(token, lastToken);
        if (lastToken) assert.equal(finish(database, id, lastToken), null);
        assert.equal(exec(reap), "");
        exec(
          "UPDATE lab_jobs SET lease_until=now()-interval '1 second' WHERE id=1;",
        );
        assert.equal(finish(database, id, token), null);
        assert.equal(
          exec(reap),
          "1|" + (n === 3 ? "failed" : "ready") + "|" + n,
        );
        assert.equal(exec(claim), "");
        exec(
          "UPDATE lab_jobs SET available_at=now()-interval '1 second' WHERE id=1;",
        );
        lastToken = token;
      }
      assert.equal(exec(claim), "");
      assert.equal(
        exec(
          "SELECT state, attempts, claim_token IS NULL FROM lab_jobs WHERE id=1;",
        ),
        "failed|3|t",
      );
    });
  });
}
