import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { GitHubFlavoredMarkdown } from "../../site/.quartz/plugins/github-flavored-markdown/dist/index.js";
import remarkParse from "../../site/node_modules/remark-parse/index.js";
import { unified } from "../../site/node_modules/unified/index.js";
import { parseNote } from "../../site/scripts/vault.mjs";
import { fixture } from "./github-git-fixture.mjs";

const folder = "Programmazione/GitHub/Pagine/";
const workflow = ".github/workflows/deploy-pages.yml";

test("Desktop: un file escluso dal commit resta sul disco", (t) => {
  const { repo, run, example } = fixture(t);
  const cwd = repo("desktop");
  fs.appendFileSync(path.join(cwd, "README.md"), "Una modifica\n");
  const other = path.join(cwd, "appunti.txt");
  fs.writeFileSync(other, "Da rivedere\n");
  run(cwd, ["add", "--", "README.md"]);
  run(cwd, ["commit", "-qm", "Solo il README"]);
  assert.equal(
    example("GitHub Desktop", "git status --short", cwd),
    "?? appunti.txt",
  );
  assert.equal(
    example("GitHub Desktop", "git show --name-only --format= HEAD", cwd),
    "README.md",
  );
  assert.equal(fs.readFileSync(other, "utf8"), "Da rivedere\n");
});

test("Ricerca: HEAD, file tracciati sul disco e revisione fissata", (t) => {
  const { repo, run, example } = fixture(t);
  const cwd = repo("ricerca");
  const file = path.join(cwd, workflow);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, "on:\n  workflow_dispatch:\n");
  run(cwd, ["add", "--", workflow]);
  run(cwd, ["commit", "-qm", "Avvio manuale"]);
  const pinned = run(cwd, ["rev-parse", "HEAD"]);
  fs.writeFileSync(file, "on: push\n");
  fs.writeFileSync(
    path.join(path.dirname(file), "altro.yml"),
    "on: workflow_dispatch\n",
  );
  const page = "Cercare codice su GitHub";
  assert.equal(
    example(
      page,
      "git grep -n -F workflow_dispatch HEAD -- .github/workflows",
      cwd,
    ),
    "HEAD:" + workflow + ":2:  workflow_dispatch:",
  );
  assert.equal(
    example(
      page,
      "git grep -n -F workflow_dispatch -- .github/workflows",
      cwd,
      undefined,
      false,
    ),
    "",
  );
  run(cwd, ["add", "--", workflow]);
  run(cwd, ["commit", "-qm", "Solo push"]);
  assert.equal(
    run(cwd, ["show", pinned + ":" + workflow]),
    "on:\n  workflow_dispatch:",
  );
  assert.equal(run(cwd, ["show", "main:" + workflow]), "on: push");
});

test("Code Search: la regex della nota seleziona il nome completo", () => {
  const blocks = parseNote(folder + "Cercare codice su GitHub.md").tree
    .children;
  const query = blocks.find(
    (n) => n.type === "code" && n.value.includes("package"),
  ).value;
  const regex = new RegExp(query.match(/path:\/(.+)\/$/)[1]);
  for (const file of ["package.json", "app/package.json"])
    assert.ok(regex.test(file), file);
  for (const file of [
    "subpackage.json",
    "packageXjson",
    "app/package.json.bak",
  ])
    assert.ok(!regex.test(file), file);
});

test("GFM: il README annida codice, link e tabella; la PR contiene due attività", () => {
  const samples = parseNote(
    folder + "Markdown su GitHub.md",
  ).tree.children.filter((n) => n.type === "code" && n.lang === "md");
  assert.equal(samples.length, 2);
  const parser = unified()
    .use(remarkParse)
    .use({
      plugins: GitHubFlavoredMarkdown({
        enableSmartyPants: false,
      }).markdownPlugins(),
    });
  const [readme, pr] = samples.map((n) => parser.parse(n.value).children);
  const code = readme.find((n) => n.type === "code");
  assert.deepEqual([code.lang, code.value], ["bash", "npm test"]);
  const rows = readme.find((n) => n.type === "table").children;
  assert.deepEqual(
    rows.map((n) => n.children.length),
    [2, 2, 2],
  );
  assert.equal(
    readme.flatMap((n) => n.children ?? []).find((n) => n.type === "link").url,
    "docs/avvio.md",
  );
  assert.deepEqual(
    pr.find((n) => n.type === "list").children.map((n) => n.checked),
    [true, false],
  );
});
