import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";
import { fixture } from "./github-git-fixture.mjs";

const pages = "Programmazione/GitHub/Pagine/";

test("Identita: la configurazione locale cambia solo i commit futuri del clone", (t) => {
  const { repo, run, example } = fixture(t);
  const a = repo("a"),
    b = repo("b");
  const page = "Account GitHub e profilo sviluppatore";
  example(page, 'git config --local user.name "Anna Rossi"', a, [
    "config",
    "--local",
    "user.name",
    "Anna Rossi",
  ]);
  example(page, 'git config --local user.email "anna@example.com"', a, [
    "config",
    "--local",
    "user.email",
    "anna@example.com",
  ]);
  assert.match(
    example(page, "git config --show-origin --get user.email", a),
    /anna@example\.com$/,
  );
  run(a, ["commit", "--allow-empty", "-qm", "nuova identita"]);
  assert.equal(
    run(a, ["log", "-1", "--format=%an <%ae>"]),
    "Anna Rossi <anna@example.com>",
  );
  assert.equal(
    run(a, ["log", "-1", "--format=%ae", "HEAD~1"]),
    "autore@example.invalid",
  );
  assert.equal(run(b, ["config", "user.email"]), "autore@example.invalid");
});

test("Commit e push: lo staging selettivo e il branch pubblicato sono cose diverse", (t) => {
  const { dir, repo, run, example } = fixture(t);
  const work = repo("work"),
    origin = path.join(dir, "origin.git");
  run(dir, ["init", "--bare", "-b", "main", origin]);
  example(
    "Repository GitHub",
    "git remote add origin https://github.com/OWNER/REPO.git",
    work,
    ["remote", "add", "origin", origin],
  );
  example("Repository GitHub", "git push -u origin main", work);
  example("GitHub", "git switch -c docs/avvio", work);
  fs.appendFileSync(path.join(work, "README.md"), "istruzioni\n");
  fs.writeFileSync(path.join(work, "appunti.txt"), "solo locale");
  example("GitHub", "git add -- README.md", work);
  assert.match(example("GitHub", "git diff --staged", work), /\+istruzioni/);
  example("GitHub", 'git commit -m "Documenta il primo avvio"', work, [
    "commit",
    "-m",
    "Documenta il primo avvio",
  ]);
  assert.equal(run(work, ["ls-files"]), "README.md");
  run(origin, ["show-ref", "--verify", "refs/heads/docs/avvio"], false);
  example("GitHub", "git push -u origin docs/avvio", work);
  assert.equal(
    run(origin, ["rev-parse", "docs/avvio"]),
    run(work, ["rev-parse", "HEAD"]),
  );
  const copy = path.join(dir, "clone");
  example(
    "Clone fork e template repository",
    "git clone https://github.com/TUO-ACCOUNT/progetto.git",
    dir,
    ["clone", origin, copy],
  );
  assert.equal(run(copy, ["branch", "--format=%(refname:short)"]), "main");
  assert.match(run(copy, ["branch", "-r"]), /origin\/docs\/avvio/);
});

test("Fork simulato su disco: fetch, fast-forward, push e rifiuto della divergenza", (t) => {
  const { dir, repo, run, example } = fixture(t);
  const publisher = repo("publisher"),
    work = path.join(dir, "work");
  const upstream = path.join(dir, "originale.git"),
    origin = path.join(dir, "fork.git");
  run(dir, ["clone", "--bare", publisher, upstream]);
  run(dir, ["clone", "--bare", upstream, origin]);
  run(dir, ["clone", origin, work]);
  const page = "Remote origin e upstream";
  example(
    page,
    "git remote add upstream https://github.com/OWNER/progetto.git",
    work,
    ["remote", "add", "upstream", upstream],
  );
  assert.equal(
    run(work, ["rev-parse", "--abbrev-ref", "@{upstream}"]),
    "origin/main",
  );
  const publish = (msg) => {
    fs.appendFileSync(path.join(publisher, "README.md"), msg + "\n");
    run(publisher, ["commit", "-qam", msg]);
    run(publisher, ["push", upstream, "main"]);
  };
  publish("aggiornato");
  const head = run(work, ["rev-parse", "HEAD"]);
  example(page, "git fetch upstream", work);
  assert.equal(run(work, ["rev-parse", "HEAD"]), head);
  assert.equal(
    fs.readFileSync(path.join(work, "README.md"), "utf8"),
    "Avvio\n",
  );
  assert.equal(
    example(page, "git log --oneline upstream/main..main", work),
    "",
  );
  example(page, "git merge --ff-only upstream/main", work);
  assert.match(
    example("Git e GitHub", "git log --oneline origin/main..main", work),
    /aggiornato/,
  );
  assert.equal(
    example("Git e GitHub", "git log --oneline main..origin/main", work),
    "",
  );
  example(page, "git push origin main", work);
  assert.equal(
    run(origin, ["rev-parse", "main"]),
    run(upstream, ["rev-parse", "main"]),
  );
  run(work, [
    "-c",
    "user.name=Test",
    "-c",
    "user.email=test@example.invalid",
    "commit",
    "--allow-empty",
    "-qm",
    "locale",
  ]);
  const diverged = run(work, ["rev-parse", "HEAD"]);
  publish("altro");
  example(page, "git fetch upstream", work);
  assert.match(
    example(page, "git log --oneline upstream/main..main", work),
    /locale/,
  );
  example(page, "git merge --ff-only upstream/main", work, undefined, false);
  assert.equal(run(work, ["rev-parse", "HEAD"]), diverged);
});

test("gitignore: un file tracciato resta tale; --cached lascia la copia e non cancella la storia", (t) => {
  const { repo, run, example } = fixture(t);
  const work = repo("ignore"),
    page = "README LICENSE e gitignore";
  const patterns = parseNote(pages + page + ".md").tree.children.find(
    (n) => n.lang === "gitignore",
  ).value;
  fs.writeFileSync(path.join(work, ".env"), "SOLO_ESEMPIO=1\n");
  run(work, ["add", "--", ".env"]);
  run(work, ["commit", "-qm", "file di esempio"]);
  fs.writeFileSync(path.join(work, ".gitignore"), patterns + "\n");
  assert.equal(example(page, "git ls-files -- .env", work), ".env");
  example(page, "git rm --cached -- .env", work);
  assert.equal(example(page, "git ls-files -- .env", work), "");
  assert.match(
    example(page, "git check-ignore -v -- .env", work),
    /\.gitignore:.*\.env/,
  );
  assert.equal(
    fs.readFileSync(path.join(work, ".env"), "utf8"),
    "SOLO_ESEMPIO=1\n",
  );
  run(work, ["add", "--", ".gitignore"]);
  run(work, ["commit", "-qm", "ignora il file"]);
  assert.equal(run(work, ["show", "HEAD~1:.env"]), "SOLO_ESEMPIO=1");
});
