import assert from "node:assert/strict";
import { once } from "node:events";
import { before, describe, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

export function structureMemoCases({ run, flags, blocks, openPeer }) {
  const db = "lab_memo_structure";
  const memo = (name, n) =>
    blocks("PostgreSQL - " + name, n, "Promemoria/Pagine");
  const exec = (input, expected = 0) =>
    run("psql", [...flags, "-v", "VERBOSITY=verbose"], input, expected, {
      PGDATABASE: db,
    });
  const sql = (...commands) => exec(commands.join("\n")).stdout.trim();
  const lines = (s) => s.split(/\r?\n/).filter(Boolean);
  function rejects(commands, state) {
    assert.match(
      exec(commands.join("\n"), 3).stderr,
      new RegExp("\\b" + state + "\\b"),
    );
  }
  async function until(check, label) {
    const end = Date.now() + 6000;
    do {
      if (check()) return;
      await delay(35);
    } while (Date.now() < end);
    assert.fail(label);
  }

  describe("Promemoria Struttura e prestazioni", () => {
    before(() => run("createdb", [db]));
    test("DDL: figlia prima del padre, controllo differito, conversione e rollback", () => {
      const [schema, parent, child, data, add, convert, drop] = memo(
        "Tabelle schemi e vincoli",
        7,
      );
      assert.deepEqual(
        lines(
          sql(
            schema,
            parent,
            child,
            data,
            add,
            convert,
            drop,
            "SELECT to_regnamespace('lab_ddl') IS NULL;",
          ),
        ),
        ["1", "10|7|integer", "t"],
      );
      rejects(
        [
          schema,
          parent,
          child,
          "INSERT INTO lab_ddl.orders VALUES (10,1,12.50);",
          "SET CONSTRAINTS lab_ddl.orders_customer_fk IMMEDIATE;",
        ],
        "23503",
      );
      rejects(
        [schema, parent, child, data, "DELETE FROM lab_ddl.customers;"],
        "23503",
      );
      rejects(
        [
          schema,
          parent,
          child,
          data,
          "INSERT INTO lab_ddl.customers(email) VALUES ('ada@example.org');",
        ],
        "23505",
      );
      rejects(
        [
          schema,
          parent,
          child,
          data,
          "INSERT INTO lab_ddl.orders VALUES (11,1,-1);",
        ],
        "23514",
      );
      rejects(
        [
          schema,
          parent,
          child,
          data,
          "INSERT INTO lab_ddl.orders VALUES (11,1,NULL);",
        ],
        "23502",
      );
      rejects(
        [
          schema,
          parent,
          child,
          data,
          add,
          "UPDATE lab_ddl.orders SET lot='ABC';",
          convert,
        ],
        "22P02",
      );
    });
    test("Indici: definizioni, vincolo funzionale, stime e righe effettive", () => {
      const [
        setup,
        analyze,
        estimate,
        cover,
        measure,
        unique,
        partial,
        gin,
        build,
        drop,
        defs,
        stats,
        cleanup,
      ] = memo("Indici ed EXPLAIN", 13);
      sql(setup);
      try {
        sql(analyze);
        const plan = sql(estimate);
        assert.match(plan, /cost=/);
        assert.doesNotMatch(plan, /actual /);
        sql(cover);
        assert.match(
          lines(sql(measure))[0],
          /actual .*rows=3(?:\.0+)? loops=1/,
        );
        assert.deepEqual(lines(sql(estimate.replace("EXPLAIN ", ""))), [
          "1987|closed",
          "1967|closed",
          "1947|closed",
        ]);
        sql(unique, partial, gin);
        rejects(
          ["INSERT INTO lab_idx.orders VALUES (0,0,'ord-1','open','{}');"],
          "23505",
        );
        rejects(["BEGIN;", build], "25001");
        sql(build);
        rejects(["BEGIN;", drop], "25001");
        sql(drop);
        const indexes = new Map(lines(sql(defs)).map((x) => x.split("|")));
        assert.equal(indexes.size, 5);
        assert.match(
          indexes.get("orders_customer_latest"),
          /customer_id, id DESC\) INCLUDE \(status\)/,
        );
        assert.match(indexes.get("orders_open"), /WHERE .*status = 'open'/);
        assert.match(indexes.get("orders_metadata"), /USING gin/);
        const counts = lines(sql(stats)).map((x) => x.split("|"));
        assert.deepEqual(
          counts.map(([n]) => n),
          [...indexes.keys()],
        );
        assert.ok(counts.every(([, n]) => /^\d+$/.test(n)));
      } finally {
        sql(cleanup);
      }
    });
    test("Savepoint e coda: NOWAIT, prenotazione durevole, attesa osservabile e rilascio", async () => {
      const [
        setup,
        savepoint,
        hold,
        nowait,
        claim,
        activity,
        waiting,
        release,
        tableLock,
        cleanup,
      ] = memo("Transazioni e lock", 10);
      const peers = [];
      function peer(name) {
        const child = openPeer(name, db),
          ended = once(child, "close");
        let stdout = "",
          stderr = "";
        child.stdout.on("data", (data) => {
          stdout += data;
        });
        child.stderr.on("data", (data) => {
          stderr += data;
        });
        peers.push({ child, ended });
        return {
          child,
          async finish(input) {
            child.stdin.end(input + "\n");
            assert.equal((await ended)[0], 0, stderr);
            return stdout.trim();
          },
        };
      }
      sql(setup);
      try {
        assert.deepEqual(lines(sql(savepoint)), [
          "1|pending",
          "2|pending",
          "3|done",
        ]);
        const a = peer("memo-struct-A");
        a.child.stdin.write(hold + "\n");
        const activePid = (name) =>
          sql(
            "SELECT pid FROM pg_stat_activity WHERE application_name='" +
              name +
              "' AND state='idle in transaction';",
          );
        await until(
          () => activePid("memo-struct-A"),
          "A non ha terminato la SELECT FOR UPDATE",
        );
        const aPid = activePid("memo-struct-A");
        rejects([nowait], "55P03");
        assert.equal(sql(claim), "2");
        const b = peer("memo-struct-B");
        const bPid = () =>
          sql(
            "SELECT pid FROM pg_stat_activity WHERE application_name='memo-struct-B';",
          );
        b.child.stdin.write(nowait.replace(" NOWAIT", "") + "\n");
        await until(
          () =>
            lines(sql(activity)).some(
              (r) =>
                r.startsWith(bPid() + "|active|Lock|") &&
                r.endsWith("|{" + aPid + "}"),
            ),
          "B non risulta in attesa di A",
        );
        assert.ok(lines(sql(waiting)).some((r) => r.startsWith(bPid() + "|")));
        assert.equal(await a.finish(release), "1");
        assert.equal(await b.finish(""), "1");
        assert.equal(sql(claim), "1");
        assert.equal(sql(claim), "");
        assert.equal(sql(tableLock), "");
      } finally {
        for (const { child } of peers)
          if (child.exitCode === null && child.signalCode === null)
            child.kill();
        for (const { ended } of peers) await ended;
        sql(cleanup);
      }
    });
  });
}
