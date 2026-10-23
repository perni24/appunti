import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
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
const notes = [
  "Funzioni tipizzate",
  "Oggetti e proprieta opzionali",
  "Array, Tuple e Readonly",
  "Enums e Literal Types",
  "Assertion e casting dei tipi",
  "Firme di funzione e overload",
  "Index Signatures",
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

test("Funzioni: parametri, ritorni e annotazioni di base", () => {
  const source = snippet(0, "function sum(");
  assert.equal(run(source, "sum(2, 3)").value, 5);
  assert.equal(run(source, 'formatUser("Luca", 34)').value, "Luca (34)");
  invalid(source + '\nsum("2", 3);', 2345);
  invalid(source.replace("return a + b;", "return String(a + b);"), 2322);
});

test("Funzioni: default, undefined, null e rest vuoto", () => {
  const source = snippet(0, "function greet(");
  assert.deepEqual(run(source).output, [["Ciao Luca!"], [0]]);
  assert.equal(run(source, 'greet("Luca", "", "")').value, " Luca");
  assert.equal(run(source, "sumAll(1, 2, 3)").value, 6);
  invalid(
    source.replace('// greet("Luca", null);', 'greet("Luca", null);'),
    2345,
  );
});

test("Funzioni: callback contestuale e selezione senza mutazione", () => {
  const source = snippet(0, "type UserPredicate");
  const { value: selectUserIds, output } = run(source, "selectUserIds");
  const data = Object.freeze([
    Object.freeze({ id: "a", active: false }),
    Object.freeze({ id: "b", active: true }),
  ]);
  assert.deepEqual(output, [[["u_1"]]]);
  assert.deepEqual(Array.from(selectUserIds(data, (user) => user.active)), [
    "b",
  ]);
  assert.deepEqual(Array.from(selectUserIds([], () => true)), []);
  invalid(
    source +
      '\nselectUserIds(users, (user: User & { extra: string }) => user.extra === "x");',
    2345,
  );
});

test("Funzioni: void contestuale ignora il risultato, void esplicito lo controlla", () => {
  const source = snippet(0, "const collect:");
  assert.equal(run(source, 'collect("Marta")').value, 2);
  invalid(source.replace("// return 1;", "return 1;"), 2322);
  valid(
    source +
      "\nconst asyncCollector: (name: string) => void = async name => name.length;",
  );
});

test("Funzioni: Promise dichiarata ed errore asincrono gestibile", async () => {
  const source = snippet(0, "async function resolveLabel");
  const result = run(source, "printLabel()");
  await result.value;
  assert.deepEqual(result.output, [["Etichetta locale"]]);
  const failed = run(
    source.replace(
      'return "Etichetta locale";',
      'throw new Error("Local failure");',
    ),
    "printLabel()",
  );
  await assert.rejects(failed.value, /Local failure/);
});

test("Funzioni: callback puo ignorare parametri, opzionale permette omissione", () => {
  valid(
    "const callback: (value: string, index: number) => string = value => value;",
  );
  invalid(
    "const callback: (value: string, index?: number) => number = (value, index) => index + 1;",
    18048,
  );
});

test("Oggetti: proprieta opzionale e fallback", () => {
  const source = snippet(1, "type UserProfile");
  assert.deepEqual(run(source).output, [["luca@example.com"]]);
  invalid(source + "\nprofile.displayName.toUpperCase();", 18048);
  const undefinedSource =
    source +
    "\nconst other: UserProfile = { ...profile, displayName: undefined };";
  valid(undefinedSource);
  invalid(undefinedSource, 2375, { exactOptionalPropertyTypes: true });
});

test("Oggetti: preview senza invio, CC omesso, vuoto e presente", () => {
  const { value: formatMailPreview, output } = run(
    snippet(1, "type MailOptions"),
    "formatMailPreview",
  );
  assert.deepEqual(output, [["To: luca@example.com\nSubject: Promemoria"]]);
  for (const cc of [undefined, []]) {
    assert.equal(
      formatMailPreview({ to: "a", subject: "b", cc }),
      "To: a\nSubject: b",
    );
  }
  const cc = Object.freeze(["x", "y"]);
  assert.equal(
    formatMailPreview({ to: "a", subject: "b", cc }),
    "To: a\nSubject: b\nCC: x, y",
  );
  assert.deepEqual(cc, ["x", "y"]);
});

test("Oggetti: assenza distinta da undefined e null dal default", () => {
  const source = snippet(1, "const absent =");
  assert.deepEqual(run(source).output, [
    [false],
    [true],
    ["Predefinita"],
    ["Nessuna etichetta"],
    [""],
  ]);
  const { value: resolveLabel } = run(source, "resolveLabel");
  assert.equal(resolveLabel({ label: undefined }), "Predefinita");
  assert.equal(resolveLabel({ label: "" }), "");
});

test("Oggetti: Partial non definisce una patch ne protegge dal merge", () => {
  const source =
    snippet(1, "type UserProfile") +
    `
const patch: Partial<UserProfile> = { email: undefined };
const merged = { ...profile, ...patch };
`;
  assert.equal(run(source, "merged.email").value, undefined);
  invalid(source, 2375, { exactOptionalPropertyTypes: true });
  invalid("const required: { name: string | undefined } = {};", 2741);
});

test("Array: readonly e indici letterali della tupla", () => {
  const source = snippet(2, "const names:");
  invalid(
    source.replace(
      '// readonlyNames.push("Anna");',
      'readonlyNames.push("Anna");',
    ),
    2339,
  );
  invalid(source.replace("// point[2];", "point[2];"), 2493);
  invalid(source + "\nconst writable: string[] = readonlyNames;", 4104);
  valid(source + "\nconst writable: string[] = [...readonlyNames];");
});

test("Array: lettura assente indipendente dal tipo statico", () => {
  const source =
    snippet(2, "const names:") + "\nconst missing: string = names[99];";
  assert.equal(run(source, "missing").value, undefined);
  invalid(source, 2322, { noUncheckedIndexedAccess: true });
});

test("Tuple: normalizzazione locale, posizioni e readonly", () => {
  const source = snippet(2, "type ApiError");
  const { value: parseError, output } = run(source, "parseError");
  assert.deepEqual(output, [["UNKNOWN", "Timeout"]]);
  assert.deepEqual(Array.from(parseError(null)), [
    "INVALID_INPUT",
    "Input non valido",
  ]);
  assert.deepEqual(Array.from(parseError("")), ["UNKNOWN", ""]);
  invalid(
    source + '\nconst error = parseError("x"); error[0] = "OTHER";',
    2540,
  );
  invalid(source + '\nparseError("x").code;', 2339);
});

test("Array: ordinamento numerico su copia", () => {
  const { value: sortedScores, output } = run(
    snippet(2, "function sortedScores"),
    "sortedScores",
  );
  assert.deepEqual(output, [[[30, 2, 10]], [[2, 10, 30]]]);
  const data = Object.freeze([10, -1, 2, 2]);
  const sorted = sortedScores(data);
  assert.deepEqual(Array.from(sorted), [-1, 2, 2, 10]);
  assert.notEqual(sorted, data);
  assert.deepEqual(Array.from(sortedScores([])), []);
});

test("Readonly: vista condivisa, elementi mutabili, nessun freeze", () => {
  const source = snippet(2, "const mutable =");
  const { value, output } = run(source, "({ view, mutable })");
  assert.deepEqual(output, [[2]]);
  assert.equal(value.view, value.mutable);
  assert.equal(value.view[0].name, "Marta");
  assert.equal(Object.isFrozen(value.view), false);
});

test("Tuple: push permesso non aggiorna le posizioni statiche", () => {
  const source = snippet(2, "const pair:");
  assert.deepEqual(run(source).output, [[3]]);
  valid(
    source + typeChecks + "type Length = Expect<Equal<typeof pair.length, 2>>;",
  );
  invalid(source.replace("// pair[2];", "pair[2];"), 2493);
});

test("Enum: string enum e reverse mapping numerico", () => {
  const source = snippet(3, "type Role =");
  const { value, output } = run(source, "({ Direction, Phase })");
  assert.deepEqual(output, [[0, "Waiting"]]);
  assert.deepEqual(Object.values(value.Direction), ["UP", "DOWN"]);
  assert.deepEqual(Object.values(value.Phase), ["Waiting", "Running", 0, 1]);
  invalid(
    source.replace(
      '// const invalid: Direction = "UP";',
      'const invalid: Direction = "UP";',
    ),
    2322,
  );
  invalid(source, 1294, { erasableSyntaxOnly: true });
});

test("Enum: literal e number hanno controlli differenti", () => {
  const source = snippet(3, "const externalCode:");
  assert.deepEqual(run(source).output, [[99]]);
  invalid(
    source.replace(
      "// const literal: Phase = 99;",
      "const literal: Phase = 99;",
    ),
    2322,
  );
});

test("Literal: lista condivisa con guard e label", () => {
  const source = snippet(3, "const STATUSES =");
  const { value: api, output } = run(source, "({ isStatus, label })");
  assert.deepEqual(output, [["Completato"]]);
  for (const [status, label] of [
    ["idle", "In attesa"],
    ["loading", "Caricamento"],
    ["success", "Completato"],
    ["error", "Errore"],
  ]) {
    assert.equal(api.isStatus(status), true);
    assert.equal(api.label(status), label);
  }
  for (const input of ["done", "SUCCESS", "", null, undefined, 1, {}, []]) {
    assert.equal(api.isStatus(input), false);
  }
  invalid(source + '\nlabel("done");', 2345);
});

test("Enum: oggetto as const mantiene valori ordinari senza freeze", () => {
  const source = snippet(3, "const Direction =");
  valid(source, { erasableSyntaxOnly: true });
  const { value } = run(source, "Direction");
  assert.equal(Object.isFrozen(value), false);
  assert.equal(value.Up, "UP");
});

test("Const enum: inline e preserveConstEnums nel compilatore fissato", () => {
  const source = "const enum Code { Ready = 1 }\nconst code = Code.Ready;";
  const normal = valid(source).js;
  const preserved = valid(source, { preserveConstEnums: true }).js;
  assert.doesNotMatch(normal, /var Code/);
  assert.match(preserved, /var Code/);
});

test("Assertion: as non converte, Number esegue una conversione", () => {
  const source = snippet(4, "const asserted =");
  assert.deepEqual(run(source).output, [["string"], [42, "number"]]);
  assert.equal(run(source, "asserted + 1").value, "421");
});

test("Guard: verifica tipi reali e lascia invariati i campi aggiuntivi", () => {
  const source = snippet(4, "function isUser(");
  const { value: isUser, output } = run(source, "isUser");
  assert.deepEqual(output, [["luca@example.com"]]);
  for (const input of [
    { id: "u_1", email: "x@example.com" },
    { id: "", email: "" },
    { id: "u_1", email: "not-an-address", privateField: "kept" },
  ])
    assert.equal(isUser(input), true);
  const input = { id: "u_1", email: "x", privateField: "kept" };
  assert.equal(isUser(input), true);
  assert.equal(input.privateField, "kept");
});

test("Guard: rifiuta il vecchio falso positivo e campi ereditati", () => {
  const { value: isUser } = run(snippet(4, "function isUser("), "isUser");
  for (const input of [
    { id: 1, email: null },
    { id: "x", email: 42 },
    { id: null, email: "x" },
    null,
    undefined,
    "x",
    {},
    [],
    { id: "x" },
    Object.create({ id: "x", email: "x" }),
    Object.assign([], { id: "x", email: "x" }),
  ])
    assert.equal(isUser(input), false);
});

test("Guard: controprova, il checker accetta anche un predicate sbagliato", () => {
  const source = snippet(4, "function isUser(");
  const incorrect = source.replace(
    'typeof value.id === "string" &&\n    typeof value.email === "string"',
    "true",
  );
  assert.notEqual(incorrect, source);
  const { value: isUser } = run(incorrect, "isUser");
  assert.equal(isUser({ id: 1, email: null }), true);
});

test("Non-null assertion: null resta null a runtime", () => {
  const source = snippet(4, "function upperLabel(");
  assert.deepEqual(run(source).output, [["CIAO"]]);
  assert.throws(
    () => run(source.replace("// upperLabel(null);", "upperLabel(null);")),
    hasName("TypeError"),
  );
});

test("DOM: input valido, elemento assente, tipo errato e altro realm", async () => {
  const { chromium } = require(
    process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright",
  );
  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  try {
    const page = await browser.newPage();
    const source = valid(snippet(4, "function readEmailField(")).js;
    for (const [html, expected] of [
      ['<input id="email" value="x@example.com">', "x@example.com"],
      ['<input id="email" value="not-an-address">', "not-an-address"],
      ['<textarea id="email">x</textarea>', "TypeError"],
      ['<div id="email">x</div>', "TypeError"],
      ["<p>Nessun campo</p>", "TypeError"],
    ]) {
      await page.setContent(html);
      const actual = await page.evaluate(
        ({ source }) => {
          const exports = {};
          return new Function(
            "exports",
            `${source}; try { return readEmailField(document); } catch (error) { return error.name; }`,
          )(exports);
        },
        { source },
      );
      assert.equal(actual, expected);
    }
    await page.setContent(
      '<iframe srcdoc="<input id=email value=x>"></iframe>',
    );
    await page.waitForFunction(() =>
      document.querySelector("iframe").contentDocument.querySelector("input"),
    );
    const crossRealm = await page.evaluate(
      (source) =>
        new Function(
          "exports",
          `${source}; try { return readEmailField(document.querySelector("iframe").contentDocument); } catch (error) { return error.name; }`,
        )({}),
      source,
    );
    assert.equal(crossRealm, "TypeError");
  } finally {
    await browser.close();
  }
});

test("Overload: split/join e forwarding con narrowing", () => {
  const source = snippet(5, "function parse(");
  const { value: forward, output } = run(source, "forward");
  assert.deepEqual(output, [[["a", "b"]], ["a,b"]]);
  assert.deepEqual(Array.from(forward("a,b")), ["a", "b"]);
  assert.equal(forward(["a", "b"]), "a,b");
  invalid(
    source.replace("// return parse(value);", "return parse(value);"),
    2769,
  );
});

test("Overload: firma pubblica union esplicita risolve il caso", () => {
  const source = snippet(5, "function parse(")
    .replace(
      "function parse(value: string | string[]): string | string[] {",
      "function parse(value: string | string[]): string | string[];\nfunction parse(value: string | string[]): string | string[] {",
    )
    .replace("// return parse(value);", "return parse(value);");
  valid(source);
});

test("Overload: risultati e tipi delle chiamate concrete", () => {
  const source = snippet(5, "function getValue(");
  assert.deepEqual(run(source).output, [[3000, "localhost"]]);
  valid(
    source +
      typeChecks +
      `
type Port = Expect<Equal<typeof port, number>>;
type Host = Expect<Equal<typeof host, string>>;
type Last = Expect<Equal<ReturnType<typeof getValue>, string>>;
`,
  );
  invalid(source + '\ngetValue("missing");', 2769);
});

test("Overload: implementazione compatibile non dimostra il ramo corretto", () => {
  const source = snippet(5, "function getValue(").replace(
    "return 3000;",
    'return "localhost";',
  );
  const { value: port } = run(source, "port");
  assert.equal(typeof port, "string");
  assert.notEqual(
    port,
    3000,
    "Runtime assertions must detect the deliberately wrong implementation",
  );
});

test("Firme: union semplice e oggetto chiamabile", () => {
  assert.deepEqual(run(snippet(5, "function lengthOf(")).output, [[4, 2]]);
  const source = snippet(5, "type Formatter =");
  assert.deepEqual(run(source).output, [["3 elementi"]]);
  assert.equal(
    run(source, "formatCount.description").value,
    "Conteggio locale",
  );
});

test("Index: il checker puo omettere undefined ma il runtime no", () => {
  const source =
    snippet(6, "type Scores =") +
    '\nconst missing: number = scores["missing"];';
  assert.equal(run(source, "missing").value, undefined);
  invalid(source, 2322, { noUncheckedIndexedAccess: true });
  invalid(snippet(6, "type Scores =") + "\nscores.u_1;", 4111, {
    noPropertyAccessFromIndexSignature: true,
  });
});

test("Index: booleano proprio, chiave assente e prototipo", () => {
  const source = snippet(6, "type FeatureFlags =");
  const { value: isEnabled, output } = run(source, "isEnabled");
  assert.deepEqual(output, [[true], [false], [false]]);
  for (const name of ["missing", "toString", "constructor", "__proto__"]) {
    assert.equal(isEnabled({}, name), false);
  }
  assert.equal(
    isEnabled(Object.create({ inherited: true }), "inherited"),
    false,
  );
  assert.equal(isEnabled({ toString: true }, "toString"), true);
  assert.equal(isEnabled(JSON.parse('{"__proto__":true}'), "__proto__"), true);
  for (const value of [false, "true", 1, null, undefined]) {
    assert.equal(isEnabled({ own: value }, "own"), false);
  }
});

test("Index: controprova sul lookup precedente", () => {
  const source = snippet(6, "type FeatureFlags =")
    .replace(
      "return Object.hasOwn(flags, name) && flags[name] === true;",
      "return flags[name] ?? false;",
    )
    .replace(
      'console.log(isEnabled(flags, "toString"));',
      'void isEnabled(flags, "toString");',
    );
  const { value } = run(source, 'isEnabled(flags, "toString")');
  assert.equal(typeof value, "function");
});

test("Record: chiavi finite richieste, Partial e campi extra", () => {
  const source = snippet(6, "type FlagName =");
  invalid(
    source.replace("// complete.unknown = true;", "complete.unknown = true;"),
    2339,
  );
  invalid(source.replace("  betaDashboard: false,", ""), 2741);
  assert.deepEqual(structuredClone(run(source, "overrides").value), {});
});

test("Index: inventario separato, campi incompatibili e chiavi numeriche", () => {
  assert.deepEqual(run(snippet(6, "type Inventory =")).output, [[3]]);
  invalid("type Invalid = { [key: string]: number; label: string };", 2411);
  invalid(
    "type Invalid = { [key: string]: string; [index: number]: number };",
    2413,
  );
  valid(
    "type Data = { [key: `data-${string}`]: string }; const data: Data = { 'data-id': 'x' };",
  );
  const { value } = run(
    "const values: { [index: number]: string } = { 1: 'one' };",
    'values[1] === values["1"]',
  );
  assert.equal(value, true);
});
