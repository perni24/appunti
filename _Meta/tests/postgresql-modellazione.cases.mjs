import assert from "node:assert/strict";
import { describe, test } from "node:test";

export function modelCases({ run, flags, blocks }) {
  const order = blocks("Normalizzazione", 2);
  const catalog = blocks("Chiavi primarie e foreign key", 2);
  const clubs = blocks("Relazioni 1 a 1 1 a N e N a N", 2);
  const [zone, invoices, report] = blocks(
    "Tipi numerici testuali e temporali",
    3,
  );
  const args = [...flags, "-P", "null=<NULL>"];
  const rows = (...sql) =>
    run("psql", args, sql.join("\n")).stdout.trim().split(/\r?\n/);
  function rejects(setup, statement, state) {
    const r = run(
      "psql",
      args,
      ["\\set VERBOSITY verbose", setup, statement].join("\n"),
      3,
    );
    assert.match(r.stderr, new RegExp("\\b" + state + "\\b"));
  }
  describe("Modellazione Dati", () => {
    test("Stesso prodotto su due righe: il nuovo listino non cambia il prezzo pattuito", () => {
      assert.deepEqual(rows(...order), [
        "1|Ada|A|20.00|12.00",
        "2|Ada|A|8.00|12.00",
      ]);
      rejects(
        order[0],
        "INSERT INTO lab_order_lines VALUES (42,1,'A',1,9);",
        "23505",
      );
    });
    test("Catalogo: stessa SKU in due negozi, vendite ripetute e articolo invenduto", () => {
      assert.deepEqual(rows(...catalog), ["1|A|Lampada|2", "2|A|Cavo|0"]);
      rejects(
        catalog[0],
        "INSERT INTO lab_sales(shop_id,sku) VALUES (3,'A');",
        "23503",
      );
      rejects(catalog[0], "DELETE FROM lab_catalog WHERE shop_id=1;", "23001");
    });
    test("FK composta facoltativa: MATCH FULL rifiuta la coppia parziale, SIMPLE la ammette", () => {
      const optional = (mode) =>
        catalog[0] +
        "\nCREATE TEMP TABLE lab_optional (shop_id int, sku text, FOREIGN KEY (shop_id,sku) REFERENCES lab_catalog MATCH " +
        mode +
        ");";
      const partial = "INSERT INTO lab_optional VALUES (1,NULL);";
      assert.deepEqual(
        rows(optional("SIMPLE"), partial, "SELECT count(*) FROM lab_optional;"),
        ["1"],
      );
      assert.deepEqual(
        rows(
          optional("FULL"),
          "INSERT INTO lab_optional VALUES (NULL,NULL),(1,'A'); SELECT count(*) FROM lab_optional;",
        ),
        ["2"],
      );
      rejects(optional("FULL"), partial, "23503");
    });
    test("Cardinalità: socio senza figli, due incarichi e due iscrizioni non diventano quattro", () => {
      assert.deepEqual(rows(...clubs), [
        "Ada|ada1|2|2",
        "Lia|<NULL>|0|1",
        "Teo|<NULL>|0|0",
      ]);
      rejects(
        clubs[0],
        "INSERT INTO lab_profiles VALUES (1,'altro');",
        "23505",
      );
      rejects(
        clubs[0],
        "INSERT INTO lab_memberships VALUES (1,7,DATE '2026-06-01');",
        "23505",
      );
      rejects(clubs[0], "INSERT INTO lab_tasks VALUES (12,NULL);", "23502");
    });
    test("Un incarico protegge il socio, CASCADE elimina soltanto le righe dipendenti", () => {
      rejects(clubs[0], "DELETE FROM lab_members WHERE id=1;", "23001");
      assert.deepEqual(
        rows(
          clubs[0],
          "DELETE FROM lab_tasks WHERE member_id=1; DELETE FROM lab_members WHERE id=1; SELECT (SELECT count(*) FROM lab_profiles), (SELECT count(*) FROM lab_memberships), (SELECT count(*) FROM lab_clubs);",
        ),
        ["0|1|2"],
      );
    });
    test("AT TIME ZONE nei due sensi non dipende dal fuso della sessione", () => {
      for (const tz of ["UTC", "America/New_York"]) {
        assert.deepEqual(rows("SET TIME ZONE '" + tz + "';", zone), [
          "t|2026-07-01 10:00:00",
        ]);
      }
    });
    test("Fatture: ultimo giorno utile incluso, arrotondamento e totali di emissione", () => {
      assert.deepEqual(rows(invoices, report), [
        "A|20.00",
        "2026-05-01|50.00",
        "2026-06-01|10.00",
      ]);
    });
    test("Limiti di tipo: overflow dopo arrotondamento e troncamento solo su cast esplicito", () => {
      rejects("", "SELECT 999.995::numeric(5,2);", "22003");
      const labels = "CREATE TEMP TABLE lab_labels(code varchar(3));";
      rejects(labels, "INSERT INTO lab_labels VALUES ('ABCDE');", "22001");
      assert.deepEqual(
        rows(
          labels,
          "INSERT INTO lab_labels VALUES ('ABCDE'::varchar(3)) RETURNING code;",
        ),
        ["ABC"],
      );
    });
  });
}
