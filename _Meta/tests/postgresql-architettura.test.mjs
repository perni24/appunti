import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { parseNote } from "../../site/scripts/vault.mjs";
import { setupCases } from "./postgresql-setup.cases.mjs";
import { sqlCases } from "./postgresql-sql-fondamentale.cases.mjs";
import { modelCases } from "./postgresql-modellazione.cases.mjs";
import { advancedCases } from "./postgresql-avanzato.cases.mjs";
import { businessCases } from "./postgresql-integrita.cases.mjs";
import { transactionCases } from "./postgresql-transazioni.cases.mjs";
import { performanceCases } from "./postgresql-performance.cases.mjs";
import { storageCases } from "./postgresql-storage.cases.mjs";
import { scalingCases } from "./postgresql-scalabilita.cases.mjs";
import { securityCases } from "./postgresql-sicurezza.cases.mjs";
import { observabilityCases } from "./postgresql-osservabilita.cases.mjs";
import { operationsCases } from "./postgresql-operativita.cases.mjs";
import { extensionCases } from "./postgresql-estensioni.cases.mjs";
import { applicationCases } from "./postgresql-integrazione.cases.mjs";
import { queryMemoCases } from "./postgresql-promemoria-query.cases.mjs";
import { typeMemoCases } from "./postgresql-promemoria-tipi.cases.mjs";
import { structureMemoCases } from "./postgresql-promemoria-struttura.cases.mjs";
import { managementMemoCases } from "./postgresql-promemoria-gestione.cases.mjs";

function blocks(note, count, directory = "Pagine") {
  const result = parseNote(
    "Programmazione/PostgreSQL/" + directory + "/" + note + ".md",
  )
    .tree.children.filter((n) => n.type === "code" && n.lang === "sql")
    .map((n) => n.value);
  assert.equal(result.length, count, note);
  return result;
}
const [identity, peers] = blocks("Modello Client-Server", 2);
const [activity, census, blockers] = blocks("Architettura dei Processi", 3);
const [settings, compare] = blocks("Gestione della Memoria", 2);
const [locations, relation, sizes, toast] = blocks(
  "File System Layout e Data Directory",
  4,
);
const tmp = fs.realpathSync(os.tmpdir());
let root,
  data,
  started = false;
const env = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !/^PG/i.test(key)),
);
const bin = (name) =>
  path.join(
    process.env.PG_BIN || "",
    name + (process.platform === "win32" ? ".exe" : ""),
  );
function run(tool, args, input, expected = 0, session = {}) {
  const r = spawnSync(bin(tool), args, {
    env: { ...env, ...session },
    cwd: root,
    encoding: "utf8",
    input,
    timeout: 45000,
    windowsHide: true,
  });
  assert.ifError(r.error);
  assert.equal(r.status, expected, r.stderr || r.stdout);
  return r;
}
const flags = ["-X", "-qAt", "-w", "-v", "ON_ERROR_STOP=1"];
const sql = (query) => run("psql", flags, query).stdout.trim();
before(async () => {
  assert.match(
    run("postgres", ["--version"]).stdout,
    /PostgreSQL\) 18\./,
    "Richiesto PostgreSQL 18.x",
  );
  root = fs.mkdtempSync(path.join(tmp, "vault-pg-fondamenti-"));
  data = path.join(root, "data");
  const password = randomBytes(30).toString("hex");
  const passfile = path.join(root, "init.pass");
  fs.writeFileSync(passfile, password + "\n", { mode: 0o600 });
  run("initdb", [
    "-D",
    data,
    "-U",
    "vault_admin",
    "--auth=scram-sha-256",
    "--pwfile",
    passfile,
    "--locale=C",
    "-E",
    "UTF8",
  ]);
  fs.unlinkSync(passfile);
  const port = await freePort();
  fs.appendFileSync(
    path.join(data, "postgresql.conf"),
    "\nlisten_addresses = '127.0.0.1'\nunix_socket_directories = ''\nwal_level = logical\nshared_preload_libraries = 'pg_stat_statements'\nlogging_collector = off\nport = " +
      port +
      "\n",
  );
  Object.assign(env, {
    PGHOST: "127.0.0.1",
    PGPORT: String(port),
    PGUSER: "vault_admin",
    PGDATABASE: "postgres",
    PGPASSWORD: password,
    PGSERVICEFILE: path.join(root, "services.conf"),
    PGCONNECT_TIMEOUT: "5",
    PGAPPNAME: "vault-observer",
    PGOPTIONS: "-c statement_timeout=10000",
  });
  const services = ["vault_primary", "vault_publisher"].map(
    (name) =>
      "[" +
      name +
      "]\nhost=127.0.0.1\nport=" +
      port +
      "\nuser=vault_admin\npassword=" +
      password +
      "\ndbname=postgres\n",
  );
  fs.writeFileSync(env.PGSERVICEFILE, services.join("\n"), { mode: 0o600 });
  startServer(data);
  started = true;
  assert.equal(
    fs.realpathSync(sql("SHOW data_directory")),
    fs.realpathSync(data),
  );
});
async function freePort() {
  const listener = net.createServer();
  listener.listen(0, "127.0.0.1");
  await once(listener, "listening");
  const { port } = listener.address();
  await new Promise((resolve) => listener.close(resolve));
  return port;
}
function startServer(dir) {
  // On Windows a server process may keep a pipe inherited from pg_ctl open.
  const log = path.join(root, path.basename(dir) + "-server.log");
  const ctl = path.join(root, path.basename(dir) + "-start.log");
  const fd = fs.openSync(ctl, "w");
  try {
    const r = spawnSync(
      bin("pg_ctl"),
      ["-D", dir, "-l", log, "-w", "-t", "20", "start"],
      {
        env,
        cwd: root,
        stdio: ["ignore", fd, fd],
        windowsHide: true,
        timeout: 30000,
      },
    );
    if (r.status !== 0)
      throw new Error(
        [
          r.error?.message,
          ...[ctl, log]
            .filter((f) => fs.existsSync(f))
            .map((f) => fs.readFileSync(f, "utf8")),
        ].join("\n"),
      );
  } finally {
    fs.closeSync(fd);
  }
}
after(() => {
  if (!root) return;
  if (started || fs.existsSync(path.join(data, "postmaster.pid")))
    run("pg_ctl", ["-D", data, "-m", "fast", "-w", "stop"]);
  const real = fs.realpathSync(root);
  assert.equal(path.dirname(real), tmp);
  assert.ok(path.basename(real).startsWith("vault-pg-fondamenti-"));
  fs.rmSync(real, { recursive: true, maxRetries: 4, retryDelay: 250 });
});
test("Due sessioni: PID, indirizzo TCP, idle e idle in transaction", async () => {
  const [myPid, db, user, app, addr] = sql(identity).split("|");
  assert.deepEqual(
    [db, user, app, addr],
    ["postgres", "vault_admin", "vault-observer", "127.0.0.1"],
  );
  const child = spawn(bin("psql"), flags, {
    env: { ...env, PGAPPNAME: "appunti-demo" },
    cwd: root,
    windowsHide: true,
    stdio: "pipe",
  });
  const ended = once(child, "close");
  let output = "";
  child.stdout.on("data", (s) => {
    output += s.toString();
  });
  child.stderr.resume();
  async function until(state) {
    for (let i = 0; i < 50; i++) {
      const [pid, role, label, ip, value] = sql(peers).split("|");
      if (value === state) {
        assert.deepEqual(
          [role, label, ip],
          ["vault_admin", "appunti-demo", "127.0.0.1"],
        );
        return pid;
      }
      await delay(80);
    }
    assert.fail("Stato non osservato: " + state);
  }
  try {
    child.stdin.write(identity + "\n");
    const pid = await until("idle");
    assert.notEqual(pid, myPid);
    child.stdin.write("BEGIN READ ONLY;\nSELECT 1;\n");
    assert.equal(await until("idle in transaction"), pid);
    child.stdin.end("ROLLBACK;\n" + identity + "\n");
    const [code] = await ended;
    assert.equal(code, 0);
    const rows = output.trim().split(/\r?\n/);
    assert.equal(rows.length, 3);
    assert.equal(rows[0].split("|")[0], pid);
    assert.equal(rows[0], rows[2]);
    assert.equal(sql(peers), "");
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill();
    await ended;
  }
});
test("Il backend osserva se stesso; i processi di supporto non sono client", () => {
  const [pid, type, state] = sql(activity).split("|");
  assert.match(pid, /^\d+$/);
  assert.equal(type, "client backend");
  assert.equal(state, "active");
  const snapshot = sql(census);
  for (const label of [
    "client backend",
    "checkpointer",
    "background writer",
    "walwriter",
  ])
    assert.ok(
      snapshot.split(/\r?\n/).some((line) => line.startsWith(label + "|")),
      label,
    );
  assert.equal(sql(blockers), "");
});
test("La query individua il titolare del lock e smette di segnalarlo dopo il rilascio", async () => {
  function session(label) {
    const child = spawn(bin("psql"), flags, {
      cwd: root,
      env: { ...env, PGAPPNAME: label },
      stdio: "pipe",
      windowsHide: true,
    });
    child.stdout.resume();
    child.stderr.resume();
    return { child, ended: once(child, "close") };
  }
  async function waitFor(query, predicate) {
    for (let i = 0; i < 35; i++) {
      const result = sql(query);
      if (predicate(result)) return result;
      await delay(60);
    }
    assert.fail("Stato di lock non osservato");
  }
  const holder = session("vault-holder");
  const waiter = session("vault-waiter");
  try {
    holder.child.stdin.write("BEGIN;\nSELECT pg_advisory_xact_lock(9876);\n");
    const holderPid = await waitFor(
      "SELECT pid FROM pg_stat_activity WHERE application_name='vault-holder' AND state='idle in transaction' AND query LIKE '%pg_advisory_xact_lock%';",
      (s) => /^\d+$/.test(s),
    );
    waiter.child.stdin.end("SELECT pg_advisory_xact_lock(9876);\n");
    const found = await waitFor(blockers, (s) =>
      s.endsWith("|{" + holderPid + "}"),
    );
    assert.equal(
      found.split("|")[0],
      sql(
        "SELECT pid FROM pg_stat_activity WHERE application_name='vault-waiter';",
      ),
    );
    holder.child.stdin.end("ROLLBACK;\n");
    for (const peer of [holder, waiter]) assert.equal((await peer.ended)[0], 0);
    assert.equal(sql(blockers), "");
  } finally {
    for (const peer of [holder, waiter]) {
      if (peer.child.exitCode === null && peer.child.signalCode === null)
        peer.child.kill();
      await peer.ended;
    }
  }
});
test("Budget per sort: spill a 64kB, sort in memoria a 8MB e ripristino finale", () => {
  const values = sql(settings).split(/\r?\n/);
  assert.equal(values.length, 6);
  assert.ok(values.some((row) => row.startsWith("shared_buffers|")));
  for (const [amount, method] of [
    ["64kB", /Sort Method: external merge\s+Disk:/],
    ["8MB", /Sort Method: quicksort\s+Memory:/],
  ]) {
    const plan = sql(
      "SHOW work_mem;\n" +
        compare.replace("'64kB'", "'" + amount + "'") +
        "\nSHOW work_mem;",
    );
    assert.match(plan, method);
    const lines = plan.split(/\r?\n/);
    assert.equal(lines[0], lines.at(-1));
  }
});
test("Percorsi effettivi del cluster e primo segmento di pg_class", () => {
  const [dir, conf, hba] = sql(locations).split("|");
  assert.equal(fs.realpathSync(dir), fs.realpathSync(data));
  for (const f of [conf, hba]) assert.ok(fs.statSync(f).isFile());
  const [oid, node, file] = sql(relation).split("|");
  assert.match(oid, /^\d+$/);
  assert.match(node, /^\d+$/);
  assert.ok(file.startsWith("base/") && file.endsWith("/" + node), file);
  assert.ok(fs.statSync(path.join(data, file)).isFile());
  assert.equal(sql(sizes).split("|").filter(Boolean).length, 3);
  assert.equal(
    sql(
      "SELECT pg_total_relation_size('pg_catalog.pg_class') >= pg_relation_size('pg_catalog.pg_class');",
    ),
    "t",
  );
});
test("I percorsi di configurazione non sono leggibili da un ruolo ordinario", () => {
  sql("CREATE ROLE vault_reader;");
  const result = run(
    "psql",
    flags,
    "\\set VERBOSITY verbose\nSET ROLE vault_reader;\n" + locations,
    3,
  );
  assert.match(result.stderr, /42501/);
});

setupCases({ run, flags, blocks, paths: () => ({ root, data }) });
sqlCases({ run, flags, blocks });
modelCases({ run, flags, blocks });
advancedCases({ run, flags, blocks });
businessCases({ run, flags, blocks });
function openPeer(label, db = env.PGDATABASE) {
  return spawn(bin("psql"), [...flags, "-v", "VERBOSITY=verbose"], {
    env: { ...env, PGAPPNAME: label, PGDATABASE: db },
    cwd: root,
    windowsHide: true,
    stdio: "pipe",
  });
}
transactionCases({ run, flags, blocks, openPeer });
performanceCases({ run, flags, blocks });
storageCases({ run, flags, blocks, toast, paths: () => ({ root, data }) });
scalingCases({
  run,
  flags,
  blocks,
  freePort,
  startServer,
  fixture: () => ({ root, env }),
});
securityCases({ run, flags, blocks, fixture: () => ({ root, data, env }) });
observabilityCases({
  run,
  flags,
  blocks,
  openPeer,
  serverLog: () => path.join(root, "data-server.log"),
});
operationsCases({
  run,
  flags,
  blocks,
  freePort,
  startServer,
  fixture: () => ({ root, env }),
});
extensionCases({
  run,
  flags,
  blocks,
  freePort,
  startServer,
  fixture: () => ({ root, env }),
});
applicationCases({
  run,
  flags,
  blocks,
  openPeer,
  fixture: () => ({ root, env }),
});
queryMemoCases({ run, flags, blocks });
typeMemoCases({ run, flags, blocks });
structureMemoCases({ run, flags, blocks, openPeer });
managementMemoCases({ run, flags, blocks, fixture: () => ({ root }) });
