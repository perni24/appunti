import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import YAML from "../../site/node_modules/yaml/dist/index.js";
import { parseNote } from "../../site/scripts/vault.mjs";
import { fixture } from "./github-git-fixture.mjs";

function sample(page, lang) {
  const blocks = parseNote("Programmazione/GitHub/Pagine/" + page + ".md").tree
    .children;
  const matches = blocks.filter((n) => n.type === "code" && n.lang === lang);
  assert.equal(matches.length, 1);
  return matches[0].value;
}

test("Issue form: due domande obbligatorie con suggerimenti, non risposte", () => {
  const form = YAML.parse(
    sample("Issue templates e pull request templates", "yaml"),
  );
  assert.ok(form.name && form.description);
  assert.deepEqual(
    form.body.map((n) => [n.id, n.type]),
    [
      ["riproduzione", "textarea"],
      ["atteso", "input"],
    ],
  );
  for (const field of form.body) {
    assert.ok(field.attributes.label && field.attributes.placeholder);
    assert.equal(field.attributes.value, undefined);
    assert.equal(field.validations.required, true);
  }
});

test("Commit: il messaggio completo conserva anche il footer di migrazione", (t) => {
  const { run, example, repo } = fixture(t);
  const cwd = repo("commits");
  const page = "Conventional commits su GitHub";
  const message = sample(page, "text");
  run(cwd, ["commit", "--allow-empty", "-qm", message]);
  const actual = example(page, "git log -1 --format=%B", cwd);
  assert.equal(actual, message);
  assert.match(actual, /^feat\(export\)!: .+\n\n.+\n\nBREAKING CHANGE: .+$/);
  assert.equal(run(cwd, ["tag", "--list"]), "");
});

test("Branch: il fix parte dalla base scaricata e non segue origin/main", (t) => {
  const { dir, run, example, repo } = fixture(t);
  const cwd = repo("branch");
  const page = "Branching strategy su GitHub";
  const base = run(cwd, ["rev-parse", "HEAD"]);
  // Un bundle Git rende il fetch ripetibile senza server o credenziali.
  const bundle = path.join(dir, "origine.bundle");
  run(cwd, ["bundle", "create", bundle, "main"]);
  run(cwd, ["remote", "add", "origin", bundle]);
  run(cwd, ["commit", "--allow-empty", "-qm", "Solo in locale"]);
  const localMain = run(cwd, ["rev-parse", "main"]);
  assert.equal(example(page, "git status --short", cwd), "");
  example(page, "git fetch origin", cwd);
  assert.equal(run(cwd, ["rev-parse", "HEAD"]), localMain);
  example(page, "git switch --no-track -c fix/export-vuoto origin/main", cwd);
  assert.equal(run(cwd, ["branch", "--show-current"]), "fix/export-vuoto");
  assert.equal(run(cwd, ["rev-parse", "HEAD"]), base);
  assert.notEqual(localMain, base);
  assert.equal(
    run(cwd, [
      "for-each-ref",
      "--format=%(upstream)",
      "refs/heads/fix/export-vuoto",
    ]),
    "",
  );
});

test("Monorepo: il diff non elenca il consumatore invariato né i commit solo sulla base", (t) => {
  const { run, example, repo } = fixture(t);
  const cwd = repo("monorepo");
  function put(file, contents) {
    const target = path.join(cwd, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
    run(cwd, ["add", "--", file]);
  }
  put("packages/csv/header.ts", 'export const header = "name";\n');
  put(
    "apps/api/report.ts",
    'export { header } from "../../packages/csv/header";\n',
  );
  run(cwd, ["commit", "-qm", "Base comune"]);
  run(cwd, ["branch", "fix/export-vuoto"]);
  put("docs/avvio.md", "Solo sulla base\n");
  run(cwd, ["commit", "-qm", "Guida"]);
  run(cwd, ["update-ref", "refs/remotes/origin/main", "HEAD"]);
  run(cwd, ["switch", "fix/export-vuoto"]);
  put("packages/csv/header.ts", 'export const header = "displayName";\n');
  run(cwd, ["commit", "-qm", "Aggiorna intestazione"]);
  assert.equal(
    example(
      "Monorepo su GitHub",
      "git diff --name-only origin/main...HEAD",
      cwd,
    ),
    "packages/csv/header.ts",
  );
});
