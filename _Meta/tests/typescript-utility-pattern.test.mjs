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
  "Utility Types",
  "Utility Types personalizzati",
  "Brand Types",
  "satisfies operator",
  "as const",
  "const type parameters",
];
const blocks = notes.map((name) =>
  parseNote("Programmazione/TypeScript/Pagine/" + name + ".md")
    .tree.children.filter((node) => node.type === "code" && node.lang === "ts")
    .map((node) => node.value),
);
function snippet(index, marker) {
  const found = blocks[index].filter((source) => source.includes(marker));
  assert.equal(found.length, 1, notes[index] + ": unique marker " + marker);
  return found[0];
}
function types(source, checks, options) {
  return valid(source + typeChecks + "\n" + checks, options);
}
function uncomment(source, statement) {
  assert.ok(source.includes("// " + statement));
  return source.replace("// " + statement, statement);
}

test("Toolchain utility: TypeScript 5.9.3", () =>
  assert.equal(ts.version, "5.9.3"));
for (const [index, snippets] of blocks.entries()) {
  assert.ok(snippets.length > 0);
  for (const [position, source] of snippets.entries()) {
    test(
      notes[index] + ": blocco " + (position + 1) + " compila in strict",
      () => valid(source),
    );
  }
}

test("Utility: Omit non filtra, la proiezione elimina il campo dalla serializzazione", () => {
  const source = snippet(0, "function toPublicUser");
  const { value, output } = run(source, "({ user, onlyTyped, projected })");
  assert.deepEqual(output, [[true], [false]]);
  assert.equal(value.user, value.onlyTyped);
  assert.notEqual(value.user, value.projected);
  assert.equal(
    JSON.stringify(value.projected),
    '{"id":"u1","email":"user@example.com"}',
  );
  assert.ok(JSON.stringify(value.onlyTyped).includes("passwordHash"));
  types(
    source,
    'type A = Expect<Equal<keyof UserUpdate, "email">>; type B = Expect<Equal<PublicUser, UserPreview>>;',
  );
  invalid(source + '\nconst patch: UserUpdate = { id: "changed" };', 2353);
});

test("Utility: patch vuota, zero, undefined e campi extra seguono il contratto", () => {
  const { value: update, output } = run(
    snippet(0, "function updateConfig"),
    "updateConfig",
  );
  assert.deepEqual(output, [[0], [2]]);
  const config = { apiUrl: "/api", timeoutMs: 3000, retries: 2 };
  for (const patch of [{}, { timeoutMs: undefined }, { extra: true }]) {
    const actual = update(config, patch);
    assert.deepEqual({ ...actual }, config);
    assert.notEqual(actual, config);
  }
  assert.equal(update(config, { retries: 0 }).retries, 0);
  assert.equal(update(config, { apiUrl: "" }).apiUrl, "");
  assert.equal(config.retries, 2);
  // This helper is intentionally not a runtime validator for foreign input.
  assert.equal(update(config, { retries: "bad" }).retries, "bad");
});

test("Utility: optional undefined dipende da exactOptionalPropertyTypes", () => {
  const source =
    snippet(0, "function updateConfig") +
    "\nconst patch: Partial<Config> = { timeoutMs: undefined };";
  valid(source);
  invalid(source, 2375, { exactOptionalPropertyTypes: true });
  assert.equal(
    run(source, "({ ...initial, ...patch }).timeoutMs").value,
    undefined,
  );
  assert.equal(
    run(source, "updateConfig(initial, patch).timeoutMs").value,
    3000,
  );
});

test("Utility: readonly e superficiale, required e NonNullable non riempiono dati", () => {
  const source =
    'const source = { items: ["a"] }; const view: Readonly<typeof source> = source; view.items.push("b");';
  assert.equal(
    run(
      source,
      "view === source && view.items.length === 2 && !Object.isFrozen(view)",
    ).value,
    true,
  );
  invalid(source + "\nview.items = [];", 2540);
  invalid("const value: Required<{ id?: string }> = {};", 2741);
  invalid("const value: NonNullable<string | null> = null;", 2322);
  types(
    "",
    'type A = Expect<Equal<Exclude<"a" | "b", "b">, "a">>; type B = Expect<Equal<Extract<string | number, number>, number>>; type C = Expect<Equal<Exclude<{ id: string }, "id">, { id: string }>>;',
  );
});

test("Utility: Record finito e letture assenti", () => {
  invalid('const labels: Record<"it" | "en", string> = { it: "Ciao" };', 2741);
  const source =
    'const labels: Record<string, string> = {}; const missing = labels["unknown"];';
  assert.equal(run(source, "missing").value, undefined);
  types(source, "type A = Expect<Equal<typeof missing, string>>;");
  types(source, "type A = Expect<Equal<typeof missing, string | undefined>>;", {
    noUncheckedIndexedAccess: true,
  });
});

test("Utility: estrazione firme, costruttori e Promise annidate", () => {
  types(
    "declare function parse(value: string): number; declare function parse(value: number): string; class Item { constructor(public id: string) {} }",
    "type A = Expect<Equal<Parameters<typeof parse>, [value: number]>>; type B = Expect<Equal<ReturnType<typeof parse>, string>>; type C = Expect<Equal<ConstructorParameters<typeof Item>, [id: string]>>; type D = Expect<Equal<InstanceType<typeof Item>, Item>>; type E = Expect<Equal<Awaited<Promise<Promise<number>>>, number>>;",
  );
});

test("Utility: NoInfer restringe il fallback ma non conosce contenuto di string[]", () => {
  const source = snippet(0, "function choose");
  assert.deepEqual(run(source).output, [["compact"]]);
  invalid(uncomment(source, 'choose(["compact", "wide"], "unknown");'), 2345);
  valid(
    source +
      '\nconst options: string[] = ["compact"]; choose(options, "missing");',
  );
  const { value: choose } = run(source, "choose");
  assert.throws(() => choose(["compact"], "missing"), hasName("Error"));
  assert.throws(() => choose([], "compact"), hasName("Error"));
});

test("Custom: Nullable conserva modificatori e non attraversa valori annidati", () => {
  const source = snippet(1, "type Nullable<T>");
  types(
    source,
    'type A = Expect<Equal<NullableProfile["nickname"], string | null | undefined>>; const other: NullableProfile = { id: "x", address: null };',
  );
  invalid(source + '\nprofile.id = "x";', 2540);
  invalid(
    source +
      '\nconst bad: NullableProfile = { id: "x", address: { city: null } };',
    2322,
  );
  invalid(source + "\nconst root: NullableProfile = null;", 2322);
});

test("Custom: RequireKeys controlla presenza, non formato o persistenza", () => {
  const source = snippet(1, "function completeDraft");
  const { value: complete, output } = run(source, "completeDraft");
  assert.deepEqual(output, [["u1"]]);
  assert.deepEqual(
    { ...complete({ id: "", email: "not-an-email" }) },
    { id: "", email: "not-an-email" },
  );
  for (const value of [
    {},
    { id: "u1" },
    { id: 1, email: "x" },
    { id: "u1", email: undefined },
  ]) {
    assert.throws(() => complete(value), hasName("Error"));
  }
  invalid(source + '\nconst missing: ReadyUser = { id: "u1" };', 2322);
  invalid(source + '\ntype Bad = RequireKeys<DraftUser, "missing">;', 2344);
});

test("Custom: Required conserva null e dipende da exact per undefined esplicito", () => {
  const source = snippet(1, "function completeDraft");
  valid(
    source +
      '\nconst nullable: RequireKeys<{ id?: string | null }, "id"> = { id: null };',
  );
  const explicit =
    source +
    '\nconst explicit: RequireKeys<{ id?: string | undefined }, "id"> = { id: undefined };';
  invalid(explicit, 2322);
  valid(explicit, { exactOptionalPropertyTypes: true });
  invalid(
    source +
      '\nconst frozen: RequireKeys<{ readonly id?: string }, "id"> = { id: "x" }; frozen.id = "y";',
    2540,
  );
});

test("Custom: Omit distributivo mantiene correlazione e rami", () => {
  const source = snippet(1, "type DistributiveOmit");
  const { value: describe, output } = run(source, "describeJob");
  assert.deepEqual(output, [["user@example.com"]]);
  assert.equal(describe({ kind: "export", format: "csv" }), "csv");
  types(
    source,
    'type A = Expect<Equal<keyof Omit<Job, "id">, "kind">>; type B = Expect<Equal<DistributiveOmit<never, "id">, never>>; type C = Expect<Equal<DistributiveOmit<Job, "absent">, Job>>;',
  );
  invalid(
    source + '\nconst wrong: JobWithoutId = { kind: "email", format: "csv" };',
    2353,
  );
  invalid(source + '\nconst wrong: JobWithoutId = { kind: "email" };', 2322);
  assert.equal(
    run(
      source +
        '\nconst full = { kind: "email" as const, id: "x", recipient: "y" }; const view: JobWithoutId = full;',
      'Object.hasOwn(view, "id")',
    ).value,
    true,
  );
});

test("Brand: parser validano il formato completo, compresi newline finali", () => {
  const { value, output } = run(
    snippet(2, "declare const brand"),
    "({ parseUserId, parseOrderId })",
  );
  assert.deepEqual(output, [["usr_ab12cd34 -> ord_ef56gh78"], ["string"]]);
  for (const [parse, prefix, other] of [
    [value.parseUserId, "usr_", "ord_"],
    [value.parseOrderId, "ord_", "usr_"],
  ]) {
    assert.equal(parse(prefix + "ab12cd34"), prefix + "ab12cd34");
    for (const bad of [
      null,
      undefined,
      1,
      {},
      [],
      "",
      prefix + "ABCDef12",
      prefix + "1234567",
      prefix + "123456789",
      other + "ab12cd34",
      prefix + "ab12cd34\n",
      prefix + "ab12cd34\r",
      prefix + "ab12cd34\u2028",
      " " + prefix + "ab12cd34",
    ]) {
      assert.throws(() => parse(bad), hasName("Error"));
    }
  }
});

test("Brand: tipi distinti, base compatibile, operazioni perdono il brand", () => {
  const source = snippet(2, "declare const brand");
  valid(source + "\nconst text: string = userId;");
  invalid(source + '\nconst value: UserId = "usr_ab12cd34";', 2322);
  invalid(uncomment(source, "describeOrder(orderId, userId);"), 2345);
  invalid(source + '\nconst next: UserId = userId + "x";', 2322);
  valid(source + '\nconst bypass: UserId = "invalid" as UserId;');
});

test("Brand: nessuna proprieta runtime, JSON richiede una nuova verifica", () => {
  const source = snippet(2, "declare const brand");
  assert.equal(
    run(source, "Object.getOwnPropertySymbols(Object(userId)).length").value,
    0,
  );
  assert.throws(
    () => run(source + "\nconsole.log(brand);"),
    hasName("ReferenceError"),
  );
  assert.equal(
    run(
      source +
        "\nconst input: unknown = JSON.parse(JSON.stringify(userId)); const restored = parseUserId(input);",
      "restored",
    ).value,
    "usr_ab12cd34",
  );
  assert.equal(
    run(
      source + '\nconst unchecked: UserId = JSON.parse("123");',
      "typeof unchecked",
    ).value,
    "number",
  );
  invalid(
    source +
      '\nconst input: unknown = JSON.parse("123"); const unchecked: UserId = input;',
    2322,
  );
});

test("Brand: definizioni con simboli indipendenti non coincidono", () => {
  invalid(
    'declare const a: unique symbol; declare const b: unique symbol; type A = string & { [a]: "Id" }; type B = string & { [b]: "Id" }; declare const value: A; const other: B = value;',
    2322,
  );
  valid(
    snippet(2, "readonly __brand") +
      '\ntype Same = string & { readonly __brand: "UserId" }; declare const value: Same; const user: UserId = value;',
  );
});

test("Satisfies: string allargata, method literal ma non readonly", () => {
  const source = snippet(3, "type Route =");
  types(
    source,
    'type A = Expect<Equal<typeof route.path, string>>; type B = Expect<Equal<typeof route.method, "GET">>; route.method = "GET";',
  );
  assert.deepEqual(run(source).output, [["GET"]]);
  invalid(uncomment(source, 'route.method = "POST";'), 2322);
  valid(
    source
      .replace("const route =", "const route: Route =")
      .replace("} satisfies Route;", "};") + '\nroute.method = "POST";',
  );
});

test("Satisfies: flag literal contro stato boolean mutabile", () => {
  const source = snippet(3, "type FeatureName");
  types(
    source,
    "type A = Expect<Equal<ConfiguredFeature, FeatureName>>; type B = Expect<Equal<typeof features.darkMode.enabled, true>>;",
  );
  assert.deepEqual(run(source).output, [[true]]);
  assert.equal(run(source, "mutableFeatures.darkMode.enabled").value, false);
  invalid(uncomment(source, "features.darkMode.enabled = false;"), 2322);
});

test("Satisfies: chiavi finite contro dizionario aperto", () => {
  const source = snippet(3, "type FeatureName");
  invalid(
    source +
      "\nconst typo = { darkMode: { enabled: true }, betaDashbord: { enabled: false } } satisfies FeatureConfig;",
    2561,
  );
  invalid(
    source +
      "\nconst missing = { darkMode: { enabled: true } } satisfies FeatureConfig;",
    1360,
  );
  valid(
    source +
      "\nconst open = { betaDashbord: { enabled: false } } satisfies Record<string, { enabled: boolean }>;",
  );
});

test("Satisfies: forma const readonly, senza freeze", () => {
  const source = snippet(3, "type EndpointConfig");
  types(
    source,
    'type A = Expect<Equal<typeof endpoint.path, "/users">>; type B = Expect<Equal<typeof endpoint.methods, readonly ["GET"]>>;',
  );
  assert.deepEqual(run(source).output, [["GET"]]);
  assert.equal(run(source, "Object.isFrozen(endpoint)").value, false);
  invalid(source + '\nendpoint.path = "/accounts";', 2540);
  invalid(source + '\nendpoint.methods.push("POST");', 2339);
});

test("Satisfies: conserva oggetto e campi extra senza creare optional", () => {
  const source = snippet(3, "type RequestConfig");
  assert.deepEqual(run(source).output, [[true], [true]]);
  invalid(uncomment(source, "checked.retries;"), 2339);
  invalid(
    source +
      '\nconst fresh = { path: "/api", debug: true } satisfies RequestConfig;',
    2353,
  );
  assert.equal(
    run(
      source +
        "\nconst input: any = 123; const bypass = input satisfies RequestConfig;",
      "bypass",
    ).value,
    123,
  );
  invalid(
    source +
      "\nconst input: unknown = 123; const check = input satisfies RequestConfig;",
    1360,
  );
});

test("As const: ruoli precisi e tupla readonly", () => {
  const source = snippet(4, "const roles");
  types(
    source,
    'type A = Expect<Equal<Role, "admin" | "editor" | "viewer">>; type B = Expect<Equal<typeof roles, readonly ["admin", "editor", "viewer"]>>;',
  );
  assert.deepEqual(run(source).output, [["EDITOR"]]);
  invalid(uncomment(source, 'roles.push("owner");'), 2339);
  invalid(uncomment(source, 'labelRole("owner");'), 2345);
});

test("As const: percorsi derivati conservano la chiave specifica", () => {
  const source = snippet(4, "function routePath");
  types(
    source,
    'type A = Expect<Equal<typeof userPath, "/users">>; type B = Expect<Equal<RoutePath, "/" | "/users" | "/settings">>;',
  );
  assert.deepEqual(run(source).output, [["/users"]]);
  invalid(source + '\nroutePath("missing");', 2345);
});

test("As const: riferimenti condivisi restano mutabili", () => {
  const source = snippet(4, "const sharedTags");
  assert.deepEqual(run(source).output, [["draft, ready, published"], [false]]);
  assert.equal(run(source, "config.tags === sharedTags").value, true);
  invalid(uncomment(source, "config.nested.enabled = false;"), 2540);
  invalid(uncomment(source, "config.tags = [];"), 2540);
});

test("As const: parametro readonly e copia mutabile con elementi ristretti", () => {
  const source = snippet(4, "function joinLabels");
  assert.deepEqual(run(source).output, [["small, large"], [3]]);
  invalid(source + '\nmutableCopy.push("other");', 2345);
  invalid(
    source + "\nfunction mutate(values: string[]) {} mutate(labels);",
    2345,
  );
  valid(source + '\nconst wide: string[] = [...labels]; wide.push("other");');
  assert.equal(run(source, "mutableCopy === labels").value, false);
});

test("As const: contesto mutabile adegua la tupla in 5.9.3", () => {
  const source = snippet(4, "const contextual");
  types(
    source,
    'type A = Expect<Equal<typeof contextual, ["small", "large"]>>;',
  );
  assert.deepEqual(run(source).output, [[3]]);
  invalid(uncomment(source, 'contextual.push("other");'), 2345);
  invalid(
    source.replace("satisfies string[]", "satisfies readonly string[]"),
    2339,
  );
});

test("As const: limiti sintattici e differenza const binding/oggetto", () => {
  invalid('const value = ["a"]; const fixed = value as const;', 1355);
  invalid('const fixed = (true ? "on" : "off") as const;', 1355);
  valid('const value = Math.random() ? ("on" as const) : ("off" as const);');
  types(
    'const role = "admin"; const user = { role: "admin" };',
    'type A = Expect<Equal<typeof role, "admin">>; type B = Expect<Equal<typeof user.role, string>>;',
  );
});

test("Const generic: route precise, stessa identita e nessun freeze", () => {
  const source = snippet(5, "function defineRoutes");
  types(
    source,
    'type A = Expect<Equal<RouteName, "home" | "users">>; type B = Expect<Equal<UserPath, "/users">>;',
  );
  assert.deepEqual(run(source).output, [["/users"], [false]]);
  invalid(uncomment(source, 'routes.users = "/accounts";'), 2540);
  const { value: define } = run(source, "defineRoutes");
  const config = { home: "/" };
  assert.equal(define(config), config);
});

test("Const generic: literal nella chiamata produce tupla readonly", () => {
  const source = snippet(5, "const result");
  types(
    source,
    'type A = Expect<Equal<typeof result, readonly ["id", "email"]>>; type B = Expect<Equal<Field, "id" | "email">>;',
  );
  assert.deepEqual(run(source).output, [["id, email"]]);
  invalid(uncomment(source, 'result.push("name");'), 2339);
});

test("Const generic: vincolo mutabile conserva literal ma permette push", () => {
  const source = snippet(5, "function mutable");
  types(
    source,
    'type A = Expect<Equal<typeof editable, ["id", "email"]>>; type B = Expect<Equal<typeof preserved, readonly ["id", "email"]>>;',
  );
  assert.deepEqual(run(source).output, [[3], [2]]);
  invalid(uncomment(source, 'editable.push("name");'), 2345);
});

test("Const generic: variabile allargata, alias ed esplicito non readonly", () => {
  const source = snippet(5, "const fields");
  types(
    source,
    'type A = Expect<Equal<typeof fromVariable, string[]>>; const explicit = tuple<string[]>(["id", "email"]); type B = Expect<Equal<typeof explicit, string[]>>; explicit.push("name");',
  );
  assert.deepEqual(run(source).output, [[true], [3]]);
  types(
    'function identity<T>(value: T): T { return value; } const result = identity("id");',
    'type A = Expect<Equal<typeof result, "id">>;',
  );
});
