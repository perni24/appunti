import assert from "node:assert/strict";
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

const notes = [
  "Generics avanzati",
  "Conditional Types",
  "Mapped Types",
  "Template Literal Types",
  "Indexed Access Types",
  "Keyof e typeof",
  "Infer nei Conditional Types",
  "Recursive types",
  "Variadic tuple types",
];
const blocks = notes.map((name) =>
  parseNote(`Programmazione/TypeScript/Pagine/${name}.md`)
    .tree.children.filter((node) => node.type === "code" && node.lang === "ts")
    .map((node) => node.value),
);
function snippet(index, marker) {
  const found = blocks[index].filter((source) => source.includes(marker));
  assert.equal(found.length, 1, `${notes[index]}: unique marker ${marker}`);
  return found[0];
}
function types(source, checks, options) {
  return valid(source + typeChecks + "\n" + checks, options);
}

test("Toolchain: TypeScript 5.9.3", () => assert.equal(ts.version, "5.9.3"));
for (const [index, snippets] of blocks.entries()) {
  for (const [position, source] of snippets.entries()) {
    test(`${notes[index]}: blocco ${position + 1} compila in strict`, () =>
      valid(source));
  }
}

test("Generics: getter conserva chiave e valore", () => {
  const source = snippet(0, "function getProperty");
  types(
    source,
    "type A = Expect<Equal<typeof retries, number>>; const key: 'retries' | 'label' = Math.random() ? 'retries' : 'label'; const value = getProperty(settings, key); type B = Expect<Equal<typeof value, string | number>>;",
  );
  assert.deepEqual(run(source).output, [[3]]);
  invalid(
    source.replace(
      '// getProperty(settings, "missing");',
      'getProperty(settings, "missing");',
    ),
    2345,
  );
});

test("Generics: repository sostituisce, mantiene identita e non reindicizza", () => {
  const { value: users, output } = run(snippet(0, "class Repository"), "users");
  assert.deepEqual(output, [["luca@example.com"], [undefined]]);
  const user = { id: "u_1", email: "not-an-email" };
  users.save(user);
  assert.equal(users.findById("u_1"), user);
  user.id = "u_2";
  assert.equal(users.findById("u_1"), user);
  assert.equal(users.findById("u_2"), undefined);
  invalid(snippet(0, "class Repository") + '\nusers.save({ id: "x" });', 2345);
});

test("Generics: default, constraint e sottotipo non costruibile dal vincolo", () => {
  const source = snippet(0, "type Outcome");
  assert.deepEqual(run(source).output, [["No result", 2]]);
  types(
    source,
    "type A = Expect<Equal<Page<string>['items'], readonly string[]>>; const custom: Outcome<number, string> = { ok: false, error: 'failed' };",
  );
  invalid(source + "\ntype Wrong = Page<string, number[]>;", 2344);
  invalid("type Wrong<T = string, U> = [T, U];", 2706);
  invalid(
    "function make<T extends { id: string }>(): T { return { id: 'x' }; }",
    2322,
  );
});

test("Conditional: distribuzione, confronto globale e tipi speciali", () => {
  types(
    snippet(1, "type IsString"),
    `
type C1 = Expect<Equal<A, true>>;
type C2 = Expect<Equal<B, false>>;
type C3 = Expect<Equal<Mixed, boolean>>;
type C4 = Expect<Equal<Concrete, false>>;
type C5 = Expect<Equal<Whole, false>>;
type C6 = Expect<Equal<Empty, never>>;
type C7 = Expect<Equal<Unknown, false>>;
type C8 = Expect<Equal<Unchecked, boolean>>;
type C9 = Expect<Equal<IsNever<never>, true>>;
type C10 = Expect<Equal<IsNever<string>, false>>;
`,
  );
});

test("Conditional: unwrap singolo, Awaited annidato e thenable", () => {
  types(
    snippet(1, "type ApiData"),
    `
type C1 = Expect<Equal<A, User>>;
type C2 = Expect<Equal<B, User>>;
type C3 = Expect<Equal<Nested, Promise<User>>>;
type C4 = Expect<Equal<Resolved, User>>;
type Thenable = PromiseLike<User>;
type C5 = Expect<Equal<ApiData<Thenable>, Thenable>>;
type C6 = Expect<Equal<Awaited<Thenable>, User>>;
type C7 = Expect<Equal<Awaited<null | Promise<User>>, null | User>>;
`,
  );
});

test("Conditional: filtro non invia email o elimina campi", () => {
  const source = snippet(1, "type Notification");
  assert.deepEqual(run(source).output, [["email"]]);
  types(
    source,
    'type A = Expect<Equal<EmailNotification, { kind: "email"; address: string }>>; type B = Expect<Equal<WithAddress<{ address?: string }>, never>>;',
  );
  invalid(
    source +
      '\nconst wrong: EmailNotification = { kind: "local", message: "x" };',
    2322,
  );
});

test("Mapped: readonly e superficiale e non congela", () => {
  const source = snippet(2, "type MyReadonly");
  assert.deepEqual(run(source).output, [[1]]);
  assert.equal(run(source, "Object.isFrozen(state)").value, false);
  invalid(source.replace("// state.nested =", "state.nested ="), 2540);
  types(
    source,
    "type A = Expect<Equal<MyReadonly<[string, number]>, readonly [string, number]>>;",
  );
});

test("Mapped: form effettivo e conservazione dei modificatori", () => {
  const source = snippet(2, "type FormState");
  assert.deepEqual(run(source).output, [["demo@example.com", true]]);
  invalid(source + '\nform.active.value = "yes";', 2322);
  const optional =
    source + "\nconst draft: FormState<{ readonly name?: string }> = {};";
  valid(optional);
  invalid(optional + '\ndraft.name = { value: "x", touched: true };', 2540);
  types(
    source,
    "type A = Expect<Equal<FormState<{ name?: string }>['name'], { value: string | undefined; touched: boolean } | undefined>>;",
  );
});

test("Mapped: rimozione optional e undefined esplicito dipendono da exact", () => {
  const source = snippet(2, "type EditableComplete");
  assert.deepEqual(run(source).output, [["Manuale"]]);
  types(
    source,
    "type A = Expect<Equal<EditableComplete<Draft>['title'], string>>;",
  );
  const withUndefined =
    source +
    "\nconst explicit: EditableComplete<{ title?: string | undefined }> = { title: undefined };";
  invalid(withUndefined, 2322);
  valid(withUndefined, { exactOptionalPropertyTypes: true });
  invalid(source + "\nconst missing: EditableComplete<Draft> = {};", 2741);
});

test("Mapped: remapping, filtro, collisioni e campi runtime", () => {
  const source = snippet(2, "type ValueReaders");
  assert.deepEqual(run(source).output, [[true]]);
  types(
    source,
    `
const token = Symbol();
type A = Expect<Equal<keyof ValueReaders<{ id: string; 0: boolean; [token]: number }>, 'read_id'>>;
type B = Expect<Equal<keyof WithoutId<User>, 'email' | 'active'>>;
type Collapse<T> = { [K in keyof T as 'one']: T[K] };
type C = Expect<Equal<Collapse<{ a: string; b: number }>['one'], string | number>>;
`,
  );
  const { value } = run(
    source +
      '\nconst original = { id: "x", email: "a", active: true }; const view: WithoutId<User> = original;',
    "view",
  );
  assert.equal(value.id, "x");
});

test("Template: prodotto cartesiano e nomi derivati", () => {
  types(
    snippet(3, "type Entity"),
    'type A = Expect<Equal<EventName, "user:created" | "user:deleted" | "order:created" | "order:deleted">>;',
  );
  const source = snippet(3, "function onUserEvent");
  assert.deepEqual(run(source).output, [["emailChanged"]]);
  types(
    source,
    'type A = Expect<Equal<UserEvent, "idChanged" | "emailChanged">>;',
  );
  invalid(source + '\nonUserEvent("unknownChanged");', 2345);
});

test("Template: payload correlato in entrambi i rami", () => {
  const source = snippet(3, "function describeChange");
  const { value: describe, output } = run(source, "describeChange");
  assert.deepEqual(output, [["Inattivo"]]);
  assert.equal(describe({ name: "activeChanged", value: true }), "Attivo");
  assert.equal(describe({ name: "emailChanged", value: "DEMO" }), "demo");
  invalid(source.replace("// describeChange({", "describeChange({"), 2345);
});

test("Template: parser accetta esattamente il prefisso, non identita", () => {
  const { value: parse, output } = run(
    snippet(3, "function parseUserId"),
    "parseUserId",
  );
  assert.deepEqual(output, [["user_42"], ["user_"]]);
  for (const value of ["user_", "user_a b", "user_\n", "user_42"])
    assert.equal(parse(value), value);
  for (const value of [undefined, null, 42, {}, "USER_42", "xuser_42"])
    assert.throws(() => parse(value), hasName("TypeError"));
});

test("Indexed: getter conserva union di campo, non literal del valore", () => {
  const source = snippet(4, "function getSetting");
  types(source, 'type A = Expect<Equal<typeof theme, "light" | "dark">>;');
  assert.deepEqual(run(source).output, [["dark"]]);
  invalid(
    source + '\ngetSetting({ theme: "light", retries: 1 }, "missing");',
    2345,
  );
  const { value: getSetting } = run(source, "getSetting");
  assert.equal(getSetting({ theme: "light" }, "missing"), undefined);
});

test("Indexed: array vuoto, tuple e noUncheckedIndexedAccess", () => {
  const source = snippet(4, "function firstRole");
  assert.deepEqual(run(source).output, [[undefined]]);
  types(
    source,
    'type A = Expect<Equal<Role, "reader" | "editor">>; type B = Expect<Equal<FirstRole, "reader">>;',
    { noUncheckedIndexedAccess: true },
  );
  const read =
    "const list: string[] = []; const item = list[0]; type Element = string[][number];";
  types(read, "type A = Expect<Equal<typeof item, string>>;");
  types(
    read,
    "type A = Expect<Equal<typeof item, string | undefined>>; type B = Expect<Equal<Element, string>>;",
    { noUncheckedIndexedAccess: true },
  );
  assert.equal(run(read, "item").value, undefined);
  invalid(source + "\ntype Missing = (typeof roles)[2];", 2493);
});

test("Indexed: optional letto, NonNullable non crea il campo, valore non e tipo", () => {
  const source = snippet(4, "type Profile =");
  types(
    source,
    "type A = Expect<Equal<Label, string>>; type B = Expect<Equal<Id, string>>;",
    { exactOptionalPropertyTypes: true },
  );
  assert.deepEqual(run(source).output, [[undefined]]);
  invalid(source + "\ntype Bad = User[key];", 2749);
  invalid(source.replace('const key = "id";', 'let key = "id";'), 2537);
});

test("Keyof: chiavi, valori e typeof runtime distinti", () => {
  const source = snippet(5, "const roles");
  assert.deepEqual(run(source).output, [["object"]]);
  types(
    source,
    'type A = Expect<Equal<RoleKey, "admin" | "user">>; type B = Expect<Equal<RoleValue, "ADMIN" | "USER">>;',
  );
});

test("Keyof: generic migliora readConfig e non congela l'oggetto", () => {
  const source = snippet(5, "function readConfig");
  types(source, "type A = Expect<Equal<typeof timeout, 5000>>;");
  assert.deepEqual(run(source).output, [[5000]]);
  assert.equal(run(source, "Object.isFrozen(config)").value, false);
  const wide = source.replace(
    "<K extends ConfigKey>(key: K): (typeof config)[K]",
    "(key: ConfigKey): (typeof config)[ConfigKey]",
  );
  types(
    wide,
    'type A = Expect<Equal<typeof timeout, "https://example.com" | 5000>>;',
  );
});

test("Keyof: symbol, numeri, union e Object.keys eccede la vista", () => {
  types(
    snippet(5, "const token"),
    `
type A = Expect<Equal<ModelKey, 'id' | 0 | typeof token>>;
type B = Expect<Equal<DictionaryKey, string | number>>;
type C = Expect<Equal<NumericKey, number>>;
type D = Expect<Equal<CommonKey, 'id'>>;
`,
  );
  assert.deepEqual(run(snippet(5, "const full")).output, [[["id", "debug"]]]);
  invalid(
    'type Item = { id: string; text: string } | { id: string; count: number }; type Text = Item["text"];',
    2339,
  );
});

test("Infer: singolo unwrap e ritorno statico, senza eseguire funzioni", () => {
  types(
    snippet(6, "type UnwrapPromise"),
    "type A = Expect<Equal<Single, number>>; type B = Expect<Equal<Nested, Promise<number>>>; type C = Expect<Equal<Resolved, number>>;",
  );
  const source = snippet(6, "type Return<T>");
  assert.deepEqual(run(source).output, [["u_1"]]);
  types(
    source,
    "type A = Expect<Equal<User, { id: string; email: string }>>; type B = Expect<Equal<Return<(id: string) => number>, number>>;",
  );
  const unknownArgs = source.replace("...args: never[]", "...args: unknown[]");
  types(
    unknownArgs,
    "type A = Expect<Equal<Return<(id: string) => number>, never>>;",
  );
  types(
    source
      .replace(
        "function createUser() {",
        "function createUser(): { id: string } {",
      )
      .replace('    email: "luca@example.com",\n', ""),
    "type A = Expect<Equal<User, { id: string }>>;",
  );
});

test("Infer: readonly, tuple vuota/aperta e parametri opzionali", () => {
  types(
    snippet(6, "type ElementOf"),
    `
type A = Expect<Equal<Element, 'a' | 2>>;
type B = Expect<Equal<Head, 'a'>>;
type C = Expect<Equal<Empty, never>>;
type D = Expect<Equal<GeneralArray, never>>;
type E = Expect<Equal<TextHead, 'a'>>;
type F = Expect<Equal<NotText, never>>;
type G = Expect<Equal<Arguments, [id: string, active?: boolean]>>;
type H = Expect<Equal<ElementOf<string[]>, string>>;
`,
  );
});

test("Infer: ultima firma, generic cancellato e declare senza runtime", () => {
  const source = snippet(6, "declare function parse");
  types(
    source,
    "type A = Expect<Equal<Parsed, string | number>>; type B = Expect<Equal<IdentityResult, unknown>>;",
  );
  assert.throws(
    () => run(source + '\nparse("42");'),
    hasName("ReferenceError"),
  );
  invalid("type Invalid<T> = infer E;", 1338);
});

test("Recursive: albero finito e nodo condiviso contato piu volte", () => {
  const source = snippet(7, "function countNodes");
  const { value: count, output } = run(source, "countNodes");
  assert.deepEqual(output, [[2]]);
  const leaf = { id: "leaf", children: [] };
  assert.equal(count(leaf), 1);
  assert.equal(count({ id: "root", children: [leaf, leaf] }), 3);
  valid(
    source +
      '\nconst cyclic: TreeNode = { id: "cycle", children: [] }; cyclic.children.push(cyclic);',
  );
  // Do not run an unbounded recursive traversal just to demonstrate its risk.
});

test("Recursive: JsonValue non garantisce numeri finiti o assenza di cicli", () => {
  const source = snippet(7, "type JsonValue");
  assert.deepEqual(run(source).output, [
    ['{"user":{"id":"u_1","tags":["admin","editor"]}}'],
  ]);
  assert.equal(
    run(source + "\nconst value: JsonValue = NaN;", "JSON.stringify(value)")
      .value,
    "null",
  );
  assert.throws(
    () =>
      run(
        source +
          "\nconst cyclic: JsonValue[] = []; cyclic.push(cyclic); JSON.stringify(cyclic);",
      ),
    hasName("TypeError"),
  );
  invalid(source + "\nconst unsupported: JsonValue = undefined;", 2322);
  invalid(source + "\nconst unsupported: JsonValue = 1n;", 2322);
});

test("Recursive: caso base, distribuzione, vuoto e ricorsione senza fine", () => {
  const source = snippet(7, "type NestedElement");
  types(
    source,
    "type C1 = Expect<Equal<A, number>>; type C2 = Expect<Equal<B, string | number>>; type C3 = Expect<Equal<C, never>>;",
  );
  invalid(
    source +
      "\ninterface Loop extends ReadonlyArray<Loop> {} type TooDeep = NestedElement<Loop>;",
    2589,
  );
});

test("Recursive: readonly profondo non protegge alias mutabili o classi", () => {
  const source = snippet(7, "type DeepReadonlyData");
  assert.deepEqual(run(source).output, [["B"]]);
  invalid(
    source.replace("// view.rows[0]!.label =", "view.rows[0]!.label ="),
    2540,
  );
  invalid(source + '\nview.rows.push({ label: "C" });', 2339);
  assert.equal(run(source, "source === view").value, true);
  invalid(
    source +
      "\nconst date: DeepReadonlyData<Date> = new Date(); date.getTime();",
    2349,
  );
});

test("Variadic: input readonly e risultato mutabile, label solo documentative", () => {
  const source = snippet(8, "type WithContext");
  types(
    source,
    'type A = Expect<Equal<RequestArgs, [string, string, boolean]>>; args[1] = "other";',
  );
  assert.deepEqual(run(source).output, [["u_1"]]);
  invalid(source + "\nargs.context;", 2339);
});

test("Variadic: wrapper conserva output, non registra argomenti, propaga throw", () => {
  const source = snippet(8, "function withLog");
  const { value: wrap, output } = run(source, "withLog");
  assert.deepEqual(output, [
    ["Function called"],
    [{ id: "u_1", active: true }],
  ]);
  const error = new Error("failed");
  const fn = wrap(() => {
    throw error;
  });
  assert.throws(fn, (actual) => actual === error);
  invalid(source + "\nupdate(1, true);", 2345);
  invalid(
    source +
      "\nfunction method(this: { id: string }) { return this.id; } withLog(method);",
    2345,
  );
});

test("Variadic: promise originale e rejection osservata dal chiamante", async () => {
  const { value: wrap } = run(snippet(8, "function withLog"), "withLog");
  const success = Promise.resolve(42);
  assert.equal(wrap(() => success)(), success);
  assert.equal(await success, 42);
  const error = new Error("rejected");
  const failure = Promise.reject(error);
  const returned = wrap(() => failure)();
  assert.equal(returned, failure);
  await assert.rejects(returned, (actual) => actual === error);
});

test("Variadic: concatenazione, array aperti e copia superficiale", () => {
  const source = snippet(8, "function concat");
  types(
    source,
    'type A = Expect<Equal<typeof combined, ["u_1", true, 3]>>; const open = concat(["a"], [1]); type B = Expect<Equal<typeof open, (string | number)[]>>;',
  );
  const { value: concat, output } = run(source, "concat");
  assert.deepEqual(output, [[["u_1", true, 3]]]);
  const obj = { id: "x" },
    left = [obj];
  const result = concat(left, []);
  assert.notEqual(result, left);
  assert.equal(result[0], obj);
});

test("Variadic: tail, suffisso, partial application e regole del rest", () => {
  const source = snippet(8, "function bindFirst");
  types(
    source,
    "type A = Expect<Equal<Rest, [boolean, number]>>; type B = Expect<Equal<Empty, never>>; type C = Expect<Equal<Open, never>>; const validFlag: WithFlag = [true];",
  );
  assert.deepEqual(run(source).output, [["item:7"]]);
  assert.equal(run(source, "label(0)").value, "item:0");
  invalid(source + '\nlabel("7");', 2345);
  invalid("type Bad = [...string[], boolean?];", 1266);
  invalid("type Bad = [...string[], ...number[]];", 1265);
});
