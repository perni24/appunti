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
import { pathToFileURL } from "node:url";
import { join, resolve, relative, isAbsolute, delimiter } from "node:path";
import { before, after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const tools = process.env.PYTHON_PACKAGING_TOOLS;
assert.ok(
  tools,
  "Set PYTHON_PACKAGING_TOOLS to a prepared tools virtualenv; see README.",
);
const win = process.platform === "win32";
const bin = (root, command) =>
  join(root, win ? "Scripts" : "bin", command + (win ? ".exe" : ""));
const python = bin(tools, "python");
// Python canonicalizes Windows 8.3 aliases consistently with the packaging tools.
const tempResult = spawnSync(
  python,
  [
    "-I",
    "-c",
    "from pathlib import Path; import tempfile; print(Path(tempfile.gettempdir()).resolve())",
  ],
  { encoding: "utf8", windowsHide: true },
);
assert.equal(tempResult.status, 0, tempResult.stderr);
const canonicalTemp = tempResult.stdout.trim();
assert.ok(isAbsolute(canonicalTemp));
const root = mkdtempSync(join(canonicalTemp, "appunti-python-packaging-test-"));
const project = join(root, "package");
const outside = join(root, "outside");
const installed = join(root, "installed");
const editable = join(root, "editable");
const wheel = join(project, "dist", "appunti_calc_demo-0.1.0-py3-none-any.whl");
const names = [
  "Pip e PyPI",
  "Ambienti Virtuali",
  "Creazione di Package",
  "uv pipx e poetry",
];
const notes = names.map((name) =>
  parseNote("Programmazione/Python/Pagine/" + name + ".md"),
);
const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (/^(PYTHON|PIP_|UV_|PIPX_|POETRY_|VIRTUAL_ENV$)/i.test(key))
    delete env[key];
}
Object.assign(env, {
  PATH: join(tools, win ? "Scripts" : "bin") + delimiter + process.env.PATH,
  PYTHONUTF8: "1",
  PIP_NO_INDEX: "1",
  PIP_DISABLE_PIP_VERSION_CHECK: "1",
  PIP_CONFIG_FILE: win ? "NUL" : "/dev/null",
  PIP_FIND_LINKS: pathToFileURL(join(tools, "wheelhouse")).href,
  PIP_CACHE_DIR: join(root, "pip-cache"),
  UV_OFFLINE: "true",
  UV_PYTHON_DOWNLOADS: "never",
  UV_NO_CONFIG: "true",
  UV_CACHE_DIR: join(root, "uv-cache"),
  PIPX_HOME: join(root, "pipx-home"),
  PIPX_BIN_DIR: join(root, "pipx-bin"),
  PIPX_MAN_DIR: join(root, "pipx-man"),
  PIPX_DEFAULT_PYTHON: python,
  POETRY_CONFIG_DIR: join(root, "poetry-config"),
  POETRY_DATA_DIR: join(root, "poetry-data"),
  POETRY_CACHE_DIR: join(root, "poetry-cache"),
  POETRY_VIRTUALENVS_IN_PROJECT: "true",
  POETRY_KEYRING_ENABLED: "false",
});
function run(command, args, { cwd = outside, status = 0, extraEnv = {} } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: { ...env, ...extraEnv },
    encoding: "utf8",
    windowsHide: true,
    timeout: 180000,
    maxBuffer: 4 * 1024 * 1024,
  });
  assert.ifError(result.error);
  assert.equal(
    result.status,
    status,
    args.join(" ") + "\n" + result.stdout + result.stderr,
  );
  return result.stdout.replace(/\r\n/g, "\n");
}
function put(path, text) {
  const full = join(root, path);
  mkdirSync(resolve(full, ".."), { recursive: true });
  writeFileSync(full, text + "\n", "utf8");
}
function sectionCode(note, heading, lang) {
  const text = (node) => node.value ?? (node.children ?? []).map(text).join("");
  const children = note.tree.children;
  const i = children.findIndex(
    (n) => n.type === "heading" && text(n) === heading,
  );
  assert.ok(i >= 0, heading);
  const block = children.slice(i + 1).find((n) => n.type === "code");
  assert.equal(block.lang, lang);
  return block.value;
}
before(() => {
  mkdirSync(outside);
  run(python, [
    "-c",
    "import sys; assert sys.version_info[:2] == (3,12); assert not sys.flags.optimize",
  ]);
  const versions = JSON.parse(
    run(python, [
      "-c",
      "import json, importlib.metadata as m; print(json.dumps({x:m.version(x) for x in ['pip','build','setuptools','uv','pipx','poetry','tzdata']}))",
    ]),
  );
  assert.deepEqual(versions, {
    pip: "26.2.2",
    build: "1.6.1",
    setuptools: "84.2.1",
    uv: "0.13.5",
    pipx: "1.18.4",
    poetry: "2.5.1",
    tzdata: "2026.5",
  });
  for (const [path, lang] of [
    ["pyproject.toml", "toml"],
    ["README.md", "markdown"],
    ["src/appunti_calc/operations.py", "python"],
    ["src/appunti_calc/__init__.py", "python"],
    ["src/appunti_calc/cli.py", "python"],
    ["src/appunti_calc/__main__.py", "python"],
    ["tests/test_core.py", "python"],
  ])
    put("package/" + path, sectionCode(notes[2], path, lang));
  run(python, ["-m", "build"], { cwd: project });
  assert.ok(existsSync(wheel));
  assert.ok(
    existsSync(join(project, "dist", "appunti_calc_demo-0.1.0.tar.gz")),
  );
  run(python, ["-m", "venv", installed]);
  run(python, ["-m", "venv", editable]);
  run(bin(installed, "python"), ["-m", "pip", "install", "--no-index", wheel]);
  run(bin(editable, "python"), ["-m", "pip", "install", "-e", project]);
});
after(() => {
  const temp = realpathSync(canonicalTemp);
  const rel = relative(temp, realpathSync(root));
  assert.ok(rel && !rel.startsWith("..") && !isAbsolute(rel));
  assert.ok(root.includes("appunti-python-packaging-test-"));
  rmSync(root, { recursive: true, force: true });
});
for (let i = 0; i < notes.length; i++)
  test(names[i] + ": struttura e comandi separati", () => {
    const note = notes[i];
    assert.equal(note.data.status, "non revisionato");
    assert.equal(note.data.publish, true);
    assert.equal(note.data.type, "technical-note");
    assert.equal(String(note.data.date), "2026-06-03");
    for (const n of note.tree.children.filter((n) => n.type === "code")) {
      if (
        ["text", "bash", "powershell", "bat"].includes(n.lang) &&
        !n.value.startsWith("appunti-calc-demo/")
      ) {
        assert.equal(n.value.split("\n").length, 1);
      }
    }
  });
test("wheel: import fuori dai sorgenti e metadati", () => {
  const output = run(bin(installed, "python"), [
    "-I",
    "-c",
    "from appunti_calc import add; from importlib.metadata import version; import appunti_calc; print(add(2,3)); print(version('appunti-calc-demo')); print(appunti_calc.__file__)",
  ]);
  assert.ok(output.startsWith("5\n0.1.0\n"));
  assert.ok(output.toLowerCase().includes("site-packages"));
  assert.ok(!output.includes(join(project, "src")));
});
test("wheel: test unittest estratti dalla nota", () => {
  put(
    "outside/test_core.py",
    sectionCode(notes[2], "tests/test_core.py", "python"),
  );
  run(bin(installed, "python"), ["-m", "unittest", "discover", "-s", "."]);
});
test("wheel: modulo e entry point, successo ed errori argparse", () => {
  assert.equal(
    run(bin(installed, "python"), ["-m", "appunti_calc", "2", "3"]),
    "5\n",
  );
  assert.equal(run(bin(installed, "appunti-calc"), ["-4", "3"]), "-1\n");
  run(bin(installed, "appunti-calc"), ["x", "3"], { status: 2 });
  run(bin(installed, "python"), ["-m", "appunti_calc"], { status: 2 });
});
test("editable: sorgente visibile e non scambiato per wheel", () => {
  const output = run(bin(editable, "python"), [
    "-c",
    "import appunti_calc; print(appunti_calc.__file__)",
  ]);
  assert.ok(output.toLowerCase().includes(join(project, "src").toLowerCase()));
  run(bin(editable, "python"), ["-m", "unittest", "discover", "-s", "tests"], {
    cwd: project,
  });
});
test("venv: interprete diretto, prefix e isolamento", () => {
  run(bin(installed, "python"), [
    "-c",
    "import sys, importlib.util; assert sys.prefix != sys.base_prefix; assert importlib.util.find_spec('poetry') is None; assert importlib.util.find_spec('setuptools') is None",
  ]);
  assert.match(
    readFileSync(join(installed, "pyvenv.cfg"), "utf8"),
    /include-system-site-packages = false/i,
  );
});
test("pip: check, list e freeze con riferimento locale", () => {
  assert.match(
    run(bin(installed, "python"), ["-m", "pip", "check"]),
    /No broken requirements/,
  );
  assert.match(
    run(bin(installed, "python"), ["-m", "pip", "freeze"]),
    /appunti-calc-demo @ file:/,
  );
  const list = JSON.parse(
    run(bin(installed, "python"), ["-m", "pip", "list", "--format=json"]),
  );
  assert.ok(
    list.some((x) => x.name === "appunti-calc-demo" && x.version === "0.1.0"),
  );
});
test("pip constraints restringe ma non installa", () => {
  put("constraints.txt", "not-a-real-demo-package==1.0");
  run(bin(installed, "python"), [
    "-m",
    "pip",
    "install",
    "--no-index",
    "-c",
    join(root, "constraints.txt"),
    wheel,
  ]);
  put("constraints.txt", "appunti-calc-demo==9.0");
  run(
    bin(installed, "python"),
    [
      "-m",
      "pip",
      "install",
      "--no-index",
      "-c",
      join(root, "constraints.txt"),
      wheel,
    ],
    { status: 1 },
  );
});
test("pip uninstall rimuove il demo soltanto dall'ambiente di prova", () => {
  run(bin(installed, "python"), [
    "-m",
    "pip",
    "uninstall",
    "-y",
    "appunti-calc-demo",
  ]);
  run(bin(installed, "python"), [
    "-c",
    "import importlib.util; assert importlib.util.find_spec('appunti_calc') is None",
  ]);
});
test("uv progetto: init lock sync run e rifiuto di lock obsoleto", () => {
  const uv = bin(tools, "uv");
  run(uv, ["init", "--app", "--no-package", "--python", "3.12", "uv-demo"], {
    cwd: root,
  });
  const cwd = join(root, "uv-demo");
  run(uv, ["lock"], { cwd });
  run(uv, ["sync", "--locked"], { cwd });
  assert.match(run(uv, ["run", "--locked", "main.py"], { cwd }), /Hello/);
  assert.ok(existsSync(join(cwd, "uv.lock")));
  run(uv, ["add", wheel], { cwd });
  assert.equal(
    run(uv, ["run", "--locked", "appunti-calc", "2", "3"], { cwd }),
    "5\n",
  );
  const path = join(cwd, "pyproject.toml");
  const original = readFileSync(path, "utf8");
  writeFileSync(
    path,
    original.replace('name = "uv-demo"', 'name = "uv-demo-changed"'),
  );
  run(uv, ["sync", "--locked"], { cwd, status: 1 });
  run(uv, ["run", "--frozen", "appunti-calc", "2", "3"], { cwd, status: 1 });
  const changedDependencies = original.replace(
    "dependencies = [",
    'dependencies = ["missing-dependency-demo==1.0",',
  );
  assert.notEqual(changedDependencies, original);
  writeFileSync(path, changedDependencies);
  run(uv, ["sync", "--locked"], { cwd, status: 1 });
  assert.equal(
    run(uv, ["run", "--frozen", "appunti-calc", "2", "3"], { cwd }),
    "5\n",
  );
  writeFileSync(path, original);
});
test("uv pip non modifica metadati e sync rimuove pacchetti estranei", () => {
  const uv = bin(tools, "uv");
  const cwd = join(root, "uv-empty");
  run(uv, ["init", "--app", "--no-package", "--python", "3.12", cwd]);
  run(uv, ["sync"], { cwd });
  const before = readFileSync(join(cwd, "pyproject.toml"), "utf8");
  const lock = readFileSync(join(cwd, "uv.lock"), "utf8");
  run(uv, ["pip", "install", wheel], { cwd });
  assert.equal(readFileSync(join(cwd, "pyproject.toml"), "utf8"), before);
  assert.equal(readFileSync(join(cwd, "uv.lock"), "utf8"), lock);
  run(uv, ["sync", "--locked"], { cwd });
  run(
    uv,
    [
      "run",
      "--locked",
      "python",
      "-c",
      "import importlib.util; assert importlib.util.find_spec('appunti_calc') is None",
    ],
    { cwd },
  );
});
test("pipx: installazione CLI isolata, esecuzione e rimozione", () => {
  const pipx = bin(tools, "pipx");
  run(pipx, ["install", "--backend", "uv", "--python", python, wheel]);
  const cli = join(env.PIPX_BIN_DIR, "appunti-calc" + (win ? ".exe" : ""));
  assert.equal(run(cli, ["2", "3"]), "5\n");
  assert.match(run(pipx, ["list"]), /appunti-calc/);
  run(python, [
    "-c",
    "import importlib.util; assert importlib.util.find_spec('appunti_calc') is None",
  ]);
  run(pipx, ["uninstall", "appunti-calc-demo"]);
  assert.equal(existsSync(cli), false);
});
test("Poetry applicazione: config dalla nota, lock install e run", () => {
  const cwd = join(root, "poetry-demo");
  const poetry = bin(tools, "poetry");
  const config = notes[3].tree.children.find(
    (n) => n.type === "code" && n.lang === "toml",
  ).value;
  const code = notes[3].tree.children.find(
    (n) => n.type === "code" && n.lang === "python",
  ).value;
  put("poetry-demo/pyproject.toml", config);
  put("poetry-demo/main.py", code);
  run(poetry, ["env", "use", "3.12"], { cwd });
  run(poetry, ["lock"], { cwd });
  run(poetry, ["install"], { cwd });
  assert.equal(
    run(poetry, ["run", "python", "main.py"], { cwd }),
    "environment ready\nTrue\n",
  );
  assert.ok(existsSync(join(cwd, "poetry.lock")));
  run(poetry, ["add", wheel], { cwd });
  assert.equal(run(poetry, ["run", "appunti-calc", "2", "3"], { cwd }), "5\n");
  run(poetry, ["sync"], { cwd });
});
