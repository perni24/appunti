import assert from "node:assert/strict";
import { describe, test } from "node:test";

export function sqlCases({ run, flags, blocks }) {
  const types = blocks("Tipi di Dato", 3);
  const dml = blocks("SELECT INSERT UPDATE e DELETE", 3).join("\n");
  const [joinSetup, joinPaid, joinNone] = blocks("JOIN", 3);
  const [report, emptyClient, duplicates] = blocks(
    "Aggregazioni e GROUP BY",
    3,
  );
  const [scalar, exists, derived] = blocks("Subquery", 3);
  const [orders, bookings] = blocks("Vincoli", 2);
  const args = [...flags, "-P", "null=<NULL>"];
  function rows(input) {
    const text = run("psql", args, input).stdout.trim();
    return text ? text.split(/\r?\n/) : [];
  }
  function variant(source, match, replacement) {
    assert.equal(
      source.split(match).length,
      2,
      "Frammento SQL assente o ambiguo: " + match,
    );
    return source.replace(match, replacement);
  }
  function rejects(input, state, constraint) {
    const r = run("psql", args, "\\set VERBOSITY verbose\n" + input, 3);
    assert.match(r.stderr, new RegExp("\\b" + state + "\\b"));
    if (constraint) assert.ok(r.stderr.includes(constraint), r.stderr);
    return r;
  }
  describe("SQL Fondamentale", () => {
    test("Tipi: arrotondamento, istanti equivalenti, JSON null, chiave assente e confini del range", () => {
      assert.deepEqual(rows(types[0]), ["12.35|t", "t"]);
      assert.deepEqual(rows(types[1]), ["pro|t|f|t"]);
      assert.deepEqual(rows(types[2]), ["t|f"]);
    });
    test("DML: RETURNING nelle tre scritture, ordinamento del SELECT e rollback", () => {
      assert.deepEqual(
        rows(dml + "\nSELECT to_regclass('pg_temp.lab_users') IS NULL;"),
        [
          "1|t",
          "1|ada@example.org",
          "1|ada@example.org",
          "2|teo@example.org",
          "1",
          "t",
        ],
      );
      const none = variant(dml, "WHERE last_login_at IS NULL", "WHERE false");
      assert.deepEqual(rows(none), [
        "1|t",
        "1|ada@example.org",
        "1|ada@example.org",
        "2",
      ]);
    });
    test("JOIN: duplicazione 1:N, ON contro WHERE e cliente senza ordini", () => {
      const source = joinSetup + "\n" + joinPaid + "\n" + joinNone;
      assert.deepEqual(rows(source), [
        "Ada|11",
        "Ada|12",
        "Teo|<NULL>",
        "Lia|<NULL>",
        "Lia",
      ]);
      assert.deepEqual(
        rows(
          variant(source, "AND o.status = 'paid'", "WHERE o.status = 'paid'"),
        ),
        ["Ada|11", "Ada|12", "Lia"],
      );
    });
    test("Aggregati: FILTER, HAVING, importi ignoti e gruppo mancante", () => {
      assert.deepEqual(rows(report), ["1|3|2|1|20"]);
      assert.deepEqual(rows(emptyClient), ["1|1|1|20|20", "2|1|0|<NULL>|0"]);
      assert.deepEqual(rows(duplicates), ["ada@example.org|2"]);
      assert.deepEqual(
        rows("SELECT count(*), sum(v) FROM (VALUES (1)) t(v) WHERE false;"),
        ["0|<NULL>"],
      );
      assert.deepEqual(
        rows(
          "SELECT v, count(*) FROM (VALUES (1)) t(v) WHERE false GROUP BY v;",
        ),
        [],
      );
    });
    test("GROUP BY: dipendenza funzionale dalla chiave primaria di una tabella di base", () => {
      const base =
        "BEGIN; CREATE TEMP TABLE lab_fd(id int PRIMARY KEY, label text); INSERT INTO lab_fd VALUES(1,'Ada');\n";
      assert.deepEqual(
        rows(
          base +
            "SELECT id, label, count(*) FROM lab_fd GROUP BY id; ROLLBACK;",
        ),
        ["1|Ada|1"],
      );
      rejects(
        base + "SELECT id, label, count(*) FROM lab_fd GROUP BY label;",
        "42803",
      );
    });
    test("Subquery: appartenenza a tre valori, correlazione e tabella derivata", () => {
      assert.deepEqual(rows(scalar), ["12|30"]);
      assert.deepEqual(rows(exists), ["1|t|f|f", "2|f|<NULL>|t"]);
      assert.deepEqual(rows(derived), ["1|1100"]);
    });
    test("Subquery scalare: il risultato vuoto è NULL, due righe violano la cardinalità", () => {
      const zero = "(SELECT amount FROM orders WHERE false)";
      assert.deepEqual(
        rows(
          variant(
            scalar,
            "amount > (SELECT avg(amount) FROM orders)",
            zero + " IS NULL ORDER BY id",
          ),
        ),
        ["11|10", "12|30"],
      );
      rejects(
        variant(
          scalar,
          "SELECT avg(amount) FROM orders",
          "SELECT amount FROM orders",
        ),
        "21000",
      );
    });
    test("Vincoli: NOT NULL, CHECK, UNIQUE, FK e cancellazione del genitore", () => {
      assert.deepEqual(rows(orders), ["1|2"]);
      for (const [statement, state, name] of [
        ["INSERT INTO lab_orders(customer_id,qty) VALUES(1,NULL);", "23502"],
        [
          "INSERT INTO lab_orders(customer_id,qty) VALUES(1,0);",
          "23514",
          "lab_qty_positive",
        ],
        [
          "INSERT INTO lab_customers VALUES(3,'ada@example.org',NULL);",
          "23505",
        ],
        [
          "INSERT INTO lab_orders(customer_id,qty) VALUES(99,1);",
          "23503",
          "lab_customer_fk",
        ],
        ["DELETE FROM lab_customers WHERE id=1;", "23001", "lab_customer_fk"],
      ])
        rejects(variant(orders, "ROLLBACK;", statement), state, name);
      rejects(
        variant(
          orders,
          "external_ref text UNIQUE",
          "external_ref text UNIQUE NULLS NOT DISTINCT",
        ),
        "23505",
      );
    });
    test("EXCLUDE: fasce contigue o su stanze diverse ammesse, sovrapposizione rifiutata", () => {
      assert.deepEqual(rows(bookings), ["1|2", "2|1"]);
      const overlap =
        "INSERT INTO lab_bookings VALUES (1,tstzrange('2026-06-01 10:30+00','2026-06-01 11:30+00','[)'));";
      rejects(
        variant(bookings, "ROLLBACK;", overlap),
        "23P01",
        "lab_no_overlap",
      );
    });
    test("Una FK inizialmente differita può fallire al COMMIT dopo un INSERT riuscito", () => {
      const r = rejects(
        "BEGIN; CREATE TEMP TABLE lab_parent(id int PRIMARY KEY); CREATE TEMP TABLE lab_child(id int REFERENCES lab_parent DEFERRABLE INITIALLY DEFERRED); INSERT INTO lab_child VALUES(42); SELECT 'inserita'; COMMIT;",
        "23503",
      );
      assert.equal(r.stdout.trim(), "inserita");
    });
  });
}
