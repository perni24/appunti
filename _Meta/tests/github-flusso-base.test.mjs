import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fixture } from "./github-git-fixture.mjs";

const topic = "fix/export-vuoto";
const mergePage = "Merge squash e rebase su GitHub";
const commitPage = "Commit e cronologia su GitHub";

function history(t, diverge = false) {
  const { repo, run, example } = fixture(t);
  const work = repo("export");
  const git = (...args) => run(work, args);
  const note = (page, cmd, args) => example(page, cmd, work, args);
  const write = (file, data) => fs.writeFileSync(path.join(work, file), data);
  const base = git("rev-parse", "HEAD");
  // Represent origin/main immediately after fetch. No GitHub resource is involved.
  git("update-ref", "refs/remotes/origin/main", base);
  git("switch", "-c", "lavoro-locale");
  git("commit", "--allow-empty", "-qm", "solo nel branch locale");
  note(
    "Branch su GitHub",
    "git switch --no-track -c fix/export-vuoto origin/main",
  );
  assert.equal(git("rev-parse", "HEAD"), base);
  assert.equal(
    git("for-each-ref", "--format=%(upstream)", "refs/heads/" + topic),
    "",
  );
  write("test.txt", "Aspetto una intestazione.\n");
  git("add", "test.txt");
  git("commit", "-qm", "Specifica il caso vuoto");
  write("export.csv", "nome,totale\n");
  git("add", "export.csv");
  git("commit", "-qm", "Mantiene la riga di intestazione");
  const original = git("rev-parse", "HEAD");
  git("switch", "main");
  if (diverge) {
    write("release.txt", "Modifica presente solo nella base\n");
    git("add", "release.txt");
    git("commit", "-qm", "Aggiorna la release");
    git("update-ref", "refs/remotes/origin/main", git("rev-parse", "main"));
  }
  return { git, note, write, work, original, main: git("rev-parse", "main") };
}

test("Il confronto della PR parte dalla base comune, non mostra le modifiche esclusive di main", (t) => {
  const { git, note } = history(t, true);
  git("switch", topic);
  const diff = note("Pull request", "git diff origin/main...HEAD");
  assert.match(diff, /diff --git a\/export\.csv/);
  assert.match(diff, /diff --git a\/test\.txt/);
  assert.doesNotMatch(diff, /release\.txt/);
  assert.match(git("diff", "origin/main", "HEAD"), /release\.txt/);
});

test("Il commit usa lo staging; amend sostituisce il commit senza cambiare il genitore", (t) => {
  const { git, note, work, write } = history(t);
  for (const dir of ["src", "tests"]) fs.mkdirSync(path.join(work, dir));
  write("src/export.js", "export const header = 'nome,totale';\n");
  write("tests/export.test.js", "// esempio per lo staging\n");
  note(commitPage, "git add -- src/export.js tests/export.test.js");
  write("src/export.js", "export const header = 'in lavorazione';\n");
  assert.match(note(commitPage, "git diff --staged"), /nome,totale/);
  assert.match(
    note(commitPage, "git diff"),
    /\+'?export const header = 'in lavorazione'/,
  );
  const message = "Mantiene l'intestazione CSV nei report vuoti";
  note(commitPage, 'git commit -m "' + message + '"', [
    "commit",
    "-m",
    message,
  ]);
  assert.match(git("show", "HEAD:src/export.js"), /nome,totale/);
  const old = git("rev-parse", "HEAD"),
    parent = git("rev-parse", "HEAD^");
  git("add", "src/export.js");
  git("commit", "--amend", "--no-edit");
  assert.equal(git("rev-parse", "HEAD^"), parent);
  assert.notEqual(git("rev-parse", "HEAD"), old);
});

test("Merge no-ff conserva entrambi i genitori anche quando basterebbe un fast-forward", (t) => {
  const { git, note, original, main } = history(t);
  note(mergePage, "git merge --no-ff --no-edit fix/export-vuoto");
  assert.equal(git("show", "-s", "--format=%P", "HEAD"), main + " " + original);
  assert.equal(
    git("rev-parse", "HEAD^{tree}"),
    git("rev-parse", topic + "^{tree}"),
  );
});

test("Squash prepara il risultato ma main avanza solo al commit, con un solo genitore", (t) => {
  const { git, note, main } = history(t, true);
  note(mergePage, "git merge --squash fix/export-vuoto");
  assert.equal(git("rev-parse", "HEAD"), main);
  assert.deepEqual(git("diff", "--cached", "--name-only").split(/\r?\n/), [
    "export.csv",
    "test.txt",
  ]);
  const message = "Corregge l'export CSV dei report vuoti";
  note(mergePage, 'git commit -m "' + message + '"', ["commit", "-m", message]);
  assert.equal(git("show", "-s", "--format=%P", "HEAD"), main);
  assert.equal(git("rev-list", "--count", "main.." + topic), "2");
  assert.match(git("show", "HEAD:export.csv"), /nome,totale/);
  assert.match(git("show", "HEAD:release.txt"), /nella base/);
});

test("Il rebase su una base divergente riscrive due commit; ff-only poi muove main", (t) => {
  const { git, note, original, main } = history(t, true);
  git("switch", topic);
  note(mergePage, "git rebase main");
  const rebased = git("rev-parse", "HEAD");
  assert.notEqual(rebased, original);
  assert.equal(git("rev-parse", "main"), main);
  assert.equal(git("rev-parse", "HEAD~2"), main);
  assert.equal(git("rev-list", "--count", "--merges", main + "..HEAD"), "0");
  note(mergePage, "git switch main");
  note(mergePage, "git merge --ff-only fix/export-vuoto");
  assert.equal(git("rev-parse", "main"), rebased);
  assert.match(git("show", "main:export.csv"), /nome,totale/);
  assert.match(git("show", "main:release.txt"), /nella base/);
});
