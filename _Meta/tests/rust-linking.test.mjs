import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/Linking.md",
).tree.children.filter((block) => block.type === "code");
function snippet(lang, marker) {
  const hits = new Set(
    blocks
      .filter((b) => b.lang === lang && b.value.includes(marker))
      .map((b) => b.value),
  );
  assert.equal(hits.size, 1, marker);
  return [...hits][0];
}

function invoke(cwd, program, args, failure = false) {
  const r = spawnSync(program, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    timeout: 90000,
    env: {
      ...process.env,
      CARGO_TARGET_DIR: path.join(cwd, "target"),
      CARGO_NET_OFFLINE: "true",
    },
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  assert.equal(
    r.status === 0,
    !failure,
    [program, ...args, r.stdout, r.stderr].join("\n"),
  );
  return failure ? r.stdout + r.stderr : r.stdout.trim();
}

function command(cwd, marker) {
  const [tool, ...args] = snippet("powershell", marker).split(/\s+/);
  return invoke(cwd, tool, args);
}

function project(t, cSource = snippet("c", "uint32_t gruppi_da_otto")) {
  const temp = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(temp, "vault-rust-linking-"));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(root)), temp);
    assert.ok(path.basename(root).startsWith("vault-rust-linking-"));
    fs.rmSync(root, { recursive: true, maxRetries: 3 });
  });
  command(root, "cargo new");
  const dir = path.join(root, "link-lab");
  const put = (name, body) =>
    fs.writeFileSync(path.join(dir, name), body + "\n");
  fs.mkdirSync(path.join(dir, "native"));
  fs.appendFileSync(
    path.join(dir, "Cargo.toml"),
    "\n" + snippet("toml", "[features]") + "\n",
  );
  put("native/gruppi.c", cSource);
  put("src/main.rs", snippet("rust", "unsafe extern"));
  put("build.rs", snippet("rust", "CARGO_FEATURE_CON_DLL"));
  return dir;
}

const x64 = { skip: process.platform !== "win32" || process.arch !== "x64" };
test("l'archivio statico basta, senza la DLL della funzione", x64, (t) => {
  const dir = project(t);
  command(dir, "/c native");
  command(dir, "lib.exe /nologo");
  assert.equal(command(dir, "cargo run"), "gruppi=2");
  assert.doesNotMatch(command(dir, "dumpbin.exe"), /gruppi_shared\.dll/i);
});

test(
  "la import library serve al link, la DLL serve all'eseguibile",
  x64,
  (t) => {
    const dir = project(t);
    command(dir, "/c native");
    command(dir, "/LD native");
    command(dir, "cargo build --features");
    assert.match(command(dir, "dumpbin.exe"), /\bgruppi_shared\.dll\b/i);
    // Sopprime le finestre di errore del loader solo nel processo di prova e nei suoi figli.
    const missing = invoke(dir, "powershell.exe", [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `$ErrorActionPreference = 'Stop'
Add-Type -Namespace LinkTest -Name ErrorMode -MemberDefinition '[DllImport("kernel32.dll")] public static extern uint SetErrorMode(uint mode);'
[void][LinkTest.ErrorMode]::SetErrorMode(0x8001)
& .\\target\\debug\\link-lab.exe
'{0:X8}' -f [int]$LASTEXITCODE`,
    ]);
    assert.match(
      missing,
      /C0000135$/i,
      "atteso STATUS_DLL_NOT_FOUND: " + missing,
    );
    const [, , src, , dest] = snippet("powershell", "Copy-Item").split(/\s+/);
    fs.copyFileSync(path.join(dir, src), path.join(dir, dest));
    // Avvio dalla sola directory da distribuire, senza Cargo e senza la import library.
    const delivery = path.join(dir, "target/debug");
    assert.ok(!fs.existsSync(path.join(delivery, "gruppi_shared.lib")));
    assert.equal(
      invoke(delivery, path.join(dir, snippet("powershell", ".\\target")), []),
      "gruppi=2",
    );
  },
);

test("cargo check non dimostra che esista l'archivio richiesto", x64, (t) => {
  const dir = project(t);
  invoke(dir, "cargo", ["check"]);
  const diagnostic = invoke(dir, "cargo", ["build"], true);
  assert.match(diagnostic, /gruppi_static\.lib/i);
  assert.match(diagnostic, /LNK(?:1104|1181)/);
});

test(
  "un archivio presente con il simbolo sbagliato non soddisfa la chiamata",
  x64,
  (t) => {
    const dir = project(
      t,
      snippet("c", "uint32_t gruppi_da_otto").replace(
        "gruppi_da_otto",
        "altro_nome",
      ),
    );
    command(dir, "/c native");
    command(dir, "lib.exe /nologo");
    const diagnostic = invoke(dir, "cargo", ["build"], true);
    assert.match(diagnostic, /gruppi_da_otto/);
    assert.match(diagnostic, /LNK(?:2001|2019)/);
  },
);
