import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import YAML from "../../site/node_modules/yaml/dist/index.js";
import { parseNote } from "../../site/scripts/vault.mjs";
import { fixture } from "./github-git-fixture.mjs";

const dir = "Programmazione/GitHub/Pagine/";
const release = "Checklist release GitHub";
const security = "Checklist sicurezza GitHub";
const note = (name) => parseNote(dir + name + ".md");
const blocks = (name, lang) =>
  note(name)
    .tree.children.filter((n) => n.type === "code" && n.lang === lang)
    .map((n) => n.value);

test("Repository e PR: i comandi di ispezione puntano allo stesso oggetto e distinguono review e check", () => {
  const [repo] = blocks("Checklist repository GitHub", "bash");
  assert.equal(repo.split(" --json ")[0], "gh repo view OWNER/REPO");
  const fields = repo.split(" --json ")[1].split(",");
  for (const field of [
    "defaultBranchRef",
    "visibility",
    "viewerPermission",
    "isArchived",
  ])
    assert.ok(fields.includes(field));
  const [pr, checks] = blocks("Checklist pull request GitHub", "bash");
  assert.match(pr, /^gh pr view 42 --repo OWNER\/REPO --json /);
  for (const field of [
    "baseRefName",
    "headRefOid",
    "reviewDecision",
    "isDraft",
  ])
    assert.ok(pr.split(" --json ")[1].split(",").includes(field));
  assert.equal(checks, "gh pr checks 42 --repo OWNER/REPO --required");
});

test("Sicurezza: indice vuoto non implica assenza del percorso nella cronologia", (t) => {
  const { repo, run, example } = fixture(t),
    cwd = repo("storico");
  const tracked = () => example(security, "git ls-files -- .env", cwd);
  const log = () => example(security, "git log --all --format=%h -- .env", cwd);
  assert.equal(tracked(), "");
  assert.equal(log(), "");
  fs.writeFileSync(path.join(cwd, ".env"), "COLORE=blu\n");
  run(cwd, ["add", "--", ".env"]);
  run(cwd, ["commit", "-qm", "aggiunta"]);
  const first = run(cwd, ["rev-parse", "--short", "HEAD"]);
  assert.equal(tracked(), ".env");
  assert.equal(log(), first);
  run(cwd, ["rm", "--", ".env"]);
  run(cwd, ["commit", "-qm", "rimozione"]);
  assert.equal(tracked(), "");
  assert.deepEqual(log().split(/\r?\n/), [
    run(cwd, ["rev-parse", "--short", "HEAD"]),
    first,
  ]);
});

test("Actions: il blocco di concorrenza corrisponde al workflow Pages, i due job hanno esiti distinti", () => {
  const name = "Checklist GitHub Actions",
    workflow = YAML.parse(
      fs.readFileSync(".github/workflows/deploy-pages.yml", "utf8"),
    );
  const [snippet] = blocks(name, "yaml");
  assert.deepEqual(YAML.parse(snippet), { concurrency: workflow.concurrency });
  assert.equal(workflow.concurrency["cancel-in-progress"], false);
  assert.deepEqual(workflow.on.push.branches, ["main"]);
  assert.ok("workflow_dispatch" in workflow.on && "build" in workflow.jobs);
  assert.equal(workflow.jobs.deploy.needs, "build");
  assert.deepEqual(blocks(name, "bash"), [
    "gh run view 12345 --repo OWNER/REPO --json event,headSha,status,conclusion,jobs,url",
  ]);
});

test("Release: lo stesso comando legge tag assente, leggero e annotato da un origin locale", (t) => {
  const { repo, run, example } = fixture(t),
    remote = repo("origine"),
    cwd = repo("lettore");
  run(cwd, ["remote", "add", "origin", remote]);
  const ref = "refs/tags/v1.2.0",
    peeled = ref + "^{}",
    sha = run(remote, ["rev-parse", "HEAD"]);
  const lookup = () =>
    example(
      release,
      'git ls-remote --tags origin "refs/tags/v1.2.0" "refs/tags/v1.2.0^{}"',
      cwd,
      ["ls-remote", "--tags", "origin", ref, peeled],
    );
  assert.equal(lookup(), "");
  run(remote, ["tag", "v1.2.0"]);
  assert.equal(lookup(), sha + "\t" + ref);
  // Nuova origine per il caso annotato: non si deve mai spostare un tag pubblicato.
  const annotated = repo("annotata");
  run(cwd, ["remote", "set-url", "origin", annotated]);
  run(annotated, ["tag", "-a", "v1.2.0", "-m", "versione"]);
  const commit = run(annotated, ["rev-parse", "HEAD"]),
    tag = run(annotated, ["rev-parse", ref]);
  assert.notEqual(tag, commit);
  assert.deepEqual(
    new Set(lookup().split(/\r?\n/)),
    new Set([tag + "\t" + ref, commit + "\t" + peeled]),
  );
});

test("Release: la scrittura crea solo una bozza sul tag esistente, seguita da una lettura", () => {
  const [, create, view] = blocks(release, "bash");
  assert.match(create, /^gh release create v1\.2\.0 --repo OWNER\/REPO /);
  for (const flag of ["--verify-tag", "--draft"])
    assert.ok(create.split(" ").includes(flag));
  assert.match(create, /--notes-file note-v1\.2\.0\.md$/);
  assert.equal(
    view,
    "gh release view v1.2.0 --repo OWNER/REPO --json tagName,isDraft,isPrerelease,assets,url",
  );
  const prereqs = note(release).data.prerequisites;
  assert.equal(new Set(prereqs).size, prereqs.length);
});
