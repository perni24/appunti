import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/Packaging e release.md",
).tree.children.filter((b) => b.type === "code");
function snippet(lang, prefix) {
  const found = blocks.filter(
    (b) => b.lang === lang && b.value.startsWith(prefix),
  );
  assert.equal(found.length, 1, prefix);
  return found[0].value;
}
const tmp = fs.realpathSync(os.tmpdir());
let root, project, env, windows, archive;
const pkg = "etichetta-build-0.1.0";
const target = "x86_64-pc-windows-msvc";
const files = ["LICENSE.txt", "README.md", "etichetta-build.exe"];

function run(bin, args, cwd = project, status = 0) {
  const r = spawnSync(bin, args, {
    cwd,
    env,
    encoding: "utf8",
    windowsHide: true,
    timeout: 120000,
  });
  assert.ifError(r.error);
  assert.equal(r.status, status, [bin, ...args, r.stdout, r.stderr].join("\n"));
  return r.stdout.trim().replaceAll("\r\n", "\n");
}
function cargo(cmd, lang = "sh", cwd = project) {
  return run(
    "cargo",
    snippet(lang, "cargo " + cmd)
      .split(/\s+/)
      .slice(1),
    cwd,
  );
}
function ps(cmd) {
  return run("powershell.exe", [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    "$ErrorActionPreference = 'Stop'; " + cmd,
  ]);
}
before(() => {
  root = fs.mkdtempSync(path.join(tmp, "vault-pkg-"));
  project = path.join(root, "etichetta-build");
  env = {
    ...process.env,
    CARGO_HOME: path.join(root, "c"),
    CARGO_NET_OFFLINE: "true",
    CARGO_TERM_COLOR: "never",
    CARGO_TARGET_DIR: path.join(project, "target"),
  };
  // Windows PowerShell must discover its own modules, even when Node runs under pwsh.
  for (const key of Object.keys(env)) {
    if (key.toLowerCase() === "psmodulepath") delete env[key];
  }
  windows =
    process.platform === "win32" &&
    run("rustc", ["-vV"], root).includes("host: " + target);
  cargo("new", "sh", root);
  fs.writeFileSync(
    path.join(project, "Cargo.toml"),
    snippet("toml", "[package]") + "\n",
  );
  fs.writeFileSync(
    path.join(project, "src", "main.rs"),
    snippet("rust", "fn main()") + "\n",
  );
  fs.writeFileSync(
    path.join(project, "README.md"),
    "Avvia etichetta-build per leggerne la versione.\n",
  );
  fs.copyFileSync(
    fileURLToPath(new URL("../../site/LICENSE.txt", import.meta.url)),
    path.join(project, "LICENSE.txt"),
  );
  fs.writeFileSync(
    path.join(project, "solo-locale.txt"),
    "file di prova escluso",
  );
  cargo("generate-lockfile");
});
after(() => {
  if (!root) return;
  const p = fs.realpathSync(root);
  assert.equal(path.dirname(p), tmp);
  assert.ok(path.basename(p).startsWith("vault-pkg-"));
  fs.rmSync(p, { recursive: true, maxRetries: 4, retryDelay: 250 });
});

test("la lista del pacchetto include gli input attesi e non il file personale", () => {
  const listed = cargo("package --list").replaceAll("\\", "/").split("\n");
  for (const entry of [
    "Cargo.toml",
    "Cargo.lock",
    "src/main.rs",
    "README.md",
    "LICENSE.txt",
  ])
    assert.ok(listed.includes(entry), entry);
  assert.ok(!listed.includes("solo-locale.txt"));
});

test("il .crate effettivo contiene sorgenti e manifest normalizzato, non il binario", () => {
  cargo("package --locked");
  const file = path.join(project, "target", "package", pkg + ".crate");
  const entries = run("tar", ["-tf", file]).split("\n");
  assert.ok(entries.every((e) => e.startsWith(pkg + "/")));
  for (const entry of [
    "Cargo.toml",
    "Cargo.toml.orig",
    "Cargo.lock",
    "README.md",
    "LICENSE.txt",
    "src/main.rs",
  ])
    assert.ok(entries.includes(pkg + "/" + entry), entry);
  assert.equal(
    run("tar", ["-xOf", file, pkg + "/src/main.rs"]),
    snippet("rust", "fn main()"),
  );
  assert.ok(!entries.some((e) => /\.exe$|solo-locale\.txt$/.test(e)));
});

function buildArchive() {
  if (archive) return archive;
  cargo("build --release", "powershell");
  ps(snippet("powershell", "Compress-Archive"));
  archive = path.join(project, pkg + "-" + target + ".zip");
  return archive;
}

test("la CLI estratta dallo ZIP gira dalla sua directory e riporta la versione", (t) => {
  if (!windows) return t.skip("Esempio PowerShell per Windows x64 MSVC");
  buildArchive();
  ps(snippet("powershell", "Expand-Archive"));
  const extracted = path.join(project, "prova-release");
  assert.deepEqual(fs.readdirSync(extracted).sort(), files);
  assert.equal(
    ps(snippet("powershell", ".\\prova-release")),
    "etichetta-build 0.1.0",
  );
  assert.equal(
    run(path.join(extracted, "etichetta-build.exe"), [], extracted),
    "etichetta-build 0.1.0",
  );
});

test("il digest documentato corrisponde ai byte dello ZIP consegnato", (t) => {
  if (!windows) return t.skip("Esempio PowerShell per Windows x64 MSVC");
  const file = buildArchive();
  const hash = ps("(" + snippet("powershell", "Get-FileHash") + ").Hash");
  assert.equal(
    hash.toLowerCase(),
    createHash("sha256").update(fs.readFileSync(file)).digest("hex"),
  );
});
