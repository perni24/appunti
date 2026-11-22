import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/Background jobs.md",
).tree.children.filter((b) => b.type === "code");
const checks = `use super::*;
use std::{
    sync::{Arc, atomic::{AtomicUsize, Ordering}},
    time::Duration,
};
use tokio::sync::Semaphore;
type TestResult = Result<(), Box<dyn std::error::Error>>;
fn job(id:i64, doc:i64) -> Job { Job {event_id:id,document_id:doc} }
async fn total(db:&SqlitePool,id:i64)->Result<Option<i64>,sqlx::Error>{
    sqlx::query_scalar("SELECT processed FROM totals WHERE document_id=?").bind(id).fetch_optional(db).await
}

#[tokio::test]
async fn identita_evento_non_documento_e_conflitto() -> TestResult {
    let dir=tempfile::tempdir()?;
    let db=open_store(&dir.path().join("store.db")).await?;
    assert_eq!(apply(&db,job(1,8)).await?,Outcome::Applied);
    assert_eq!(apply(&db,job(2,8)).await?,Outcome::Applied);
    assert_eq!(apply(&db,job(1,8)).await?,Outcome::Duplicate);
    assert_eq!(apply(&db,job(1,9)).await?,Outcome::KeyConflict);
    assert_eq!(total(&db,8).await?,Some(2));
    assert_eq!(total(&db,9).await?,None);
    db.close().await;
    Ok(())
}

#[tokio::test]
async fn errore_prima_del_commit_non_conserva_la_ricevuta() -> TestResult {
    let dir=tempfile::tempdir()?;
    let db=open_store(&dir.path().join("store.db")).await?;
    sqlx::query("CREATE TRIGGER stop_effect BEFORE INSERT ON totals BEGIN SELECT RAISE(ABORT,'errore di prova'); END")
        .execute(&db).await?;
    let item=job(4,10);
    assert!(matches!(apply(&db,item).await,Err(sqlx::Error::Database(_))));
    let receipts:i64=sqlx::query_scalar("SELECT COUNT(*) FROM receipts").fetch_one(&db).await?;
    assert_eq!(receipts,0);
    assert_eq!(total(&db,10).await?,None);
    sqlx::query("DROP TRIGGER stop_effect").execute(&db).await?;
    assert_eq!(apply(&db,item).await?,Outcome::Applied);
    assert_eq!(total(&db,10).await?,Some(1));
    db.close().await;
    Ok(())
}

#[tokio::test]
async fn il_supervisore_osserva_panic_ed_errori_del_job() -> TestResult {
    let (tx,rx)=mpsc::channel(5);
    for id in 1..=5 { tx.send(job(id,7)).await?; }
    drop(tx);
    let report=drain(rx,NonZeroUsize::new(1).unwrap(),|j| async move {
        match j.event_id {
            1 => panic!("panic di prova"),
            2 => Err(sqlx::Error::RowNotFound),
            3 => Ok(Outcome::Duplicate),
            4 => Ok(Outcome::KeyConflict),
            _ => Ok(Outcome::Applied),
        }
    }).await;
    assert_eq!((report.applied,report.duplicates,report.rejected,report.failed,report.join_errors),(1,1,1,1,1));
    Ok(())
}

#[tokio::test]
async fn coda_limitata_drena_anche_gli_ultimi_task() {
    tokio::time::timeout(Duration::from_secs(5),async {
        let (tx,rx)=mpsc::channel(1);
        let (started,mut events)=mpsc::unbounded_channel();
        let gate=Arc::new(Semaphore::new(0));
        let active=Arc::new(AtomicUsize::new(0));
        let peak=Arc::new(AtomicUsize::new(0));
        let (g,a,p)=(gate.clone(),active.clone(),peak.clone());
        let worker=tokio::spawn(drain(rx,NonZeroUsize::new(2).unwrap(),move |j| {
            let (gate,a,p,started)=(g.clone(),a.clone(),p.clone(),started.clone());
            async move {
                let n=a.fetch_add(1,Ordering::SeqCst)+1;
                p.fetch_max(n,Ordering::SeqCst);
                started.send(j.event_id).unwrap();
                gate.acquire().await.unwrap().forget();
                a.fetch_sub(1,Ordering::SeqCst);
                Ok(Outcome::Applied)
            }
        }));
        tx.send(job(1,7)).await.unwrap();
        tx.send(job(2,7)).await.unwrap();
        let mut first=[events.recv().await.unwrap(),events.recv().await.unwrap()];
        first.sort();
        assert_eq!(first,[1,2]);
        tx.try_send(job(3,7)).unwrap();
        assert!(matches!(tx.try_send(job(4,7)),Err(mpsc::error::TrySendError::Full(_))));
        drop(tx);
        assert!(!worker.is_finished());
        gate.add_permits(1);
        assert_eq!(events.recv().await,Some(3));
        assert!(!worker.is_finished());
        gate.add_permits(2);
        assert_eq!(worker.await.unwrap().applied,3);
        assert_eq!(peak.load(Ordering::SeqCst),2);
        assert_eq!(active.load(Ordering::SeqCst),0);
    }).await.expect("il worker deve terminare il drenaggio");
}

#[tokio::test]
async fn send_riuscito_non_persiste_il_lavoro() -> TestResult {
    let dir=tempfile::tempdir()?;
    let path=dir.path().join("store.db");
    let db=open_store(&path).await?;
    let (tx,rx)=mpsc::channel(1);
    tx.send(job(8,7)).await?;
    drop(rx);
    assert!(matches!(tx.try_send(job(9,7)),Err(mpsc::error::TrySendError::Closed(_))));
    db.close().await;
    let db=open_store(&path).await?;
    assert_eq!(total(&db,7).await?,None);
    let n:i64=sqlx::query_scalar("SELECT COUNT(*) FROM receipts").fetch_one(&db).await?;
    assert_eq!(n,0);
    db.close().await;
    Ok(())
}

#[tokio::test]
async fn due_consumer_sullo_stesso_file_non_duplicano_effetto() -> TestResult {
    let dir=tempfile::tempdir()?;
    let path=dir.path().join("store.db");
    let a=open_store(&path).await?;
    let b=open_store(&path).await?;
    let item=job(19,2);
    let (left,right)=tokio::join!(apply(&a,item),apply(&b,item));
    assert!(matches!((left?,right?),(Outcome::Applied,Outcome::Duplicate)|(Outcome::Duplicate,Outcome::Applied)));
    assert_eq!(total(&a,2).await?,Some(1));
    a.close().await;
    b.close().await;
    Ok(())
}
`;

test("background jobs: compila i blocchi Markdown e verifica sette casi con Tokio e SQLite", () => {
  const tmp = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(tmp, "vault-jobs-"));
  const dir = path.join(root, "job-documenti");
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
    fs.writeFileSync(
      manifest,
      initial.replace(/\[dependencies\]\s*$/, "") +
        blocks.find((b) => b.lang === "toml").value +
        "\n",
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
    assert.match(out, /tests::riconsegna_dopo_commit \.\.\. ok/);
    assert.match(out, /test result: ok\. 7 passed; 0 failed; 0 ignored;/);
  } finally {
    const p = fs.realpathSync(root);
    assert.equal(path.dirname(p), tmp);
    assert.ok(path.basename(p).startsWith("vault-jobs-"));
    fs.rmSync(p, { recursive: true, maxRetries: 4, retryDelay: 250 });
  }
});
