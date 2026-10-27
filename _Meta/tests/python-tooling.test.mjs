import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
  realpathSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, relative, isAbsolute, delimiter } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const tools = process.env.PYTHON_TOOLING_TOOLS;
assert.ok(tools, "Set PYTHON_TOOLING_TOOLS; see README.");
const win = process.platform === "win32";
const bin = (root, name = "python") =>
  join(root, win ? "Scripts" : "bin", name + (win ? ".exe" : ""));
const python = bin(tools);
const temp = realpathSync(tmpdir());
const root = mkdtempSync(join(temp, "appunti-python-tooling-test-"));
const notes = Object.fromEntries(
  ["isort", "pre-commit", "tox e nox", "Creazione di Package"].map((name) => [
    name,
    parseNote("Programmazione/Python/Pagine/" + name + ".md"),
  ]),
);
const nodeText = (n) => n.value ?? (n.children ?? []).map(nodeText).join("");
function code(name, heading, lang) {
  const nodes = notes[name].tree.children;
  const at = nodes.findIndex(
    (n) => n.type === "heading" && nodeText(n) === heading,
  );
  assert.ok(at >= 0, heading);
  const block = nodes.slice(at + 1).find((n) => n.type === "code");
  assert.equal(block.lang, lang, heading);
  return block.value + "\n";
}
function put(cwd, path, data) {
  const file = join(cwd, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, data);
}
const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (
    /^(PYTHON|PIP_|UV_|VIRTUAL_ENV$|TOX_|NOX|PRE_COMMIT|GIT_|OPENAI_|AZURE_|AWS_)/i.test(
      key,
    )
  )
    delete env[key];
}
Object.assign(env, {
  PATH: dirname(python) + delimiter + process.env.PATH,
  PYTHONUTF8: "1",
  PIP_CONFIG_FILE: win ? "NUL" : "/dev/null",
  PIP_DISABLE_PIP_VERSION_CHECK: "1",
  PIP_NO_INDEX: "1",
  PIP_FIND_LINKS: pathToFileURL(join(tools, "wheelhouse")).href,
  PIP_CACHE_DIR: join(root, "pip-cache"),
  VIRTUALENV_APP_DATA: join(root, "virtualenv-cache"),
  VIRTUALENV_NO_PERIODIC_UPDATE: "1",
  PRE_COMMIT_HOME: join(tools, "pre-commit-cache"),
  GIT_CONFIG_GLOBAL: win ? "NUL" : "/dev/null",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_TERMINAL_PROMPT: "0",
  NO_COLOR: "1",
  NOX_DOWNLOAD_PYTHON: "never",
});
function run(command, args, cwd, status = 0, extra = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: { ...env, ...extra },
    encoding: "utf8",
    windowsHide: true,
    timeout: 240000,
    maxBuffer: 8 * 1024 * 1024,
  });
  assert.ifError(result.error);
  const output = (result.stdout + result.stderr).replace(/\r\n/g, "\n");
  if (status === "failure")
    assert.notEqual(result.status, 0, args.join(" ") + "\n" + output);
  else assert.equal(result.status, status, args.join(" ") + "\n" + output);
  return output;
}
const py = (args, cwd, status = 0, extra = {}) =>
  run(python, args, cwd, status, extra);
const git = (args, cwd) =>
  run(
    "git",
    ["-c", "core.autocrlf=false", "-c", "core.safecrlf=false", ...args],
    cwd,
  );
const project = (name) => join(root, name);
function packageFixture(name) {
  const cwd = project(name);
  mkdirSync(cwd, { recursive: true });
  for (const [heading, lang] of [
    ["pyproject.toml", "toml"],
    ["README.md", "markdown"],
    ["src/appunti_calc/operations.py", "python"],
    ["src/appunti_calc/__init__.py", "python"],
    ["src/appunti_calc/cli.py", "python"],
    ["src/appunti_calc/__main__.py", "python"],
    ["tests/test_core.py", "python"],
  ])
    put(cwd, heading, code("Creazione di Package", heading, lang));
  return cwd;
}
const sort = project("sort");
const hooks = project("hooks");
const toxProject = project("tox");
const noxProject = project("nox");
const sortConfig = code("isort", "Configurazione isort e Black", "toml");
const hookConfig = code("pre-commit", ".pre-commit-config.yaml", "yaml");
const toxConfig = code(
  "tox e nox",
  "Configurazione tox in pyproject.toml",
  "toml",
);
const noxConfig = code("tox e nox", "noxfile.py", "python");
const beforeImports = code("isort", "Prima del riordino", "python");
const afterImports = code("isort", "Dopo il riordino", "python");
const pc = (args, status = 0, extra = {}) =>
  py(["-m", "pre_commit", ...args], hooks, status, extra);
const tox = (args, status = 0) =>
  py(["-m", "tox", ...args], toxProject, status);
const nox = (args, status = 0) =>
  py(["-m", "nox", ...args], noxProject, status);

before(() => {
  const versions = JSON.parse(
    py(
      [
        "-c",
        "import json, importlib.metadata as m; print(json.dumps({x:m.version(x) for x in ['isort','pre-commit','tox','nox','black','pytest','ruff']}))",
      ],
      root,
    ),
  );
  assert.deepEqual(versions, {
    isort: "9.0.2",
    "pre-commit": "4.7.0",
    tox: "4.67.1",
    nox: "2026.10.20",
    black: "26.10.1",
    pytest: "9.1.1",
    ruff: "0.17.3",
  });
  assert.match(py(["--version"], root), /3\.12\.10/);
  for (const name of ["sort", "hooks", "tox", "nox"]) packageFixture(name);
  for (const cwd of [sort, hooks]) {
    git(["init", "-q"], cwd);
    put(cwd, ".gitignore", "ignored.py\n");
    put(
      cwd,
      "pyproject.toml",
      readFileSync(join(cwd, "pyproject.toml"), "utf8") + "\n" + sortConfig,
    );
  }
  put(sort, "sample.py", beforeImports);
  put(hooks, ".pre-commit-config.yaml", hookConfig);
  put(
    toxProject,
    "pyproject.toml",
    readFileSync(join(toxProject, "pyproject.toml"), "utf8") + "\n" + toxConfig,
  );
  put(noxProject, "noxfile.py", noxConfig);
});
after(() => {
  const actual = realpathSync(root);
  const rel = relative(temp, actual);
  assert.ok(
    rel &&
      !rel.startsWith("..") &&
      !isAbsolute(rel) &&
      actual.includes("appunti-python-tooling-test-"),
  );
  rmSync(actual, { recursive: true, force: true });
});

for (const name of ["isort", "pre-commit", "tox e nox"]) {
  test(name + ": metadati e template operativo", () => {
    const n = notes[name];
    assert.equal(n.data.type, "operational-note");
    assert.equal(n.data.status, "non revisionato");
    assert.equal(n.data.publish, true);
    const headings = n.tree.children.filter((n) => n.type === "heading");
    assert.equal(headings.filter((n) => n.depth === 1).length, 1);
    for (const h of [
      "Obiettivo",
      "Quando usarlo",
      "Procedura",
      "Snippet",
      "Adattamenti comuni",
      "Debug rapido",
      "Checklist finale",
      "Collegamenti",
      "Fonti",
    ])
      assert.ok(
        headings.some((n) => nodeText(n) === h),
        h,
      );
    for (let i = 1; i < headings.length; i++)
      assert.ok(headings[i].depth <= headings[i - 1].depth + 1);
  });
}
test("isort: check fallisce senza scrivere", () => {
  assert.match(
    py(["-m", "isort", "--check-only", "--diff", "sample.py"], sort, 1),
    /appunti_calc/,
  );
  assert.equal(readFileSync(join(sort, "sample.py"), "utf8"), beforeImports);
});
test("isort: solo diff non fa fallire il controllo", () => {
  assert.match(
    py(["-m", "isort", "--diff", "sample.py"], sort),
    /appunti_calc/,
  );
  assert.equal(readFileSync(join(sort, "sample.py"), "utf8"), beforeImports);
});
test("isort: gruppi e risultato documentato", () => {
  py(["-m", "isort", "sample.py"], sort);
  assert.equal(
    readFileSync(join(sort, "sample.py"), "utf8").replace(/\r\n/g, "\n"),
    afterImports,
  );
});
test("isort: secondo passaggio idempotente e import inutilizzati conservati", () => {
  py(["-m", "isort", "--check-only", "--diff", "sample.py"], sort);
  py(["-m", "ruff", "check", "--select", "F401", "sample.py"], sort, 1);
});
test("isort: profilo e Black convergono anche su import multilinea", () => {
  put(
    sort,
    "long.py",
    "from appunti_calc.operations import extremely_long_symbol_one, extremely_long_symbol_two, extremely_long_symbol_three\n",
  );
  py(["-m", "isort", "long.py"], sort);
  py(["-m", "black", "long.py"], sort);
  const fixed = readFileSync(join(sort, "long.py"), "utf8");
  py(["-m", "isort", "--check-only", "long.py"], sort);
  py(["-m", "black", "--check", "long.py"], sort);
  assert.equal(readFileSync(join(sort, "long.py"), "utf8"), fixed);
});
test("isort: gitignore anche su file esplicito", () => {
  put(sort, "ignored.py", beforeImports);
  py(["-m", "isort", "ignored.py"], sort);
  assert.equal(readFileSync(join(sort, "ignored.py"), "utf8"), beforeImports);
});
test("isort: generated esclusa anche su file esplicito", () => {
  put(sort, "generated/sample.py", beforeImports);
  py(["-m", "isort", "generated/sample.py"], sort);
  assert.equal(
    readFileSync(join(sort, "generated/sample.py"), "utf8"),
    beforeImports,
  );
});
test("isort: direttive preservano ordine intenzionale", () => {
  const source = code("isort", "Ordine intenzionale", "python");
  put(sort, "ordered.py", source);
  py(["-m", "isort", "ordered.py"], sort);
  assert.equal(readFileSync(join(sort, "ordered.py"), "utf8"), source);
});
test("isort: configurazione effettiva e riconoscimento first party", () => {
  const config = JSON.parse(
    py(["-m", "isort", "--show-config", "src/appunti_calc/cli.py"], sort),
  );
  assert.equal(config.profile, "black");
  assert.ok(config.known_first_party.includes("appunti_calc"));
  assert.equal(config.filter_files, true);
});

test("pre-commit: configurazione valida, rev fissate e stage manuale distinto", () => {
  pc(["validate-config"]);
  const extra =
    code("pre-commit", "Test locali su richiesta", "yaml")
      .trimEnd()
      .split("\n")
      .map((line) => "  " + line)
      .join("\n") + "\n";
  put(hooks, ".pre-commit-config.yaml", hookConfig + "\n" + extra);
  pc(["validate-config"]);
});
test("pre-commit: --all-files non include un file non tracciato", () => {
  put(hooks, "untracked.yaml", "broken: [\n");
  // The first run may fetch the two pinned official hook repositories and their dependencies.
  const result = pc(["run", "--all-files"], 0, { PIP_NO_INDEX: "0" });
  assert.match(result, /Skipped/);
});
test("pre-commit: correzione reale fallisce e non aggiorna l'indice", () => {
  put(hooks, "tracked.txt", "hello   \n\n");
  git(["add", "tracked.txt"], hooks);
  const result = pc(["run", "--all-files"], 1);
  assert.match(result, /Failed/);
  assert.equal(readFileSync(join(hooks, "tracked.txt"), "utf8"), "hello\n");
  assert.equal(git(["show", ":tracked.txt"], hooks), "hello   \n\n");
});
test("pre-commit: dopo revisione e staging il controllo passa", () => {
  git(["add", "tracked.txt"], hooks);
  pc(["run"]);
  pc(["run", "--all-files", "--show-diff-on-failure"]);
});
test("pre-commit: YAML rotto e duplicati vengono rilevati", () => {
  put(hooks, "invalid.yaml", "broken: [\n");
  pc(["run", "check-yaml", "--files", "invalid.yaml"], 1);
  put(hooks, "invalid.yaml", "key: 1\nkey: 2\n");
  pc(["run", "check-yaml", "--files", "invalid.yaml"], 1);
});
test("pre-commit: frontmatter Markdown non e controllato da check-yaml", () => {
  put(hooks, "note.md", "---\nbroken: [\n---\nText\n");
  assert.match(pc(["run", "check-yaml", "--files", "note.md"]), /Skipped/);
});
test("pre-commit: a capo Markdown a due spazi conservato", () => {
  put(hooks, "break.md", "one  \ntwo\n");
  pc(["run", "trailing-whitespace", "--files", "break.md"]);
  assert.equal(readFileSync(join(hooks, "break.md"), "utf8"), "one  \ntwo\n");
});
test("pre-commit: hook isort usa configurazione del progetto", () => {
  put(hooks, "sortme.py", beforeImports);
  git(["add", "sortme.py"], hooks);
  pc(["run", "isort", "--files", "sortme.py"], 1);
  assert.equal(
    readFileSync(join(hooks, "sortme.py"), "utf8").replace(/\r\n/g, "\n"),
    afterImports,
  );
  pc(["run", "isort", "--files", "sortme.py"]);
});
test("pre-commit: installazione e disinstallazione solo nel Git temporaneo", () => {
  assert.ok(!existsSync(join(hooks, ".git/hooks/pre-commit")));
  pc(["install"]);
  assert.match(
    readFileSync(join(hooks, ".git/hooks/pre-commit"), "utf8"),
    /pre_commit/,
  );
  pc(["uninstall"]);
  assert.ok(!existsSync(join(hooks, ".git/hooks/pre-commit")));
});

test("tox: elenca gli ambienti previsti dal TOML", () => {
  const output = tox(["list"]);
  assert.match(output, /py312/);
  assert.match(output, /lint/);
});
test("tox: build wheel, installazione e due test originali", () => {
  const output = tox(["run", "-e", "py312"]);
  assert.match(output, /2 passed/);
  assert.match(output, /appunti_calc_demo.*whl/);
});
test("tox: import da ambiente installato fuori dai sorgenti", () => {
  const output = run(
    bin(join(toxProject, ".tox/py312")),
    [
      "-I",
      "-c",
      "import appunti_calc; print(appunti_calc.__file__); assert appunti_calc.add(2,3)==5",
    ],
    root,
  );
  assert.match(output, /site-packages/);
  assert.ok(!output.includes("src/appunti_calc"));
});
test("tox: posargs seleziona un test e ne esclude uno", () => {
  assert.match(
    tox(["run", "-e", "py312", "--", "tests/test_core.py", "-k", "test_sum"]),
    /1 passed, 1 deselected/,
  );
});
test("tox: lint isolato senza installare il package", () => {
  assert.match(tox(["run", "-e", "lint"]), /All checks passed/);
  run(
    bin(join(toxProject, ".tox/lint")),
    ["-I", "-c", "import appunti_calc"],
    root,
    1,
  );
});
test("tox: test rotto produce exit code non zero", () => {
  put(
    toxProject,
    "tests/test_broken.py",
    "def test_broken():\n    assert 1 == 2\n",
  );
  try {
    assert.match(tox(["run", "-e", "py312"], "failure"), /1 failed/);
  } finally {
    rmSync(join(toxProject, "tests/test_broken.py"));
  }
});
test("tox: ricreazione elimina un marcatore nell'ambiente", () => {
  put(toxProject, ".tox/py312/marker.txt", "not source\n");
  assert.match(tox(["run", "-r", "-e", "py312"]), /2 passed/);
  assert.ok(!existsSync(join(toxProject, ".tox/py312/marker.txt")));
});
test("tox: interprete inesistente fallisce anziche certificare una matrice", () => {
  const result = tox(["run", "-e", "py399"], "failure");
  assert.match(result, /could not find|failed to find|not found/i);
});

test("nox: sessioni reali elencate", () => {
  const sessions = JSON.parse(nox(["--list", "--json"]));
  assert.deepEqual(
    sessions.map((s) => s.name),
    ["tests", "lint"],
  );
});
test("nox: installa package e passa i due test originali", () => {
  assert.match(nox(["-s", "tests"]), /2 passed/);
  const output = run(
    bin(join(noxProject, ".nox/tests")),
    [
      "-I",
      "-c",
      "import appunti_calc; print(appunti_calc.__file__); assert appunti_calc.add(2,3)==5",
    ],
    root,
  );
  assert.match(output, /site-packages/);
});
test("nox: posargs e riuso non saltano la sessione", () => {
  assert.match(
    nox(["-r", "-s", "tests", "--", "tests/test_core.py", "-k", "test_sum"]),
    /1 passed, 1 deselected/,
  );
});
test("nox: lint separato dal package", () => {
  assert.match(nox(["-s", "lint"]), /All checks passed/);
  run(
    bin(join(noxProject, ".nox/lint")),
    ["-I", "-c", "import appunti_calc"],
    root,
    1,
  );
});
test("nox: fallimento del runner propagato", () => {
  put(
    noxProject,
    "tests/test_broken.py",
    "def test_broken():\n    assert 1 == 2\n",
  );
  try {
    assert.match(nox(["-r", "-s", "tests"], "failure"), /1 failed/);
  } finally {
    rmSync(join(noxProject, "tests/test_broken.py"));
  }
});
test("nox: interprete assente non scaricato e non saltato", () => {
  put(
    noxProject,
    "missing.py",
    noxConfig.replaceAll('python="3.12"', 'python="3.99"'),
  );
  assert.match(
    nox(["-f", "missing.py", "-s", "tests"], "failure"),
    /not found|not installed|not locate|not find|failed to find/i,
  );
});
test("nox: rigenerazione predefinita elimina il marcatore", () => {
  put(noxProject, ".nox/tests/marker.txt", "not source\n");
  assert.match(nox(["-s", "tests"]), /2 passed/);
  assert.ok(!existsSync(join(noxProject, ".nox/tests/marker.txt")));
});
test("pre-commit: hook manuale usa l'ambiente fornito, senza passare file", () => {
  const path =
    dirname(bin(join(noxProject, ".nox/tests"))) + delimiter + env.PATH;
  const output = pc(
    ["run", "tests", "--hook-stage", "manual", "--all-files", "--verbose"],
    0,
    { PATH: path },
  );
  assert.match(output, /2 passed/);
  const staged = pc(["run", "--all-files"]);
  assert.ok(!staged.includes("pytest locale"));
});
