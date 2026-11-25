import assert from "node:assert/strict";
import { describe, test } from "node:test";

export function advancedCases({ run, flags, blocks }) {
  const [totals, tree] = blocks(
    "Common Table Expressions e Recursive Queries",
    2,
  );
  const [frames, ranks, last] = blocks("Window Functions", 3);
  const [latest, tags] = blocks("LATERAL JOIN", 2);
  const [pref, sync] = blocks("UPSERT con ON CONFLICT", 2);
  const [job, done] = blocks("RETURNING", 2);
  const [views, refresh] = blocks("Views e Materialized Views", 2);
  const [docs, search] = blocks("Full Text Search", 2);
  const args = [...flags, "-P", "null=<NULL>"];
  function rows(...queries) {
    const output = run("psql", args, queries.join("\n")).stdout.trim();
    return output ? output.split(/\r?\n/) : [];
  }
  function rejects(sql, state) {
    const r = run("psql", args, "\\set VERBOSITY verbose\n" + sql, 3);
    assert.match(r.stderr, new RegExp("\\b" + state + "\\b"));
  }
  function replace(sql, phrase, other) {
    assert.equal(sql.split(phrase).length, 2, phrase);
    return sql.replace(phrase, other);
  }
  describe("SQL Avanzato", () => {
    test("CTE: aggregazione e riga di chiusura del ciclo", () => {
      assert.deepEqual(rows(totals), ["1|110"]);
      assert.deepEqual(rows(tree), ["1|0|f", "2|1|f", "3|1|f", "1|2|t"]);
    });
    test("CYCLE distingue due percorsi verso lo stesso nodo da un ritorno sul percorso", () => {
      const dag = replace(tree, "(2, 1)", "(2, 4), (3, 4)");
      assert.deepEqual(rows(dag), [
        "1|0|f",
        "2|1|f",
        "3|1|f",
        "4|2|f",
        "4|2|f",
      ]);
    });
    test("Finestre: cumulativo con pari data, percentuale e confini di last_value", () => {
      assert.deepEqual(rows(frames), [
        "1|12|5|25.0|<NULL>",
        "2|12|12|35.0|5",
        "3|20|20|40.0|7",
      ]);
      assert.deepEqual(rows(last), ["1|A|C", "2|B|C", "3|C|C"]);
    });
    test("Finestre: parità mantenuta nel rango, spareggio nel numero di riga", () => {
      assert.deepEqual(rows(ranks), ["1|1|1|1", "2|1|1|2", "3|3|2|3"]);
      for (const [cond, count] of [
        ["place = 1", 2],
        ["seq = 1", 1],
      ]) {
        assert.equal(
          rows(
            replace(
              ranks,
              "FROM ranked ORDER",
              "FROM ranked WHERE " + cond + " ORDER",
            ),
          ).length,
          count,
        );
      }
    });
    test("LATERAL: ultimo ordine a pari data, cliente assente e array vuoto", () => {
      assert.deepEqual(rows(latest), ["1|11", "2|<NULL>"]);
      assert.deepEqual(
        rows(
          replace(replace(latest, "LEFT JOIN", "CROSS JOIN"), " ON true", ""),
        ),
        ["1|11"],
      );
      assert.deepEqual(rows(tags), ["1|sql|1", "1|db|2", "2|<NULL>|<NULL>"]);
    });
    test("UPSERT: inserimento nullo, aggiornamento, replica invariata e DO NOTHING", () => {
      assert.deepEqual(rows(pref, sync), [
        "theme|<NULL>",
        "theme|dark",
        "theme|dark",
      ]);
      assert.deepEqual(
        rows(
          pref,
          "INSERT INTO lab_settings VALUES ('theme',NULL) ON CONFLICT (key) DO UPDATE SET value=excluded.value WHERE lab_settings.value IS DISTINCT FROM excluded.value RETURNING key;",
        ),
        ["theme|<NULL>"],
      );
    });
    test("UPSERT: proposte duplicate e arbitro non univoco hanno errori distinti", () => {
      rejects(
        pref +
          "\nINSERT INTO lab_settings VALUES ('theme','a'),('theme','b') ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value;",
        "21000",
      );
      rejects(replace(pref, "key text PRIMARY KEY", "key text"), "42P10");
    });
    test("RETURNING: default, old/new, nessun match, CTE sul DELETE e rollback", () => {
      assert.deepEqual(
        rows(job, done, "SELECT to_regclass('pg_temp.lab_jobs') IS NULL;"),
        ["1|queued", "1|queued|done", "done|1", "t"],
      );
      assert.deepEqual(
        rows(
          job,
          "UPDATE lab_jobs SET state=state RETURNING old.state,new.state;",
        ),
        ["1|queued", "1|queued|done", "done|done"],
      );
    });
    test("Viste: report corrente, copia obsoleta e riallineamento concorrente", () => {
      assert.deepEqual(
        rows(
          views,
          refresh,
          "SELECT to_regnamespace('lab_view_demo') IS NULL;",
        ),
        ["17|10", "17|17", "t"],
      );
    });
    test("Refresh: un indice unico parziale non basta; WITH NO DATA richiede un primo popolamento", () => {
      const cmd =
        "REFRESH MATERIALIZED VIEW CONCURRENTLY lab_view_demo.daily_cache;";
      rejects(
        replace(views, "(day);", "(day) WHERE day IS NOT NULL;") + "\n" + cmd,
        "55000",
      );
      const empty = replace(
        views,
        "FROM lab_view_demo.daily;",
        "FROM lab_view_demo.daily WITH NO DATA;",
      );
      rejects(empty + "\nSELECT * FROM lab_view_demo.daily_cache;", "55000");
      assert.deepEqual(
        rows(
          empty,
          "REFRESH MATERIALIZED VIEW lab_view_demo.daily_cache;",
          cmd,
          "SELECT total FROM lab_view_demo.daily_cache; ROLLBACK;",
        ),
        ["10"],
      );
    });
    test("Full text: stemming italiano, ranking sul titolo ed estratti da titolo o corpo", () => {
      assert.deepEqual(rows(docs, search), [
        "1|Stampanti|[Stampanti]",
        "2|Manuale|Controllare la [stampante]",
      ]);
    });
    test("Full text: il vettore generato segue le modifiche, una stop word non trova documenti", () => {
      assert.deepEqual(
        rows(docs, "UPDATE lab_docs SET title='Cavi' WHERE id=1;", search),
        ["2|Manuale|Controllare la [stampante]"],
      );
      assert.deepEqual(rows(docs, replace(search, "'stampante'", "'la'")), []);
    });
  });
}
