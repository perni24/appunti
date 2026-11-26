import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

function blocks(note, lang) {
  return parseNote("Programmazione/Clean Code/Pagine/" + note + ".md").tree.children
    .filter(node => node.type === "code" && node.lang === lang).map(node => node.value);
}
function one(note, lang) {
  const snippets = blocks(note, lang);
  assert.equal(snippets.length, 1, note);
  return snippets[0];
}
function example(note, name) {
  return Function('"use strict";\n' + one(note, "js") + "\nreturn " + name + ";")();
}
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "clean-code-catalog-"));
  t.after(() => {
    for (const file of readdirSync(dir)) unlinkSync(join(dir, file));
    rmdirSync(dir);
  });
  for (const [file, note] of [
    ["catalog_parse.py", "Parsing di input esterni"], ["catalog_pipeline.py", "Pipeline dati leggibili"],
    ["export_catalog.py", "Script di automazione"],
  ]) writeFileSync(join(dir, file), one(note, "python"));
  function python(args, expected = 0) {
    const r = spawnSync(process.env.PYTHON_TEST_EXECUTABLE || "python", ["-E", "-B", "-X", "utf8", ...args],
      { cwd: dir, encoding: "utf8", timeout: 30000 });
    assert.equal(r.status, expected, r.error?.message ?? r.stderr);
    return r;
  }
  return { dir, python };
}

test("Parsing: centesimi esatti, zero distinto dal campo vuoto, identificativi opachi", t => {
  const { python } = fixture(t);
  python(["-c", `from catalog_parse import RowError, parse_product
for raw, cents in [("0", 0), ("0.09", 9), ("999999.99", 99999999)]:
    assert parse_product(["007", raw]) == {"sku":"007", "price_cents":cents}
for fields, field in [([], "record"), (["a","0"], "sku"), (["X"*25,"0"], "sku")]:
    try: parse_product(fields)
    except RowError as e: assert e.field == field
    else: raise AssertionError(fields)
for raw in ["", " ", "1e2", "01", "-1", "1.2", "1,20", "1000000", "1.000"]:
    try: parse_product(["007", raw])
    except RowError as e: assert (e.field,e.code) == ("price","invalid_price")
    else: raise AssertionError(raw)`]);
});

test("Pipeline: record multilinea, primo SKU valido, scarti e fallimenti dell'intero file", t => {
  const { python } = fixture(t);
  python(["-c", String.raw`from io import StringIO
from catalog_pipeline import read_catalog
def run(s): return read_catalog(StringIO(s, newline=""))
rows, issues = run('sku,price\r\n007,\r\n007,1.20\r\n007,2.00\r\nX,0\r\nY,"1,20"\r\n"Z\nZ",9\r\n')
assert rows == [{"sku":"007","price_cents":120},{"sku":"X","price_cents":0}]
assert [(x["line"],x["field"],x["code"]) for x in issues] == [(2,"price","invalid_price"),(4,"sku","duplicate_sku"),(6,"price","invalid_price"),(8,"sku","invalid_sku")]
for bad, message in [("", "Intestazione"), ("price,sku\n", "Intestazione"), ('sku,price\nA,1\nB,"9', "CSV illeggibile")]:
    try: run(bad)
    except ValueError as e: assert message in str(e)
    else: raise AssertionError(bad)`]);
});

test("Notebook: due processi puliti, ricalcolo delle celle e denominatore vuoto", t => {
  const { python } = fixture(t);
  const cells = blocks("Notebook mantenibili", "python");
  assert.equal(cells.length, 3);
  const full = cells.join("\n") + '\nassert summary == {"accepted":2,"rejected":1,"rejected_share":1/3}';
  assert.equal(python(["-c", full]).stdout, python(["-c", full]).stdout);
  python(["-c", full + "\n" + cells.slice(1).join("\n") +
    '\nassert summary["accepted"] == 2\nsnapshot = "sku,price\\n"\n' + cells.slice(1).join("\n") +
    '\nassert summary == {"accepted":0,"rejected":0,"rejected_share":None}']);
});

test("CLI: nessuna scrittura in anteprima, nessuna sovrascrittura o pubblicazione parziale di un lotto scartato", t => {
  const { dir, python } = fixture(t);
  const commands = blocks("Script di automazione", "sh");
  assert.deepEqual(commands, ["python export_catalog.py catalog.csv report.json", "python export_catalog.py catalog.csv report.json --apply"]);
  const [preview, apply] = commands.map(c => c.split(" ").slice(1));
  const source = join(dir, "catalog.csv"), target = join(dir, "report.json");
  writeFileSync(source, "sku,price\n007,0.09\n");
  assert.equal(python(preview).stdout.trim(), "would_create");
  assert.equal(existsSync(target), false);
  assert.equal(python(apply).stdout.trim(), "created");
  const bytes = readFileSync(target);
  assert.deepEqual(JSON.parse(bytes), [{ sku: "007", price_cents: 9 }]);
  assert.equal(python(apply).stdout.trim(), "unchanged");
  writeFileSync(source, "sku,price\n007,1.20\n");
  assert.match(python(apply, 1).stderr, /contenuto diverso/);
  assert.deepEqual(readFileSync(target), bytes);
  unlinkSync(target);
  writeFileSync(source, "sku,price\nA,1\nB,\n");
  assert.match(python(apply, 1).stderr, /linea 3, invalid_price/);
  assert.equal(existsSync(target), false);
  python(["export_catalog.py"], 2);
});

const parseProposal = example("Output strutturati", "parseProposal");
const proposeDelivery = example("Prompt e codice applicativo", "proposeDelivery");
const checkEvidence = example("Validazione dei dati generati", "checkEvidence");
const raw = one("Output strutturati", "json"), proposal = JSON.parse(raw);
const passages = [{ id: "S2", text: proposal.quote, privateTag: "interno" }];

test("Prompt: proiezione dei soli dati necessari e gestione distinta degli esiti dell'adattatore", async () => {
  const deps = { parseProposal, checkEvidence };
  const run = generate => proposeDelivery(passages, { ...deps, generate });
  const reviewed = await run(async request => {
    assert.deepEqual(request.data, [{ id: "S2", text: proposal.quote }]);
    assert.equal(request.promptVersion, "delivery-1");
    assert.equal(request.schemaVersion, 1);
    assert.match(request.instruction, /null/);
    return { kind: "complete", text: raw };
  });
  assert.equal(reviewed.kind, "needs_review");
  for (const kind of ["refused","incomplete"]) {
    assert.deepEqual(await run(async () => ({ kind })), { kind });
  }
  assert.equal((await run(async () => ({ kind: "complete", text: "{" }))).kind, "invalid_output");
  const none = { version:1, passageId:null, quote:null };
  assert.deepEqual(await run(async () => ({ kind:"complete", text:JSON.stringify(none) })), { kind:"abstained" });
  await assert.rejects(run(async () => ({ kind:"unrecognized" })), /sconosciuto/);
  const failure = new Error("trasporto");
  await assert.rejects(run(async () => { throw failure; }), e => e === failure);
});

test("Output: JSON, versione, chiavi esatte, coppia coerente e limiti UTF-16", () => {
  assert.deepEqual(parseProposal(raw), { ok:true, value:proposal });
  for (const [input, code] of [[null,"expected_text"],["{","invalid_json"],["null","expected_object"],["[]","expected_object"]]) {
    assert.deepEqual(parseProposal(input), { ok:false, code });
  }
  const check = obj => parseProposal(JSON.stringify(obj));
  assert.equal(check({ ...proposal, version:"1" }).code, "unsupported_version");
  assert.equal(check({ ...proposal, extra:true }).code, "invalid_fields");
  assert.equal(check({ version:1, passageId:"S2", other:"A" }).code, "invalid_fields");
  for (const overrides of [{ passageId:null },{ quote:null },{ quote:"  " },{ passageId:"x".repeat(65) },{ quote:"x".repeat(241) }]) {
    assert.equal(check({ ...proposal, ...overrides }).code, "invalid_evidence_pair");
  }
  assert.equal(check({ ...proposal, passageId:"x".repeat(64), quote:"x".repeat(240) }).ok, true);
});

test("Evidenza: citazione assente, fonte ambigua e citazione esatta in una negazione", () => {
  const p = { version:1, passageId:"S3", quote:"18 maggio" };
  const source = { id:"S3", text:"Il 18 maggio non è una data confermata." };
  assert.equal(checkEvidence(p, []).code, "source_not_unique_or_missing");
  assert.equal(checkEvidence(p, [source, source]).code, "source_not_unique_or_missing");
  assert.equal(checkEvidence({ ...p, quote:"19 maggio" }, [source]).code, "quote_not_found");
  assert.deepEqual(checkEvidence(p, [source]), {
    kind:"needs_review", passageId:"S3", quote:"18 maggio", context:source.text,
  });
});
