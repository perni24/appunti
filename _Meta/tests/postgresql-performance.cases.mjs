import assert from "node:assert/strict";
import { describe, test } from "node:test";

export function performanceCases({ run, flags, blocks }) {
  const types = blocks("Tipi di Indici", 3);
  const covering = blocks("Indici Parziali e Coprenti", 4);
  const explain = blocks("Analisi delle Query", 3);
  const stats = blocks("Statistiche e Query Planner", 3);
  const upkeep = blocks("Manutenzione", 3);
  const execute = (...sql) => run("psql", flags, sql.join("\n")).stdout.trim();
  const lines = (s) => s.split(/\r?\n/).filter(Boolean);
  const explainLine = /^EXPLAIN \([^\n]+\)\n/gm;
  const select = (s) => s.replace(explainLine, "");
  function measured(...sql) {
    // FORMAT JSON cambia la rappresentazione, non la query o le opzioni misurate.
    const output = execute(
      sql.join("\n").replace(/^EXPLAIN \(/gm, "EXPLAIN (FORMAT JSON, "),
    );
    const plans = [],
      rows = [];
    let buffer;
    for (const line of lines(output)) {
      if (line === "[") buffer = [];
      if (buffer) {
        buffer.push(line);
        if (line === "]") {
          plans.push(JSON.parse(buffer.join("\n"))[0].Plan);
          buffer = undefined;
        }
      } else rows.push(line);
    }
    assert.equal(buffer, undefined, "Piano JSON incompleto");
    return { plans, rows };
  }
  function* nodes(plan) {
    yield plan;
    for (const child of plan.Plans ?? []) yield* nodes(child);
  }
  const indexed = (plan, name) =>
    [...nodes(plan)].find((n) => n["Index Name"] === name);

  describe("Performance e Query Planning", () => {
    test("Tutti i blocchi originali sono eseguibili nella sequenza della rispettiva nota", () => {
      for (const recipe of [types, covering, explain, stats, upkeep])
        execute(...recipe);
    });
    test("B-tree per cliente e ordine, GIN per contenimento JSONB", () => {
      const {
        plans: [latest, checkout],
      } = measured(...types);
      assert.ok(indexed(latest, "lab_customer_latest"));
      assert.ok(indexed(checkout, "lab_payload_kind"));
      assert.equal(checkout["Actual Rows"], 12);
      const result = lines(
        execute(types[0], select(types[1]), select(types[2])),
      );
      assert.deepEqual(result.slice(0, 3), ["11993", "11983", "11973"]);
      assert.deepEqual(
        result
          .slice(3)
          .map(Number)
          .sort((a, b) => a - b),
        Array.from({ length: 12 }, (_, i) => (i + 1) * 1000),
      );
    });
    test("Stesso Index Only Scan, heap fetch diversi dopo la modifica di una pagina", () => {
      const { plans } = measured(...covering.slice(0, 3));
      const [clean, dirty] = plans.map((p) => indexed(p, "lab_ready_cover"));
      for (const p of [clean, dirty])
        assert.equal(p["Node Type"], "Index Only Scan");
      assert.equal(clean["Heap Fetches"], 0);
      assert.ok(dirty["Heap Fetches"] > 0);
      assert.deepEqual(
        lines(execute(covering[0], select(covering[1]), select(covering[2]))),
        ["100|job-100", "200|job-200", "100|urgente", "200|job-200"],
      );
    });
    test("Il predicato parametrico di un piano generico non implica lo stato ready", () => {
      const generic =
        "EXPLAIN (GENERIC_PLAN)\nSELECT id,title FROM lab_jobs WHERE state = $1 ORDER BY id LIMIT 2;";
      const {
        plans: [literal, unknown],
      } = measured(covering[0], covering[1], generic);
      assert.ok(indexed(literal, "lab_ready_cover"));
      assert.equal(indexed(unknown, "lab_ready_cover"), undefined);
    });
    test("Unicita parziale: seconda riga attiva vietata anche con una label diversa", () => {
      const unique = covering[3];
      assert.deepEqual(lines(execute(unique)), ["3|1"]);
      const duplicate = unique.replace(
        "ROLLBACK;",
        "INSERT INTO lab_contacts VALUES ('ada@example.org',true,'diversa');",
      );
      const r = run(
        "psql",
        [...flags, "-v", "VERBOSITY=verbose"],
        duplicate,
        3,
      );
      assert.match(r.stderr, /\b23505\b/);
    });
    test("Il top-N restituisce le stesse righe e sul campione elimina il sort esplicito", () => {
      const {
        plans: [before, after],
      } = measured(explain[0], explain[1]);
      assert.ok([...nodes(before)].some((n) => n["Node Type"] === "Sort"));
      assert.ok(indexed(after, "lab_recent_orders"));
      assert.ok(![...nodes(after)].some((n) => n["Node Type"] === "Sort"));
      const rows = lines(
        execute(select(explain[0]), select(explain[1]), "ROLLBACK;"),
      );
      assert.deepEqual(rows, [
        "24042|42",
        "23042|2",
        "22042|42",
        "24042|42",
        "23042|2",
        "22042|42",
      ]);
    });
    test("EXPLAIN ANALYZE modifica la riga; il rollback al savepoint la ripristina", () => {
      const { plans, rows } = measured(...explain);
      assert.equal(plans.at(-1)["Node Type"], "ModifyTable");
      assert.deepEqual(rows, ["43", "42"]);
    });
    test("Le dipendenze correggono la cardinalita stimata senza creare un indice", () => {
      const {
        plans: [before, after],
        rows,
      } = measured(...stats);
      assert.deepEqual(rows, ["region|0|100", "zone|0|100"]);
      for (const p of [before, after]) {
        assert.equal(p["Actual Rows"], 100);
        assert.equal(p["Node Type"], "Seq Scan");
      }
      assert.ok(
        Math.abs(after["Plan Rows"] - 100) <
          Math.abs(before["Plan Rows"] - 100),
      );
      assert.equal(after["Plan Rows"], 100);
    });
    test("Dopo il DELETE, VACUUM senza troncamento lascia invariato il file", () => {
      const [initial, final] = lines(execute(...upkeep.slice(0, 2))).map((s) =>
        s.split("|").map(Number),
      );
      assert.deepEqual([initial[0], final[0]], [10000, 5000]);
      assert.ok(initial[1] > 0);
      assert.equal(final[1], initial[1]);
    });
    test("Il monitoraggio distingue due relazioni omonime, ordinaria e temporanea", () => {
      const monitor = upkeep[2].replace(
        "ORDER BY",
        "AND s.relname = 'lab_pages' ORDER BY",
      );
      const observed = lines(
        execute(
          upkeep[0],
          "BEGIN; CREATE SCHEMA lab_monitor; CREATE TABLE lab_monitor.lab_pages(id int);",
          monitor,
          "ROLLBACK;",
        ),
      ).slice(1);
      assert.deepEqual(
        observed.map((row) => row.split("|").slice(0, 2)),
        [["lab_monitor", "lab_pages"]],
      );
    });
  });
}
