import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/SeaORM.md",
).tree.children.filter((b) => b.type === "code");
const checks = `use super::*;
use sea_orm::{
    ActiveModelTrait, ActiveValue::{NotSet, Unchanged}, DbBackend, ModelTrait,
    QueryTrait, TransactionError, TransactionTrait,
};

async fn book(db: &DatabaseConnection, name: &str) -> Result<notebook::Model, DbErr> {
    notebook::ActiveModel { name: Set(name.into()), ..Default::default() }.insert(db).await
}

#[tokio::test]
async fn unchanged_in_insert_non_e_notset() -> Result<(), DbErr> {
    let db=demo_db().await?;
    let b=book(&db,"Import").await?;
    let mut imported=draft(b.id,"Archivio");
    assert!(matches!(imported.summary, NotSet));
    imported.summary=Unchanged(Some("Nota importata".into()));
    let row=imported.insert(&db).await?;
    assert_eq!(note::Entity::find_by_id(row.id).one(&db).await?.unwrap().summary.as_deref(),Some("Nota importata"));
    Ok(())
}

#[tokio::test]
async fn aggiornamento_parziale_e_pulizia_esplicita() -> Result<(), DbErr> {
    let db=demo_db().await?;
    let b=book(&db,"Sviluppo").await?;
    let original=draft(b.id,"Prima").insert(&db).await?;
    let mut newer:note::ActiveModel=original.clone().into();
    newer.summary=Set(Some("Aggiornato altrove".into()));
    newer.update(&db).await?;
    let mut older:note::ActiveModel=original.clone().into();
    assert!(matches!(&older.summary,Unchanged(Some(s)) if s=="Da rivedere"));
    older.title=Set("Seconda".into());
    older.update(&db).await?;
    let mut partial=note::ActiveModel { id:Unchanged(original.id), title:Set("Terza".into()), ..Default::default() };
    assert!(matches!(partial.summary,NotSet));
    partial.clone().update(&db).await?;
    let stored=note::Entity::find_by_id(original.id).one(&db).await?.unwrap();
    assert_eq!(stored.summary.as_deref(),Some("Aggiornato altrove"));
    assert_eq!(stored.title,"Terza");
    partial.summary=Set(None);
    partial.update(&db).await?;
    assert_eq!(note::Entity::find_by_id(original.id).one(&db).await?.unwrap().summary,None);
    Ok(())
}

#[tokio::test]
async fn save_non_e_upsert() -> Result<(), DbErr> {
    let db=demo_db().await?;
    let b=book(&db,"Salva").await?;
    let mut fresh=draft(b.id,"Manuale");
    fresh.id=Set(77);
    assert!(fresh.clone().save(&db).await.is_err());
    assert!(note::Entity::find_by_id(77).one(&db).await?.is_none());
    assert_eq!(fresh.insert(&db).await?.id,77);
    Ok(())
}

#[tokio::test]
async fn join_e_lettura_per_padre_concordano() -> Result<(), DbErr> {
    let db=demo_db().await?;
    let first=book(&db,"Usato").await?;
    let empty=book(&db,"Vuoto").await?;
    for title in ["Uno","Due"] { draft(first.id,title).insert(&db).await?; }
    let sql=notebook::Entity::find().find_with_related(note::Entity).build(DbBackend::Sqlite).sql;
    assert!(sql.contains("LEFT JOIN"),"{sql}");
    let rows=notebooks_with_notes(&db).await?;
    assert_eq!(rows.len(),2);
    assert_eq!(rows[0].0,first);
    let lazy=first.find_related(note::Entity).order_by_asc(note::Column::Id).all(&db).await?;
    let mut joined=rows[0].1.clone();
    joined.sort_by_key(|n|n.id);
    assert_eq!(joined,lazy);
    assert_eq!(joined.len(),2);
    assert_eq!(rows[1].0,empty);
    assert!(rows[1].1.is_empty());
    Ok(())
}

#[tokio::test]
async fn vincoli_e_rollback_non_lasciano_righe_parziali() -> Result<(), DbErr> {
    let db=demo_db().await?;
    assert!(draft(123,"Senza padre").insert(&db).await.is_err());
    let b=book(&db,"Indice").await?;
    draft(b.id,"Esistente").insert(&db).await?;
    let id=b.id;
    let result=db.transaction::<_, (), DbErr>(|txn| Box::pin(async move {
        draft(id,"Provvisoria").insert(txn).await?;
        draft(id,"Esistente").insert(txn).await?;
        Ok(())
    })).await;
    assert!(matches!(result,Err(TransactionError::Transaction(_))));
    let saved=b.find_related(note::Entity).all(&db).await?;
    assert_eq!(saved.len(),1);
    assert_eq!(saved[0].title,"Esistente");
    Ok(())
}

#[tokio::test]
async fn assenza_di_riga_non_e_errore_di_schema() -> Result<(), DbErr> {
    let db=demo_db().await?;
    assert!(note::Entity::find_by_id(1).one(&db).await?.is_none());
    let without_schema=Database::connect("sqlite::memory:").await?;
    assert!(note::Entity::find_by_id(1).one(&without_schema).await.is_err());
    Ok(())
}
`;

test("contratto SeaORM: compila entità e repository dal Markdown e verifica sette casi su SQLite", () => {
  const tmp = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(tmp, "vault-seaorm-"));
  const dir = path.join(root, "quaderni-orm");
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
    assert.equal(rust.length, 4);
    for (const [i, name] of ["notebook", "note"].entries())
      fs.writeFileSync(
        path.join(dir, "src", name + ".rs"),
        rust[i].value + "\n",
      );
    fs.writeFileSync(
      path.join(dir, "src/lib.rs"),
      rust
        .slice(2)
        .map((b) => b.value)
        .join("\n\n") + "\n#[cfg(test)] mod verifiche;\n",
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
    assert.match(out, /tests::omettere_non_significa_scrivere_null \.\.\. ok/);
    assert.match(out, /test result: ok\. 7 passed; 0 failed; 0 ignored;/);
  } finally {
    const p = fs.realpathSync(root);
    assert.equal(path.dirname(p), tmp);
    assert.ok(path.basename(p).startsWith("vault-seaorm-"));
    fs.rmSync(p, { recursive: true, maxRetries: 4, retryDelay: 250 });
  }
});
