import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import YAML from "../../site/node_modules/yaml/dist/index.js";
import { parseNote } from "../../site/scripts/vault.mjs";
import { fixture } from "./github-git-fixture.mjs";

function block(page, lang) {
  const { tree } = parseNote("Programmazione/GitHub/Pagine/" + page + ".md");
  const blocks = tree.children.filter(
    (n) => n.type === "code" && n.lang === lang,
  );
  assert.equal(blocks.length, 1, page);
  return blocks[0].value;
}

test("Dependabot: l'esempio indirizza i manifest del sito e i workflow dalla radice", () => {
  const cfg = YAML.parse(block("Dependabot", "yaml"));
  assert.equal(cfg.version, 2);
  const updates = Object.fromEntries(
    cfg.updates.map((u) => [u["package-ecosystem"], u]),
  );
  assert.equal(updates.npm.directory, "/site");
  const dir = "." + updates.npm.directory;
  for (const file of ["package.json", "package-lock.json"])
    assert.ok(fs.existsSync(path.join(dir, file)));
  assert.equal(updates["github-actions"].directory, "/");
  assert.ok(
    fs.readdirSync(".github/workflows").some((f) => /\.ya?ml$/.test(f)),
  );
  for (const u of cfg.updates) assert.equal(u.schedule.interval, "weekly");
});

test("Grafo: il lockfile collega il parser transitivo alla dipendenza diretta", () => {
  const read = (f) => JSON.parse(fs.readFileSync("site/" + f, "utf8"));
  const p = read("package.json"),
    lock = read("package-lock.json").packages;
  const direct = "remark-parse",
    transitive = "mdast-util-from-markdown";
  assert.ok(p.dependencies[direct]);
  assert.ok(!p.dependencies[transitive] && !p.devDependencies?.[transitive]);
  assert.ok(lock["node_modules/" + direct].dependencies[transitive]);
  assert.ok(lock["node_modules/" + transitive].version);
});

test("CodeQL: eventi sulla base indicata e autorizzazioni limitate al job", () => {
  const wf = YAML.parse(block("Code scanning", "yaml"));
  for (const event of ["pull_request", "push"])
    assert.deepEqual(wf.on[event].branches, ["main"]);
  const job = wf.jobs.analyze;
  assert.deepEqual(job.permissions, {
    contents: "read",
    "security-events": "write",
  });
  assert.deepEqual(
    job.steps.map((s) => s.uses.split("@")[0]),
    [
      "actions/checkout",
      "github/codeql-action/init",
      "github/codeql-action/analyze",
    ],
  );
  assert.deepEqual(job.steps[1].with, {
    languages: "javascript-typescript",
    "build-mode": "none",
  });
});

test("Ignore: stessa regola, risultati diversi per un file nuovo e uno già tracciato", (t) => {
  const { repo, example, run } = fixture(t);
  const page = "Secret scanning";
  const ignore = block(page, "gitignore") + "\n";
  for (const tracked of [false, true]) {
    const cwd = repo(tracked ? "tracciato" : "nuovo");
    fs.writeFileSync(path.join(cwd, ".env"), "# Solo una fixture\n");
    if (tracked) {
      run(cwd, ["add", "--", ".env"]);
      run(cwd, ["commit", "-qm", "Fixture prima delle regole"]);
    }
    fs.writeFileSync(path.join(cwd, ".gitignore"), ignore);
    const match = example(
      page,
      "git check-ignore -v -- .env",
      cwd,
      undefined,
      !tracked,
    );
    if (tracked) assert.equal(match, "");
    else assert.match(match, /:\.env\s+\.env$/);
    assert.equal(
      example(page, "git ls-files -- .env", cwd),
      tracked ? ".env" : "",
    );
  }
});

test("Token del job: sola lettura delle issue e nessun valore letterale della credenziale", () => {
  const job = YAML.parse(block("Sicurezza dei token GitHub", "yaml")).jobs[
    "leggi-issue"
  ];
  assert.deepEqual(job.permissions, { issues: "read" });
  assert.equal(job.steps.length, 1);
  assert.deepEqual(job.steps[0].env, { GH_TOKEN: "${{ github.token }}" });
  assert.equal(
    job.steps[0].run,
    `gh api "repos/$GITHUB_REPOSITORY/issues/12" --jq '.state'`,
  );
});
