import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const python = process.env.PYTHON_TEST_EXECUTABLE || "python";
const names = ["Threading", "Multiprocessing", "Asyncio", "Concurrent.futures"];
const notes = names.map((name) =>
  parseNote("Programmazione/Python/Pagine/" + name + ".md"),
);
const blocks = notes.map((note) =>
  note.tree.children
    .filter((node) => node.type === "code" && node.lang === "python")
    .map((node) => node.value),
);
const bootstrap = String.raw`
import contextlib, io, json, pathlib, subprocess, sys, tempfile, textwrap, types, unittest
assert sys.version_info[:2] == (3, 12)
assert sys.implementation.name == "cpython"
assert not sys.flags.optimize
request = json.load(sys.stdin)
if request["script"]:
    with tempfile.TemporaryDirectory(prefix="appunti-python-concurrency-") as directory:
        path = pathlib.Path(directory) / "example.py"
        probe = "import unittest\nexpect = unittest.TestCase()\n" + request["probe"]
        path.write_text(request["code"] + "\nif __name__ == '__main__':\n" +
                        textwrap.indent(probe, "    ") + "\n", encoding="utf-8")
        result = subprocess.run([sys.executable, "-I", "-X", "utf8", str(path)],
                                capture_output=True, text=True, encoding="utf-8", timeout=35)
        assert result.returncode == 0, result.stdout + result.stderr
        output, errors = result.stdout, result.stderr
else:
    stdout, stderr = io.StringIO(), io.StringIO()
    module = types.ModuleType("note_example")
    sys.modules[module.__name__] = module
    scope = module.__dict__
    with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
        exec(compile(request["code"], request["name"], "exec"), scope)
        scope.update(expect=unittest.TestCase(), captured_output=stdout,
                     captured_error=stderr, source_code=request["code"])
        exec(compile(request["probe"], "probe", "exec"), scope)
    output, errors = stdout.getvalue(), stderr.getvalue()
print(json.dumps({"output":output, "errors":errors, "version":sys.version}))
`;
function run(
  note,
  block,
  probe = "pass",
  script = note === 1 || (note === 3 && block === 4),
) {
  const result = spawnSync(python, ["-I", "-X", "utf8", "-c", bootstrap], {
    input: JSON.stringify({
      code: blocks[note][block],
      probe,
      script,
      name: names[note] + ":" + block,
    }),
    encoding: "utf8",
    windowsHide: true,
    timeout: 45000,
    maxBuffer: 2 ** 20,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return JSON.parse(result.stdout);
}
const expected = [
  [
    "assert lifecycle_demo() == (None, True, False)",
    "assert count_updates() == 4000",
    "assert run_jobs([2,-1,3]) == [(0,'ok',4),(1,'error','atteso un intero non negativo'),(2,'ok',9)]",
  ],
  [
    "assert main() == [1]",
    "assert main() == [4,8,10,12]",
    "assert exchange(5) == ('ok',25)",
    "assert main() == 2000",
  ],
  [
    `result=asyncio.run(demo())
assert result["before"] == []
assert result["sequential"] == [("start","a"),("end","a"),("start","b"),("end","b")]
assert result["concurrent"] == [("start","a"),("start","b"),("end","a"),("end","b")]
assert result["results"] == ["a","b","a","b"]`,
    "assert asyncio.run(group_demo()) == ['cleanup','job non valido']",
    "assert asyncio.run(gather_demo()) == (True,['ValueError','secondo completato'])",
    "assert asyncio.run(cancellation_demo()) == (['released','cancelled'], True)",
    "assert asyncio.run(timeout_demo()) == ['cleanup','timeout']",
    "assert asyncio.run(run_jobs([2,-1,3])) == [(0,'ok',4),(1,'error','atteso un intero non negativo'),(2,'ok',9)]",
    "assert result == 'ciao' and not path.exists()",
  ],
  [
    "assert results == [9,1,4]",
    "assert collect([2,-1,3]) == [(0,'ok',4),(1,'error','atteso un intero non negativo'),(2,'ok',9)]",
    "assert cancellation_demo() == [('cancel queued',True),('cancel running',False),'attesa scaduta','accodato cancellato','finito']",
    "assert collected == [(i,i*i) for i in range(6)]",
    "assert main() == [5,14,30]",
  ],
];
for (let i = 0; i < notes.length; i++) {
  test(names[i] + ": struttura e blocchi autonomi", () => {
    assert.equal(blocks[i].length, expected[i].length);
    assert.equal(notes[i].data.type, "technical-note");
    assert.equal(notes[i].data.status, "non revisionato");
    assert.equal(notes[i].data.publish, true);
    const headings = notes[i].tree.children.filter((n) => n.type === "heading");
    assert.equal(headings.filter((n) => n.depth === 1).length, 1);
    for (const title of [
      "Sintesi",
      "Quando usarlo",
      "Come funziona",
      "API / Sintassi",
      "Esempio pratico",
      "Varianti",
      "Errori comuni",
      "Checklist",
      "Collegamenti",
      "Fonti",
    ])
      assert.ok(notes[i].body.includes("## " + title), title);
    assert.match(notes[i].body, /3\.12\.10/);
    assert.match(notes[i].body, /https:\/\/docs\.python\.org\/3\.12\//);
  });
  for (let j = 0; j < expected[i].length; j++)
    test(names[i] + ": esempio " + (j + 1), () => {
      const result = run(i, j, expected[i][j]);
      assert.equal(result.errors, "");
    });
}
const cases = [
  [
    "thread: handshake e arresto ripetuti",
    0,
    0,
    `
for _ in range(5):
    assert lifecycle_demo() == (None, True, False)
`,
  ],
  [
    "thread: contatore senza stato trattenuto fra chiamate",
    0,
    1,
    `
assert count_updates() == count_updates() == 4000
`,
  ],
  [
    "thread: coda vuota e un solo worker",
    0,
    2,
    `
assert run_jobs([],workers=1) == []
assert run_jobs([0,2,2],workers=1) == [(0,"ok",0),(1,"ok",4),(2,"ok",4)]
`,
  ],
  [
    "thread: tipi non accettati diventano errori osservabili",
    0,
    2,
    `
outcomes=run_jobs([True,1.5,None,"2",4])
assert [status for _,status,_ in outcomes] == ["error"]*4+["ok"]
assert outcomes[-1] == (4,"ok",16)
`,
  ],
  [
    "thread: numero worker invalido",
    0,
    2,
    `
for value in (0,-1,True,1.5,"2"):
    with expect.assertRaises(ValueError):
        run_jobs([],workers=value)
`,
  ],
  [
    "thread: errore inatteso del job viene raccolto dal demo",
    0,
    2,
    `
def fail(value):
    raise RuntimeError("boom")
square_nonnegative=fail
assert run_jobs([1,2]) == [(0,"error","boom"),(1,"error","boom")]
`,
  ],
  [
    "thread: join non propaga l'eccezione del target",
    0,
    0,
    `
import threading
seen=[]
previous=threading.excepthook
def capture(args):
    seen.append((args.exc_type,str(args.exc_value)))
def fail():
    raise ValueError("worker error")
threading.excepthook=capture
try:
    thread=threading.Thread(target=fail)
    thread.start()
    assert thread.join() is None
finally:
    threading.excepthook=previous
assert seen == [(ValueError,"worker error")]
`,
  ],
  [
    "processi: funzione locale muta il dato, il figlio no",
    1,
    0,
    `
values=[1]
modify(values)
assert values == [1,99]
assert main() == [1]
`,
  ],
  [
    "processi: primi e limiti del dominio",
    1,
    1,
    `
assert [count_primes(n) for n in (0,1,2,3,10,100)] == [0,0,0,1,4,25]
for value in (-1,True,3.0,"3"):
    with expect.assertRaises(ValueError):
        count_primes(value)
`,
  ],
  [
    "processi: map propaga un errore del worker",
    1,
    1,
    `
with mp.get_context("spawn").Pool(2) as pool:
    with expect.assertRaisesRegex(ValueError,"limite"):
        pool.map(count_primes,[10,-1,20])
`,
  ],
  [
    "processi: Queue trasporta errori senza exitcode anomalo",
    1,
    2,
    `
for value in (-1,True,"5"):
    assert exchange(value) == ("error","atteso un intero non negativo")
`,
  ],
  [
    "processi: nessun figlio attivo dopo il contatore",
    1,
    3,
    `
assert mp.active_children() == []
`,
  ],
  [
    "async: await di una coroutine senza sospensioni",
    2,
    0,
    `
async def check():
    events=[]
    async def immediate():
        events.append("inside")
        return 3
    task=asyncio.create_task(job("scheduled",events))
    assert await immediate() == 3
    assert events == ["inside"]
    await task
asyncio.run(check())
`,
  ],
  [
    "async: cancellazione prima dell'avvio non entra nel corpo",
    2,
    3,
    `
async def check():
    entered=[]
    async def never_started():
        try:
            entered.append("start")
            await asyncio.sleep(0)
        finally:
            entered.append("cleanup")
    task=asyncio.create_task(never_started())
    task.cancel()
    with expect.assertRaises(asyncio.CancelledError):
        await task
    assert entered == []
asyncio.run(check())
`,
  ],
  [
    "async: wait_for attende il cleanup dopo la cancellazione",
    2,
    4,
    `
async def check():
    ready=asyncio.Event()
    events=[]
    async def pending():
        try:
            ready.set()
            await asyncio.Event().wait()
        finally:
            events.append("cleanup start")
            await asyncio.sleep(0)
            events.append("cleanup end")
    task=asyncio.create_task(pending())
    await ready.wait()
    with expect.assertRaises(TimeoutError):
        await asyncio.wait_for(task,timeout=0)
    assert task.cancelled()
    assert events == ["cleanup start","cleanup end"]
asyncio.run(check())
`,
  ],
  [
    "async: shield lascia vivo il task dopo la scadenza",
    2,
    4,
    `
async def check():
    release=asyncio.Event()
    task=asyncio.create_task(release.wait())
    try:
        with expect.assertRaises(TimeoutError):
            await asyncio.wait_for(asyncio.shield(task),timeout=0)
        assert not task.done()
        release.set()
        assert await task is True
    finally:
        if not task.done():
            task.cancel()
            await asyncio.gather(task,return_exceptions=True)
asyncio.run(check())
`,
  ],
  [
    "async: coda vuota, duplicati e rifiuto dei booleani",
    2,
    5,
    `
assert asyncio.run(run_jobs([])) == []
assert asyncio.run(run_jobs([0,2,2],workers=1,capacity=1)) == [(0,"ok",0),(1,"ok",4),(2,"ok",4)]
assert asyncio.run(run_jobs([True]))[0][1] == "error"
`,
  ],
  [
    "async: limiti worker e capacity validati",
    2,
    5,
    `
for field in ("workers","capacity"):
    for value in (0,-1,True,2.5,"2"):
        with expect.assertRaises(ValueError):
            asyncio.run(run_jobs([],**{field:value}))
`,
  ],
  [
    "async: worker inatteso fallisce e cancella i fratelli",
    2,
    5,
    `
events=[]
async def broken(value):
    if value == 1:
        await asyncio.sleep(0)
        raise RuntimeError("unexpected")
    try:
        await asyncio.Event().wait()
    finally:
        events.append("closed")
process=broken
async def check():
    with expect.assertRaises(ExceptionGroup) as caught:
        async with asyncio.timeout(3):
            await run_jobs(range(20),workers=2,capacity=1)
    assert any(isinstance(error,RuntimeError) for error in caught.exception.exceptions)
    assert events == ["closed"]
    assert asyncio.all_tasks() == {asyncio.current_task()}
asyncio.run(check())
`,
  ],
  [
    "async: errore del producer chiude i consumer avviati",
    2,
    5,
    `
events=[]
async def blocked(value):
    try:
        await asyncio.Event().wait()
    finally:
        events.append("closed")
def inputs():
    yield 0
    yield 1
    raise OSError("producer")
process=blocked
async def check():
    with expect.assertRaises(ExceptionGroup) as caught:
        async with asyncio.timeout(3):
            await run_jobs(inputs(),workers=1,capacity=1)
    assert any(isinstance(error,OSError) for error in caught.exception.exceptions)
    assert events == ["closed"]
asyncio.run(check())
`,
  ],
  [
    "async: cancellazione esterna non lascia consumer orfani",
    2,
    5,
    `
ready=None
events=[]
async def blocked(value):
    try:
        ready.set()
        await asyncio.Event().wait()
    finally:
        events.append("closed")
process=blocked
async def check():
    global ready
    ready=asyncio.Event()
    task=asyncio.create_task(run_jobs(range(20),workers=1,capacity=1))
    await ready.wait()
    task.cancel()
    with expect.assertRaises(asyncio.CancelledError):
        await task
    assert events == ["closed"]
    assert asyncio.all_tasks() == {asyncio.current_task()}
asyncio.run(check())
`,
  ],
  [
    "async: worker attivi limitati senza un task per input",
    2,
    5,
    `
active=0
peak=0
async def measured(value):
    global active,peak
    active+=1
    peak=max(peak,active)
    try:
        await asyncio.sleep(0)
        return value*value
    finally:
        active-=1
process=measured
result=asyncio.run(run_jobs(range(30),workers=3,capacity=2))
assert len(result) == 30 and 1 < peak <= 3 and active == 0
`,
  ],
  [
    "async: cancellare to_thread non ferma la funzione partita",
    2,
    6,
    `
from threading import Event
started, release, finished = Event(), Event(), Event()
class BlockingPath:
    def read_text(self,*,encoding):
        assert encoding == "utf-8"
        started.set()
        try:
            if not release.wait(timeout=5):
                raise TimeoutError("test non rilasciato")
            return "done"
        finally:
            finished.set()
async def check():
    task=asyncio.create_task(read_demo(BlockingPath()))
    try:
        assert await asyncio.to_thread(started.wait,5)
        task.cancel()
        with expect.assertRaises(asyncio.CancelledError):
            await task
        assert not finished.is_set()
    finally:
        release.set()
        assert await asyncio.to_thread(finished.wait,5)
asyncio.run(check())
`,
  ],
  [
    "future: map rilancia quando si consuma il risultato",
    3,
    0,
    `
with ThreadPoolExecutor(max_workers=2) as pool:
    values=pool.map(square,[2,"invalid"])
    assert next(values) == 4
    with expect.assertRaises(TypeError):
        next(values)
`,
  ],
  [
    "future: with chiude ma non rilancia da solo",
    3,
    0,
    `
with ThreadPoolExecutor(max_workers=1) as pool:
    failed=pool.submit(lambda: 1/0)
assert failed.done()
assert isinstance(failed.exception(),ZeroDivisionError)
with expect.assertRaises(ZeroDivisionError):
    failed.result()
`,
  ],
  [
    "future: associazione conserva anche input duplicati",
    3,
    1,
    `
assert collect([]) == []
assert collect([2,2]) == [(0,"ok",4),(1,"ok",4)]
assert collect([True])[0][1] == "error"
`,
  ],
  [
    "future: errori inattesi non vengono convertiti in successi",
    3,
    1,
    `
def fail(value):
    raise RuntimeError("unexpected")
square_nonnegative=fail
with expect.assertRaisesRegex(RuntimeError,"unexpected"):
    collect([1])
`,
  ],
  [
    "future: shutdown cancella solo i job in attesa",
    3,
    2,
    `
started,release=Event(),Event()
def blocked():
    started.set()
    release.wait()
    return 7
pool=ThreadPoolExecutor(max_workers=1)
try:
    running=pool.submit(blocked)
    assert started.wait(5)
    queued=pool.submit(lambda: 9)
    pool.shutdown(wait=False,cancel_futures=True)
    assert queued.cancelled() and not running.done()
finally:
    release.set()
    pool.shutdown(wait=True)
assert running.result() == 7
`,
  ],
  [
    "future: wait non cancella i pending",
    3,
    2,
    `
from concurrent.futures import Future,wait
pending=Future()
done,not_done=wait([pending],timeout=0)
assert not done and not_done == {pending} and not pending.cancelled()
pending.cancel()
assert pending.done() and pending.cancelled()
`,
  ],
  [
    "future: finestra vuota e limiti validati al consumo",
    3,
    3,
    `
with ThreadPoolExecutor(max_workers=1) as pool:
    assert list(bounded_results(pool,square,[])) == []
    for value in (0,-1,True,2.5,"2"):
        iterator=bounded_results(pool,square,[],limit=value)
        with expect.assertRaises(ValueError):
            next(iterator)
`,
  ],
  [
    "future: finestra limita il consumo anticipato",
    3,
    3,
    `
seen=[]
def inputs():
    for value in range(20):
        seen.append(value)
        yield value
with ThreadPoolExecutor(max_workers=2) as pool:
    with closing(bounded_results(pool,square,inputs(),limit=3)) as results:
        next(results)
        assert len(seen) == 3
assert seen == [0,1,2]
`,
  ],
  [
    "future: finestra completa senza perdere o duplicare indici",
    3,
    3,
    `
with ThreadPoolExecutor(max_workers=3) as pool:
    result=sorted(bounded_results(pool,square,range(25),limit=4))
assert result == [(i,i*i) for i in range(25)]
`,
  ],
  [
    "future: errore della funzione viene propagato",
    3,
    3,
    `
def fail(value):
    raise ValueError("job")
with ThreadPoolExecutor(max_workers=2) as pool:
    with closing(bounded_results(pool,fail,range(4),limit=2)) as results:
        with expect.assertRaisesRegex(ValueError,"job"):
            next(results)
`,
  ],
  [
    "future: errore dell'iteratore degli input non sparisce",
    3,
    3,
    `
def inputs():
    yield 1
    raise OSError("input")
with ThreadPoolExecutor(max_workers=1) as pool:
    with expect.assertRaisesRegex(OSError,"input"):
        list(bounded_results(pool,square,inputs(),limit=2))
`,
  ],
  [
    "future: process pool propaga eccezioni e valida gli input",
    3,
    4,
    `
assert sum_squares(0) == 0
for value in (True,-1,1.5):
    with expect.assertRaises(ValueError):
        sum_squares(value)
with ProcessPoolExecutor(max_workers=1,mp_context=mp.get_context("spawn")) as pool:
    future=pool.submit(sum_squares,-1)
    with expect.assertRaises(ValueError):
        future.result()
assert mp.active_children() == []
`,
  ],
];
for (const [name, note, block, probe] of cases)
  test(name, () => run(note, block, probe));
for (const [note, block] of [
  [1, 0],
  [1, 1],
  [1, 2],
  [1, 3],
  [3, 4],
])
  test(names[note] + ": import senza processi, blocco " + (block + 1), () => {
    const result = run(note, block, "assert mp.active_children() == []", false);
    assert.equal(result.output, "");
    assert.equal(result.errors, "");
  });
