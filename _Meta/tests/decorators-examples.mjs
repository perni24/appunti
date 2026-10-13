import { createRequire } from "node:module";
import { snippet } from "./note-examples.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
export const esbuild = require("esbuild");
export const config = JSON.parse(
  snippet("Decorators", '"compilerOptions"', "json"),
);
export const markers = [
  "function logged",
  "const trace",
  "function recordDuration",
  "function nonNegativeField",
  "function nonNegativeAccessor",
  "function bound",
  "Symbol.metadata ??=",
];

export async function compileExample(marker, tail = "return logs;") {
  const source = `(async () => {
    const logs = [];
    const console = { log: (...args) => logs.push(args) };
    let clock = 0;
    const performance = { now: () => clock };
    ${snippet("Decorators", marker)}
    ${tail}
  })()`;
  const result = await esbuild.transform(source, {
    loader: "js",
    target: "es2022",
    format: "esm",
    tsconfigRaw: config,
  });
  if (result.warnings.length) throw new Error(JSON.stringify(result.warnings));
  return result.code;
}

// Shared assertions exercise the same transformed note in isolated Node and browser realms.
export const cases = [
  {
    name: "metodo: output e receiver",
    marker: markers[0],
    expected: [["Calling run"], ["report:7"]],
  },
  {
    name: "metodo: argomenti, ritorno, eccezione e identita Promise",
    marker: markers[0],
    tail: `const failure = new Error('failure'); const token = {};
      const promise = Promise.resolve(token);
      class Sample {
        @logged run(...args) { return [this, args]; }
        @logged fail() { throw failure; }
        @logged asyncValue() { return promise; }
      }
      const sample = new Sample(); const [receiver, args] = sample.run(1, token);
      let error; try { sample.fail(); } catch (caught) { error = caught; }
      return [receiver === sample, args[0], args[1] === token,
        error === failure, sample.asyncValue() === promise];`,
    expected: [true, 1, true, true, true],
  },
  {
    name: "metodo: Symbol, static e private",
    marker: markers[0],
    tail: `const key = Symbol('run');
      class Names {
        @logged [key]() { return 1; }
        @logged static run() { return this; }
        @logged #secret() { return 2; }
        read() { return this.#secret(); }
      }
      logs.length = 0;
      const names = new Names();
      const values = [names[key](), Names.run() === Names, names.read()];
      return [values, logs];`,
    expected: [
      [1, true, 2],
      [["Calling Symbol(run)"], ["Calling run"], ["Calling #secret"]],
    ],
  },
  {
    name: "metodo: logger fallito impedisce la chiamata",
    marker: markers[0],
    tail: `let called = false; const failure = new Error('log');
      class Sample { @logged run() { called = true; } }
      console.log = () => { throw failure; };
      let error; try { new Sample().run(); } catch (caught) { error = caught; }
      return [called, error === failure];`,
    expected: [false, true],
  },
  {
    name: "metodo: campo rifiutato durante la definizione",
    marker: markers[0],
    tail: `let error; try { class Invalid { @logged field = 0; } }
      catch (caught) { error = caught; } return error.name;`,
    expected: "TypeError",
  },
  {
    name: "ordine: factory, applicazione e wrapper",
    marker: markers[1],
    tail: "return trace;",
    expected: [
      "evaluate:outer",
      "evaluate:inner",
      "apply:inner",
      "apply:outer",
      "enter:outer",
      "enter:inner",
      "body",
      "exit:inner",
      "exit:outer",
    ],
  },
  {
    name: "timing: esempi sincrono e asincrono",
    marker: markers[2],
    tail: "await loaded; return logs;",
    expected: [["generate: 0 ms"], ["report"], ["load: 0 ms"], ["loaded"]],
  },
  {
    name: "timing: esito sincrono e throw originale",
    marker: markers[2],
    tail: `await loaded; logs.length = 0; const failure = new Error('method');
      class Sample {
        @timedSync run(value) { clock += 3; return [this, value]; }
        @timedSync fail() { clock += 5; throw failure; }
      }
      const sample = new Sample(); const result = sample.run(9);
      let error; try { sample.fail(); } catch (caught) { error = caught; }
      return [result[0] === sample, result[1], error === failure, logs];`,
    expected: [true, 9, true, [["run: 3 ms"], ["fail: 5 ms"]]],
  },
  {
    name: "timing: Promise pendente, attesa ed identita cambiata",
    marker: markers[2],
    tail: `await loaded; logs.length = 0;
      let resolve; const pending = new Promise(done => { resolve = done; });
      class Sample { @timedAsync run() { return pending; } }
      clock = 10; const result = new Sample().run(); const before = logs.length;
      clock = 60; resolve('ok');
      return [before, result !== pending, await result, logs];`,
    expected: [0, true, "ok", [["run: 50 ms"]]],
  },
  {
    name: "timing: rifiuto asincrono e throw convertito in rifiuto",
    marker: markers[2],
    tail: `await loaded; logs.length = 0; const failure = new Error('method');
      class Sample {
        @timedAsync reject() { clock += 4; return Promise.reject(failure); }
        @timedAsync fail() { clock += 2; throw failure; }
      }
      const sample = new Sample(); const result = [];
      for (const name of ['reject', 'fail']) {
        const promise = sample[name]();
        result.push(promise instanceof Promise);
        try { await promise; } catch (error) { result.push(error === failure); }
      }
      return [result, logs];`,
    expected: [
      [true, true, true, true],
      [["reject: 4 ms"], ["fail: 2 ms"]],
    ],
  },
  {
    name: "timing: diagnosi fallita non sostituisce risultato o errore",
    marker: markers[2],
    tail: `await loaded; const failure = new Error('method');
      class Sample {
        @timedSync run() { return 7; }
        @timedSync fail() { throw failure; }
        @timedAsync load() { return 8; }
      }
      console.log = () => { throw new Error('logger'); };
      const sample = new Sample(); let error;
      try { sample.fail(); } catch (caught) { error = caught; }
      return [sample.run(), error === failure, await sample.load()];`,
    expected: [7, true, 8],
  },
  {
    name: "campo: inizializzazione non controlla scritture successive",
    marker: markers[3],
    tail: "return [logs, Object.keys(fieldCounter)];",
    expected: [[[-1]], ["count"]],
  },
  {
    name: "campo: valori invalidi rifiutati alla costruzione",
    marker: markers[3],
    tail: `let initial; let definitions = 0;
      class Sample { @nonNegativeField count = initial; }
      definitions++;
      const failures = [];
      for (initial of [-1, 0.5, NaN, Infinity, '2', undefined, Number.MAX_SAFE_INTEGER + 1]) {
        try { new Sample(); failures.push(false); }
        catch (error) { failures.push(error instanceof RangeError); }
      }
      initial = Number.MAX_SAFE_INTEGER;
      return [definitions, failures, new Sample().count];`,
    expected: [
      1,
      [true, true, true, true, true, true, true],
      Number.MAX_SAFE_INTEGER,
    ],
  },
  {
    name: "accessor: errore, stato precedente ed enumerabilita",
    marker: markers[4],
    tail: "return [logs, JSON.stringify(accessorCounter), {...accessorCounter}];",
    expected: [[["RangeError"], [2], [[]]], "{}", {}],
  },
  {
    name: "accessor: input, indipendenza istanze e receiver incompatibile",
    marker: markers[4],
    tail: `const a = new CounterAccessor(); const b = new CounterAccessor(); a.count = 3;
      const failures = [];
      for (const value of [-1, 1.5, NaN, Infinity, '3', undefined]) {
        try { a.count = value; failures.push(false); }
        catch (error) { failures.push(error instanceof RangeError && a.count === 3); }
      }
      let invalidReceiver;
      try { new Proxy(a, {}).count; } catch (error) { invalidReceiver = error instanceof TypeError; }
      return [a.count, b.count, failures, invalidReceiver];`,
    expected: [3, 0, [true, true, true, true, true, true], true],
  },
  {
    name: "accessor: valore iniziale validato e tipo di elemento controllato",
    marker: markers[4],
    tail: `class Invalid { @nonNegativeAccessor accessor count = -1; }
      let initialError; try { new Invalid(); } catch (error) { initialError = error.name; }
      let kindError; try { class Bad { @nonNegativeAccessor count = 0; } }
      catch (error) { kindError = error.name; }
      return [initialError, kindError];`,
    expected: ["RangeError", "TypeError"],
  },
  {
    name: "bound: callback stabile per istanza e non enumerabile",
    marker: markers[5],
    tail: `const other = new ButtonModel(); other.label = 'Other';
      return [logs, button.click !== other.click, other.click.call(button),
        Object.getOwnPropertyDescriptor(button, 'click').enumerable, Object.keys(button)];`,
    expected: [[["Save"], [true]], true, "Other", false, ["label"]],
  },
  {
    name: "bound: composizione usa il metodo finale",
    marker: markers[5],
    tail: `function wrapper(value) { return function (...args) { return 'wrapped:' + value.apply(this, args); }; }
      class Sample { label = 'ok'; @wrapper @bound read() { return this.label; } }
      const read = new Sample().read; return read();`,
    expected: "wrapped:ok",
  },
  {
    name: "bound: static, private e campo rifiutati",
    marker: markers[5],
    tail: `const errors = [];
      try { class Bad { @bound static run() {} } } catch (error) { errors.push(error.name); }
      try { class Bad { @bound #run() {} } } catch (error) { errors.push(error.name); }
      try { class Bad { @bound run = () => {}; } } catch (error) { errors.push(error.name); }
      return errors;`,
    expected: ["TypeError", "TypeError", "TypeError"],
  },
  {
    name: "inizializzatori: fase metodo, campo, classe e registrazione tardiva",
    marker: markers[5],
    tail: `const events = []; let register;
      function observe(value, context) {
        register = context.addInitializer;
        context.addInitializer(function () { events.push(['method', Object.hasOwn(this, 'x')]); });
      }
      function observeField(value, context) {
        context.addInitializer(function () { events.push(['field', this.x]); });
        return initial => initial + 1;
      }
      function observeClass(value, context) {
        context.addInitializer(function () { events.push(['class', this.ready]); });
      }
      @observeClass class Sample {
        static ready = true;
        @observeField x = 1;
        @observe run() {}
      }
      new Sample(); let lateError;
      try { register(() => {}); } catch (error) { lateError = error.name; }
      return [events, lateError];`,
    expected: [
      [
        ["class", true],
        ["method", false],
        ["field", 2],
      ],
      "TypeError",
    ],
  },
  {
    name: "metadata: classe invariata e categoria accessibile",
    marker: markers[6],
    tail: "return [logs, new Catalog() instanceof Catalog, Catalog[Symbol.metadata].category];",
    expected: [[["service"]], true, "service"],
  },
  {
    name: "metadata: ereditarieta e assegnazione propria",
    marker: markers[6],
    tail: `@category('child') class Child extends Catalog {}
      return [Catalog[Symbol.metadata].category, Child[Symbol.metadata].category,
        Object.getPrototypeOf(Child[Symbol.metadata]) === Catalog[Symbol.metadata]];`,
    expected: ["service", "child", true],
  },
  {
    name: "metadata: categoria invalida e metodo rifiutato",
    marker: markers[6],
    tail: `const errors = [];
      for (const input of ['', 1, null]) {
        try { category(input); } catch (error) { errors.push(error.name); }
      }
      try { class Bad { @category('test') run() {} } } catch (error) { errors.push(error.name); }
      return errors;`,
    expected: ["TypeError", "TypeError", "TypeError", "TypeError"],
  },
  {
    name: "decorator: sostituzione di tipo invalido interrompe definizione",
    marker: markers[0],
    tail: `function invalid() { return 42; }
      let error; try { class Bad { @invalid run() {} } } catch (caught) { error = caught; }
      return error.name;`,
    expected: "TypeError",
  },
];
