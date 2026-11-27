import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import YAML from "../../site/node_modules/yaml/dist/index.js";
import { parseNote } from "../../site/scripts/vault.mjs";
import { fixture } from "./github-git-fixture.mjs";

test("Check README: il job verifica il commit, non le modifiche non registrate", (t) => {
  const { repo, run } = fixture(t);
  const cwd = repo("readme");
  const blocks = parseNote(
    "Programmazione/GitHub/Pagine/Required status checks.md",
  ).tree.children.filter((n) => n.type === "code" && n.lang === "yaml");
  assert.equal(blocks.length, 1);
  const wf = YAML.parse(blocks[0].value);
  assert.deepEqual(wf.on, { pull_request: null, merge_group: null });
  assert.deepEqual(wf.permissions, { contents: "read" });
  const job = wf.jobs.readme;
  assert.equal(job.name, "docs-readme");
  const command = job.steps.find((step) => step.run).run;
  assert.equal(command, "git grep -q '[^[:space:]]' HEAD -- README.md");
  const check = (expected) =>
    run(
      cwd,
      ["grep", "-q", "[^[:space:]]", "HEAD", "--", "README.md"],
      expected,
    );
  check(true);
  const readme = path.join(cwd, "README.md");
  fs.writeFileSync(readme, "   \n\t\n");
  check(true);
  run(cwd, ["commit", "-qam", "README con soli spazi"]);
  check(false);
  run(cwd, ["rm", "--", "README.md"]);
  run(cwd, ["commit", "-qm", "README non presente"]);
  check(false);
});

test("Tag: oggetto annotato distinto dal commit, destinazione stabile", (t) => {
  const { repo, run, example } = fixture(t);
  const cwd = repo("tags");
  const page = "Protected tags";
  const tagRef = "refs/tags/v1.0.0";
  const before = run(cwd, ["rev-parse", "HEAD"]);
  example(page, 'git tag -a v1.0.0 -m "Release v1.0.0"', cwd, [
    "tag",
    "-a",
    "v1.0.0",
    "-m",
    "Release v1.0.0",
  ]);
  assert.equal(example(page, "git cat-file -t refs/tags/v1.0.0", cwd), "tag");
  assert.notEqual(run(cwd, ["rev-parse", tagRef]), before);
  run(cwd, ["tag", "leggero"]);
  assert.equal(run(cwd, ["cat-file", "-t", "refs/tags/leggero"]), "commit");
  run(cwd, ["commit", "--allow-empty", "-qm", "Avanza il branch"]);
  assert.notEqual(run(cwd, ["rev-parse", "HEAD"]), before);
  assert.equal(
    example(page, 'git rev-parse "refs/tags/v1.0.0^{commit}"', cwd, [
      "rev-parse",
      tagRef + "^{commit}",
    ]),
    before,
  );
});

test("Esempio del vault: il workflow citato carica il sito prima del deploy", () => {
  const wf = YAML.parse(
    fs.readFileSync(".github/workflows/deploy-pages.yml", "utf8"),
  );
  assert.ok(wf.on.push.branches.includes("main"));
  assert.ok(Object.hasOwn(wf.on, "workflow_dispatch"));
  assert.ok(!Object.hasOwn(wf.on, "pull_request"));
  const upload = wf.jobs.build.steps.find((s) =>
    s.uses?.startsWith("actions/upload-pages-artifact@"),
  );
  assert.equal(upload?.with?.path, "site/public");
  assert.ok([wf.jobs.deploy.needs].flat().includes("build"));
  assert.equal(wf.jobs.deploy.environment.name, "github-pages");
  assert.ok(
    wf.jobs.deploy.steps.some((s) =>
      s.uses?.startsWith("actions/deploy-pages@"),
    ),
  );
});
