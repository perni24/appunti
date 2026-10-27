import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, relative, isAbsolute } from "node:path";
import { test, after } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

assert.ok(
  process.env.PYTHON_DATABASE_TOOLS,
  "Set PYTHON_DATABASE_TOOLS; see README.",
);
const python = join(process.env.PYTHON_DATABASE_TOOLS, "Scripts", "python.exe");
const temp = realpathSync(tmpdir());
const root = mkdtempSync(join(temp, "appunti-python-database-test-"));
const env = { ...process.env, PYTHONUTF8: "1", PYTHONDONTWRITEBYTECODE: "1" };
delete env.PYTHONPATH;
delete env.PYTHONHOME;
after(() => {
  const actual = realpathSync(root);
  const rel = relative(temp, actual);
  assert.ok(
    rel &&
      !rel.startsWith("..") &&
      !isAbsolute(rel) &&
      actual.includes("appunti-python-database-test-"),
  );
  rmSync(actual, { recursive: true, force: true });
});
const names = ["SQLAlchemy", "Alembic", "Pydantic", "HTTPX e requests"];
const notes = names.map((n) =>
  parseNote("Programmazione/Python/Pagine/" + n + ".md"),
);
const text = (n) => n.value ?? (n.children ?? []).map(text).join("");
function block(index, heading, lang = "python") {
  const nodes = notes[index].tree.children;
  const i = nodes.findIndex((n) => n.type === "heading" && text(n) === heading);
  assert.ok(i >= 0, heading);
  const b = nodes.slice(i + 1).find((n) => n.type === "code");
  assert.equal(b.lang, lang);
  return b.value;
}
const dirs = names.map((_, i) => join(root, String(i)));
dirs.forEach((d) => mkdirSync(d));
function put(i, file, value) {
  const target = join(dirs[i], file);
  mkdirSync(resolve(target, ".."), { recursive: true });
  writeFileSync(target, value + "\n");
}
function py(i, args, status = 0) {
  const r = spawnSync(python, ["-X", "utf8", ...args], {
    cwd: dirs[i],
    env,
    encoding: "utf8",
    timeout: 45000,
    windowsHide: true,
    maxBuffer: 4 * 2 ** 20,
  });
  assert.ifError(r.error);
  if (status !== null)
    assert.equal(r.status, status, args.join(" ") + "\n" + r.stdout + r.stderr);
  return r;
}
const files = [
  ["db_demo.py", "verify_transactions.py", "db_async.py"],
  [
    "models.py",
    "migrations/env.py",
    "migrations/versions/0001_create_users.py",
    "seed.py",
    "verify_schema.py",
  ],
  ["user_models.py", "verify_models.py", "strict_demo.py", "defaults_demo.py"],
  ["api_clients.py", "http_demo.py", "post_json.py"],
];
for (const i of [0, 2, 3])
  for (const file of files[i]) put(i, file, block(i, file));
function probe(i, source) {
  return py(i, [
    "-c",
    "import unittest\nexpect = unittest.TestCase()\n" + source,
  ]);
}
function cases(i, prefix, rows) {
  for (const [name, source] of rows)
    test(names[i] + ": " + name, () => probe(i, prefix + "\n" + source));
}
test("baseline e versioni delle librerie", () => {
  probe(
    0,
    String.raw`
import sys, importlib.metadata as m
assert sys.version_info[:3] == (3,12,10)
for name, version in {
    "SQLAlchemy": "2.0.55", "alembic": "1.20.1", "pydantic": "2.14.1",
    "email-validator": "2.3.0", "aiosqlite": "0.22.1",
    "httpx": "0.28.1", "requests": "2.34.2",
}.items():
    assert m.version(name) == version, (name, m.version(name))
`,
  );
});
test("copertura estrazione di tutti i blocchi Python", () => {
  const counts = notes.map(
    (n) =>
      n.tree.children.filter((n) => n.type === "code" && n.lang === "python")
        .length,
  );
  assert.deepEqual(counts, [3, 6, 4, 3]);
});
for (const [i, scripts] of [
  [0, ["db_demo.py", "verify_transactions.py", "db_async.py"]],
  [2, ["verify_models.py", "strict_demo.py", "defaults_demo.py"]],
  [3, ["http_demo.py"]],
])
  for (const script of scripts)
    test("script della nota: " + script, () => py(i, [script]));

const sqlSetup = String.raw`
from db_demo import *
from sqlalchemy import inspect, text, MetaData, Table, Column, Integer
from sqlalchemy.exc import PendingRollbackError, MultipleResultsFound
from sqlalchemy.orm.exc import DetachedInstanceError
engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(engine)
`;
cases(0, sqlSetup, [
  [
    "chiusura senza commit annulla il flush",
    String.raw`
with Session(engine) as s:
    s.add(User(email="a@example.com"))
    s.flush()
assert list_users(engine) == []
`,
  ],
  [
    "autoflush prima di una query e rollback",
    String.raw`
with Session(engine) as s:
    user = User(email="a@example.com")
    s.add(user)
    assert user.id is None
    assert s.scalar(select(User.email)) == user.email
    assert user.id == 1
    s.rollback()
assert list_users(engine) == []
`,
  ],
  [
    "identity map e oggetto riutilizzato",
    String.raw`
create_user(engine, "a@example.com")
with Session(engine) as s:
    first = s.get(User, 1)
    assert s.get(User, 1) is first
    assert s.scalars(select(User)).one() is first
`,
  ],
  [
    "commit scade gli attributi e chiusura impedisce il reload",
    String.raw`
with Session(engine) as s:
    user = User(email="a@example.com")
    s.add(user)
    s.commit()
    assert inspect(user).expired
with expect.assertRaises(DetachedInstanceError):
    _ = user.email
`,
  ],
  [
    "sessione fallita richiede rollback esplicito",
    String.raw`
create_user(engine, "a@example.com")
with Session(engine) as s:
    s.add(User(email="a@example.com"))
    with expect.assertRaises(IntegrityError):
        s.flush()
    with expect.assertRaises(PendingRollbackError):
        s.scalar(select(User.id))
    s.rollback()
    assert s.scalar(select(User.id)) == 1
`,
  ],
  [
    "transazione con due inserimenti resta atomica",
    String.raw`
with expect.assertRaises(IntegrityError):
    with Session(engine) as s, s.begin():
        s.add_all([User(email="a"), User(email="a")])
assert list_users(engine) == []
`,
  ],
  [
    "query prima di begin attiva autobegin",
    String.raw`
from sqlalchemy.exc import InvalidRequestError
with Session(engine) as s:
    s.execute(select(User))
    assert s.in_transaction()
    with expect.assertRaises(InvalidRequestError):
        with s.begin():
            pass
`,
  ],
  [
    "scalar_one_or_none rifiuta righe multiple",
    String.raw`
create_user(engine, "a")
create_user(engine, "b")
with Session(engine) as s:
    with expect.assertRaises(MultipleResultsFound):
        s.execute(select(User)).scalar_one_or_none()
`,
  ],
  [
    "repository non conferma autonomamente e query parametrizzata",
    String.raw`
email = "' OR 1=1 --"
with Session(engine) as s:
    UserRepository(s).create(email)
    assert UserRepository(s).get_by_email(email).email == email
assert list_users(engine) == []
create_user(engine, email)
assert len(list_users(engine)) == 1
`,
  ],
  [
    "create_all non altera una tabella esistente",
    String.raw`
metadata = MetaData()
Table("users", metadata, Column("id", Integer, primary_key=True), Column("extra", Integer))
metadata.create_all(engine)
assert "extra" not in {c["name"] for c in inspect(engine).get_columns("users")}
`,
  ],
  [
    "SQLite non applica String(254) come limite di lunghezza",
    String.raw`
value = "a" * 300
assert create_user(engine, value)["email"] == value
`,
  ],
  [
    "NOT NULL applicato dal database",
    String.raw`
with expect.assertRaises(IntegrityError):
    create_user(engine, None)
assert list_users(engine) == []
`,
  ],
]);

test("Alembic: procedura completa, migrazioni e controprove", async (t) => {
  const alembic = (...args) => py(1, ["-m", "alembic", ...args]);
  await t.test("inizializzazione CLI reale", () => {
    alembic("init", "migrations");
    alembic("revision", "--rev-id", "0001", "-m", "create users");
    for (const file of files[1]) put(1, file, block(1, file));
    put(1, "alembic.ini", block(1, "alembic.ini", "ini"));
  });
  await t.test("prima revisione e SQL offline", () => {
    const sql = alembic("upgrade", "0001", "--sql").stdout;
    assert.match(sql, /CREATE TABLE users/);
    assert.equal(readdirSync(dirs[1]).includes("demo.db"), false);
    assert.match(alembic("history", "--verbose").stdout, /0001/);
  });
  await t.test("upgrade da database vuoto e check", () => {
    alembic("upgrade", "head");
    assert.match(alembic("current").stdout, /0001/);
    alembic("check");
    py(1, ["seed.py"]);
  });
  await t.test("check rileva colonna non ancora migrata", () => {
    const addition = notes[1].tree.children.find(
      (n) =>
        n.type === "code" &&
        n.lang === "python" &&
        n.value.includes("display_name: Mapped"),
    );
    assert.ok(addition);
    put(1, "models.py", block(1, "models.py") + "\n" + addition.value);
    const r = py(1, ["-m", "alembic", "check"], null);
    assert.notEqual(r.status, 0);
    assert.match(r.stdout + r.stderr, /display_name/);
  });
  await t.test("autogenerate genera il solo add_column e il downgrade", () => {
    alembic(
      "revision",
      "--autogenerate",
      "--rev-id",
      "0002",
      "-m",
      "add display name",
    );
    const path = readdirSync(join(dirs[1], "migrations/versions")).find((n) =>
      n.startsWith("0002"),
    );
    const revision = readFileSync(
      join(dirs[1], "migrations/versions", path),
      "utf8",
    );
    assert.match(revision, /add_column/);
    assert.match(revision, /drop_column/);
    assert.doesNotMatch(revision, /drop_table/);
    assert.match(revision, /nullable=True/);
  });
  await t.test("upgrade conserva dati e verificatore originale riesce", () => {
    alembic("upgrade", "head");
    py(1, ["verify_schema.py"]);
    alembic("check");
    assert.match(alembic("heads").stdout, /0002/);
    assert.match(alembic("current").stdout, /0002/);
  });
  await t.test(
    "downgrade elimina la colonna ma conserva gli altri dati",
    () => {
      probe(
        1,
        String.raw`
from sqlalchemy import create_engine, text
with create_engine("sqlite:///demo.db").begin() as c:
    c.execute(text("UPDATE users SET display_name='Alice'"))
`,
      );
      alembic("downgrade", "0001");
      probe(
        1,
        String.raw`
from sqlalchemy import create_engine, inspect, text
e = create_engine("sqlite:///demo.db")
assert "display_name" not in {c["name"] for c in inspect(e).get_columns("users")}
with e.connect() as c:
    assert c.scalar(text("SELECT email FROM users")) == "alice@example.com"
e.dispose()
`,
      );
    },
  );
  await t.test("nuovo upgrade non ripristina il nome cancellato", () => {
    alembic("upgrade", "head");
    py(1, ["verify_schema.py"]);
    alembic("check");
  });
  await t.test("stamp cambia il marcatore, non lo schema", () => {
    alembic("stamp", "0001");
    py(1, ["verify_schema.py"]);
    assert.match(alembic("current").stdout, /0001/);
    alembic("stamp", "0002");
  });
  await t.test("downgrade base cancella realmente la tabella", () => {
    alembic("downgrade", "base");
    probe(
      1,
      String.raw`
from sqlalchemy import create_engine, inspect
e = create_engine("sqlite:///demo.db")
assert "users" not in inspect(e).get_table_names()
e.dispose()
`,
    );
  });
});

const pydanticSetup = String.raw`
from user_models import *
from pydantic import ValidationError, TypeAdapter
payload = {"email":"alice@example.com", "display_name":" Alice ", "age":42}
`;
cases(2, pydanticSetup, [
  [
    "limiti age e tipo bool rifiutato",
    String.raw`
for value in [-1, 131, True, "42", 42.5, None]:
    with expect.assertRaises(ValidationError):
        CreateUserRequest.model_validate(payload | {"age":value})
for value in [0, 130]:
    assert CreateUserRequest.model_validate(payload | {"age":value}).age == value
`,
  ],
  [
    "nome normalizzato prima del controllo lunghezza",
    String.raw`
assert CreateUserRequest(**(payload | {"display_name":" " + "a"*100 + " "})).display_name == "a"*100
for value in [" " * 3, "a"*101, 42]:
    with expect.assertRaises(ValidationError):
        CreateUserRequest(**(payload | {"display_name":value}))
`,
  ],
  [
    "errori annidati e extra vietati anche nel modello figlio",
    String.raw`
for address, loc in [({"city":123}, ("address","city")), ({"city":"Roma","secret":True}, ("address","secret"))]:
    try:
        CreateUserRequest(**(payload | {"address":address}))
    except ValidationError as e:
        assert loc in [item["loc"] for item in e.errors()]
    else:
        raise AssertionError("Invalid input accepted")
`,
  ],
  [
    "factory produce liste indipendenti",
    String.raw`
a, b = CreateUserRequest(**payload), CreateUserRequest(**payload)
a.labels.append("staff")
assert b.labels == []
`,
  ],
  [
    "assegnazione validata ma append non intercettato",
    String.raw`
user = CreateUserRequest(**payload)
with expect.assertRaises(ValidationError):
    user.age = "bad"
assert user.age == 42
user.labels.append(123)
assert user.labels[-1] == 123
`,
  ],
  [
    "model_copy e construct non validano input",
    String.raw`
user = CreateUserRequest(**payload)
assert user.model_copy(update={"age":"bad"}).age == "bad"
assert CreateUserRequest.model_construct(age="bad").age == "bad"
`,
  ],
  [
    "istanza di default riusata senza rivalidazione",
    String.raw`
user = CreateUserRequest(**payload)
user.labels.append(123)
assert CreateUserRequest.model_validate(user) is user
`,
  ],
  [
    "nullable non equivale a omissibile",
    String.raw`
class Required(BaseModel):
    name: str | None
assert Required(name=None).name is None
with expect.assertRaises(ValidationError):
    Required()
`,
  ],
  [
    "dump Python e JSON per date",
    String.raw`
from datetime import date
class Event(BaseModel):
    day: date
event = Event(day=date(2026,1,2))
assert isinstance(event.model_dump()["day"], date)
assert event.model_dump(mode="json")["day"] == "2026-01-02"
assert isinstance(event.model_dump_json(), str)
`,
  ],
  [
    "schema espone vincoli ma non la normalizzazione custom",
    String.raw`
schema = CreateUserRequest.model_json_schema()
assert schema["additionalProperties"] is False
assert schema["properties"]["age"]["maximum"] == 130
assert schema["properties"]["display_name"]["minLength"] == 1
assert schema["properties"]["email"]["format"] == "email"
`,
  ],
  [
    "sanificazione errori evita input e contesto",
    String.raw`
try:
    CreateUserRequest(**(payload | {"age":"TOP_SECRET"}))
except ValidationError as e:
    safe = [{"loc":x["loc"], "type":x["type"]} for x in e.errors(include_input=False, include_context=False)]
    assert "TOP_SECRET" not in str(safe)
else:
    raise AssertionError("Expected validation failure")
`,
  ],
  [
    "output pubblico non contiene email",
    String.raw`
user = CreateUserRequest(**payload)
assert public_user(3,user).model_dump() == {"id":3, "display_name":"Alice"}
with expect.assertRaises(ValidationError):
    public_user(True,user)
`,
  ],
]);

const httpSetup = String.raw`
import asyncio, json, threading, time
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from api_clients import *
from post_json import create_remote_user

@contextmanager
def server(status=200, body=b'{"id":1,"name":"Alice"}', content_type="application/json", delay=0):
    seen = []
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            seen.append(self.path)
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            if status == 302:
                self.send_header("Location", "/redirect-target")
            self.end_headers()
            if delay:
                time.sleep(delay)
            try:
                self.wfile.write(body)
            except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
                pass
        def do_POST(self):
            data = self.rfile.read(int(self.headers["Content-Length"]))
            seen.append((self.headers["Content-Type"], json.loads(data)))
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        def log_message(self,*args):
            pass
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=lambda: httpd.serve_forever(poll_interval=0.01))
    thread.start()
    try:
        yield f"http://127.0.0.1:{httpd.server_port}/user", seen
    finally:
        httpd.shutdown()
        httpd.server_close()
        thread.join()

def fetch(mode, url, limit=MAX_BYTES):
    if mode == "requests":
        with requests.Session() as s:
            s.trust_env = False
            return get_user_requests(s,url,limit=limit)
    if mode == "sync":
        with httpx.Client(timeout=HTTPX_TIMEOUT,trust_env=False) as c:
            return get_user_httpx(c,url,limit=limit)
    async def run():
        async with httpx.AsyncClient(timeout=HTTPX_TIMEOUT,trust_env=False) as c:
            return await get_user_async(c,url,limit=limit)
    return asyncio.run(run())
`;
for (const mode of ["requests", "sync", "async"]) {
  cases(3, httpSetup + "\nmode = " + JSON.stringify(mode), [
    [
      mode + ": successo su socket reale e filtro output",
      String.raw`
with server(body=b'{"id":1,"name":" Alice ","private":"secret"}') as (url,seen):
    assert fetch(mode,url) == {"id":1,"name":"Alice"}
    assert seen == ["/user"]
`,
    ],
    [
      mode + ": errori HTTP propagati",
      String.raw`
error = requests.HTTPError if mode == "requests" else httpx.HTTPStatusError
with server(status=503) as (url,seen):
    with expect.assertRaises(error):
        fetch(mode,url)
`,
    ],
    [
      mode + ": redirect non seguito",
      String.raw`
error = ValueError if mode == "requests" else httpx.HTTPStatusError
with server(status=302) as (url,seen):
    with expect.assertRaises(error):
        fetch(mode,url)
    assert seen == ["/user"]
`,
    ],
    [
      mode + ": JSON invalido e Content-Type errato",
      String.raw`
for body, media in [(b"{", "application/json"), (b'{"id":1,"name":"Alice"}', "text/html")]:
    with server(body=body, content_type=media) as (url,seen):
        with expect.assertRaises(ValueError):
            fetch(mode,url)
`,
    ],
    [
      mode + ": limite del body ed esatto confine",
      String.raw`
body = b'{"id":1,"name":"Alice"}'
with server(body=body) as (url,seen):
    with expect.assertRaisesRegex(ValueError,"troppo grande"):
        fetch(mode,url,limit=len(body)-1)
    assert fetch(mode,url,limit=len(body))["id"] == 1
`,
    ],
    [
      mode + ": risposta 204 non trattata come utente",
      String.raw`
with server(status=204,body=b"") as (url,seen):
    with expect.assertRaises(ValueError):
        fetch(mode,url)
`,
    ],
  ]);
}
cases(3, httpSetup, [
  [
    "schema rifiuta bool, array e nomi vuoti",
    String.raw`
for data in [[], {"id":True,"name":"Alice"}, {"id":0,"name":"Alice"}, {"id":1,"name":" "}, {"id":1,"name":2}]:
    with expect.assertRaises(ValueError):
        parse_user("application/json",json.dumps(data).encode())
`,
  ],
  [
    "media type normalizzato e UTF-8 invalido rifiutato",
    String.raw`
assert parse_user("Application/JSON; charset=utf-8",b'{"id":1,"name":"Alice"}')["id"] == 1
with expect.assertRaises(UnicodeDecodeError):
    parse_user("application/json",b"\xff")
`,
  ],
  [
    "POST usa JSON e richiede status 201",
    String.raw`
with server(status=201) as (url,seen):
    with requests.Session() as s:
        s.trust_env = False
        assert create_remote_user(s,url,{"email":"a@example.com"})["id"] == 1
    assert seen == [("application/json",{"email":"a@example.com"})]
with server(status=200) as (url,seen):
    with requests.Session() as s:
        s.trust_env = False
        with expect.assertRaises(ValueError):
            create_remote_user(s,url,{})
`,
  ],
  [
    "timeout di lettura HTTPX su socket reale",
    String.raw`
with server(delay=0.4) as (url,seen):
    with httpx.Client(timeout=httpx.Timeout(2, read=0.05), trust_env=False) as c:
        with expect.assertRaises(httpx.ReadTimeout):
            get_user_httpx(c,url)
`,
  ],
  [
    "deadline async esterna su risposta in attesa",
    String.raw`
with server(delay=0.4) as (url,seen):
    async def run():
        async with httpx.AsyncClient(timeout=HTTPX_TIMEOUT,trust_env=False) as c:
            with expect.assertRaises(TimeoutError):
                async with asyncio.timeout(0.05):
                    await get_user_async(c,url)
    asyncio.run(run())
`,
  ],
  [
    "stream HTTPX chiuso dopo errore di dimensione",
    String.raw`
class Stream(httpx.SyncByteStream):
    closed = False
    def __iter__(self):
        yield b"x" * 20
    def close(self):
        self.closed = True
stream = Stream()
transport = httpx.MockTransport(lambda r: httpx.Response(200, stream=stream))
with httpx.Client(transport=transport) as c:
    with expect.assertRaises(ValueError):
        get_user_httpx(c,"https://example.test",limit=1)
assert stream.closed
`,
  ],
]);
