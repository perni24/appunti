import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/Serde e serializzazione.md",
).tree.children.filter((b) => b.type === "code");

const checks = `use super::*;
use serde_json::{error::Category, from_reader, from_slice, from_str, from_value, json, to_value};

#[test]
fn assenza_null_e_tipi() {
    let omitted: CreateIssue = from_value(json!({"title":"A"})).unwrap();
    assert!(omitted.labels.is_empty());
    assert_eq!(omitted.assignee, None);
    let explicit: CreateIssue = from_value(json!({"title":"A","assignee":null})).unwrap();
    assert_eq!(explicit.assignee, None);
    for invalid in [json!({}), json!({"title":null}), json!({"title":4}),
        json!({"title":"A","labels":null}), json!({"title":"A","labels":"test"}),
        json!({"title":"A","labels":[1]}), json!({"title":"A","assignee":false})] {
        let err = from_value::<CreateIssue>(invalid).err().expect("errore strutturale");
        assert_eq!(err.classify(), Category::Data);
    }
}

#[test]
fn alias_duplicati_e_campi_sconosciuti() {
    for input in [r#"{"summary":"A"}"#, r#"{"title":"A"}"#] {
        assert_eq!(from_str::<CreateIssue>(input).unwrap().title, "A");
    }
    for invalid in [r#"{"title":"A","summary":"B"}"#, r#"{"summary":"B","title":"A"}"#,
                    r#"{"title":"A","lables":[]}"#] {
        assert_eq!(from_str::<CreateIssue>(invalid).err().unwrap().classify(), Category::Data);
    }
    #[derive(Deserialize)]
    struct Reader { id: u64 }
    assert_eq!(from_value::<Reader>(json!({"id":7,"futureField":42})).unwrap().id, 7);
}

#[test]
fn patch_conserva_cancella_sostituisce() {
    let input = from_value(json!({"title":"A","assignee":"Ada","labels":["rust"]})).unwrap();
    let mut issue = Issue::create(7, input).unwrap();
    for (patch, expected) in [(json!({}), Some("Ada")), (json!({"assignee":null}), None),
                              (json!({"assignee":"Lia"}), Some("Lia"))] {
        issue.apply(from_value(patch).unwrap());
        assert_eq!(issue.assignee.as_deref(), expected);
        let view = to_value(IssueResponse::from(&issue)).unwrap();
        assert_eq!(view.get("assignee"), expected.map(|s| json!(s)).as_ref());
        assert_eq!(view["labels"], json!(["rust"]));
    }
    assert!(from_value::<PatchIssue>(json!({"assignee":12})).is_err());
    assert_eq!(issue.assignee.as_deref(), Some("Lia"));
    #[derive(Deserialize)]
    struct Plain { assignee: Option<Option<String>> }
    for doc in [json!({}), json!({"assignee":null})] {
        assert_eq!(from_value::<Plain>(doc).unwrap().assignee, None);
    }
}

#[test]
fn eventi_usano_un_tag_stabile() {
    for (event, wire) in [
        (IssueEvent::IssueOpened { id:7 }, json!({"type":"issue_opened","id":7})),
        (IssueEvent::AssigneeChanged { id:7, assignee:None }, json!({"type":"assignee_changed","id":7,"assignee":null})),
    ] {
        assert_eq!(to_value(&event).unwrap(), wire);
        assert_eq!(from_value::<IssueEvent>(wire).unwrap(), event);
    }
    for invalid in [json!({"type":"unknown","id":7}), json!({"id":7})] {
        assert_eq!(from_value::<IssueEvent>(invalid).unwrap_err().classify(), Category::Data);
    }
}

#[test]
fn errori_del_formato_e_del_dominio() {
    for (text, expected) in [("{", Category::Eof), ("{!}", Category::Syntax),
                              (r#"{"title":[]}"#, Category::Data)] {
        assert_eq!(from_str::<CreateIssue>(text).err().unwrap().classify(), expected);
    }
    struct Broken;
    impl std::io::Read for Broken {
        fn read(&mut self, _: &mut [u8]) -> std::io::Result<usize> { Err(std::io::Error::other("lettura fallita")) }
    }
    assert_eq!(from_reader::<_, CreateIssue>(Broken).err().unwrap().classify(), Category::Io);
    let valid_json = from_str(r#"{"title":"   "}"#).unwrap();
    assert_eq!(Issue::create(7, valid_json).err(), Some("empty_title"));
}

#[test]
fn prestito_da_slice_e_dati_owned_da_reader() {
    #[derive(Deserialize)]
    struct Borrowed<'a> { title: &'a str }
    assert_eq!(from_slice::<Borrowed<'_>>(br#"{"title":"Ada"}"#).unwrap().title,"Ada");
    let escaped = br#"{"title":"A\\u0064a"}"#;
    assert!(from_slice::<Borrowed<'_>>(escaped).is_err());
    let input: CreateIssue = from_reader(&escaped[..]).unwrap();
    assert_eq!(input.title,"Ada");
}
`;

test("contratto Serde: compila i quattro blocchi Rust della nota ed esegue sette prove", () => {
  const tmp = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(tmp, "vault-serde-"));
  const project = path.join(root, "issue-wire");
  const env = {
    ...process.env,
    CARGO_HOME: process.env.CARGO_HOME || path.join(root, "c"),
    CARGO_TARGET_DIR: path.join(root, "t"),
    CARGO_TERM_COLOR: "never",
  };
  function run(bin, args, cwd = project) {
    const r = spawnSync(bin, args, {
      cwd,
      env,
      encoding: "utf8",
      windowsHide: true,
      timeout: 300000,
      maxBuffer: 8 * 1024 * 1024,
    });
    assert.ifError(r.error);
    assert.equal(r.status, 0, [bin, ...args, r.stdout, r.stderr].join("\n"));
    return r.stdout.trim();
  }
  try {
    const create = blocks.find(
      (b) => b.lang === "sh" && b.value.startsWith("cargo new "),
    ).value;
    run("cargo", [...create.split(/\s+/).slice(1), "--vcs", "none"], root);
    fs.appendFileSync(
      path.join(project, "Cargo.toml"),
      blocks.find((b) => b.lang === "toml").value + "\n",
    );
    const rust = blocks.filter((b) => b.lang === "rust");
    assert.equal(rust.length, 4);
    fs.writeFileSync(
      path.join(project, "src/lib.rs"),
      rust.map((b) => b.value).join("\n\n") + "\n#[cfg(test)] mod verifiche;\n",
    );
    fs.writeFileSync(path.join(project, "src/verifiche.rs"), checks);
    const host = run("rustc", ["-vV"])
      .match(/^host: (.+)$/m)[1]
      .trim();
    run("cargo", ["fetch", "--target", host]);
    const out = run("cargo", ["test", "--locked", "--offline", "--lib"]);
    console.log(
      run("cargo", ["tree", "--depth", "1", "--locked", "--offline"]),
    );
    console.log(out);
    assert.match(
      out,
      /tests::dal_vecchio_input_alla_risposta_pubblica \.\.\. ok/,
    );
    assert.match(out, /test result: ok\. 7 passed; 0 failed; 0 ignored;/);
  } finally {
    const p = fs.realpathSync(root);
    assert.equal(path.dirname(p), tmp);
    assert.ok(path.basename(p).startsWith("vault-serde-"));
    fs.rmSync(p, { recursive: true, maxRetries: 4, retryDelay: 250 });
  }
});
