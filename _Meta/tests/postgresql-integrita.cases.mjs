import assert from "node:assert/strict";
import { describe, test } from "node:test";

export function businessCases({ run, flags, blocks }) {
  const [trigger, changes, ddl] = blocks("Trigger e Event Trigger", 3);
  const [rule, archive] = blocks("Regole", 2);
  const [stock, reserve, strict] = blocks("PL-pgSQL", 3);
  const [routines, calls] = blocks("Funzioni e Store Procedures", 2);
  const [list, native, extension] = blocks("Gestione delle Estensioni", 5);
  const args = [...flags, "-P", "null=<NULL>"];
  const execute = (...sql) => run("psql", args, sql.join("\n"));
  function rows(...sql) {
    const out = execute(...sql).stdout.trim();
    return out ? out.split(/\r?\n/) : [];
  }
  function rejects(sql, state) {
    const r = run("psql", args, "\\set VERBOSITY verbose\n" + sql, 3);
    assert.match(r.stderr, new RegExp("\\b" + state + "\\b"));
  }
  function variant(sql, before, after) {
    assert.equal(sql.split(before).length, 2, before);
    return sql.replace(before, () => after);
  }
  describe("Integrita e logica di business", () => {
    test("AFTER: due righe elaborate ma una sola transizione di stato", () => {
      const output = rows(trigger, changes);
      assert.deepEqual(output.slice(0, 2).sort(), ["1", "2"]);
      assert.deepEqual(output.slice(2), ["1|<NULL>|closed"]);
    });
    test("Il rollback a un savepoint annulla sia la transizione sia il registro", () => {
      assert.deepEqual(
        rows(
          trigger,
          "SAVEPOINT s; UPDATE lab_tickets SET state='open' WHERE id=2; SELECT count(*) FROM lab_changes; ROLLBACK TO s; SELECT state,(SELECT count(*) FROM lab_changes) FROM lab_tickets WHERE id=2; ROLLBACK;",
        ),
        ["1", "closed|0"],
      );
    });
    test("Event trigger: registra CREATE TABLE nello schema richiesto, non INSERT o altre tabelle", () => {
      const filtered = variant(
        ddl,
        "INSERT INTO lab_ddl_demo.example",
        "CREATE TEMP TABLE lab_outside (id integer);\nINSERT INTO lab_ddl_demo.example",
      );
      assert.deepEqual(rows(ddl), ["CREATE TABLE|lab_ddl_demo.example"]);
      assert.deepEqual(
        rows(
          filtered,
          "SELECT count(*) FROM pg_event_trigger WHERE evtname='lab_ddl_watch';",
        ),
        ["CREATE TABLE|lab_ddl_demo.example", "0"],
      );
    });
    test("La regola archivia solo le righe selezionate e DROP ripristina il DELETE", () => {
      assert.deepEqual(rows(rule, archive), [
        "1|t",
        "2|f",
        "3|t",
        "3",
        "1",
        "2",
      ]);
      rejects(
        rule + "\nDELETE FROM lab_orders WHERE id=1 RETURNING id;",
        "0A000",
      );
    });
    test("Scorte: prenotazione, disponibilita insufficiente, prodotto assente e limite esatto", () => {
      assert.deepEqual(rows(stock, reserve), ["t", "f", "f", "2"]);
      assert.deepEqual(
        rows(
          stock,
          "SELECT pg_temp.reserve(1,5); SELECT available FROM lab_stock;",
        ),
        ["t", "0"],
      );
      for (const qty of ["-1", "0", "NULL"])
        rejects(stock + "\nSELECT pg_temp.reserve(1," + qty + ");", "22023");
    });
    test("INTO STRICT: errori di cardinalita distinti e gestione mirata del caso ambiguo", () => {
      assert.match(execute(strict).stderr, /Selezione ambigua/);
      assert.match(
        execute(variant(strict, "v > 3", "v = 4")).stderr,
        /Valore: 4/,
      );
      rejects(variant(strict, "v > 3", "v > 5"), "P0002");
      rejects(
        variant(strict, "WHEN too_many_rows", "WHEN no_data_found"),
        "P0003",
      );
    });
    test("Funzione STRICT e procedura con OUT: solo la prima cancellazione cambia lo stato", () => {
      assert.deepEqual(rows(routines, calls), [
        "60.00|<NULL>",
        "t",
        "f",
        "1|cancelled",
      ]);
    });
    test("SECURITY INVOKER: EXECUTE non sostituisce i privilegi sulla tabella", () => {
      const setup = variant(
        routines,
        "CREATE TEMP TABLE",
        "CREATE SCHEMA lab_invoker; SET LOCAL search_path TO lab_invoker; CREATE TABLE",
      ).replaceAll("pg_temp.", "lab_invoker.");
      const role =
        "CREATE ROLE lab_operator; GRANT USAGE ON SCHEMA lab_invoker TO lab_operator; REVOKE EXECUTE ON PROCEDURE lab_invoker.cancel_order(integer) FROM PUBLIC; GRANT EXECUTE ON PROCEDURE lab_invoker.cancel_order(integer) TO lab_operator;";
      const call =
        "SET LOCAL ROLE lab_operator; CALL lab_invoker.cancel_order(1,NULL);";
      rejects([setup, role, call].join("\n"), "42501");
      assert.deepEqual(
        rows(
          setup,
          role,
          "GRANT SELECT, UPDATE(state) ON lab_invoker.lab_orders TO lab_operator;",
          call,
        ),
        ["t"],
      );
    });
    test("Una procedura puo chiudere una transazione al livello principale, non dentro BEGIN", () => {
      const proc =
        "CREATE TEMP TABLE lab_batch(i int); CREATE PROCEDURE pg_temp.batch() LANGUAGE plpgsql AS $$ BEGIN INSERT INTO pg_temp.lab_batch VALUES(1); COMMIT; END; $$;";
      assert.deepEqual(
        rows(proc, "CALL pg_temp.batch(); SELECT count(*) FROM lab_batch;"),
        ["1"],
      );
      rejects(proc + "\nBEGIN; CALL pg_temp.batch();", "2D000");
    });
    test("UUID nativo disponibile senza pgcrypto; inventario e installazione per database", () => {
      assert.ok(rows(list).some((r) => /^pgcrypto\|[^|]+\|<NULL>$/.test(r)));
      assert.deepEqual(rows(native), ["uuid"]);
      assert.deepEqual(
        rows(
          extension,
          "SELECT count(*) FROM pg_extension WHERE extname='pgcrypto';",
        ),
        ["pgcrypto|lab_ext_demo", "32", "0"],
      );
    });
  });
}
