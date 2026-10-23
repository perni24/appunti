import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
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
  "Introduzione a TypeScript",
  "Tipi primitivi",
  "Variabili e annotazioni di tipo",
  "Inferenza dei tipi",
  "any, unknown e never",
  "Union e Intersection Types",
  "Type Aliases e Interfaces",
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

function snippet(name, marker) {
  const found = blocks.get(name).filter((source) => source.includes(marker));
  assert.equal(found.length, 1, `${name}: unique marker ${marker}`);
  return found[0];
}

const intro = (marker) => snippet(notes[0], marker);
const primitive = (marker) => snippet(notes[1], marker);
const annotation = (marker) => snippet(notes[2], marker);
const inference = (marker) => snippet(notes[3], marker);
const special = (marker) => snippet(notes[4], marker);
const union = (marker) => snippet(notes[5], marker);
const aliases = (marker) => snippet(notes[6], marker);

test("Toolchain: baseline riproducibile TypeScript 5.9.3", () => {
  assert.equal(
    ts.version,
    "5.9.3",
    "Revalidate expectations before changing the compiler baseline",
  );
});

for (const [name, snippets] of blocks) {
  snippets.forEach((source, index) => {
    if (source.includes("// Da aggiungere al blocco")) return;
    test(`${name}: blocco ${index + 1} compila in strict`, () => {
      valid(source);
    });
  });
}

test("Introduzione: greet restituisce il saluto e rifiuta number", () => {
  const source = intro("function greet(");
  assert.equal(run(source, "message").value, "Ciao Luca");
  invalid(source.replace("// greet(42);", "greet(42);"), 2345);
});

test("Introduzione: il flag booleano non e un'autorizzazione server", () => {
  const source = intro("function shouldShowAdminLink(");
  assert.deepEqual(run(source).output, [[false]]);
  invalid(source.replace("isAdmin: false,", 'isAdmin: "false",'), 2322);
  const { js } = valid(source);
  assert.doesNotMatch(js, /type User|user: User|: boolean/);
});

test("Introduzione: CLI reale, noEmit, .cts/.cjs e artefatto precedente", () => {
  const temp = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(
    path.join(temp, "appunti-typescript-foundations-"),
  );
  try {
    const source = intro("function shouldShowAdminLink(");
    fs.writeFileSync(path.join(root, "demo.cts"), source);
    const shellBlocks = parseNote(
      `Programmazione/TypeScript/Pagine/${notes[0]}.md`,
    ).tree.children.filter(
      (node) => node.type === "code" && node.lang === "sh",
    );
    const commands = shellBlocks
      .map((node) => node.value)
      .filter((command) => command.startsWith("npm exec -- tsc "));
    assert.equal(commands.length, 2);
    const invoke = (command) =>
      spawnSync(
        process.execPath,
        [
          require.resolve("typescript/bin/tsc"),
          ...command.slice("npm exec -- tsc ".length).split(" "),
        ],
        { cwd: root, encoding: "utf8", timeout: 30000 },
      );
    const check = invoke(commands[0]);
    assert.equal(check.status, 0, check.stdout + check.stderr);
    assert.equal(fs.existsSync(path.join(root, "dist")), false);
    const build = invoke(commands[1]);
    assert.equal(build.status, 0, build.stdout + build.stderr);
    const output = path.join(root, "dist", "demo.cjs");
    const before = fs.readFileSync(output, "utf8");
    const execution = spawnSync(process.execPath, [output], {
      cwd: root,
      encoding: "utf8",
      timeout: 10000,
    });
    assert.equal(execution.status, 0, execution.stderr);
    assert.equal(execution.stdout.trim(), "false");
    fs.writeFileSync(
      path.join(root, "demo.cts"),
      source.replace("isAdmin: false,", 'isAdmin: "false",'),
    );
    const failed = invoke(commands[1]);
    assert.notEqual(failed.status, 0);
    assert.match(failed.stdout, /TS2322/);
    assert.equal(fs.readFileSync(output, "utf8"), before);
  } finally {
    const resolved = fs.realpathSync(root);
    assert.equal(path.dirname(resolved), temp);
    assert.ok(
      path.basename(resolved).startsWith("appunti-typescript-foundations-"),
    );
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});

test("Primitive: categorie e typeof null", () => {
  assert.deepEqual(run(primitive("let username:")).output, [
    ["bigint", "object"],
  ]);
  invalid(primitive("let username:") + "\nage = null;", 2322);
  invalid(primitive("let username:") + '\nage = "3";', 2322);
});

test("Primitive: BigInt richiede target e aritmetica compatibili", () => {
  const source = primitive("let username:");
  invalid(source, 2737, { target: ts.ScriptTarget.ES2019 });
  invalid(source + "\nconst mixed = id + 1;", 2365);
  const { value: id } = run(source, "id");
  assert.equal(id, 123n);
  assert.throws(() => JSON.stringify(id), TypeError);
});

test("Primitive: prezzo controllato e descrizione nullish", () => {
  const { value: describeProduct, output } = run(
    primitive("type Product"),
    "describeProduct",
  );
  assert.deepEqual(output, [
    ["Monitor: 19999 centesimi - Nessuna descrizione"],
  ]);
  assert.equal(
    describeProduct({ name: "Demo", priceCents: 0, description: "" }),
    "Demo: 0 centesimi - ",
  );
  for (const priceCents of [
    -1,
    1.5,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
    "2",
  ]) {
    assert.throws(() => describeProduct({ priceCents }), hasName("RangeError"));
  }
});

test("Primitive: optional absent vs undefined con opzione exact", () => {
  const source =
    primitive("type Product") +
    `
const explicit: Product = { ...product, description: undefined };
const absent: Product = { ...product };
`;
  valid(source);
  invalid(source, 2375, { exactOptionalPropertyTypes: true });
  const { value } = run(
    source,
    "[Object.hasOwn(explicit, 'description'), Object.hasOwn(absent, 'description')]",
  );
  assert.deepEqual(Array.from(value), [true, false]);
  invalid(
    primitive("type Product") + "\nproduct.description.toUpperCase();",
    18048,
  );
});

test("Annotazioni: narrowing non cambia il contratto dichiarato", () => {
  const source = annotation("let selectedId:");
  assert.equal(run(source, "selectedId").value, null);
  invalid(source.replace("// selectedId = 12;", "selectedId = 12;"), 2322);
});

test("Annotazioni: totale locale e limiti di dominio", () => {
  const { value: calculateLineTotal, output } = run(
    annotation("type CartLine"),
    "calculateLineTotal",
  );
  assert.deepEqual(output, [[2500]]);
  assert.equal(calculateLineTotal({ unitPriceCents: 0, quantity: 5 }), 0);
  for (const line of [
    { unitPriceCents: -1, quantity: 1 },
    { unitPriceCents: 1, quantity: 0 },
    { unitPriceCents: 1, quantity: 1.5 },
    { unitPriceCents: NaN, quantity: 1 },
    { unitPriceCents: 1, quantity: Infinity },
    { unitPriceCents: Number.MAX_SAFE_INTEGER, quantity: 2 },
  ])
    assert.throws(() => calculateLineTotal(line), hasName("RangeError"));
});

test("Annotazioni: ritorno e inizializzazione sono controllati", () => {
  invalid(
    annotation("type CartLine").replace(
      "return total;",
      "return String(total);",
    ),
    2322,
  );
  const source = annotation("function readUninitialized");
  assert.equal(run(source, "readUninitialized()").value, 10);
  invalid(source.replace("// return result;", "return result;"), 2454);
});

test("Inferenza: literal, widening e readonly statico", () => {
  const source = inference("const port =");
  valid(
    source +
      typeChecks +
      `
type Port = Expect<Equal<typeof port, 3000>>;
type Retries = Expect<Equal<typeof retries, number>>;
type Mode = Expect<Equal<typeof options.mode, string>>;
type Fixed = Expect<Equal<typeof fixed.mode, "dark">>;
`,
  );
  invalid(source + '\nfixed.mode = "light";', 2540);
  const { value: fixed } = run(source, "fixed");
  assert.equal(Object.isFrozen(fixed), false);
  fixed.mode = "light";
  assert.equal(fixed.mode, "light");
});

test("Inferenza: array, callback e ritorno letterale nullable", () => {
  const source = inference("const names =");
  valid(
    source +
      typeChecks +
      `
type Names = Expect<Equal<typeof names, string[]>>;
type Mixed = Expect<Equal<typeof mixed, (number | string)[]>>;
type Lengths = Expect<Equal<typeof lengths, number[]>>;
type Found = Expect<Equal<ReturnType<typeof findName>, "Luca" | undefined>>;
`,
  );
  assert.deepEqual(Array.from(run(source, "lengths").value), [4, 5]);
});

test("Inferenza: array annotato e stato nullable funzionano", () => {
  const source = inference("const users: User[]");
  const { value, output } = run(source, "state.selected");
  assert.deepEqual(output, [[["luca@example.com"]]]);
  assert.deepEqual(structuredClone(value), {
    id: "u_1",
    email: "luca@example.com",
  });
});

test("Inferenza: stato null e proprieta never[] non si allargano automaticamente", () => {
  const source = inference("const bag =");
  invalid(
    source.replace(
      '// state.selected = { id: "u_1", email: "luca@example.com" };',
      'state.selected = { id: "u_1", email: "luca@example.com" };',
    ),
    2322,
  );
  invalid(
    source.replace('// bag.items.push("a");', 'bag.items.push("a");'),
    2345,
  );
});

test("Inferenza: array locale evolutivo e indice non controllato", () => {
  valid("const values = []; values.push('a'); const item: string = values[0];");
  const source =
    inference("const names =") + "\nconst first: string = names[0];";
  valid(source);
  invalid(source, 2322, { noUncheckedIndexedAccess: true });
});

test("any: un errore runtime puo superare il type check", () => {
  const source = special("const unsafe:");
  const unsafe = source.replace(
    "// unsafe.email.toUpperCase();",
    "unsafe.email.toUpperCase();",
  );
  assert.throws(() => run(unsafe), hasName("TypeError"));
  invalid(source.replace("// value.email;", "value.email;"), 18046);
  invalid(source + "\nconst impossible: never = unsafe;", 2322);
});

test("any: noImplicitAny non proibisce quello esplicito o di JSON.parse", () => {
  const source = special("const unsafe:");
  valid(
    source + '\nconst alsoUnsafe = JSON.parse("{}"); alsoUnsafe.missing();',
  );
  invalid("function identity(value) { return value; }", 7006);
});

test("unknown: parser proietta e normalizza un oggetto JSON", () => {
  const { value: parseUser } = run(special("function parseUser("), "parseUser");
  const raw = { email: " luca@example.com ", admin: true };
  assert.deepEqual(structuredClone(parseUser(raw)), {
    email: "luca@example.com",
  });
  assert.equal(raw.email, " luca@example.com ");
  assert.deepEqual(
    structuredClone(parseUser({ email: "not-an-address" })),
    {
      email: "not-an-address",
    },
    "The demo explicitly does not validate email syntax",
  );
});

test("unknown: parser rifiuta assenze, ereditarieta e tipi diversi", () => {
  const { value: parseUser } = run(special("function parseUser("), "parseUser");
  for (const input of [
    null,
    undefined,
    4,
    "text",
    [],
    {},
    { email: "" },
    { email: "  " },
    { email: 12 },
    { email: false },
    Object.create({ email: "x@example.com" }),
    Object.assign([], { email: "x@example.com" }),
  ])
    assert.throws(() => parseUser(input), hasName("TypeError"));
});

test("unknown: JSON sintatticamente errato precede il parser", () => {
  const source = special("function parseUser(").replace(
    'JSON.parse(\'{"email":" luca@example.com ","admin":true}\')',
    'JSON.parse("{")',
  );
  assert.throws(() => run(source), hasName("SyntaxError"));
});

test("catch: risultato normale, sintassi errata e valore lanciato non Error", () => {
  const source = special("function parseJsonMessage(");
  const { value: parseJsonMessage } = run(source, "parseJsonMessage");
  assert.equal(parseJsonMessage("{}"), "JSON valido");
  assert.notEqual(parseJsonMessage("{"), "JSON valido");
  const fallback = run(source, 'parseJsonMessage("{}")', {
    JSON: {
      parse() {
        throw "not-an-error";
      },
    },
  });
  assert.equal(fallback.value, "Errore non standard");
  invalid(
    source.replace(
      'return error instanceof Error ? error.message : "Errore non standard";',
      "return error.message;",
    ),
    18046,
  );
});

test("never: switch esaustivo e nuova variante rifiutata", () => {
  const source = special("type Mode =");
  const { value: modeLabel } = run(source, "modeLabel");
  assert.equal(modeLabel("view"), "Visualizza");
  assert.equal(modeLabel("edit"), "Modifica");
  assert.throws(() => modeLabel("preview"), hasName("Error"));
  invalid(
    source.replace(
      'type Mode = "view" | "edit";',
      'type Mode = "view" | "edit" | "preview";',
    ),
    2345,
  );
});

test("Union: risultati locali e combinazione incoerente", () => {
  const source = union("type Result =");
  assert.deepEqual(run(source).output, [
    ["File letto"],
    ["Errore: File assente"],
  ]);
  invalid(
    source.replace(
      '// read({ ok: true, error: "File assente" });',
      'read({ ok: true, error: "File assente" });',
    ),
    2353,
  );
});

test("Union: non esclusiva, intersection impossibile e compatibile", () => {
  valid(
    'const both: { id: string } | { email: string } = { id: "u_1", email: "x" };',
  );
  const source = union("type ImpossibleValue =");
  valid(
    source +
      typeChecks +
      `
type Impossible = Expect<Equal<ImpossibleValue, never>>;
type Conflict = Expect<Equal<Conflicting["id"], never>>;
`,
  );
  invalid(
    source.replace(
      '// const item: Conflicting = { id: "u_1" };',
      'const item: Conflicting = { id: "u_1" };',
    ),
    2322,
  );
  assert.deepEqual(structuredClone(run(source, "user").value), {
    name: "Luca",
    id: "u_1",
  });
});

test("Alias e interface: esempio generico completo", () => {
  const source =
    aliases("type ApiResult<T>") + "\n" + aliases("// Da aggiungere al blocco");
  assert.deepEqual(run(source).output, [
    ["luca@example.com"],
    ["Non disponibile"],
  ]);
});

test("Alias e interface: annotazione non filtra campi, proiezione si", () => {
  const source = aliases("interface PublicUser");
  assert.deepEqual(run(source).output, [[["id", "internalNote"]], [["id"]]]);
  assert.equal(run(source, "publicUser === internalUser").value, true);
  invalid(
    source.replace(
      '// const direct: PublicUser = { id: "u_1", internalNote: "extra" };',
      'const direct: PublicUser = { id: "u_1", internalNote: "extra" };',
    ),
    2353,
  );
});

test("Alias e interface: merging richiede tutti i membri compatibili", () => {
  const source = aliases("interface Settings");
  invalid(
    source.replace('{ theme: "dark", locale: "it" }', '{ theme: "dark" }'),
    2741,
  );
  invalid(source + "\ninterface Settings { theme: number; }", 2717);
  invalid(source + "\ninterface WrongUser extends User { id: number; }", 2430);
});

test("Alias e interface: alias nominali assenti e nessun valore runtime", () => {
  const source = aliases("type UserId =");
  valid(
    source +
      '\ntype OrderId = string; const order: OrderId = "o_1"; const userId: UserId = order;',
  );
  invalid(source + "\nconst ctor = User;", 2693);
  invalid(source + "\ntype UserId = number;", 2300);
});
