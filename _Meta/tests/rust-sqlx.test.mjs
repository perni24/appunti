import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/SQLx.md",
).tree.children.filter((b) => b.type === "code");
const checks = `use super::*;
type TestResult<T = ()> = Result<T, Box<dyn std::error::Error>>;

async fn funded(a:i64,b:i64) -> TestResult<SqlitePool> {
    let pool = demo_pool().await?;
    sqlx::query("INSERT INTO accounts VALUES (1, ?, ?), (2, ?, ?)")
        .bind("D'Anna").bind(a).bind("Lia").bind(b).execute(&pool).await?;
    Ok(pool)
}
async fn balances(pool:&SqlitePool) -> TestResult<(i64,i64)> {
    Ok((find(pool,1).await?.unwrap().balance_cents,find(pool,2).await?.unwrap().balance_cents))
}

#[tokio::test]
async fn input_e_addebito_rifiutati() -> TestResult {
    let pool=funded(80,30).await?;
    for (from,to,cents) in [(1,2,0),(1,2,-10),(1,1,10)] {
        assert!(matches!(transfer(&pool,from,to,cents).await,Err(TransferError::Invalid)));
    }
    for (from,cents) in [(1,81),(99,5)] {
        assert!(matches!(transfer(&pool,from,2,cents).await,Err(TransferError::DebitRejected)));
    }
    assert_eq!(balances(&pool).await?,(80,30));
    Ok(())
}

#[tokio::test]
async fn vincolo_sul_credito_annulla_il_debito() -> TestResult {
    let pool=funded(1000,999_999).await?;
    let err=transfer(&pool,1,2,2).await.unwrap_err();
    assert!(matches!(err,TransferError::Db(sqlx::Error::Database(ref e)) if e.is_check_violation()),"{err}");
    assert_eq!(balances(&pool).await?,(1000,999_999));
    transfer(&pool,1,2,1).await?;
    assert_eq!(balances(&pool).await?,(999,1_000_000));
    Ok(())
}

#[tokio::test]
async fn assenza_prima_riga_e_bind() -> TestResult {
    let pool=funded(5,10).await?;
    assert_eq!(find(&pool,1).await?.unwrap().owner,"D'Anna");
    assert!(find(&pool,99).await?.is_none());
    let absent=sqlx::query_scalar::<_,i64>("SELECT id FROM accounts WHERE id = ?")
        .bind(99_i64).fetch_one(&pool).await;
    assert!(matches!(absent, Err(sqlx::Error::RowNotFound)));
    let many=|| sqlx::query_scalar::<_,i64>("SELECT id FROM accounts ORDER BY id");
    assert_eq!(many().fetch_one(&pool).await?,1);
    assert_eq!(many().fetch_optional(&pool).await?,Some(1));
    Ok(())
}

#[tokio::test]
async fn mapping_e_sql_non_controllati_in_compilazione() -> TestResult {
    let pool=funded(5,10).await?;
    let bad_mapping=sqlx::query_as::<_,Account>("SELECT id, owner AS label, balance_cents FROM accounts")
        .fetch_one(&pool).await.unwrap_err();
    assert!(matches!(bad_mapping, sqlx::Error::ColumnNotFound(ref c) if c=="owner"),"{bad_mapping}");
    let invalid=sqlx::query("SELECT balance_typo FROM accounts").fetch_one(&pool).await;
    assert!(matches!(invalid,Err(sqlx::Error::Database(_))));
    Ok(())
}

#[tokio::test]
async fn migrazione_ripetuta_non_reinizializza_i_dati() -> TestResult {
    let pool=funded(20,33).await?;
    sqlx::migrate!().run(&pool).await?;
    assert_eq!(balances(&pool).await?,(20,33));
    Ok(())
}

#[cfg(feature="checked")]
#[tokio::test]
async fn macro_preparata_legge_il_database_runtime() -> TestResult {
    let pool=funded(300,15).await?;
    assert_eq!(checked_balance(&pool,1).await?,Some(300));
    assert_eq!(checked_balance(&pool,77).await?,None);
    Ok(())
}
`;

const tmp = fs.realpathSync(os.tmpdir());
let root, dir, lib, env;
function run(tool, args, { cwd = dir, extra = {}, failure = false } = {}) {
  const r = spawnSync(tool, args, {
    cwd,
    env: { ...env, ...extra },
    encoding: "utf8",
    windowsHide: true,
    timeout: 600000,
    maxBuffer: 16 * 1024 * 1024,
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  const log = [r.stdout, r.stderr].join("\n");
  if (failure) assert.notEqual(r.status, 0, log);
  else assert.equal(r.status, 0, [tool, ...args, log].join("\n"));
  return log;
}
before(() => {
  root = fs.mkdtempSync(path.join(tmp, "vault-sqlx-"));
  dir = path.join(root, "conti-sqlx");
  env = {
    ...process.env,
    CARGO_HOME: process.env.CARGO_HOME || path.join(root, "c"),
    CARGO_TARGET_DIR: path.join(root, "t"),
    CARGO_TERM_COLOR: "never",
  };
  for (const key of Object.keys(env))
    if (/^(DATABASE_URL|SQLX_.*)$/i.test(key)) delete env[key];
  const create = blocks.find(
    (b) => b.lang === "sh" && b.value.startsWith("cargo new "),
  ).value;
  run("cargo", [...create.split(/\s+/).slice(1), "--vcs", "none"], {
    cwd: root,
  });
  const manifest = path.join(dir, "Cargo.toml");
  const initial = fs.readFileSync(manifest, "utf8");
  assert.match(initial, /\[dependencies\]\s*$/);
  fs.writeFileSync(
    manifest,
    initial.replace(/\[dependencies\]\s*$/, "") +
      blocks.find((b) => b.lang === "toml").value +
      "\n",
  );
  fs.mkdirSync(path.join(dir, "migrations"));
  fs.writeFileSync(
    path.join(dir, "migrations", "0001_accounts.sql"),
    blocks.find((b) => b.lang === "sql").value + "\n",
  );
  lib = path.join(dir, "src", "lib.rs");
  const rust = blocks.filter((b) => b.lang === "rust");
  assert.equal(rust.length, 4);
  fs.writeFileSync(
    lib,
    rust.map((b) => b.value).join("\n\n") + "\n#[cfg(test)] mod verifiche;\n",
  );
  fs.writeFileSync(path.join(dir, "src", "verifiche.rs"), checks);
  // prepare interroga cargo metadata senza filtro di piattaforma, anche offline.
  run("cargo", ["fetch"]);
  console.log(
    run("cargo", ["tree", "--offline", "--locked", "--depth", "1"]).trim(),
  );
});
after(() => {
  if (!root) return;
  const p = fs.realpathSync(root);
  assert.equal(path.dirname(p), tmp);
  assert.ok(path.basename(p).startsWith("vault-sqlx-"));
  fs.rmSync(p, { recursive: true, maxRetries: 4, retryDelay: 250 });
});

test("SQLite in memoria: saldi, rollback, cardinalità, mapping e migrazioni", () => {
  const out = run("cargo", ["test", "--lib", "--offline", "--locked"], {
    extra: { SQLX_OFFLINE: "true" },
  });
  assert.match(out, /test result: ok\. 6 passed; 0 failed; 0 ignored;/);
  console.log(out.split("test result:")[0].trim());
});

test("prepare e compilazione offline; errori per metadati mancanti e colonna inesistente", () => {
  const tools = path.join(root, "tools");
  // Installazione solo nel progetto temporaneo; non tocca i binari Cargo personali.
  run("cargo", [
    "install",
    "sqlx-cli",
    "--version",
    "0.8.6",
    "--locked",
    "--no-default-features",
    "--features",
    "sqlite",
    "--debug",
    "--root",
    tools,
  ]);
  const bin = path.join(tools, "bin");
  const pathKey =
    Object.keys(env).find((k) => k.toLowerCase() === "path") || "PATH";
  const offlineCargo = {
    [pathKey]: bin + path.delimiter + env[pathKey],
    CARGO_NET_OFFLINE: "true",
  };
  const live = {
    ...offlineCargo,
    DATABASE_URL: "sqlite://schema-check.db",
    SQLX_OFFLINE: "false",
  };
  const db = path.join(dir, "schema-check.db");
  const sqlx = path.join(
    bin,
    process.platform === "win32" ? "sqlx.exe" : "sqlx",
  );
  run(sqlx, ["database", "create"], { extra: live });
  run(sqlx, ["migrate", "run"], { extra: live });
  run("cargo", ["metadata", "--format-version", "1", "--locked"], {
    extra: live,
  });
  run("cargo", ["sqlx", "prepare", "--", "--features", "checked"], {
    extra: live,
  });
  assert.ok(
    fs
      .readdirSync(path.join(dir, ".sqlx"))
      .some((f) => /^query-.+\.json$/.test(f)),
  );
  run("cargo", ["sqlx", "prepare", "--check", "--", "--features", "checked"], {
    extra: live,
  });

  // Rimuove solo il DB dalla vista della build, non lo schema/metadati dalla crate.
  fs.renameSync(db, db + ".saved");
  const cacheOnly = { ...offlineCargo, SQLX_OFFLINE: "true" };
  fs.appendFileSync(lib, "\n// ricompila senza database di sviluppo\n");
  const out = run(
    "cargo",
    ["test", "--offline", "--locked", "--lib", "--features", "checked"],
    { extra: cacheOnly },
  );
  assert.match(
    out,
    /verifiche::macro_preparata_legge_il_database_runtime \.\.\. ok/,
  );
  assert.match(out, /test result: ok\. 7 passed; 0 failed; 0 ignored;/);

  const good = "SELECT balance_cents FROM accounts WHERE id = ?";
  const contents = fs.readFileSync(lib, "utf8");
  assert.equal(contents.split(good).length, 2);
  fs.writeFileSync(
    lib,
    contents.replace(good, "SELECT balance_typo FROM accounts WHERE id = ?"),
  );
  const args = ["check", "--offline", "--locked", "--features", "checked"];
  assert.match(
    run("cargo", args, { extra: cacheOnly, failure: true }),
    /no cached data for this query/i,
  );
  fs.renameSync(db + ".saved", db);
  assert.match(
    run("cargo", args, { extra: live, failure: true }),
    /no such column: balance_typo/i,
  );
});
