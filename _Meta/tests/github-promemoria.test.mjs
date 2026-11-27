import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import YAML from "../../site/node_modules/yaml/dist/index.js";
import { parseNote } from "../../site/scripts/vault.mjs";
import { fixture } from "./github-git-fixture.mjs";

const folder = "Programmazione/GitHub/Promemoria/Pagine/";
const blocks = (name, lang) =>
  parseNote(folder + "GitHub - " + name + ".md")
    .tree.children.filter((n) => n.type === "code" && n.lang === lang)
    .map((n) => n.value);
const yaml = (name) => blocks(name, "yaml").map((s) => YAML.parse(s));
const deploy = YAML.parse(
  fs.readFileSync(".github/workflows/deploy-pages.yml", "utf8"),
);
const manifest = JSON.parse(fs.readFileSync("site/package.json", "utf8"));

test("Remote: identità locale, cambio URL, rename e remove non toccano il server", (t) => {
  const { run, repo } = fixture(t),
    cwd = repo("clone");
  const cmds = blocks("Repository e remote", "powershell");
  const git = (prefix) => {
    const cmd = cmds.find((c) => c.startsWith(prefix));
    assert.ok(cmd, prefix);
    const args = cmd
      .slice(4)
      .match(/"[^"]*"|[^\s]+/g)
      .map((x) => x.replace(/^"|"$/g, ""));
    return run(cwd, args);
  };
  git("git config --local user.name");
  git("git config --local user.email");
  assert.equal(run(cwd, ["config", "--local", "user.name"]), "Nome Cognome");
  git("git remote add origin");
  git("git remote set-url origin");
  assert.equal(
    git("git remote get-url --push origin"),
    "git@github.com:OWNER/REPO.git",
  );
  git("git remote add upstream");
  git("git remote rename origin");
  git("git remote remove upstream");
  assert.equal(run(cwd, ["remote"]), "github");
});

test("Workflow base: stessi runtime e lockfile del vault, solo controlli senza deploy", () => {
  const [ci, bash, pwsh] = yaml("Workflow Actions di base");
  const job = ci.jobs.verifica,
    dir = job.defaults.run["working-directory"];
  assert.deepEqual(ci.permissions, { contents: "read" });
  assert.equal(ci.concurrency["cancel-in-progress"], true);
  assert.deepEqual(ci.on.pull_request.branches, ["main"]);
  const [checkout, setup, ...checks] = job.steps,
    real = deploy.jobs.build.steps;
  assert.ok(real.some((s) => s.uses === checkout.uses));
  assert.ok(
    real.some(
      (s) =>
        s.uses === setup.uses &&
        String(s.with["node-version"]) === setup.with["node-version"],
    ),
  );
  assert.equal(setup.with["cache-dependency-path"], dir + "/package-lock.json");
  assert.ok(fs.existsSync(setup.with["cache-dependency-path"]));
  assert.deepEqual(
    checks.map((s) => s.run),
    ["npm ci", "npm run content:check", "npm run content:test"],
  );
  assert.ok(
    checks.slice(1).every((s) => manifest.scripts[s.run.split(" ").at(-1)]),
  );
  assert.equal(bash[0].env.PROFILO, pwsh[0].env.PROFILO);
  assert.equal(pwsh[0].shell, "pwsh");
});

test("Trigger: blocchi YAML separati, cron esplicito, conferma dei parametri Pages", () => {
  const [branch, tag, manual, scheduled, condition, release, group] = yaml(
    "Trigger espressioni e permessi Actions",
  );
  assert.deepEqual(branch.on.push, { branches: ["main"], paths: ["site/**"] });
  assert.deepEqual(branch.on.pull_request, { branches: ["main"] });
  assert.deepEqual(tag.on.push.tags, ["v*"]);
  assert.deepEqual(manual.on.workflow_dispatch.inputs.target.options, [
    "staging",
    "production",
  ]);
  assert.deepEqual(scheduled.on.schedule, [
    { cron: "0 3 * * 1", timezone: "Europe/Rome" },
  ]);
  assert.equal(condition[0].if, "failure()");
  assert.deepEqual(release.permissions, { contents: "write" });
  assert.deepEqual(group.concurrency, deploy.concurrency);
});

test("Matrix: report TAP eseguibile e un nome distinto per variante; needs collega produttore e lettore", (t) => {
  const { dir } = fixture(t);
  const [{ test: job }, { leggi }, { build, mostra }] = yaml(
    "Job matrix cache e artifact Actions",
  );
  const matrix = job.strategy.matrix,
    step = job.steps.find((s) => s.id === "prova"),
    upload = job.steps.at(-1);
  const names = matrix.os.flatMap((os) =>
    matrix.node.map((node) =>
      upload.with.name
        .replace("${{ matrix.os }}", os)
        .replace("${{ matrix.node }}", String(node)),
    ),
  );
  assert.equal(new Set(names).size, 4);
  assert.ok(names.includes(leggi.steps[0].with.name));
  assert.equal(leggi.needs, "test");
  assert.equal(build.outputs.version, "${{ steps.meta.outputs.version }}");
  assert.equal(build.steps[0].id, "meta");
  assert.equal(mostra.needs, "build");
  assert.equal(
    mostra.steps[0].env.VERSIONE,
    "${{ needs.build.outputs.version }}",
  );
  const [exe, ...args] = step.run.split(" "),
    cwd = job.defaults.run["working-directory"],
    file = path.basename(upload.with.path);
  assert.equal(exe, "node");
  assert.equal(upload.with.path, cwd + "/" + file);
  const dest = args.indexOf("--test-reporter-destination=" + file);
  assert.notEqual(dest, -1);
  // Stesso comando del runner, con il solo report reindirizzato alla cartella temporanea.
  const out = path.join(dir, file);
  args[dest] = "--test-reporter-destination=" + out;
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, args, {
    cwd,
    env,
    encoding: "utf8",
    timeout: 30000,
    windowsHide: true,
  });
  assert.ifError(r.error);
  assert.equal(r.status, 0, r.stderr);
  assert.match(fs.readFileSync(out, "utf8"), /^# fail 0\s*$/m);
});

test("Environment: con valore fittizio il job non stampa la credenziale; con valore assente si ferma", () => {
  const [{ verifica }, oidc] = yaml("Secrets environments e OIDC Actions"),
    [step] = verifica.steps;
  assert.equal(verifica.environment, "staging");
  assert.deepEqual(verifica.permissions, {});
  assert.deepEqual(oidc.permissions, { "id-token": "write" });
  assert.equal(step.env.API_TOKEN, "${{ secrets.API_TOKEN }}");
  for (const token of ["", "fittizio-non-divulgare"]) {
    const env = Object.fromEntries(
      Object.entries(process.env).filter(
        ([k]) => k.toUpperCase() !== "API_TOKEN",
      ),
    );
    if (token) env.API_TOKEN = token;
    const r = spawnSync(
      step.shell,
      ["-NoProfile", "-NonInteractive", "-Command", step.run],
      { env, encoding: "utf8", timeout: 15000, windowsHide: true },
    );
    assert.ifError(r.error);
    assert.ok(Number.isInteger(r.status));
    if (token) {
      assert.equal(r.status, 0, r.stderr);
      assert.equal(r.stdout.trim(), "API_TOKEN presente");
      assert.ok(!(r.stdout + r.stderr).includes(token));
    } else {
      assert.notEqual(r.status, 0);
      assert.match(r.stderr, /API_TOKEN non disponibile/);
    }
  }
});

test("Sicurezza: manifest e workflow nei percorsi di Dependabot, checkout fissato al commit citato", () => {
  const name = "Sicurezza repository",
    [dependabot, pin] = yaml(name);
  const dirs = Object.fromEntries(
    dependabot.updates.map((s) => [s["package-ecosystem"], s.directory]),
  );
  assert.deepEqual(dirs, { npm: "/site", "github-actions": "/" });
  assert.ok(fs.existsSync("." + dirs.npm + "/package-lock.json"));
  assert.ok(fs.existsSync(".github/workflows/deploy-pages.yml"));
  const [, sha] = pin[0].uses.match(/^actions\/checkout@([a-f0-9]{40})$/);
  assert.ok(
    parseNote(folder + "GitHub - " + name + ".md").body.includes(
      "https://github.com/actions/checkout/commit/" + sha,
    ),
  );
});
