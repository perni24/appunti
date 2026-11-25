import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

export function managementMemoCases({ run, flags, blocks, fixture }) {
  const memo = (name, count) =>
    blocks("PostgreSQL - " + name, count, "Promemoria/Pagine");
  const [roles, grants, defaults, policy, ada, teo, revoke] = memo(
    "Ruoli privilegi e RLS",
    7,
  );
  const prefix = [roles, grants, defaults, policy];
  const sql = (db, ...commands) =>
    run("psql", flags, commands.join("\n"), 0, {
      PGDATABASE: db,
    }).stdout.trim();
  function fails(db, state, ...commands) {
    const r = run(
      "psql",
      [...flags, "-v", "VERBOSITY=verbose"],
      commands.join("\n"),
      3,
      { PGDATABASE: db },
    );
    assert.match(r.stderr, new RegExp("\\b" + state + "\\b"));
  }
  const name = "psql backup e manutenzione";
  const [seed, verify, vacuum, analyze, size, activity] = memo(name, 6);
  const tree = parseNote(
    "Programmazione/PostgreSQL/Promemoria/Pagine/PostgreSQL - " + name + ".md",
  ).tree;
  const snippets = (lang) =>
    tree.children
      .filter((n) => n.type === "code" && n.lang === lang)
      .map((n) => n.value);
  const commands = snippets("powershell"),
    copies = snippets("text");
  assert.equal(commands.length, 10);
  assert.equal(copies.length, 1);
  function cli(i, input) {
    const [tool, ...args] = commands[i].split(/\s+/);
    assert.ok(
      ["createdb", "psql", "pg_dump", "pg_restore", "pg_dumpall"].includes(
        tool,
      ),
    );
    return run(tool, args, input);
  }
  describe("Promemoria Gestione", () => {
    test("Ruoli: visibilità di Ada e Teo, grant futuro, revoca e rollback", () => {
      const out = sql(
        "postgres",
        ...prefix,
        "SELECT row_security_active('memo_docs.documents');",
        ada,
        teo,
        revoke,
        "SELECT to_regnamespace('memo_docs') IS NULL, to_regrole('memo_doc_ada') IS NULL;",
      );
      assert.deepEqual(out.split(/\r?\n/), [
        "t",
        "Alfa",
        "memo_doc_ada|Bozza",
        "memo_doc_teo|Beta",
        "t|f",
        "f",
        "t|t",
      ]);
    });
    test("Con RLS l'update proprio riesce, la riga altrui è invisibile e il cambio autore è rifiutato", () => {
      assert.equal(
        sql(
          "postgres",
          ...prefix,
          "UPDATE memo_docs.documents SET title='OK' WHERE title='Alfa' RETURNING title;",
          "ROLLBACK;",
        ),
        "OK",
      );
      for (const stmt of [
        "INSERT INTO memo_docs.documents(author,title) VALUES ('memo_doc_teo','X');",
        "UPDATE memo_docs.documents SET author='memo_doc_teo' WHERE title='Alfa';",
        "DELETE FROM memo_docs.documents WHERE title='Alfa';",
      ])
        fails("postgres", "42501", ...prefix, stmt);
    });
    test("CSV client, restore custom e plain separati: dati, sequenza, vincoli e globali", () => {
      const src = "memo_ops_src",
        custom = "memo_ops_custom",
        plain = "memo_ops_plain";
      cli(0);
      cli(1, seed + "\n" + copies[0] + "\n");
      const read = (name) =>
        fs.readFileSync(path.join(fixture().root, name), "utf8");
      assert.deepEqual(read("memo_items.csv").trimEnd().split(/\r?\n/), [
        "sku,qty",
        "A,3",
        "B,4",
      ]);
      cli(2);
      assert.match(cli(3).stdout, /TABLE DATA public items/);
      cli(4);
      cli(5);
      cli(6);
      cli(7);
      cli(8);
      cli(9);
      const globals = read("memo_globals.sql");
      assert.match(globals, /CREATE ROLE vault_admin;/);
      assert.doesNotMatch(globals, /SCRAM-SHA-256\$|PASSWORD 'md5/i);
      for (const db of [custom, plain]) {
        assert.deepEqual(sql(db, verify).split(/\r?\n/), [db + "|2|7", "3"]);
        assert.equal(
          sql(
            db,
            "SELECT string_agg(sku || qty::text, ',' ORDER BY id) FROM public.items;",
          ),
          "A3,B4,C1",
        );
        fails(db, "23514", "INSERT INTO public.items(sku,qty) VALUES ('D',0);");
        fails(db, "23505", "INSERT INTO public.items(sku,qty) VALUES ('A',1);");
      }
      assert.equal(
        sql(src, "SELECT count(*), sum(qty) FROM public.items;"),
        "2|7",
      );
      sql(custom, vacuum);
      sql(custom, analyze);
      assert.equal(sql(custom, size).split("|").length, 2);
      assert.match(sql(custom, activity), /vault_admin\|active\|[1-9]\d*/);
    });
  });
}
