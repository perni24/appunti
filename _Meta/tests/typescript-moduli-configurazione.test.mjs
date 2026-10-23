import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";
import { ts, valid, invalid, run } from "./typescript-examples.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const names = [
  "tsconfig",
  "Moduli ES e CommonJS",
  "Module resolution",
  "Path aliases",
  "Project references",
  "Strict mode",
  "Source maps e debugging",
];
const notes = new Map(
  names.map((name) => [
    name,
    parseNote("Programmazione/TypeScript/Pagine/" + name + ".md"),
  ]),
);
const blocks = (name, lang) =>
  notes
    .get(name)
    .tree.children.filter((n) => n.type === "code" && n.lang === lang)
    .map((n) => n.value);
function snippet(name, marker) {
  const matches = blocks(name, "ts").filter((value) => value.includes(marker));
  assert.equal(matches.length, 1, name + ": unique marker " + marker);
  return matches[0];
}
const config = (name, index) => JSON.parse(blocks(name, "json")[index]);
const nodeConfig = () => config(names[1], 1);
const nodePackage = () => config(names[1], 0);

// Fixtures use local dependencies, never install packages or modify vault sources.
function fixture(files, action) {
  const temp = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(temp, "appunti-typescript-modules-"));
  const locate = (name) => {
    const target = path.resolve(root, name);
    assert.ok(
      target.startsWith(root + path.sep),
      "Fixture path must stay in its temporary directory",
    );
    return target;
  };
  const put = (name, value) => {
    const target = locate(name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (typeof value !== "string") {
      value = structuredClone(value);
      if (value.compilerOptions?.types?.includes("node")) {
        // Equivalent to resolving @types/node from a project's installed devDependencies.
        value.compilerOptions.typeRoots = [
          path.dirname(
            path.dirname(require.resolve("@types/node/package.json")),
          ),
        ];
      }
      value = JSON.stringify(value, null, 2);
    }
    fs.writeFileSync(target, value);
  };
  const invoke = (args) => {
    const result = spawnSync(process.execPath, args, {
      cwd: root,
      encoding: "utf8",
      timeout: 30000,
      env: { ...process.env, NODE_OPTIONS: "" },
    });
    assert.ifError(result.error);
    assert.equal(result.signal, null);
    return result;
  };
  const tsc = (...args) =>
    invoke([
      require.resolve("typescript/bin/tsc"),
      ...args,
      "--pretty",
      "false",
    ]);
  const read = (name) => fs.readFileSync(locate(name), "utf8");
  const exists = (name) => fs.existsSync(locate(name));
  try {
    for (const [name, value] of Object.entries(files)) put(name, value);
    return action({ root, put, read, exists, tsc, node: invoke, locate });
  } finally {
    const resolved = fs.realpathSync(root);
    assert.equal(path.dirname(resolved), temp);
    assert.ok(
      path.basename(resolved).startsWith("appunti-typescript-modules-"),
    );
    fs.rmSync(resolved, { recursive: true, force: true });
  }
}
function ok(result, output) {
  assert.equal(result.status, 0, result.stdout + result.stderr);
  if (output !== undefined) assert.equal(result.stdout.trim(), output);
}
function diagnostic(result, code) {
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, new RegExp("TS" + code + "\\b"));
}
const project = (sources) => ({
  "package.json": nodePackage(),
  "tsconfig.json": nodeConfig(),
  ...sources,
});

test("Moduli: baseline locale del compilatore, Node ed esbuild", () => {
  assert.equal(ts.version, "5.9.3");
  assert.equal(process.versions.node, "24.14.0");
  assert.equal(require("esbuild").version, "0.27.3");
});
for (const name of names) {
  test(name + ": JSON valido e comandi indipendenti", () => {
    for (const source of blocks(name, "json"))
      assert.equal(typeof JSON.parse(source), "object");
    for (const command of blocks(name, "sh")) {
      assert.equal(command.split("\n").length, 1);
      assert.ok(
        command.startsWith("npm exec -- ") || command.startsWith("node "),
      );
    }
    assert.equal(notes.get(name).data.status, "non revisionato");
    assert.equal(notes.get(name).data.publish, true);
  });
}

test("tsconfig: build, runtime, showConfig e noEmit preserva output precedente", () => {
  fixture(
    {
      "package.json": config(names[0], 1),
      "tsconfig.json": config(names[0], 2),
      "src/app.ts": snippet(names[0], "const message"),
    },
    (f) => {
      ok(f.tsc("-p", "tsconfig.json"));
      ok(f.node(["dist/app.js"]), "Configurazione pronta");
      const before = f.read("dist/app.js");
      f.put("src/app.ts", 'console.log("Nuovo output");');
      ok(f.tsc("-p", "tsconfig.json", "--noEmit"));
      assert.equal(f.read("dist/app.js"), before);
      const shown = f.tsc("-p", "tsconfig.json", "--showConfig");
      ok(shown);
      assert.equal(JSON.parse(shown.stdout).compilerOptions.strict, true);
      f.put("src/app.ts", 'const value: number = "wrong";');
      diagnostic(f.tsc("-p", "tsconfig.json"), 2322);
      assert.equal(f.read("dist/app.js"), before);
      assert.ok(f.exists("dist/app.js.map"));
    },
  );
});

test("tsconfig: exclude non blocca import e rootDir non seleziona file", () => {
  const cfg = nodeConfig();
  cfg.exclude = ["src/hidden.ts"];
  fixture(
    project({
      "tsconfig.json": cfg,
      "src/app.ts": 'import { value } from "./hidden.js"; console.log(value);',
      "src/hidden.ts": 'export const value: number = "wrong";',
    }),
    (f) => {
      diagnostic(f.tsc("-p", "tsconfig.json"), 2322);
      f.put(
        "src/app.ts",
        'import { value } from "../outside.js"; console.log(value);',
      );
      f.put("outside.ts", "export const value = 1;");
      diagnostic(f.tsc("-p", "tsconfig.json"), 6059);
      const explain = f.tsc(
        "-p",
        "tsconfig.json",
        "--noEmit",
        "--explainFiles",
      );
      assert.match(explain.stdout, /outside\.ts/);
    },
  );
});

test("tsconfig: extends risolve percorsi nella base e sostituisce include", () => {
  fixture(
    {
      "base/tsconfig.json": {
        compilerOptions: { strict: true, outDir: "./output", types: [] },
        include: ["./src"],
        references: [{ path: "../missing" }],
      },
      "base/src/base.ts": 'const wrong: number = "bad";',
      "tsconfig.json": { extends: "./base/tsconfig.json", include: ["src"] },
      "src/app.ts": "const answer = 42;",
    },
    (f) => {
      ok(f.tsc("-p", "tsconfig.json"));
      assert.ok(f.exists("base/output/app.js"));
      assert.equal(f.exists("base/output/base.js"), false);
      const shown = JSON.parse(
        f.tsc("-p", "tsconfig.json", "--showConfig").stdout,
      );
      assert.equal(shown.references, undefined);
      assert.deepEqual(shown.include, ["src"]);
    },
  );
});

test("tsconfig: argomento sorgente ignora config in 5.9 e non si combina con -p", () => {
  fixture(
    {
      "tsconfig.json": {
        compilerOptions: { strict: true, noEmit: true, types: [] },
        include: ["src"],
      },
      "src/app.ts": "function echo(value) { return value; }",
    },
    (f) => {
      diagnostic(f.tsc("-p", "tsconfig.json"), 7006);
      ok(f.tsc("src/app.ts", "--noEmit"));
      diagnostic(f.tsc("-p", "tsconfig.json", "src/app.ts"), 5042);
    },
  );
});

test("Moduli: esempi ESM e CommonJS compilano ed eseguono separatamente", () => {
  fixture(
    project({
      "src/math.ts": snippet(names[1], "export function sum"),
      "src/app.ts": snippet(names[1], 'from "./math.js"'),
      "src/math.cts": snippet(names[1], "export ="),
      "src/app.cts": snippet(names[1], "import math ="),
    }),
    (f) => {
      ok(f.tsc("-p", "tsconfig.json"));
      ok(f.node(["dist/app.js"]), "3");
      ok(f.node(["dist/app.cjs"]), "3");
      assert.match(f.read("dist/app.js"), /from "\.\/math\.js"/);
      assert.match(f.read("dist/math.cjs"), /module\.exports/);
      f.put(
        "src/app.ts",
        snippet(names[1], 'from "./math.js"').replace("./math.js", "./math"),
      );
      diagnostic(f.tsc("-p", "tsconfig.json"), 2835);
    },
  );
});

test("Moduli: .mts forza ESM e import type non carica effetti collaterali", () => {
  fixture(
    project({
      "src/model.ts":
        'console.log("loaded"); export type User = { name: string };',
      "src/app.mts":
        'import type { User } from "./model.js"; const user: User = { name: "Ada" }; console.log(user.name);',
    }),
    (f) => {
      ok(f.tsc("-p", "tsconfig.json"));
      assert.ok(f.exists("dist/app.mjs"));
      assert.doesNotMatch(f.read("dist/app.mjs"), /model\.js/);
      ok(f.node(["dist/app.mjs"]), "Ada");
      f.put("src/app.mts", 'import "./model.js"; console.log("Ada");');
      ok(f.tsc("-p", "tsconfig.json"));
      ok(f.node(["dist/app.mjs"]), "loaded\nAda");
    },
  );
});

test("Moduli: verbatimModuleSyntax rifiuta export ESM in file CommonJS", () => {
  const cfg = nodeConfig();
  cfg.compilerOptions.verbatimModuleSyntax = true;
  fixture(
    project({
      "tsconfig.json": cfg,
      "src/math.cts": snippet(names[1], "export function sum"),
    }),
    (f) => diagnostic(f.tsc("-p", "tsconfig.json"), 1287),
  );
});

test("Moduli: Node 24 require ESM sincrono ma non un grafo con top-level await", () => {
  fixture(
    {
      "sync.mjs": "export const value = 42;",
      "async.mjs": "await Promise.resolve(); export const value = 42;",
      "app.cjs": 'console.log(require("./sync.mjs").value);',
    },
    (f) => {
      ok(f.node(["app.cjs"]), "42");
      f.put("app.cjs", 'require("./async.mjs");');
      const result = f.node(["app.cjs"]);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /ERR_REQUIRE_ASYNC_MODULE/);
    },
  );
});

test("Resolution: esempio locale, traceResolution e output verificati", () => {
  fixture(
    project({
      "src/config.ts": snippet(names[2], "export function loadConfig"),
      "src/app.ts": snippet(names[2], "import { loadConfig }"),
    }),
    (f) => {
      const traced = f.tsc("-p", "tsconfig.json", "--traceResolution");
      ok(traced);
      assert.match(traced.stdout, /config\.ts/);
      assert.match(traced.stdout, /successfully resolved/);
      ok(f.node(["dist/app.js"]), "Configurazione caricata");
    },
  );
});

test("Resolution: exports consente la API pubblica, non file privati esistenti", () => {
  fixture(
    project({
      "src/app.ts":
        'import { value } from "example-package"; console.log(value);',
      "node_modules/example-package/package.json": {
        name: "example-package",
        type: "module",
        exports: { ".": { types: "./index.d.ts", default: "./index.js" } },
      },
      "node_modules/example-package/index.d.ts":
        "export declare const value: number;",
      "node_modules/example-package/index.js": "export const value = 42;",
      "node_modules/example-package/internal.js": "export const secret = 7;",
      "node_modules/example-package/internal.d.ts":
        "export declare const secret: number;",
    }),
    (f) => {
      ok(f.tsc("-p", "tsconfig.json"));
      ok(f.node(["dist/app.js"]), "42");
      f.put(
        "src/app.ts",
        'import { secret } from "example-package/internal"; console.log(secret);',
      );
      diagnostic(f.tsc("-p", "tsconfig.json"), 2307);
      const runtime = f.node([
        "--input-type=module",
        "-e",
        'import "example-package/internal";',
      ]);
      assert.match(runtime.stderr, /ERR_PACKAGE_PATH_NOT_EXPORTED/);
    },
  );
});

test("Resolution: dichiarazione senza implementazione non rende eseguibile un modulo", () => {
  fixture(
    project({
      "src/missing.d.ts":
        'declare module "missing-package" { export const value: number; }',
      "src/app.ts":
        'import { value } from "missing-package"; console.log(value);',
    }),
    (f) => {
      ok(f.tsc("-p", "tsconfig.json"));
      const runtime = f.node(["dist/app.js"]);
      assert.notEqual(runtime.status, 0);
      assert.match(runtime.stderr, /ERR_MODULE_NOT_FOUND/);
    },
  );
});

test("Alias: paths senza baseUrl, bundle esbuild funzionante, tsc non riscrive", () => {
  const cfg = config(names[3], 0);
  fixture(
    {
      "package.json": nodePackage(),
      "tsconfig.json": cfg,
      "src/shared/label.ts": snippet(names[3], "export function label"),
      "src/app.ts": snippet(names[3], 'from "@/shared/label"'),
    },
    (f) => {
      ok(f.tsc("-p", "tsconfig.json"));
      assert.equal(f.exists("dist"), false);
      const command = blocks(names[3], "sh").find((value) =>
        value.startsWith("npm exec -- esbuild "),
      );
      const bundle = spawnSync(
        process.execPath,
        [
          require.resolve("esbuild/bin/esbuild"),
          ...command.slice("npm exec -- esbuild ".length).split(" "),
        ],
        { cwd: f.root, encoding: "utf8", timeout: 30000 },
      );
      ok(bundle);
      ok(f.node(["dist/app.mjs"]), "Ciao Ada");
      ok(
        f.tsc(
          "-p",
          "tsconfig.json",
          "--noEmit",
          "false",
          "--outDir",
          "emitted",
        ),
      );
      assert.match(f.read("emitted/app.js"), /@\/shared\/label/);
      const runtime = f.node(["emitted/app.js"]);
      assert.notEqual(runtime.status, 0);
      assert.match(runtime.stderr, /ERR_MODULE_NOT_FOUND/);
    },
  );
});

test("Alias: package imports # risolve sorgenti prima della prima build", () => {
  fixture(
    {
      "package.json": config(names[3], 1),
      "tsconfig.json": config(names[3], 2),
      "src/shared/label.ts": snippet(names[3], "export function label"),
      "src/app.ts": snippet(names[3], 'from "#shared/label"'),
    },
    (f) => {
      assert.equal(f.exists("dist"), false);
      ok(f.tsc("-p", "tsconfig.json"));
      assert.match(f.read("dist/app.js"), /#shared\/label/);
      ok(f.node(["dist/app.js"]), "Ciao Ada");
      f.put("package.json", nodePackage());
      const runtime = f.node(["dist/app.js"]);
      assert.match(runtime.stderr, /ERR_PACKAGE_IMPORT_NOT_DEFINED/);
    },
  );
});

const referenceFiles = () => ({
  "tsconfig.json": config(names[4], 0),
  "package.json": config(names[4], 1),
  "packages/domain/tsconfig.json": config(names[4], 2),
  "packages/api/tsconfig.json": config(names[4], 3),
  "packages/domain/src/index.ts": snippet(names[4], "export function greeting"),
  "packages/api/src/main.ts": snippet(names[4], "import { greeting }"),
});
test("References: build da zero, cache, forza, errori e pulizia", () => {
  fixture(referenceFiles(), (f) => {
    ok(f.tsc("-p", "tsconfig.json"));
    assert.equal(f.exists("packages/domain/dist"), false);
    const dry = f.tsc("-b", "--dry", "--verbose");
    ok(dry);
    assert.equal(f.exists("packages/domain/dist"), false);
    ok(f.tsc("-b", "--stopBuildOnErrors"));
    ok(f.node(["packages/api/dist/main.js"]), "Ciao Ada");
    assert.match(f.read("packages/domain/dist/index.d.ts"), /greeting/);
    assert.ok(f.exists("packages/domain/tsconfig.tsbuildinfo"));
    const again = f.tsc("-b", "--verbose", "--stopBuildOnErrors");
    ok(again);
    assert.match(again.stdout, /is up to date/);
    ok(f.tsc("-b", "--force", "--stopBuildOnErrors"));
    const before = f.read("packages/domain/dist/index.js");
    f.put(
      "packages/domain/src/index.ts",
      "export const greeting: string = 42;",
    );
    const failed = f.tsc("-b", "--verbose", "--stopBuildOnErrors");
    diagnostic(failed, 2322);
    assert.match(failed.stdout, /Skipping build/);
    assert.equal(f.read("packages/domain/dist/index.js"), before);
    f.put("packages/api/dist/manual.txt", "not a compiler output");
    ok(f.tsc("-b", "--clean"));
    assert.equal(f.exists("packages/domain/dist/index.js"), false);
    assert.equal(f.exists("packages/api/dist/main.js"), false);
    assert.ok(f.exists("packages/api/dist/manual.txt"));
    assert.ok(f.exists("packages/domain/src/index.ts"));
  });
});

test("References: consumer -p non costruisce dipendenze e composite e obbligatorio", () => {
  fixture(referenceFiles(), (f) => {
    diagnostic(f.tsc("-p", "packages/api"), 2307);
    const cfg = config(names[4], 2);
    cfg.compilerOptions.composite = false;
    f.put("packages/domain/tsconfig.json", cfg);
    diagnostic(f.tsc("-b", "--stopBuildOnErrors"), 6306);
  });
});

test("Strict: null, stringa vuota e array vuoto hanno esiti distinti", () => {
  assert.deepEqual(run(snippet(names[5], "function formatName")).output, [
    ["Senza nome"],
    ["ADA"],
    [""],
  ]);
  const first = snippet(names[5], "function firstUpper");
  valid(first, { noUncheckedIndexedAccess: true });
  assert.deepEqual(run(first).output, [["Lista vuota"], ["ADA"]]);
  invalid(
    "function bad(name: string | null) { return name.toUpperCase(); }",
    18047,
  );
});

test("Strict: accesso non controllato richiede un flag aggiuntivo", () => {
  const source =
    "function first(names: string[]) { return names[0].toUpperCase(); }";
  valid(source);
  invalid(source, 2532, { noUncheckedIndexedAccess: true });
  assert.throws(
    () => run(source + "\nfirst([]);"),
    (error) => error.name === "TypeError",
  );
});

test("Strict: assenza e undefined esplicito con exactOptionalPropertyTypes", () => {
  const source = snippet(names[5], "type Preferences");
  valid(source, { exactOptionalPropertyTypes: true });
  const extra = "\nconst explicit: Preferences = { theme: undefined };";
  valid(source + extra);
  invalid(source + extra, 2375, { exactOptionalPropertyTypes: true });
  valid(
    (source + extra).replace(
      'theme?: "light" | "dark";',
      'theme?: "light" | "dark" | undefined;',
    ),
    { exactOptionalPropertyTypes: true },
  );
});

test("Strict: any esplicito e JSON.parse non sono validazione runtime", () => {
  valid(
    'const unchecked: any = 42; const parsed = JSON.parse("null"); parsed.missing();',
  );
  invalid("function echo(value) { return value; }", 7006);
  invalid(
    'try { throw new Error("x"); } catch (error) { console.log(error.message); }',
    18046,
  );
});

test("Strict: iterator return, override mirato e use strict emesso", () => {
  invalid(
    "const value: string = new Set<string>().values().next().value;",
    2322,
  );
  valid("const value: string = new Set<string>().values().next().value;", {
    strictBuiltinIteratorReturn: false,
  });
  assert.match(valid("const value = 1;").js, /"use strict"/);
  valid("const value: string = null;", { strictNullChecks: false });
});

const mapFiles = () => ({
  "tsconfig.json": config(names[6], 0),
  "package.json": config(names[6], 1),
  "src/app.ts": snippet(names[6], "type Operand"),
});
test("Source maps: stack JS contro TS, riga esatta e mappa esterna", () => {
  fixture(mapFiles(), (f) => {
    ok(f.tsc("-p", "tsconfig.json"));
    const map = JSON.parse(f.read("dist/app.js.map"));
    assert.deepEqual(map.sources, ["../src/app.ts"]);
    assert.equal(map.sourcesContent, undefined);
    assert.ok(map.mappings.length > 0);
    const plain = f.node(["dist/app.js"]);
    assert.equal(plain.status, 1);
    assert.match(plain.stderr, /dist[\\/]app\.js/);
    const mapped = f.node(["--enable-source-maps", "dist/app.js"]);
    assert.equal(mapped.status, 1);
    const line =
      snippet(names[6], "type Operand")
        .split("\n")
        .findIndex((value) => value.includes("throw new Error")) + 1;
    assert.match(mapped.stderr, new RegExp("src[\\\\/]app\\.ts:" + line + ":"));
    assert.match(mapped.stderr, /Divisione per zero/);
  });
});

test("Source maps: inlineSources incorpora sorgenti, inlineSourceMap la mappa", () => {
  const files = mapFiles();
  files["tsconfig.json"].compilerOptions.sourceMap = false;
  files["tsconfig.json"].compilerOptions.inlineSourceMap = true;
  files["tsconfig.json"].compilerOptions.inlineSources = true;
  fixture(files, (f) => {
    ok(f.tsc("-p", "tsconfig.json"));
    assert.equal(f.exists("dist/app.js.map"), false);
    const encoded = f
      .read("dist/app.js")
      .match(/sourceMappingURL=data:application\/json;base64,([^\s]+)/)[1];
    const map = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
    assert.equal(map.sourcesContent[0], snippet(names[6], "type Operand"));
    const mapped = f.node(["--enable-source-maps", "dist/app.js"]);
    assert.equal(mapped.status, 1);
    assert.match(mapped.stderr, /src[\\/]app\.ts/);
  });
});

test("Source maps: opzioni incompatibili e nessuna emissione con noEmit", () => {
  fixture(mapFiles(), (f) => {
    ok(f.tsc("-p", "tsconfig.json", "--noEmit"));
    assert.equal(f.exists("dist"), false);
    diagnostic(f.tsc("-p", "tsconfig.json", "--inlineSourceMap"), 5053);
    diagnostic(
      f.tsc("-p", "tsconfig.json", "--sourceMap", "false", "--inlineSources"),
      5051,
    );
  });
});
