import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import YAML from "../../site/node_modules/yaml/dist/index.js";
import { parseNote } from "../../site/scripts/vault.mjs";
import { fixture } from "./github-git-fixture.mjs";

function blocks(page, lang, count = 1) {
  const { tree } = parseNote("Programmazione/GitHub/Pagine/" + page + ".md");
  const found = tree.children
    .filter((n) => n.type === "code" && n.lang === lang)
    .map((n) => n.value);
  assert.equal(found.length, count, page);
  return found;
}

function command(bin, args, cwd, env = {}, expected = 0) {
  const r = spawnSync(bin, args, {
    cwd,
    env: { ...process.env, ...env },
    encoding: "utf8",
    windowsHide: true,
    timeout: 30000,
  });
  assert.ifError(r.error);
  assert.equal(r.status, expected, r.stderr || r.stdout);
  return r.stdout.trim();
}

function shell(script, dir, env, status) {
  return command(
    "pwsh",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    dir,
    env,
    status,
  );
}

test("Il controllo pre-upload rifiuta una home mancante o vuota", (t) => {
  const { dir } = fixture(t);
  const [cmd] = blocks("Deploy con GitHub Actions", "bash");
  const script = /^node -e "([^"]+)"$/.exec(cmd)?.[1];
  assert.ok(script);
  const html = path.join(dir, "site/public/index.html");
  fs.mkdirSync(path.dirname(html), { recursive: true });
  command(process.execPath, ["-e", script], dir, {}, 1);
  fs.writeFileSync(html, "");
  command(process.execPath, ["-e", script], dir, {}, 1);
  fs.writeFileSync(html, "<h1>Home</h1>");
  command(process.execPath, ["-e", script], dir);
});

test("Environment: etichetta presente e assente; il frammento di review protegge il job atteso", (t) => {
  const { dir } = fixture(t);
  const wf = YAML.parse(blocks("Environments GitHub Actions", "yaml")[0]);
  const job = wf.jobs.verifica,
    [step] = job.steps;
  assert.deepEqual(wf.permissions, {});
  assert.equal(job.environment, "staging");
  assert.equal(step.env.SITE_LABEL, "${{ vars.SITE_LABEL }}");
  assert.equal(
    shell(step.run, dir, { SITE_LABEL: "Anteprima" }),
    "Destinazione: Anteprima",
  );
  shell(step.run, dir, { SITE_LABEL: " " }, 1);
  const gate = YAML.parse(
    blocks("Deployment approvals GitHub Actions", "yaml")[0],
  );
  assert.equal(gate.environment, "production");
  assert.equal(gate.needs, "build");
});

test("Release: lo ZIP contiene solo il README del commit, non il worktree", (t) => {
  const { repo, run } = fixture(t);
  const dir = repo("release");
  const wf = YAML.parse(blocks("Release automation GitHub Actions", "yaml")[0]);
  assert.deepEqual(wf.on.push.tags, ["v*"]);
  const job = wf.jobs.bozza;
  assert.deepEqual(job.permissions, { contents: "write" });
  const [, archive, draft] = job.steps;
  const [git, ...args] = archive.run.split(" ");
  assert.equal(git, "git");
  assert.deepEqual(args, [
    "archive",
    "--format=zip",
    "--output=guida.zip",
    "HEAD",
    "--",
    "README.md",
  ]);
  const committed = run(dir, ["show", "HEAD:README.md"]);
  fs.writeFileSync(path.join(dir, "README.md"), "Modifica non committata");
  fs.writeFileSync(path.join(dir, "bozza.txt"), "Non archiviare");
  run(dir, args);
  const listing = shell(
    [
      "$zip = [IO.Compression.ZipFile]::OpenRead((Join-Path (Get-Location) 'guida.zip'))",
      "try { $zip.Entries.FullName; $reader = [IO.StreamReader]::new($zip.GetEntry('README.md').Open()); try { $reader.ReadToEnd().TrimEnd() } finally { $reader.Dispose() } } finally { $zip.Dispose() }",
    ].join("\n"),
    dir,
  );
  assert.deepEqual(listing.split(/\r?\n/), ["README.md", committed]);
  assert.equal(draft.env.TAG, "${{ github.ref_name }}");
  assert.equal(
    draft.run,
    'gh release create "$TAG" guida.zip --verify-tag --draft --generate-notes',
  );
});

test("Pages: i due estratti coincidono con i job del workflow versionato", () => {
  const wf = YAML.parse(
    fs.readFileSync(".github/workflows/deploy-pages.yml", "utf8"),
  );
  const [upload, deploy] = blocks("GitHub Pages con Actions", "yaml", 2).map(
    (s) => YAML.parse(s),
  );
  assert.deepEqual(upload, wf.jobs.build.steps.slice(-1));
  assert.equal(upload[0].with.path, "site/public");
  assert.deepEqual(deploy, wf.jobs.deploy);
  assert.deepEqual(wf.on, {
    push: { branches: ["main"] },
    workflow_dispatch: null,
  });
  assert.deepEqual(wf.permissions, {
    contents: "read",
    pages: "write",
    "id-token": "write",
  });
});

test("Packages: npm pack mostra il contenuto previsto senza pubblicare o creare archivi", (t) => {
  const { dir } = fixture(t);
  const page = "GitHub Packages con Actions";
  const packDir = path.join(dir, "pkg");
  fs.mkdirSync(packDir);
  const pkg = JSON.parse(blocks(page, "json")[0]);
  fs.writeFileSync(path.join(packDir, "package.json"), JSON.stringify(pkg));
  fs.writeFileSync(
    path.join(packDir, "index.js"),
    "export const versione = 1;",
  );
  fs.writeFileSync(path.join(packDir, "bozza.txt"), "Solo locale");
  const [cmd] = blocks(page, "bash");
  assert.equal(cmd, "npm pack --dry-run --ignore-scripts --json");
  const [result] = JSON.parse(
    shell(cmd, packDir, {
      npm_config_cache: path.join(dir, "cache"),
      npm_config_offline: "true",
      npm_config_userconfig: path.join(dir, "empty-npmrc"),
      npm_config_update_notifier: "false",
    }),
  );
  assert.equal(result.name, pkg.name);
  assert.equal(result.version, pkg.version);
  assert.deepEqual(result.files.map((f) => f.path).sort(), [
    "index.js",
    "package.json",
  ]);
  assert.ok(!fs.existsSync(path.join(packDir, result.filename)));
  const [setup, publish] = YAML.parse(blocks(page, "yaml")[0]);
  assert.equal(setup.with["registry-url"], pkg.publishConfig.registry);
  assert.equal(setup.with.scope, pkg.name.split("/")[0]);
  assert.equal(publish.run, "npm publish"); // Verifica dichiarativa: non eseguire.
});

test("OIDC: le condizioni di uguaglianza dell'esempio distinguono ambiente e audience", () => {
  const page = "OIDC GitHub Actions";
  const job = YAML.parse(blocks(page, "yaml")[0]);
  const equals = JSON.parse(blocks(page, "json")[0]).StringEquals;
  assert.deepEqual(job.permissions, { contents: "read", "id-token": "write" });
  const prefix = "token.actions.githubusercontent.com:";
  const sub = "repo:esempio@123456/guida@456789:environment:" + job.environment;
  const matches = (aud, subject) =>
    equals[prefix + "aud"] === aud && equals[prefix + "sub"] === subject;
  assert.equal(matches("sts.amazonaws.com", sub), true);
  assert.equal(
    matches("sts.amazonaws.com", sub.replace(":production", ":staging")),
    false,
  );
  assert.equal(matches("altro.example", sub), false);
  assert.equal(
    matches("sts.amazonaws.com", "repo:esempio/guida:environment:production"),
    false,
  );
});
