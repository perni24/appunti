import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { after, before, test } from "node:test";
import { pathToFileURL, fileURLToPath } from "node:url";
import { build } from "../../site/node_modules/esbuild/lib/main.js";
import { parseNote } from "../../site/scripts/vault.mjs";

const tools = process.env.STRUCTURE_TOOLS;
assert.ok(
  tools && path.isAbsolute(tools),
  "Impostare STRUCTURE_TOOLS a una directory di dipendenze di test (vedi README)",
);
const python = process.env.STRUCTURE_PYTHON || "python";
const root = fs.mkdtempSync(path.join(tools, "vault-structures-test-"));
const backend = path.join(root, "backend"),
  frontend = path.join(root, "frontend"),
  php = path.join(root, "php");
const data = path.join(backend, "test.sqlite3");
after(() => {
  assert.equal(path.dirname(fs.realpathSync(root)), fs.realpathSync(tools));
  assert.ok(path.basename(root).startsWith("vault-structures-test-"));
  fs.rmSync(root, { recursive: true, force: true, maxRetries: 3 });
});
function source(name) {
  const tree = parseNote(
    "Programmazione/Strutture di Progetto/Pagine/" + name + ".md",
  ).tree;
  let heading;
  const samples = [];
  for (const n of tree.children) {
    if (n.type === "heading") heading = n.children.map((c) => c.value).join("");
    if (n.type === "code") samples.push({ heading, ...n });
  }
  return (h, lang) => {
    const matches = samples.filter((n) => n.heading === h && n.lang === lang);
    assert.equal(matches.length, 1, name + ": " + h + " / " + lang);
    return matches[0].value + "\n";
  };
}
function write(dir, file, content) {
  const target = path.join(dir, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}
function run(exe, args, cwd, extra = {}) {
  const r = spawnSync(exe, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    timeout: 45000,
    env: { ...process.env, DATABASE_PATH: data, ...extra },
  });
  assert.ifError(r.error);
  assert.equal(r.status, 0, r.stderr + "\n" + r.stdout);
  return r.stdout;
}
const phpBlock = source("PHP - Applicazione web tradizionale");
const pyBlock = source("Python - Backend API a livelli");
const reactBlock = source("React - Frontend SPA a livelli");
before(() => {
  write(php, "composer.json", phpBlock("composer.json", "json"));
  write(
    php,
    "templates/pages/home.php",
    phpBlock("Dati e rendering di una pagina", "php"),
  );
  write(
    php,
    "tests/Integration/HomeTemplateTest.php",
    phpBlock("Esempio di integrazione: template Home", "php"),
  );
  write(php, "config/app.php", phpBlock("config/", "php"));
  for (const file of [
    "main.py",
    "config.py",
    "db/db.py",
    "db/repositories/entity_repo.py",
    "services/entity_service.py",
    "routes/api.py",
    "routes/entity_routes.py",
    "validators/request_validator.py",
  ])
    write(backend, file, pyBlock(file, "python"));
  for (const dir of [
    "db",
    "db/repositories",
    "services",
    "routes",
    "validators",
  ])
    write(backend, dir + "/__init__.py", "");
  write(backend, "schema.sql", pyBlock("schema.sql", "sql"));
  run(
    python,
    [
      "-c",
      "from pathlib import Path; import sqlite3, os; con=sqlite3.connect(os.environ['DATABASE_PATH']); con.executescript(Path('schema.sql').read_text(encoding='utf8')); con.close()",
    ],
    backend,
  );
  for (const [file, h, lang] of [
    ["src/pages/Home.jsx", "src/pages/", "jsx"],
    ["src/components/EntityCard.jsx", "src/components/EntityCard.jsx", "jsx"],
    ["src/context/AppProviders.jsx", "src/context/AppProviders.jsx", "jsx"],
    ["src/context/EntityContext.jsx", "src/context/EntityContext.jsx", "jsx"],
    ["src/context/useEntity.js", "src/context/useEntity.js", "jsx"],
    ["src/App.jsx", "src/App.jsx", "jsx"],
    ["src/main.jsx", "src/main.jsx", "jsx"],
    ["src/types/entities.ts", "src/types/entities.ts", "typescript"],
    ["src/types/apiResponses.ts", "src/types/apiResponses.ts", "typescript"],
    ["src/api/apiCore.ts", "src/api/apiCore.ts", "typescript"],
    ["src/api/entityApi.ts", "src/api/entityApi.ts", "typescript"],
    ["tsconfig.json", "Decisione iniziale: JavaScript o TypeScript", "json"],
    ["index.html", "index.html", "html"],
    ["vite.config.js", "vite.config.js", "javascript"],
  ])
    write(frontend, file, reactBlock(h, lang));
  write(frontend, "src/index.css", "");
  write(
    frontend,
    "package.json",
    JSON.stringify({
      type: "module",
      ...JSON.parse(reactBlock("package.json", "json")),
    }),
  );
});

test("PHP: Composer esegue il test reale del template e la configurazione legge il processo", () => {
  assert.ok(
    process.env.COMPOSER_PHAR,
    "Impostare COMPOSER_PHAR al percorso di composer.phar",
  );
  const composerEnv = {
    COMPOSER_VENDOR_DIR: path.join(tools, "vendor"),
    COMPOSER_NO_INTERACTION: "1",
  };
  run(
    "php",
    [
      process.env.COMPOSER_PHAR,
      "validate",
      "--no-check-publish",
      "--no-check-lock",
    ],
    php,
    composerEnv,
  );
  assert.match(
    run("php", [process.env.COMPOSER_PHAR, "test"], php, composerEnv),
    /OK \(1 test, 1 assertion\)/,
  );
  const config = JSON.parse(
    run("php", ["-r", "echo json_encode(require 'config/app.php');"], php, {
      APP_NAME: "Lab",
      APP_DEBUG: "false",
      APP_ENV: "test",
    }),
  );
  assert.deepEqual(config, { name: "Lab", environment: "test", debug: false });
});

test("SQLite: errore dopo una scrittura annulla l'operazione e chiude la connessione", () => {
  run(
    python,
    [
      "-c",
      `from config import load_settings
from db.db import transaction
from db.repositories.entity_repo import EntityRepository
import sqlite3
path = load_settings().database_path
try:
    with transaction(path) as db:
        assert EntityRepository(db).create("Rollback") is not None
        raise ValueError("abort")
except ValueError:
    pass
try:
    db.execute("SELECT 1")
except sqlite3.ProgrammingError:
    pass
else:
    raise AssertionError("connessione non chiusa")
with transaction(path) as db:
    assert db.execute("SELECT count(*) FROM entities WHERE name='Rollback'").fetchone()[0] == 0`,
    ],
    backend,
  );
});

test("Vite: typecheck dei moduli TS e build delle pagine JSX con i loro import", () => {
  const tsc = fileURLToPath(
    new URL("../../site/node_modules/typescript/bin/tsc", import.meta.url),
  );
  run(process.execPath, [tsc, "--noEmit"], frontend);
  run(
    process.execPath,
    [path.join(tools, "node_modules/vite/bin/vite.js"), "build"],
    frontend,
  );
  assert.match(
    fs.readFileSync(path.join(frontend, "dist/index.html"), "utf8"),
    /assets\/[^"]+\.js/,
  );
});

test("Client React e API FastAPI: lista, dettaglio, 201, 404, 409 e 422", async (t) => {
  const bundle = path.join(frontend, "client.mjs");
  await build({
    entryPoints: [path.join(frontend, "src/api/entityApi.ts")],
    bundle: true,
    format: "esm",
    outfile: bundle,
    define: { "import.meta.env.VITE_API_BASE_URL": "undefined" },
  });
  const client = await import(pathToFileURL(bundle));
  // L'adattatore porta metodo, percorso, header e corpo della fetch al vero handler ASGI.
  const bridge = `import asyncio, sys, json, httpx
from main import create_app
async def request():
    method, path, headers, body = json.loads(sys.argv[1])
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=create_app()), base_url="http://test") as c:
        r = await c.request(method,path,headers=headers,content=body)
        print(json.dumps([r.status_code,r.text]))
asyncio.run(request())`;
  const statuses = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(new Headers(init.headers).get("accept"), "application/json");
    const spec = [
      init.method ?? "GET",
      url,
      Object.fromEntries(new Headers(init.headers)),
      init.body ?? null,
    ];
    const [status, body] = JSON.parse(
      run(python, ["-c", bridge, JSON.stringify(spec)], backend),
    );
    statuses.push(status);
    return new Response(body, { status });
  });
  assert.deepEqual(await client.getEntities(), []);
  const item = await client.createEntity({ name: "  Example  " });
  assert.deepEqual(item, { id: 1, name: "Example" });
  assert.deepEqual(await client.getEntity(item.id), item);
  assert.deepEqual(await client.getEntities(), [item]);
  for (const [fn, code] of [
    [() => client.getEntity(2), 404],
    [() => client.createEntity({ name: "Example" }), 409],
    [() => client.createEntity({ name: "    " }), 422],
  ])
    await assert.rejects(fn, (e) => e.status === code);
  assert.deepEqual(statuses, [200, 201, 200, 200, 404, 409, 422]);
  globalThis.fetch.mock.mockImplementation(async () =>
    Response.json([{ id: 1 }]),
  );
  await assert.rejects(() => client.getEntities(), /entità non valida/);
  globalThis.fetch.mock.mockImplementation(
    async () => new Response(null, { status: 204 }),
  );
  await assert.rejects(() => client.getEntity(1), /risposta vuota/);
});
