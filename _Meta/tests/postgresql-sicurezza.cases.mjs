import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { before, describe, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { parseNote } from "../../site/scripts/vault.mjs";

function snippet(note, lang) {
  const nodes = parseNote(
    "Programmazione/PostgreSQL/Pagine/" + note + ".md",
  ).tree.children.filter((n) => n.type === "code" && n.lang === lang);
  assert.equal(nodes.length, 1);
  return nodes[0].value;
}
// Only the verifier, not the test password, travels in a SQL command.
function verifier(password) {
  const salt = randomBytes(16);
  const salted = pbkdf2Sync(password, salt, 4096, 32, "sha256");
  const key = (label) => createHmac("sha256", salted).update(label).digest();
  return (
    "SCRAM-SHA-256$4096:" +
    salt.toString("base64") +
    "$" +
    createHash("sha256").update(key("Client Key")).digest("base64") +
    ":" +
    key("Server Key").toString("base64")
  );
}

export function securityCases({ run, flags, blocks, fixture }) {
  const db = "lab_security_db";
  const dbEnv = { PGDATABASE: db };
  const sql = (s, env = {}) =>
    run("psql", flags, s, 0, { ...dbEnv, ...env }).stdout.trim();
  const denied = (s, env = {}) => {
    const r = run("psql", [...flags, "-v", "VERBOSITY=verbose"], s, 3, {
      ...dbEnv,
      ...env,
    });
    assert.match(r.stderr, /42501/);
  };
  const lines = (s) => s.split(/\r?\n/);
  describe("Sicurezza PostgreSQL", () => {
    before(() => run("createdb", [db]));
    test("ACL: SELECT ereditato dagli oggetti futuri; UPDATE solo tramite funzione", () => {
      const [setup, fn, use] = blocks("Ruoli e privilegi avanzati", 3);
      assert.deepEqual(lines(sql([setup, fn, use].join("\n"))), [
        "f",
        "1",
        "cancelled",
      ]);
      denied(
        [
          setup,
          fn,
          "UPDATE lab_acl.orders SET status='cancelled' WHERE id=1;",
        ].join("\n"),
      );
      const table = "CREATE TABLE lab_acl.altra (n integer);";
      assert.equal(
        sql(
          [
            setup,
            "RESET ROLE;",
            table,
            "SELECT has_table_privilege('lab_runtime','lab_acl.altra','SELECT');",
            "ROLLBACK;",
          ].join("\n"),
        ),
        "f",
      );
    });
    test("RLS: contesti consecutivi, zero righe e scritture rifiutate", () => {
      const [ddl, first, next] = blocks("Row Level Security", 3);
      assert.deepEqual(lines(sql([ddl, first, next].join("\n"))), [
        "Alfa",
        "0",
        "Beta",
        "0",
      ]);
      const tenant =
        "SET ROLE lab_docs_user; BEGIN; SET LOCAL app.tenant_id='00000000-0000-0000-0000-000000000001';";
      assert.equal(
        sql(
          tenant +
            "WITH changed AS (UPDATE lab_rls.documents SET title='x' WHERE id=2 RETURNING id) SELECT count(*) FROM changed; ROLLBACK;",
        ),
        "0",
      );
      denied(
        tenant +
          "UPDATE lab_rls.documents SET tenant_id='00000000-0000-0000-0000-000000000002' WHERE id=1;",
      );
      denied(
        tenant +
          "INSERT INTO lab_rls.documents VALUES (3,'00000000-0000-0000-0000-000000000002','x');",
      );
    });
    test("Audit: evento solo al commit; login distinto dal proprietario della funzione", () => {
      const [ddl, use] = blocks("Audit logging", 2);
      sql(ddl);
      sql(
        "CREATE ROLE lab_audit_user; GRANT USAGE ON SCHEMA lab_audit TO lab_audit_user; GRANT SELECT, UPDATE(status) ON lab_audit.orders TO lab_audit_user; GRANT SELECT ON lab_audit.events TO lab_audit_user;",
      );
      const actor = "SET SESSION AUTHORIZATION lab_audit_user;\n";
      assert.equal(sql(actor + use), "1|aperto|pagato|lab_audit_user");
      assert.equal(
        sql(
          actor +
            "UPDATE lab_audit.orders SET status='pagato' WHERE id=1; SELECT count(*) FROM lab_audit.events;",
        ),
        "1",
      );
      denied(actor + "DELETE FROM lab_audit.events;");
    });
    test("Estensioni: versione disponibile, trusted e rollback senza installazione residua", () => {
      const [inventory, install, inspect] = blocks(
        "Sicurezza delle estensioni",
        3,
      );
      const [name, version, installed, trusted] = sql(inventory).split("|");
      assert.equal(name, "pgcrypto");
      assert.ok(version);
      assert.equal(installed, "");
      assert.equal(trusted, "t");
      assert.equal(
        sql(install + "\n" + inspect),
        "pgcrypto|" + version + "|lab_extensions",
      );
      assert.equal(sql(inventory).split("|")[2], "");
      sql(
        "CREATE ROLE lab_ext_installer; CREATE SCHEMA lab_ext_space AUTHORIZATION lab_ext_installer;",
      );
      denied(
        "SET ROLE lab_ext_installer; CREATE EXTENSION pgcrypto WITH SCHEMA lab_ext_space;",
      );
      const ok = sql(
        "BEGIN; GRANT CREATE ON DATABASE lab_security_db TO lab_ext_installer; SET LOCAL ROLE lab_ext_installer; CREATE EXTENSION pgcrypto WITH SCHEMA lab_ext_space; SELECT extowner::regrole FROM pg_extension WHERE extname='pgcrypto'; ROLLBACK;",
      );
      assert.equal(ok, "lab_ext_installer");
    });
    test("Secret management: passfile, rotazione SCRAM e sessione già autenticata", () => {
      const { root, env } = fixture();
      const old = randomBytes(24).toString("hex"),
        next = randomBytes(24).toString("hex");
      const role = "lab_rotate",
        pass = path.join(root, "lab-rotation.pgpass");
      sql("CREATE ROLE lab_rotate LOGIN PASSWORD '" + verifier(old) + "';");
      const setPass = (secret) =>
        fs.writeFileSync(
          pass,
          [env.PGHOST, env.PGPORT, db, role, secret].join(":") + "\n",
          { mode: 0o600 },
        );
      const conn = { PGUSER: role, PGPASSWORD: "", PGPASSFILE: pass };
      setPass(old);
      assert.equal(
        sql("SELECT session_user, current_database();", conn),
        role + "|" + db,
      );
      assert.equal(
        sql(
          "ALTER ROLE lab_rotate PASSWORD '" +
            verifier(next) +
            "'; SELECT session_user;",
          conn,
        ),
        role,
      );
      const result = run("psql", flags, "SELECT 1;", 2, { ...dbEnv, ...conn });
      assert.match(result.stderr, /password authentication failed/i);
      setPass(next);
      assert.equal(sql("SELECT session_user;", conn), role);
      fs.unlinkSync(pass);
    });
    test("TLS: verify-full, nome errato, CA diversa e rifiuto di TCP non cifrato", async () => {
      const { root, data, env } = fixture();
      const role = "lab_tls_user";
      sql(
        "CREATE ROLE lab_tls_user LOGIN PASSWORD '" +
          verifier(env.PGPASSWORD) +
          "';",
      );
      const certs = fs.mkdtempSync(path.join(root, "certs-"));
      const config = path.join(certs, "tls.cnf");
      fs.writeFileSync(
        config,
        "[req]\nprompt=no\ndistinguished_name=dn\n[dn]\nCN=db.example.test\n[ca]\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign,cRLSign\n[server]\nbasicConstraints=critical,CA:FALSE\nextendedKeyUsage=serverAuth\nsubjectAltName=DNS:db.example.test\n",
      );
      const ssl = (...args) => {
        const r = spawnSync(process.env.PG_TEST_OPENSSL || "openssl", args, {
          cwd: certs,
          encoding: "utf8",
          windowsHide: true,
          timeout: 20000,
        });
        assert.ifError(r.error);
        assert.equal(r.status, 0, r.stderr);
      };
      for (const name of ["ca", "other"])
        ssl(
          "req",
          "-new",
          "-x509",
          "-newkey",
          "rsa:2048",
          "-nodes",
          "-keyout",
          name + ".key",
          "-out",
          name + ".pem",
          "-days",
          "2",
          "-config",
          "tls.cnf",
          "-extensions",
          "ca",
          "-subj",
          "/CN=Vault " + name,
        );
      ssl(
        "req",
        "-new",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-keyout",
        "server.key",
        "-out",
        "server.csr",
        "-config",
        "tls.cnf",
      );
      ssl(
        "x509",
        "-req",
        "-in",
        "server.csr",
        "-CA",
        "ca.pem",
        "-CAkey",
        "ca.key",
        "-CAcreateserial",
        "-days",
        "2",
        "-out",
        "server.crt",
        "-extfile",
        "tls.cnf",
        "-extensions",
        "server",
      );
      for (const name of ["server.key", "server.crt"])
        fs.copyFileSync(path.join(certs, name), path.join(data, name));
      fs.chmodSync(path.join(data, "server.key"), 0o600);
      const hba = path.join(data, "pg_hba.conf"),
        conf = path.join(data, "postgresql.conf");
      const originalHba = fs.readFileSync(hba),
        originalConf = fs.readFileSync(conf);
      const hbaRules = snippet("SSL e TLS", "text")
        .replaceAll("app_db", db)
        .replaceAll("app_user", role)
        .replaceAll("10.0.0.0/24", "127.0.0.1/32");
      try {
        fs.writeFileSync(hba, hbaRules + "\n" + originalHba.toString());
        fs.appendFileSync(conf, "\nssl=on\n");
        sql("SELECT pg_reload_conf();");
        for (let i = 0; i < 80 && sql("SHOW ssl;") !== "on"; i++)
          await delay(100);
        assert.equal(sql("SHOW ssl;"), "on");
        const ca = path.join(certs, "ca.pem");
        const conn = {
          PGUSER: role,
          PGHOST: "db.example.test",
          PGHOSTADDR: "127.0.0.1",
          PGSSLMODE: "verify-full",
          PGSSLROOTCERT: ca,
          PGGSSENCMODE: "disable",
        };
        const [tls] = blocks("SSL e TLS", 1);
        assert.match(sql(tls, conn), /^t\|TLS[^|]+\|.+$/);
        function reject(overrides, reason) {
          const r = run("psql", flags, "SELECT 1;", 2, {
            ...dbEnv,
            ...conn,
            ...overrides,
          });
          assert.match(r.stderr, reason);
        }
        reject({ PGHOST: "other.example.test" }, /does not match host name/i);
        reject(
          { PGSSLROOTCERT: path.join(certs, "other.pem") },
          /certificate verify failed/i,
        );
        reject({ PGSSLMODE: "disable" }, /pg_hba.conf rejects connection/i);
      } finally {
        fs.writeFileSync(conf, originalConf);
        fs.writeFileSync(hba, originalHba);
        sql("SELECT pg_reload_conf();");
      }
    });
  });
}
