import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { mkdtemp, mkdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { snippet } from "./note-examples.mjs";
import { cycleFiles } from "./cycle-examples.mjs";

const proxyNote = "Proxy e Reflect";
function execute(marker) {
  const logs = [];
  const context = vm.createContext({
    console: { log: (...args) => logs.push(structuredClone(args)) },
  });
  vm.runInContext(snippet(proxyNote, marker), context, { timeout: 1000 });
  return { context, logs };
}
const read = (context, source) =>
  vm.runInContext(source, context, { timeout: 1000 });

for (const [marker, expected] of [
  ['const target = { name: "Luca" }', [["Luca"], [false], [["name"]]]],
  ["const base =", [["child"]]],
  ["const locked =", [[false], ["TypeError"]]],
  ["function addToBase", [[12]]],
  ["class Item", [["demo", true]]],
  ["const immutable =", [["TypeError"]]],
  ["class Secret", [["TypeError"], ["TypeError"]]],
  ["proxy: temporary", [["TypeError"], ["Luca"]]],
]) {
  test(`Proxy: output dello snippet ${marker}`, () =>
    assert.deepEqual(execute(marker).logs, expected));
}

test("Proxy: identita distinta, chiavi Symbol, alias e nessuna intercettazione profonda", () => {
  const { context } = execute('const target = { name: "Luca" }');
  assert.equal(read(context, "new Map([[target, 1]]).get(proxy)"), undefined);
  assert.equal(read(context, "accesses.length"), 1);
  read(
    context,
    "target.name = 'Ada'; target.profile = { count: 0 }; const profile = proxy.profile; profile.count++;",
  );
  assert.equal(read(context, "target.profile.count"), 1);
  assert.equal(read(context, "accesses.length"), 2);
  read(context, "const key = Symbol('key'); target[key] = 2; proxy[key]");
  assert.equal(read(context, "accesses.at(-1)"), "Symbol(key)");
  assert.equal(read(context, "proxy.name"), "Ada");
  for (const code of ["new Proxy(1, {})", "new Proxy({}, null)"])
    assert.throws(() => read(context, code), { name: "TypeError" });
});

test("Proxy: receiver del getter, ereditarieta e Reflect.get esplicito", () => {
  const { context } = execute("const base =");
  assert.equal(read(context, "base.name"), "base");
  assert.equal(read(context, "Object.hasOwn(child, 'name')"), true);
  assert.equal(
    read(context, "Reflect.get(forwarded, 'label', {name:'custom'})"),
    "custom",
  );
  assert.equal(
    read(context, "new Proxy(base, {get: (target, key) => target[key]}).label"),
    "base",
  );
});

test("Reflect: set falso in non strict, errore in strict, non nasconde le eccezioni", () => {
  const { context } = execute("const locked =");
  assert.doesNotThrow(() => read(context, "passThrough.count = 2"));
  assert.equal(read(context, "passThrough.count"), 1);
  assert.throws(() => read(context, "Reflect.set(null, 'x', 1)"), {
    name: "TypeError",
  });
  assert.equal(
    read(context, "Reflect.defineProperty(locked, 'new', {value: 1})"),
    false,
  );
  assert.throws(
    () => read(context, "Object.defineProperty(locked, 'new', {value: 1})"),
    { name: "TypeError" },
  );
  assert.throws(
    () =>
      read(
        context,
        "Reflect.defineProperty({}, 'x', {value: 1, get() {return 1}})",
      ),
    { name: "TypeError" },
  );
});

test("Proxy: Reflect.set puo chiamare defineProperty senza un secondo set", () => {
  const { context } = execute("const base =");
  const result = read(
    context,
    `
    const calls = [];
    const record = {};
    const wrapped = new Proxy(record, {
      set(target, key, value, receiver) { calls.push('set'); return Reflect.set(target, key, value, receiver); },
      defineProperty(target, key, descriptor) { calls.push('defineProperty'); return Reflect.defineProperty(target, key, descriptor); },
    });
    wrapped.value = 7;
    [calls, record.value];
  `,
  );
  assert.deepEqual(structuredClone(result), [["set", "defineProperty"], 7]);
});

test("Proxy: apply e construct conservano receiver e newTarget", () => {
  const { context } = execute("function addToBase");
  assert.equal(read(context, "Reflect.apply(tracedCall, {base: 20}, [5])"), 25);
  vm.runInContext(snippet(proxyNote, "class Item"), context);
  assert.equal(
    read(context, "Object.getPrototypeOf(item) === SpecialItem.prototype"),
    true,
  );
  assert.equal(read(context, "item instanceof Item"), true);
  assert.throws(
    () =>
      read(context, "new (new Proxy(() => {}, {construct() {return {}}}))()"),
    { name: "TypeError" },
  );
  assert.throws(() => read(context, "new Proxy({}, {apply() {return 1}})()"), {
    name: "TypeError",
  });
  assert.throws(
    () => read(context, "new (new Proxy(Item, {construct() {return 1}}))()"),
    { name: "TypeError" },
  );
});

test("Proxy: invarianti get/set/ownKeys controllate dal motore", () => {
  const { context } = execute("const immutable =");
  for (const code of [
    "Reflect.set(new Proxy(immutable, {set() {return true}}), 'id', 8)",
    "Reflect.ownKeys(new Proxy(immutable, {ownKeys() {return []}}))",
    "Reflect.ownKeys(new Proxy({}, {ownKeys() {return ['x','x']}}))",
    "Reflect.ownKeys(new Proxy({}, {ownKeys() {return [1]}}))",
    "Reflect.ownKeys(new Proxy(Object.preventExtensions({x: 1}), {ownKeys() {return ['x','y']}}))",
    "'id' in new Proxy(immutable, {has() {return false}})",
    "Reflect.deleteProperty(new Proxy(immutable, {deleteProperty() {return true}}), 'id')",
  ])
    assert.throws(() => read(context, code), { name: "TypeError" }, code);
  assert.equal(
    read(
      context,
      "Reflect.set(new Proxy(immutable, {set() {return true}}), 'id', 7)",
    ),
    true,
  );
});

test("Proxy: ownKeys include Symbol/non enumerabili, Object.keys e hasOwn filtrano diversamente", () => {
  const { context } = execute("const base =");
  const result = read(
    context,
    `
    const symbol = Symbol('key');
    const record = {visible: 1, [symbol]: 2};
    Object.defineProperty(record, 'hidden', {value: 3});
    const wrapped = new Proxy(record, { has() {return false}, ownKeys(target) {return Reflect.ownKeys(target)} });
    [Reflect.ownKeys(wrapped).length, Object.keys(wrapped), 'visible' in wrapped, Object.hasOwn(wrapped, 'visible')];
  `,
  );
  assert.deepEqual(structuredClone(result), [3, ["visible"], false, true]);
});

test("Age record: esempio completo dal Markdown", () => {
  const { context, logs } = execute("function createAgeRecord");
  vm.runInContext(snippet(proxyNote, "const user = createAgeRecord"), context);
  assert.deepEqual(logs, [[32], [false], [false], ["RangeError"], [32]]);
});

test("Age record: default, zero e interi sicuri validi", () => {
  const { context } = execute("function createAgeRecord");
  assert.equal(context.createAgeRecord().age, 0);
  for (const value of [0, 1, 30, Number.MAX_SAFE_INTEGER]) {
    const user = context.createAgeRecord(value);
    assert.equal(user.age, value);
    assert.equal(Reflect.set(user, "age", 0), true);
    assert.equal(Reflect.defineProperty(user, "age", { value }), true);
    assert.equal(user.age, value);
  }
});

for (const value of [
  -1,
  0.5,
  NaN,
  Infinity,
  "30",
  null,
  1n,
  Number.MAX_SAFE_INTEGER + 1,
]) {
  test(`Age record: valore invalido ${String(value)} nei tre ingressi`, () => {
    const { context } = execute("function createAgeRecord");
    assert.throws(() => context.createAgeRecord(value), { name: "RangeError" });
    const user = context.createAgeRecord(5);
    assert.throws(() => Reflect.set(user, "age", value), {
      name: "RangeError",
    });
    assert.throws(() => Reflect.defineProperty(user, "age", { value }), {
      name: "RangeError",
    });
    assert.equal(user.age, 5);
  });
}

test("Age record: schema, descrittori, accessor, prototipo e freeze", () => {
  const user = execute("function createAgeRecord").context.createAgeRecord(10);
  assert.equal(Object.getPrototypeOf(user), null);
  assert.equal(Object.isExtensible(user), false);
  assert.deepEqual(Reflect.ownKeys(user), ["age"]);
  assert.equal(Reflect.set(user, Symbol("extra"), 1), false);
  assert.equal(Reflect.defineProperty(user, "name", { value: "Ada" }), false);
  assert.equal(
    Reflect.defineProperty(user, "age", {
      get() {
        return -1;
      },
    }),
    false,
  );
  assert.equal(
    Reflect.defineProperty(user, "age", { configurable: true }),
    false,
  );
  assert.equal(Reflect.deleteProperty(user, "age"), false);
  assert.equal(Reflect.setPrototypeOf(user, {}), false);
  Object.freeze(user);
  assert.equal(Reflect.set(user, "age", 11), false);
  assert.equal(user.age, 10);
});

test("Proxy: revoca non revoca i riferimenti ottenuti prima", () => {
  const { context } = execute("proxy: temporary");
  assert.equal(read(context, "savedProfile.name"), "Luca");
  assert.equal(read(context, "typeof temporary"), "object");
  for (const code of [
    "temporary.profile",
    "Reflect.ownKeys(temporary)",
    "Reflect.set(temporary, 'profile', {})",
  ])
    assert.throws(() => read(context, code), { name: "TypeError" });
});

async function fixture(t, files) {
  const root = await realpath(tmpdir());
  const directory = await mkdtemp(join(root, "appunti-proxy-cycles-"));
  t.after(async () => {
    const target = await realpath(directory);
    assert.equal(dirname(target), root);
    assert.ok(basename(target).startsWith("appunti-proxy-cycles-"));
    await rm(target, { recursive: true, force: true });
  });
  for (const [name, source] of Object.entries(files)) {
    const target = resolve(directory, name);
    assert.ok(target.startsWith(directory + sep));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, source, "utf8");
  }
  function run(args, status = 0) {
    const result = spawnSync(process.execPath, args, {
      cwd: directory,
      encoding: "utf8",
      timeout: 10_000,
      windowsHide: true,
    });
    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.signal, null);
    assert.equal(result.status, status, result.stderr);
    return result;
  }
  return {
    run: (name, status) => run([join(directory, name)], status),
    check: (source) =>
      run([
        "--input-type=module",
        "-e",
        `import assert from 'node:assert/strict';\n${source}`,
      ]),
    url: (name) => JSON.stringify(pathToFileURL(join(directory, name)).href),
  };
}

for (const entry of ["a.mjs", "b.mjs"]) {
  test(`Cicli ESM: TDZ da entry ${entry}`, async (t) => {
    const f = await fixture(t, cycleFiles("tdz"));
    assert.match(f.run(entry, 1).stderr, /ReferenceError/);
  });
}

test("Cicli ESM: var al posto di const nasconde la TDZ ma produce NaN", async (t) => {
  const files = Object.fromEntries(
    Object.entries(cycleFiles("tdz")).map(([name, code]) => [
      name,
      code.replace("export const", "export var"),
    ]),
  );
  const f = await fixture(t, files);
  f.check(
    `const a = await import(${f.url("a.mjs")}); const b = await import(${f.url("b.mjs")}); assert.equal(Number.isNaN(a.a), true); assert.equal(Number.isNaN(b.b), true);`,
  );
});

test("Cicli ESM: letture dopo setup e binding aggiornati", async (t) => {
  const f = await fixture(t, cycleFiles("late"));
  assert.equal(f.run("main.mjs").stdout.trim(), "B usa A\nB usa A2");
});

test("Cicli ESM: avvio da b, funzione viva e import non riassegnabile", async (t) => {
  const files = {
    ...cycleFiles("late"),
    "readonly.mjs": 'import {labelA} from "./a.mjs"; labelA = "wrong";',
  };
  const f = await fixture(t, files);
  f.check(
    `const b = await import(${f.url("b.mjs")}); const a = await import(${f.url("a.mjs")}); assert.equal(b.getB(), "B usa A"); a.renameA("later"); assert.equal(b.getB(), "B usa later");`,
  );
  assert.match(f.run("readonly.mjs", 1).stderr, /TypeError/);
});

test("Cicli ESM: funzione hoisted non rende pronta una variabile letta dal corpo", async (t) => {
  const files = cycleFiles("late");
  files["b.mjs"] += "\nexport const tooEarly = getA();\n";
  const f = await fixture(t, files);
  assert.match(f.run("main.mjs", 1).stderr, /ReferenceError/);
});

test("Cicli classi: User come entry fallisce prima di inizializzare la base", async (t) => {
  const f = await fixture(t, cycleFiles("classes"));
  assert.match(f.run("user.mjs", 1).stderr, /ReferenceError/);
});

test("Cicli classi: Admin come entry termina e factory funziona dopo setup", async (t) => {
  const f = await fixture(t, cycleFiles("classes"));
  f.run("admin.mjs");
  f.check(
    `const {Admin} = await import(${f.url("admin.mjs")}); const instance = new Admin(); assert.equal(instance.createAdmin() instanceof Admin, true);`,
  );
});

test("Composizione: entry completo con repository e ruolo condiviso", async (t) => {
  const f = await fixture(t, cycleFiles("composed"));
  assert.equal(f.run("main.mjs").stdout.trim(), "true\nfalse");
});

test("Composizione: injection sincrona/async, assenza utente e propagazione errori", async (t) => {
  const f = await fixture(t, cycleFiles("composed"));
  f.check(`
    const {createPermissionService: create} = await import(${f.url("permissions.mjs")});
    assert.throws(() => create(null), TypeError);
    assert.equal(await create(() => ({role:"admin"})).canEdit("x"), true);
    assert.equal(await create(async () => ({role:"reader"})).canEdit("x"), false);
    assert.equal(await create(async () => null).canEdit("x"), false);
    const error = new Error("repository failure");
    await assert.rejects(create(() => {throw error}).canEdit("x"), e => e === error);
    await assert.rejects(create(async () => {throw error}).canEdit("x"), e => e === error);
  `);
});

for (const [name, expected] of [
  ["cjs", "ready starting ready"],
  ["replacement", "ready starting starting"],
]) {
  test(`Cicli CommonJS: ${name} in processo pulito`, async (t) => {
    const f = await fixture(t, cycleFiles(name));
    assert.equal(f.run("main.cjs").stdout.trim(), expected);
  });
}

test("Lazy: chiamata dopo core inizializzato, main con gestione del rifiuto", async (t) => {
  const f = await fixture(t, cycleFiles("lazy"));
  assert.equal(f.run("main.mjs").stdout.trim(), "CORE");
});

test("Lazy: import di core non carica subito feature, errore quando la si richiede", async (t) => {
  const files = cycleFiles("lazy");
  delete files["feature.mjs"];
  const f = await fixture(t, files);
  f.check(
    `const {runFeature} = await import(${f.url("core.mjs")}); await assert.rejects(runFeature(), {code:"ERR_MODULE_NOT_FOUND"});`,
  );
});

test("Top-level await: ciclo di attesa termina con codice 13 in Node senza altre risorse", async (t) => {
  const f = await fixture(t, cycleFiles("waiting"));
  assert.equal(f.run("a.mjs", 13).stdout, "");
});
