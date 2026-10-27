import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  realpathSync,
  rmSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, basename, delimiter } from "node:path";
import { test, after } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

assert.ok(
  process.env.PYTHON_DATABASE_TOOLS,
  "Set PYTHON_DATABASE_TOOLS; see README.",
);
assert.ok(
  process.env.PYTHON_PACKAGING_TOOLS,
  "Set PYTHON_PACKAGING_TOOLS; see README.",
);
const python = join(process.env.PYTHON_DATABASE_TOOLS, "Scripts", "python.exe");
const packaging = join(
  process.env.PYTHON_PACKAGING_TOOLS,
  "Scripts",
  "python.exe",
);
const parent = realpathSync(tmpdir());
const root = mkdtempSync(join(parent, "appunti-python-http-env-test-"));
after(() => {
  const actual = realpathSync(root);
  assert.equal(dirname(actual), parent);
  assert.ok(basename(actual).startsWith("appunti-python-http-env-test-"));
  assert.equal(actual, root);
  rmSync(actual, { recursive: true, force: true });
});
const names = [
  "Python - Richieste HTTP",
  "Python - Moduli ambienti e dipendenze",
];
const notes = names.map((n) =>
  parseNote("Programmazione/Python/Promemoria/Pagine/" + n + ".md"),
);
const text = (n) => n.value ?? (n.children ?? []).map(text).join("");
const blocks = notes.map((note) => {
  const result = new Map();
  let heading;
  for (const n of note.tree.children) {
    if (n.type === "heading") heading = text(n);
    if (n.type === "code") {
      if (!result.has(heading)) result.set(heading, []);
      result.get(heading).push(n);
    }
  }
  return result;
});
function block(i, heading, lang = "python") {
  const b = blocks[i].get(heading)?.find((n) => n.lang === lang);
  assert.ok(b, heading + " / " + lang);
  return b.value;
}
const env = { ...process.env, PYTHONUTF8: "1", PYTHONDONTWRITEBYTECODE: "1" };
for (const k of Object.keys(env)) {
  if (
    /^(PYTHONPATH|PYTHONHOME|VIRTUAL_ENV|.*_PROXY|REQUESTS_CA_BUNDLE|CURL_CA_BUNDLE|SSL_CERT_FILE|SSL_CERT_DIR|PIP_.*)$/i.test(
      k,
    )
  )
    delete env[k];
}
Object.assign(env, {
  NO_PROXY: "*",
  NETRC: join(root, "absent-netrc"),
  PIP_NO_INDEX: "1",
  PIP_DISABLE_PIP_VERSION_CHECK: "1",
  PIP_CONFIG_FILE: "NUL",
  PIP_CACHE_DIR: join(root, "pip-cache"),
});
function run(exe, args, { cwd = root, input, status = 0, extraEnv = {} } = {}) {
  const r = spawnSync(exe, args, {
    cwd,
    input,
    env: { ...env, ...extraEnv },
    encoding: "utf8",
    windowsHide: true,
    timeout: 90000,
    maxBuffer: 2 ** 22,
  });
  assert.ifError(r.error);
  if (status !== null) assert.equal(r.status, status, r.stdout + r.stderr);
  return r;
}
function py(code, options) {
  return run(python, ["-X", "utf8", "-c", code], options);
}

const driver = String.raw`
import asyncio
import contextlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import socket
import sys
import threading
import unittest
from unittest.mock import patch, AsyncMock
from urllib.parse import urlsplit, parse_qs

request = json.load(sys.stdin)
expect = unittest.TestCase()
calls = []
payload = b"abcd" * 5000

class Handler(BaseHTTPRequestHandler):
    def handle_request(self):
        path = urlsplit(self.path)
        query = parse_qs(path.query)
        incoming = self.rfile.read(int(self.headers.get("Content-Length", "0")))
        calls.append((self.command, path.path, query, dict(self.headers), incoming))
        code, body, headers = 200, b'{"ok": true}', {}
        if path.path == "/entities":
            if self.command == "POST":
                code = 201
                body = json.dumps({"id": 1, **json.loads(incoming)}).encode()
            else:
                body = json.dumps({"page": query.get("page", ["0"])[0]}).encode()
        elif path.path == "/cookies":
            if query.get("page") == ["1"]: headers["Set-Cookie"] = "demo=yes; Path=/"
            body = json.dumps({"cookie": self.headers.get("Cookie")}).encode()
        elif path.path.startswith("/status/"):
            code = int(path.path.rsplit("/", 1)[1])
            if code == 302: headers["Location"] = "/destination"
            if code == 204: body = b""
        elif path.path == "/bad-json":
            body = b"not-json"
        elif path.path == "/scalar":
            body = b"null"
        elif path.path == "/download":
            body = payload
        elif path.path == "/empty":
            body = b""
        elif path.path == "/truncated":
            body = b"abc"
            headers["Content-Length"] = "100"
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", headers.pop("Content-Length", str(len(body))))
        for k, v in headers.items(): self.send_header(k, v)
        self.end_headers()
        try:
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass

    do_GET = handle_request
    do_POST = handle_request
    def log_message(self, *args): pass

server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
worker = threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.01})
worker.start()
base = f"http://127.0.0.1:{server.server_port}"
original_connect = socket.socket.connect
def only_local(sock, address):
    # Windows also connects an ephemeral loopback socketpair for the event loop.
    assert address[0] == "127.0.0.1", address
    return original_connect(sock, address)
namespace = {
    "__name__": "snippet", "expect": expect, "base": base,
    "calls": calls, "payload": payload, "Path": Path, "patch": patch,
    "AsyncMock": AsyncMock, "asyncio": asyncio,
}
try:
    with patch.object(socket.socket, "connect", only_local):
        exec(compile(request["source"], "note-snippet", "exec"), namespace)
        assert not calls, "Defining a snippet unexpectedly sent a request"
        exec(compile(request["probe"], "probe", "exec"), namespace)
finally:
    server.shutdown()
    server.server_close()
    worker.join()
`;
writeFileSync(join(root, "http_driver.py"), driver);
let sequence = 0;
function http(heading, probe) {
  const cwd = join(root, "http-" + sequence++);
  mkdirSync(cwd);
  return run(python, ["-I", "-X", "utf8", join(root, "http_driver.py")], {
    cwd,
    input: JSON.stringify({ source: block(0, heading), probe }),
  });
}
function cases(heading, rows) {
  for (const [name, probe] of rows)
    test(heading + ": " + name, () => http(heading, probe));
}
test("baseline e copertura di 8 blocchi HTTP e 5 blocchi moduli", () => {
  py(
    "import sys, importlib.metadata as m\nassert sys.version_info[:3] == (3,12,10)\nassert m.version('requests') == '2.34.2'\nassert m.version('httpx') == '0.28.1'",
  );
  run(packaging, ["-c", "import pip; assert pip.__version__ == '26.2.2'"]);
  assert.deepEqual(
    notes.map(
      (n) =>
        n.tree.children.filter((b) => b.type === "code" && b.lang === "python")
          .length,
    ),
    [8, 5],
  );
});
for (const [i, name] of names.entries())
  test(name + ": struttura operativa e YAML", () => {
    const n = notes[i];
    assert.equal(n.data.type, "operational-note");
    assert.equal(n.data.status, "non revisionato");
    assert.equal(n.data.publish, true);
    assert.equal(String(n.data.date), "2026-07-30");
    const h = n.tree.children.filter((n) => n.type === "heading");
    assert.equal(h.filter((n) => n.depth === 1).length, 1);
    assert.equal(text(h[0]), n.data.title);
    for (const label of [
      "Obiettivo",
      "Quando usarlo",
      "Procedura",
      "Snippet",
      "Adattamenti comuni",
      "Debug rapido",
      "Checklist finale",
      "Collegamenti",
      "Fonti",
    ])
      assert.ok(
        h.some((n) => text(n) === label),
        label,
      );
    for (let j = 1; j < h.length; j++)
      assert.ok(h[j].depth <= h[j - 1].depth + 1);
  });

cases("GET con Requests", [
  [
    "query codificata e JSON reale",
    "assert get_entities(base + '/entities', 'a b&c') == {'page': 'a b&c'}\nassert calls[0][2] == {'page': ['a b&c']}\nassert calls[0][3]['Accept'] == 'application/json'",
  ],
  [
    "timeout e risposta chiusa",
    "original = requests.get\nclose = requests.Response.close\nwith patch.object(requests, 'get', wraps=original) as get, patch.object(requests.Response, 'close', autospec=True, side_effect=close) as closed:\n    get_entities(base + '/entities')\nassert get.call_args.kwargs['timeout'] == (2,10)\nassert get.call_args.kwargs['allow_redirects'] is False\nassert closed.call_count == 1",
  ],
  [
    "JSON non e validazione dello schema",
    "assert get_entities(base + '/scalar') is None",
  ],
  [
    "JSON invalido propaga",
    "with expect.assertRaises(requests.exceptions.JSONDecodeError):\n    get_entities(base + '/bad-json')",
  ],
  [
    "404 propaga HTTPError",
    "with expect.assertRaises(requests.HTTPError) as error:\n    get_entities(base + '/status/404')\nassert error.exception.response.status_code == 404",
  ],
  [
    "redirect non seguito",
    "with expect.assertRaises(ValueError):\n    get_entities(base + '/status/302')\nassert len(calls) == 1",
  ],
  [
    "204 distinto da 200",
    "with expect.assertRaisesRegex(ValueError, 'Expected status 200'):\n    get_entities(base + '/status/204')",
  ],
]);
cases("POST JSON", [
  [
    "corpo JSON e status 201",
    "assert create_entity(base + '/entities', {'name': 'Ada'}) == {'id': 1, 'name': 'Ada'}\nassert calls[0][0] == 'POST'\nassert calls[0][3]['Content-Type'] == 'application/json'\nassert calls[0][4] == b'{\"name\": \"Ada\"}'",
  ],
  [
    "status differente rifiutato",
    "with expect.assertRaises(ValueError):\n    create_entity(base + '/status/200', {'name': 'Ada'})",
  ],
  [
    "payload non serializzabile non invia",
    "with expect.assertRaises(TypeError):\n    create_entity(base + '/entities', {'items': {1,2}})\nassert not calls",
  ],
  [
    "503 non ritentato",
    "with expect.assertRaises(requests.HTTPError):\n    create_entity(base + '/status/503', {})\nassert len(calls) == 1",
  ],
]);
cases("Autenticazione Bearer", [
  [
    "header e netrc ignorato",
    "import os\nPath('credentials').write_text('machine 127.0.0.1 login wrong password ignored\\n', encoding='utf-8')\nwith patch.dict(os.environ, {'NETRC': str(Path('credentials').resolve())}):\n    assert get_private_json(base + '/private', 'test-only') == {'ok': True}\nassert calls[0][3]['Authorization'] == 'Bearer test-only'",
  ],
  [
    "sessione chiusa anche sullo status errato",
    "close = requests.Session.close\nwith patch.object(requests.Session, 'close', autospec=True, side_effect=close) as closed:\n    with expect.assertRaises(requests.HTTPError):\n        get_private_json(base + '/status/401', 'test-only')\nassert closed.call_count == 1",
  ],
  [
    "redirect non inoltra credenziali",
    "with expect.assertRaises(ValueError):\n    get_private_json(base + '/status/302', 'test-only')\nassert len(calls) == 1",
  ],
]);
cases("Riutilizzare una sessione", [
  [
    "due risultati separati",
    "assert get_two_pages(base + '/entities') == [{'page':'1'}, {'page':'2'}]\nassert len(calls) == 2",
  ],
  [
    "cookie condivisi tra chiamate",
    "assert get_two_pages(base + '/cookies') == [{'cookie':None}, {'cookie':'demo=yes'}]",
  ],
  [
    "errore ferma il ciclo",
    "with expect.assertRaises(requests.HTTPError):\n    get_two_pages(base + '/status/500')\nassert len(calls) == 1",
  ],
]);
cases("Gestire gli errori Requests", [
  ["successo", "assert get_json_checked(base + '/entities') == {'page':'0'}"],
  [
    "errore HTTP con messaggio ridotto",
    "with expect.assertRaisesRegex(RuntimeError, '^HTTP 500$'):\n    get_json_checked(base + '/status/500')",
  ],
  [
    "JSON riconosciuto prima di RequestException",
    "with expect.assertRaisesRegex(RuntimeError, '^Invalid JSON response$'):\n    get_json_checked(base + '/bad-json')",
  ],
  [
    "timeout simulato",
    "with patch.object(requests, 'get', side_effect=requests.Timeout('secret-url')):\n    with expect.assertRaisesRegex(RuntimeError, '^Request timed out$') as error:\n        get_json_checked(base)\nassert error.exception.__suppress_context__",
  ],
  [
    "connessione fallita simulata",
    "with patch.object(requests, 'get', side_effect=requests.ConnectionError('secret-url')):\n    with expect.assertRaisesRegex(RuntimeError, '^Request failed$'):\n        get_json_checked(base)",
  ],
  [
    "contratto status non convertito in errore rete",
    "with expect.assertRaisesRegex(ValueError, '^Expected status 200$'):\n    get_json_checked(base + '/status/204')",
  ],
]);
cases("HTTPX sincrono", [
  [
    "successo e client chiuso",
    "factory = httpx.Client\nclients = []\ndef tracked(*args, **kwargs):\n    client = factory(*args, **kwargs)\n    clients.append(client)\n    return client\nwith patch.object(httpx, 'Client', side_effect=tracked):\n    assert get_json_sync(base + '/entities') == {'page':'0'}\nassert len(clients) == 1 and clients[0].is_closed",
  ],
  [
    "redirect e HTTPStatusError",
    "with expect.assertRaises(httpx.HTTPStatusError):\n    get_json_sync(base + '/status/302')\nassert len(calls) == 1",
  ],
  [
    "204 e ValueError",
    "with expect.assertRaises(ValueError):\n    get_json_sync(base + '/status/204')",
  ],
  [
    "JSON invalido",
    "import json\nwith expect.assertRaises(json.JSONDecodeError):\n    get_json_sync(base + '/bad-json')",
  ],
]);
cases("HTTPX asincrono", [
  [
    "chiamata nel loop del chiamante",
    "async def check():\n    assert await get_json_async(base + '/entities') == {'page':'0'}\nasyncio.run(check())",
  ],
  [
    "status errato",
    "with expect.assertRaises(httpx.HTTPStatusError):\n    asyncio.run(get_json_async(base + '/status/404'))",
  ],
  [
    "cancellazione propaga e chiude",
    "factory = httpx.AsyncClient\nclients = []\ndef tracked(*args, **kwargs):\n    client = factory(*args, **kwargs)\n    clients.append(client)\n    return client\nwith patch.object(factory, 'get', new=AsyncMock(side_effect=asyncio.CancelledError)), patch.object(httpx, 'AsyncClient', side_effect=tracked):\n    with expect.assertRaises(asyncio.CancelledError):\n        asyncio.run(get_json_async(base))\nassert len(clients) == 1 and clients[0].is_closed",
  ],
  [
    "deadline cooperativa abbreviata in prova",
    "original = asyncio.timeout\nasync def delayed(*args, **kwargs):\n    await asyncio.sleep(1)\nwith patch.object(asyncio, 'timeout', side_effect=lambda _: original(0.01)), patch.object(httpx.AsyncClient, 'get', side_effect=delayed):\n    with expect.assertRaises(TimeoutError):\n        asyncio.run(get_json_async(base))",
  ],
]);
cases("Scaricare a blocchi", [
  [
    "contenuto binario completo",
    "assert download(base + '/download', 'data.bin') == len(payload)\nassert Path('data.bin').read_bytes() == payload",
  ],
  [
    "limite esatto accettato",
    "assert download(base + '/download', 'data.bin', len(payload)) == len(payload)",
  ],
  [
    "limite superato lascia parziale dichiarato",
    "with expect.assertRaisesRegex(ValueError, 'Download too large'):\n    download(base + '/download', 'data.bin', 8192)\nassert Path('data.bin').read_bytes() == payload[:8192]",
  ],
  [
    "file esistente invariato",
    "Path('data.bin').write_bytes(b'keep')\nwith expect.assertRaises(FileExistsError):\n    download(base + '/download', 'data.bin')\nassert Path('data.bin').read_bytes() == b'keep'",
  ],
  [
    "genitore assente",
    "with expect.assertRaises(FileNotFoundError):\n    download(base + '/download', 'absent/data.bin')",
  ],
  [
    "errore HTTP non crea file",
    "with expect.assertRaises(requests.HTTPError):\n    download(base + '/status/500', 'data.bin')\nassert not Path('data.bin').exists()",
  ],
  [
    "trasporto troncato chiude file",
    "with expect.assertRaises(requests.RequestException):\n    download(base + '/truncated', 'data.bin')\nPath('data.bin').unlink()",
  ],
  [
    "risposta vuota valida",
    "assert download(base + '/empty', 'empty.bin') == 0\nassert Path('empty.bin').read_bytes() == b''",
  ],
  [
    "limiti non validi prima della rete",
    "for limit in (0, -1, True, 1.5):\n    with expect.assertRaises(ValueError):\n        download(base + '/download', 'data.bin', limit)\nassert not calls",
  ],
]);

const project = join(root, "project");
mkdirSync(join(project, "demo_app", "services"), { recursive: true });
for (const file of ["demo_app/__init__.py", "demo_app/services/__init__.py"])
  writeFileSync(join(project, file), "");
for (const file of [
  "demo_app/config.py",
  "demo_app/services/repository.py",
  "demo_app/services/report.py",
])
  writeFileSync(join(project, file), block(1, file));
writeFileSync(join(project, "imports.py"), block(1, "Import"));
writeFileSync(
  join(project, "diagnostic.py"),
  block(1, "Verificare interprete e ambiente"),
);
test("import standard e alias", () => {
  assert.equal(
    run(python, ["imports.py"], { cwd: project }).stdout.replace(/\r/g, ""),
    "True\ndata\n.json\n2026\n",
  );
});
test("entry point multifile originale via -m", () => {
  const command = block(1, "Import relativo ed entry point", "text");
  // The first text block is the tree; the command follows the report.py heading.
  assert.ok(command.includes("demo_app/"));
  const cmd = blocks[1]
    .get("demo_app/services/report.py")
    .find((n) => n.lang === "text").value;
  assert.equal(cmd, "python -m demo_app.services.report");
  assert.equal(
    run(python, cmd.split(" ").slice(1), { cwd: project }).stdout.trim(),
    "Demo: Ada",
  );
});
test("import non avvia main e riusa il modulo", () => {
  const r = py(
    "import demo_app.services.report as first\nimport demo_app.services.report as second\nassert first is second\nassert first.get_name() == 'Ada'",
    { cwd: project },
  );
  assert.equal(r.stdout, "");
});
test("avvio diretto perde il package", () => {
  const r = run(python, ["demo_app/services/report.py"], {
    cwd: project,
    status: 1,
  });
  assert.match(
    r.stderr,
    /attempted relative import with no known parent package/,
  );
});
test("shadowing locale di json rilevato", () => {
  const cwd = join(root, "shadow");
  mkdirSync(cwd);
  writeFileSync(join(cwd, "json.py"), "raise RuntimeError('local shadow')\n");
  const r = py(block(1, "Import"), { cwd, status: 1 });
  assert.match(r.stderr, /local shadow/);
});

const venv = join(project, ".venv");
const vpython = join(venv, "Scripts", "python.exe");
function cli(heading, lang = "text", options = {}) {
  const cmd = block(1, heading, lang);
  assert.ok(cmd.startsWith("python "));
  return run(
    vpython,
    cmd
      .slice(7)
      .match(/"[^"]*"|\S+/g)
      .map((a) => a.replace(/^"|"$/g, "")),
    { cwd: project, ...options },
  );
}
test("creazione reale venv e pip senza download", () => {
  const cmd = block(1, "Creare un ambiente virtuale", "text");
  assert.equal(cmd, "python -m venv .venv");
  run(packaging, cmd.split(" ").slice(1), { cwd: project });
  assert.ok(existsSync(join(venv, "pyvenv.cfg")));
  const r = cli("Verificare interprete e ambiente");
  assert.match(r.stdout, /pip .*\.venv/i);
});
test("diagnostica nel venv senza attivazione", () => {
  const r = run(vpython, ["diagnostic.py"], { cwd: project });
  assert.ok(r.stdout.includes("True"));
  assert.match(r.stdout, /Scripts\\python\.exe/i);
  run(
    vpython,
    [
      "-c",
      "import os,sys; assert sys.prefix != sys.base_prefix; assert 'VIRTUAL_ENV' not in os.environ",
    ],
    { cwd: project },
  );
});
test("pip del venv e metadati coerenti", () => {
  assert.match(
    cli("Controllare le dipendenze dichiarate").stdout,
    /No broken requirements/,
  );
  assert.equal(cli("Visualizzare lo snapshot").stdout.trim(), "");
  assert.match(
    run(vpython, ["-m", "pip", "freeze", "--all"], { cwd: project }).stdout,
    /^pip==/m,
  );
});
test("installazione requirements offline in fixture", () => {
  // A trusted local wheel replaces remote dependencies; pip's original -r command is unchanged.
  const wheel = join(
    process.env.PYTHON_PACKAGING_TOOLS,
    "wheelhouse",
    "setuptools-84.2.1-py3-none-any.whl",
  );
  assert.ok(existsSync(wheel));
  writeFileSync(
    join(project, "requirements.txt"),
    wheel.replace(/\\/g, "/") + "\n",
  );
  cli("Installare da requirements");
  assert.match(cli("Visualizzare lo snapshot").stdout, /^setuptools @ file:/m);
  assert.match(
    cli("Controllare le dipendenze dichiarate").stdout,
    /No broken requirements/,
  );
});
test("requirements non elimina pacchetti extra", () => {
  writeFileSync(join(project, "requirements.txt"), "# intentionally empty\n");
  cli("Installare da requirements");
  assert.match(cli("Visualizzare lo snapshot").stdout, /^setuptools @ file:/m);
});
test("PowerShell: percorso esplicito, attivazione, snapshot e disattivazione", () => {
  const direct = block(1, "Usare senza attivazione su Windows", "powershell");
  const activate = block(1, "Attivare su PowerShell", "powershell");
  const deactivate = block(1, "Disattivare", "text");
  const snapshot = block(1, "Salvare lo snapshot su PowerShell", "powershell");
  const script = [
    "$ErrorActionPreference = 'Stop'",
    direct,
    "if ($LASTEXITCODE -ne 0) { throw 'direct interpreter failed' }",
    "$before = $env:PATH",
    activate,
    'python -c "import sys; assert sys.prefix != sys.base_prefix"',
    "if ($LASTEXITCODE -ne 0) { throw 'wrong interpreter' }",
    snapshot,
    "if ($LASTEXITCODE -ne 0) { throw 'freeze failed' }",
    deactivate,
    "if ($env:PATH -ne $before) { throw 'PATH was not restored' }",
  ].join("\n");
  const path = join(project, "verify.ps1");
  writeFileSync(path, script);
  run("powershell.exe", ["-NoProfile", "-NonInteractive", "-File", path], {
    cwd: project,
  });
  assert.match(
    readFileSync(join(project, "requirements.snapshot.txt"), "utf8"),
    /setuptools @ file:/,
  );
});
test("freeze su toolchain pip 26.2.2", () => {
  const r = run(packaging, ["-m", "pip", "freeze"]);
  assert.doesNotMatch(r.stdout, /^pip==/m);
  assert.match(r.stdout, /^setuptools==84\.2\.1/m);
});
test("comandi non eseguiti conservano argomenti espliciti", () => {
  assert.equal(
    block(1, "Installare un pacchetto", "text"),
    'python -m pip install "requests==2.34.2"',
  );
  assert.equal(
    block(1, "Informazioni sul pacchetto", "text"),
    "python -m pip show requests",
  );
  assert.equal(
    block(1, "Aggiornare pip", "text"),
    "python -m pip install --upgrade pip",
  );
  assert.equal(
    block(1, "Attivare su Bash", "bash"),
    "source .venv/bin/activate",
  );
  assert.equal(
    block(1, "Salvare lo snapshot su Bash", "bash"),
    "python -m pip freeze > requirements.snapshot.txt",
  );
  assert.equal(
    block(1, "Usare senza attivazione su Linux o macOS", "bash"),
    "./.venv/bin/python -m pip --version",
  );
  const r = run(python, ["-m", "pip", "show", "requests"]);
  assert.match(r.stdout, /Version: 2\.34\.2/);
});
