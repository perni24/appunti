import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  existsSync,
  realpathSync,
  rmSync,
  cpSync,
  renameSync,
  unlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, relative, isAbsolute, delimiter } from "node:path";
import { test, after } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const tools = process.env.PYTHON_PERFORMANCE_TOOLS;
assert.ok(tools, "Set PYTHON_PERFORMANCE_TOOLS; see README.");
assert.equal(
  process.platform,
  "win32",
  "Questa suite documenta la baseline Windows.",
);
const python = join(tools, "Scripts", "python.exe");
const temp = realpathSync(tmpdir());
const root = mkdtempSync(join(temp, "appunti-python-performance-test-"));
const env = {
  ...process.env,
  PYTHONUTF8: "1",
  PYINSTALLER_CONFIG_DIR: join(root, "pyinstaller-cache"),
  PIP_NO_INDEX: "1",
  PIP_DISABLE_PIP_VERSION_CHECK: "1",
  PIP_CONFIG_FILE: "NUL",
  PATH: join(tools, "Scripts") + delimiter + process.env.PATH,
};
delete env.PYTHONPATH;
delete env.PYTHONHOME;
const names = ["Profiling", "Caching", "C extensions", "Cython", "PyInstaller"];
const notes = names.map((name) =>
  parseNote("Programmazione/Python/Pagine/" + name + ".md"),
);
const code = notes.map((note) =>
  note.tree.children.filter((n) => n.type === "code"),
);
const pythonBlocks = code.map((blocks) =>
  blocks.filter((b) => b.lang === "python").map((b) => b.value),
);
const text = (node) => node.value ?? (node.children ?? []).map(text).join("");
function fileBlock(note, heading, language) {
  const nodes = notes[note].tree.children;
  const index = nodes.findIndex(
    (n) => n.type === "heading" && text(n) === heading,
  );
  assert.ok(index >= 0, heading);
  const block = nodes.slice(index + 1).find((n) => n.type === "code");
  assert.equal(block.lang, language);
  return block.value;
}
function put(folder, name, content) {
  const file = join(folder, name);
  mkdirSync(resolve(file, ".."), { recursive: true });
  writeFileSync(file, content + "\n", "utf8");
  return file;
}
const outside = join(root, "outside");
mkdirSync(outside);
const profile = join(root, "profile");
const native = join(root, "native");
const cython = join(root, "cython");
const bundle = join(root, "bundle");
put(profile, "profile_demo.py", pythonBlocks[0][0]);
put(native, "native.c", fileBlock(2, "native.c", "c"));
put(cython, "kernel.pyx", fileBlock(3, "kernel.pyx", "cython"));
for (const [folder, index] of [
  [native, 2],
  [cython, 3],
]) {
  put(folder, "pyproject.toml", fileBlock(index, "pyproject.toml", "toml"));
  put(folder, "setup.py", fileBlock(index, "setup.py", "python"));
}
put(bundle, "app.py", fileBlock(4, "app.py", "python"));
put(bundle, "assets/message.txt", fileBlock(4, "assets/message.txt", "text"));
function execute(
  command,
  args,
  { cwd = outside, status = 0, timeout = 180000, input } = {},
) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: "utf8",
    windowsHide: true,
    timeout,
    maxBuffer: 8 * 2 ** 20,
    input,
  });
  assert.ifError(result.error);
  if (status !== null)
    assert.equal(
      result.status,
      status,
      args.join(" ") + "\n" + result.stdout + result.stderr,
    );
  return {
    ...result,
    stdout: result.stdout.replaceAll("\r\n", "\n"),
    stderr: result.stderr.replaceAll("\r\n", "\n"),
  };
}
function py(args, opts) {
  return execute(python, args, opts);
}
const bootstrap = String.raw`
import contextlib, io, json, sys, types, unittest
assert sys.version_info[:2] == (3,12) and sys.implementation.name == "cpython"
assert not sys.flags.optimize
request=json.load(sys.stdin)
sys.path.insert(0,request["profile"])
module=types.ModuleType("note_example")
module.__file__=request["file"]
sys.modules[module.__name__]=module
stdout,stderr=io.StringIO(),io.StringIO()
with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
    exec(compile(request["source"],request["file"],"exec"),module.__dict__)
    module.__dict__.update(expect=unittest.TestCase(),captured_output=stdout,captured_error=stderr)
    exec(compile(request["probe"],"probe","exec"),module.__dict__)
print(json.dumps({"output":stdout.getvalue(),"error":stderr.getvalue()}))
`;
function run(note, block, probe = "pass") {
  return JSON.parse(
    py(["-I", "-X", "utf8", "-c", bootstrap], {
      input: JSON.stringify({
        source: pythonBlocks[note][block],
        probe,
        profile,
        file: join(profile, "example.py"),
      }),
    }).stdout,
  );
}
after(() => {
  const actual = realpathSync(root);
  const rel = relative(temp, actual);
  assert.ok(
    rel &&
      !rel.startsWith("..") &&
      !isAbsolute(rel) &&
      actual.includes("appunti-python-performance-test-"),
  );
  rmSync(actual, { recursive: true, force: true });
});
test("baseline e versioni degli strumenti", () => {
  const versions = JSON.parse(
    py([
      "-I",
      "-c",
      String.raw`
import importlib.metadata as m,json,sys
assert sys.version_info[:3] == (3,12,10)
print(json.dumps({n:m.version(n) for n in ("Cython","PyInstaller","py-spy","cachetools","setuptools","build")}))
`,
    ]).stdout,
  );
  assert.deepEqual(versions, {
    Cython: "3.3.0",
    PyInstaller: "6.22.3",
    "py-spy": "0.4.2",
    cachetools: "7.2.4",
    setuptools: "84.2.1",
    build: "1.6.1",
  });
});
for (let i = 0; i < notes.length; i++)
  test(names[i] + ": struttura, fonti e metadati", () => {
    assert.equal(
      notes[i].data.type,
      i === 4 ? "operational-note" : "technical-note",
    );
    assert.equal(notes[i].data.status, "non revisionato");
    assert.equal(notes[i].data.publish, true);
    assert.equal(
      notes[i].tree.children.filter(
        (n) => n.type === "heading" && n.depth === 1,
      ).length,
      1,
    );
    assert.ok(notes[i].body.includes("## Fonti"));
    assert.match(notes[i].body, /3\.12\.10/);
    assert.ok(
      notes[i].body.includes(i === 4 ? "## Procedura" : "## API / Sintassi"),
    );
  });
const expectations = [
  [
    "assert transform_batch([' Alpha ','BETA',' gamma ']) == 14\nassert workload(0) == (14000,1)",
    "assert result == (14000,1)\nassert stats.total_calls > 0",
    "assert grouped_scan(rows)==single_pass(rows)\nassert all(len(v)==5 and all(n>=0 for n in v) for v in measurements.values())",
    "assert wall_elapsed >= 0 and cpu_elapsed >= 0",
    "assert len(buffers)==200 and peak>=current>0 and differences and not tracemalloc.is_tracing()",
  ],
  [
    "assert calls == [1,2,3,2]\nassert (info.hits,info.misses,info.currsize)==(1,4,2)\nassert square.cache_info().currsize==0",
    "assert fib(30)==832040 and fib(0)==0 and fib(1)==1",
    "assert country_label(' it ')=='Italia'\nassert _country_label.cache_info().currsize==1",
    "assert first is second and first==frozenset({'read'}) and local_copy=={'read','write'}",
    "assert expired==[('report',('revision-1',42))] and len(cache)==0",
  ],
];
for (let i = 0; i < 2; i++) {
  test(names[i] + ": tutti i blocchi Python sono coperti", () =>
    assert.equal(pythonBlocks[i].length, expectations[i].length),
  );
  for (let j = 0; j < expectations[i].length; j++)
    test(names[i] + ": esempio " + (j + 1), () =>
      assert.equal(run(i, j, expectations[i][j]).error, ""),
    );
}
const probes = [
  [
    "profiling: workload e input invalidi",
    0,
    0,
    `
assert transform_batch([])==0
assert transform_batch([" A ","B"])==2
for value in (-1,float("nan"),float("inf")):
    with expect.assertRaises(ValueError):
        workload(value)
`,
  ],
  [
    "profiling: algoritmi equivalenti su casi limite",
    0,
    2,
    `
for rows in ([],[("a",1)],[("a",1),("b",-2),("a",3)],[("a",0)]):
    assert grouped_scan(rows)==single_pass(rows)
`,
  ],
  [
    "cache: rifiuto input prima del lookup",
    1,
    1,
    `
fib(1)
for value in (True,-1,1.0,"1",None):
    with expect.assertRaises(ValueError):
        fib(value)
assert fib(10)==55
`,
  ],
  [
    "cache: eviction, clear e bypass",
    1,
    0,
    `
calls.clear()
square(1)
square(1)
assert calls==[1]
assert square.__wrapped__(1)==1
assert calls==[1,1]
square.cache_clear()
assert square.cache_info().hits==square.cache_info().misses==0
`,
  ],
  [
    "cache: canonicalizzazione ed errori non memorizzati",
    1,
    2,
    `
_country_label.cache_clear()
for value in (" it ","it","IT"):
    assert country_label(value)=="Italia"
assert _country_label.cache_info().hits==2
with expect.assertRaises(TypeError):
    country_label(1)
`,
  ],
  [
    "cache: mutabilita del ritorno viene condivisa",
    1,
    0,
    `
from functools import lru_cache
@lru_cache(maxsize=2)
def mutable(key):
    return []
first=mutable("a")
first.append(99)
assert mutable("a")==[99] and mutable("a") is first
`,
  ],
  [
    "cache: permessi immutabili ma non invalidati automaticamente",
    1,
    3,
    `
with expect.assertRaises(AttributeError):
    permissions_for_role("viewer").add("write")
with expect.assertRaises(ValueError):
    permissions_for_role("missing")
POLICY["viewer"]=frozenset()
assert permissions_for_role("viewer")==frozenset({"read"})
permissions_for_role.cache_clear()
assert permissions_for_role("viewer")==frozenset()
`,
  ],
  [
    "cache: eccezioni calcolate nuovamente",
    1,
    0,
    `
from functools import lru_cache
attempts=[]
@lru_cache(maxsize=2)
def fail(key):
    attempts.append(key)
    raise ValueError("bad")
for _ in range(2):
    with expect.assertRaises(ValueError):
        fail("a")
assert attempts==["a","a"] and fail.cache_info().currsize==0
`,
  ],
  [
    "cache: unhashable, typed e riferimenti alle istanze",
    1,
    0,
    `
import weakref,gc
from functools import lru_cache
@lru_cache(maxsize=2,typed=True)
def typed(value):
    return type(value)
assert typed(1) is int and typed(True) is bool
with expect.assertRaises(TypeError):
    typed([])
class Owner:
    @lru_cache(maxsize=2)
    def method(self):
        return 7
obj=Owner()
ref=weakref.ref(obj)
assert obj.method()==7
del obj
gc.collect()
assert ref() is not None
Owner.method.cache_clear()
gc.collect()
assert ref() is None
`,
  ],
  [
    "cache: due miss simultanei possono calcolare due volte",
    1,
    0,
    `
from functools import lru_cache
from threading import Barrier,Lock
from concurrent.futures import ThreadPoolExecutor
barrier=Barrier(2,timeout=5)
lock=Lock()
calls=[]
@lru_cache(maxsize=2)
def expensive(key):
    with lock:
        calls.append(key)
    barrier.wait()
    return key*2
with ThreadPoolExecutor(max_workers=2) as pool:
    left=pool.submit(expensive,3)
    right=pool.submit(expensive,3)
    assert left.result()==right.result()==6
assert calls==[3,3]
`,
  ],
  [
    "cache: clear non e una barriera per calcoli in corso",
    1,
    0,
    `
from functools import lru_cache
from threading import Event
from concurrent.futures import ThreadPoolExecutor
started,release=Event(),Event()
@lru_cache(maxsize=2)
def slow(key):
    started.set()
    if not release.wait(5):
        raise TimeoutError("fixture non rilasciata")
    return key
with ThreadPoolExecutor(max_workers=1) as pool:
    future=pool.submit(slow,1)
    try:
        assert started.wait(5)
        slow.cache_clear()
    finally:
        release.set()
    assert future.result()==1
assert slow.cache_info().currsize==1
`,
  ],
  [
    "cache: TTL confine e scadenza senza sleep",
    1,
    4,
    `
clock.now=20
cache["item"]=7
clock.now=29.999
assert cache["item"]==7
clock.now=30
with expect.assertRaises(KeyError):
    cache["item"]
assert list(cache.expire())==[("item",7)]
`,
  ],
];
for (const [name, note, block, probe] of probes)
  test(name, () => run(note, block, probe));

test("cProfile CLI crea un profilo rileggibile con pstats", () => {
  py(
    [
      "-m",
      "cProfile",
      "-o",
      "profile.pstats",
      "profile_demo.py",
      "--seconds",
      "0",
    ],
    { cwd: profile },
  );
  const result = py(
    [
      "-c",
      "import pstats; s=pstats.Stats('profile.pstats'); assert s.total_calls>0; assert any(k[2]=='transform_batch' for k in s.stats); s.sort_stats('cumulative').print_stats(5)",
    ],
    { cwd: profile },
  );
  assert.match(result.stdout, /function calls/);
});
test("py-spy registra soltanto il figlio dimostrativo", () => {
  const result = execute(
    join(tools, "Scripts", "py-spy.exe"),
    [
      "record",
      "--subprocesses",
      "--rate",
      "100",
      "--output",
      "profile.svg",
      "--",
      python,
      "profile_demo.py",
      "--seconds",
      "3",
    ],
    { cwd: profile, timeout: 30000 },
  );
  const svg = readFileSync(join(profile, "profile.svg"), "utf8");
  assert.match(svg, /<svg/);
  assert.match(svg, /workload|transform_batch/);
  assert.ok(!/permission denied|access denied/i.test(result.stderr));
});
for (const [folder, index] of [
  [native, 2],
  [cython, 3],
]) {
  test(names[index] + ": TOML e configurazione backend", () => {
    const result = py(
      [
        "-c",
        "import tomllib; from pathlib import Path; p=tomllib.loads(Path('pyproject.toml').read_text()); assert p['build-system']['build-backend']=='setuptools.build_meta'; assert p['project']['version']=='0.1.0'",
      ],
      { cwd: folder },
    );
    assert.equal(result.status, 0);
    assert.match(
      py(["setup.py", "--name"], { cwd: folder }).stdout,
      index === 2 ? /appunti-safeadd-demo/ : /appunti-cython-demo/,
    );
  });
  test(
    names[index] + ": script di verifica Python sintatticamente valido",
    () => {
      const heading = index === 2 ? "verify_native.py" : "verify_kernel.py";
      const source = fileBlock(index, heading, "python");
      py(["-c", "import ast,sys; ast.parse(sys.stdin.read())"], {
        input: source,
      });
    },
  );
}
test("Cython: traduzione reale e annotazione HTML", () => {
  py(["-m", "cython", "-3", "--annotate", "kernel.pyx"], { cwd: cython });
  assert.match(readFileSync(join(cython, "kernel.c"), "utf8"), /PyInit_kernel/);
  assert.match(readFileSync(join(cython, "kernel.html"), "utf8"), /sum_values/);
});
for (const [folder, index] of [
  [native, 2],
  [cython, 3],
]) {
  test(names[index] + ": build nativa e contratto installato", (t) => {
    const result = py(["-m", "build", "--wheel", "--no-isolation"], {
      cwd: folder,
      status: null,
    });
    if (
      result.status !== 0 &&
      /Microsoft Visual C\+\+ 14|Unable to find vcvarsall|Microsoft Visual Studio/i.test(
        result.stdout + result.stderr,
      )
    ) {
      t.skip(
        "Compilatore MSVC non disponibile: nessuna verifica binaria dichiarata.",
      );
      return;
    }
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const wheels = readdirSync(join(folder, "dist")).filter((f) =>
      f.endsWith(".whl"),
    );
    assert.equal(wheels.length, 1);
    const target = join(folder, "installed");
    py([
      "-m",
      "pip",
      "install",
      "--no-deps",
      "--target",
      target,
      join(folder, "dist", wheels[0]),
    ]);
    const source = fileBlock(
      index,
      index === 2 ? "verify_native.py" : "verify_kernel.py",
      "python",
    );
    py([
      "-I",
      "-c",
      "import sys; sys.path.insert(0," +
        JSON.stringify(target) +
        ");\n" +
        source,
    ]);
  });
}
test("PyInstaller: app sorgente, help e argomenti errati", () => {
  assert.equal(
    py([join(bundle, "app.py"), "--name", "Test"]).stdout,
    "Ciao dal bundle, Test!\n",
  );
  assert.match(py([join(bundle, "app.py"), "--help"]).stdout, /--name/);
  py([join(bundle, "app.py"), "--unknown"], { status: 2 });
});
function buildArgs(option) {
  const command = code[4].find(
    (n) => n.lang === "powershell" && n.value.includes(option),
  ).value;
  const argumentsOnly = command.slice(command.indexOf(" ") + 1);
  return JSON.parse(
    py(
      [
        "-c",
        "import shlex,json,sys; print(json.dumps(shlex.split(sys.stdin.read())))",
      ],
      { input: argumentsOnly },
    ).stdout,
  );
}
const installed = join(root, "distributed");
test("PyInstaller: build onedir reale con risorsa", () => {
  py(buildArgs("--onedir"), { cwd: bundle });
  cpSync(join(bundle, "dist", "mytool"), join(installed, "mytool"), {
    recursive: true,
  });
  assert.ok(existsSync(join(installed, "mytool", "mytool.exe")));
});
test("PyInstaller: build onefile reale con risorsa", () => {
  py(buildArgs("--onefile"), { cwd: bundle });
  mkdirSync(installed, { recursive: true });
  cpSync(
    join(bundle, "dist", "mytool-onefile.exe"),
    join(installed, "mytool-onefile.exe"),
  );
});
test("PyInstaller: bundle eseguiti senza sorgenti e da altra directory", () => {
  const hidden = join(root, "bundle-hidden");
  renameSync(bundle, hidden);
  try {
    for (const executable of [
      join(installed, "mytool", "mytool.exe"),
      join(installed, "mytool-onefile.exe"),
    ]) {
      assert.equal(
        execute(executable, ["--name", "Ada Lovelace"]).stdout,
        "Ciao dal bundle, Ada Lovelace!\n",
      );
      assert.match(execute(executable, ["--help"]).stdout, /--name/);
      execute(executable, ["--unknown"], { status: 2 });
    }
  } finally {
    renameSync(hidden, bundle);
  }
});
test("PyInstaller: risorsa assente produce errore e non successo", () => {
  const resource = join(
    installed,
    "mytool",
    "_internal",
    "assets",
    "message.txt",
  );
  assert.ok(existsSync(resource));
  const original = readFileSync(resource);
  unlinkSync(resource);
  try {
    const result = execute(join(installed, "mytool", "mytool.exe"), [], {
      status: 1,
    });
    assert.match(result.stderr, /Risorsa non disponibile/);
    assert.equal(result.stdout, "");
  } finally {
    writeFileSync(resource, original);
  }
});
test("PyInstaller: ricostruzione dallo spec generato", () => {
  py(["-m", "PyInstaller", "--clean", "--noconfirm", "mytool.spec"], {
    cwd: bundle,
  });
  assert.equal(
    execute(join(bundle, "dist", "mytool", "mytool.exe"), ["--name", "Spec"])
      .stdout,
    "Ciao dal bundle, Spec!\n",
  );
});
