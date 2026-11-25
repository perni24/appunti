import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { before, describe, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

export function setupCases({ run, flags, blocks, paths }) {
  const [identity] = blocks("Installazione e Inizializzazione", 1);
  const [settings, local, rules] = blocks("Configurazione", 3);
  const grants = blocks("Gestione Utenti e Ruoli", 3);
  const [sample] = blocks("Comandi psql e Meta-comandi", 1);
  const [info, describeRelation, csv] = parseNote(
    "Programmazione/PostgreSQL/Pagine/Comandi psql e Meta-comandi.md",
  )
    .tree.children.filter((n) => n.type === "code" && n.lang === "text")
    .map((n) => n.value);
  const [schemas, compare] = blocks("Schemi e Search Path", 2);
  const db = { PGDATABASE: "app_db" };
  const query = (s, extras = {}) =>
    run("psql", flags, s, 0, { ...db, ...extras }).stdout.trim();
  describe("Setup e Amministrazione Base", () => {
    before(() => {
      run("createdb", ["app_db"]);
    });
    test("Un cluster inizializzato può essere già attivo; createdb crea solo il database", () => {
      assert.match(run("psql", ["--version"]).stdout, /18\./);
      run("pg_ctl", ["status", "-D", paths().data]);
      assert.match(query(identity), /^app_db\|vault_admin\|18\./);
      assert.equal(
        query(
          "SELECT count(*) FROM pg_database WHERE datname IN ('postgres','template0','template1','app_db');",
        ),
        "4",
      );
    });
    test("Contesti del parametro, SET LOCAL con ripristino e regole HBA valide", () => {
      const values = query(settings)
        .split(/\r?\n/)
        .map((s) => s.split("|"));
      assert.deepEqual(
        values.map((row) => [row[0], row[4]]),
        [
          ["listen_addresses", "postmaster"],
          ["shared_buffers", "postmaster"],
          ["statement_timeout", "user"],
          ["work_mem", "user"],
        ],
      );
      const limits = query(local).split(/\r?\n/);
      assert.deepEqual(limits, ["10s", "2s", "10s"]);
      assert.equal(query(rules), "");
      assert.equal(query("SELECT pg_reload_conf();"), "t");
    });
    test("Un reload segnala il riavvio richiesto senza cambiare l'indirizzo attivo", () => {
      // Sample the same backend before and after each asynchronous reload.
      const samples = ("SELECT pg_sleep(0.1);\n" + settings + "\n").repeat(12);
      try {
        const out = query(
          "ALTER SYSTEM SET listen_addresses = 'localhost';\nSELECT pg_reload_conf();\n" +
            samples +
            "\\echo RESETTING\nALTER SYSTEM RESET listen_addresses;\nSELECT pg_reload_conf();\n" +
            samples,
        );
        const phases = out.split("RESETTING");
        assert.equal(phases.length, 2);
        for (const [i, phase] of phases.entries()) {
          const rows = phase
            .split(/\r?\n/)
            .filter((s) => s.startsWith("listen_addresses|"))
            .map((s) => s.split("|"));
          assert.equal(rows.length, 12);
          assert.ok(rows.every((r) => r[1] === "127.0.0.1"));
          assert.equal(
            rows.at(-1)[5],
            i === 0 ? "t" : "f",
            rows.at(-1).join("|"),
          );
        }
      } finally {
        query("ALTER SYSTEM RESET listen_addresses;");
        query("SELECT pg_reload_conf();");
      }
    });
    test("Un default di ruolo richiede un nuovo login, non SET ROLE", () => {
      const password = randomBytes(24).toString("hex");
      query(
        "CREATE ROLE app_user LOGIN PASSWORD '" +
          password +
          "'; ALTER ROLE app_user SET statement_timeout='30s';",
      );
      assert.equal(query("SET ROLE app_user; SHOW statement_timeout;"), "10s");
      const login = { PGUSER: "app_user", PGPASSWORD: password, PGOPTIONS: "" };
      assert.equal(query("SHOW statement_timeout;", login), "30s");
      query("ALTER ROLE app_user RESET statement_timeout;");
      assert.equal(query("SHOW statement_timeout;", login), "0");
    });
    test("Grant per tabelle presenti e future del creatore, non per oggetti di altri owner", () => {
      assert.equal(query(grants.join("\n")), "t|t|t|f");
      const fixture = grants.slice(0, 2).join("\n");
      assert.deepEqual(
        query(
          fixture +
            "\nCREATE TABLE lab_reports.other_creator(id int);\nSELECT has_table_privilege('lab_analyst','lab_reports.other_creator','SELECT');\nSET LOCAL ROLE lab_analyst;\nSELECT count(*) FROM lab_reports.tomorrow;\nROLLBACK;",
        ).split(/\r?\n/),
        ["f", "0"],
      );
      const denied = run(
        "psql",
        flags,
        "\\set VERBOSITY verbose\n" +
          fixture +
          "\nSET LOCAL ROLE lab_analyst;\nINSERT INTO lab_reports.today VALUES (1);",
        3,
        db,
      );
      assert.match(denied.stderr, /42501/);
      assert.equal(query("SELECT to_regrole('lab_analyst') IS NULL;"), "t");
    });
    test("psql distingue metadati e SQL; copy verso stdout produce CSV", () => {
      assert.match(query(info + "\n"), /app_db/);
      assert.match(query(describeRelation + "\n"), /relname/);
      assert.deepEqual(query(csv + "\n").split(/\r?\n/), ["id,nome", "1,Ada"]);
      assert.equal(query(sample), "app_db|vault_admin");
    });
    test("psql -1 e ON_ERROR_STOP: successo oppure exit 3 senza risultati parziali", () => {
      const file = path.join(paths().root, "controllo.sql");
      const args = [...flags, "-1", "-f", file];
      fs.writeFileSync(file, sample + "\n");
      assert.equal(
        run("psql", args, undefined, 0, db).stdout.trim(),
        "app_db|vault_admin",
      );
      fs.writeFileSync(
        file,
        "CREATE TABLE lab_before_error(id integer);\nSELECT 1/0;\n",
      );
      run("psql", args, undefined, 3, db);
      assert.equal(
        query("SELECT to_regclass('public.lab_before_error') IS NULL;"),
        "t",
      );
    });
    test("Lo schema effettivo non è il testo del search_path; il nome qualificato resta stabile", () => {
      const [database, config, current, effective] = query(schemas).split("|");
      assert.equal(database, "app_db");
      assert.match(config, /\$user/);
      assert.equal(current, "public");
      assert.match(effective, /pg_catalog/);
      assert.deepEqual(query(compare).split(/\r?\n/), ["10", "20", "10"]);
      assert.equal(
        query(
          "SELECT to_regnamespace('lab_vendite') IS NULL AND to_regnamespace('lab_archivio') IS NULL;",
        ),
        "t",
      );
    });
  });
}
