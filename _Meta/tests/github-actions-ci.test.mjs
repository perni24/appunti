import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import YAML from "../../site/node_modules/yaml/dist/index.js";
import { parseNote } from "../../site/scripts/vault.mjs";
import { fixture } from "./github-git-fixture.mjs";

const root = "Programmazione/GitHub/Pagine/";
const stepsPage = "Workflow per test, lint e build";
const manifest = JSON.parse(fs.readFileSync("site/package.json", "utf8"));
const deploy = YAML.parse(
  fs.readFileSync(".github/workflows/deploy-pages.yml", "utf8"),
);

function examples(page, count = 1) {
  const blocks = parseNote(root + page + ".md").tree.children.filter(
    (n) => n.type === "code" && n.lang === "yaml",
  );
  assert.equal(blocks.length, count, page);
  return blocks.map((b) => YAML.parse(b.value));
}

test("CI su PR e build: gli step usano la directory e gli script reali", () => {
  const [ci] = examples("Pipeline CI GitHub Actions");
  assert.deepEqual(ci.on, { pull_request: { branches: ["main"] } });
  assert.deepEqual(ci.permissions, { contents: "read" });
  const job = ci.jobs.valida;
  assert.equal(job.defaults.run["working-directory"], "site");
  assert.deepEqual(
    job.steps.filter((s) => s.run).map((s) => s.run),
    ["npm ci", "npm run content:check", "npm run content:test"],
  );
  const [steps] = examples(stepsPage);
  assert.deepEqual(
    steps.map((s) => s.run),
    [
      "npm ci",
      "npm run content:check",
      "npm run content:test",
      "npm run install-plugins",
      "npm run site:build",
    ],
  );
  for (const s of steps) {
    assert.equal(s["working-directory"], "site");
    if (s.run !== "npm ci")
      assert.ok(manifest.scripts[s.run.slice("npm run ".length)]);
  }
  for (const p of [
    "Pipeline CI GitHub Actions",
    "Matrix strategy GitHub Actions",
    "Service containers GitHub Actions",
    "Cache GitHub Actions",
  ]) {
    assert.ok(
      parseNote(root + p + ".md").data.related.includes(
        "[[" + root + stepsPage + "|" + stepsPage + "]]",
      ),
      p,
    );
  }
});

test("Matrix: quattro coppie previste e la versione selezionata arriva al runtime", () => {
  const [wf] = examples("Matrix strategy GitHub Actions");
  const job = wf.jobs.compatibilita,
    { matrix } = job.strategy;
  const original = matrix.os.flatMap((os) =>
    matrix.node.map((node) => ({ os, node })),
  );
  const same = (a, b) => a.os === b.os && a.node === b.node;
  const selected = original.filter(
    (c) => !matrix.exclude.some((x) => same(c, x)),
  );
  // In questo esempio include aggiunge soltanto una piattaforma nuova.
  for (const extra of matrix.include) {
    assert.ok(!matrix.os.includes(extra.os));
    selected.push(extra);
  }
  assert.deepEqual(selected.map((c) => c.os + "/" + c.node).sort(), [
    "macos-latest/24",
    "ubuntu-latest/22",
    "ubuntu-latest/24",
    "windows-latest/24",
  ]);
  assert.equal(job.strategy["max-parallel"], 2);
  assert.equal(job.strategy["fail-fast"], false);
  assert.equal(job["runs-on"], "${{ matrix.os }}");
  assert.equal(
    job.steps.find((s) => s.uses?.startsWith("actions/setup-node@")).with[
      "node-version"
    ],
    "${{ matrix.node }}",
  );
});

test("Cache: entrambi i percorsi operano sul lockfile del sito e installano anche dopo un hit", () => {
  const [integrated, manual] = examples("Cache GitHub Actions", 2);
  const real = deploy.jobs.build.steps.find((s) =>
    s.uses?.startsWith("actions/setup-node@"),
  );
  const file = integrated[0].with["cache-dependency-path"];
  assert.equal(file, real.with["cache-dependency-path"]);
  assert.ok(fs.statSync(file).isFile());
  assert.equal(integrated[0].with.cache, "npm");
  assert.ok(manual[0].with.key.includes("hashFiles('" + file + "')"));
  assert.equal(manual[0].with.path, "~/.npm");
  for (const [, install] of [integrated, manual]) {
    assert.equal(install.run, "npm ci");
    assert.equal(install.if, undefined);
    assert.equal(install["working-directory"], path.posix.dirname(file));
  }
});

test("Artifact: JUnit viene scritto sia per test verdi sia per test rossi", (t) => {
  const { dir } = fixture(t);
  const [[runner, upload], [download]] = examples(
    "Artifacts GitHub Actions",
    2,
  );
  const [bin, ...args] = runner.run.split(" ");
  assert.equal(bin, "node");
  assert.equal(args.at(-1), "site/scripts/content.test.mjs");
  assert.ok(fs.statSync(args.at(-1)).isFile());
  const script = path.join(dir, args.at(-1));
  fs.mkdirSync(path.dirname(script), { recursive: true });
  const report = path.join(dir, upload.with.path);
  for (const pass of [true, false]) {
    fs.writeFileSync(
      script,
      "import test from 'node:test'; import assert from 'node:assert/strict'; test('esempio', () => assert.ok(" +
        pass +
        "));",
    );
    if (fs.existsSync(report)) fs.unlinkSync(report);
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    const r = spawnSync(process.execPath, args, {
      cwd: dir,
      env,
      encoding: "utf8",
      windowsHide: true,
    });
    assert.ifError(r.error);
    assert.equal(r.status, pass ? 0 : 1, r.stderr);
    const xml = fs.readFileSync(report, "utf8");
    assert.match(xml, /<testcase[^>]*name="esempio"/);
    assert.equal(/<failure\b/.test(xml), !pass);
  }
  assert.ok(
    upload.if.includes("!cancelled()") &&
      upload.if.includes("hashFiles('" + upload.with.path + "')"),
  );
  assert.equal(upload.with.name, download.with.name);
  assert.equal(download.with.path, "scaricati");
});

test("Service container: il client usa nome di rete, database e utente dichiarati dal servizio", () => {
  const [wf] = examples("Service containers GitHub Actions");
  const job = wf.jobs.integrazione,
    [client] = job.steps;
  assert.equal(job["runs-on"], "ubuntu-latest");
  assert.equal(job.container, "postgres:16");
  const server = job.services[client.env.PGHOST];
  assert.equal(server.image, job.container);
  assert.equal(server.ports, undefined);
  assert.equal(client.env.PGPORT, "5432");
  assert.equal(client.env.PGDATABASE, server.env.POSTGRES_DB);
  assert.equal(client.env.PGUSER, server.env.POSTGRES_USER);
  assert.equal(client.env.PGPASSWORD, server.env.POSTGRES_PASSWORD);
  assert.ok(
    server.options.includes(
      "pg_isready -U " + client.env.PGUSER + " -d " + client.env.PGDATABASE,
    ),
  );
  assert.match(
    client.run,
    /ON_ERROR_STOP=1.*SELECT current_database\(\), current_user/,
  );
});

test("Permessi: il comando Git distingue un file non tracciato da uno nell'indice", (t) => {
  const [wf] = examples("Permissions GitHub Actions");
  const job = wf.jobs.verifica;
  assert.deepEqual(wf.permissions, {});
  assert.deepEqual(job.permissions, { contents: "read" });
  assert.equal(job.steps[0].with["persist-credentials"], false);
  const [git, ...args] = job.steps[1].run.split(" ");
  assert.equal(git, "git");
  assert.deepEqual(args, ["ls-files", "--error-unmatch", "--", "Home.md"]);
  const { dir, run } = fixture(t);
  run(dir, ["init", "-q"]);
  fs.writeFileSync(path.join(dir, "Home.md"), "# Home\n");
  run(dir, args, false);
  run(dir, ["add", "--", "Home.md"]);
  assert.equal(run(dir, args), "Home.md");
  assert.deepEqual(deploy.permissions, {
    contents: "read",
    pages: "write",
    "id-token": "write",
  });
});
