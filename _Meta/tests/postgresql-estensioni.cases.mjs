import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { before, describe, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

export function extensionCases({
  run,
  flags,
  blocks,
  freePort,
  startServer,
  fixture,
}) {
  const db = "lab_extensions_db",
    remote = "lab_fdw_db";
  const sql = (q, dbname = db, env = {}) =>
    run("psql", flags, q, 0, { PGDATABASE: dbname, ...env }).stdout.trim();
  const lines = (s) => s.split(/\r?\n/).filter(Boolean);
  const [, , , nearby, nearest] = blocks("Gestione delle Estensioni", 5);
  const [tsSetup, buckets, chunks] = blocks("TimescaleDB", 3);
  const [uuid, named, digest] = blocks("uuid-ossp e pgcrypto", 3);
  const [src, local, read, explain] = blocks("FDW", 4);
  const [mapping] = parseNote("Programmazione/PostgreSQL/Pagine/FDW.md")
    .tree.children.filter((n) => n.type === "code" && n.lang === "psql")
    .map((n) => n.value);
  assert.ok(mapping);
  const [cdcTable, slot, writes, peek, get, info] = blocks(
    "Logical decoding",
    6,
  );
  const external = {
    skip:
      process.env.PG_TEST_EXTERNAL_EXTENSIONS === "1"
        ? false
        : "Richiede PG_TEST_EXTERNAL_EXTENSIONS=1 e i moduli server esterni",
  };
  describe("Estensioni e funzionalità", () => {
    before(() => run("createdb", [db]));
    test("UUID v4/v7 prima delle estensioni; v5 deterministico e digest in byte", () => {
      assert.equal(
        sql(
          "SELECT count(*) FROM pg_extension WHERE extname IN ('uuid-ossp','pgcrypto');",
        ),
        "0",
      );
      assert.equal(sql(uuid), "4|7");
      assert.deepEqual(
        lines(
          sql(
            'BEGIN; CREATE EXTENSION "uuid-ossp"; CREATE EXTENSION pgcrypto;\n' +
              named +
              "\n" +
              digest +
              "\nROLLBACK;",
          ),
        ),
        ["t|t|5", "32|64|ba7816bf"],
      );
    });
    test("postgres_fdw: connessione remota, filtro trasferito e permessi distinti", () => {
      const { env } = fixture();
      const auth = { LAB_FDW_SECRET: randomBytes(24).toString("hex") };
      run("createdb", [remote]);
      fs.appendFileSync(
        env.PGSERVICEFILE,
        "\n[lab_fdw_source]\nhost=127.0.0.1\nport=" +
          env.PGPORT +
          "\ndbname=" +
          remote +
          "\n",
      );
      sql(
        "\\getenv remote_password LAB_FDW_SECRET\nCREATE ROLE lab_fdw_reader LOGIN PASSWORD :'remote_password';\n" +
          src,
        remote,
        auth,
      );
      sql("CREATE ROLE lab_fdw_client NOLOGIN;\n" + local);
      sql("\\getenv remote_password LAB_FDW_SECRET\n" + mapping, db, auth);
      const asClient = "SET ROLE lab_fdw_client;\n";
      assert.deepEqual(lines(sql(asClient + read)), ["2|25", "3|40"]);
      assert.match(
        sql(asClient + explain),
        /Remote SQL:.*WHERE.*amount\s*>=\s*20/i,
      );
      sql("INSERT INTO lab_source.orders VALUES (4,50);", remote);
      assert.deepEqual(lines(sql(asClient + read)), ["2|25", "3|40", "4|50"]);
      const update = "UPDATE lab_foreign.orders SET amount=41 WHERE id=3;";
      const refused = () =>
        run(
          "psql",
          [...flags, "-v", "VERBOSITY=verbose"],
          asClient + update,
          3,
          { PGDATABASE: db },
        ).stderr;
      assert.match(refused(), /42501/);
      sql("GRANT UPDATE ON lab_foreign.orders TO lab_fdw_client;");
      const err = refused();
      assert.match(err, /42501/);
      assert.match(err, /remote SQL command/i);
      assert.equal(
        sql("SELECT amount FROM lab_source.orders WHERE id=3;", remote),
        "40",
      );
    });
    test("Decoding: peek ripetibile, get consuma solo una volta; rollback escluso", () => {
      const output = lines(
        sql([cdcTable, slot, writes, peek, peek, get, get, info].join("\n")),
      );
      assert.equal(output.length, 5);
      const [name, a, b, c, state] = output;
      assert.equal(name, "lab_cdc_demo");
      assert.equal(a, b);
      assert.equal(b, c);
      assert.match(a, /INSERT: id\[integer\]:1 status\[text\]:'confermato'/);
      assert.match(
        state,
        /^lab_cdc_demo\|test_decoding\|t\|[0-9A-F]+\/[0-9A-F]+\|[0-9A-F]+\/[0-9A-F]+$/,
      );
      assert.equal(
        sql(
          "SELECT count(*) FROM pg_replication_slots WHERE slot_name='lab_cdc_demo';",
        ),
        "0",
      );
    });
    test("PostGIS: raggio metrico su geography WGS 84", external, () => {
      sql("CREATE EXTENSION postgis;");
      assert.equal(sql(nearby), "vicino");
      assert.match(
        sql("SELECT extversion FROM pg_extension WHERE extname='postgis';"),
        /^3\./,
      );
    });
    test("pgvector: ricerca L2 esatta distinta dal coseno", external, () => {
      sql("CREATE EXTENSION vector;");
      assert.deepEqual(lines(sql(nearest)), ["1|0", "2|1"]);
      assert.equal(
        sql("SELECT ('[1,0,0]'::vector <=> '[2,0,0]'::vector) < 0.000001;"),
        "t",
      );
    });
    test(
      "TimescaleDB: confine UTC, PK su sensore e tempo, bucket e chunk",
      external,
      async () => {
        const { root, env } = fixture();
        const dir = path.join(root, "timeseries");
        const pass = path.join(root, "timeseries.pass");
        const peer = { PGPORT: String(await freePort()) };
        fs.writeFileSync(pass, env.PGPASSWORD + "\n", { mode: 0o600 });
        try {
          try {
            run("initdb", [
              "-D",
              dir,
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
          fs.appendFileSync(
            path.join(dir, "postgresql.conf"),
            "\nlisten_addresses='127.0.0.1'\nunix_socket_directories=''\nshared_preload_libraries='timescaledb'\ntimescaledb.telemetry_level=off\nport=" +
              peer.PGPORT +
              "\n",
          );
          startServer(dir);
          sql("CREATE EXTENSION timescaledb;", "postgres", peer);
          const data = lines(
            sql([tsSetup, buckets, chunks].join("\n"), "postgres", peer),
          );
          assert.deepEqual(data, [
            "2026-01-01 23:00:00+00|2|15.0",
            "2026-01-02 00:00:00+00|1|30.0",
            "2",
          ]);
          assert.equal(
            sql(
              "SELECT to_regclass('public.lab_misure') IS NULL;",
              "postgres",
              peer,
            ),
            "t",
          );
        } finally {
          if (fs.existsSync(path.join(dir, "postmaster.pid")))
            run("pg_ctl", ["-D", dir, "-m", "fast", "-w", "stop"]);
        }
      },
    );
  });
}
