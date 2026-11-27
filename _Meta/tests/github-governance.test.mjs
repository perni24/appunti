import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import YAML from "../../site/node_modules/yaml/dist/index.js";
import { parseNote } from "../../site/scripts/vault.mjs";
import { fixture } from "./github-git-fixture.mjs";

function blocks(name, lang = "bash") {
  return parseNote("Programmazione/GitHub/Pagine/" + name + ".md")
    .tree.children.filter((n) => n.type === "code" && n.lang === lang)
    .map((n) => n.value);
}

test("Governance: il deploy non è la validazione pre-merge", () => {
  const workflow = YAML.parse(
    fs.readFileSync(".github/workflows/deploy-pages.yml", "utf8"),
  );
  assert.deepEqual(workflow.on, {
    push: { branches: ["main"] },
    workflow_dispatch: null,
  });
  assert.deepEqual(blocks("Governance repository GitHub"), [
    "gh ruleset check main --repo OWNER/REPO",
  ]);
});

test("Hygiene: uno squash non rende il branch merged; ignore non rimuove il file tracciato", (t) => {
  const { run, repo, example } = fixture(t);
  const p = repo("triage"),
    note = "Repository hygiene";
  run(p, ["switch", "-c", "feature"]);
  fs.writeFileSync(path.join(p, "nota.md"), "Nuova nota\n");
  run(p, ["add", "nota.md"]);
  run(p, ["commit", "-qm", "nota"]);
  run(p, ["switch", "main"]);
  run(p, ["merge", "--squash", "feature"]);
  run(p, ["commit", "-qm", "integrazione"]);
  assert.equal(
    example(note, 'git branch --merged main --format="%(refname:short)"', p, [
      "branch",
      "--merged",
      "main",
      "--format=%(refname:short)",
    ]),
    "main",
  );
  const dir = path.join(p, "site/public");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "legacy.html"), "prima");
  run(p, ["add", "site/public/legacy.html"]);
  fs.writeFileSync(path.join(p, ".gitignore"), "/site/public/\n");
  fs.writeFileSync(path.join(dir, "index.html"), "nuovo");
  assert.equal(
    example(note, "git ls-files -- site/public", p),
    "site/public/legacy.html",
  );
  assert.match(
    example(note, "git check-ignore -v -- site/public/index.html", p),
    /\.gitignore:1:.*site\/public\/index\.html/,
  );
});

test("Archivio: ripristino di branch e tag dal bundle, file non committato escluso", (t) => {
  const { dir, run, repo, example } = fixture(t);
  const p = repo("progetto"),
    note = "Archiviazione repository GitHub";
  run(p, ["tag", "v1.0.0"]);
  fs.writeFileSync(path.join(p, "solo-locale.txt"), "non committato\n");
  example(note, "git bundle create ../progetto.bundle --branches --tags", p);
  example(note, "git bundle verify ../progetto.bundle", p);
  run(dir, ["clone", "-b", "main", "progetto.bundle", "ripristinato"]);
  const dest = path.join(dir, "ripristinato");
  for (const ref of ["main", "v1.0.0"])
    assert.equal(run(dest, ["rev-parse", ref]), run(p, ["rev-parse", ref]));
  assert.equal(fs.existsSync(path.join(dest, "solo-locale.txt")), false);
  assert.ok(
    blocks(note).includes(
      "gh repo view OWNER/REPO --json nameWithOwner,isArchived,visibility",
    ),
  );
});

test("Migrazione: un mirror locale simula anche la cancellazione di un ref senza effettuarla", (t) => {
  const { dir, run, repo, example } = fixture(t);
  const p = repo("sorgente"),
    dest = path.join(dir, "destinazione.git"),
    note = "Migrazione repository GitHub";
  run(p, ["tag", "v1.0.0"]);
  example(
    note,
    "git clone --mirror https://github.com/OLD_OWNER/REPOSITORY.git progetto.git",
    dir,
    ["clone", "--mirror", p, "progetto.git"],
  );
  run(dir, ["clone", "--bare", p, dest]);
  run(dest, ["branch", "solo-destinazione", "main"]);
  const before = run(dest, ["show-ref"]);
  // --porcelain invia il riepilogo su stdout, per verificare anche il piano di cancellazione.
  const plan = example(
    note,
    "git -C progetto.git push --dry-run --mirror https://github.com/NEW_OWNER/REPOSITORY.git",
    dir,
    [
      "-C",
      "progetto.git",
      "push",
      "--porcelain",
      "--dry-run",
      "--mirror",
      dest,
    ],
  );
  assert.match(plan, /:refs\/heads\/solo-destinazione\s+\[deleted\]/);
  assert.equal(run(dest, ["show-ref"]), before);
  const mirror = path.join(dir, "progetto.git");
  example(
    note,
    "git remote set-url origin https://github.com/NEW_OWNER/REPOSITORY.git",
    mirror,
    ["remote", "set-url", "origin", dest],
  );
  assert.equal(run(mirror, ["remote", "get-url", "origin"]), dest);
});

test("Tag annotato: oggetto e commit sono diversi e il tag non segue main", (t) => {
  const { run, repo, example } = fixture(t);
  const p = repo("tag"),
    n = "Tag, versioni e changelog";
  const head = example(n, "git rev-parse HEAD", p);
  example(n, 'git tag -a v2.0.0 -m "Release v2.0.0"', p, [
    "tag",
    "-a",
    "v2.0.0",
    "-m",
    "Release v2.0.0",
  ]);
  run(p, ["commit", "--allow-empty", "-qm", "successivo"]);
  assert.equal(
    example(n, 'git rev-parse "v2.0.0^{commit}"', p, [
      "rev-parse",
      "v2.0.0^{commit}",
    ]),
    head,
  );
  assert.notEqual(run(p, ["rev-parse", "v2.0.0"]), head);
  assert.notEqual(run(p, ["rev-parse", "main"]), head);
});

test("Release: la sequenza prepara una bozza sul tag esistente e pubblica soltanto alla fine", () => {
  const [create, view, publish] = blocks("Gestione release su GitHub");
  assert.match(create, /^gh release create v2\.0\.0 /);
  assert.ok(
    create.split(" ").includes("--draft") &&
      create.split(" ").includes("--verify-tag"),
  );
  assert.equal(
    view,
    "gh release view v2.0.0 --json tagName,isDraft,isPrerelease,assets,url",
  );
  assert.equal(publish, "gh release edit v2.0.0 --draft=false");
});

test("Template: il modulo YAML richiede il percorso della nota", () => {
  const [source] = blocks("Template organizzativi GitHub", "yaml");
  const { name, description, body } = YAML.parse(source);
  assert.ok(name && description);
  const field = body.find((f) => f.id === "percorso");
  assert.equal(field.type, "input");
  assert.ok(field.attributes.label);
  assert.equal(field.validations.required, true);
});
