import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { before, describe, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { parseNote } from "../../site/scripts/vault.mjs";

function snippets(note, lang) {
  return parseNote("Programmazione/PostgreSQL/Pagine/" + note + ".md")
    .tree.children.filter((n) => n.type === "code" && n.lang === lang)
    .map((n) => n.value);
}
export function operationsCases({
  run,
  flags,
  blocks,
  freePort,
  startServer,
  fixture,
}) {
  const db = "lab_ops",
    src = "lab_backup_src",
    dst = "lab_backup_dst";
  const sql = (q, database = db, port = {}) =>
    run("psql", flags, q, 0, { PGDATABASE: database, ...port }).stdout.trim();
  const lines = (s) => s.split(/\r?\n/).filter(Boolean);
  function fails(q, state, database = db) {
    const r = run("psql", [...flags, "-v", "VERBOSITY=verbose"], q, 3, {
      PGDATABASE: database,
    });
    assert.match(r.stderr, new RegExp("\\b" + state + "\\b"));
  }
  const [seed, check] = blocks("Backup e Ripristino", 2);
  const commands = snippets("Backup e Ripristino", "bash");
  assert.equal(commands.length, 6);
  function cmd(i) {
    const [tool, ...args] = commands[i].split(/\s+/);
    assert.ok(
      ["createdb", "pg_dump", "pg_restore", "pg_dumpall"].includes(tool),
    );
    return run(tool, args);
  }
  const [orders, add, invalid, correct, validate, status, index, indexStatus] =
    blocks("Migrazioni schema", 8);
  const [ledger, apply, current] = blocks("Versionamento database", 3);
  const [expand, dual, batch, diff, constraints, newWriter, contract] = blocks(
    "Strategie zero-downtime",
    7,
  );
  describe("Backup, migrazioni e operatività", () => {
    before(() => run("createdb", [db]));
    test("Dump custom: archivio, dati precedenti, sequenza, vincolo e oggetti globali", () => {
      cmd(0);
      sql(seed, src);
      cmd(1);
      const list = cmd(2).stdout;
      for (const pattern of [
        /TABLE DATA public orders/,
        /SEQUENCE SET public orders_id_seq/,
        /CONSTRAINT public orders orders_pkey/,
      ])
        assert.match(list, pattern);
      sql("UPDATE public.orders SET amount=90 WHERE id=1;", src);
      cmd(3);
      cmd(4);
      assert.deepEqual(lines(sql(check, dst)), ["2|40", "3"]);
      assert.equal(sql("SELECT sum(amount) FROM public.orders;", src), "115");
      fails("INSERT INTO public.orders (amount) VALUES (0);", "23514", dst);
      cmd(5);
      const globals = fs.readFileSync(
        path.join(fixture().root, "globals.sql"),
        "utf8",
      );
      assert.ok(globals.includes("CREATE ROLE vault_admin;"));
      assert.ok(!globals.includes("SCRAM-SHA-256$"));
    });
    test("Dump plain riletto da psql e directory parallela riletta da pg_restore", () => {
      const sourceDb = "lab_formats_src";
      run("createdb", [sourceDb]);
      sql(seed, sourceDb);
      for (const [format, database] of [
        ["plain", "lab_plain"],
        ["directory", "lab_directory"],
      ]) {
        run("createdb", ["--template=template0", database]);
        const file = "lab_" + format;
        run("pg_dump", [
          "--format=" + format,
          "--file=" + file,
          ...(format === "directory" ? ["-j", "2"] : []),
          sourceDb,
        ]);
        if (format === "plain")
          run("psql", [...flags, "-d", database, "-f", file]);
        else
          run("pg_restore", [
            "--exit-on-error",
            "-j",
            "2",
            "-d",
            database,
            file,
          ]);
        assert.equal(
          sql("SELECT count(*),sum(amount) FROM public.orders;", database),
          "2|40",
        );
      }
    });
    test("NOT VALID protegge le nuove righe prima della validazione dello storico", () => {
      sql(orders);
      sql(add);
      assert.equal(sql(status), "f");
      fails("INSERT INTO lab_mig_orders VALUES (3,-2);", "23514");
      assert.equal(sql(invalid), "2|-5");
      fails(validate, "23514");
      assert.equal(sql(status), "f");
      sql(correct);
      sql(validate);
      assert.equal(sql(status), "t");
    });
    test("L'indice concorrente richiede uno statement fuori da BEGIN", () => {
      const indexDb = "lab_index_ops";
      run("createdb", [indexDb]);
      sql(orders, indexDb);
      fails("BEGIN;\n" + index, "25001", indexDb);
      sql(index, indexDb);
      assert.equal(sql(indexStatus, indexDb), "t|t");
    });
    test("Versionamento: DDL e registrazione falliscono o riescono insieme", () => {
      sql(ledger);
      sql(apply);
      assert.equal(sql(current), "1|account timezone|timezone");
      fails(
        "BEGIN; ALTER TABLE lab_accounts ADD COLUMN nickname text; INSERT INTO lab_schema_history(version,description) VALUES (1,'duplicate'); COMMIT;",
        "23505",
      );
      assert.equal(
        sql(
          "SELECT count(*) FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='lab_accounts' AND column_name='nickname';",
        ),
        "0",
      );
      assert.equal(sql("SELECT count(*) FROM lab_schema_history;"), "1");
    });
    test("Expand-contract: batch ripetibili e valore non nullo rimasto obsoleto", () => {
      sql(expand);
      sql(dual);
      assert.equal(sql(diff), "2");
      assert.deepEqual(lines(sql(batch)).sort(), ["2", "3"]);
      assert.equal(sql(batch), "");
      assert.equal(sql(diff), "0");
      // Un vecchio scrittore aggiorna unicamente il campo originario.
      sql(
        "UPDATE lab_contacts SET email='modificato@example.test' WHERE id=2; INSERT INTO lab_contacts(id,email) VALUES(4,'q@example.test'),(5,'r@example.test');",
      );
      assert.equal(sql(diff), "3");
      assert.equal(
        sql(
          "SELECT count(*) FROM lab_contacts WHERE notification_email IS NULL;",
        ),
        "2",
      );
      assert.deepEqual(lines(sql(batch)).sort(), ["2", "4"]);
      assert.deepEqual(lines(sql(batch)), ["5"]);
      assert.equal(sql(batch), "");
      assert.equal(sql(diff), "0");
      assert.equal(
        sql("SELECT email=notification_email FROM lab_contacts WHERE id=2;"),
        "t",
      );
      sql(constraints);
      sql(dual);
      sql(newWriter);
      sql(contract);
      assert.equal(
        sql("SELECT notification_email FROM lab_contacts WHERE id=6;"),
        "sei@example.test",
      );
      fails("SELECT email FROM lab_contacts;", "42703");
      fails("INSERT INTO lab_contacts (id) VALUES (7);", "23502");
    });
    test("PITR: base backup verificato, target nominato raggiunto e cancellazione esclusa", async () => {
      const { root, env } = fixture();
      const origin = path.join(root, "pitr-origin"),
        base = path.join(root, "pitr-base"),
        recovered = path.join(root, "pitr-recovered");
      const archive = path.join(root, "pitr-archive");
      fs.mkdirSync(archive);
      const pass = path.join(root, "pitr-init.pass");
      fs.writeFileSync(pass, env.PGPASSWORD + "\n", { mode: 0o600 });
      const source = { PGPORT: String(await freePort()) };
      const settings = (dir, s) =>
        fs.appendFileSync(
          path.join(dir, "postgresql.auto.conf"),
          "\n" + s + "\n",
        );
      const stop = (dir) => {
        if (fs.existsSync(path.join(dir, "postmaster.pid")))
          run("pg_ctl", ["-D", dir, "-w", "-m", "fast", "stop"]);
      };
      const q = (s, port) => sql(s, "postgres", port);
      const read = "SELECT count(*) FROM lab_pitr_orders WHERE id=42;";
      const wait = async (check, label) => {
        for (let i = 0; i < 120; i++) {
          if (check()) return;
          await delay(100);
        }
        assert.fail(label);
      };
      try {
        try {
          run("initdb", [
            "-D",
            origin,
            "-U",
            env.PGUSER,
            "--auth=scram-sha-256",
            "--pwfile",
            pass,
            "--locale=C",
            "-E",
            "UTF8",
          ]);
        } finally {
          fs.unlinkSync(pass);
        }
        settings(
          origin,
          [
            "listen_addresses='127.0.0.1'",
            "unix_socket_directories=''",
            "port=" + source.PGPORT,
            "archive_mode=on",
            "archive_library='basic_archive'",
            "basic_archive.archive_directory='../pitr-archive'",
            "logging_collector=off",
          ].join("\n"),
        );
        startServer(origin);
        q("CREATE TABLE lab_pitr_orders(id integer PRIMARY KEY);", source);
        run(
          "pg_basebackup",
          ["-w", "-D", base, "-X", "stream", "--checkpoint=fast"],
          undefined,
          0,
          source,
        );
        run("pg_verifybackup", [base]);
        q("INSERT INTO lab_pitr_orders VALUES(42);", source);
        const segment = q(
          "SELECT pg_walfile_name(pg_create_restore_point('lab_prima_cancellazione'));",
          source,
        );
        assert.match(segment, /^[A-F0-9]{24}$/);
        q("DELETE FROM lab_pitr_orders WHERE id=42;", source);
        assert.equal(q(read, source), "0");
        q("SELECT pg_switch_wal();", source);
        await wait(
          () => fs.existsSync(path.join(archive, segment)),
          "Segmento del target non archiviato",
        );
        fs.cpSync(base, recovered, { recursive: true });
        fs.chmodSync(recovered, 0o700);
        const dest = { PGPORT: String(await freePort()) };
        const [target] = snippets("Write-Ahead Logging", "ini");
        const restore =
          process.platform === "win32"
            ? 'copy /Y "..\\pitr-archive\\%f" "%p"'
            : 'cp "../pitr-archive/%f" "%p"';
        settings(
          recovered,
          [
            "port=" + dest.PGPORT,
            "archive_mode=off",
            "restore_command='" + restore.replaceAll("\\", "\\\\") + "'",
            target,
          ].join("\n"),
        );
        fs.writeFileSync(path.join(recovered, "recovery.signal"), "");
        startServer(recovered);
        await wait(
          () => q("SELECT pg_get_wal_replay_pause_state();", dest) === "paused",
          "Recovery non in pausa",
        );
        assert.equal(q("SELECT pg_is_in_recovery();", dest), "t");
        assert.equal(q(read, dest), "1");
        assert.equal(q(read, source), "0");
        const log = fs.readFileSync(
          path.join(root, "pitr-recovered-server.log"),
          "utf8",
        );
        assert.match(
          log,
          /recovery stopping at restore point "lab_prima_cancellazione"/,
        );
      } finally {
        try {
          stop(recovered);
        } finally {
          stop(origin);
        }
      }
    });
  });
}
