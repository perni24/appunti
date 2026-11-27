import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import YAML from "../../site/node_modules/yaml/dist/index.js";
import { parseNote } from "../../site/scripts/vault.mjs";
import { fixture } from "./github-git-fixture.mjs";

function blocks(topic, lang) {
  return parseNote(
    "Programmazione/GitHub/Pagine/Troubleshooting " + topic + ".md",
  )
    .tree.children.filter((n) => n.type === "code" && n.lang === lang)
    .map((n) => n.value);
}

test("PR: due commit in più possono lasciare vuoto il diff a tre punti", (t) => {
  const { repo, run, example } = fixture(t),
    cwd = repo("pr"),
    n = "Troubleshooting pull request";
  run(cwd, ["update-ref", "refs/remotes/origin/main", "HEAD"]);
  run(cwd, ["switch", "-c", "proposta"]);
  const file = path.join(cwd, "README.md"),
    initial = fs.readFileSync(file);
  fs.appendFileSync(file, "Passo aggiunto\n");
  run(cwd, ["commit", "-qam", "aggiunta"]);
  fs.writeFileSync(file, initial);
  run(cwd, ["commit", "-qam", "ripristino"]);
  assert.equal(
    example(n, "git log --oneline origin/main..HEAD", cwd).split(/\r?\n/)
      .length,
    2,
  );
  assert.equal(
    example(n, "git diff --name-status origin/main...HEAD", cwd),
    "",
  );
});

test("Merge: conflitto reale, abort, marcatori preparati per errore e risoluzione verificata", (t) => {
  const { repo, run, example } = fixture(t),
    cwd = repo("conflitto"),
    n = "Troubleshooting merge conflict";
  const file = path.join(cwd, "README.md");
  run(cwd, ["branch", "proposta"]);
  fs.writeFileSync(file, "Serve Node 24.\n");
  run(cwd, ["commit", "-qam", "versione"]);
  run(cwd, ["switch", "proposta"]);
  fs.writeFileSync(file, "Installare le dipendenze.\n");
  run(cwd, ["commit", "-qam", "procedura"]);
  const head = run(cwd, ["rev-parse", "HEAD"]);
  const unresolved = () =>
    example(n, "git diff --name-only --diff-filter=U", cwd);
  run(cwd, ["merge", "main"], false);
  assert.equal(unresolved(), "README.md");
  run(cwd, ["merge", "--abort"]);
  assert.equal(run(cwd, ["rev-parse", "HEAD"]), head);
  assert.equal(fs.readFileSync(file, "utf8"), "Installare le dipendenze.\n");
  run(cwd, ["merge", "main"], false);
  example(n, "git add -- README.md", cwd);
  assert.equal(unresolved(), "");
  example(n, "git diff --cached --check", cwd, undefined, false);
  fs.writeFileSync(file, "Serve Node 24. Installare le dipendenze.\n");
  example(n, "git add -- README.md", cwd);
  example(n, "git diff --cached --check", cwd);
  run(cwd, ["commit", "--no-edit"]);
  assert.equal(
    run(cwd, ["show", "HEAD:README.md"]),
    "Serve Node 24. Installare le dipendenze.",
  );
  assert.equal(
    run(cwd, ["rev-list", "--parents", "-n", "1", "HEAD"]).split(" ").length,
    3,
  );
});

test("Actions: lo stesso run viene ispezionato per evento, tentativo e step falliti", () => {
  const [view, logs] = blocks("GitHub Actions", "bash");
  assert.equal(
    view.split(" --json ")[0],
    "gh run view 12345 --repo OWNER/REPO",
  );
  for (const key of ["event", "headSha", "attempt", "jobs"])
    assert.ok(view.split(" --json ")[1].split(",").includes(key));
  assert.equal(
    logs,
    "gh run view 12345 --repo OWNER/REPO --attempt 1 --log-failed",
  );
  const workflow = YAML.parse(
    fs.readFileSync(".github/workflows/deploy-pages.yml", "utf8"),
  );
  assert.deepEqual(workflow.on, {
    push: { branches: ["main"] },
    workflow_dispatch: null,
  });
  assert.equal(workflow.jobs.deploy.needs, "build");
  const steps = workflow.jobs.build.steps;
  assert.equal(
    steps.find((s) => s.run === "npm ci")["working-directory"],
    "site",
  );
  assert.ok(fs.existsSync("site/package-lock.json"));
  assert.equal(
    steps.find((s) => s.uses?.startsWith("actions/upload-pages-artifact@")).with
      .path,
    "site/public",
  );
});

test("Permessi: l'esempio del job commenta una issue senza altre categorie di scrittura", () => {
  const [source] = blocks("permissions GitHub Actions", "yaml");
  assert.deepEqual(YAML.parse(source), { permissions: { issues: "write" } });
});

test("Secret: lo step si ferma quando il valore manca e non divulga il valore presente", () => {
  const topic = "secrets GitHub Actions",
    [source] = blocks(topic, "yaml");
  const [step] = YAML.parse(source);
  assert.deepEqual(blocks(topic, "bash"), [
    "gh secret list --env staging --repo OWNER/REPO --json name",
  ]);
  assert.deepEqual(step.env, { API_TOKEN: "${{ secrets.API_TOKEN }}" });
  assert.equal(step.shell, "pwsh");
  for (const value of [undefined, " ", "fittizio-solo-per-prova"]) {
    const env = Object.fromEntries(
      Object.entries(process.env).filter(
        ([key]) => key.toUpperCase() !== "API_TOKEN",
      ),
    );
    if (value !== undefined) env.API_TOKEN = value;
    const r = spawnSync(
      "pwsh",
      ["-NoProfile", "-NonInteractive", "-Command", step.run],
      { env, encoding: "utf8", timeout: 20000, windowsHide: true },
    );
    assert.ifError(r.error);
    assert.ok(Number.isInteger(r.status));
    if (!value?.trim()) {
      assert.notEqual(r.status, 0);
      assert.match(r.stderr, /API_TOKEN non disponibile/);
    } else {
      assert.equal(r.status, 0, r.stderr);
      assert.equal(r.stdout.trim(), "API_TOKEN presente nello step");
      assert.ok(!(r.stdout + r.stderr).includes(value));
    }
  }
});
