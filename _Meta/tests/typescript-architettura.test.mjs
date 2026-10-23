import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";
import { ts, valid, invalid, run, hasName } from "./typescript-examples.mjs";

const names = [
  "Pattern Repository e Service",
  "DTO e modelli di dominio",
  "Domain modeling",
  "Clean architecture",
  "Dependency injection",
];
const notes = names.map((name) =>
  parseNote("Programmazione/TypeScript/Pagine/" + name + ".md"),
);
const blocks = (i, lang = "ts") =>
  notes[i].tree.children
    .filter((node) => node.type === "code" && node.lang === lang)
    .map((node) => node.value);
const source = (i) => blocks(i).join("\n");
const clone = (value) => structuredClone(value);
const api = (i, expression) => run(source(i), expression).value;

test("baseline TypeScript e blocchi estratti dalle cinque note", () => {
  assert.equal(ts.version, "5.9.3");
  assert.deepEqual(
    names.map((_, i) => blocks(i).length),
    [4, 4, 4, 5, 3],
  );
  for (const i of [0, 1, 2, 4]) valid(source(i));
});
for (const [i, name] of names.entries()) {
  test("metadati e struttura: " + name, () => {
    const note = notes[i];
    assert.equal(note.data.title, name);
    assert.equal(note.data.status, "non revisionato");
    assert.equal(note.data.publish, true);
    assert.equal(note.data.area, "Programmazione");
    assert.equal(note.data.topic, "TypeScript");
    assert.equal(note.data.type, "technical-note");
    assert.equal(
      note.tree.children.filter((n) => n.type === "heading" && n.depth === 1)
        .length,
      1,
    );
    for (const heading of [
      "Sintesi",
      "Esempio pratico",
      "Errori comuni",
      "Checklist",
      "Collegamenti",
      "Fonti",
      "Navigazione",
    ]) {
      assert.ok(note.body.includes("## " + heading), heading);
    }
    for (const link of [...note.data.prerequisites, ...note.data.related]) {
      assert.match(link, /^\[\[Programmazione\/TypeScript\/Pagine\//);
    }
  });
}

test("repository: demo concorrente, un solo inserimento", async () => {
  const result = run(source(0), "demoRegistration()");
  await result.value;
  assert.deepEqual(result.output, [
    [1],
    [{ id: "u1", email: "ada@example.test" }],
  ]);
});
test("repository: input vuoto non consuma ID, trim e confronto case-sensitive", async () => {
  const { MemoryUserRepository, UserService } = api(
    0,
    "({ MemoryUserRepository, UserService })",
  );
  const repo = new MemoryUserRepository();
  let calls = 0;
  const service = new UserService(repo, () => "u" + ++calls);
  assert.deepEqual(clone(await service.register("  ")), {
    ok: false,
    error: "empty_email",
  });
  assert.equal(calls, 0);
  assert.equal((await service.register(" Ada@example.test ")).ok, true);
  assert.equal((await service.register("ada@example.test")).ok, true);
  assert.equal((await repo.findByEmail("Ada@example.test")).id, "u1");
  assert.equal(await repo.findByEmail("missing"), null);
});
test("repository: conflitto ID non sovrascrive e non indicizza il secondo contatto", async () => {
  const { MemoryUserRepository, UserService } = api(
    0,
    "({ MemoryUserRepository, UserService })",
  );
  const repo = new MemoryUserRepository();
  const service = new UserService(repo, () => "same");
  await service.register("a");
  assert.deepEqual(clone(await service.register("b")), {
    ok: false,
    error: "id_conflict",
  });
  assert.equal(await repo.findByEmail("b"), null);
  assert.equal((await repo.findByEmail("a")).email, "a");
});
test("repository: copia sia l'input sia il risultato, istanze indipendenti", async () => {
  const Repo = api(0, "MemoryUserRepository");
  const repo = new Repo();
  const original = { id: "u1", email: "a" };
  await repo.insertUnique(original);
  original.email = "changed";
  const found = await repo.findByEmail("a");
  found.email = "also changed";
  assert.deepEqual(clone(await repo.findByEmail("a")), {
    id: "u1",
    email: "a",
  });
  assert.equal(await new Repo().findByEmail("a"), null);
});
test("repository: guasti I/O e generatore ID difettoso non diventano conflitti", async () => {
  const Service = api(0, "UserService");
  const cause = new Error("offline");
  const repo = {
    findByEmail: async () => null,
    insertUnique: async () => {
      throw cause;
    },
  };
  await assert.rejects(
    Promise.resolve(new Service(repo, () => "u1").register("a")),
    (e) => e === cause,
  );
  await assert.rejects(
    Promise.resolve(new Service(repo, () => "").register("a")),
    /empty ID/,
  );
});
test("repository: contratto asincrono controllato staticamente", () => {
  invalid(
    source(0) +
      '\nconst bad: UserRepository = { findByEmail: () => null, insertUnique: async () => "inserted" };',
    2322,
  );
});

test("DTO: parser normalizza e crea un nuovo oggetto", () => {
  const parse = api(1, "parseUpdateProfile");
  const input = { displayName: "  Ada  " };
  const result = parse(input);
  assert.deepEqual(clone(result), { displayName: "Ada" });
  assert.notEqual(result, input);
  assert.equal(input.displayName, "  Ada  ");
});
test("DTO: input JSON invalidi, campi extra e proprieta ereditate", () => {
  const parse = api(1, "parseUpdateProfile");
  for (const input of [
    null,
    [],
    1,
    "Ada",
    {},
    { displayName: 1 },
    { displayName: "" },
    { displayName: "  " },
    { displayName: "Ada", role: "admin" },
    Object.create({ displayName: "Ada" }),
  ]) {
    assert.equal(parse(input), null);
  }
});
test("DTO: limite esplicito di 80 unita UTF-16", () => {
  const parse = api(1, "parseUpdateProfile");
  assert.ok(parse({ displayName: "a".repeat(80) }));
  assert.equal(parse({ displayName: "a".repeat(81) }), null);
  assert.ok(parse({ displayName: "\u{1f600}".repeat(40) }));
  assert.equal(parse({ displayName: "\u{1f600}".repeat(41) }), null);
});
test("DTO: JSON di risposta non contiene credenziali o flag interni", () => {
  const { value, output } = run(source(1), "({ user, response, misleading })");
  assert.deepEqual(JSON.parse(output[0][0]), {
    id: "u1",
    displayName: "Ada",
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  assert.notEqual(value.response, value.user);
  assert.equal(value.misleading, value.user);
  assert.ok(
    output[1][0].includes("passwordHash"),
    "Pick non proietta a runtime",
  );
});
test("DTO: Date invalida fallisce; readonly non congela la Date", () => {
  const { user, toUserResponse, response } = api(
    1,
    "({ user, toUserResponse, response })",
  );
  user.createdAt.setUTCFullYear(2030);
  assert.equal(response.createdAt, "2026-01-01T00:00:00.000Z");
  assert.match(toUserResponse(user).createdAt, /^2030/);
  user.createdAt.setTime(NaN);
  assert.throws(() => toUserResponse(user), hasName("RangeError"));
});
test("DTO: il tipo di risposta non espone passwordHash al codice controllato", () => {
  invalid(source(1) + "\nresponse.passwordHash;", 2339);
});

test("dominio: parser quantita copre intervallo, tipo e frazioni", () => {
  const parse = api(2, "parseQuantity");
  for (const n of [1, 2, 99])
    assert.deepEqual(clone(parse(n)), { ok: true, value: n });
  for (const n of [0, -1, 100, 1.5, NaN, Infinity, "2", null, true]) {
    assert.deepEqual(clone(parse(n)), { ok: false, error: "invalid_quantity" });
  }
});
test("dominio: ID con formato e lunghezza definiti", () => {
  const { createDraft, quantity } = api(2, "({ createDraft, quantity })");
  for (const id of ["a", "ord-1", "a".repeat(32)])
    assert.equal(createDraft(id, quantity.value).id, id);
  for (const id of ["", "A", "a\n", "../a", "a".repeat(33)])
    assert.throws(() => createDraft(id, quantity.value), /Invalid order ID/);
});
test("dominio: transizioni valide producono nuovi valori congelati", () => {
  const { draft, markPaid, cancel, describeOrder } = api(
    2,
    "({ draft, markPaid, cancel, describeOrder })",
  );
  const paid = markPaid(draft, 0);
  const cancelled = cancel(draft, "  Richiesta cliente  ");
  assert.equal(paid.ok, true);
  assert.equal(cancelled.ok, true);
  assert.equal(cancelled.value.reason, "Richiesta cliente");
  assert.equal(draft.kind, "draft");
  assert.notEqual(paid.value, draft);
  for (const order of [draft, paid.value, cancelled.value])
    assert.equal(Object.isFrozen(order), true);
  assert.deepEqual(
    [
      describeOrder(draft),
      describeOrder(paid.value),
      describeOrder(cancelled.value),
    ],
    ["Da pagare", "Pagato", "Annullato: Richiesta cliente"],
  );
});
test("dominio: stati terminali rifiutano entrambe le transizioni", () => {
  const { draft, markPaid, cancel } = api(2, "({ draft, markPaid, cancel })");
  for (const order of [markPaid(draft, 1).value, cancel(draft, "ok").value]) {
    assert.deepEqual(clone(markPaid(order, 2)), {
      ok: false,
      error: "not_draft",
    });
    assert.deepEqual(clone(cancel(order, "ok")), {
      ok: false,
      error: "not_draft",
    });
  }
});
test("dominio: intervallo temporale e ragioni di annullamento", () => {
  const { draft, markPaid, cancel } = api(2, "({ draft, markPaid, cancel })");
  assert.equal(markPaid(draft, 8640000000000000).ok, true);
  for (const time of [-1, 0.5, NaN, Infinity, 8640000000000001])
    assert.equal(markPaid(draft, time).error, "invalid_time");
  assert.equal(cancel(draft, "x".repeat(120)).ok, true);
  for (const reason of ["", "  ", "x".repeat(121)])
    assert.equal(cancel(draft, reason).error, "invalid_reason");
});
test("dominio: brand non assegnabile da un semplice numero", () => {
  invalid(source(2) + "\nconst forged: Quantity = 2;", 2322);
});
test("dominio: paid richiede paidAt e nuovi stati rompono l'esaustivita", () => {
  invalid(
    source(2) +
      '\nconst incomplete: Order = { kind: "paid", id: "a", quantity: 2 as Quantity };',
    2322,
  );
  invalid(
    source(2).replace(
      "type Order =",
      'type Order = Readonly<{ kind: "refunded"; id: string; quantity: Quantity }> |',
    ),
    2322,
  );
});

test("DI: demo deterministico senza posta reale", async () => {
  assert.deepEqual(clone(await api(4, "demoNotifications()")), [
    {
      to: "ada@example.test",
      subject: "Benvenuto",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ]);
});
test("DI: errore del provider si propaga senza essere nascosto", async () => {
  const Service = api(4, "NotificationService");
  const cause = new Error("provider failed");
  const service = new Service(
    {
      send: async () => {
        throw cause;
      },
    },
    { now: () => new Date(0) },
  );
  await assert.rejects(
    Promise.resolve(service.welcome("a")),
    (e) => e === cause,
  );
});
test("DI: clock invalido impedisce l'invio e il clock viene letto una volta", async () => {
  const Service = api(4, "NotificationService");
  let reads = 0;
  let sent = 0;
  const service = new Service(
    {
      send: async () => {
        sent++;
      },
    },
    {
      now: () => {
        reads++;
        return new Date(NaN);
      },
    },
  );
  await assert.rejects(
    Promise.resolve(service.welcome("a")),
    hasName("RangeError"),
  );
  assert.equal(reads, 1);
  assert.equal(sent, 0);
});
test("DI: test double separa i riferimenti in ingresso e in uscita", async () => {
  const Recording = api(4, "RecordingMailer");
  const mailer = new Recording();
  const input = { to: "a", subject: "b", createdAt: "c" };
  await mailer.send(input);
  input.to = "changed";
  const received = mailer.messages;
  received[0].to = "also changed";
  received.push(input);
  assert.deepEqual(clone(mailer.messages), [
    { to: "a", subject: "b", createdAt: "c" },
  ]);
});
test("DI: interface cancellata, oggetti strutturali ammessi", () => {
  invalid(source(4) + "\nconst token = Mailer;", 2693);
  valid(source(4) + "\nconst clock: Clock = { now: () => new Date(0) };");
});

// This fixture contains no dependency links and uses the already installed tsc.
const req = createRequire(new URL("../../site/package.json", import.meta.url));
const temp = fs.realpathSync(os.tmpdir());
const root = fs.mkdtempSync(
  path.join(temp, "appunti-typescript-architecture-"),
);
after(() => {
  assert.equal(path.dirname(fs.realpathSync(root)), temp);
  assert.ok(path.basename(root).startsWith("appunti-typescript-architecture-"));
  fs.rmSync(root, { recursive: true, force: true });
});
const locate = (name) => {
  const file = path.resolve(root, name);
  assert.ok(file.startsWith(root + path.sep));
  return file;
};
const put = (name, value) => {
  const file = locate(name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    typeof value === "string" ? value : JSON.stringify(value),
  );
};
const node = (...args) => {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
    timeout: 30000,
    windowsHide: true,
    env: { ...process.env, NODE_OPTIONS: "", NO_COLOR: "1" },
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  return { status: result.status, output: result.stdout + result.stderr };
};
const tsc = (...args) =>
  node(req.resolve("typescript/bin/tsc"), "--pretty", "false", ...args);
const fileNames = [
  "src/domain/task.ts",
  "src/application/getOpenTask.ts",
  "src/adapters/memoryTasks.ts",
  "src/adapters/handleGetTask.ts",
  "src/main.ts",
];
const files = Object.fromEntries(
  fileNames.map((name, i) => [name, blocks(3)[i]]),
);
put("package.json", JSON.parse(blocks(3, "json")[0]));
put("tsconfig.json", JSON.parse(blocks(3, "json")[1]));
for (const [name, content] of Object.entries(files)) put(name, content);
let built = false;
const ensureBuilt = () => {
  if (built) return;
  const result = tsc();
  assert.equal(result.status, 0, result.output);
  built = true;
};
const probe = (script) => {
  ensureBuilt();
  const result = node(
    "--input-type=module",
    "-e",
    `
import assert from "node:assert/strict";
import { makeGetOpenTask } from "./dist/application/getOpenTask.js";
import { createMemoryTasks } from "./dist/adapters/memoryTasks.js";
import { makeHandleGetTask } from "./dist/adapters/handleGetTask.js";
` + script,
  );
  assert.equal(result.status, 0, result.output);
};

// Only the static import/export forms used by this small fixture are inspected.
function architectureViolations(project) {
  const violations = [];
  for (const [name, content] of Object.entries(project)) {
    const layer = name.split("/")[1];
    const parsed = ts.createSourceFile(
      name,
      content,
      ts.ScriptTarget.Latest,
      true,
    );
    for (const statement of parsed.statements) {
      if (
        !ts.isImportDeclaration(statement) &&
        !ts.isExportDeclaration(statement)
      )
        continue;
      const spec = statement.moduleSpecifier;
      if (!spec || !ts.isStringLiteral(spec)) continue;
      if (!["domain", "application"].includes(layer)) continue;
      const target = path.posix.normalize(
        path.posix.join(path.posix.dirname(name), spec.text),
      );
      const allowed =
        layer === "domain"
          ? ["src/domain/"]
          : ["src/domain/", "src/application/"];
      if (
        !spec.text.startsWith(".") ||
        !allowed.some((prefix) => target.startsWith(prefix))
      ) {
        violations.push(name + " -> " + spec.text);
      }
    }
  }
  return violations;
}
test("clean: check, compilazione ESM ed esecuzione del progetto estratto", () => {
  const check = tsc("--noEmit");
  assert.equal(check.status, 0, check.output);
  ensureBuilt();
  const result = node("dist/main.js");
  assert.equal(result.status, 0, result.output);
  const replies = result.output
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line));
  assert.deepEqual(replies, [
    { status: 200, body: { id: "t1", title: "Studiare TypeScript" } },
    { status: 404, body: { error: "not_available" } },
    { status: 404, body: { error: "not_available" } },
    { status: 400, body: { error: "invalid_id" } },
  ]);
});
test("clean: adapter memoria, copie, assenza e ID duplicati", () =>
  probe(`
const seed = { id: "t1", title: "Originale", done: false };
const reader = createMemoryTasks([seed]);
seed.title = "Changed";
const result = await reader.findById("t1");
result.title = "Changed again";
assert.equal((await reader.findById("t1")).title, "Originale");
assert.equal(await reader.findById("missing"), null);
assert.throws(() => createMemoryTasks([seed, seed]), /Duplicate task ID/);
`));
test("clean: input invalido non raggiunge il caso d'uso", () =>
  probe(`
let calls = 0;
const handle = makeHandleGetTask(async () => { calls++; return { kind: "missing" }; });
for (const input of [null, 1, {}, "", "A", "a\\n", "a".repeat(33)]) {
  assert.equal((await handle(input)).status, 400);
}
assert.equal(calls, 0);
assert.equal((await handle("a".repeat(32))).status, 404);
assert.equal(calls, 1);
`));
test("clean: missing e closed distinti nel nucleo, stessa risposta esterna", () =>
  probe(`
const useCase = makeGetOpenTask(createMemoryTasks([{ id: "t1", title: "Chiusa", done: true }]));
assert.deepEqual(await useCase("t1"), { kind: "closed" });
assert.deepEqual(await useCase("none"), { kind: "missing" });
const handle = makeHandleGetTask(useCase);
assert.deepEqual(await handle("t1"), await handle("none"));
`));
test("clean: errore I/O si propaga attraverso caso d'uso e adapter", () =>
  probe(`
const cause = new Error("offline");
const useCase = makeGetOpenTask({ findById: async () => { throw cause; } });
await assert.rejects(makeHandleGetTask(useCase)("t1"), (e) => e === cause);
`));
test("clean: import reali rispettano i confini, inclusi type-only", () => {
  assert.deepEqual(architectureViolations(files), []);
  assert.equal(
    architectureViolations({
      ...files,
      "src/domain/task.ts":
        files["src/domain/task.ts"] +
        '\nimport type { Request } from "express";',
    }).length,
    1,
  );
  assert.equal(
    architectureViolations({
      ...files,
      "src/application/getOpenTask.ts":
        files["src/application/getOpenTask.ts"] +
        '\nimport type { createMemoryTasks } from "../adapters/memoryTasks.js";',
    }).length,
    1,
  );
});
test("clean: tsc ammette import type esterno al livello, controllo architetturale lo rifiuta", () => {
  ensureBuilt();
  const name = "src/application/getOpenTask.ts";
  const mutation =
    files[name] +
    '\nimport type { createMemoryTasks } from "../adapters/memoryTasks.js";';
  try {
    put(name, mutation);
    const result = tsc("--noEmit");
    assert.equal(result.status, 0, result.output);
    assert.equal(
      architectureViolations({ ...files, [name]: mutation }).length,
      1,
    );
  } finally {
    put(name, files[name]);
  }
});
test("clean: compilatore rifiuta una porta con risultato errato", () => {
  const file = "src/bad.ts";
  try {
    put(
      file,
      'import type { TaskReader } from "./application/getOpenTask.js";\nconst reader: TaskReader = { findById: async () => 42 };',
    );
    const result = tsc("--noEmit");
    assert.notEqual(result.status, 0);
    assert.match(result.output, /TS2322/);
  } finally {
    fs.unlinkSync(locate(file));
  }
});
