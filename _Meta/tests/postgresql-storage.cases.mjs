import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

export function storageCases({ run, flags, blocks, toast, paths }) {
  const [positions, generate, difference, checkpoint, counters] = blocks(
    "Write-Ahead Logging",
    5,
  );
  const [fill, hot, keyUpdate] = blocks("Fillfactor", 3);
  const [catalog, create, moveHeap, moveIndex, drop] = blocks("Tablespace", 5);
  const prompt = parseNote(
    "Programmazione/PostgreSQL/Pagine/Tablespace.md",
  ).tree.children.filter((n) => n.type === "code" && n.lang === "psql");
  assert.equal(prompt.length, 1);
  const rows = (...sql) =>
    run("psql", flags, sql.join("\n")).stdout.trim().split(/\r?\n/);
  function lsn(value) {
    assert.match(value, /^[0-9A-F]+\/[0-9A-F]+$/);
    const [upper, lower] = value.split("/").map((v) => BigInt("0x" + v));
    return (upper << 32n) + lower;
  }
  describe("Storage, WAL e Manutenzione", () => {
    test("LSN reali, intervallo WAL positivo e flush oltre il campione dopo il commit", () => {
      const points = rows(positions)[0].split("|");
      assert.equal(points.length, 3);
      points.forEach(lsn);
      const [measure, gone] = rows(
        generate,
        difference,
        "SELECT to_regclass('lab_wal_events') IS NULL;",
      );
      const [bytes, reached] = measure.split("|");
      assert.ok(BigInt(bytes) > 0n);
      assert.equal(reached, "t");
      assert.equal(gone, "t");
    });
    test("Checkpoint sul cluster di prova: redo non supera il record del checkpoint", () => {
      const [before, after, stat] = rows(
        checkpoint,
        "CHECKPOINT;",
        checkpoint,
        counters,
      );
      const [record, redo, timeline] = after.split("|");
      assert.ok(lsn(redo) <= lsn(record));
      assert.ok(lsn(record) > lsn(before.split("|")[0]));
      assert.ok(Number(timeline) >= 1);
      assert.ok(
        stat
          .split("|")
          .slice(0, 4)
          .every((v) => /^\d+$/.test(v)),
      );
    });
    test("Fillfactor: heap meno densa e HOT solo nella fase che non modifica la chiave", () => {
      const [sizes, initial, final] = rows(fill, hot, keyUpdate);
      const [dense, roomy] = sizes.split("|").map(Number);
      assert.ok(roomy > dense && dense > 0);
      const [updated, hotCount] = initial.split("|").map(Number);
      assert.equal(updated, 500);
      assert.ok(hotCount > 0 && hotCount <= updated);
      assert.deepEqual(final.split("|").map(Number), [1000, hotCount]);
    });
    test("Cambiare il fillfactor della heap non riscrive lo storage e non cambia l'opzione B-tree", () => {
      const query =
        "SELECT relname,reloptions,pg_relation_filenode(oid) FROM pg_class WHERE oid IN ('lab_roomy'::regclass,'lab_roomy_id'::regclass) ORDER BY relname;";
      const [, t1, i1, t2, i2] = rows(
        fill,
        query,
        "ALTER TABLE lab_roomy SET (fillfactor=70);",
        query,
        "ROLLBACK;",
      );
      assert.ok(t1.includes("fillfactor=60") && t2.includes("fillfactor=70"));
      assert.equal(t1.split("|")[2], t2.split("|")[2]);
      assert.ok(i1.includes("fillfactor=80"));
      assert.equal(i1, i2);
    });
    test("TOAST: una relazione associata non basta; il valore EXTERNAL occupa pagine", () => {
      assert.deepEqual(rows(toast), ["64000|t"]);
      const insert = "INSERT INTO lab_toast VALUES";
      assert.ok(toast.includes(insert));
      const empty =
        "SELECT reltoastrelid <> 0, pg_relation_size(reltoastrelid) FROM pg_class WHERE oid='lab_toast'::regclass;";
      assert.deepEqual(rows(toast.replace(insert, empty + "\n" + insert)), [
        "t|0",
        "64000|t",
      ]);
    });
    test("Tablespace: prompt psql, catalogo, heap e indice separati, rollback e rimozione", () => {
      const { root, data } = paths();
      // Anche con un errore gli oggetti rimangono confinati nella fixture del cluster.
      const location = fs
        .mkdtempSync(path.join(root, "lab-spazio-"))
        .replaceAll("\\", "/");
      assert.equal(
        path.dirname(fs.realpathSync(location)),
        fs.realpathSync(root),
      );
      assert.notEqual(fs.realpathSync(location), fs.realpathSync(data));
      const file = path.join(root, "lab-tablespace.sql");
      fs.writeFileSync(
        file,
        [
          prompt[0].value,
          create,
          catalog,
          moveHeap,
          moveIndex,
          drop,
          "SELECT count(*) FROM pg_tablespace WHERE spcname='lab_ts_fast';",
        ].join("\n"),
      );
      const output = run(
        "psql",
        [...flags, "-f", file],
        location + "\n",
      ).stdout;
      const lines = output.trim().split(/\r?\n/);
      // Quando stdin non è una console il prompt può precedere la prima riga.
      const match = output.match(/lab_ts_fast\|([^\r\n]+)/);
      assert.ok(match, output);
      assert.equal(fs.realpathSync(match[1]), fs.realpathSync(location));
      for (const s of [
        "pg_default|",
        "pg_global|",
        "lab_orders_idx|pg_default",
        "orders|lab_ts_fast",
        "1|90",
      ])
        assert.ok(
          lines.some((l) => l.endsWith(s)),
          s,
        );
      const filePaths = lines
        .find((l) => l.startsWith("pg_tblspc/"))
        .split("|");
      assert.equal(filePaths.length, 2);
      assert.ok(filePaths.every((p) => p.startsWith("pg_tblspc/")));
      assert.equal(filePaths[0].split("/")[1], filePaths[1].split("/")[1]);
      assert.notEqual(filePaths[0], filePaths[1]);
      assert.equal(lines.at(-1), "0");
    });
  });
}
