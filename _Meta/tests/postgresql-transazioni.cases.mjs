import assert from "node:assert/strict";
import { once } from "node:events";
import { describe, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

export function transactionCases({ run, flags, blocks, openPeer }) {
  const [accounts, transfer, optional] = blocks("Proprietà ACID", 3);
  const [price, reader, writer, read, commit, reread, dropPrice] = blocks(
    "MVCC",
    7,
  );
  const [rota, count, offA, offB, remaining, reset, dropRota] = blocks(
    "Livelli di Isolamento delle Transazioni",
    7,
  );
  const [jobs, hold, claim, release, dropJobs, report, tryReport, endReport] =
    blocks("Meccanismi di Locking", 8);
  const exec = (...queries) => run("psql", flags, queries.join("\n"));
  const lines = (s) => s.split(/\r?\n/).filter(Boolean);
  const rows = (...queries) => lines(exec(...queries).stdout);
  async function until(check, label) {
    const end = Date.now() + 7000;
    do {
      if (check()) return;
      await delay(40);
    } while (Date.now() < end);
    assert.fail("Condizione non osservata: " + label);
  }
  let serial = 0;
  // La sessione osservatrice conferma che il passo precedente sia terminato,
  // senza usare sleep per decidere in quale ordine le transazioni agiscono.
  async function withPeer(task) {
    const label = "vault-tx-" + ++serial;
    const child = openPeer(label);
    const ended = once(child, "close");
    let stdout = "",
      stderr = "",
      step = 0;
    child.stdout.on("data", (s) => {
      stdout += s;
    });
    child.stderr.on("data", (s) => {
      stderr += s;
    });
    const result = () =>
      lines(stdout).filter((line) => !line.startsWith("vault-barrier-"));
    try {
      await task({
        label,
        async mark(input) {
          const marker = "SELECT 'vault-barrier-" + ++step + "';";
          child.stdin.write(input + "\n" + marker + "\n");
          await until(() => {
            assert.equal(child.exitCode, null, stderr);
            return (
              rows(
                "SELECT count(*) FROM pg_stat_activity WHERE application_name='" +
                  label +
                  "' AND state IN ('idle','idle in transaction') AND query=$q$" +
                  marker +
                  "$q$;",
              )[0] === "1"
            );
          }, marker);
        },
        async finish(input) {
          child.stdin.end(input + "\n");
          const [code] = await ended;
          return { code, rows: result(), stderr };
        },
      });
    } finally {
      if (child.exitCode === null && child.signalCode === null) child.kill();
      await ended;
    }
  }
  function ok(r) {
    assert.equal(r.code, 0, r.stderr);
    return r.rows;
  }
  function fails(r, state) {
    assert.equal(r.code, 3, r.stderr);
    assert.match(r.stderr, new RegExp("\\b" + state + "\\b"));
  }
  describe("Transazioni e concorrenza", () => {
    test("Trasferimento e savepoint: conserva il totale e annulla solo il secondo movimento", () => {
      assert.deepEqual(rows(accounts, transfer, optional), [
        "1|70",
        "2|70",
        "1|70",
        "2|70",
      ]);
    });
    test("Fondi insufficienti, destinatario assente e importo negativo non alterano i saldi", () => {
      for (const [args, state, why] of [
        ["1,2,101", "P0001", "Addebito non eseguito"],
        ["1,9,30", "P0001", "Destinatario assente"],
        ["1,2,-5", "22023", "Argomenti non validi"],
      ]) {
        const r = exec(
          accounts,
          "BEGIN; SAVEPOINT s;\n\\set ON_ERROR_STOP off\nSELECT pg_temp.transfer(" +
            args +
            ");\n\\echo :SQLSTATE\n\\set ON_ERROR_STOP on\nROLLBACK TO s; SELECT id,balance FROM lab_accounts ORDER BY id; COMMIT;",
        );
        assert.ok(r.stderr.includes(why), r.stderr);
        assert.deepEqual(lines(r.stdout), [state, "1|100", "2|40"]);
      }
    });
    for (const [level, afterCommit] of [
      ["REPEATABLE READ", "10"],
      ["READ COMMITTED", "12"],
    ]) {
      test(
        "MVCC: lettura prima e dopo il commit al livello " + level,
        async () => {
          exec(price);
          try {
            await withPeer(async (a) => {
              await a.mark(reader.replace("REPEATABLE READ", level));
              await withPeer(async (b) => {
                await b.mark(writer);
                await a.mark(read);
                assert.deepEqual(ok(await b.finish(commit)), ["12"]);
              });
              assert.deepEqual(ok(await a.finish(reread)), [
                "10",
                "10",
                afterCommit,
                "12",
              ]);
            });
          } finally {
            exec(dropPrice);
          }
        },
      );
    }
    for (const level of ["REPEATABLE READ", "SERIALIZABLE"]) {
      test(
        "Due persone reperibili, decisioni su righe diverse a " + level,
        async () => {
          exec(rota);
          try {
            exec(reset);
            const begin = count.replace("REPEATABLE READ", level);
            await withPeer(async (a) => {
              await a.mark(begin);
              await withPeer(async (b) => {
                await b.mark(begin);
                assert.deepEqual(ok(await a.finish(offA)), ["2", "1"]);
                const r = await b.finish(offB);
                if (level === "SERIALIZABLE") {
                  fails(r, "40001");
                  assert.deepEqual(rows(begin, offB), ["1"]);
                } else assert.deepEqual(ok(r), ["2", "2"]);
              });
            });
            assert.deepEqual(rows(remaining), [
              level === "SERIALIZABLE" ? "1" : "0",
            ]);
          } finally {
            exec(dropRota);
          }
        },
      );
    }
    test("NOWAIT non attende; SKIP LOCKED salta il primo lavoro soltanto finché è riservato", async () => {
      exec(jobs);
      try {
        await withPeer(async (a) => {
          await a.mark(hold);
          const r = run(
            "psql",
            [...flags, "-v", "VERBOSITY=verbose"],
            "SELECT id FROM lab_lock_jobs WHERE id=1 FOR UPDATE NOWAIT;",
            3,
          );
          assert.match(r.stderr, /\b55P03\b/);
          assert.deepEqual(rows(claim), ["2"]);
          assert.deepEqual(ok(await a.finish(release)), ["1"]);
        });
        assert.deepEqual(rows(claim), ["1"]);
        assert.deepEqual(rows(claim), []);
      } finally {
        exec(dropJobs);
      }
    });
    test("Due lock in ordine opposto: una vittima con 40P01, senza presumere quale", async () => {
      exec(jobs);
      try {
        await withPeer(async (a) => {
          await a.mark(hold);
          await withPeer(async (b) => {
            await b.mark(hold.replace("id = 1", "id = 2"));
            const lock = (id) =>
              "SELECT id FROM lab_lock_jobs WHERE id=" +
              id +
              " FOR UPDATE; COMMIT;";
            const waiting = a.finish(lock(2));
            await until(
              () =>
                rows(
                  "SELECT cardinality(pg_blocking_pids(pid)) FROM pg_stat_activity WHERE application_name='" +
                    a.label +
                    "'",
                )[0] === "1",
              "prima attesa di riga",
            );
            const results = [await b.finish(lock(1)), await waiting];
            assert.deepEqual(results.map((r) => r.code).sort(), [0, 3]);
            fails(
              results.find((r) => r.code === 3),
              "40P01",
            );
          });
        });
      } finally {
        exec(dropJobs);
      }
    });
    test("Un advisory lock transazionale termina con il rollback, uno di sessione no", async () => {
      await withPeer(async (a) => {
        await a.mark(report);
        assert.deepEqual(rows(tryReport), ["f"]);
        await a.mark(endReport);
        assert.deepEqual(rows(tryReport), ["t"]);
        assert.deepEqual(ok(await a.finish("")), ["t"]);
      });
      assert.deepEqual(rows(tryReport), ["t"]);
      await withPeer(async (a) => {
        await a.mark(
          report.replace("pg_try_advisory_xact_lock", "pg_try_advisory_lock") +
            "\nROLLBACK;",
        );
        assert.deepEqual(rows(tryReport), ["f"]);
        assert.deepEqual(
          ok(await a.finish("SELECT pg_advisory_unlock(8602,1);")),
          ["t", "t"],
        );
      });
      assert.deepEqual(rows(tryReport), ["t"]);
    });
  });
}
