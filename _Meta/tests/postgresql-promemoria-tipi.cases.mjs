import assert from "node:assert/strict";
import { describe, test } from "node:test";

export function typeMemoCases({ run, flags, blocks }) {
  const memo = (name, count) =>
    blocks("PostgreSQL - " + name, count, "Promemoria/Pagine");
  const args = [...flags, "-P", "null=<NULL>"];
  function rows(...queries) {
    const out = run("psql", args, queries.join("\n")).stdout.trimEnd();
    return out ? out.split(/\r?\n/) : [];
  }
  describe("Promemoria Tipi e funzioni", () => {
    test("Tipi: conversione, NULL, tre stati booleani e identificatori", () => {
      const [cast, fallback, flags, ids] = memo("Tipi cast e NULL", 4);
      assert.deepEqual(rows(cast, fallback, flags, ids), [
        "42|42|12.35|2026-07-30|bigint",
        "|anon|<NULL>|t|t",
        "t|t|f|f",
        "f|f|t|t",
        "<NULL>|f|f|t",
        "1|uuid|t",
      ]);
      const invalid = run(
        "psql",
        args,
        "\\set VERBOSITY verbose\n" + cast.replace("'42'", "'abc'"),
        3,
      );
      assert.match(invalid.stderr, /\b22P02\b/);
    });
    test("Testo: NULL nella concatenazione, jolly letterale, gruppi e zero righe", () => {
      const [compose, split, like, first, all, replace, tokens] = memo(
        "Stringhe e regex",
        7,
      );
      assert.deepEqual(
        rows(compose, split, like, first, all, replace, tokens),
        [
          "<NULL>|AdaL.|Ada L.|User Ada (7)",
          "b|{a,b,c}|a/b/c",
          "t|t|t|f|t",
          "{12}|<NULL>",
          "12",
          "34",
          "uno due tre",
          "rosso",
          "verde",
          "blu",
        ],
      );
      assert.deepEqual(rows(all.replace("A12 B34", "abc")), []);
    });
    test("Tempo: due fusi, giorno di 23 ore con limite escluso e serie di date", () => {
      const [clock, zone, calc, trunc, bounds, format, series] = memo(
        "Date ore e intervalli",
        7,
      );
      for (const tz of ["UTC", "America/New_York"]) {
        const settings =
          "SET TIME ZONE '" +
          tz +
          "'; SET DateStyle = 'ISO, YMD'; SET IntervalStyle = 'postgres';";
        const [now] = rows(settings, clock);
        const [date, time, transaction, statement, wall] = now.split("|");
        assert.equal(date, transaction.slice(0, 10));
        assert.equal(time, transaction.slice(11));
        for (const t of [transaction, statement, wall])
          assert.ok(Number.isFinite(Date.parse(t)), t);
        assert.deepEqual(
          rows(settings, zone, calc, trunc, bounds, format, series),
          [
            "t|2026-07-30 12:30:00",
            "2026-08-06|2026-07-30 12:00:00|5400.000000|1 mon",
            "2026-07-30 12:00:00|2026-07-30|2026-07-01|2026|7",
            "1|23:00:00",
            "2|23:00:00",
            "30/07/2026 12:30|2026-07-30|2026-07-30 10:30:00",
            "2026-07-30",
            "2026-07-31",
            "2026-08-01",
          ],
        );
      }
    });
    test("JSONB e array: estrazione, chiavi, percorso mancante, ordini e indice GIN", () => {
      const [
        build,
        read,
        contains,
        edit,
        items,
        keys,
        tags,
        empty,
        unnest,
        gin,
      ] = memo("JSONB e array", 10);
      const objects = (sql) =>
        rows(sql)[0]
          .split("|")
          .map((x) => JSON.parse(x));
      assert.deepEqual(objects(build), [
        { ids: [1, 2] },
        [
          { id: 1, name: "Ada" },
          { id: 2, name: "Teo" },
        ],
      ]);
      assert.deepEqual(rows(read, contains), [
        't|t|t|00100|"sql"',
        "t|f|t|t|f",
      ]);
      assert.deepEqual(objects(edit), [
        { address: { zip: "00100", city: "Roma" }, tmp: 0 },
        { address: { city: "Roma" } },
        {},
      ]);
      assert.deepEqual(rows(items, keys, tags, empty, unnest), [
        '1|"sql"',
        '2|"web"',
        "a|1",
        "b|2",
        "sql|2|{sql,web,api}|{sql}|t|t|t",
        "0|<NULL>",
        "1|sql",
        "2|web",
      ]);
      assert.deepEqual(
        rows(gin, "SELECT to_regclass('pg_temp.lab_docs') IS NULL;"),
        ["t"],
      );
      const inspect =
        "SELECT amname FROM pg_class c JOIN pg_am a ON a.oid = c.relam WHERE c.oid = 'pg_temp.lab_docs_gin'::regclass;";
      assert.deepEqual(
        rows(gin.replace("ROLLBACK;", inspect + "\nROLLBACK;")),
        ["gin"],
      );
    });
  });
}
