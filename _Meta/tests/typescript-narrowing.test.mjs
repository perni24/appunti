import assert from "node:assert/strict";
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

const notes = [
  "Type Narrowing",
  "Type Guards",
  "Discriminated Unions",
  "Exhaustiveness Checking",
  "Type predicates",
  "Assertion functions",
];
const blocks = new Map(
  notes.map((name) => [
    name,
    parseNote(`Programmazione/TypeScript/Pagine/${name}.md`)
      .tree.children.filter(
        (node) => node.type === "code" && node.lang === "ts",
      )
      .map((node) => node.value),
  ]),
);

function snippet(index, marker) {
  const found = blocks
    .get(notes[index])
    .filter((source) => source.includes(marker));
  assert.equal(found.length, 1, `${notes[index]}: unique marker ${marker}`);
  return found[0];
}

test("Toolchain: TypeScript 5.9.3", () => assert.equal(ts.version, "5.9.3"));

for (const [name, snippets] of blocks) {
  snippets.forEach((source, index) => {
    test(`${name}: blocco ${index + 1} compila in strict`, () => valid(source));
  });
}

test("Narrowing: ramo con return, primitive e number non finiti", () => {
  const source = snippet(0, "function format(");
  const { value: format, output } = run(source, "format");
  assert.deepEqual(output, [["12.00", "CIAO"]]);
  assert.equal(format(0), "0.00");
  assert.equal(format(NaN), "NaN");
  assert.equal(format(Infinity), "Infinity");
  invalid(source + "\nformat(false);", 2345);
  invalid(
    source.replace("return value.toFixed(2);", "value.toFixed(2);"),
    2339,
  );
});

test("Narrowing: discriminante richiede un payload gia valido", () => {
  const source = snippet(0, "type ApiResponse");
  const { value: render, output } = run(source, "render");
  assert.deepEqual(output, [["A, B"], ["Errore: Timeout"]]);
  assert.equal(render({ status: "success", data: [] }), "");
  invalid(source + '\nrender({ status: "success" });', 2345);
  assert.throws(() => render({ status: "success" }), hasName("TypeError"));
});

test("Narrowing: nullish distinto da stringa vuota e truthiness", () => {
  const source = snippet(0, "function normalizeLabel");
  const { value: normalizeLabel } = run(source, "normalizeLabel");
  for (const value of [null, undefined])
    assert.equal(normalizeLabel(value), "(assente)");
  for (const value of ["", " ", "  \n "])
    assert.equal(normalizeLabel(value), "");
  assert.equal(normalizeLabel(" Luca "), "Luca");
  const wrong = source.replace(
    "value === null || value === undefined",
    "!value",
  );
  assert.equal(run(wrong, 'normalizeLabel("")').value, "(assente)");
  invalid(
    source.replace(
      "value === null || value === undefined",
      "value != null ? false : true",
    ),
    18049,
  );
  valid(
    source.replace("value === null || value === undefined", "value == null"),
  );
  valid(
    source.replace("value === null || value === undefined", "!(value != null)"),
  );
});

test("Narrowing: snapshot della stringa resiste alla mutazione dell'alias", () => {
  const source = snippet(0, "function normalizedName");
  const { value: normalizedName, output } = run(source, "normalizedName");
  assert.deepEqual(output, [["LUCA"]]);
  let called = false;
  assert.equal(
    normalizedName({}, () => {
      called = true;
    }),
    "(assente)",
  );
  assert.equal(called, false);
  const profile = { name: "Marta" };
  assert.equal(
    normalizedName(profile, (value) => {
      delete value.name;
    }),
    "MARTA",
  );
  assert.equal(profile.name, undefined);
  const unsafe = source
    .replace("if (name === undefined)", "if (profile.name === undefined)")
    .replace(
      "return name.toUpperCase();",
      "return profile.name.toUpperCase();",
    );
  assert.throws(() => run(unsafe), hasName("TypeError"));
});

test("Narrowing: closure costante e variabile mutata in altra closure", () => {
  const source = snippet(0, "function makeLabelReader");
  const { value: makeLabelReader } = run(source, "makeLabelReader");
  assert.equal(makeLabelReader(undefined)(), "(assente)");
  assert.equal(makeLabelReader("")(), "");
  assert.equal(makeLabelReader("Luca")(), "LUCA");
  const captured = source
    .replace("  const label = value;\n", "")
    .replace(
      "return () => label.toUpperCase();",
      "return () => value.toUpperCase();",
    );
  valid(captured);
  invalid(
    captured.replace(
      "  if (value === undefined) {",
      "  const reset = () => { value = undefined; };\n  if (value === undefined) {",
    ),
    18048,
  );
});

test("Narrowing: riassegnazione rispetta il tipo dichiarato", () => {
  valid(
    'let value: string | number = "text"; value = 42; value.toFixed(); value = "new";',
  );
  invalid('let value: string | number = "text"; value = true;', 2322);
  invalid(
    'function read(value: object | null) { if (typeof value === "object") return value.toString(); }',
    18047,
  );
});

test("Guard: stringhe primitive non wrapper", () => {
  const { value: isString } = run(snippet(1, "function isString("), "isString");
  for (const value of ["", "hello"]) assert.equal(isString(value), true);
  for (const value of [null, undefined, 0, {}, [], new String("x")])
    assert.equal(isString(value), false);
});

test("Guard: record JSON, tipi dei campi e proprieta extra conservate", () => {
  const { value: api, output } = run(
    snippet(1, "function isUser"),
    "({ isUser, handle })",
  );
  assert.deepEqual(output, [["x@example.com"], ["Utente non valido"]]);
  const record = { id: "", email: "not-an-email", extra: "retained" };
  assert.equal(api.isUser(record), true);
  assert.equal(api.handle(record), "not-an-email");
  assert.equal(record.extra, "retained");
  assert.equal(
    api.isUser(Object.assign(Object.create(null), { id: "x", email: "x" })),
    true,
  );
  for (const value of [
    null,
    undefined,
    1,
    "x",
    {},
    [],
    { id: "x" },
    { id: 1, email: "x" },
    { id: "x", email: null },
    Object.create({ id: "x", email: "x" }),
    Object.assign([], { id: "x", email: "x" }),
  ])
    assert.equal(api.isUser(value), false);
});

test("Guard: presenza, undefined e proprieta ereditata sono distinti", () => {
  const { value: readLabel, output } = run(
    snippet(1, "function readLabel"),
    "readLabel",
  );
  assert.deepEqual(output, [[undefined], ["Appunti"]]);
  assert.equal(readLabel(Object.create({ label: "inherited" })), "inherited");
  assert.equal(readLabel({ label: "" }), "");
  for (const value of [
    null,
    undefined,
    "x",
    {},
    { label: 42 },
    { label: null },
  ])
    assert.equal(readLabel(value), undefined);
});

test("Guard: array densi, vuoti e sparsi; every salta i buchi", () => {
  const { value: isStringArray, output } = run(
    snippet(1, "function isStringArray"),
    "isStringArray",
  );
  assert.deepEqual(output, [[true, false]]);
  assert.equal(isStringArray([]), true);
  assert.equal(isStringArray(Object.freeze(["a", ""])), true);
  const sparse = ["a", , "b"];
  assert.equal(isStringArray(sparse), false);
  assert.equal(
    sparse.every((value) => typeof value === "string"),
    true,
  );
  for (const value of [null, {}, "abc", [undefined], ["a", 1]])
    assert.equal(isStringArray(value), false);
  const mutable = ["a"];
  assert.equal(isStringArray(mutable), true);
  mutable.push(42);
  assert.equal(isStringArray(mutable), false);
});

test("Guard: Array.isArray attraversa realm senza validare gli elementi", () => {
  const other = vm.runInNewContext('["a", 1]');
  assert.equal(other instanceof Array, false);
  assert.equal(Array.isArray(other), true);
  const { value: isStringArray } = run(
    snippet(1, "function isStringArray"),
    "isStringArray",
  );
  assert.equal(isStringArray(other), false);
  assert.equal(isStringArray(vm.runInNewContext('["a"]')), true);
});

test("Guard: hasOwn non restringe da solo; in con campo opzionale", () => {
  invalid(
    'function read(value: object) { if (Object.hasOwn(value, "label")) return value.label; }',
    2339,
  );
  valid(
    'function read(value: object) { if ("label" in value) return value.label; }',
  );
  invalid(
    `
type A = { id: string };
type B = { id?: string; label: string };
function read(value: A | B) {
  if ("id" in value) { const required: string = value.id; }
  else { const optional: B = value; }
}
`,
    2322,
  );
});

test("Union: successo vuoto valido, successo senza payload rifiutato", () => {
  const source = snippet(2, "type LoadingState");
  assert.deepEqual(structuredClone(run(source, "ready").value), {
    status: "success",
    data: [],
  });
  invalid(source.replace("// const broken:", "const broken:"), 2322);
});

test("Union: formatter locale e variante nuova senza ritorno", () => {
  const source = snippet(2, "type Payment");
  const { value: describe, output } = run(source, "describe");
  assert.deepEqual(output, [["Carta **** 1234"]]);
  assert.equal(
    describe({ kind: "bank_transfer", iban: "demo" }),
    "Bonifico demo",
  );
  assert.equal(
    describe({ kind: "paypal", email: "invalid" }),
    "PayPal invalid",
  );
  assert.equal(describe({ kind: "card" }), "Carta **** undefined");
  invalid(
    source.replace(
      '| { kind: "paypal"; email: string };',
      '| { kind: "paypal"; email: string }\n  | { kind: "cash" };',
    ),
    2366,
  );
});

test("Union: widening, satisfies e controllo statico senza freeze", () => {
  const source = snippet(2, "type Result =");
  assert.deepEqual(run(source).output, [["0"]]);
  invalid(
    source.replace("// describeResult(widened);", "describeResult(widened);"),
    2345,
  );
  valid(
    source +
      typeChecks +
      `
type Wide = Expect<Equal<typeof widened.kind, string>>;
type Precise = Expect<Equal<typeof result.kind, "ok">>;
`,
  );
  assert.equal(run(source, "Object.isFrozen(result)").value, false);
});

test("Union: destructuring correlata, let e rest non equivalenti", () => {
  const source = snippet(2, "type Action =");
  const { value: summarize, output } = run(source, "summarize");
  assert.deepEqual(output, [["3"]]);
  assert.equal(summarize({ kind: "label", payload: "ciao" }), "CIAO");
  invalid(
    source.replace("const { kind, payload }", "let { kind, payload }"),
    2339,
  );
  invalid(
    source.replace(
      "const { kind, payload } = action;",
      "const { kind, ...rest } = action;\n  const { payload } = rest;",
    ),
    2339,
  );
});

test("Esaustivita: helper never lancia senza serializzare valori", () => {
  const source = snippet(3, 'throw new Error("Caso non gestito")');
  const { value: assertNever } = run(source, "assertNever");
  const circular = {};
  circular.self = circular;
  let serialized = false;
  for (const value of [
    circular,
    42n,
    {
      toJSON() {
        serialized = true;
        throw new Error("wrong");
      },
    },
  ]) {
    assert.throws(
      () => assertNever(value),
      (error) => error.message === "Caso non gestito",
    );
  }
  assert.equal(serialized, false);
  invalid(source + "\nconst external: any = 1; assertNever(external);", 2345);
});

test("Esaustivita: quattro stati e payload inatteso a runtime", () => {
  const source = snippet(3, "type State =");
  const { value: render, output } = run(source, "render");
  assert.deepEqual(output, [["In attesa"], [""]]);
  for (const [state, expected] of [
    [{ status: "idle" }, "In attesa"],
    [{ status: "loading" }, "Caricamento"],
    [{ status: "success", data: ["A", "B"] }, "A, B"],
    [{ status: "error", message: "Timeout" }, "Timeout"],
  ])
    assert.equal(render(state), expected);
  assert.throws(() => render({ status: "unknown" }), /Stato non gestito/);
});

test("Esaustivita: nuova variante segnalata, as never nasconde l'errore", () => {
  const source = snippet(3, "type State =").replace(
    '| { status: "loading" }',
    '| { status: "loading" }\n  | { status: "empty" }',
  );
  invalid(source, 2345);
  const cast = source.replace(
    "assertNever(state)",
    "assertNever(state as never)",
  );
  const { value: render } = run(cast, "render");
  assert.throws(() => render({ status: "empty" }), /Stato non gestito/);
  const open = snippet(3, "type State =").replace(
    '| { status: "loading" }',
    '| { status: "loading" }\n  | { status: string; data: string[]; message: string }',
  );
  invalid(open, 2345);
});

test("Esaustivita: ritorno inferito, esplicito, noImplicitReturns e fallback", () => {
  const source =
    'function label(value: "a" | "b") { if (value === "a") return "A"; }';
  assert.equal(run(source, 'label("b")').value, undefined);
  invalid(source, 7030, { noImplicitReturns: true });
  invalid(
    source.replace('value: "a" | "b") {', 'value: "a" | "b"): string {'),
    2366,
  );
  valid(source.replace('return "A"; }', 'return "A"; return "fallback"; }'), {
    noImplicitReturns: true,
  });
});

test("Esaustivita: mapping completo con Record non valida chiavi esterne", () => {
  const source = snippet(3, "type Mode =");
  assert.deepEqual(run(source).output, [["Lettura"]]);
  assert.equal(run(source, 'label("write")').value, "Scrittura");
  invalid(
    source.replace(
      'type Mode = "read" | "write";',
      'type Mode = "read" | "write" | "delete";',
    ),
    1360,
  );
  const { value: label } = run(source, "label");
  assert.equal(label("missing"), undefined);
});

test("Predicate: number include NaN e infinito, tipo promesso deve essere compatibile", () => {
  const source = snippet(4, "function isNumber(");
  const { value: isNumber } = run(source, "isNumber");
  for (const value of [0, -1, NaN, Infinity])
    assert.equal(isNumber(value), true);
  for (const value of ["1", null, {}, undefined])
    assert.equal(isNumber(value), false);
  invalid(
    "function isNumber(value: string): value is number { return true; }",
    2677,
  );
  invalid(
    "function isString(value: unknown): other is string { return true; }",
    1225,
  );
});

test("Predicate: isAdmin classifica una union gia valida e conserva riferimenti", () => {
  const source = snippet(4, "type Admin =");
  const { value: api, output } = run(
    source,
    "({ users, admins, isAdmin, listPermissions })",
  );
  assert.deepEqual(output, [[[["read"]]]]);
  assert.equal(api.isAdmin(api.users[0]), false);
  assert.equal(api.isAdmin(api.users[1]), true);
  assert.notEqual(api.admins, api.users);
  assert.equal(api.admins[0], api.users[1]);
  assert.equal(api.listPermissions(api.users[1]), api.users[1].permissions);
  assert.deepEqual(Array.from(api.listPermissions(api.users[0])), []);
  assert.equal(
    api.listPermissions({ role: "admin" }),
    undefined,
    "Unknown JSON is not validated by isAdmin",
  );
  valid(
    source +
      typeChecks +
      "\ntype AdminList = Expect<Equal<typeof admins, Admin[]>>;",
  );
});

test("Predicate: inferenza nullable, Boolean e truthiness hanno tipi diversi", () => {
  const source = snippet(4, "const truthy =");
  assert.deepEqual(run(source).output, [[[0, 1]], [[1], [1]]]);
  valid(
    source +
      typeChecks +
      `
type Present = Expect<Equal<typeof present, number[]>>;
type Truthy = Expect<Equal<typeof truthy, (number | null)[]>>;
type ViaBoolean = Expect<Equal<typeof viaBoolean, (number | null)[]>>;
`,
  );
  const annotated = source.replace(
    "(value) => value !== null",
    "(value): boolean => value !== null",
  );
  valid(
    annotated +
      typeChecks +
      "\ntype Present = Expect<Equal<typeof present, (number | null)[]>>;",
  );
});

test("Predicate: isPresent conserva tutti i falsy non nullish", () => {
  const source = snippet(4, "function isPresent");
  assert.deepEqual(run(source).output, [[["", 0, false]]]);
  valid(
    source +
      typeChecks +
      "\ntype Present = Expect<Equal<typeof present, (string | number | boolean)[]>>;",
  );
  const { value: isPresent } = run(source, "isPresent");
  assert.equal(isPresent(NaN), true);
  assert.equal(isPresent(undefined), false);
});

test("Predicate: classificatore parziale rompe il ramo false", () => {
  const source = snippet(4, "function isSmallNumberUnsafe");
  const { value: describeUnsafe, output } = run(source, "describeUnsafe");
  assert.deepEqual(output, [["CIAO"]]);
  assert.equal(describeUnsafe(5), "5.0");
  for (const value of [20, -20, NaN, Infinity]) {
    assert.throws(() => describeUnsafe(value), hasName("TypeError"));
  }
  invalid(source.replace("value is number", "boolean"), 2339);
});

test("Predicate: firma accettata anche con corpo falso", () => {
  const source = snippet(4, "function isNumber(").replace(
    'return typeof value === "number";',
    "return true;",
  );
  const { value: isNumber } = run(source, "isNumber");
  assert.equal(isNumber("not-a-number"), true);
  assert.throws(
    () =>
      run(
        source +
          '\nconst raw: unknown = "text"; if (isNumber(raw)) raw.toFixed();',
      ),
    hasName("TypeError"),
  );
});

test("Assertion: controllo stringa effettivo e nessun valore booleano restituito", () => {
  const source = snippet(5, "function assertString(");
  const { value: assertString } = run(source, "assertString");
  assert.equal(assertString(""), undefined);
  for (const value of [null, undefined, 0, false, {}, []])
    assert.throws(() => assertString(value), hasName("TypeError"));
  invalid(source + '\nif (assertString("x")) {}', 1345);
});

test("Assertion: config JSON, proprieta proprie e tipo ma non URL", () => {
  const source = snippet(5, "function assertConfig");
  const { value: assertConfig, output } = run(source, "assertConfig");
  assert.deepEqual(output, [["https://example.com"]]);
  for (const apiUrl of ["", "not-a-url", "javascript:demo"]) {
    const value = { apiUrl, extra: "retained" };
    assert.equal(assertConfig(value), undefined);
    assert.deepEqual(value, { apiUrl, extra: "retained" });
  }
  for (const value of [
    null,
    undefined,
    1,
    {},
    [],
    { apiUrl: 1 },
    { apiUrl: null },
    Object.create({ apiUrl: "https://example.com" }),
    Object.assign([], { apiUrl: "https://example.com" }),
  ])
    assert.throws(
      () => assertConfig(value),
      /Expected config.apiUrl to be a string/,
    );
});

test("Assertion: condizione e numeri finiti, zero ammesso", () => {
  const source = snippet(5, "function assert(condition");
  const { value: api, output } = run(
    source,
    "({ assert, requireFiniteNumber })",
  );
  assert.deepEqual(output, [[0]]);
  for (const value of [0, -1, 1.5])
    assert.equal(api.requireFiniteNumber(value), value);
  for (const value of [NaN, Infinity, -Infinity])
    assert.throws(
      () => api.requireFiniteNumber(value),
      /Expected finite number/,
    );
  for (const value of ["1", undefined, null])
    assert.throws(() => api.requireFiniteNumber(value), /Expected number/);
  for (const value of [0, "", false, NaN])
    assert.throws(() => api.assert(value, "Falsy"), /Falsy/);
});

test("Assertion: assertDefined esclude solo nullish e restringe il tipo", () => {
  const source = snippet(5, "function assertDefined");
  const { value: api, output } = run(source, "({ assertDefined, upperLabel })");
  assert.deepEqual(output, [["CIAO"]]);
  for (const value of [0, false, "", NaN])
    assert.equal(api.assertDefined(value), undefined);
  for (const value of [null, undefined])
    assert.throws(() => api.assertDefined(value), /Expected a defined value/);
  assert.equal(api.upperLabel(""), "");
  assert.throws(() => api.upperLabel(undefined), /Expected a defined value/);
});

test("Assertion: arrow tipizzata sul nome evita TS2775", () => {
  const source = snippet(5, "const assertString:");
  const { value: shout, output } = run(source, "shout");
  assert.deepEqual(output, [["CIAO"]]);
  assert.throws(() => shout(42), hasName("TypeError"));
  const inferred = source.replace(
    "const assertString: (value: unknown) => asserts value is string =\n  (value) => {",
    "const assertString = (value: unknown): asserts value is string => {",
  );
  assert.notEqual(inferred, source);
  invalid(inferred, 2775);
});

test("Assertion: catch non mantiene la promessa dopo un errore", () => {
  const source =
    snippet(5, "function assertString(") +
    `
function unsafe(value: unknown): string {
  try { assertString(value); } catch {}
  return value.toUpperCase();
}
`;
  invalid(source, 18046);
});

test("Assertion: corpo vuoto o senza throw non e verificato dal checker", () => {
  const source = snippet(5, "function assertString(").replace(
    'if (typeof value !== "string")',
    "if (false)",
  );
  assert.throws(
    () =>
      run(
        source +
          "\nconst raw: unknown = 42; assertString(raw); raw.toUpperCase();",
      ),
    hasName("TypeError"),
  );
});

test("Assertion: nessun predicate dentro Promise, usare un ritorno validato", () => {
  invalid(
    "function check(value: unknown): Promise<asserts value is string> { throw new Error(); }",
    1228,
  );
  valid(
    snippet(5, "function assertString(") +
      `
async function checked(value: Promise<unknown>): Promise<string> {
  const resolved = await value;
  assertString(resolved);
  return resolved;
}
`,
  );
});
