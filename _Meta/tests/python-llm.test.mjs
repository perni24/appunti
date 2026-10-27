import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  realpathSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, isAbsolute } from "node:path";
import { test, after } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

assert.ok(process.env.PYTHON_LLM_TOOLS, "Set PYTHON_LLM_TOOLS; see README.");
const python = join(process.env.PYTHON_LLM_TOOLS, "Scripts", "python.exe");
const temp = realpathSync(tmpdir());
const root = mkdtempSync(join(temp, "appunti-python-llm-test-"));
const env = { ...process.env, PYTHONUTF8: "1", PYTHONDONTWRITEBYTECODE: "1" };
for (const key of Object.keys(env)) {
  if (/^(OPENAI_|AZURE_OPENAI_|LLAMA_|HF_|HUGGING_FACE)/i.test(key))
    delete env[key];
}
delete env.PYTHONHOME;
delete env.PYTHONPATH;
after(() => {
  const actual = realpathSync(root),
    rel = relative(temp, actual);
  assert.ok(
    rel &&
      !rel.startsWith("..") &&
      !isAbsolute(rel) &&
      actual.includes("appunti-python-llm-test-"),
  );
  rmSync(actual, { recursive: true, force: true });
});
const names = ["llama-cpp-python", "OpenAI API"];
const notes = names.map((n) =>
  parseNote("Programmazione/Python/Pagine/" + n + ".md"),
);
const dirs = names.map((_, i) => join(root, String(i)));
dirs.forEach((d) => mkdirSync(d));
const files = [
  ["local_chat.py", "local_completion.py"],
  ["openai_text.py", "classify_ticket.py", "stream_text.py"],
];
const text = (n) => n.value ?? (n.children ?? []).map(text).join("");
for (let i = 0; i < 2; i++)
  for (const file of files[i]) {
    const nodes = notes[i].tree.children;
    const at = nodes.findIndex((n) => n.type === "heading" && text(n) === file);
    assert.ok(at >= 0, file);
    const code = nodes.slice(at + 1).find((n) => n.type === "code");
    assert.equal(code.lang, "python");
    writeFileSync(join(dirs[i], file), code.value + "\n");
  }
function py(i, args, status = 0) {
  const r = spawnSync(python, ["-X", "utf8", ...args], {
    cwd: dirs[i],
    env,
    encoding: "utf8",
    windowsHide: true,
    timeout: 30000,
    maxBuffer: 2 ** 20,
  });
  assert.ifError(r.error);
  assert.equal(r.status, status, r.stdout + r.stderr);
  return r;
}
function probe(i, code) {
  return py(i, ["-c", "import unittest\nexpect=unittest.TestCase()\n" + code]);
}
function cases(i, setup, rows) {
  for (const [label, code] of rows)
    test(names[i] + ": " + label, () => probe(i, setup + "\n" + code));
}
test("versioni e import dei due SDK reali", () =>
  probe(
    0,
    String.raw`
import sys, importlib.metadata as m
import openai, httpx2, llama_cpp
assert sys.version_info[:3] == (3,12,10)
for name,version in {"openai":"3.38.0","httpx2":"2.16.0","pydantic":"2.14.1","llama-cpp-python":"0.3.36"}.items():
    assert m.version(name)==version
assert hasattr(llama_cpp.Llama,"close")
assert not hasattr(llama_cpp.Llama,"__enter__")
`,
  ));
test("cinque blocchi estratti e struttura dei titoli", () => {
  assert.deepEqual(
    notes.map(
      (n) =>
        n.tree.children.filter((n) => n.type === "code" && n.lang === "python")
          .length,
    ),
    [2, 3],
  );
  for (const note of notes) {
    assert.equal(note.data.status, "non revisionato");
    assert.equal(note.data.type, "technical-note");
    assert.equal(note.data.publish, true);
    const hs = note.tree.children.filter((n) => n.type === "heading");
    assert.equal(hs.filter((n) => n.depth === 1).length, 1);
    for (let i = 1; i < hs.length; i++)
      assert.ok(hs[i].depth <= hs[i - 1].depth + 1);
  }
});
test("import locali senza caricamento", () =>
  probe(
    0,
    String.raw`
from unittest.mock import patch
with patch("llama_cpp.Llama", side_effect=AssertionError("Unexpected model loading")):
    import local_chat, local_completion
`,
  ));
test("import OpenAI senza creazione client", () =>
  probe(
    1,
    String.raw`
from unittest.mock import patch
with patch("openai.OpenAI",side_effect=AssertionError("Unexpected client")):
    import openai_text, classify_ticket, stream_text
`,
  ));
for (const file of ["local_chat.py", "local_completion.py"])
  test(file + ": help senza modello", () =>
    assert.match(py(0, [file, "--help"]).stdout, /usage/),
  );
test("openai_text: help senza chiave", () =>
  assert.match(py(1, ["openai_text.py", "--help"]).stdout, /usage/));
test("openai_text: configurazione mancante non chiama la rete", () =>
  assert.match(py(1, ["openai_text.py"], 1).stderr, /ValueError/));
const localSetup = String.raw`
from unittest.mock import MagicMock, patch
from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory
from local_chat import *
from local_completion import complete

def fake_model(text="Answer", reason="stop"):
    llm=MagicMock()
    llm.n_ctx.return_value=2048
    llm.create_chat_completion.return_value={"choices":[{"finish_reason":reason,"message":{"content":text}}]}
    llm.create_completion.return_value={"choices":[{"finish_reason":reason,"text":text}]}
    llm.tokenize.return_value=[1,2,3]
    return llm
`;
cases(0, localSetup, [
  [
    "chat passa messaggi e limiti senza stop universale",
    String.raw`
llm=fake_model(" Answer ")
assert chat_text(llm," Prompt ")=="Answer"
llm.create_chat_completion.assert_called_once_with(messages=[{"role":"user","content":"Prompt"}],max_tokens=128,temperature=0.2,stream=False)
`,
  ],
  [
    "prompt vuoto rifiutato prima dell'inferenza",
    String.raw`
llm=fake_model()
for text in ["", "  ", None, 42]:
    with expect.assertRaises(ValueError):
        chat_text(llm,text)
llm.create_chat_completion.assert_not_called()
`,
  ],
  [
    "budget chat invalido",
    String.raw`
llm=fake_model()
for value in [0,-1,True,1.2,2048,2049]:
    with expect.assertRaises(ValueError):
        chat_text(llm,"Prompt",max_tokens=value)
llm.create_chat_completion.assert_not_called()
`,
  ],
  [
    "risposta troncata non e successo",
    String.raw`
with expect.assertRaises(RuntimeError):
    chat_text(fake_model(reason="length"),"Prompt")
`,
  ],
  [
    "output chat vuoto o inatteso rifiutato",
    String.raw`
for text in [None,"","  "]:
    with expect.assertRaises(ValueError):
        chat_text(fake_model(text),"Prompt")
with expect.assertRaises(ValueError):
    read_chat_text({"choices":[]})
with expect.assertRaises(ValueError):
    read_chat_text({"choices":[{},{}]})
`,
  ],
  [
    "tool call non trattata come testo",
    String.raw`
for key in ["tool_calls","function_call"]:
    response={"choices":[{"finish_reason":"stop","message":{"content":"Text",key:[{"name":"danger"}]}}]}
    with expect.assertRaises(ValueError):
        read_chat_text(response)
`,
  ],
  [
    "tokenizzazione e completion passano gli stessi token",
    String.raw`
llm=fake_model(" Result ")
assert complete(llm,"Caf\u00e9")=="Result"
llm.tokenize.assert_called_once_with("Caf\u00e9".encode("utf-8"),add_bos=True)
llm.create_completion.assert_called_once_with(prompt=[1,2,3],max_tokens=64,temperature=0.2,echo=False,stream=False)
`,
  ],
  [
    "budget completion non eccede il contesto",
    String.raw`
llm=fake_model()
llm.n_ctx.return_value=67
assert complete(llm,"X")=="Answer"
llm.create_completion.reset_mock()
with expect.assertRaises(ValueError):
    complete(llm,"X",max_tokens=65)
llm.create_completion.assert_not_called()
for budget in [0,-1,True,1.5]:
    with expect.assertRaises(ValueError):
        complete(llm,"X",max_tokens=budget)
`,
  ],
  [
    "completion troncata o vuota",
    String.raw`
with expect.assertRaises(RuntimeError):
    complete(fake_model(reason="length"),"X")
with expect.assertRaises(ValueError):
    complete(fake_model(""),"X")
`,
  ],
  [
    "file assente e formato non GGUF rifiutati",
    String.raw`
with TemporaryDirectory() as directory:
    root=Path(directory)
    with patch("local_chat.Llama") as constructor:
        with expect.assertRaises(FileNotFoundError):
            load_model(root/"missing.gguf")
        (root/"wrong.txt").touch()
        with expect.assertRaises(ValueError):
            load_model(root/"wrong.txt")
        constructor.assert_not_called()
`,
  ],
  [
    "load_model configura una sola istanza (costruttore simulato)",
    String.raw`
with TemporaryDirectory() as directory:
    path=Path(directory)/"model.gguf"
    path.touch()
    with patch("local_chat.Llama") as constructor:
        assert load_model(path,n_ctx=4096,n_gpu_layers=0,chat_format="chatml") is constructor.return_value
        constructor.assert_called_once_with(model_path=str(path.resolve()),n_ctx=4096,n_gpu_layers=0,chat_format="chatml",verbose=False)
`,
  ],
  [
    "contesto minimo applicativo",
    String.raw`
with TemporaryDirectory() as directory:
    path=Path(directory)/"model.gguf"
    path.touch()
    with patch("local_chat.Llama") as constructor:
        for value in [0,255,True,256.0]:
            with expect.assertRaises(ValueError):
                load_model(path,n_ctx=value)
        constructor.assert_not_called()
`,
  ],
  [
    "punto di ingresso chiude il modello dopo successo",
    String.raw`
import local_chat
llm=fake_model()
with patch("local_chat.load_model",return_value=llm) as load, patch("sys.argv",["local_chat.py","fixture.gguf"]), patch("builtins.print"):
    local_chat.main()
load.assert_called_once()
llm.close.assert_called_once()
`,
  ],
  [
    "punto di ingresso chiude anche dopo errore",
    String.raw`
import local_chat, local_completion
for module,argv in [(local_chat,["local_chat.py","fixture.gguf"]),(local_completion,["local_completion.py","fixture.gguf","Prompt"])]:
    llm=fake_model(reason="length")
    with patch.object(module,"load_model",return_value=llm),patch("sys.argv",argv):
        with expect.assertRaises(RuntimeError):
            module.main()
    llm.close.assert_called_once()
`,
  ],
  [
    "firme del binding compatibili con gli argomenti del demo",
    String.raw`
import inspect
from llama_cpp import Llama
inspect.signature(Llama).bind(model_path="x.gguf",n_ctx=2048,n_gpu_layers=0,chat_format=None,verbose=False)
inspect.signature(Llama.create_chat_completion).bind(None,messages=[],max_tokens=128,temperature=0.2,stream=False)
inspect.signature(Llama.create_completion).bind(None,prompt=[1],max_tokens=64,temperature=0.2,echo=False,stream=False)
`,
  ],
]);
const apiSetup = String.raw`
import json
from contextlib import contextmanager
from unittest.mock import patch
import httpx2
from openai import OpenAI, APIError, APIStatusError, APIConnectionError, APITimeoutError
from pydantic import ValidationError
from openai_text import *
from classify_ticket import classify_ticket, TicketCategory
from stream_text import stream_answer

def message(text):
    return {"id":"msg_test","type":"message","role":"assistant","status":"completed",
            "content":[{"type":"output_text","text":text,"annotations":[],"logprobs":[]}]}

def payload(text="Hello",status="completed",output=None):
    return {"id":"resp_test","object":"response","created_at":0,"model":"test-model",
        "status":status,"output":[message(text)] if output is None else output,
        "error":None,"incomplete_details":None,"instructions":None,"tools":[],
        "tool_choice":"auto","parallel_tool_calls":True,"metadata":{},
        "usage":{"input_tokens":2,"output_tokens":3,"total_tokens":5}}

@contextmanager
def api(result=None, *, status=200, handler=None):
    requests=[]
    responses=[]
    def transport(request):
        requests.append(request)
        response=handler(request) if handler else httpx2.Response(status,json=result,headers={"x-request-id":"req_test"})
        responses.append(response)
        return response
    http=httpx2.Client(transport=httpx2.MockTransport(transport),trust_env=False)
    with OpenAI(api_key="offline-test-only",base_url="https://api.openai.invalid/v1",max_retries=0,timeout=30,http_client=http) as client:
        yield client,requests,responses
    assert http.is_closed
`;
cases(1, apiSetup, [
  [
    "richiesta reale SDK serializzata e risposta testuale",
    String.raw`
with api(payload(" Hello ")) as (client,requests,responses):
    assert ask_model(client,"test-model"," Prompt ")=="Hello"
    request=requests[0]
    assert str(request.url)=="https://api.openai.invalid/v1/responses"
    assert request.headers["authorization"]=="Bearer offline-test-only"
    body=json.loads(request.content)
    assert body["model"]=="test-model" and body["input"]=="Prompt"
    assert body["store"] is False and body["max_output_tokens"]==512
    assert len(requests)==1
`,
  ],
  [
    "output non assume messaggio in prima posizione",
    String.raw`
items=[{"id":"rs_test","type":"reasoning","summary":[]},message("Answer")]
with api(payload(output=items)) as (client,_,__):
    assert ask_model(client,"test-model","Prompt")=="Answer"
`,
  ],
  [
    "input vuoti e sovradimensionati non inviano richieste",
    String.raw`
with api(payload()) as (client,requests,_):
    for value in [""," ",None,4,"x"*8001]:
        with expect.assertRaises(ValueError):
            ask_model(client,"test-model",value)
    with expect.assertRaises(ValueError):
        ask_model(client,"","Prompt")
    assert requests==[]
`,
  ],
  [
    "limite caratteri esatto",
    String.raw`
with api(payload()) as (client,requests,_):
    assert ask_model(client,"test-model","x"*8000)=="Hello"
    assert len(requests)==1
`,
  ],
  [
    "stati incompleti o falliti rifiutati",
    String.raw`
for status in ["incomplete","failed","queued","cancelled"]:
    with api(payload(status=status)) as (client,_,__):
        with expect.assertRaises(RuntimeError):
            ask_model(client,"test-model","Prompt")
`,
  ],
  [
    "rifiuto distinto da risposta vuota",
    String.raw`
refusal=message("")
refusal["content"]=[{"type":"refusal","refusal":"No"}]
with api(payload(output=[refusal])) as (client,_,__):
    with expect.assertRaisesRegex(RuntimeError,"refused"):
        ask_model(client,"test-model","Prompt")
with api(payload(output=[])) as (client,_,__):
    with expect.assertRaisesRegex(ValueError,"No text"):
        ask_model(client,"test-model","Prompt")
`,
  ],
  [
    "categorie valide e schema JSON della richiesta",
    String.raw`
for category in ["bug","billing","feature","other"]:
    with api(payload(json.dumps({"category":category}))) as (client,requests,_):
        assert classify_ticket(client,"test-model","Ticket")==category
        body=json.loads(requests[0].content)
        format=body["text"]["format"]
        assert format["type"]=="json_schema" and format["strict"] is True
        assert format["schema"]["additionalProperties"] is False
        assert format["schema"]["required"]==["category"]
        assert set(format["schema"]["properties"]["category"]["enum"])=={"bug","billing","feature","other"}
        assert body["store"] is False
`,
  ],
  [
    "JSON invalido e categoria fuori schema non diventano other",
    String.raw`
for text in ['not-json','{"category":"admin"}','{}','{"category":"bug","extra":1}']:
    with api(payload(text)) as (client,_,__):
        with expect.assertRaises(ValidationError):
            classify_ticket(client,"test-model","Ticket")
`,
  ],
  [
    "classificazione incompleta o rifiutata",
    String.raw`
with api(payload(status="incomplete",output=[])) as (client,_,__):
    with expect.assertRaises(RuntimeError):
        classify_ticket(client,"test-model","Ticket")
refusal=message("")
refusal["content"]=[{"type":"refusal","refusal":"No"}]
with api(payload(output=[refusal])) as (client,_,__):
    with expect.assertRaises(RuntimeError):
        classify_ticket(client,"test-model","Ticket")
`,
  ],
  [
    "classificazione senza output parsato",
    String.raw`
with api(payload(output=[])) as (client,_,__):
    with expect.assertRaises(ValueError):
        classify_ticket(client,"test-model","Ticket")
`,
  ],
  [
    "configurazione esplicita e chiusura client senza chiamate",
    String.raw`
with patch.dict("os.environ",{"OPENAI_API_KEY":"offline-test-only","OPENAI_BASE_URL":"https://untrusted.invalid"},clear=True):
    with make_client() as client:
        assert str(client.base_url)=="https://api.openai.com/v1/"
        assert client.max_retries==0
        assert client.timeout==30
    assert client.is_closed()
with patch.dict("os.environ",{},clear=True):
    with expect.assertRaises(ValueError):
        make_client()
`,
  ],
  [
    "errori HTTP, request ID e retry disabilitati",
    String.raw`
for status in [400,401,403,404,429,500,503]:
    error={"error":{"message":"synthetic","type":"invalid_request_error","code":"fixture"}}
    with api(error,status=status) as (client,requests,_):
        with expect.assertRaises(APIStatusError) as raised:
            ask_model(client,"test-model","Prompt")
        assert raised.exception.status_code==status
        assert raised.exception.request_id=="req_test"
        assert len(requests)==1
`,
  ],
  [
    "timeout e connessione simulati non ritentati",
    String.raw`
for error,expected in [(httpx2.ReadTimeout,APITimeoutError),(httpx2.ConnectError,APIConnectionError)]:
    def failure(request):
        raise error("synthetic",request=request)
    with api(handler=failure) as (client,requests,_):
        with expect.assertRaises(expected):
            ask_model(client,"test-model","Prompt")
        assert len(requests)==1
`,
  ],
  [
    "limiti della validazione semantica documentati",
    String.raw`
with api(payload('{"category":"billing"}')) as (client,_,__):
    assert classify_ticket(client,"test-model","Il pulsante Salva e rotto")=="billing"
# A schema-valid response is not evidence of a correct classification.
`,
  ],
]);
const sseSetup =
  apiSetup +
  String.raw`
def events(terminal="response.completed"):
    initial=payload(status="in_progress",output=[])
    item=message("")
    item["status"]="in_progress"
    item["content"]=[]
    part={"type":"output_text","text":"","annotations":[],"logprobs":[]}
    result=[
        {"type":"response.created","response":initial},
        {"type":"response.output_item.added","output_index":0,"item":item},
        {"type":"response.content_part.added","output_index":0,"item_id":"msg_test","content_index":0,"part":part},
        {"type":"response.output_text.delta","output_index":0,"item_id":"msg_test","content_index":0,"delta":"Hel","logprobs":[]},
        {"type":"response.output_text.delta","output_index":0,"item_id":"msg_test","content_index":0,"delta":"lo","logprobs":[]},
    ]
    if terminal=="response.completed":
        result.extend([
            {"type":"response.output_text.done","output_index":0,"item_id":"msg_test","content_index":0,"text":"Hello","logprobs":[]},
            {"type":"response.content_part.done","output_index":0,"item_id":"msg_test","content_index":0,"part":message("Hello")["content"][0]},
            {"type":"response.output_item.done","output_index":0,"item":message("Hello")},
            {"type":terminal,"response":payload()},
        ])
    elif terminal in {"response.failed","response.incomplete"}:
        result.append({"type":terminal,"response":payload("Hello",status=terminal.split(".")[1])})
    elif terminal=="error":
        result.append({"type":"error","code":"server_error","message":"synthetic","param":None})
    for number,event in enumerate(result):
        event["sequence_number"]=number
    return result

def sse(events):
    body="".join("event: "+event["type"]+"\ndata: "+json.dumps(event)+"\n\n" for event in events)
    return httpx2.Response(200,headers={"content-type":"text/event-stream"},content=body.encode())
`;
cases(1, sseSetup, [
  [
    "stream SSE reale SDK, testo e chiusura",
    String.raw`
with api(handler=lambda request:sse(events())) as (client,requests,responses):
    chunks=[]
    assert stream_answer(client,"test-model","Prompt",chunks.append)=="Hello"
    assert chunks==["Hel","lo"]
    assert json.loads(requests[0].content)["stream"] is True
    assert responses[0].is_closed
`,
  ],
  [
    "stream incompleto o fallito lascia solo testo provvisorio",
    String.raw`
for terminal in ["response.failed","response.incomplete"]:
    with api(handler=lambda request:sse(events(terminal))) as (client,_,responses):
        chunks=[]
        with expect.assertRaises(RuntimeError):
            stream_answer(client,"test-model","Prompt",chunks.append)
        assert chunks==["Hel","lo"]
        assert responses[0].is_closed
`,
  ],
  [
    "EOF senza completamento non e successo",
    String.raw`
with api(handler=lambda request:sse(events(None))) as (client,_,responses):
    with expect.assertRaises(RuntimeError):
        stream_answer(client,"test-model","Prompt",lambda text:None)
    assert responses[0].is_closed
`,
  ],
  [
    "evento error propagato e stream chiuso",
    String.raw`
with api(handler=lambda request:sse(events("error"))) as (client,_,responses):
    with expect.assertRaises((APIError,RuntimeError)):
        stream_answer(client,"test-model","Prompt",lambda text:None)
    assert responses[0].is_closed
`,
  ],
  [
    "errore del callback chiude lo stream",
    String.raw`
def write(text):
    raise ValueError("sink failed")
with api(handler=lambda request:sse(events())) as (client,_,responses):
    with expect.assertRaisesRegex(ValueError,"sink failed"):
        stream_answer(client,"test-model","Prompt",write)
    assert responses[0].is_closed
`,
  ],
]);
