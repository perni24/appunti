import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { parseNote } from "../../site/scripts/vault.mjs";
import {
  ts,
  valid,
  invalid,
  run,
  hasName,
  typeChecks,
} from "./typescript-examples.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const names = [
  "Structural typing",
  "Variance",
  "Distributive conditional types",
  "Type inference avanzata",
  "Declaration Merging",
  "Module augmentation",
  "Namespace",
  "Decorators",
];
const notes = new Map(
  names.map((name) => [
    name,
    parseNote("Programmazione/TypeScript/Pagine/" + name + ".md"),
  ]),
);
const blocks = (name, lang = "ts") =>
  notes
    .get(name)
    .tree.children.filter((n) => n.type === "code" && n.lang === lang)
    .map((n) => n.value);
function snippet(name, marker) {
  const found = blocks(name).filter((code) => code.includes(marker));
  assert.equal(found.length, 1, name + ": marker " + marker);
  return found[0];
}
const code = (index, marker) => snippet(names[index], marker);
const json = (index, position) =>
  JSON.parse(blocks(names[index], "json")[position]);
const checkTypes = (source, checks) =>
  valid(source + "\n" + typeChecks + "\n" + checks);

// Generated projects are confined to a verified temporary directory.
function fixture(files, action) {
  const temp = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(temp, "appunti-typescript-depth-"));
  const locate = (name) => {
    const target = path.resolve(root, name);
    assert.ok(target.startsWith(root + path.sep));
    return target;
  };
  const put = (name, value) => {
    const target = locate(name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(
      target,
      typeof value === "string" ? value : JSON.stringify(value),
    );
  };
  const node = (args) => {
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
    node([require.resolve("typescript/bin/tsc"), ...args, "--pretty", "false"]);
  try {
    for (const [name, value] of Object.entries(files)) put(name, value);
    return action({
      put,
      tsc,
      node,
      read: (name) => fs.readFileSync(locate(name), "utf8"),
      exists: (name) => fs.existsSync(locate(name)),
    });
  } finally {
    const resolved = fs.realpathSync(root);
    assert.equal(path.dirname(resolved), temp);
    assert.ok(path.basename(resolved).startsWith("appunti-typescript-depth-"));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
}
function ok(result, output) {
  assert.equal(result.status, 0, result.stdout + result.stderr);
  if (output !== undefined) assert.equal(result.stdout.trim(), output);
}
function diagnostic(result, number) {
  assert.notEqual(result.status, 0);
  assert.match(
    result.stdout + result.stderr,
    new RegExp("TS" + number + "\\b"),
  );
}
const project = (files = {}) => ({
  "package.json": json(5, 0),
  "tsconfig.json": json(5, 1),
  "src/box.ts": code(5, "export class Box"),
  "src/box-label.ts": code(5, "declare module"),
  "src/main.ts": code(5, "new Box(42)"),
  ...files,
});

test("Type System: baseline compilatore e runtime", () => {
  assert.equal(ts.version, "5.9.3");
  assert.equal(process.versions.node, "24.14.0");
});
for (const name of names)
  test(name + ": metadati, fonti e comandi copiabili", () => {
    assert.equal(notes.get(name).data.status, "non revisionato");
    assert.equal(notes.get(name).data.publish, true);
    assert.match(notes.get(name).body, /## Fonti/);
    assert.match(notes.get(name).body, /5\.9\.3/);
    for (const command of blocks(name, "sh"))
      assert.equal(command.split("\n").length, 1);
  });

test("Structural: assegnazione preserva identita e proprieta runtime", () => {
  const source = code(0, "interface Point");
  assert.deepEqual(run(source).output, [
    [true],
    ['{"x":10,"y":20,"label":"start"}'],
  ]);
  invalid(
    source + '\nconst direct: Point = { x: 10, y: 20, label: "start" };',
    2353,
  );
  invalid(source + "\nconst back: typeof labeled = point;", 2741);
});
test("Structural: classe pubblica non implica instanceof", () => {
  assert.deepEqual(run(code(0, "class Label")).output, [["ready"], [false]]);
  invalid(
    "class A { private value = 1; } class B { private value = 1; } const a: A = new B();",
    2322,
  );
  invalid(
    "class A { #value = 1; } class B { #value = 1; } const a: A = new B();",
    2322,
  );
});
test("Structural: logger con contratto minimo", () => {
  const source = code(0, "interface Logger");
  assert.deepEqual(run(source).output, [["start"]]);
  invalid(source + "\nrunJob({ info(message: number) {} });", 2322);
});
test("Structural: weak type richiede membri in comune", () => {
  const source = code(0, "type Options");
  assert.deepEqual(run(source).output, [[1000]]);
  invalid(source + "\nconst invalidOptions: Options = unrelated;", 2559);
});

test("Variance: reader e writer hanno direzioni opposte", () => {
  const source = code(1, "type Reader");
  assert.deepEqual(run(source).output, [["preview"], ["export"]]);
  invalid(source + "\nconst reverse: Reader<RenderTask> = general;", 2322);
  invalid(source + "\nconst reverse: Writer<Task> = renderWriter;", 2322);
});
test("Variance: callback stretta respinta da strictFunctionTypes", () => {
  const source = code(1, "type Handler");
  assert.deepEqual(run(source).output, [["job"]]);
  invalid(source + "\nconst unsafeHandler: Handler<Task> = renderOnly;", 2322);
  valid(source + "\nconst unsafeHandler: Handler<Task> = renderOnly;", {
    strictFunctionTypes: false,
  });
});
test("Variance: metodo bivariante puo fallire a runtime", () => {
  const source = code(1, "type MethodHandler");
  valid(source);
  assert.throws(
    () => run(source + '\nwidened.handle({ id: "plain" });'),
    hasName("TypeError"),
  );
});
test("Variance: store invariabile in entrambe le direzioni", () => {
  const source = code(1, "type Store");
  assert.deepEqual(run(source).output, [["image"]]);
  invalid(source + "\nconst widenedStore: Store<Task> = store;", 2322);
  invalid(
    source +
      "\ndeclare const general: Store<Task>; const narrow: Store<RenderTask> = general;",
    2322,
  );
});
test("Variance: alias mutabile di un array e vista readonly", () => {
  const source = code(1, "const renders");
  assert.deepEqual(run(source).output, [[2]]);
  assert.throws(
    () => run(source + "\nrenders[1]!.render();"),
    hasName("TypeError"),
  );
  invalid(source + '\nview.push({ id: "other" });', 2339);
});
test("Variance: annotazioni controllate ma non nominali", () => {
  const source = code(1, "interface Source");
  valid(
    source + "\nconst source: Source<string | number> = { read: () => 42 };",
  );
  invalid("interface Wrong<out T> { write: (value: T) => void; }", 2636);
});

test("Distribution: filtro, wrapper e union concreta", () => {
  const source = code(2, "type OnlyStrings");
  checkTypes(
    source,
    'type Checks = [Expect<Equal<Filtered, "ready">>, Expect<Equal<Rejected, never>>, Expect<Equal<Concrete, false>>];',
  );
  assert.deepEqual(run(source).output, [["ready"]]);
});
test("Distribution: array misto e union di array", () => {
  const source = code(2, "type SeparateArrays");
  assert.deepEqual(run(source).output, [[2, 2]]);
  invalid(
    source + '\nconst rejected: SeparateArrays<string | number> = ["a", 1];',
    2322,
  );
});
test("Distribution: eventi filtrati senza perdere payload", () => {
  const source = code(2, "type AppEvent");
  assert.deepEqual(run(source).output, [["user:created:u1"]]);
  checkTypes(source, "type Same = Expect<Equal<UserEvent, BuiltInUserEvent>>;");
  invalid(
    source + '\ndescribeUserEvent({ type: "invoice:paid", invoiceId: "i1" });',
    2322,
  );
});
test("Distribution: never, unknown e any", () => {
  checkTypes(
    code(2, "type Category"),
    'type Checks = [Expect<Equal<Empty, never>>, Expect<Equal<UnknownCategory, "other">>, Expect<Equal<AnyCategory, "text" | "other">>, Expect<Equal<NeverDetected, true>>, Expect<Equal<NormalDetected, false>>];',
  );
});
test("Distribution: prodotto di due union", () => {
  checkTypes(
    code(2, "type Pair"),
    'type Same = Expect<Equal<Pairs, ["read", 200] | ["read", 400] | ["write", 200] | ["write", 400]>>;',
  );
});

test("Inference: contextual typing e risultato della map", () => {
  const source = code(3, "function mapValues");
  assert.deepEqual(run(source).output, [["5,4"]]);
  checkTypes(source, "type Same = Expect<Equal<typeof lengths, number[]>>;");
  invalid(
    source +
      '\nconst standalone = value => value.length; mapValues(["a"], standalone);',
    7006,
  );
});
test("Inference: const preserva letterali, non recupera widening", () => {
  const source = code(3, "function defineConfig");
  assert.deepEqual(run(source).output, [["strict", true]]);
  checkTypes(
    source,
    'type Checks = [Expect<Equal<typeof config.mode, "strict">>, Expect<Equal<typeof config.routes, readonly ["home", "settings"]>>, Expect<Equal<typeof reused.mode, string>>];',
  );
  assert.equal(run(source, "Object.isFrozen(config)").value, false);
});
test("Inference: Map conserva chiavi ammesse e assenze", () => {
  const source = code(3, "function createMap");
  assert.deepEqual(run(source).output, [[true], [undefined]]);
  invalid(source + '\nflags.get("delete");', 2345);
  checkTypes(
    source + '\nconst absent = partial.get("write");',
    "type Same = Expect<Equal<typeof absent, boolean | undefined>>;",
  );
  assert.equal(run(source, "createMap([]).size").value, 0);
  assert.equal(run(source, 'createMap(["read", "read"]).size').value, 1);
  assert.equal(
    run(source, 'createMap(["toString"]).get("toString")').value,
    true,
  );
});
test("Inference: generics espliciti attivano il default", () => {
  const source = code(3, "function pair");
  assert.deepEqual(run(source).output, [["42"]]);
  checkTypes(
    source,
    "type Checks = [Expect<Equal<typeof inferred, [string, number]>>, Expect<Equal<typeof explicit, [string, unknown]>>];",
  );
  invalid(source + "\nexplicit[1].toFixed(0);", 2571);
});

test("Merging: proprieta obbligatorie e conflitti", () => {
  const source = code(4, "interface User");
  assert.deepEqual(run(source).output, [["u1", "user@example.test"]]);
  invalid(source + '\nconst incomplete: User = { id: "u2" };', 2741);
  invalid(source + "\ninterface User { email: number; }", 2717);
  invalid(
    "interface Options { timeout: number; } interface Options { timeout?: number; }",
    2687,
  );
});
test("Merging: overload implementati realmente", () => {
  assert.deepEqual(run(code(4, "interface Formatter")).output, [
    ["42"],
    ["ready"],
  ]);
});
test("Merging: interfaccia di classe non crea proprieta", () => {
  const source = code(4, "class Account");
  assert.deepEqual(run(source).output, [[undefined]]);
  assert.throws(
    () => run(source + "\naccount.tag.toUpperCase();"),
    hasName("TypeError"),
  );
});
test("Merging: declare global nel browser e inizializzazione reale", async () => {
  const { js } = valid(code(4, "declare global"));
  const { chromium } = require(
    process.env.PLAYWRIGHT_MODULE_PATH || "playwright",
  );
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage();
    const output = [];
    page.on("console", (message) => output.push(message.text()));
    // Execute the checked CommonJS emit with an exports shim in an actual DOM.
    await page.addScriptTag({
      content: "{ const exports = {};\n" + js + "\n}",
    });
    assert.equal(await page.evaluate(() => window.appVersion), "demo");
    assert.deepEqual(output, ["not configured", "page_view"]);
    assert.match(await browser.version(), /^\d+\./);
  } finally {
    await browser.close();
  }
});
test("Merging: script globale e interfaccia locale non sono equivalenti", () => {
  fixture(
    {
      "app.ts": code(4, "declare global").replace("export {};", ""),
      "tsconfig.json": {
        compilerOptions: {
          strict: true,
          target: "ES2022",
          module: "CommonJS",
          moduleDetection: "legacy",
          types: [],
          noEmit: true,
        },
        files: ["app.ts"],
      },
    },
    (f) => {
      diagnostic(f.tsc("-p", "tsconfig.json"), 2669);
    },
  );
  invalid(
    'export {}; interface Window { appVersion: string; } window.appVersion = "demo";',
    2339,
  );
});
test("Merging: alias e classi non riapribili", () => {
  invalid("type User = { id: string }; type User = { email: string };", 2300);
  invalid("class Account {} class Account {}", 2300);
});

test("Augmentation: progetto ESM completo compila ed esegue", () => {
  fixture(project(), (f) => {
    ok(f.tsc("-p", "tsconfig.json"));
    ok(f.node(["dist/main.js"]), "42");
    assert.match(f.read("dist/box-label.js"), /Box\.prototype\.describe/);
  });
});
test("Augmentation: senza import runtime il checker non basta", () => {
  const main = code(5, "new Box(42)").replace('import "./box-label.js";', "");
  fixture(project({ "src/main.ts": main }), (f) => {
    ok(f.tsc("-p", "tsconfig.json"));
    const result = f.node(["dist/main.js"]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /TypeError.*describe/);
  });
});
test("Augmentation: senza dichiarazione il metodo non esiste nel tipo", () => {
  fixture(project({ "src/box-label.ts": "export {};" }), (f) => {
    diagnostic(f.tsc("-p", "tsconfig.json"), 2339);
    assert.equal(f.exists("dist/main.js"), false);
  });
});
test("Augmentation: specifier errato e membro incompatibile", () => {
  fixture(
    project({
      "src/box-label.ts": code(5, "declare module").replace(
        'declare module "./box.js"',
        'declare module "./missing.js"',
      ),
    }),
    (f) => diagnostic(f.tsc("-p", "tsconfig.json"), 2664),
  );
  fixture(
    project({
      "src/box-label.ts": code(5, "declare module").replace(
        "describe(): string;",
        "value: string; describe(): string;",
      ),
    }),
    (f) => diagnostic(f.tsc("-p", "tsconfig.json"), 2717),
  );
});
test("Augmentation: declaration ambient distinta da un patch ESM", () => {
  fixture(
    {
      "tsconfig.json": {
        compilerOptions: {
          strict: true,
          noEmit: true,
          types: [],
          module: "NodeNext",
        },
        include: ["src/**/*"],
      },
      "src/vendor.d.ts":
        'declare module "demo-provider" { export const version: string; }',
      "src/main.ts":
        'import { version } from "demo-provider"; const value: string = version;',
    },
    (f) => {
      ok(f.tsc("-p", "tsconfig.json"));
      f.put(
        "src/vendor.d.ts",
        'export {}; declare module "demo-provider" { export const version: string; }',
      );
      diagnostic(f.tsc("-p", "tsconfig.json"), 2307);
    },
  );
});

test("Namespace: membri runtime e membro non esportato", () => {
  const source = code(6, "namespace MathUtils");
  assert.deepEqual(run(source).output, [[3], ["3.00"]]);
  invalid(source + "\nMathUtils.precision;", 2339);
  invalid(source, 1294, { erasableSyntaxOnly: true });
});
test("Namespace: funzione con proprieta runtime", () => {
  assert.deepEqual(run(code(6, "function buildLabel")).output, [
    ["label:user"],
    ["label:"],
  ]);
});
test("Namespace: merging non condivide membri privati", () => {
  const source = code(6, "namespace Settings");
  assert.deepEqual(run(source).output, [["app:theme", true]]);
  invalid(
    source.replace(
      "// export const copied = localPrefix;",
      "export const copied = localPrefix;",
    ),
    2304,
  );
});
test("Namespace: soli tipi eliminati dall'emit", () => {
  const source = code(6, "namespace Models");
  assert.deepEqual(run(source).output, [["u1"]]);
  assert.doesNotMatch(valid(source).js, /var Models|Models =/);
  invalid(source + "\nconsole.log(Models);", 2708);
});
test("Namespace: dichiarazione ambient non installa la libreria", () => {
  const source = code(6, "declare namespace");
  valid(source);
  assert.throws(
    () => run(source + "\nExternalUI.version();"),
    hasName("ReferenceError"),
  );
});

test("Decorators: wrapper moderno preserva this e firma", () => {
  const source = code(7, "function loggedMethod");
  assert.deepEqual(run(source).output, [["Calling run"], ["job:build"]]);
  invalid(source + '\nnew Service("job:").run(42);', 2345);
  assert.throws(
    () =>
      run(
        source +
          '\nconst detached = new Service("job:").run; detached("build");',
      ),
    hasName("TypeError"),
  );
});
test("Decorators: stesso oggetto Promise e propagazione errori", async () => {
  const source =
    code(7, "function loggedMethod") +
    '\nconst promised = Promise.resolve(42); class AsyncService { @loggedMethod run() { return promised; } } class Broken { @loggedMethod run(): never { throw new RangeError("broken"); } }';
  assert.equal(
    run(source, "new AsyncService().run() === promised").value,
    true,
  );
  assert.throws(
    () => run(source + "\nnew Broken().run();"),
    hasName("RangeError"),
  );
});
test("Decorators: valutazione top-down, applicazione bottom-up", () => {
  assert.deepEqual(run(code(7, "function mark")).output, [
    ["evaluate outer"],
    ["evaluate inner"],
    ["apply inner:run"],
    ["apply outer:run"],
    ["done"],
  ]);
});
test("Decorators: initializer di field non intercetta assegnazioni", () => {
  assert.deepEqual(run(code(7, "function trimmed")).output, [
    ["ready"],
    ["  later  "],
  ]);
});
test("Decorators: legacy usa il flag e il descriptor", () => {
  const source = code(7, "function legacyLogged");
  const { js } = valid(source, { experimentalDecorators: true });
  const output = [];
  vm.runInNewContext(
    js,
    { exports: {}, console: { log: (...args) => output.push(args) } },
    { timeout: 1000 },
  );
  assert.deepEqual(output, [["Legacy run"], ["ok"]]);
  invalid(source, 1241);
  invalid(code(7, "function loggedMethod"), 1241, {
    experimentalDecorators: true,
  });
});
test("Decorators: comandi CLI moderni e legacy con file reali", () => {
  fixture(
    {
      "modern.cts": code(7, "function loggedMethod"),
      "legacy.cts": code(7, "function legacyLogged"),
    },
    (f) => {
      for (const command of blocks(names[7], "sh")) {
        if (command.startsWith("npm exec -- tsc "))
          ok(f.tsc(...command.slice("npm exec -- tsc ".length).split(" ")));
        else
          ok(
            f.node(command.slice("node ".length).split(" ")),
            command.includes("modern")
              ? "Calling run\njob:build"
              : "Legacy run\nok",
          );
      }
    },
  );
});
test("Decorators: parametri moderni e metadata legacy incompatibili", () => {
  invalid(
    "function marker(...args: unknown[]) {} class Job { run(@marker value: string) {} }",
    1206,
  );
  invalid("class Job {}", 5052, { emitDecoratorMetadata: true });
});
