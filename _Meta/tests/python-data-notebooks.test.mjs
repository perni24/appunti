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

assert.ok(process.env.PYTHON_DATA_TOOLS, "Set PYTHON_DATA_TOOLS; see README.");
const python = join(process.env.PYTHON_DATA_TOOLS, "Scripts", "python.exe");
const temp = realpathSync(tmpdir());
const root = mkdtempSync(join(temp, "appunti-python-data-test-"));
const env = {
  ...process.env,
  PYTHONUTF8: "1",
  PYTHONDONTWRITEBYTECODE: "1",
  JUPYTER_CONFIG_DIR: join(root, "config"),
  JUPYTER_DATA_DIR: join(root, "data"),
  JUPYTER_RUNTIME_DIR: join(root, "runtime"),
  IPYTHONDIR: join(root, "ipython"),
  JUPYTER_PATH: join(root, "kernel-prefix", "share", "jupyter"),
  PATH: join(process.env.PYTHON_DATA_TOOLS, "Scripts") + ";" + process.env.PATH,
};
delete env.PYTHONPATH;
delete env.PYTHONHOME;
for (const key of [
  "JUPYTER_CONFIG_DIR",
  "JUPYTER_DATA_DIR",
  "JUPYTER_RUNTIME_DIR",
  "IPYTHONDIR",
])
  mkdirSync(env[key], { recursive: true });
after(() => {
  const actual = realpathSync(root),
    rel = relative(temp, actual);
  assert.ok(
    rel &&
      !rel.startsWith("..") &&
      !isAbsolute(rel) &&
      actual.includes("appunti-python-data-test-"),
  );
  rmSync(actual, { recursive: true, force: true });
});
const names = ["pandas", "NumPy", "Jupyter"];
const notes = names.map((n) =>
  parseNote("Programmazione/Python/Pagine/" + n + ".md"),
);
const text = (n) => n.value ?? (n.children ?? []).map(text).join("");
function block(i, heading, lang = "python") {
  const nodes = notes[i].tree.children;
  const at = nodes.findIndex(
    (n) => n.type === "heading" && text(n) === heading,
  );
  assert.ok(at >= 0, heading);
  const b = nodes.slice(at + 1).find((n) => n.type === "code");
  assert.equal(b.lang, lang);
  return b.value;
}
const dirs = names.map((_, i) => join(root, String(i)));
dirs.forEach((d) => mkdirSync(d));
function put(i, name, value) {
  writeFileSync(join(dirs[i], name), value + "\n");
}
function py(i, args, status = 0, timeout = 120000) {
  const r = spawnSync(python, ["-X", "utf8", ...args], {
    cwd: dirs[i],
    env,
    encoding: "utf8",
    windowsHide: true,
    timeout,
    maxBuffer: 4 * 2 ** 20,
  });
  assert.ifError(r.error);
  if (status !== null)
    assert.equal(r.status, status, args.join(" ") + "\n" + r.stdout + r.stderr);
  return r;
}
function probe(i, code) {
  return py(i, ["-c", "import unittest\nexpect=unittest.TestCase()\n" + code]);
}
function cases(i, prefix, rows) {
  for (const [name, code] of rows)
    test(names[i] + ": " + name, () => probe(i, prefix + "\n" + code));
}
const files = [
  ["indexing_demo.py", "sales_report.py", "merge_demo.py"],
  [
    "shapes_demo.py",
    "broadcasting_demo.py",
    "indexing_demo.py",
    "normalization.py",
    "numerical_demo.py",
  ],
];
for (let i = 0; i < 2; i++) for (const f of files[i]) put(i, f, block(i, f));
put(2, "sales_report.py", block(0, "sales_report.py"));
const cellSources = [
  "Cella 1 - Ambiente e import",
  "Cella 2 - Dati e report",
  "Cella 3 - Verifica del risultato",
].map((h) => block(2, h));
const magicSources = notes[2].tree.children
  .filter((n) => n.type === "code" && n.lang === "ipython")
  .map((n) => n.value);
function notebook(sources, metadata = {}) {
  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: {
        name: "python-appunti",
        display_name: "Python (appunti)",
        language: "python",
      },
      ...metadata,
    },
    cells: sources.map((source, i) => ({
      cell_type: "code",
      id: "cell-" + i,
      metadata: {},
      source,
      outputs: [],
      execution_count: null,
    })),
  };
}
function putNotebook(name, nb) {
  put(2, name, JSON.stringify(nb));
}
putNotebook("report.ipynb", notebook(cellSources));
test("baseline e versioni", () =>
  probe(
    0,
    String.raw`
import sys, importlib.metadata as m
assert sys.version_info[:3]==(3,12,10)
for n,v in {"pandas":"3.1.0","numpy":"2.5.4","jupyterlab":"4.6.4","notebook":"7.6.3","ipykernel":"7.4.0","nbconvert":"7.17.2","nbformat":"5.11.1"}.items():
    assert m.version(n)==v,(n,m.version(n))
`,
  ));
test("tutti i blocchi Python e magic estratti", () => {
  assert.deepEqual(
    notes.map(
      (n) =>
        n.tree.children.filter((n) => n.type === "code" && n.lang === "python")
          .length,
    ),
    [3, 5, 3],
  );
  assert.equal(magicSources.length, 3);
});
for (let i = 0; i < 2; i++)
  for (const file of files[i])
    test(names[i] + ": esecuzione " + file, () => py(i, [file]));
const pandasSetup = String.raw`
from io import StringIO
import numpy as np
import pandas as pd
from sales_report import *
`;
cases(0, pandasSetup, [
  [
    "report riconcilia righe, importi mancanti e gruppi",
    String.raw`
sales=read_sales(StringIO(DEMO_CSV))
before=sales.copy()
report=summarize_sales(sales)
pd.testing.assert_frame_equal(sales,before)
assert report.orders.sum()==5 and report.missing_amounts.sum()==2
assert report.known_amount_cents.sum()==1950
assert report.loc[report.region.isna(),"known_amount_cents"].item()==200
assert pd.isna(report.loc[report.region.eq("Est").fillna(False),"known_amount_cents"].item())
`,
  ],
  [
    "CSV preserva codice NA e ID con zero iniziale",
    String.raw`
df=read_sales(StringIO("order_id,region,amount_cents\n001,NA,0\n"))
assert df.iloc[0].order_id=="001" and df.iloc[0].region=="NA"
assert df.iloc[0].amount_cents==0 and str(df.amount_cents.dtype)=="Int64"
`,
  ],
  [
    "colonne mancanti, extra e duplicate rifiutate",
    String.raw`
for csv in ["order_id,region\nx,Nord\n","order_id,region,amount_cents,extra\nx,Nord,1,v\n","order_id,region,amount_cents,region\nx,Nord,1,Sud\n"]:
    with expect.assertRaises(ValueError):
        read_sales(StringIO(csv))
`,
  ],
  [
    "importi non conformi rifiutati senza coercizione silenziosa",
    String.raw`
for value in ["-1","1.5","1e3","true","NaN","inf","1000000000","abc"]:
    with expect.assertRaises(ValueError):
        read_sales(StringIO("order_id,region,amount_cents\nx,Nord,"+value+"\n"))
`,
  ],
  [
    "ID duplicati o vuoti rifiutati",
    String.raw`
for csv in ["order_id,region,amount_cents\nx,Nord,1\nx,Sud,2\n","order_id,region,amount_cents\n,Nord,1\n","order_id,region,amount_cents\nx y,Nord,1\n"]:
    with expect.assertRaises(ValueError):
        read_sales(StringIO(csv))
`,
  ],
  [
    "header senza record produce report vuoto",
    String.raw`
report=summarize_sales(read_sales(StringIO("order_id,region,amount_cents\n")))
assert report.empty
assert set(report.columns)=={"region","orders","known_orders","known_amount_cents","missing_amounts"}
`,
  ],
  [
    "valori mancanti diversi da zero",
    String.raw`
df=read_sales(StringIO("order_id,region,amount_cents\na,Nord,\nb,Sud,0\n"))
r=summarize_sales(df).set_index("region")
assert pd.isna(r.loc["Nord","known_amount_cents"])
assert r.loc["Sud","known_amount_cents"]==0
with expect.assertRaises(TypeError):
    bool(pd.NA)
`,
  ],
  [
    "groupby default scarta chiavi NA e min_count evita zero fittizio",
    String.raw`
df=pd.DataFrame({"region":["Nord",None],"amount":pd.Series([pd.NA,pd.NA],dtype="Int64")})
assert df.groupby("region").size().sum()==1
assert df.groupby("region",dropna=False).size().sum()==2
assert df.amount.sum()==0 and pd.isna(df.amount.sum(min_count=1))
`,
  ],
  [
    "assegnazione Series si allinea per etichetta",
    String.raw`
df=pd.DataFrame({"x":[1,2]},index=["a","b"])
df["y"]=pd.Series([100,200],index=["b","a"])
assert df.y.tolist()==[200,100]
with expect.assertRaises(ValueError):
    bool(df.x>0)
`,
  ],
  [
    "Copy-on-Write non separa due alias dello stesso DataFrame",
    String.raw`
df=pd.DataFrame({"x":[1,2]})
child=df["x"]
child.iloc[0]=9
assert df.iloc[0,0]==1
alias=df
alias.loc[0,"x"]=5
assert df.iloc[0,0]==5
`,
  ],
  [
    "copy deep non copia ricorsivamente oggetti nelle celle",
    String.raw`
df=pd.DataFrame({"items":[[1,2]]})
other=df.copy(deep=True)
other.iloc[0,0].append(3)
assert df.iloc[0,0]==[1,2,3]
`,
  ],
  [
    "merge controlla cardinalita e null puo corrispondere a null",
    String.raw`
left=pd.DataFrame({"key":["x","x"]})
right=pd.DataFrame({"key":["x","x"]})
with expect.assertRaises(pd.errors.MergeError):
    left.merge(right,validate="many_to_one")
assert len(left.merge(right))==4
assert len(pd.DataFrame({"key":[None]}).merge(pd.DataFrame({"key":[None]})))==1
`,
  ],
  [
    "merge indicator individua chiavi senza corrispondenza",
    String.raw`
result=pd.DataFrame({"key":["a","b"]}).merge(pd.DataFrame({"key":["a"]}),how="left",indicator=True,validate="many_to_one")
assert result["_merge"].astype("string").tolist()==["both","left_only"]
`,
  ],
  [
    "CSV esportato non introduce una colonna indice",
    String.raw`
df=summarize_sales(read_sales(StringIO(DEMO_CSV)))
buffer=StringIO()
df.to_csv(buffer,index=False)
assert not buffer.getvalue().startswith(",")
assert len(pd.read_csv(StringIO(buffer.getvalue())))==4
`,
  ],
]);
const numpySetup = String.raw`
import numpy as np
from normalization import standardize_columns
`;
cases(1, numpySetup, [
  [
    "normalizzazione preserva input e shape",
    String.raw`
data=np.array([[1,5],[2,5],[3,5]],dtype=np.int64)
before=data.copy()
result=standardize_columns(data)
assert result.shape==data.shape and result.dtype==np.float64
np.testing.assert_array_equal(before,data)
assert not np.shares_memory(result,data)
np.testing.assert_allclose(result.mean(axis=0),[0,0],atol=1e-12)
np.testing.assert_allclose(result.std(axis=0),[1,0])
`,
  ],
  [
    "costanti e singola osservazione diventano zero",
    String.raw`
np.testing.assert_array_equal(standardize_columns([[5,6]]),[[0,0]])
np.testing.assert_array_equal(standardize_columns([[5],[5]]),[[0],[0]])
`,
  ],
  [
    "forme vuote o diverse da 2D rifiutate",
    String.raw`
for value in [[],[1,2],np.empty((0,2)),np.empty((2,0)),np.zeros((1,2,3)),42]:
    with expect.assertRaises(ValueError):
        standardize_columns(value)
`,
  ],
  [
    "dtype bool, object, string e complessi rifiutati",
    String.raw`
for value in [[[True,False]],[["1","2"]],[[1+2j]],np.array([[1,2]],dtype=object)]:
    with expect.assertRaises(TypeError):
        standardize_columns(value)
`,
  ],
  [
    "NaN e infinito non diventano silenziosamente zero",
    String.raw`
for value in [np.nan,np.inf,-np.inf]:
    with expect.assertRaises(ValueError):
        standardize_columns([[1,value],[2,3]])
`,
  ],
  [
    "overflow delle riduzioni genera errore",
    String.raw`
with expect.assertRaises(FloatingPointError):
    standardize_columns([[1e308],[-1e308]])
`,
  ],
  [
    "conversione della lista mista precede controllo dtype",
    String.raw`
np.testing.assert_array_equal(standardize_columns([[True,2]]),[[0,0]])
`,
  ],
  [
    "ddof ha un effetto osservabile",
    String.raw`
data=np.array([1.,2.,3.])
assert not np.isclose(data.std(ddof=0),data.std(ddof=1))
np.testing.assert_allclose(data.std(ddof=1),1)
`,
  ],
  [
    "allclose non verifica da solo la shape",
    String.raw`
assert np.allclose(np.array([[1,2],[1,2]]),np.array([1,2]))
assert np.allclose(1e-9,2e-9)
assert not np.allclose(1e-9,2e-9,atol=0,rtol=1e-5)
`,
  ],
  [
    "reshape, trasposta e copie dichiarate",
    String.raw`
a=np.arange(12).reshape(3,4)
assert np.shares_memory(a,a.T)
assert not a.T.flags.c_contiguous
assert not np.shares_memory(a,a.flatten())
with expect.assertRaises(ValueError):
    a.reshape(5,5)
`,
  ],
  [
    "indicizzazione avanzata lettura copia, assegnazione scrive",
    String.raw`
a=np.arange(5)
b=a[a>2]
b[:]=99
assert a.tolist()==[0,1,2,3,4]
a[a>2]=99
assert a.tolist()==[0,1,2,99,99]
`,
  ],
  [
    "solve rifiuta matrice singolare",
    String.raw`
with expect.assertRaises(np.linalg.LinAlgError):
    np.linalg.solve([[1.,2.],[2.,4.]],[1.,2.])
`,
  ],
  [
    "vettorizzazione Python non elimina chiamate per elemento",
    String.raw`
seen=[]
f=np.vectorize(lambda x: seen.append(x) or x*2,otypes=[int])
np.testing.assert_array_equal(f([1,2,3]),[2,4,6])
assert seen==[1,2,3]
`,
  ],
]);
test("Jupyter: kernel, esecuzione, esportazione e casi negativi", async (t) => {
  const nbconvert = (args, status = 0) =>
    py(2, ["-m", "nbconvert", ...args], status);
  const execute = [
    "--to",
    "notebook",
    "--execute",
    "--ExecutePreprocessor.kernel_name=python-appunti",
    "--ExecutePreprocessor.timeout=60",
    "--ExecutePreprocessor.force_raise_errors=True",
  ];
  await t.test("kernelspec isolato con interprete corretto", () => {
    py(2, [
      "-m",
      "ipykernel",
      "install",
      "--prefix",
      join(root, "kernel-prefix"),
      "--name",
      "python-appunti",
      "--display-name",
      "Python (appunti)",
    ]);
    const spec = JSON.parse(
      readFileSync(
        join(
          root,
          "kernel-prefix/share/jupyter/kernels/python-appunti/kernel.json",
        ),
        "utf8",
      ),
    );
    assert.equal(realpathSync(spec.argv[0]), realpathSync(python));
    const listed = JSON.parse(
      py(2, ["-m", "jupyter", "kernelspec", "list", "--json"]).stdout,
    );
    assert.ok(listed.kernelspecs["python-appunti"]);
  });
  await t.test("interfacce installate espongono opzioni di avvio", () => {
    assert.match(py(2, ["-m", "jupyterlab", "--help"]).stdout, /no-browser/);
    assert.match(py(2, ["-m", "notebook", "--help"]).stdout, /no-browser/);
  });
  await t.test("notebook ricostruito valido e sorgente senza output", () => {
    probe(
      2,
      String.raw`
import nbformat
nb=nbformat.read("report.ipynb",as_version=4)
nbformat.validate(nb)
assert len(nb.cells)==3
assert all(c.execution_count is None and not c.outputs for c in nb.cells)
`,
    );
  });
  await t.test("esecuzione in kernel nuovo delle tre celle originali", () => {
    nbconvert([
      ...execute,
      "report.ipynb",
      "--output",
      "report.executed.ipynb",
    ]);
    const nb = JSON.parse(
      readFileSync(join(dirs[2], "report.executed.ipynb"), "utf8"),
    );
    assert.deepEqual(
      nb.cells.map((c) => c.execution_count),
      [1, 2, 3],
    );
    assert.ok(nb.cells[1].outputs.some((o) => o.data?.["text/html"]));
    assert.match(JSON.stringify(nb.cells[2].outputs), /Report verificato/);
    assert.deepEqual(
      JSON.parse(readFileSync(join(dirs[2], "report.ipynb"), "utf8")).cells.map(
        (c) => c.execution_count,
      ),
      [null, null, null],
    );
  });
  await t.test("seconda esecuzione pulita mantiene il risultato", () => {
    nbconvert([...execute, "report.ipynb", "--output", "report.second.ipynb"]);
    const first = JSON.parse(
      readFileSync(join(dirs[2], "report.executed.ipynb"), "utf8"),
    );
    const second = JSON.parse(
      readFileSync(join(dirs[2], "report.second.ipynb"), "utf8"),
    );
    assert.deepEqual(first.cells[1].outputs, second.cells[1].outputs);
  });
  await t.test("HTML contiene tabella e risultato salvato", () => {
    nbconvert([
      "--to",
      "html",
      "report.executed.ipynb",
      "--output",
      "report.html",
    ]);
    const html = readFileSync(join(dirs[2], "report.html"), "utf8");
    assert.match(html, /<table/);
    assert.match(html, /known_amount_cents/);
    assert.match(html, /Report verificato/);
  });
  await t.test(
    "clear output non cancella codice o modifica l'originale",
    () => {
      nbconvert([
        "--to",
        "notebook",
        "report.executed.ipynb",
        "--ClearOutputPreprocessor.enabled=True",
        "--output",
        "report.clean.ipynb",
      ]);
      const clean = JSON.parse(
        readFileSync(join(dirs[2], "report.clean.ipynb"), "utf8"),
      );
      assert.deepEqual(
        clean.cells.map((c) =>
          Array.isArray(c.source) ? c.source.join("") : c.source,
        ),
        cellSources,
      );
      assert.ok(
        clean.cells.every(
          (c) => !c.outputs.length && c.execution_count === null,
        ),
      );
      assert.ok(
        JSON.parse(readFileSync(join(dirs[2], "report.executed.ipynb"), "utf8"))
          .cells[1].outputs.length,
      );
    },
  );
  await t.test("celle fuori ordine falliscono in kernel nuovo", () => {
    putNotebook(
      "out_of_order.ipynb",
      notebook([cellSources[1], cellSources[0], cellSources[2]]),
    );
    const r = nbconvert(
      [
        ...execute,
        "out_of_order.ipynb",
        "--output",
        "out_of_order.executed.ipynb",
      ],
      null,
    );
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /NameError/);
  });
  await t.test("force_raise_errors prevale su raises-exception", () => {
    const nb = notebook(["raise ValueError('intentional-test-error')"]);
    nb.cells[0].metadata.tags = ["raises-exception"];
    putNotebook("error.ipynb", nb);
    const r = nbconvert(
      [...execute, "error.ipynb", "--output", "error.executed.ipynb"],
      null,
    );
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /intentional-test-error/);
  });
  await t.test("timeout per cella interrompe il notebook di prova", () => {
    putNotebook("timeout.ipynb", notebook(["import time\ntime.sleep(20)"]));
    const r = nbconvert(
      [
        ...execute.map((arg) =>
          arg === "--ExecutePreprocessor.timeout=60"
            ? "--ExecutePreprocessor.timeout=1"
            : arg,
        ),
        "timeout.ipynb",
        "--output",
        "timeout.executed.ipynb",
      ],
      null,
    );
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /CellTimeoutError|timed out/);
  });
  await t.test("magic originali eseguite nel kernel IPython", () => {
    putNotebook("magics.ipynb", notebook(magicSources));
    nbconvert([
      ...execute,
      "magics.ipynb",
      "--output",
      "magics.executed.ipynb",
    ]);
    const nb = JSON.parse(
      readFileSync(join(dirs[2], "magics.executed.ipynb"), "utf8"),
    );
    assert.match(JSON.stringify(nb.cells[1].outputs), /per loop/);
    assert.match(JSON.stringify(nb.cells[2].outputs), /pip/);
  });
});
