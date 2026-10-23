import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";
import { ts, typeChecks } from "./typescript-examples.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const toolsDir = process.env.TYPESCRIPT_INTEROP_TOOLS_DIR;
assert.ok(toolsDir, "Impostare TYPESCRIPT_INTEROP_TOOLS_DIR: vedere README.");
const externalRequire = createRequire(
  path.join(path.resolve(toolsDir), "package.json"),
);
const generatorPackage = JSON.parse(
  fs.readFileSync(
    path.join(toolsDir, "node_modules/openapi-typescript/package.json"),
    "utf8",
  ),
);
const generatorCli = path.join(
  toolsDir,
  "node_modules/openapi-typescript",
  generatorPackage.bin["openapi-typescript"],
);
const names = [
  "Migrazione da JavaScript a TypeScript",
  "Typing di librerie JavaScript",
  "JSDoc e type checking in JavaScript",
  "Dichiarazioni e file d.ts",
  "DefinitelyTyped",
  "Generazione di tipi da API",
];
const notes = names.map((name) =>
  parseNote("Programmazione/TypeScript/Pagine/" + name + ".md"),
);
const blocks = (index, lang) =>
  notes[index].tree.children
    .filter((n) => n.type === "code" && n.lang === lang)
    .map((n) => n.value);
const code = (index, position = 0, lang = "ts") =>
  blocks(index, lang)[position];
const json = (index, position = 0) => JSON.parse(code(index, position, "json"));

// Only generated files inside this verified temporary root can be removed.
function fixture(files, action) {
  const temp = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(temp, "appunti-typescript-interop-"));
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
  const copyPackage = (name) => {
    const source = path.dirname(
      externalRequire.resolve(name + "/package.json"),
    );
    const target = locate("node_modules/" + name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.cpSync(source, target, { recursive: true });
  };
  try {
    for (const [name, value] of Object.entries(files)) put(name, value);
    return action({
      put,
      node,
      copyPackage,
      tsc: (...args) =>
        node([
          require.resolve("typescript/bin/tsc"),
          ...args,
          "--pretty",
          "false",
        ]),
      generate: (...args) =>
        node([
          generatorCli,
          "openapi.yaml",
          "-o",
          "src/generated/api-types.d.ts",
          ...args,
        ]),
      read: (name) => fs.readFileSync(locate(name), "utf8"),
      exists: (name) => fs.existsSync(locate(name)),
      remove: (name) => fs.rmSync(locate(name), { recursive: true }),
    });
  } finally {
    const resolved = fs.realpathSync(root);
    assert.equal(path.dirname(resolved), temp);
    assert.ok(
      path.basename(resolved).startsWith("appunti-typescript-interop-"),
    );
    fs.rmSync(resolved, { recursive: true, force: true });
  }
}
function ok(result, output) {
  assert.equal(result.status, 0, result.stdout + result.stderr);
  if (output !== undefined)
    assert.equal(result.stdout.trim().replaceAll("\r\n", "\n"), output);
}
function diagnostic(result, number) {
  assert.notEqual(result.status, 0);
  assert.match(
    result.stdout + result.stderr,
    new RegExp("TS" + number + "\\b"),
  );
}
function runtimeError(result, message) {
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, message);
}
const migrateProject = () => ({
  "package.json": json(0),
  "tsconfig.json": json(0, 1),
  "tsconfig.build.json": json(0, 2),
  "src/user.js": code(0, 0, "js"),
  "src/main.js": code(0, 1, "js"),
});
function migrate(p) {
  p.remove("src/user.js");
  p.put("src/user.ts", code(0));
}
const codecProject = () => ({
  "tsconfig.json": json(1),
  "legacy-codec/index.cjs": code(1, 0, "js"),
  "legacy-codec/index.d.cts": code(1),
  "src/main.cts": code(1, 1),
});
const jsdocProject = () => ({
  "package.json": json(2),
  "tsconfig.json": json(2, 1),
  "src/user.js": code(2, 0, "js"),
  "src/first.js": code(2, 1, "js"),
  "src/config.js": code(2, 2, "js"),
  "src/imported.js": code(2, 3, "js"),
  "src/types.d.ts": code(2),
});
const declarationProject = () => ({
  "package.json": json(3),
  "tsconfig.json": json(3, 1),
  "tsconfig.types.json": json(3, 2),
  "src/index.ts": code(3),
  "src/globals.d.ts": code(3, 2),
  "consumer.mjs": code(3, 0, "js"),
});
function consumerConfig(p) {
  p.put(
    "consumer.ts",
    'import { label } from "note-labels";\nconsole.log(label("book"));',
  );
  p.put("tsconfig.consumer.json", {
    compilerOptions: {
      target: "ES2022",
      module: "NodeNext",
      strict: true,
      noEmit: true,
      types: [],
    },
    files: ["consumer.ts"],
  });
}
const lodashProject = () => ({
  "tsconfig.json": json(4),
  "src/main.cts": code(4),
});
const apiProject = () => ({
  "package.json": { private: true, type: "module" },
  "tsconfig.json": json(5),
  "openapi.yaml": code(5, 0, "yaml"),
  "src/client.ts": code(5),
});
const apiRunner = String.raw`
import assert from "node:assert/strict";
import { parseUser, getUser } from "./dist/client.js";
`;

test("Interoperabilita: baseline reali e versioni fissate", () => {
  assert.equal(ts.version, "5.9.3");
  assert.equal(process.versions.node, "24.14.0");
  assert.equal(generatorPackage.version, "7.13.0");
  assert.equal(externalRequire("lodash/package.json").version, "4.18.1");
  assert.equal(
    externalRequire("@types/lodash/package.json").version,
    "4.17.27",
  );
});
for (let i = 0; i < names.length; i++)
  test(names[i] + ": metadati, fonti e comandi indipendenti", () => {
    assert.equal(notes[i].data.status, "non revisionato");
    assert.equal(notes[i].data.publish, true);
    assert.match(notes[i].body, /## Fonti/);
    assert.match(notes[i].body, /5\.9\.3/);
    for (const command of blocks(i, "sh"))
      assert.equal(command.split("\n").length, 1);
  });

test("Migrazione: check senza emissione e stesso output dopo conversione", () => {
  fixture(migrateProject(), (p) => {
    ok(p.tsc("-p", "tsconfig.json"));
    assert.equal(p.exists("dist"), false);
    ok(p.node(["src/main.js"]), "user@example.test (u1)");
    assert.equal(p.read("src/user.js"), code(0, 0, "js"));
    migrate(p);
    ok(p.tsc("-p", "tsconfig.build.json"));
    ok(p.node(["dist/main.js"]), "user@example.test (u1)");
    assert.equal(p.exists("dist/user.js"), true);
  });
});
test("Migrazione: consumer controllato non rende sicuro un parametro any legacy", () => {
  fixture(migrateProject(), (p) => {
    p.put("src/main.js", code(0, 1, "js").replace('id: "u1"', "id: 42"));
    ok(p.tsc("-p", "tsconfig.json"));
    migrate(p);
    diagnostic(p.tsc("-p", "tsconfig.json"), 2322);
  });
});
test("Migrazione: checkJs e ts-check attivano il controllo del file incluso", () => {
  fixture(migrateProject(), (p) => {
    diagnostic(p.tsc("-p", "tsconfig.json", "--checkJs"), 7006);
    p.put("src/user.js", "// @ts-check\n" + code(0, 0, "js"));
    diagnostic(p.tsc("-p", "tsconfig.json"), 7006);
    p.put("src/user.js", "// @ts-nocheck\n" + code(0, 0, "js"));
    ok(p.tsc("-p", "tsconfig.json", "--checkJs"));
  });
});
test("Migrazione: noEmitOnError impedisce nuove emissioni ma conserva artefatti vecchi", () => {
  fixture(migrateProject(), (p) => {
    migrate(p);
    ok(p.tsc("-p", "tsconfig.build.json"));
    const old = p.read("dist/main.js");
    p.put("src/main.js", code(0, 1, "js").replace('id: "u1"', "id: 42"));
    diagnostic(p.tsc("-p", "tsconfig.build.json"), 2322);
    assert.equal(p.read("dist/main.js"), old);
  });
});

test("Typing: modulo CommonJS locale e dichiarazione d.cts coerenti", () => {
  fixture(codecProject(), (p) => {
    ok(p.tsc("-p", "tsconfig.json"));
    ok(p.node(["dist/main.cjs"]), 'u1\n{"id":"u1"}');
    assert.equal(p.exists("dist/legacy-codec"), false);
  });
});
test("Typing: unknown richiede controllo e input della libreria resta stringa", () => {
  fixture(codecProject(), (p) => {
    p.put("src/main.cts", code(1, 1) + "\ncodec.parse(42);");
    diagnostic(p.tsc("-p", "tsconfig.json"), 2345);
    p.put(
      "src/main.cts",
      'import codec = require("../legacy-codec/index.cjs");\nconsole.log(codec.parse("{}").id);',
    );
    diagnostic(p.tsc("-p", "tsconfig.json"), 2571);
  });
});
test("Typing: una dichiarazione falsa puo compilare e fallire a runtime", () => {
  fixture(codecProject(), (p) => {
    p.put(
      "legacy-codec/index.d.cts",
      code(1).replace("): unknown", "): string"),
    );
    p.put(
      "src/main.cts",
      'import codec = require("../legacy-codec/index.cjs");\nconsole.log(codec.parse("{}").toUpperCase());',
    );
    ok(p.tsc("-p", "tsconfig.json"));
    runtimeError(p.node(["dist/main.cjs"]), /toUpperCase is not a function/);
    p.remove("legacy-codec/index.cjs");
    ok(p.tsc("-p", "tsconfig.json"));
    runtimeError(p.node(["dist/main.cjs"]), /MODULE_NOT_FOUND/);
  });
});
test("Typing: JSON puo restituire undefined o lanciare errori non espressi nella firma", () => {
  fixture(codecProject(), (p) => {
    p.put(
      "probe.cjs",
      String.raw`
const assert = require("node:assert/strict");
const codec = require("./legacy-codec/index.cjs");
assert.equal(codec.format(undefined), undefined);
assert.equal(codec.parse("null"), null);
assert.throws(() => codec.parse("{"), SyntaxError);
assert.throws(() => codec.format(1n), TypeError);
const cyclic = {}; cyclic.self = cyclic;
assert.throws(() => codec.format(cyclic), TypeError);
`,
    );
    ok(p.node(["probe.cjs"]));
  });
});

test("JSDoc: tutti gli esempi sono JavaScript eseguibile senza types.js", () => {
  fixture(jsdocProject(), (p) => {
    ok(p.tsc("-p", "tsconfig.json"));
    ok(p.node(["src/user.js"]), "user@example.test (u1)");
    ok(p.node(["src/first.js"]), "ready\nundefined");
    ok(p.node(["src/config.js"]), "0 write");
    ok(p.node(["src/imported.js"]), "u1:user@example.test");
    assert.equal(p.exists("src/types.js"), false);
  });
});
test("JSDoc: argomenti e proprieta controllati anche in file js", () => {
  fixture(jsdocProject(), (p) => {
    p.put("src/user.js", code(2, 0, "js") + '\nformatUser({id:42,email:"x"});');
    diagnostic(p.tsc("-p", "tsconfig.json"), 2322);
    p.put("src/user.js", code(2, 0, "js"));
    p.put("src/imported.js", code(2, 3, "js") + '\ndescribeUser({id:"u1"});');
    diagnostic(p.tsc("-p", "tsconfig.json"), 2345);
  });
});
test("JSDoc: satisfies conserva il literal mentre type consente stato mutabile", () => {
  fixture(jsdocProject(), (p) => {
    p.put("src/config.js", code(2, 2, "js") + '\nconfig.mode = "write";');
    diagnostic(p.tsc("-p", "tsconfig.json"), 2322);
  });
});
test("JSDoc: template conserva T, undefined e readonly", () => {
  fixture(jsdocProject(), (p) => {
    p.put(
      "src/check.js",
      String.raw`
// @ts-check
import { first } from "./first.js";
/** @type {number | undefined} */
const good = first([1, 2]);
/** @type {string | undefined} */
const bad = first([1, 2]);
`,
    );
    diagnostic(p.tsc("-p", "tsconfig.json"), 2322);
    p.remove("src/check.js");
    p.put(
      "src/first.js",
      code(2, 1, "js").replace(
        "return values[0];",
        "values.push(values[0]);\nreturn values[0];",
      ),
    );
    diagnostic(p.tsc("-p", "tsconfig.json"), 2339);
  });
});
test("JSDoc: genera dichiarazioni senza JavaScript e include il contratto generico", () => {
  fixture(jsdocProject(), (p) => {
    ok(
      p.tsc(
        "-p",
        "tsconfig.json",
        "--noEmit",
        "false",
        "--declaration",
        "--emitDeclarationOnly",
        "--rootDir",
        "src",
        "--outDir",
        "types",
      ),
    );
    assert.match(
      p.read("types/first.d.ts"),
      /first<T>\(values: readonly T\[\]\): T \| undefined/,
    );
    assert.equal(p.exists("types/first.js"), false);
    p.put("src/user.js", code(2, 0, "js") + '\nformatUser({id:42,email:"x"});');
    diagnostic(p.tsc("-p", "tsconfig.json", "--checkJs", "false"), 2322);
    p.put(
      "src/user.js",
      p.read("src/user.js").replace("@ts-check", "@ts-nocheck"),
    );
    ok(p.tsc("-p", "tsconfig.json"));
  });
});

test("Dichiarazioni: output generato coerente con la firma documentata", () => {
  fixture(declarationProject(), (p) => {
    ok(p.tsc("-p", "tsconfig.json"));
    const normalize = (source) =>
      ts
        .createPrinter()
        .printFile(
          ts.createSourceFile(
            "index.d.ts",
            source,
            ts.ScriptTarget.Latest,
            true,
          ),
        );
    assert.equal(normalize(p.read("dist/index.d.ts")), normalize(code(3, 1)));
    ok(p.node(["consumer.mjs"]), "item:book");
    consumerConfig(p);
    ok(p.tsc("-p", "tsconfig.consumer.json"));
    p.put(
      "named.mjs",
      'import { label } from "note-labels"; console.log(label("book", {prefix:"ref:"}));',
    );
    ok(p.node(["named.mjs"]), "ref:book");
  });
});
test("Dichiarazioni: emitDeclarationOnly non produce implementazione", () => {
  fixture(declarationProject(), (p) => {
    ok(p.tsc("-p", "tsconfig.types.json"));
    assert.equal(p.exists("types/index.d.ts"), true);
    assert.equal(p.exists("types/index.js"), false);
    assert.equal(p.exists("dist"), false);
    runtimeError(p.node(["consumer.mjs"]), /ERR_MODULE_NOT_FOUND/);
  });
});
test("Dichiarazioni: exports types puo risolversi anche con JavaScript assente", () => {
  fixture(declarationProject(), (p) => {
    ok(p.tsc("-p", "tsconfig.json"));
    p.remove("dist/index.js");
    consumerConfig(p);
    ok(p.tsc("-p", "tsconfig.consumer.json"));
    runtimeError(p.node(["consumer.mjs"]), /ERR_MODULE_NOT_FOUND/);
    p.put("consumer.ts", 'import {label} from "note-labels"; label(42);');
    diagnostic(p.tsc("-p", "tsconfig.consumer.json"), 2345);
  });
});
test("Dichiarazioni: global augmentation descrive Window senza crearlo", () => {
  fixture(declarationProject(), (p) => {
    p.put("src/browser.ts", "console.log(window.appConfig?.apiUrl);");
    ok(p.tsc("-p", "tsconfig.json"));
    runtimeError(p.node(["dist/browser.js"]), /window is not defined/);
    p.put("src/bad.d.ts", "export function fake() { return 1; }");
    diagnostic(p.tsc("-p", "tsconfig.json"), 1183);
  });
});

test("DefinitelyTyped: types vuoto non disabilita gli import tipizzati", () => {
  fixture(lodashProject(), (p) => {
    p.copyPackage("lodash");
    p.copyPackage("@types/lodash");
    ok(p.tsc("-p", "tsconfig.json"));
    ok(p.node(["dist/main.cjs"]), "undefined\n1\nfinal");
    p.put("src/main.cts", code(4) + "\nqueue(42);");
    diagnostic(p.tsc("-p", "tsconfig.json"), 2345);
  });
});
test("DefinitelyTyped: libreria runtime senza dichiarazioni da TS7016", () => {
  fixture(lodashProject(), (p) => {
    p.copyPackage("lodash");
    diagnostic(p.tsc("-p", "tsconfig.json"), 7016);
    p.put(
      "probe.cjs",
      'const debounce = require("lodash/debounce"); const f = debounce(() => 7, 300); f(); console.log(f.flush()); f.cancel();',
    );
    ok(p.node(["probe.cjs"]), "7");
  });
});
test("DefinitelyTyped: dichiarazioni installate non installano il runtime", () => {
  fixture(lodashProject(), (p) => {
    p.copyPackage("@types/lodash");
    ok(p.tsc("-p", "tsconfig.json"));
    runtimeError(p.node(["dist/main.cjs"]), /MODULE_NOT_FOUND/);
  });
});
test("DefinitelyTyped: types controlla i globali automatici nella baseline 5.9", () => {
  fixture(lodashProject(), (p) => {
    p.copyPackage("lodash");
    p.copyPackage("@types/lodash");
    p.put("node_modules/@types/demo/index.d.ts", "declare const DEMO: string;");
    p.put("node_modules/@types/demo/package.json", {
      name: "@types/demo",
      version: "1.0.0",
      types: "index.d.ts",
    });
    p.put("src/main.cts", code(4) + "\nconsole.log(DEMO);");
    diagnostic(p.tsc("-p", "tsconfig.json"), 2304);
    const config = json(4);
    delete config.compilerOptions.types;
    p.put("tsconfig.json", config);
    ok(p.tsc("-p", "tsconfig.json"));
    runtimeError(p.node(["dist/main.cjs"]), /DEMO is not defined/);
  });
});

test("OpenAPI: CLI reale, consumer compilato, required e nullable preservati", () => {
  fixture(apiProject(), (p) => {
    ok(p.generate());
    p.put(
      "src/check.ts",
      String.raw`
import type { GetUserResponse } from "./client.js";
` +
        typeChecks +
        String.raw`
type Check = Expect<Equal<GetUserResponse["nickname"], string | null | undefined>>;
const minimum: GetUserResponse = {id:"u1",email:"x"};
const nullable: GetUserResponse = {...minimum,nickname:null};
`,
    );
    ok(p.tsc("-p", "tsconfig.json"));
    assert.equal(p.exists("dist/generated/api-types.js"), false);
    assert.doesNotMatch(p.read("dist/client.js"), /import.*api-types/);
    p.put(
      "src/check.ts",
      'import type {GetUserResponse} from "./client.js"; const bad: GetUserResponse = {id:"u1"};',
    );
    diagnostic(p.tsc("-p", "tsconfig.json"), 2741);
    p.put(
      "src/check.ts",
      'import type {GetUserResponse} from "./client.js"; const bad: GetUserResponse = {id:"u1",email:"x",nickname:42};',
    );
    diagnostic(p.tsc("-p", "tsconfig.json"), 2322);
  });
});
test("OpenAPI: parser esplicito controlla campi minimi e proietta quelli utilizzati", () => {
  fixture(apiProject(), (p) => {
    ok(p.generate());
    ok(p.tsc("-p", "tsconfig.json"));
    p.put(
      "probe.mjs",
      apiRunner +
        String.raw`
assert.deepEqual(parseUser({id:"u1",email:"not-an-email",nickname:42,secret:"hidden"}), {id:"u1",email:"not-an-email"});
for (const input of [null, undefined, [], {}, 42, "x", {id:42,email:"x"}, {id:"u1",email:null}]) {
  assert.throws(() => parseUser(input), TypeError);
}
`,
    );
    ok(p.node(["probe.mjs"]));
  });
});
test("OpenAPI: Fetch simulato, URL codificata, status e errori di parsing", () => {
  fixture(apiProject(), (p) => {
    ok(p.generate());
    ok(p.tsc("-p", "tsconfig.json"));
    p.put(
      "probe.mjs",
      apiRunner +
        String.raw`
let requested;
globalThis.fetch = async url => {
  requested = url;
  return new Response(JSON.stringify({id:"a/b",email:"x"}), {status:200});
};
assert.deepEqual(await getUser("a/b?x#"), {id:"a/b",email:"x"});
assert.equal(requested, "https://api.example.test/users/a%2Fb%3Fx%23");
globalThis.fetch = async () => new Response(null, {status:404});
await assert.rejects(getUser("u1"), /HTTP 404/);
globalThis.fetch = async () => new Response("{", {status:200});
await assert.rejects(getUser("u1"), SyntaxError);
globalThis.fetch = async () => new Response(null, {status:204});
await assert.rejects(getUser("u1"), SyntaxError);
globalThis.fetch = async () => new Response("{}", {status:200});
await assert.rejects(getUser("u1"), TypeError);
globalThis.fetch = async () => { throw new TypeError("Network unavailable"); };
await assert.rejects(getUser("u1"), /Network unavailable/);
`,
    );
    ok(p.node(["probe.mjs"]));
  });
});
test("OpenAPI: check rileva output mancante o obsoleto senza aggiornarlo", () => {
  fixture(apiProject(), (p) => {
    assert.notEqual(p.generate("--check").status, 0);
    assert.equal(p.exists("src/generated/api-types.d.ts"), false);
    ok(p.generate());
    ok(p.generate("--check"));
    const old = p.read("src/generated/api-types.d.ts");
    p.put(
      "openapi.yaml",
      code(5, 0, "yaml").replace(
        "required: [id, email]",
        "required: [id, email, nickname]",
      ),
    );
    assert.notEqual(p.generate("--check").status, 0);
    assert.equal(p.read("src/generated/api-types.d.ts"), old);
    ok(p.generate());
    diagnostic(p.tsc("-p", "tsconfig.json"), 2741);
  });
});
test("OpenAPI: riferimenti di schema invalidi fanno fallire il generatore", () => {
  fixture(apiProject(), (p) => {
    p.put(
      "openapi.yaml",
      code(5, 0, "yaml").replace(
        "#/components/schemas/User",
        "#/components/schemas/Missing",
      ),
    );
    const result = p.generate();
    assert.notEqual(result.status, 0);
    assert.match(result.stdout + result.stderr, /Missing|resolve/i);
    assert.equal(p.exists("src/generated/api-types.d.ts"), false);
  });
});
