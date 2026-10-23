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
  typeChecks,
  hasName,
} from "./typescript-examples.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const toolsDir = process.env.TYPESCRIPT_VALIDATION_TOOLS_DIR;
assert.ok(
  toolsDir,
  "Impostare TYPESCRIPT_VALIDATION_TOOLS_DIR: vedere README.",
);
const externalRequire = createRequire(
  path.join(path.resolve(toolsDir), "package.json"),
);
const zodRoot = path.dirname(externalRequire.resolve("zod/package.json"));
const options = { paths: { zod: [path.join(zodRoot, "index.d.cts")] } };
const names = [
  "Validazione runtime e tipi statici",
  "Schema validation con Zod",
  "Type guards runtime",
  "Parsing sicuro di input esterni",
  "API contract",
];
const notes = names.map((name) =>
  parseNote("Programmazione/TypeScript/Pagine/" + name + ".md"),
);
const blocks = (i, lang = "ts") =>
  notes[i].tree.children
    .filter((n) => n.type === "code" && n.lang === lang)
    .map((n) => n.value);
const code = (i, j = 0) => blocks(i)[j];
const portSource = blocks(3).join("\n");
const contractSource = blocks(4).join("\n");
function run(source, expression = "undefined") {
  // Compile the probe too, so imports and exported bindings use emitted names.
  const { js } = valid(
    source + "\nconst __noteProbeResult = (" + expression + ");",
    options,
  );
  const output = [];
  const context = vm.createContext({
    exports: {},
    require: externalRequire,
    console: { log: (...args) => output.push(structuredClone(args)) },
  });
  const value = vm.runInContext(js + "\n;__noteProbeResult", context, {
    timeout: 2000,
  });
  return { value, output };
}
const clone = (value) => structuredClone(value);
const zRun = (source, expression) =>
  run('import {z} from "zod";\n' + source, expression);
function ok(result, expected) {
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  if (expected !== undefined)
    assert.equal(result.stdout.trim().replaceAll("\r\n", "\n"), expected);
}

// CLI projects and copied dependencies live only under a verified temp root.
function fixture(action) {
  const temp = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(
    path.join(temp, "appunti-typescript-validation-"),
  );
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
  const node = (args) =>
    spawnSync(process.execPath, args, {
      cwd: root,
      encoding: "utf8",
      timeout: 30000,
      env: { ...process.env, NODE_OPTIONS: "" },
    });
  try {
    fs.mkdirSync(locate("node_modules"), { recursive: true });
    fs.cpSync(zodRoot, locate("node_modules/zod"), { recursive: true });
    action({
      put,
      node,
      tsc: (...args) =>
        node([
          require.resolve("typescript/bin/tsc"),
          ...args,
          "--pretty",
          "false",
        ]),
    });
  } finally {
    const resolved = fs.realpathSync(root);
    assert.equal(path.dirname(resolved), temp);
    assert.ok(
      path.basename(resolved).startsWith("appunti-typescript-validation-"),
    );
    fs.rmSync(resolved, { recursive: true, force: true });
  }
}

test("Validazione: baseline TypeScript, Node e Zod fissate", () => {
  assert.equal(ts.version, "5.9.3");
  assert.equal(process.versions.node, "24.14.0");
  assert.equal(externalRequire("zod/package.json").version, "4.6.7");
});
for (let i = 0; i < names.length; i++)
  test(names[i] + ": metadati, fonti e comandi separati", () => {
    assert.equal(notes[i].data.status, "non revisionato");
    assert.equal(notes[i].data.publish, true);
    assert.match(notes[i].body, /## Fonti/);
    assert.match(notes[i].body, /5\.9\.3/);
    for (const command of blocks(i, "sh"))
      assert.equal(command.split("\n").length, 1);
  });
const programs = [
  ...[0, 1, 2].flatMap((i) =>
    blocks(i).map((source, j) => [names[i] + " #" + (j + 1), source]),
  ),
  ["Parser completo", portSource],
  ["Contratto completo", contractSource],
];
for (const [label, source] of programs)
  test(label + ": snippet compila in strict", () => valid(source, options));

test("Runtime: assertion non converte il dato e chiamare il metodo puo fallire", () => {
  assert.deepEqual(run(code(0)).output, [["number"]]);
  assert.throws(
    () => run(code(0) + "\nclaimed.id.toUpperCase();"),
    hasName("TypeError"),
  );
});
test("Runtime: parser proietta i campi e non altera l'input", () => {
  const { value, output } = run(code(0, 1), "({user,raw})");
  assert.deepEqual(output, [["u1"], [["id", "email"]], [false]]);
  assert.deepEqual(clone(value.user), { id: "u1", email: "user@example.test" });
  assert.equal(value.raw.internalToken, "demo");
});
test("Runtime: tipi, null, campi mancanti, ereditarieta e array", () => {
  const parse = run(code(0, 1), "parseUserSummary").value;
  for (const input of [
    null,
    [],
    42,
    "x",
    {},
    { id: 1, email: "x" },
    { id: "u1" },
    { id: "u1", email: null },
    Object.create({ id: "u1", email: "x" }),
  ])
    assert.throws(() => parse(input), hasName("TypeError"));
  const record = Object.assign(Object.create(null), { id: "u1", email: "x" });
  assert.deepEqual(clone(parse(record)), { id: "u1", email: "x" });
});
test("Runtime: forma valida non significa email valida o risultato immutabile", () => {
  const parse = run(code(0, 1), "parseUserSummary").value;
  const user = parse({ id: "", email: "not-email" });
  assert.deepEqual(clone(user), { id: "", email: "not-email" });
  user.id = "changed";
  assert.equal(user.id, "changed");
});
test("Runtime: unknown impedisce accessi e i getter possono propagare errori", () => {
  invalid("declare const input: unknown; console.log(input.email);", 18046);
  const parse = run(code(0, 1), "parseUserSummary").value;
  const bad = {
    get id() {
      throw new Error("getter failed");
    },
    email: "x",
  };
  assert.throws(() => parse(bad), /getter failed/);
});

test("Zod: output normalizzato, default e input lasciato intatto", () => {
  const { value, output } = run(code(1), "({raw,result,CreateItemSchema})");
  assert.deepEqual(output, [["Notebook", 1]]);
  assert.deepEqual(clone(value.raw), { name: "  Notebook  " });
  assert.deepEqual(clone(value.result.data), { name: "Notebook", quantity: 1 });
  assert.notEqual(value.result.data, value.raw);
});
test("Zod: rifiuta extra, stringhe numeriche, null e vincoli violati", () => {
  const schema = run(code(1), "CreateItemSchema").value;
  for (const input of [
    null,
    [],
    {},
    { name: " " },
    { name: "x".repeat(81) },
    { name: "x", quantity: "2" },
    { name: "x", quantity: null },
    { name: "x", quantity: 0 },
    { name: "x", quantity: 101 },
    { name: "x", quantity: 1.5 },
    { name: "x", quantity: NaN },
    { name: "x", quantity: Infinity },
    { name: "x", contactEmail: "invalid" },
    { name: "x", admin: true },
  ])
    assert.equal(schema.safeParse(input).success, false);
  assert.equal(
    schema.safeParse({
      name: "x",
      quantity: 100,
      contactEmail: "user@example.test",
    }).success,
    true,
  );
});
test("Zod: parse lancia ZodError, safeParse espone path e code", () => {
  const schema = run(code(1), "CreateItemSchema").value;
  const bad = { name: "x", quantity: "2" };
  assert.throws(() => schema.parse(bad), externalRequire("zod").z.ZodError);
  const result = schema.safeParse(bad);
  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["quantity"]);
  assert.equal(result.error.issues[0].code, "invalid_type");
});
test("Zod: input/output diversi e quantity obbligatoria dopo parsing", () => {
  valid(
    code(1) +
      "\n" +
      typeChecks +
      `
type InputQuantity = Expect<Equal<CreateItemInput["quantity"], number | undefined>>;
type OutputQuantity = Expect<Equal<CreateItem["quantity"], number>>;
type Inferred = Expect<Equal<z.infer<typeof CreateItemSchema>, CreateItem>>;
const input: CreateItemInput = {name:"x"};
`,
    options,
  );
  invalid(code(1) + '\nconst bad: CreateItem = {name:"x"};', 2741, options);
});
test("Zod: trasformazione stringa-numero e lunghezza UTF-16", () => {
  const { output, value } = run(code(1, 1), "LengthSchema");
  assert.deepEqual(output, [[4]]);
  assert.equal(value.parse("\u{1F600}"), 2);
  valid(
    code(1, 1) +
      "\n" +
      typeChecks +
      `
type Input = Expect<Equal<LengthInput, string>>;
type Output = Expect<Equal<LengthOutput, number>>;
`,
    options,
  );
});
test("Zod: coercion non equivale a un parser di configurazione restrittivo", () => {
  assert.deepEqual(run(code(1, 2)).output, [[0], [1], [true]]);
  const z = externalRequire("zod").z;
  assert.equal(z.coerce.number().parse(null), 0);
  assert.equal(z.coerce.number().parse([8080]), 8080);
});
test("Zod: object elimina extra, strict li rifiuta, loose li conserva", () => {
  const value = zRun(
    `
const input = {name:"x", extra:42};
const shape = {name:z.string()};
`,
    "({input, clean:z.object(shape).parse(input), strict:z.strictObject(shape).safeParse(input), loose:z.looseObject(shape).parse(input)})",
  ).value;
  assert.deepEqual(clone(value.clean), { name: "x" });
  assert.deepEqual(clone(value.loose), { name: "x", extra: 42 });
  assert.equal(value.strict.success, false);
  assert.equal(value.input.extra, 42);
});
test("Zod: optional, nullable, default e prefault non sono equivalenti", () => {
  const value = zRun(
    `
const text = z.string().trim().toUpperCase();
`,
    `({
  optional:z.string().optional().safeParse(null).success,
  nullable:z.string().nullable().safeParse(undefined).success,
  nullish:z.string().nullish().safeParse(null).success,
  default:text.default("  demo  ").parse(undefined),
  prefault:text.prefault("  demo  ").parse(undefined),
  fallback:z.number().catch(42).parse("bad")
})`,
  ).value;
  assert.deepEqual(clone(value), {
    optional: false,
    nullable: false,
    nullish: true,
    default: "  demo  ",
    prefault: "DEMO",
    fallback: 42,
  });
});
test("Zod: safeParse non cattura un throw nel refinement", () => {
  assert.throws(
    () =>
      zRun(`
const schema = z.string().refine(() => { throw new Error("callback failed"); });
schema.safeParse("x");
`),
    /callback failed/,
  );
});
test("Zod: refinement async richiede metodo async", async () => {
  // Zod and its async callback must use the same Promise realm as the Node demo.
  const z = externalRequire("zod").z;
  const schema = z.string().refine(async (text) => text === "ready");
  assert.throws(() => schema.safeParse("ready"), /Promise|async|synchronous/i);
  assert.equal((await schema.safeParseAsync("ready")).success, true);
  assert.equal((await schema.safeParseAsync("no")).success, false);
  assert.equal(await schema.parseAsync("ready"), "ready");
});
test("Zod: JSON Schema copre forme JSON ma non Date arbitrari", () => {
  const value = zRun(
    "const schema = z.object({name:z.string()});",
    "z.toJSONSchema(schema)",
  ).value;
  assert.equal(value.type, "object");
  assert.equal(value.properties.name.type, "string");
  assert.throws(
    () => zRun("z.toJSONSchema(z.date());"),
    /Date|date|represent/i,
  );
});

test("Guard: stringa vuota conservata e filtro staticamente string[]", () => {
  assert.deepEqual(run(code(2)).output, [[["ready", ""]]]);
  valid(code(2) + "\nconst result: string[] = values.filter(isString);");
});
test("Guard: forma minima distinta da prezzo finito e non negativo", () => {
  const { value, output } = run(code(2, 1), "({isProduct,isSellable})");
  assert.deepEqual(output, [["p1", true], [true], [false]]);
  for (const price of [NaN, Infinity, -1]) {
    const product = { id: "p1", price };
    assert.equal(value.isProduct(product), true);
    assert.equal(value.isSellable(product), false);
  }
  for (const input of [
    null,
    [],
    {},
    { id: 42, price: 1 },
    { id: "p1", price: "1" },
  ])
    assert.equal(value.isProduct(input), false);
});
test("Guard: ereditarieta, extra e identita non sono eliminati", () => {
  const guard = run(code(2, 1), "isProduct").value;
  assert.equal(guard(Object.create({ id: "p1", price: 1 })), true);
  const item = { id: "p1", price: 0, extra: true };
  const selected = [item].filter(guard);
  assert.equal(selected[0], item);
  assert.equal(selected[0].extra, true);
  item.price = -1;
  assert.equal(selected[0].price, -1);
});
test("Guard: criterio booleano non esclude Product dal ramo falso", () => {
  valid(
    code(2, 1) +
      `
function describe(product: Product) {
  if (isSellable(product)) return product.id;
  return product.price.toFixed(2);
}
`,
  );
});
test("Guard: every su array sparso non verifica i buchi", () => {
  const guard = run(code(2, 1), "isProduct").value;
  const sparse = new Array(2);
  assert.equal(sparse.every(guard), true);
  assert.equal(sparse[0], undefined);
  assert.equal([null].every(guard), false);
});

test("Porta: esempi e limiti accettati", () => {
  const { value: parse, output } = run(portSource, "parsePort");
  assert.deepEqual(output, [[true], [false], [false], [8080]]);
  for (const value of [1, 65535, 8080, "1", "65535", "8080", 1e3])
    assert.deepEqual(clone(parse(value)), { ok: true, value: Number(value) });
});
test("Porta: conversioni indesiderate e formati non canonici rifiutati", () => {
  const parse = run(portSource, "parsePort").value;
  for (const value of [
    "",
    " ",
    " 80",
    "80 ",
    "080",
    "+80",
    "-1",
    "1e3",
    "0x50",
    "80.0",
    "80abc",
    "80\n",
    "80\r\n",
    "\u0668\u0660",
    "123456",
  ])
    assert.equal(parse(value).error.code, "format", JSON.stringify(value));
  for (const value of [
    0,
    -0,
    -1,
    65536,
    1.5,
    Infinity,
    -Infinity,
    NaN,
    Number.MAX_SAFE_INTEGER,
  ])
    assert.equal(parse(value).error.code, "range", String(value));
});
test("Porta: oggetti e simboli rifiutati senza conversioni con effetti collaterali", () => {
  const parse = run(portSource, "parsePort").value;
  let reads = 0;
  const bad = {
    valueOf() {
      reads++;
      throw new Error("unexpected");
    },
    toString() {
      reads++;
      throw new Error("unexpected");
    },
  };
  for (const value of [
    true,
    false,
    null,
    undefined,
    [],
    [8080],
    {},
    bad,
    Symbol("x"),
    80n,
  ])
    assert.equal(parse(value).error.code, "type");
  assert.equal(reads, 0);
});
test("Documento: errori sintattici, di forma e di valore separati", () => {
  const parse = run(portSource, "parsePortDocument").value;
  assert.equal(parse(42).error.code, "type");
  assert.equal(parse("{").error.code, "json");
  for (const input of ["null", "[]", "42", "{}", '"x"'])
    assert.equal(parse(input).error.code, "shape");
  assert.equal(parse('{"port":true}').error.code, "type");
  assert.equal(parse('{"port":1.5}').error.code, "range");
  assert.equal(parse('{"port":"08"}').error.code, "format");
});
test("Documento: limite, campi extra e duplicati hanno politica esplicita", () => {
  const parse = run(portSource, "parsePortDocument").value;
  assert.deepEqual(clone(parse('{"port":80,"other":"ignored"}')), {
    ok: true,
    value: 80,
  });
  assert.deepEqual(clone(parse('{"port":80,"port":81}')), {
    ok: true,
    value: 81,
  });
  const exact = '{"port":80}'.padEnd(128, " ");
  assert.equal(parse(exact).ok, true);
  assert.equal(parse(exact + " ").error.code, "size");
  assert.equal(parse('{"__proto__":{"port":80}}').error.code, "shape");
});
test("Porta: errori non includono payload e alias non impone vincoli statici", () => {
  const parse = run(portSource, "parsePort").value;
  assert.doesNotMatch(
    JSON.stringify(parse("private-secret")),
    /private-secret/,
  );
  valid(portSource + "\nconst notValidated: Port = -1;");
  invalid(
    portSource +
      '\nconst unchecked = parsePort("80"); console.log(unchecked.value);',
    2339,
  );
});

test("Contratto: demo, proiezione e mancata mutazione del payload", () => {
  const { value: decode, output } = run(contractSource, "decodeGetUser");
  assert.deepEqual(output, [["u1"], [["id", "email"]], ["not_found"]]);
  const payload = {
    id: "u1",
    email: "user@example.test",
    internalToken: "secret",
  };
  assert.deepEqual(clone(decode(200, payload)), {
    ok: true,
    data: { id: "u1", email: "user@example.test" },
  });
  assert.equal(payload.internalToken, "secret");
});
test("Contratto: body errato e 404 malformato non diventano successi", () => {
  const decode = run(contractSource, "decodeGetUser").value;
  for (const value of [
    null,
    [],
    {},
    { id: "", email: "user@example.test" },
    { id: "u1", email: "bad" },
  ])
    assert.equal(decode(200, value).error.kind, "invalid_response");
  assert.equal(
    decode(404, { code: "OTHER", message: "x" }).error.kind,
    "invalid_response",
  );
  assert.equal(
    decode(404, { code: "NOT_FOUND", message: "" }).error.kind,
    "invalid_response",
  );
});
test("Contratto: status, messaggi remoti e nuovi campi", () => {
  const decode = run(contractSource, "decodeGetUser").value;
  for (const status of [201, 204, 401, 403, 500])
    assert.deepEqual(
      clone(decode(status, { id: "u1", email: "user@example.test" })),
      { ok: false, error: { kind: "unexpected_status", status } },
    );
  const result = decode(404, {
    code: "NOT_FOUND",
    message: "<script>secret</script>",
    future: 1,
  });
  assert.deepEqual(clone(result), { ok: false, error: { kind: "not_found" } });
  assert.doesNotMatch(JSON.stringify(result), /secret|script/);
});
test("Contratto: discriminanti e input/output verificati dal checker", () => {
  invalid(
    contractSource + "\nconst r = decodeGetUser(200, {}); console.log(r.data);",
    2339,
    options,
  );
  valid(
    contractSource +
      `
function idOrError(result: GetUserResult): string {
  return result.ok ? result.data.id : result.error.kind;
}
`,
    options,
  );
});
test("CLI: progetto Zod e decoder API compilano ed eseguono in ESM", () => {
  fixture((p) => {
    p.put("package.json", JSON.parse(blocks(1, "json")[0]));
    p.put("tsconfig.json", JSON.parse(blocks(1, "json")[1]));
    p.put("src/main.ts", code(1));
    p.put("src/length.ts", code(1, 1));
    p.put("src/coercion.ts", code(1, 2));
    p.put("src/contract.ts", contractSource);
    ok(p.tsc("-p", "tsconfig.json"));
    ok(p.node(["dist/main.js"]), "Notebook 1");
    ok(p.node(["dist/length.js"]), "4");
    ok(p.node(["dist/coercion.js"]), "0\n1\ntrue");
    ok(p.node(["dist/contract.js"]), "u1\n[ 'id', 'email' ]\nnot_found");
  });
});
