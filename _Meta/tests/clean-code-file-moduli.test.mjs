import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { parseNote, vaultRoot } from "../../site/scripts/vault.mjs";
import { run } from "./typescript-examples.mjs";

function blocks(title, lang) {
  return parseNote(`Programmazione/Clean Code/Pagine/${title}.md`).tree.children
    .filter((node) => node.type === "code" && node.lang === lang)
    .map((node) => node.value);
}

function workspace(t) {
  const root = path.resolve(tmpdir());
  const dir = mkdtempSync(path.join(root, "clean-code-files-"));
  t.after(() => {
    assert.equal(path.dirname(dir), root);
    assert.ok(path.basename(dir).startsWith("clean-code-files-"));
    rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

function checkProcess(executable, args, cwd, env = process.env, expected = 0) {
  const result = spawnSync(executable, args, { cwd, env, encoding: "utf8", timeout: 30_000 });
  assert.ifError(result.error);
  assert.equal(result.status, expected, result.stderr + result.stdout);
}

test("Tariffe: soglia inclusiva ed errore per un peso non valido", async () => {
  const [source] = blocks("Moduli piccoli", "js");
  const { shippingFeeCents: quote } = await import("data:text/javascript," + encodeURIComponent(source));
  for (const [weight, fee] of [[1, 390], [500, 390], [501, 590]]) assert.equal(quote(weight), fee);
  for (const weight of [0, -1, 2.5, "500", NaN, Infinity]) assert.throws(() => quote(weight), RangeError);
});

test("Dipendenze: fattura a orario fissato, inserimento una volta per chiamata, errore propagato", async () => {
  const [source] = blocks("Dipendenze esplicite", "ts");
  const { value: make } = run(source, "makeIssueInvoice");
  const saved = [];
  let now = 1000;
  const issue = make({ nowMs: () => now++, insert: async (draft) => { saved.push(structuredClone(draft)); return "inv-7"; } });
  assert.equal(await issue("order-3"), "inv-7");
  await issue("order-3");
  assert.deepEqual(saved, [{ orderId: "order-3", issuedAtMs: 1000 }, { orderId: "order-3", issuedAtMs: 1001 }]);
  const offline = new Error("offline");
  const fails = make({ nowMs: () => 1000, insert: async () => { throw offline; } });
  await assert.rejects(fails("order-3"), (err) => err === offline);
});

test("Package exports: ingresso stabile, import interno vietato anche col file presente", (t) => {
  const root = workspace(t);
  const pkg = path.join(root, "node_modules", "@app", "shipping");
  mkdirSync(pkg, { recursive: true });
  const [manifest] = blocks("Confini tra moduli", "json");
  const [facade, client] = blocks("Confini tra moduli", "js");
  const [rates] = blocks("Moduli piccoli", "js");
  writeFileSync(path.join(pkg, "package.json"), manifest);
  writeFileSync(path.join(pkg, "rates.mjs"), rates);
  writeFileSync(path.join(pkg, "index.mjs"), facade);
  writeFileSync(path.join(root, "client.mjs"), client + '\nimport assert from "node:assert/strict";\nassert.equal(fee, 590);');
  checkProcess(process.execPath, ["client.mjs"], root);
  checkProcess(process.execPath, ["--input-type=module", "-e", `
    import assert from "node:assert/strict";
    await assert.rejects(import("@app/shipping/rates.mjs"), { code: "ERR_PACKAGE_PATH_NOT_EXPORTED" });
  `], root);
  renameSync(path.join(pkg, "rates.mjs"), path.join(pkg, "bands.mjs"));
  writeFileSync(path.join(pkg, "index.mjs"), facade.replace("./rates.mjs", "./bands.mjs"));
  checkProcess(process.execPath, ["client.mjs"], root);
});

test("TODO: zero precede il legacy; il nuovo campo invalido non viene mascherato", () => {
  const [source] = blocks("Commenti temporanei e TODO", "js");
  const price = Function('"use strict";\n' + source + '\nreturn readUnitPriceCents;')();
  assert.equal(price({ price_cents: 42 }), 42);
  assert.equal(price({ unitPriceCents: 55 }), 55);
  assert.equal(price({ unitPriceCents: 0, price_cents: 42 }), 0);
  for (const value of [null, -1, "17", 1.5]) {
    assert.throws(() => price({ unitPriceCents: value, price_cents: 42 }), RangeError);
  }
  assert.throws(() => price({}), RangeError);
});

test("Convenzioni: check non scrive, write corregge soltanto il file in ambito", (t) => {
  const root = workspace(t);
  const [config, manifest] = blocks("Convenzioni di progetto", "json");
  const commands = blocks("Convenzioni di progetto", "sh");
  assert.deepEqual(commands, ["npm run format:check", "npm run format:write"]);
  writeFileSync(path.join(root, ".prettierrc.json"), config);
  writeFileSync(path.join(root, "package.json"), manifest);
  const env = { ...process.env };
  const key = Object.keys(env).find((name) => name.toUpperCase() === "PATH");
  env[key] = path.join(vaultRoot, "site", "node_modules", ".bin") + path.delimiter + env[key];
  function npmRun(script, expected) {
    if (process.platform === "win32") checkProcess("cmd.exe", ["/d", "/c", script], root, env, expected);
    else checkProcess("npm", script.split(" ").slice(1), root, env, expected);
  }
  const read = (name) => readFileSync(path.join(root, name), "utf8");
  const raw = 'export const name="light"\n';
  for (const name of ["rates.mjs", "untouched.mjs"]) writeFileSync(path.join(root, name), raw);
  npmRun(commands[0], 1);
  assert.equal(read("rates.mjs"), raw);
  npmRun(commands[1], 0);
  assert.equal(read("rates.mjs").trimEnd(), "export const name = 'light';");
  assert.equal(read("untouched.mjs"), raw);
  npmRun(commands[0], 0);
});
