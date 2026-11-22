import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/Diesel.md",
).tree.children.filter((b) => b.type === "code");
const tmp = fs.realpathSync(os.tmpdir());
let root, dir, env;
const checks = `use super::*;
use diesel::connection::SimpleConnection;
use diesel::result::{DatabaseErrorKind, Error};
type TestResult = Result<(), Box<dyn std::error::Error + Send + Sync>>;

fn input<'a>(slug: &'a str, title: &'a str) -> NewNote<'a> {
    NewNote { slug, title, summary: None }
}

#[test]
fn ordine_e_valori_della_lista() -> TestResult {
    let mut conn=demo_connection()?;
    assert!(list(&mut conn)?.is_empty());
    import(&mut conn,&[input("z", "Prima"),input("a", "D'Anna")])?;
    let rows=list(&mut conn)?;
    assert_eq!(rows.iter().map(|n|(n.slug.as_str(),n.title.as_str())).collect::<Vec<_>>(),
       [("a","D'Anna"),("z","Prima")]);
    assert_eq!(set_summary(&mut conn,"a",Some("Letta"))?,1);
    assert_eq!(find(&mut conn,"a")?.unwrap().summary.as_deref(),Some("Letta"));
    Ok(())
}

#[test]
fn chiave_duplicata_annulla_tutto_il_lotto() -> TestResult {
    let mut conn=demo_connection()?;
    import(&mut conn,&[input("prima","Preesistente")])?;
    let err=import(&mut conn,&[input("nuova","Non confermata"),input("prima","Duplicata")]).unwrap_err();
    assert!(matches!(err, Error::DatabaseError(DatabaseErrorKind::UniqueViolation,_)), "{err}");
    assert!(find(&mut conn,"nuova")?.is_none());
    assert_eq!(find(&mut conn,"prima")?.unwrap().title,"Preesistente");
    Ok(())
}

#[test]
fn queryable_legge_per_posizione() -> TestResult {
    let mut conn=demo_connection()?;
    import(&mut conn,&[input("scheda-7","Prima nota")])?;
    let inverted=notes::table.select((notes::title,notes::slug,notes::summary)).first::<Note>(&mut conn)?;
    assert_eq!((&*inverted.slug,&*inverted.title),("Prima nota","scheda-7"));
    let by_model=find(&mut conn,"scheda-7")?.unwrap();
    assert_eq!((&*by_model.slug,&*by_model.title),("scheda-7","Prima nota"));
    Ok(())
}

#[test]
fn schema_reale_non_migrato_non_significa_riga_assente() -> TestResult {
    let mut conn=SqliteConnection::establish(":memory:")?;
    conn.batch_execute("CREATE TABLE notes (slug TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL);")?;
    let err=find(&mut conn,"assente").unwrap_err();
    assert!(matches!(err, Error::DatabaseError(_,ref detail) if detail.message().contains("no such column") && detail.message().contains("summary")), "{err}");
    Ok(())
}

#[test]
fn up_ripetibile_down_rimuove_i_dati_solo_nel_demo() -> TestResult {
    let mut conn=demo_connection()?;
    import(&mut conn,&[input("scheda","Nota")])?;
    assert!(conn.run_pending_migrations(MIGRATIONS)?.is_empty());
    assert_eq!(list(&mut conn)?.len(),1);
    conn.revert_last_migration(MIGRATIONS)?;
    assert!(matches!(list(&mut conn), Err(Error::DatabaseError(_, _))));
    conn.run_pending_migrations(MIGRATIONS)?;
    assert!(list(&mut conn)?.is_empty());
    Ok(())
}
`;

function run(tool, args, { cwd = dir, failure = false } = {}) {
  const r = spawnSync(tool, args, {
    cwd,
    env,
    encoding: "utf8",
    windowsHide: true,
    timeout: 300000,
    maxBuffer: 12 * 1024 * 1024,
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  const log = [r.stdout, r.stderr].join("\n");
  if (failure) assert.notEqual(r.status, 0, log);
  else assert.equal(r.status, 0, [tool, ...args, log].join("\n"));
  return log;
}

before(() => {
  root = fs.mkdtempSync(path.join(tmp, "vault-diesel-"));
  dir = path.join(root, "archivio-diesel");
  env = {
    ...process.env,
    CARGO_HOME: process.env.CARGO_HOME || path.join(root, "c"),
    CARGO_TARGET_DIR: path.join(root, "t"),
    CARGO_TERM_COLOR: "never",
  };
  const create = blocks.find(
    (b) => b.lang === "sh" && b.value.startsWith("cargo new"),
  ).value;
  run("cargo", [...create.split(/\s+/).slice(1), "--vcs", "none"], {
    cwd: root,
  });
  fs.appendFileSync(
    path.join(dir, "Cargo.toml"),
    blocks.find((b) => b.lang === "toml").value + "\n",
  );
  const migration = path.join(dir, "migrations", "00000000000001_create_notes");
  fs.mkdirSync(migration, { recursive: true });
  const sql = blocks.filter((b) => b.lang === "sql");
  assert.equal(sql.length, 2);
  for (const [i, name] of ["up.sql", "down.sql"].entries())
    fs.writeFileSync(path.join(migration, name), sql[i].value + "\n");
  const rust = blocks.filter((b) => b.lang === "rust");
  assert.equal(rust.length, 4);
  fs.writeFileSync(path.join(dir, "src/schema.rs"), rust[0].value + "\n");
  fs.writeFileSync(
    path.join(dir, "src/lib.rs"),
    rust
      .slice(1)
      .map((b) => b.value)
      .join("\n\n") + "\n#[cfg(test)] mod verifiche;\n",
  );
  fs.writeFileSync(path.join(dir, "src/verifiche.rs"), checks);
  fs.mkdirSync(path.join(dir, "examples"));
  const host = run("rustc", ["-vV"])
    .match(/^host: (.+)$/m)[1]
    .trim();
  run("cargo", ["fetch", "--target", host]);
  console.log(
    run("cargo", ["tree", "--locked", "--offline", "--depth", "1"]).trim(),
  );
});
after(() => {
  if (!root) return;
  const p = fs.realpathSync(root);
  assert.equal(path.dirname(p), tmp);
  assert.ok(path.basename(p).startsWith("vault-diesel-"));
  fs.rmSync(p, { recursive: true, maxRetries: 4, retryDelay: 250 });
});

test("scheda Diesel: sei test Rust sui modelli e sulle migrazioni del Markdown", () => {
  const out = run("cargo", ["test", "--lib", "--locked", "--offline"]);
  assert.match(out, /test result: ok\. 6 passed; 0 failed; 0 ignored;/);
  console.log(out.split("test result:")[0].trim());
});

for (const [name, expr, expected] of [
  [
    "filtro_intero",
    "let _ = notes::table.filter(notes::slug.eq(42_i32));",
    /AsExpression|Expression/,
  ],
  [
    "null_non_opzionale",
    "let _ = notes::table.select(notes::summary).load::<String>(conn);",
    /FromSql|CompatibleType|Nullable/,
  ],
]) {
  test("il DSL rifiuta in compilazione: " + name, () => {
    const file = path.join(dir, "examples", name + ".rs");
    fs.writeFileSync(
      file,
      [
        "use archivio_diesel::schema::notes;",
        "use diesel::prelude::*;",
        "fn query(conn: &mut SqliteConnection) {",
        expr,
        "}",
        "fn main() {}",
        "",
      ].join("\n"),
    );
    const out = run(
      "cargo",
      ["check", "--example", name, "--locked", "--offline"],
      { failure: true },
    );
    assert.match(out, /error\[E0\d+\]/);
    assert.match(out, expected);
    assert.ok(out.includes(name + ".rs"), out);
  });
}
