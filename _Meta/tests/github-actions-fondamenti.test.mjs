import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import YAML from "../../site/node_modules/yaml/dist/index.js";
import { parseNote } from "../../site/scripts/vault.mjs";
import { fixture } from "./github-git-fixture.mjs";

function example(page) {
  const { tree } = parseNote("Programmazione/GitHub/Pagine/" + page + ".md");
  const blocks = tree.children.filter(
    (n) => n.type === "code" && n.lang === "yaml",
  );
  assert.equal(blocks.length, 1, page);
  return YAML.parse(blocks[0].value);
}

function powershell(cwd, script, env = {}, success = true) {
  const result = spawnSync(
    "pwsh",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    {
      cwd,
      env: { ...process.env, ...env },
      encoding: "utf8",
      windowsHide: true,
    },
  );
  assert.ifError(result.error);
  assert.equal(result.status === 0, success, result.stderr);
  return result.stdout.trim();
}

test("Quartz: eventi, artifact e dipendenza del deploy corrispondono al caso reale", () => {
  const wf = YAML.parse(
    fs.readFileSync(".github/workflows/deploy-pages.yml", "utf8"),
  );
  assert.deepEqual(wf.on, {
    push: { branches: ["main"] },
    workflow_dispatch: null,
  });
  const { build, deploy } = wf.jobs;
  const upload = build.steps.find((s) =>
    s.uses?.startsWith("actions/upload-pages-artifact@"),
  );
  assert.equal(upload.with.path, "site/public");
  assert.equal(deploy.needs, "build");
  assert.equal(deploy.environment.name, "github-pages");
  const publish = deploy.steps.find((s) =>
    s.uses?.startsWith("actions/deploy-pages@"),
  );
  assert.equal(
    deploy.environment.url,
    "${{ steps." + publish.id + ".outputs.page_url }}",
  );
});

test("CI in sola lettura: lockfile, comandi e directory corrispondono al vault", () => {
  const wf = example("Workflow GitHub Actions");
  assert.deepEqual(wf.on, { pull_request: { branches: ["main"] } });
  assert.deepEqual(wf.permissions, { contents: "read" });
  const job = wf.jobs.controlla;
  const dir = job.defaults.run["working-directory"];
  const [checkout, setup, install, ...checks] = job.steps;
  assert.match(checkout.uses, /^actions\/checkout@/);
  assert.match(setup.uses, /^actions\/setup-node@/);
  assert.equal(setup.with["cache-dependency-path"], dir + "/package-lock.json");
  assert.ok(fs.existsSync(setup.with["cache-dependency-path"]));
  assert.equal(install.run, "npm ci");
  const { scripts } = JSON.parse(
    fs.readFileSync(path.join(dir, "package.json"), "utf8"),
  );
  assert.deepEqual(
    checks.map((s) => s.run),
    ["npm run content:check", "npm run content:test"],
  );
  for (const { run } of checks)
    assert.ok(scripts[run.slice("npm run ".length)]);
});

test("Trigger didattici: il filtro percorsi vale solo per la PR; checkout usa uno SHA", () => {
  const { on } = example("Eventi e trigger GitHub Actions");
  assert.deepEqual(on.push, { branches: ["main"] });
  assert.deepEqual(on.pull_request, {
    branches: ["main"],
    paths: ["Programmazione/**", "site/**"],
  });
  assert.equal(on.workflow_dispatch, null);
  const [checkout] = example("Actions marketplace");
  assert.match(checkout.uses, /^actions\/checkout@[0-9a-f]{40}$/);
  assert.equal(checkout.with["persist-credentials"], false);
});

test("Output: il primo script scrive il nome, il secondo lo usa senza il workspace", (t) => {
  const { dir } = fixture(t);
  const { leggi, mostra } = example("Jobs steps e runners").jobs;
  const producer = leggi.steps.find((s) => s.id === "lettura");
  const [consumer] = mostra.steps;
  assert.equal(leggi.outputs.nome, "${{ steps.lettura.outputs.nome }}");
  assert.equal(mostra.needs, "leggi");
  assert.equal(consumer.env.PACKAGE_NAME, "${{ needs.leggi.outputs.nome }}");
  const output = path.join(dir, "step-output");
  powershell(process.cwd(), producer.run, { GITHUB_OUTPUT: output });
  const name = JSON.parse(fs.readFileSync("site/package.json", "utf8")).name;
  assert.equal(fs.readFileSync(output, "utf8").trim(), "nome=" + name);
  assert.equal(
    powershell(dir, consumer.run, { PACKAGE_NAME: name }),
    "Pacchetto: " + name,
  );
  powershell(dir, consumer.run, { PACKAGE_NAME: "" }, false);
});

test("YAML: Home mancante blocca lo step; il conteggio considera solo i Markdown", (t) => {
  const { dir } = fixture(t);
  const wf = example("Sintassi YAML GitHub Actions");
  const { esteso } = wf.on.workflow_dispatch.inputs;
  assert.equal(esteso.type, "boolean");
  assert.equal(esteso.default, false);
  const [, guard, count] = wf.jobs.verifica.steps;
  assert.equal(count.if, "inputs.esteso");
  powershell(dir, guard.run, {}, false);
  fs.writeFileSync(path.join(dir, "Home.md"), "# Home\n");
  powershell(dir, guard.run);
  const sub = path.join(dir, "Programmazione", "Pagine");
  fs.mkdirSync(sub, { recursive: true });
  for (const file of ["A.md", "B.md", "C.txt"])
    fs.writeFileSync(path.join(sub, file), "test");
  assert.equal(powershell(dir, count.run), "2");
});

test("Configurazione: lo script distingue assenza e presenza senza stampare il valore", (t) => {
  const { dir } = fixture(t);
  const wf = example("Variabili e secrets GitHub Actions");
  assert.deepEqual(wf.permissions, {});
  const job = wf.jobs.verifica;
  assert.equal(job.env.REPORT_KIND, "${{ vars.REPORT_KIND || 'anteprima' }}");
  const [step] = job.steps;
  assert.equal(step.env.REPORT_TOKEN, "${{ secrets.REPORT_TOKEN }}");
  for (const [token, expected] of [
    ["", "non disponibile"],
    ["valore-fittizio", "disponibile"],
  ]) {
    const result = powershell(dir, step.run, {
      REPORT_KIND: "anteprima",
      REPORT_TOKEN: token,
    });
    assert.deepEqual(result.split(/\r?\n/), [
      "Tipo di report: anteprima",
      "Credenziale " + expected,
    ]);
  }
});
