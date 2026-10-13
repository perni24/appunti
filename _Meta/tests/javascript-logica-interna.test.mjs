import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { snippet } from "./note-examples.mjs";

function run(source, expression = "undefined", globals = {}) {
  const output = [];
  const context = vm.createContext({
    console: { log: (...args) => output.push(args) },
    ...globals,
  });
  const value = vm.runInContext(`${source}\n;(${expression})`, context, {
    timeout: 1000,
  });
  return { value, output };
}
const plain = (value) => structuredClone(value);
const namedError = (name) => (error) => error.name === name;

// Native files preserve ESM/CommonJS top-level semantics, unlike a VM script.
async function executeFiles(t, files, entry) {
  const root = await realpath(tmpdir());
  const directory = await mkdtemp(join(root, "appunti-js-logica-"));
  t.after(async () => {
    const target = await realpath(directory);
    assert.equal(dirname(target), root);
    assert.ok(basename(target).startsWith("appunti-js-logica-"));
    await rm(target, { recursive: true, force: true });
  });
  for (const [name, source] of Object.entries({
    "package.json": JSON.stringify({ type: "module" }),
    ...files,
  })) {
    const path = resolve(directory, name);
    assert.ok(path.startsWith(directory + sep));
    await writeFile(path, source, "utf8");
  }
  const entryPath = resolve(directory, entry);
  assert.ok(entryPath.startsWith(directory + sep));
  const result = spawnSync(process.execPath, [entryPath], {
    encoding: "utf8",
    timeout: 10000,
  });
  assert.ifError(result.error);
  return result;
}

test("Scope: il nome locale non esce dalla funzione", () => {
  const source = snippet("Scope", "const createdUserName");
  assert.deepEqual(plain(run(source).output), [["Luca"]]);
  assert.throws(
    () => run(source, "createdUserName"),
    namedError("ReferenceError"),
  );
});

test("Scope: var attraversa il blocco, let e const no", () => {
  assert.deepEqual(
    plain(run(snippet("Scope", "function example"), "example()").output),
    [[10]],
  );
  assert.throws(
    () => run(snippet("Scope", 'const role = "admin"')),
    namedError("ReferenceError"),
  );
});

test("Scope: conta il sito di definizione, non il chiamante", () => {
  assert.deepEqual(plain(run(snippet("Scope", "function callReader")).output), [
    ["definizione"],
  ]);
  assert.deepEqual(plain(run(snippet("Scope", "function outer")).output), [
    ["outer"],
  ]);
});

test("Scope: lo shadowing non cambia il binding esterno", () => {
  assert.deepEqual(plain(run(snippet("Scope", "function update")).output), [
    ["local"],
    ["global"],
  ]);
  assert.throws(
    () => run(snippet("Scope", "const quantity")),
    namedError("ReferenceError"),
  );
});

test("Scope: ogni factory ha un contatore distinto", () => {
  const { value, output } = run(
    snippet("Scope", "function createCounter"),
    'Object.hasOwn(counter, "count")',
  );
  assert.deepEqual(plain(output), [[1], [2], [1]]);
  assert.equal(value, false);
});

test("Hoisting: var inizialmente undefined, poi assegnato", () => {
  assert.deepEqual(plain(run(snippet("Hoisting", "var count = 3")).output), [
    [undefined],
    [3],
  ]);
});

test("Hoisting: const e class sono in TDZ", () => {
  assert.throws(
    () => run(snippet("Hoisting", 'const name = "Luca"')),
    namedError("ReferenceError"),
  );
  assert.throws(
    () => run(snippet("Hoisting", "const user = new User")),
    namedError("ReferenceError"),
  );
});

test("Hoisting: function declaration disponibile prima della riga", () => {
  assert.deepEqual(
    plain(run(snippet("Hoisting", "function sayHello()")).output),
    [["Ciao"]],
  );
});

test("Hoisting: function expression const e var falliscono diversamente", () => {
  assert.throws(
    () => run(snippet("Hoisting", "const sayHello =")),
    namedError("ReferenceError"),
  );
  assert.throws(
    () => run(snippet("Hoisting", "var sayHello =")),
    namedError("TypeError"),
  );
});

test("Hoisting: closure invocata dopo inizializzazione, typeof in TDZ", () => {
  assert.deepEqual(plain(run(snippet("Hoisting", "const readLimit")).output), [
    [10],
  ]);
  assert.throws(
    () => run(snippet("Hoisting", "typeof neverDeclaredHere")),
    namedError("ReferenceError"),
  );
});

test("Hoisting: function nel blocco strict non esce dal blocco", () => {
  assert.deepEqual(
    plain(run(snippet("Hoisting", "function announce")).output),
    [["pronto"], ["undefined"]],
  );
});

test("Hoisting: import nativo disponibile prima della sua posizione testuale", async (t) => {
  const result = await executeFiles(
    t,
    {
      "users.js": snippet("Hoisting", "// users.js"),
      "main.js": snippet("Hoisting", "// main.js"),
    },
    "main.js",
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "Ada");
});

test("Closures: binding corrente diverso dalla stringa derivata iniziale", () => {
  const { value, output } = run(
    snippet("Closures", "function createSelection"),
    "createSelection(9).read()",
  );
  assert.deepEqual(plain(output), [[2], ["Iniziale: 1"]]);
  assert.equal(value, 9);
});

test("Closures: contatore privato persiste e ogni chiamata crea stato indipendente", () => {
  const { value, output } = run(
    snippet("Closures", "function createCounter"),
    "createCounter()()",
  );
  assert.deepEqual(plain(output), [[1], [2], [3]]);
  assert.equal(value, 1);
});

test("Closures: sessione assente, token, logout e isolamento", () => {
  const { value: create } = run(
    snippet("Closures", "function createUserSession"),
    "createUserSession",
  );
  const first = create(1);
  const second = create(2);
  assert.equal(first.getAuthHeader(), null);
  first.login("AZaz09-._~+/==");
  assert.equal(first.getAuthHeader(), "Bearer AZaz09-._~+/==");
  assert.equal(first.getUserId(), 1);
  assert.equal(second.getAuthHeader(), null);
  first.logout();
  first.logout();
  assert.equal(first.getAuthHeader(), null);
});

test("Closures: token malformati non sostituiscono lo stato valido", () => {
  const { value: session } = run(
    snippet("Closures", "function createUserSession"),
    "session",
  );
  session.login("valid-example");
  for (const token of [
    null,
    undefined,
    42,
    "",
    "=",
    "a=b",
    "a b",
    "abc\n",
    "abc\r\n",
    "abc\u2028",
    "abc\t",
    "abc:",
    "\u00e8",
  ]) {
    assert.throws(() => session.login(token), namedError("TypeError"));
    assert.equal(session.getAuthHeader(), "Bearer valid-example");
  }
});

test("Closures: formatter riusabile, simbolo locale e input numerico", () => {
  const { value: format } = run(
    snippet("Closures", "function createFormatter"),
    "formatEuro",
  );
  const expected = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  });
  assert.equal(format(19.99), expected.format(19.99));
  assert.equal(format(0), expected.format(0));
  for (const input of ["19.99", NaN, Infinity, null]) {
    assert.throws(() => format(input), namedError("TypeError"));
  }
});

test("Closures: callback ritardato conserva messaggio e restituisce handle", () => {
  let callback;
  const { value, output } = run(
    snippet("Closures", "function delayLog"),
    "timeoutId",
    {
      setTimeout(fn, delay) {
        assert.equal(delay, 1000);
        callback = fn;
        return 17;
      },
    },
  );
  assert.equal(value, 17);
  assert.equal(output.length, 0);
  callback();
  assert.deepEqual(plain(output), [["Operazione completata"]]);
});

test("Closures: callback dei loop distinguono var da let", () => {
  for (const [keyword, expected] of [
    ["var", [3, 3, 3]],
    ["let", [0, 1, 2]],
  ]) {
    const pending = [];
    const { output } = run(
      snippet("Closures", `for (${keyword} i`),
      "undefined",
      {
        setTimeout(fn, delay) {
          assert.equal(delay, 0);
          pending.push(fn);
        },
      },
    );
    assert.equal(output.length, 0);
    pending.forEach((fn) => fn());
    assert.deepEqual(plain(output).flat(), expected);
  }
});

test("Context: strict this conserva undefined, null e primitivo", () => {
  assert.deepEqual(plain(run(snippet("Context", "function showThis")).output), [
    [undefined],
    [null],
    [7],
  ]);
});

test("Context: un metodo puo avere un receiver diverso", () => {
  const source =
    snippet("Context", "const cart =") +
    "\n" +
    snippet("Context", "const otherCart");
  assert.deepEqual(plain(run(source).output), [[100], [25]]);
});

test("Context: metodo estratto fallisce, bind ripristina il receiver", () => {
  assert.throws(
    () => run(snippet("Context", "const print = user.printName")),
    namedError("TypeError"),
  );
  const source = snippet("Context", "const increment = counter.increment;");
  assert.throws(() => run(source, "increment()"), namedError("TypeError"));
  assert.deepEqual(
    plain(
      run(source + "\n" + snippet("Context", "const boundIncrement")).output,
    ),
    [[1]],
  );
});

test("Context: call e apply invocano, bind conserva il primo receiver", () => {
  const source =
    snippet("Context", "function printRole") +
    "\n" +
    snippet("Context", "const boundPrintRole");
  const { output } = run(
    source,
    'boundPrintRole.bind({role: "guest"})("Ruolo")',
  );
  assert.deepEqual(
    plain(output),
    Array.from({ length: 5 }, () => ["Ruolo: admin"]),
  );
});

test("Context: new ignora il receiver bound ma mantiene gli argomenti", () => {
  const { value } = run(
    snippet("Context", "function User(name)"),
    `(() => {
    const receiver = { name: "originale" };
    const BoundUser = User.bind(receiver, "nuovo");
    const instance = new BoundUser();
    return [receiver.name, instance.name, instance instanceof User, Object.hasOwn(BoundUser, "prototype")];
  })()`,
  );
  assert.deepEqual(plain(value), ["originale", "nuovo", true, false]);
});

test("Context: la arrow del timer conserva this del metodo", () => {
  let callback;
  const { value, output } = run(
    snippet("Context", "delayedPrint()"),
    "timeoutId",
    {
      setTimeout(fn) {
        callback = fn;
        return 23;
      },
    },
  );
  assert.equal(value, 23);
  callback.call({ name: "altro" });
  assert.deepEqual(plain(output), [["Luca"]]);
});

test("Context: top-level this distinto nei file ESM e CommonJS", async (t) => {
  const esm = await executeFiles(
    t,
    { "main.mjs": snippet("Context", "// dentro un modulo ES") },
    "main.mjs",
  );
  assert.equal(esm.status, 0, esm.stderr);
  assert.equal(esm.stdout.trim(), "undefined");
  const cjs = await executeFiles(
    t,
    { "context.cjs": snippet("Context", "// context.cjs") },
    "context.cjs",
  );
  assert.equal(cjs.status, 0, cjs.stderr);
  assert.deepEqual(cjs.stdout.trim().split(/\r?\n/), ["true", "false"]);
});

test("Context: arrow come metodo di oggetto in ESM genera TypeError", async (t) => {
  const result = await executeFiles(
    t,
    { "wrong-arrow.mjs": snippet("Context", "// wrong-arrow.mjs") },
    "wrong-arrow.mjs",
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /TypeError/);
});

test("Prototypes: dizionario null non eredita toString", () => {
  assert.deepEqual(
    plain(run(snippet("Prototypes", "const dictionary")).output),
    [[null], [undefined], [true]],
  );
});

test("Prototypes: prototipo della funzione distinto da quello delle istanze", () => {
  assert.deepEqual(
    plain(run(snippet("Prototypes", "console.log(User.prototype ===")).output),
    [[true], [true]],
  );
});

test("Prototypes: metodi pubblici condivisi, campi arrow per istanza", () => {
  const { output, value } = run(
    snippet("Prototypes", "class Task"),
    'Object.getOwnPropertyDescriptor(Task.prototype, "complete").enumerable',
  );
  assert.deepEqual(plain(output), [[true], [false], [true], ["task"]]);
  assert.equal(value, false);
});

test("Prototypes: una proprieta propria nasconde quella ereditata, delete la rivela", () => {
  assert.deepEqual(plain(run(snippet("Prototypes", "const defaults")).output), [
    ["reader"],
    ["admin"],
    ["reader"],
    [true],
    ["reader"],
  ]);
});

test("Prototypes: mutazione di array ereditato distinta da nuova assegnazione", () => {
  const { value } = run(
    snippet("Prototypes", "const sharedDefaults"),
    "[firstItem.tags, secondItem.tags, Object.hasOwn(firstItem, 'tags'), Object.hasOwn(secondItem, 'tags')]",
  );
  assert.deepEqual(plain(value), [["personal"], ["urgent"], true, false]);
});

test("Prototypes: Object.create non esegue il costruttore, instanceof non valida campi", () => {
  assert.deepEqual(plain(run(snippet("Prototypes", "class Account")).output), [
    [true],
    [undefined],
  ]);
});

test("Prototypes: sostituire prototype non modifica istanze precedenti", () => {
  assert.deepEqual(plain(run(snippet("Prototypes", "function Item")).output), [
    [true],
    ["new"],
    [false],
  ]);
});

test("Prototypes: contatori condividono il metodo ma non il valore", () => {
  const { output, value } = run(
    snippet("Prototypes", "function Counter"),
    "[first.value, second.value]",
  );
  assert.deepEqual(plain(output), [[1], [11], [true]]);
  assert.deepEqual(plain(value), [1, 11]);
});

test("Prototypes: costruttore richiede new e valori incrementabili esattamente", () => {
  const { value: Counter } = run(
    snippet("Prototypes", "function Counter"),
    "Counter",
  );
  assert.throws(() => Counter(), namedError("TypeError"));
  for (const value of [
    -1,
    0.5,
    "10",
    null,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    assert.throws(() => new Counter(value), namedError("RangeError"));
  }
  const counter = new Counter(Number.MAX_SAFE_INTEGER - 1);
  assert.equal(counter.increment(), Number.MAX_SAFE_INTEGER);
  assert.throws(() => counter.increment(), namedError("RangeError"));
  counter.value = "1";
  assert.throws(() => counter.increment(), namedError("RangeError"));
});
