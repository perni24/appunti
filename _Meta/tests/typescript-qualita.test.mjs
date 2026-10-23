import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";
import { ts, valid, invalid, run } from "./typescript-examples.mjs";

assert.ok(
  process.env.TYPESCRIPT_QUALITY_TOOLS_DIR,
  "Vedere README: TYPESCRIPT_QUALITY_TOOLS_DIR",
);
const toolRoot = fs.realpathSync(process.env.TYPESCRIPT_QUALITY_TOOLS_DIR);
const req = createRequire(path.join(toolRoot, "package.json"));
const names = [
  "Testing in TypeScript",
  "Linting e formattazione",
  "Best Practices",
  "Error Handling",
  "Type-level testing",
  "ts-reset",
];
const notes = names.map((n) =>
  parseNote("Programmazione/TypeScript/Pagine/" + n + ".md"),
);
const blocks = (i, lang = "ts") =>
  notes[i].tree.children
    .filter((n) => n.type === "code" && n.lang === lang)
    .map((n) => n.value);
const code = (i, j = 0) => blocks(i)[j];
const best = blocks(2).join("\n");
const errors = blocks(3).join("\n");
const clone = (v) => structuredClone(v);
const cli = (pkg, sub) =>
  path.join(path.dirname(req.resolve(pkg + "/package.json")), sub);

// Dependencies are linked individually; writable caches remain inside the fixture.
function fixture(files, action) {
  const temp = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(temp, "appunti-typescript-quality-"));
  const links = [];
  const locate = (name) => {
    const file = path.resolve(root, name);
    assert.ok(file.startsWith(root + path.sep));
    return file;
  };
  const put = (name, content) => {
    const file = locate(name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
      file,
      typeof content === "string" ? content : JSON.stringify(content),
    );
  };
  const node = (...args) => {
    const env = { ...process.env, NODE_OPTIONS: "", NO_COLOR: "1" };
    delete env.NODE_ENV;
    const r = spawnSync(process.execPath, args, {
      cwd: root,
      env,
      encoding: "utf8",
      timeout: 90000,
      windowsHide: true,
    });
    assert.ifError(r.error);
    assert.equal(r.signal, null);
    return { status: r.status, output: r.stdout + r.stderr };
  };
  try {
    for (const [name, content] of Object.entries(files)) put(name, content);
    fs.mkdirSync(locate("node_modules"));
    for (const entry of fs.readdirSync(path.join(toolRoot, "node_modules"), {
      withFileTypes: true,
    })) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      const target = path.join(toolRoot, "node_modules", entry.name);
      const destination = locate("node_modules/" + entry.name);
      fs.symlinkSync(
        target,
        destination,
        process.platform === "win32" ? "junction" : "dir",
      );
      links.push({ target, destination });
    }
    action({
      put,
      node,
      locate,
      read: (name) => fs.readFileSync(locate(name), "utf8"),
      tsc: (...args) =>
        node(req.resolve("typescript/bin/tsc"), "--pretty", "false", ...args),
      vitest: () =>
        node(cli("vitest", "vitest.mjs"), "run", "--maxWorkers", "1"),
      lint: () =>
        node(cli("eslint", "bin/eslint.js"), "src", "--max-warnings", "0"),
      prettier: (...args) => node(cli("prettier", "bin/prettier.cjs"), ...args),
    });
  } finally {
    assert.equal(path.dirname(fs.realpathSync(root)), temp);
    assert.ok(path.basename(root).startsWith("appunti-typescript-quality-"));
    for (const { target, destination } of links) {
      assert.equal(fs.realpathSync(destination), fs.realpathSync(target));
      fs.unlinkSync(destination);
    }
    fs.rmSync(root, { recursive: true, force: true });
  }
}
function ok(r, pattern) {
  assert.equal(r.status, 0, r.output);
  if (pattern) assert.match(r.output, pattern);
  return r.output;
}
function fails(r, pattern) {
  assert.notEqual(r.status, 0, r.output);
  assert.match(r.output, pattern);
}
const jsonFiles = (i) => ({
  "package.json": blocks(i, "json")[0],
  "tsconfig.json": blocks(i, "json")[1],
});
const testing = {
  ...jsonFiles(0),
  "src/quantity.ts": code(0),
  "tests/quantity.test.ts": code(0, 1),
};
const linting = {
  ...jsonFiles(1),
  "eslint.config.mjs": blocks(1, "js")[0],
  "src/save.ts": code(1) + "\n",
};
const typing = {
  ...jsonFiles(4),
  "src/first.ts": code(4),
  "tests/first.types.ts": code(4, 1),
};
const reset = {
  ...jsonFiles(5),
  "reset.d.ts": code(5),
  "src/main.ts": code(5, 1),
};

test("Qualita: baseline degli strumenti", () => {
  assert.equal(ts.version, "5.9.3");
  assert.equal(process.versions.node, "24.14.0");
  for (const [name, version] of Object.entries({
    typescript: "5.9.3",
    vitest: "4.1.12",
    vite: "8.3.4",
    eslint: "10.13.0",
    "@eslint/js": "10.0.1",
    "typescript-eslint": "8.72.0",
    prettier: "3.9.10",
    "@total-typescript/ts-reset": "0.6.1",
    "@types/node": "24.19.2",
  }))
    assert.equal(req(name + "/package.json").version, version);
});
for (const [i, name] of names.entries())
  test(name + ": struttura e metadati", () => {
    assert.equal(notes[i].data.title, name);
    assert.equal(notes[i].data.publish, true);
    assert.equal(notes[i].data.status, "non revisionato");
    assert.match(notes[i].body, /## Fonti/);
    assert.equal(notes[i].body.match(/^# /gm).length, 1);
    for (const j of blocks(i, "json")) JSON.parse(j);
    for (const command of blocks(i, "bash"))
      assert.equal(command.split("\n").length, 1);
    for (const field of ["prerequisites", "related"])
      for (const link of notes[i].data[field])
        assert.match(link, /^\[\[Programmazione\/.+\]\]$/);
  });

test("Testing: checker e 13 casi Vitest reali", () =>
  fixture(testing, (p) => {
    ok(p.tsc("--noEmit"));
    ok(p.vitest(), /13 passed/);
  }));
test("Testing: runner verde con errore statico, checker rosso", () =>
  fixture(testing, (p) => {
    p.put("src/unrelated.ts", "const wrong: string = 42; export { wrong };");
    ok(p.vitest(), /13 passed/);
    fails(p.tsc("--noEmit"), /TS2322/);
  }));
test("Testing: expectTypeOf richiede comunque il checker", () =>
  fixture(testing, (p) => {
    p.put(
      "tests/types.test.ts",
      'import {it, expectTypeOf} from "vitest"; it("tipi incompatibili", () => { expectTypeOf<number>().toEqualTypeOf<string>(); });',
    );
    ok(p.vitest(), /14 passed/);
    fails(p.tsc("--noEmit"), /TS2344/);
  }));

test("Testing: mutazione della logica individuata dai test runtime", () =>
  fixture(testing, (p) => {
    p.put(
      "src/quantity.ts",
      code(0).replace("return input;", "return input + 1;"),
    );
    ok(p.tsc("--noEmit"));
    fails(p.vitest(), /failed/);
  }));
test("Testing: rifiuti asincroni non nascosti dal runner", () =>
  fixture(testing, (p) => {
    p.put(
      "src/quantity.ts",
      code(0).replace(
        "return parseQuantity(await read());",
        "await read(); return 1;",
      ),
    );
    fails(p.vitest(), /failed/);
  }));
test("Lint: configurazione effettiva, checker e formatter", () =>
  fixture(linting, (p) => {
    ok(p.tsc("--noEmit"));
    ok(p.lint());
    ok(p.prettier("--check", "src"));
  }));
for (const [index, line] of code(1, 1).split("\n").entries())
  test("Lint: Promise non gestita, variante " + index, () =>
    fixture(linting, (p) => {
      p.put("src/save.ts", code(1) + "\n" + line);
      ok(p.tsc("--noEmit"));
      fails(p.lint(), /@typescript-eslint\/no-floating-promises/);
    }),
  );
test("Lint: regole type-aware segnalano any da JSON", () =>
  fixture(linting, (p) => {
    p.put("src/unsafe.ts", 'export const value = JSON.parse("{}");');
    ok(p.tsc("--noEmit"));
    fails(p.lint(), /@typescript-eslint\/no-unsafe-assignment/);
  }));
test("Lint: file escluso dal tsconfig segnalato dal project service", () =>
  fixture(linting, (p) => {
    const config = JSON.parse(blocks(1, "json")[1]);
    config.include = ["src/save.ts"];
    p.put("tsconfig.json", config);
    p.put("src/outside.ts", "export const value = 1;");
    fails(p.lint(), /not found by the project service/);
  }));
test("Lint: format check non riscrive, write corregge", () =>
  fixture(linting, (p) => {
    p.put("src/messy.ts", "export const value={x:1,y:2}");
    fails(p.prettier("--check", "src"), /Code style issues/);
    assert.equal(p.read("src/messy.ts"), "export const value={x:1,y:2}");
    ok(p.prettier("--write", "src"));
    ok(p.prettier("--check", "src"));
    assert.notEqual(p.read("src/messy.ts"), "export const value={x:1,y:2}");
  }));

test("Best Practices: formati ammessi e valori finiti", () => {
  const f = run(best, "parseNumber").value;
  for (const [input, expected] of [
    [0, 0],
    [-2.5, -2.5],
    [" 12.5 ", 12.5],
    [".5", 0.5],
    ["+2", 2],
    ["01", 1],
    ["-0", -0],
  ])
    assert.deepEqual(clone(f(input)), { ok: true, value: expected });
  for (const input of [NaN, Infinity, -Infinity])
    assert.deepEqual(clone(f(input)), { ok: false, error: "range" });
});
test("Best Practices: tipi e sintassi rifiutati senza coercion di oggetti", () => {
  const f = run(best, "parseNumber").value;
  const dangerous = {
    valueOf() {
      throw new Error("must not run");
    },
  };
  for (const input of [
    null,
    true,
    undefined,
    [],
    [2],
    {},
    dangerous,
    Symbol("x"),
    2n,
  ])
    assert.deepEqual(clone(f(input)), { ok: false, error: "type" });
  for (const input of [
    "",
    " ",
    "0x10",
    "1e3",
    "1.",
    "1,5",
    "1\n2",
    "x",
    "1".repeat(65),
  ])
    assert.deepEqual(clone(f(input)), { ok: false, error: "format" });
});
test("Best Practices: precisione, Result ignorabile e narrowing", () => {
  assert.equal(
    run(best, 'parseNumber("9007199254740993").value').value,
    9007199254740992,
  );
  valid(best + "\nparseNumber(true);");
  invalid(best + '\nconst bad = parseNumber("1").value;', 2339);
});

test("Error Handling: JSON, forma, intervalli e proiezione", () => {
  const f = run(errors, "parseConfig").value;
  for (const port of [1, 80, 65535])
    assert.deepEqual(clone(f(JSON.stringify({ port, secret: true }))), {
      ok: true,
      value: { port },
    });
  assert.deepEqual(clone(f("{")), { ok: false, error: "invalid_json" });
  for (const input of [
    null,
    [],
    {},
    { port: "80" },
    { port: 0 },
    { port: 65536 },
    { port: 1.5 },
    { port: null },
  ])
    assert.deepEqual(clone(f(JSON.stringify(input))), {
      ok: false,
      error: "invalid_config",
    });
});
test("Error Handling: assenza distinta da I/O e cause preservate", async () => {
  const f = run(errors, "loadConfig").value;
  assert.deepEqual(clone(await f(() => Promise.resolve(undefined))), {
    ok: false,
    error: "missing",
  });
  assert.deepEqual(clone(await f(() => Promise.resolve('{"port":80}'))), {
    ok: true,
    value: { port: 80 },
  });
  for (const cause of [new Error("secret"), "secret", 42, undefined]) {
    // Promise.resolve assimilates the Promise produced in the VM realm.
    await assert.rejects(
      Promise.resolve(f(() => Promise.reject(cause))),
      (error) =>
        error.message === "Configuration read failed" &&
        Object.is(error.cause, cause),
    );
  }
});
test("Error Handling: messaggi pubblici e catch asincrono", async () => {
  const f = run(errors, "describeConfig").value;
  for (const [input, message] of [
    [undefined, "Configuration missing"],
    ["{", "Malformed JSON"],
    ['{"port":0}', "Invalid configuration"],
    ['{"port":80}', "Port: 80"],
  ])
    assert.equal(await f(() => Promise.resolve(input)), message);
  assert.equal(
    await f(() => Promise.reject(new Error("credential"))),
    "Configuration unavailable",
  );
});
test("Error Handling: catch unknown, .catch standard e exhaustiveness", () => {
  invalid(
    'try { throw "x"; } catch (error) { console.log(error.message); }',
    18046,
  );
  valid('Promise.reject("x").catch(error => error.nonexistent());');
  invalid(
    'Promise.reject("x").catch((error: unknown) => error.nonexistent());',
    18046,
  );
  invalid(
    errors.replace(
      'type ConfigError = "missing" | "invalid_json" | "invalid_config";',
      'type ConfigError = "missing" | "invalid_json" | "invalid_config" | "new_case";',
    ),
    2322,
  );
});

test("Type tests: progetto positivo e direttive incluse", () =>
  fixture(typing, (p) => ok(p.tsc())));
test("Type tests: file esclusi possono dare un falso verde", () =>
  fixture(typing, (p) => {
    p.put("tests/bad.types.ts", "const value: string = 123;");
    fails(p.tsc(), /TS2322/);
    const config = JSON.parse(blocks(4, "json")[1]);
    config.include = ["src/**/*.ts"];
    p.put("tsconfig.json", config);
    ok(p.tsc());
  }));
test("Type tests: readonly accettato dal contratto originale", () =>
  fixture(typing, (p) => {
    p.put("src/first.ts", code(4).replace("readonly T[]", "T[]"));
    fails(p.tsc(), /TS2345/);
  }));
test("Type tests: rimozione di undefined rilevata", () =>
  fixture(typing, (p) => {
    p.put("src/first.ts", code(4).replace(": T | undefined", ": T"));
    fails(p.tsc(), /TS2322/);
  }));
test("Type tests: direttiva obsoleta rilevata", () =>
  fixture(typing, (p) => {
    p.put(
      "tests/first.types.ts",
      code(4, 1).replace("first<string>([123])", 'first<string>(["valid"])'),
    );
    fails(p.tsc(), /TS2578/);
  }));
test("Type tests: regressione any rilevata", () =>
  fixture(typing, (p) => {
    p.put("src/first.ts", code(4).replace(": T | undefined", ": any"));
    fails(p.tsc(), /TS2344/);
  }));
test("Type tests: comportamento reale di first separato dal checker", () => {
  const { value } = run(code(4), "exports.first");
  assert.equal(value([]), undefined);
  assert.equal(value(["u1", "u2"]), "u1");
});

test("ts-reset: regola selettiva, build e output senza import runtime", () =>
  fixture(reset, (p) => {
    ok(p.tsc("--noEmit"));
    ok(p.tsc());
    assert.doesNotMatch(p.read("dist/main.js"), /ts-reset/);
    ok(p.node("dist/main.js"), /u1/);
    p.put("src/probe.ts", 'export const value = JSON.parse("{}");\nvalue.id;');
    fails(p.tsc("--noEmit"), /TS18046/);
  }));
test("ts-reset: setup escluso lascia JSON.parse any", () =>
  fixture(reset, (p) => {
    p.put("src/probe.ts", 'const value = JSON.parse("{}");\nvalue.id;');
    fails(p.tsc("--noEmit"), /TS18046/);
    const config = JSON.parse(blocks(5, "json")[1]);
    config.include = ["src/**/*.ts"];
    p.put("tsconfig.json", config);
    ok(p.tsc("--noEmit"));
  }));
test("ts-reset: preset completo, filter e includes", () =>
  fixture(reset, (p) => {
    p.put("reset.d.ts", code(5, 2));
    p.put(
      "src/filter.ts",
      code(5, 3) + "\nexport { kept, filtered, containsRole };",
    );
    p.put(
      "src/probe.ts",
      'import {kept, filtered, containsRole} from "./filter.js";\nconst a: (1 | "ok")[] = kept;\nconst b: number[] = filtered;\nconst c: boolean = containsRole("admin");',
    );
    ok(p.tsc());
    ok(
      p.node(
        "--input-type=module",
        "-e",
        'import assert from "node:assert/strict"; const m = await import("./dist/filter.js"); assert.deepEqual(m.kept,[1,"ok"]);assert.deepEqual(m.filtered,[1]);assert.equal(m.containsRole("admin"),false);assert.equal(m.containsRole("reader"),true);',
      ),
    );
  }));
test("ts-reset: regola JSON non abilita da sola filter/includes", () =>
  fixture(reset, (p) => {
    p.put("src/filter.ts", code(5, 3));
    fails(p.tsc("--noEmit"), /TS2345/);
  }));
test("ts-reset: includes non restringe la stringa", () =>
  fixture(reset, (p) => {
    p.put("reset.d.ts", code(5, 2));
    p.put(
      "src/probe.ts",
      'const roles = ["reader","writer"] as const; function f(value: string) { if (roles.includes(value)) { const role: "reader" | "writer" = value; return role; } }',
    );
    fails(p.tsc("--noEmit"), /TS2322/);
  }));
test("ts-reset: preset completo rende unknown anche Promise.catch", () =>
  fixture(reset, (p) => {
    p.put("reset.d.ts", code(5, 2));
    p.put("src/probe.ts", 'Promise.reject("x").catch(error => error.message);');
    fails(p.tsc("--noEmit"), /TS18046/);
  }));

test("ts-reset: JSON malformato continua a lanciare", () =>
  fixture(reset, (p) => {
    p.put("src/broken.ts", 'JSON.parse("{");');
    ok(p.tsc());
    fails(p.node("dist/broken.js"), /SyntaxError/);
  }));
