import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import YAML from "../../site/node_modules/yaml/dist/index.js";
import { parseNote } from "../../site/scripts/vault.mjs";
import { fixture } from "./github-git-fixture.mjs";

const pages = "Programmazione/GitHub/Pagine/";
const ci = "Configurare una pipeline CI con GitHub Actions";
const canonicalCI = "Pipeline CI GitHub Actions";
const deploy = YAML.parse(
  fs.readFileSync(".github/workflows/deploy-pages.yml", "utf8"),
);
const note = (name) => parseNote(pages + name + ".md");
const blocks = (name, lang) =>
  note(name)
    .tree.children.filter((n) => n.type === "code" && n.lang === lang)
    .map((n) => n.value);
const yaml = (name) => YAML.parse(blocks(name, "yaml")[0]);

test("Progetto locale: il primo push verso un remoto vuoto imposta l'upstream", (t) => {
  const { dir, run, repo, example } = fixture(t),
    p = repo("locale"),
    n = "Creare un repository GitHub";
  const dest = path.join(dir, "dest.git");
  run(dir, ["init", "--bare", "-b", "main", dest]);
  assert.equal(example(n, "git remote -v", p), "");
  example(n, "git remote add origin https://github.com/OWNER/REPO.git", p, [
    "remote",
    "add",
    "origin",
    dest,
  ]);
  assert.equal(example(n, "git branch --show-current", p), "main");
  example(n, "git push --set-upstream origin main", p);
  assert.equal(
    run(p, ["rev-parse", "--abbrev-ref", "@{upstream}"]),
    "origin/main",
  );
  assert.equal(run(dest, ["rev-parse", "main"]), run(p, ["rev-parse", "HEAD"]));
  assert.ok(
    blocks(n, "bash").includes(
      "gh repo create OWNER/REPO --private --add-readme --clone",
    ),
  );
});

test("PR: il confronto a tre punti esclude le modifiche arrivate solo sulla base", (t) => {
  const { run, repo, example } = fixture(t),
    p = repo("pr"),
    n = "Aprire una pull request corretta";
  run(p, ["update-ref", "refs/remotes/origin/main", "HEAD"]);
  example(n, "git switch --no-track -c docs/setup origin/main", p);
  fs.appendFileSync(path.join(p, "README.md"), "Prerequisito: Node 24\n");
  fs.writeFileSync(path.join(p, "privato.txt"), "non versionare\n");
  example(n, "git add -- README.md", p);
  assert.match(example(n, "git diff --cached", p), /Prerequisito: Node 24/);
  example(n, 'git commit -m "Chiarisci i prerequisiti di avvio"', p, [
    "commit",
    "-m",
    "Chiarisci i prerequisiti di avvio",
  ]);
  run(p, ["switch", "main"]);
  fs.writeFileSync(path.join(p, "solo-base.md"), "indipendente\n");
  run(p, ["add", "solo-base.md"]);
  run(p, ["commit", "-qm", "cambio parallelo"]);
  run(p, ["update-ref", "refs/remotes/origin/main", "HEAD"]);
  run(p, ["switch", "docs/setup"]);
  assert.equal(
    example(n, "git diff --name-status origin/main...HEAD", p),
    "M\tREADME.md",
  );
  assert.match(
    run(p, ["diff", "--name-status", "origin/main", "HEAD"]),
    /solo-base\.md/,
  );
});

test("Protezione: il check citato è il job su PR e non il deploy Pages", () => {
  const validation = yaml(canonicalCI);
  assert.deepEqual(validation.on.pull_request.branches, ["main"]);
  assert.ok(
    note("Configurare branch protection").body.includes(
      "`" + validation.jobs.valida.name + "`",
    ),
  );
  assert.ok(!Object.hasOwn(deploy.on, "pull_request"));
});

test("CI: il frammento estende i trigger, mantenendo comandi e directory dell'esempio collegato", () => {
  const template = yaml(canonicalCI),
    triggers = yaml(ci),
    job = template.jobs.valida;
  assert.deepEqual(triggers, {
    on: {
      pull_request: { branches: ["main"] },
      push: { branches: ["main"] },
      merge_group: null,
    },
  });
  assert.deepEqual(template.permissions, { contents: "read" });
  const dir = job.defaults.run["working-directory"];
  const scripts = JSON.parse(
    fs.readFileSync(path.join(dir, "package.json"), "utf8"),
  ).scripts;
  const commands = job.steps.filter((s) => s.run).map((s) => s.run);
  assert.deepEqual(
    blocks(ci, "bash"),
    commands.map((cmd) => cmd.replace(/^npm /, "npm --prefix " + dir + " ")),
  );
  assert.ok(
    commands.slice(1).every((cmd) => scripts[cmd.slice("npm run ".length)]),
  );
  assert.ok(
    note(ci).data.related.includes(
      "[[Programmazione/GitHub/Pagine/Workflow per test, lint e build|Workflow per test, lint e build]]",
    ),
  );
});

test("Pages: le istruzioni puntano agli script, al percorso e all'artifact effettivi", () => {
  const n = "Pubblicare documentazione con GitHub Pages",
    steps = deploy.jobs.build.steps;
  const cmd = steps.find((s) => s.run === "npm run site:build");
  assert.equal(cmd["working-directory"], "site");
  assert.deepEqual(blocks(n, "bash"), [
    "npm --prefix site run site:build",
    "npm --prefix site run site:preview",
  ]);
  const scripts = JSON.parse(
    fs.readFileSync("site/package.json", "utf8"),
  ).scripts;
  assert.ok(scripts["site:preview"] && scripts["site:build"]);
  const artifact = steps.find((s) =>
    s.uses?.startsWith("actions/upload-pages-artifact@"),
  ).with.path;
  assert.ok(note(n).body.includes("`" + artifact + "/index.html`"));
  const config = YAML.parse(fs.readFileSync("site/quartz.config.yaml", "utf8"));
  assert.ok(
    note(n).body.includes(
      "`" + new URL("https://" + config.configuration.baseUrl).pathname + "/`",
    ),
  );
  assert.equal(deploy.jobs.deploy.needs, "build");
});

test("Secret di staging: assente o vuoto blocca lo step, il valore fittizio non compare nei log", () => {
  const n = "Gestire secrets in GitHub Actions",
    job = yaml(n).verifica,
    [step] = job.steps;
  assert.deepEqual(job.permissions, {});
  assert.equal(job.environment, "staging");
  assert.equal(step.env.API_TOKEN, "${{ secrets.API_TOKEN }}");
  assert.equal(step.shell, "pwsh");
  for (const cmd of blocks(n, "bash"))
    assert.ok(cmd.includes("--env " + job.environment + " --repo OWNER/REPO"));
  for (const token of [undefined, " ", "valore-fittizio-di-prova"]) {
    const env = Object.fromEntries(
      Object.entries(process.env).filter(
        ([key]) => key.toUpperCase() !== "API_TOKEN",
      ),
    );
    if (token !== undefined) env.API_TOKEN = token;
    const r = spawnSync(
      "pwsh",
      ["-NoProfile", "-NonInteractive", "-Command", step.run],
      { env, encoding: "utf8", timeout: 20000, windowsHide: true },
    );
    assert.ifError(r.error);
    assert.ok(Number.isInteger(r.status));
    if (!token?.trim()) {
      assert.notEqual(r.status, 0);
      assert.match(r.stderr, /API_TOKEN non disponibile/);
    } else {
      assert.equal(r.status, 0, r.stderr);
      assert.equal(r.stdout.trim(), "Credenziale presente");
      assert.ok(!(r.stdout + r.stderr).includes(token));
    }
  }
});
