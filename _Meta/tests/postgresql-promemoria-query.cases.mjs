import assert from "node:assert/strict";
import { describe, test } from "node:test";

export function queryMemoCases({ run, flags, blocks }) {
  const memo = (name, count) =>
    blocks("PostgreSQL - " + name, count, "Promemoria/Pagine");
  function rows(...commands) {
    const result = run(
      "psql",
      [...flags, "-P", "null=<NULL>"],
      commands.join("\n"),
    ).stdout.trim();
    return result ? result.split(/\r?\n/) : [];
  }

  describe("Promemoria Query", () => {
    test("SELECT: estremi, NULL, pagine e prima riga a parità di punteggio", () => {
      const [setup, filter, sort, offset, keyset, distinct, first, level] =
        memo("SELECT e filtri", 8);
      assert.deepEqual(rows(setup, filter), ["1|Ada", "2|Ida", "4|Lia"]);
      assert.deepEqual(rows(setup, sort), ["1|90", "2|90", "4|60", "3|<NULL>"]);
      for (const page of [offset, keyset])
        assert.deepEqual(rows(setup, page), ["3|Teo", "4|Lia"]);
      assert.deepEqual(rows(setup, distinct, first), [
        "A",
        "B",
        "A|Ada|90",
        "B|Lia|60",
      ]);
      assert.deepEqual(rows(setup, level), [
        "1|high",
        "2|high",
        "3|unknown",
        "4|medium",
      ]);
    });
    test("Scritture: RETURNING, conflitto aggiornato o saltato, archivio e rollback", () => {
      const [
        setup,
        insert,
        many,
        peek,
        update,
        from,
        upsert,
        skip,
        archive,
        using,
        del,
        rollback,
      ] = memo("INSERT UPDATE DELETE e UPSERT", 12);
      assert.deepEqual(
        rows(
          setup,
          insert,
          many,
          peek,
          update,
          from,
          upsert,
          skip,
          archive,
          using,
          del,
          "TABLE pg_temp.lab_items; TABLE pg_temp.lab_archive;",
          rollback,
          "SELECT to_regclass('pg_temp.lab_items') IS NULL;",
        ),
        [
          "1",
          "1|pen",
          "1|pencil",
          "2|notebook",
          "2|diary",
          "3",
          "1",
          "2|diary",
          "3|box",
          "t",
        ],
      );
    });
    test("JOIN: zero ordini aperti, assenza totale e ultimo ordine a data uguale", () => {
      const [setup, inner, left, anti, lateral, self] = memo("JOIN", 6);
      assert.deepEqual(rows(setup, inner, left), [
        "Ada|10",
        "Ada|11",
        "Teo|12",
        "Ada|2",
        "Teo|0",
        "Lia|0",
      ]);
      assert.deepEqual(rows(setup, anti, lateral, self), [
        "Lia",
        "Ada|11",
        "Teo|12",
        "Lia|<NULL>",
        "Ada|<NULL>",
        "Teo|Ada",
        "Lia|Ada",
      ]);
    });
    test("Aggregati: conteggi, insieme vuoto, ordine interno di liste e subtotali", () => {
      const [setup, totals, filter, lists, groups] = memo("Aggregazioni", 5);
      assert.deepEqual(
        rows(setup, totals)[0].split("|").map(Number),
        [4, 2, 2, 30, 15, 10, 20],
      );
      assert.deepEqual(rows(setup, "TRUNCATE pg_temp.lab_sales;", totals), [
        "0|0|0|<NULL>|<NULL>|<NULL>|<NULL>",
      ]);
      assert.deepEqual(rows(setup, filter), ["A|3|2"]);
      const result = rows(setup, lists).map((r) => r.split("|"));
      assert.deepEqual(
        result.map((r) => r.slice(0, 3)),
        [
          ["A", "paid, open, paid", "{1,2,3}"],
          ["B", "open", "{4}"],
        ],
      );
      assert.deepEqual(
        result.map((r) => JSON.parse(r[3])),
        [
          [
            { id: 1, amount: 20 },
            { id: 2, amount: null },
            { id: 3, amount: 10 },
          ],
          [{ id: 4, amount: null }],
        ],
      );
      assert.deepEqual(rows(setup, groups), [
        "A|open|0|<NULL>",
        "A|paid|0|30",
        "B|open|0|<NULL>",
        "A|<NULL>|1|30",
        "B|<NULL>|1|<NULL>",
        "<NULL>|<NULL>|3|30",
      ]);
    });
    test("CTE: zero ordini, profondità, multinsiemi e scrittura annullata", () => {
      const [totals, scalar, tree, sets, removed] = memo(
        "CTE subquery e insiemi",
        5,
      );
      assert.deepEqual(rows(totals, scalar, tree), [
        "1|50",
        "1|2|t",
        "2|0|f",
        "1|0",
        "2|1",
        "3|2",
      ]);
      for (const [op, expected] of [
        ["UNION", ["1", "2", "3"]],
        ["UNION ALL", ["1", "1", "2", "2", "3"]],
        ["INTERSECT", ["2"]],
        ["EXCEPT", ["1"]],
      ])
        assert.deepEqual(
          rows(sets.replace(" UNION ", " " + op + " ")),
          expected,
        );
      assert.deepEqual(
        rows(removed, "SELECT to_regclass('pg_temp.lab_sessions') IS NULL;"),
        ["1", "t"],
      );
    });
    test("Finestre: ranghi con pareggi, frame, reset del progressivo e ultimo per conto", () => {
      const [setup, rank, sum, adjacent, latest] = memo("Window functions", 5);
      assert.deepEqual(rows(setup, rank, sum), [
        "1|1|1|1",
        "2|2|1|1",
        "4|3|3|2",
        "3|4|4|3",
        "1|25|10",
        "2|25|20",
        "3|25|25",
        "4|7|7",
      ]);
      assert.deepEqual(rows(setup, adjacent, latest), [
        "1|<NULL>|10|10|5",
        "2|10|5|10|5",
        "3|10|<NULL>|10|5",
        "4|<NULL>|<NULL>|7|7",
        "A|3",
        "B|4",
      ]);
    });
  });
}
