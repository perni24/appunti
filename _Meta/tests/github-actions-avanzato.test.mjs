import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import YAML from "../../site/node_modules/yaml/dist/index.js";
import { parseNote } from "../../site/scripts/vault.mjs";
import { fixture } from "./github-git-fixture.mjs";

const deploy = YAML.parse(
  fs.readFileSync(".github/workflows/deploy-pages.yml", "utf8"),
);
const manifest = JSON.parse(fs.readFileSync("site/package.json", "utf8"));

function examples(page, count = 1) {
  const { tree } = parseNote("Programmazione/GitHub/Pagine/" + page + ".md");
  const yaml = tree.children.filter(
    (n) => n.type === "code" && n.lang === "yaml",
  );
  assert.equal(yaml.length, count, page);
  return yaml.map((n) => YAML.parse(n.value));
}

function pwsh(step, dir, env, success = true) {
  assert.equal(step.shell, "pwsh");
  const r = spawnSync(
    "pwsh",
    ["-NoProfile", "-NonInteractive", "-Command", step.run],
    {
      cwd: dir,
      env: { ...process.env, ...env },
      encoding: "utf8",
      windowsHide: true,
      timeout: 20000,
    },
  );
  assert.ifError(r.error);
  assert.ok(Number.isInteger(r.status));
  assert.equal(r.status === 0, success, r.stderr);
  return r.stdout.trim();
}

test("Chiamante e chiamato concordano su input, livello di chiamata e controlli npm", () => {
  const [called, caller] = examples("Reusable workflows", 2);
  const call = caller.jobs.note,
    job = called.jobs.verifica;
  assert.deepEqual(Object.keys(call).sort(), ["uses", "with"]);
  assert.equal(call.uses, "./.github/workflows/verifica-vault.yml");
  assert.deepEqual(call.with, { test: true });
  assert.deepEqual(called.on.workflow_call.inputs.test, {
    type: "boolean",
    default: true,
  });
  assert.deepEqual(caller.permissions, called.permissions);
  const dir = job.defaults.run["working-directory"];
  assert.equal(dir, "site");
  const [checkout, setup, install, check, tests] = job.steps;
  assert.match(checkout.uses, /^actions\/checkout@/);
  assert.equal(setup.with["cache-dependency-path"], dir + "/package-lock.json");
  assert.ok(fs.existsSync(setup.with["cache-dependency-path"]));
  assert.equal(install.run, "npm ci");
  assert.equal(check.if, undefined);
  assert.equal(tests.if, "inputs.test");
  assert.deepEqual(
    [check.run, tests.run],
    ["npm run content:check", "npm run content:test"],
  );
  for (const { run } of [check, tests])
    assert.ok(manifest.scripts[run.slice("npm run ".length)]);
});

test("Composite: la dimensione passa tra gli step solo se il file supera la verifica", (t) => {
  const { dir } = fixture(t),
    file = path.join(dir, "Home.md"),
    output = path.join(dir, "out");
  const [action, [checkout, call, consumer]] = examples("Composite actions", 2);
  const [producer] = action.runs.steps;
  assert.match(checkout.uses, /^actions\/checkout@/);
  assert.equal(action.runs.using, "composite");
  assert.equal(call.uses, "./.github/actions/verifica-home");
  assert.equal(producer.env.MINIMO, "${{ inputs.minimo }}");
  assert.equal(
    action.outputs.byte.value,
    "${{ steps." + producer.id + ".outputs.byte }}",
  );
  assert.equal(
    consumer.env.DIMENSIONE,
    "${{ steps." + call.id + ".outputs.byte }}",
  );
  for (const [content, min] of [
    [null, "1"],
    ["", "1"],
    ["abc", "4"],
    ["abc", "zero"],
    ["abc", "0"],
  ]) {
    if (content !== null) fs.writeFileSync(file, content);
    pwsh(producer, dir, { MINIMO: min, GITHUB_OUTPUT: output }, false);
    assert.ok(!fs.existsSync(output));
  }
  fs.writeFileSync(file, "abc");
  pwsh(producer, dir, { MINIMO: "3", GITHUB_OUTPUT: output });
  assert.equal(fs.readFileSync(output, "utf8").trim(), "byte=3");
  assert.equal(pwsh(consumer, dir, { DIMENSIONE: "3" }), "3 byte");
});

test("Runner: il job della toolchain seleziona gruppo ed etichetta, non il runner Pages", () => {
  const [wf] = examples("Self-hosted runners");
  const job = wf.jobs["verifica-toolchain"];
  assert.deepEqual(job["runs-on"], {
    group: "laboratorio",
    labels: "arm-toolchain",
  });
  assert.deepEqual(job.permissions, {});
  assert.deepEqual(
    job.steps.map((s) => s.run),
    ["arm-none-eabi-gcc --version"],
  );
  assert.equal(deploy.jobs.build["runs-on"], "ubuntu-latest");
});

test("Concurrency: distingui Pages, la CI per PR e il job con coda multipla", () => {
  const [pages, pr, prod] = examples("Concurrency e cancel-in-progress", 3).map(
    (w) => w.concurrency,
  );
  assert.deepEqual(pages, deploy.concurrency);
  assert.deepEqual(pages, { group: "pages", "cancel-in-progress": false });
  assert.deepEqual(pr, {
    group: "ci-note-pr-${{ github.event.pull_request.number }}",
    "cancel-in-progress": true,
  });
  assert.deepEqual(prod, { group: "produzione", queue: "max" });
});

test("Schedule: orario feriale locale in inverno ed estate, input booleano solo manuale", () => {
  const [wf] = examples("Workflow dispatch e scheduled workflows");
  const [schedule] = wf.on.schedule;
  assert.equal(schedule.cron, "17 6 * * 1-5");
  assert.equal(schedule.timezone, "Europe/Rome");
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: schedule.timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  for (const utc of ["2026-01-05T05:17:00Z", "2026-07-06T04:17:00Z"]) {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(utc)).map((p) => [p.type, p.value]),
    );
    assert.deepEqual(
      [parts.weekday, parts.hour, parts.minute],
      ["Mon", "06", "17"],
    );
  }
  const input = wf.on.workflow_dispatch.inputs.completo;
  assert.equal(input.type, "boolean");
  assert.equal(input.default, false);
  const checks = wf.jobs.controlla.steps.filter((s) =>
    s.run?.startsWith("npm run "),
  );
  assert.equal(checks[0].if, undefined);
  assert.equal(
    checks[1].if,
    "github.event_name == 'schedule' || inputs.completo",
  );
  assert.ok(!Object.hasOwn(deploy.on, "schedule"));
});

test("Debug: stampa solo i valori previsti e segnala il lockfile mancante", (t) => {
  const { dir } = fixture(t);
  const [[step]] = examples("Debug GitHub Actions");
  const cwd = path.join(dir, step["working-directory"]);
  fs.mkdirSync(cwd);
  const env = {
    GITHUB_SHA: "1234abcd",
    GITHUB_EVENT_NAME: "push",
    PRIVATE_FIXTURE: "non-stampare-123",
  };
  pwsh(step, cwd, env, false);
  fs.writeFileSync(path.join(cwd, "package-lock.json"), "{}");
  const log = pwsh(step, cwd, env);
  assert.match(log, /Evento: push/);
  assert.match(log, /SHA: 1234abcd/);
  assert.match(log, /v\d+\.\d+\.\d+/);
  assert.ok(!log.includes(env.PRIVATE_FIXTURE));
});

test("Costi: la matrix limita la simultaneità, non i minuti aggregati dell'esempio", () => {
  const [job, [upload]] = examples("Costi e limiti GitHub Actions", 2);
  const { os, node } = job.strategy.matrix;
  const n = os.length * node.length;
  assert.equal(n, 6);
  assert.equal(job["timeout-minutes"], 20);
  assert.equal(n * 4, 24);
  assert.equal(Math.ceil(n / job.strategy["max-parallel"]) * 4, 12);
  assert.equal(upload.with["retention-days"], 7);
  assert.equal(upload.with.path, "risultati.xml");
});
