import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const python = process.env.PYTHON_TEST_EXECUTABLE || "python";
const names = ["Gestione File", "Standard Library"];
const notes = names.map((name) =>
  parseNote("Programmazione/Python/Pagine/" + name + ".md"),
);
const blocks = notes.map((note) =>
  note.tree.children
    .filter((n) => n.type === "code" && n.lang === "python")
    .map((n) => n.value),
);
const bootstrap = `
import contextlib, io, json, sys, unittest
assert sys.version_info[:2] == (3, 12)
assert not sys.flags.optimize
request = json.load(sys.stdin)
output = io.StringIO()
namespace = {"__name__": "note_example", "expect": unittest.TestCase()}
with contextlib.redirect_stdout(output):
    exec(compile(request["code"], request["name"], "exec"), namespace)
    exec(compile(request["probe"], "probe", "exec"), namespace)
print(json.dumps({"output": output.getvalue(), "version": sys.version}))
`;
function run(note, block, probe = "pass") {
  const result = spawnSync(python, ["-I", "-X", "utf8", "-c", bootstrap], {
    input: JSON.stringify({
      code: blocks[note][block],
      name: names[note] + ":" + block,
      probe,
    }),
    encoding: "utf8",
    windowsHide: true,
    timeout: 30000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return JSON.parse(result.stdout);
}
const expected = [
  [
    "assert lines == ['  alpha  ', 'beta', 'gamma'] and file.closed",
    "assert content is None",
    "assert count == 2 and not target.exists()",
    "assert not source.exists() and not target.exists()",
  ],
  [
    "assert path.name == 'summary.txt' and file.closed",
    "assert enabled is True and encoded == '{\"enabled\": true}'",
    "assert rows == [{'name': 'kit, small', 'quantity': '3'}] and quantity == 3",
    "assert config == {'server': {'host': '127.0.0.1', 'port': 8000}}",
    "assert local.hour == 14 and elapsed.total_seconds() == 3600",
    "assert counts['red'] == 2 and item == 'first' and first_three == [0, 1, 2] and parse_binary('101') == 5",
    "assert results == [4, 9] and not thread.is_alive() and jobs.unfinished_tasks == 0",
    "assert summary == [['red', 2], ['blue', 1]]",
  ],
];
for (let i = 0; i < notes.length; i++) {
  test(names[i] + ": numero di esempi e metadati", () => {
    assert.equal(blocks[i].length, expected[i].length);
    assert.equal(notes[i].data.status, "non revisionato");
    assert.equal(notes[i].data.publish, true);
  });
  for (let j = 0; j < expected[i].length; j++) {
    test(names[i] + ": esempio " + (j + 1), () => run(i, j, expected[i][j]));
  }
}
const cases = [
  [
    "normalizzazione rifiuta output esistente senza alterarlo",
    0,
    2,
    String.raw`
with TemporaryDirectory() as directory:
    source, target = Path(directory) / "in", Path(directory) / "out"
    source.write_text("A\n", encoding="utf-8")
    target.write_text("keep", encoding="utf-8")
    with expect.assertRaises(FileExistsError):
        normalize_lines(source, target)
    assert target.read_text(encoding="utf-8") == "keep"
`,
  ],
  [
    "normalizzazione sullo stesso file non tronca",
    0,
    2,
    String.raw`
with TemporaryDirectory() as directory:
    path = Path(directory) / "in"
    path.write_text("Keep", encoding="utf-8")
    with expect.assertRaises(FileExistsError):
        normalize_lines(path, path)
    assert path.read_text(encoding="utf-8") == "Keep"
`,
  ],
  [
    "input mancante non crea output",
    0,
    2,
    String.raw`
with TemporaryDirectory() as directory:
    source, target = Path(directory) / "missing", Path(directory) / "out"
    with expect.assertRaises(FileNotFoundError):
        normalize_lines(source, target)
    assert not target.exists()
`,
  ],
  [
    "input vuoto e whitespace",
    0,
    2,
    String.raw`
with TemporaryDirectory() as directory:
    source, target = Path(directory) / "in", Path(directory) / "out"
    source.write_text(" \n\t\n", encoding="utf-8")
    assert normalize_lines(source, target) == 0 and target.read_bytes() == b""
`,
  ],
  [
    "UTF-8 errato propaga e puo lasciare output",
    0,
    2,
    String.raw`
with TemporaryDirectory() as directory:
    source, target = Path(directory) / "in", Path(directory) / "out"
    source.write_bytes(b"\xff")
    with expect.assertRaises(UnicodeDecodeError):
        normalize_lines(source, target)
    assert target.exists()
`,
  ],
  [
    "copia oltre due blocchi e nessuna traduzione byte",
    0,
    3,
    String.raw`
with TemporaryDirectory() as directory:
    source, target = Path(directory) / "in", Path(directory) / "out"
    data = bytes(range(256)) * 700
    source.write_bytes(data)
    copy_binary(source, target)
    assert target.read_bytes() == data
`,
  ],
  [
    "copia binaria esclusiva",
    0,
    3,
    String.raw`
with TemporaryDirectory() as directory:
    source, target = Path(directory) / "in", Path(directory) / "out"
    source.write_bytes(b"new")
    target.write_bytes(b"keep")
    with expect.assertRaises(FileExistsError):
        copy_binary(source, target)
    assert target.read_bytes() == b"keep"
`,
  ],
  [
    "w tronca all'apertura e with chiude su eccezione",
    0,
    0,
    String.raw`
with TemporaryDirectory() as directory:
    path = Path(directory) / "x"
    path.write_text("old", encoding="utf-8")
    try:
        with path.open("w", encoding="utf-8") as handle:
            raise RuntimeError("stop")
    except RuntimeError:
        pass
    assert handle.closed and path.read_bytes() == b""
`,
  ],
  [
    "JSON valida schema e non solo sintassi",
    1,
    1,
    String.raw`
for bad in ('[]', '{}', '{"enabled": 1}', '{"enabled": "true"}', '{"enabled": true, "extra": 0}'):
    with expect.assertRaises(ValueError):
        read_enabled(bad)
assert read_enabled('{"enabled": false}') is False
with expect.assertRaises(json.JSONDecodeError):
    read_enabled('{')
`,
  ],
  [
    "JSON NaN e chiavi duplicate non sono rifiutati dal parser base",
    1,
    1,
    String.raw`
import math
assert math.isnan(json.loads("NaN"))
assert read_enabled('{"enabled": false, "enabled": true}') is True
with expect.assertRaises(ValueError):
    json.dumps(float("nan"), allow_nan=False)
assert json.loads(json.dumps((1, 2))) == [1, 2]
`,
  ],
  [
    "CSV virgole newline e virgolette",
    1,
    2,
    String.raw`
import io
buffer = io.StringIO(newline="")
writer = csv.writer(buffer)
writer.writerow(['line\nbreak', 'a"b', 'a,b'])
buffer.seek(0)
assert next(csv.reader(buffer)) == ['line\nbreak', 'a"b', 'a,b']
`,
  ],
  [
    "TOML file binario e sintassi errata",
    1,
    3,
    String.raw`
import io
with expect.assertRaises(TypeError):
    tomllib.load(io.StringIO("x = 1"))
with expect.assertRaises(tomllib.TOMLDecodeError):
    tomllib.loads("x =")
assert tomllib.loads("x = true") == {"x": True}
`,
  ],
  [
    "DST confronto fra wall time e UTC",
    1,
    4,
    String.raw`
assert second - first == timedelta(0)
assert first.utcoffset() != second.utcoffset()
assert instant == local
assert instant.replace(tzinfo=rome) != local
`,
  ],
  [
    "Queue contatori e Empty",
    1,
    6,
    String.raw`
from queue import Empty
with expect.assertRaises(Empty):
    jobs.get_nowait()
with expect.assertRaises(ValueError):
    jobs.task_done()
`,
  ],
];
for (const [name, i, j, probe] of cases) test(name, () => run(i, j, probe));
