import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  realpathSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, relative, isAbsolute } from "node:path";
import { test, after } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const tools = process.env.PYTHON_WEB_TOOLS;
assert.ok(tools, "Set PYTHON_WEB_TOOLS; see README.");
assert.equal(process.platform, "win32", "Baseline Windows.");
const python = join(tools, "Scripts", "python.exe");
const temp = realpathSync(tmpdir());
const root = mkdtempSync(join(temp, "appunti-python-web-test-"));
const env = { ...process.env, PYTHONUTF8: "1", PYTHONDONTWRITEBYTECODE: "1" };
delete env.PYTHONPATH;
delete env.PYTHONHOME;
delete env.DJANGO_SETTINGS_MODULE;
after(() => {
  const actual = realpathSync(root);
  const rel = relative(temp, actual);
  assert.ok(
    rel &&
      !rel.startsWith("..") &&
      !isAbsolute(rel) &&
      actual.includes("appunti-python-web-test-"),
  );
  rmSync(actual, { recursive: true, force: true });
});
const names = ["Flask", "Starlette", "FastAPI", "Django"];
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
function put(folder, file, value) {
  const target = join(folder, file);
  mkdirSync(resolve(target, ".."), { recursive: true });
  writeFileSync(target, value + "\n", "utf8");
}
const dirs = names.map((n) => join(root, n.toLowerCase()));
dirs.forEach((d) => mkdirSync(d));
function py(index, args, { status = 0, timeout = 60000 } = {}) {
  const r = spawnSync(python, ["-X", "utf8", ...args], {
    cwd: dirs[index],
    env,
    encoding: "utf8",
    windowsHide: true,
    timeout,
    maxBuffer: 8 * 2 ** 20,
  });
  assert.ifError(r.error);
  if (status !== null)
    assert.equal(r.status, status, args.join(" ") + "\n" + r.stdout + r.stderr);
  return r;
}
const modules = ["flask_app", "starlette_app", "fastapi_app"];
for (let i = 0; i < 3; i++) {
  put(dirs[i], modules[i] + ".py", block(i, modules[i] + ".py"));
  put(
    dirs[i],
    "verify_" + names[i].toLowerCase() + ".py",
    block(i, "verify_" + names[i].toLowerCase() + ".py"),
  );
}
py(3, ["-m", "django", "startproject", "config", "."]);
py(3, ["manage.py", "startapp", "profiles"]);
const settings = join(dirs[3], "config/settings.py");
writeFileSync(
  settings,
  readFileSync(settings, "utf8") + "\n" + block(3, "config/settings.py") + "\n",
);
for (const name of [
  "profiles/models.py",
  "profiles/forms.py",
  "profiles/views.py",
  "profiles/urls.py",
  "config/urls.py",
  "profiles/admin.py",
  "profiles/tests.py",
])
  put(dirs[3], name, block(3, name));
put(
  dirs[3],
  "profiles/templates/profiles/detail.html",
  block(3, "profiles/templates/profiles/detail.html", "html"),
);
py(3, ["manage.py", "makemigrations", "profiles", "--noinput"]);
py(3, ["manage.py", "migrate", "--noinput"]);
function probe(index, code) {
  const setup =
    index === 3
      ? String.raw`
import os
os.environ["DJANGO_SETTINGS_MODULE"]="config.settings"
import django
django.setup()
from django.test import Client, override_settings
from django.db import transaction
from profiles.models import UserProfile
from profiles.forms import UserProfileForm
with override_settings(ALLOWED_HOSTS=["testserver"]):
    with transaction.atomic():
        try:
            exec(PROBE)
        finally:
            transaction.set_rollback(True)
`.replace("PROBE", JSON.stringify(code))
      : "from " + modules[index] + " import *\n" + code;
  return py(index, [
    "-c",
    "import unittest\nexpect=unittest.TestCase()\n" + setup,
  ]);
}
function cases(index, rows) {
  for (const [name, source] of rows)
    test(names[index] + ": " + name, () => probe(index, source));
}

test("baseline e toolchain web", () => {
  const r = py(0, [
    "-c",
    String.raw`
import sys, json, importlib.metadata as m
assert sys.version_info[:3] == (3,12,10)
print(json.dumps({n:m.version(n) for n in ["Flask","Werkzeug","starlette","fastapi","pydantic","Django","httpx","httpx2","uvicorn","websockets"]}))
`,
  ]);
  assert.deepEqual(JSON.parse(r.stdout), {
    Flask: "3.1.3",
    Werkzeug: "3.1.9",
    starlette: "1.10.0",
    fastapi: "0.162.0",
    pydantic: "2.14.1",
    Django: "5.2.18",
    httpx: "0.28.1",
    httpx2: "2.16.0",
    uvicorn: "0.54.0",
    websockets: "17.3",
  });
});
names.forEach((name, i) =>
  test(name + ": struttura e blocchi", () => {
    assert.equal(notes[i].data.status, "non revisionato");
    assert.equal(notes[i].data.publish, true);
    assert.equal(notes[i].data.type, "technical-note");
    assert.match(notes[i].body, /3\.12\.10/);
    assert.ok(notes[i].body.includes("## Fonti"));
    assert.equal(
      notes[i].tree.children.filter(
        (n) => n.type === "code" && n.lang === "python",
      ).length,
      [2, 2, 2, 8][i],
    );
  }),
);
for (let i = 0; i < 3; i++)
  test(names[i] + ": verificatore originale", () => {
    assert.match(
      py(i, ["verify_" + names[i].toLowerCase() + ".py"]).stdout,
      /demo ok/,
    );
  });

cases(0, [
  [
    "normalizzazione valida e non mutante",
    String.raw`
data={"label":"  Test  "}
assert normalize_label(data)=="Test" and data=={"label":"  Test  "}
assert normalize_label({"label":"x"*80})=="x"*80
`,
  ],
  [
    "schema e limiti rifiutati",
    String.raw`
for data in [None,[],{},{"label":True},{"label":1},{"label":None},{"label":""},{"label":" \n "},{"label":"x"*81},{"label":"ok","extra":0}]:
    with expect.assertRaises(ValueError): normalize_label(data)
`,
  ],
  [
    "JSON invalido e Content-Type distinti",
    String.raw`
c=create_app({"TESTING":True}).test_client()
assert c.post("/api/normalize",data="{",content_type="application/json").status_code==400
assert c.post("/api/normalize",data='{"label":"ok"}',content_type="text/plain").status_code==415
assert c.post("/api/normalize",data='{"label":"ok"}',content_type="application/demo+json").json=={"label":"ok"}
assert c.post("/api/normalize",data="null",content_type="application/json").status_code==400
`,
  ],
  [
    "body limit e configurazioni isolate",
    String.raw`
small=create_app({"TESTING":True,"MAX_CONTENT_LENGTH":16})
normal=create_app({"TESTING":True})
assert small.test_client().post("/api/normalize",json={"label":"x"*50}).status_code==413
assert normal.test_client().post("/api/normalize",json={"label":"x"*50}).status_code==200
`,
  ],
  [
    "routing, HEAD, OPTIONS e header Allow",
    String.raw`
c=create_app({"TESTING":True}).test_client()
for path in ["/api/users/nope","/api/users/-1","/api/users/0","/missing"]:
    assert c.get(path).status_code==404
assert c.head("/api/health").data==b""
assert c.options("/api/health").status_code==200
r=c.delete("/api/health")
assert r.status_code==405 and "GET" in r.headers["Allow"] and r.is_json
`,
  ],
  [
    "request e current_app richiedono il contesto",
    String.raw`
from flask import current_app, request, url_for
a=create_app()
with expect.assertRaises(RuntimeError): current_app.name
with expect.assertRaises(RuntimeError): request.path
with a.test_request_context("/api/health"):
    assert current_app._get_current_object() is a
    assert url_for("api.user_detail",user_id=1)=="/api/users/1"
`,
  ],
  [
    "errori inattesi non convertiti in input invalido",
    String.raw`
a=create_app({"TESTING":True})
@a.get("/boom")
def boom(): raise RuntimeError("private failure")
with expect.assertRaises(RuntimeError): a.test_client().get("/boom")
a.config.update(TESTING=False,PROPAGATE_EXCEPTIONS=False)
r=a.test_client().get("/boom")
assert r.status_code==500 and r.json=={"error":"Internal Server Error"}
assert b"private failure" not in r.data
`,
  ],
  [
    "test client non prova escaping Jinja: controprova reale",
    String.raw`
from flask import render_template_string
a=create_app()
with a.app_context():
    assert render_template_string("<p>{{ value }}</p>",value="<script>")=="<p>&lt;script&gt;</p>"
`,
  ],
]);
test("Flask: CLI scopre la factory", () => {
  const out = py(0, [
    "-m",
    "flask",
    "--app",
    "flask_app:create_app",
    "routes",
  ]).stdout;
  assert.match(out, /api\.normalize/);
});
test("Flask: server WSGI reale su loopback", () =>
  probe(
    0,
    String.raw`
import json, threading, urllib.request
from werkzeug.serving import make_server
server=make_server("127.0.0.1",0,create_app())
thread=threading.Thread(target=server.serve_forever,daemon=True)
thread.start()
try:
    with urllib.request.urlopen(f"http://127.0.0.1:{server.server_port}/api/health",timeout=5) as r:
        assert json.load(r)=={"status":"ok"}
finally:
    server.shutdown()
    server.server_close()
    thread.join(5)
assert not thread.is_alive()
`,
  ));

cases(1, [
  [
    "lifespan, client condiviso e chiusura",
    String.raw`
from starlette.testclient import TestClient
local=create_app()
with TestClient(local) as c:
    resource=local.state.http_client
    assert not resource.is_closed
    assert c.get("/health").json()=={"ready":True}
    assert c.get("/health").json()=={"ready":True}
    assert local.state.http_client is resource
assert resource.is_closed
with TestClient(local) as c:
    assert local.state.http_client is not resource
assert local.state.http_client.is_closed
`,
  ],
  [
    "TestClient senza with non avvia lifespan",
    String.raw`
from starlette.testclient import TestClient
local=create_app()
with expect.assertRaises(AttributeError): local.state.http_client
c=TestClient(local)
try:
    with expect.assertRaises(AttributeError): c.get("/health")
finally: c.close()
`,
  ],
  [
    "path, metodi e header preservati",
    String.raw`
from starlette.testclient import TestClient
with TestClient(create_app()) as c:
    for path in ["/users/a","/users/-1","/users/0","/users/2","/missing"]:
        assert c.get(path).status_code==404
    r=c.post("/users/1")
    assert r.status_code==405 and "GET" in r.headers["Allow"]
    assert c.head("/users/1").content==b""
`,
  ],
  [
    "CORS origin e preflight consentiti",
    String.raw`
from starlette.testclient import TestClient
with TestClient(app) as c:
    r=c.options("/users/1",headers={"Origin":DEMO_ORIGIN,"Access-Control-Request-Method":"GET"})
    assert r.status_code==200
    assert r.headers["access-control-allow-origin"]==DEMO_ORIGIN
    assert "origin" in r.headers["vary"].lower()
`,
  ],
  [
    "CORS non autorizza o blocca ogni richiesta",
    String.raw`
from starlette.testclient import TestClient
with TestClient(app) as c:
    r=c.get("/users/1",headers={"Origin":"https://untrusted.example"})
    assert r.status_code==200 and "access-control-allow-origin" not in r.headers
    r=c.options("/users/1",headers={"Origin":DEMO_ORIGIN,"Access-Control-Request-Method":"POST"})
    assert r.status_code==400
`,
  ],
  [
    "CORS esterno mantiene header anche su 500",
    String.raw`
from starlette.testclient import TestClient
from starlette.routing import Route
async def boom(request): raise RuntimeError("private")
local=create_app()
local.router.routes.append(Route("/boom",boom))
outer=CORSMiddleware(local,allow_origins=[DEMO_ORIGIN])
with TestClient(outer,raise_server_exceptions=False) as c:
    r=c.get("/boom",headers={"Origin":DEMO_ORIGIN})
    assert r.status_code==500 and r.headers["access-control-allow-origin"]==DEMO_ORIGIN
    assert "private" not in r.text
`,
  ],
  [
    "WebSocket testo, vuoto e limite UTF-8",
    String.raw`
from starlette.testclient import TestClient
with TestClient(app) as c:
    with c.websocket_connect("/ws",headers={"Origin":DEMO_ORIGIN}) as ws:
        for message in ["","ciao","x"*1024]:
            ws.send_text(message)
            assert ws.receive_text()==message
        ws.send_text("é"*513)
        with expect.assertRaises(WebSocketDisconnect) as error: ws.receive_text()
        assert error.exception.code==1009
`,
  ],
  [
    "WebSocket frame binario rifiutato",
    String.raw`
from starlette.testclient import TestClient
with TestClient(app) as c:
    with c.websocket_connect("/ws",headers={"Origin":DEMO_ORIGIN}) as ws:
        ws.send_bytes(b"x")
        with expect.assertRaises(WebSocketDisconnect) as error: ws.receive_text()
        assert error.exception.code==1003
`,
  ],
  [
    "WebSocket origine assente o estranea rifiutata",
    String.raw`
from starlette.testclient import TestClient
with TestClient(app) as c:
    for headers in [{},{"Origin":"https://untrusted.example"}]:
        with expect.assertRaises(WebSocketDisconnect):
            with c.websocket_connect("/ws",headers=headers): pass
`,
  ],
  [
    "BackgroundTasks fallisce e non esegue le successive",
    String.raw`
import asyncio
from starlette.background import BackgroundTasks
events=[]
def fail():
    events.append("first")
    raise RuntimeError("failure")
tasks=BackgroundTasks()
tasks.add_task(fail)
tasks.add_task(events.append,"second")
with expect.assertRaises(RuntimeError): asyncio.run(tasks())
assert events==["first"]
`,
  ],
  [
    "endpoint sync eseguito fuori dal thread del loop",
    String.raw`
import threading
from starlette.testclient import TestClient
from starlette.routing import Route
threads={}
async def loop_id(request):
    threads["loop"]=threading.get_ident()
    return JSONResponse({"ok":True})
def sync_id(request):
    threads["sync"]=threading.get_ident()
    return JSONResponse({"ok":True})
local=Starlette(routes=[Route("/async",loop_id),Route("/sync",sync_id)])
with TestClient(local) as c:
    assert c.get("/async").status_code==200
    assert c.get("/sync").status_code==200
assert threads["loop"]!=threads["sync"]
`,
  ],
]);

cases(2, [
  [
    "quantita strict, intervalli e campi extra",
    String.raw`
from fastapi.testclient import TestClient
with TestClient(create_app()) as c:
    for quantity in [True,False,"2",2.0,0,-1,101,None]:
        assert c.post("/api/quotes",json={"sku":"A-1","quantity":quantity}).status_code==422
    for payload in [{},{"sku":"A-1"},{"sku":"A-1","quantity":1,"extra":"x"},[],None]:
        assert c.post("/api/quotes",json=payload).status_code==422
    for quantity in [1,100]:
        assert c.post("/api/quotes",json={"sku":"A-1","quantity":quantity}).json()["total_cents"]==1250*quantity
`,
  ],
  [
    "sku path e body con stesso dominio",
    String.raw`
from fastapi.testclient import TestClient
with TestClient(create_app()) as c:
    for sku in ["abc","A_1","A"*33]:
        assert c.get("/api/prices/"+sku).status_code==422
        assert c.post("/api/quotes",json={"sku":sku,"quantity":1}).status_code==422
    assert c.get("/api/prices/A-1").json()=={"sku":"A-1","unit_cents":1250}
    assert c.get("/api/prices/B-2").status_code==404
`,
  ],
  [
    "JSON malformato, 404 e 405",
    String.raw`
from fastapi.testclient import TestClient
with TestClient(create_app()) as c:
    assert c.post("/api/quotes",content="{",headers={"Content-Type":"application/json"}).status_code==422
    assert c.get("/missing").status_code==404
    assert c.get("/api/quotes").status_code==405
`,
  ],
  [
    "output filtra campo interno e non cambia il servizio",
    String.raw`
from fastapi.testclient import TestClient
assert "internal_note" in QuoteService().quote("A-1",1)
with TestClient(create_app()) as c:
    r=c.post("/api/quotes",json={"sku":"A-1","quantity":1})
    assert set(r.json())=={"sku","quantity","total_cents"} and r.status_code==200
`,
  ],
  [
    "OpenAPI ha route singola, input richiesto e output distinto",
    String.raw`
from fastapi.testclient import TestClient
local=create_app()
paths=[r.path for r in router.routes]
assert paths.count("/api/quotes")==1
with TestClient(local) as c:
    spec=c.get("/openapi.json").json()
op=spec["paths"]["/api/quotes"]["post"]
assert op["requestBody"]["required"]
assert "200" in op["responses"] and "422" in op["responses"]
assert spec["components"]["schemas"]["QuoteIn"]["additionalProperties"] is False
assert "internal_note" not in spec["components"]["schemas"]["QuoteOut"]["properties"]
`,
  ],
  [
    "risposta incompatibile e errore server non 422",
    String.raw`
from fastapi.testclient import TestClient
from fastapi.exceptions import ResponseValidationError
class Broken:
    def quote(self,sku,quantity): return {"sku":sku}
local=create_app()
local.dependency_overrides[get_service]=Broken
with TestClient(local) as c:
    with expect.assertRaises(ResponseValidationError):
        c.post("/api/quotes",json={"sku":"A-1","quantity":1})
with TestClient(local,raise_server_exceptions=False) as c:
    assert c.post("/api/quotes",json={"sku":"A-1","quantity":1}).status_code==500
local.dependency_overrides.clear()
`,
  ],
  [
    "dependency errore inatteso propagato",
    String.raw`
from fastapi.testclient import TestClient
def fail(): raise RuntimeError("broken service")
local=create_app()
local.dependency_overrides[get_service]=fail
with TestClient(local) as c:
    with expect.assertRaises(RuntimeError): c.get("/api/prices/A-1")
local.dependency_overrides.clear()
`,
  ],
  [
    "factory e override isolati",
    String.raw`
from fastapi.testclient import TestClient
a,b=create_app(),create_app()
class Fixed:
    def unit_price(self,sku): return 99
a.dependency_overrides[get_service]=Fixed
with TestClient(a) as ca,TestClient(b) as cb:
    assert ca.get("/api/prices/A-1").json()["unit_cents"]==99
    assert cb.get("/api/prices/A-1").json()["unit_cents"]==1250
a.dependency_overrides.clear()
`,
  ],
  [
    "Response esplicita bypassa response_model",
    String.raw`
from fastapi.testclient import TestClient
from fastapi.responses import JSONResponse
local=FastAPI()
@local.get("/raw",response_model=PriceOut)
def raw(): return JSONResponse({"internal_note":"counterexample"})
with TestClient(local) as c:
    assert c.get("/raw").json()=={"internal_note":"counterexample"}
`,
  ],
  [
    "yield cleanup prima o dopo invio secondo scope",
    String.raw`
import asyncio
from fastapi.responses import JSONResponse
for scope,expected in [
    ("function",["enter","endpoint","exit","sent"]),
    ("request",["enter","endpoint","sent","exit"]),
]:
    events=[]
    async def resource():
        events.append("enter")
        try: yield object()
        finally: events.append("exit")
    local=FastAPI()
    @local.get("/")
    async def endpoint(value=Depends(resource,scope=scope)):
        events.append("endpoint")
        return JSONResponse({"ok":True})
    async def send(message):
        if message["type"]=="http.response.body" and not message.get("more_body",False):
            events.append("sent")
    async def receive():
        return {"type":"http.request","body":b"","more_body":False}
    request={"type":"http","asgi":{"version":"3.0"},"http_version":"1.1",
             "method":"GET","scheme":"http","path":"/","raw_path":b"/",
             "query_string":b"","headers":[],"client":("127.0.0.1",1),"server":("test",80),"root_path":""}
    asyncio.run(local(request,receive,send))
    assert events==expected,events
`,
  ],
  [
    "dependency yield chiusa anche con HTTPException",
    String.raw`
from fastapi.testclient import TestClient
events=[]
def resource():
    try: yield object()
    finally: events.append("closed")
local=FastAPI()
@local.get("/")
def endpoint(value=Depends(resource)):
    raise HTTPException(409,"demo")
with TestClient(local) as c:
    assert c.get("/").status_code==409
assert events==["closed"]
`,
  ],
]);

for (const i of [1, 2])
  test(names[i] + ": HTTP reale con Uvicorn e shutdown", () =>
    probe(
      i,
      String.raw`
import json, socket, threading, time, urllib.request
import uvicorn
server=uvicorn.Server(uvicorn.Config(app,log_level="error",lifespan="on"))
sock=socket.socket()
sock.bind(("127.0.0.1",0))
port=sock.getsockname()[1]
thread=threading.Thread(target=server.run,kwargs={"sockets":[sock]},daemon=True)
thread.start()
try:
    deadline=time.monotonic()+10
    while not server.started:
        if not thread.is_alive() or time.monotonic()>deadline:
            raise AssertionError("server did not start")
        time.sleep(.01)
    with urllib.request.urlopen(f"http://127.0.0.1:{port}/ENDPOINT",timeout=5) as response:
        assert response.status==200 and isinstance(json.load(response),dict)
finally:
    server.should_exit=True
    thread.join(10)
    sock.close()
assert not thread.is_alive()
`.replace("ENDPOINT", i === 1 ? "health" : "api/prices/A-1"),
    ),
  );

test("Django: sette test originali su database di test", () => {
  const r = py(3, ["manage.py", "test", "profiles", "--noinput"]);
  assert.match(r.stdout + r.stderr, /Ran 7 tests/);
  assert.match(r.stdout + r.stderr, /\bOK\b/);
});
test("Django: check e nessuna nuova migrazione", () => {
  py(3, ["manage.py", "check"]);
  py(3, ["manage.py", "makemigrations", "--check", "--dry-run"]);
  const r = py(3, ["manage.py", "showmigrations", "profiles"]);
  assert.match(r.stdout, /\[X\] 0001_initial/);
});
cases(3, [
  [
    "form valido, extra esclusi e duplicato",
    String.raw`
form=UserProfileForm(data={"email":"one@example.com","display_name":"  Nome  ","is_staff":True})
assert form.is_valid(),form.errors
item=form.save()
assert item.display_name=="Nome" and not hasattr(item,"is_staff")
duplicate=UserProfileForm(data={"email":"one@example.com","display_name":"Other"})
assert not duplicate.is_valid() and "email" in duplicate.errors
`,
  ],
  [
    "blank e lunghezze nel ModelForm",
    String.raw`
for data in [{"email":"","display_name":"Name"},{"email":"a@example.com","display_name":" "},{"email":"a@example.com","display_name":"x"*101}]:
    assert not UserProfileForm(data=data).is_valid()
`,
  ],
  [
    "get, first e assenza hanno contratti distinti",
    String.raw`
assert UserProfile.objects.filter(email="missing@example.com").first() is None
with expect.assertRaises(UserProfile.DoesNotExist):
    UserProfile.objects.get(email="missing@example.com")
`,
  ],
  [
    "atomic rollback non annulla stato Python",
    String.raw`
events=[]
try:
    with transaction.atomic():
        UserProfile.objects.create(email="rollback@example.com",display_name="Demo")
        events.append("side effect")
        raise ValueError("rollback")
except ValueError: pass
assert not UserProfile.objects.filter(email="rollback@example.com").exists()
assert events==["side effect"]
`,
  ],
  [
    "admin autenticazione separata dalle view pubbliche",
    String.raw`
c=Client()
assert c.get("/admin/").status_code==302
assert c.get("/health/").status_code==200
item=UserProfile.objects.create(email="visible@example.com",display_name="Visible")
r=c.get(f"/api/profiles/{item.pk}/")
assert r.status_code==200 and "email" not in r.json()
`,
  ],
  [
    "CSRF nei test va abilitato esplicitamente",
    String.raw`
c=Client(enforce_csrf_checks=True)
assert c.post("/admin/login/",{"username":"demo","password":"not-a-credential"}).status_code==403
`,
  ],
  [
    "host rifiutato e HEAD senza corpo",
    String.raw`
c=Client()
assert c.get("/health/",HTTP_HOST="untrusted.example").status_code==400
assert c.head("/health/").content==b""
`,
  ],
  [
    "query limitata, template e isolamento dati",
    String.raw`
item=UserProfile.objects.create(email="last@example.com",display_name="<b>test</b>")
c=Client()
r=c.get(f"/profiles/{item.pk}/")
assert r.status_code==200 and b"&lt;b&gt;test&lt;/b&gt;" in r.content
assert b"last@example.com" not in r.content
`,
  ],
]);
test("Django: check deploy segnala settings di sviluppo", () => {
  const r = py(3, ["manage.py", "check", "--deploy"], { status: null });
  assert.equal(r.status, 0);
  assert.match(r.stderr, /security\.W018/);
});
