import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/Connection pooling.md",
).tree.children.filter((b) => b.type === "code");
const checks = `use super::*;
use axum::{body::Body, http::Request};
use sqlx::sqlite::SqliteConnectOptions;
use tower::ServiceExt;

const WAIT: Duration = Duration::from_secs(1);
type TestResult = Result<(), sqlx::Error>;

async fn status(app: &Router, path: &str) -> StatusCode {
    let req = Request::builder().uri(path).body(Body::empty()).unwrap();
    app.clone().oneshot(req).await.unwrap().status()
}

#[tokio::test]
async fn sonde_sotto_contesa_e_in_chiusura() -> TestResult {
    let pool = demo_pool(WAIT).await?;
    let app = router(pool.clone());
    assert_eq!(status(&app,"/ready").await,StatusCode::NO_CONTENT);
    let lease = pool.acquire().await?;
    assert_eq!(status(&app,"/live").await,StatusCode::NO_CONTENT);
    assert_eq!(status(&app,"/ready").await,StatusCode::SERVICE_UNAVAILABLE);
    drop(lease);
    assert_eq!(status(&app,"/ready").await,StatusCode::NO_CONTENT);
    pool.close().await;
    assert_eq!(status(&app,"/ready").await,StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(status(&app,"/live").await,StatusCode::NO_CONTENT);
    Ok(())
}

#[tokio::test]
async fn sessione_riutilizzata_non_condivisa_tra_pool_indipendenti() -> TestResult {
    let pool = demo_pool(WAIT).await?;
    let mut lease = pool.acquire().await?;
    sqlx::query("CREATE TEMP TABLE marker (id INTEGER)").execute(&mut *lease).await?;
    sqlx::query("INSERT INTO marker VALUES (7)").execute(&mut *lease).await?;
    drop(lease);
    let n:i64 = sqlx::query_scalar("SELECT id FROM marker").fetch_one(&pool.clone()).await?;
    assert_eq!(n,7);
    let separate = demo_pool(WAIT).await?;
    let other = sqlx::query("SELECT id FROM marker").fetch_one(&separate).await;
    assert!(matches!(other,Err(sqlx::Error::Database(ref err)) if err.message().contains("no such table")));
    separate.close().await;
    pool.close().await;
    Ok(())
}

#[tokio::test]
async fn dentro_una_transazione_usare_il_pool_chiede_un_secondo_posto() -> TestResult {
    let pool = demo_pool(WAIT).await?;
    sqlx::query("CREATE TABLE items(id INTEGER)").execute(&pool).await?;
    let mut tx = pool.begin().await?;
    sqlx::query("INSERT INTO items VALUES (1)").execute(&mut *tx).await?;
    let count = || sqlx::query_scalar::<_,i64>("SELECT COUNT(*) FROM items");
    assert!(matches!(count().fetch_one(&pool).await,Err(sqlx::Error::PoolTimedOut)));
    assert_eq!(count().fetch_one(&mut *tx).await?,1);
    tx.rollback().await?;
    assert_eq!(count().fetch_one(&pool).await?,0);
    pool.close().await;
    Ok(())
}

#[tokio::test]
async fn il_budget_di_acquisizione_non_termina_una_query_gia_partita() -> TestResult {
    // Il confronto rallenta solo il worker SQLite della fixture, non il runtime Tokio.
    let options = SqliteConnectOptions::new().in_memory(true).collation("ritardo", |a,b| {
        std::thread::sleep(WAIT + Duration::from_millis(100));
        a.cmp(b)
    });
    let pool = SqlitePoolOptions::new().max_connections(1).acquire_timeout(WAIT).connect_with(options).await?;
    let start=std::time::Instant::now();
    let result:i64 = sqlx::query_scalar("SELECT ('a' COLLATE ritardo) < 'b'").fetch_one(&pool).await?;
    assert_eq!(result,1);
    assert!(start.elapsed() >= WAIT);
    pool.close().await;
    Ok(())
}

#[tokio::test]
async fn close_sveglia_chi_aspetta_ma_deve_attendere_il_prestito() -> TestResult {
    let pool=demo_pool(Duration::from_secs(10)).await?;
    let lease=pool.acquire().await?;
    let other=pool.clone();
    tokio::time::timeout(Duration::from_secs(5), async {
        let mut waiting=Box::pin(other.acquire());
        tokio::select! {
            biased;
            _ = &mut waiting => panic!("posto ancora occupato"),
            _ = std::future::ready(()) => {}
        }
        let copy=pool.clone();
        let closing=tokio::spawn(async move {copy.close().await});
        pool.close_event().await;
        assert!(matches!(waiting.await,Err(sqlx::Error::PoolClosed)));
        assert!(!closing.is_finished());
        drop(lease);
        closing.await.unwrap();
        assert!(pool.is_closed());
    }).await.expect("chiusura bloccata");
    Ok(())
}

#[tokio::test]
async fn try_acquire_non_apre_connessioni_anche_se_il_pool_ha_spazio() -> TestResult {
    let pool=SqlitePoolOptions::new().max_connections(2).min_connections(0).connect_lazy("sqlite::memory:")?;
    assert_eq!(pool.size(),0);
    assert!(pool.try_acquire().is_none());
    assert_eq!(pool.size(),0);
    let lease=pool.acquire().await?;
    assert_eq!(pool.size(),1);
    assert_eq!(pool.num_idle(),0);
    drop(lease);
    pool.close().await;
    Ok(())
}
`;
test("pool SQLx: sette prove Rust con SQLite e compilazione della variante PostgreSQL", () => {
  const tmp = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(tmp, "vault-pool-"));
  const dir = path.join(root, "pool-demo");
  const env = {
    ...process.env,
    CARGO_HOME: process.env.CARGO_HOME || path.join(root, "c"),
    CARGO_TARGET_DIR: path.join(root, "t"),
    CARGO_TERM_COLOR: "never",
  };
  function run(tool, args, cwd = dir) {
    const r = spawnSync(tool, args, {
      cwd,
      env,
      encoding: "utf8",
      windowsHide: true,
      timeout: 300000,
      maxBuffer: 12 * 1024 * 1024,
    });
    assert.ifError(r.error);
    assert.equal(r.status, 0, [tool, ...args, r.stdout, r.stderr].join("\n"));
    return r.stdout.trim();
  }
  try {
    const create = blocks.find(
      (b) => b.lang === "sh" && b.value.startsWith("cargo new "),
    ).value;
    run("cargo", [...create.split(/\s+/).slice(1), "--vcs", "none"], root);
    const manifest = path.join(dir, "Cargo.toml");
    const initial = fs.readFileSync(manifest, "utf8");
    assert.match(initial, /\[dependencies\]\s*$/);
    const toml = blocks.find((b) => b.lang === "toml").value;
    fs.writeFileSync(
      manifest,
      initial.replace(/\[dependencies\]\s*$/, "") +
        toml +
        '\ntower = { version = "0.5", features = ["util"] }\n',
    );
    const rust = blocks.filter((b) => b.lang === "rust");
    assert.equal(rust.length, 3);
    fs.writeFileSync(
      path.join(dir, "src/lib.rs"),
      rust.map((b) => b.value).join("\n\n") + "\n#[cfg(test)] mod verifiche;\n",
    );
    fs.writeFileSync(path.join(dir, "src/verifiche.rs"), checks);
    const host = run("rustc", ["-vV"])
      .match(/^host: (.+)$/m)[1]
      .trim();
    run("cargo", ["fetch", "--target", host]);
    console.log(
      run("cargo", ["tree", "--offline", "--locked", "--depth", "1"]),
    );
    const out = run("cargo", ["test", "--lib", "--offline", "--locked"]);
    console.log(out);
    assert.match(out, /tests::i_cloni_condividono_un_posto \.\.\. ok/);
    assert.match(out, /test result: ok\. 7 passed; 0 failed; 0 ignored;/);
    run("cargo", [
      "check",
      "--features",
      "postgres-demo",
      "--locked",
      "--offline",
    ]);
  } finally {
    const p = fs.realpathSync(root);
    assert.equal(path.dirname(p), tmp);
    assert.ok(path.basename(p).startsWith("vault-pool-"));
    fs.rmSync(p, { recursive: true, maxRetries: 4, retryDelay: 250 });
  }
});
