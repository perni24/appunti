import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHmac } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import YAML from "../../site/node_modules/yaml/dist/index.js";
import { parseNote } from "../../site/scripts/vault.mjs";
import { fixture } from "./github-git-fixture.mjs";

function blocks(page, language, count = 1) {
  const { tree } = parseNote("Programmazione/GitHub/Pagine/" + page + ".md");
  const found = tree.children.filter(
    (n) => n.type === "code" && n.lang === language,
  );
  assert.equal(found.length, count, page);
  return found.map((n) => n.value);
}

function js(page) {
  return import(
    "data:text/javascript," + encodeURIComponent(blocks(page, "js")[0])
  );
}

test("REST: il comando del report usa tutte le pagine e distingue una PR dalla sua issue", (t) => {
  const [request, command] = blocks("GitHub REST API", "bash", 2);
  assert.match(request, /--method GET\b/);
  assert.ok(request.includes("--paginate --slurp"));
  assert.ok(
    request.includes("repos/OWNER/REPO/issues?state=open&per_page=100"),
  );
  const script = /^node -e "([^"]+)"$/.exec(command)?.[1];
  assert.ok(script);
  const { dir } = fixture(t);
  const issue = {
    number: 12,
    title: "Rivedere l'indice",
    body: "non necessario",
  };
  const pages = [
    [{ number: 10, title: "Prima PR", pull_request: {} }, issue],
    [],
    [{ number: 15, title: "Seconda issue" }],
  ];
  for (const [input, expected] of [
    [
      pages,
      [
        { number: 12, title: issue.title },
        { number: 15, title: "Seconda issue" },
      ],
    ],
    [[[]], []],
  ]) {
    fs.writeFileSync(path.join(dir, "pagine.json"), JSON.stringify(input));
    const r = spawnSync(process.execPath, ["-e", script], {
      cwd: dir,
      encoding: "utf8",
      windowsHide: true,
    });
    assert.ifError(r.error);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(JSON.parse(r.stdout), expected);
  }
});

test("GraphQL: query e CLI condividono le variabili e richiedono i cursori della stessa connection", () => {
  const page = "GitHub GraphQL API";
  const [query] = blocks(page, "graphql"),
    [cmd] = blocks(page, "bash");
  assert.match(
    query,
    /\$owner: String!, \$name: String!, \$endCursor: String\)/,
  );
  assert.match(query, /repository\(owner: \$owner, name: \$name\)/);
  assert.match(
    query,
    /issues\(first: 50, after: \$endCursor, states: \[OPEN\]\)/,
  );
  assert.match(query, /pageInfo\s*\{\s*hasNextPage\s+endCursor\s*\}/);
  assert.ok(
    cmd.includes("--paginate --slurp") &&
      cmd.includes("-F query=@issue.graphql"),
  );
  assert.ok(cmd.includes("-f owner=OWNER") && cmd.includes("-f name=REPO"));
  const partial = JSON.parse(blocks(page, "json")[0]);
  assert.deepEqual(partial.errors[0].path, ["repository"]);
  assert.equal(partial.data.repository, null);
  assert.ok(partial.data.viewer.login);
});

test("Webhook: vettore ufficiale, corpo esatto e firma obbligatoria", async () => {
  const { firmaValida } = await js("Webhooks GitHub");
  // Vettore pubblico di GitHub Docs, non una credenziale o una consegna reale.
  const secret = "It's a Secret to Everybody";
  const body = Buffer.from("Hello, World!");
  const signature =
    "sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17";
  assert.equal(firmaValida(body, secret, signature), true);
  for (const header of [undefined, "", "sha256=ab"])
    assert.equal(firmaValida(body, secret, header), false);
  assert.equal(firmaValida(body, "", signature), false);
  assert.equal(firmaValida(body, "altro", signature), false);
  const json = Buffer.from('{ "azione": "aperta" }');
  const signed =
    "sha256=" + createHmac("sha256", secret).update(json).digest("hex");
  assert.equal(firmaValida(json, secret, signed), true);
  assert.equal(
    firmaValida(
      Buffer.from(JSON.stringify(JSON.parse(json.toString()))),
      secret,
      signed,
    ),
    false,
  );
});

test("Identità: i comandi per installazione, persona e creazione issue hanno risorse e metodi distinti", () => {
  const [app] = blocks("GitHub Apps", "bash");
  assert.equal(
    app,
    "gh api --paginate installation/repositories --jq '.repositories[].full_name'",
  );
  const [who, read] = blocks("Personal access token GitHub", "bash", 2);
  assert.equal(who, "gh api user --jq '.login'");
  assert.ok(read.startsWith("gh api repos/OWNER/REPO/issues/12 --jq "));
  const [create] = blocks("Fine-grained token GitHub", "bash");
  assert.ok(create.startsWith("gh api --method POST repos/OWNER/REPO/issues "));
  assert.ok(create.includes("-f title=") && create.includes("-f body="));
});

test("Triage: solo issue aperte, scrittura limitata alle label senza checkout", () => {
  const wf = YAML.parse(blocks("Automazioni issue e pull request", "yaml")[0]);
  assert.deepEqual(wf.on, { issues: { types: ["opened"] } });
  assert.deepEqual(wf.permissions, {});
  const job = wf.jobs.etichetta;
  assert.deepEqual(job.permissions, { issues: "write" });
  assert.equal(job.steps.length, 1);
  const [step] = job.steps;
  assert.equal(step.env.REPO, "${{ github.repository }}");
  assert.equal(step.env.NUMBER, "${{ github.event.issue.number }}");
  assert.equal(step.env.GH_TOKEN, "${{ secrets.GITHUB_TOKEN }}");
  assert.equal(
    step.run,
    `gh api --method POST "repos/$REPO/issues/$NUMBER/labels" -f 'labels[]=triage' --silent`,
  );
});

test("Classificazione PR: rename tra aree, file estranei e assenza di label duplicate", async () => {
  const { etichetteProposte } = await js("Automazioni issue e pull request");
  assert.deepEqual(etichetteProposte([]), []);
  assert.deepEqual(
    etichetteProposte([
      { filename: "Programmazione-extra/A.md" },
      { filename: "Home.md" },
    ]),
    [],
  );
  assert.deepEqual(
    etichetteProposte([
      {
        filename: "Stampante 3D/A.md",
        previous_filename: "Programmazione/A.md",
      },
      { filename: "Stampante 3D/B.md" },
      { filename: "Programmi open source/Pagine/C.md" },
    ]),
    ["programmazione", "stampa-3d", "open-source"],
  );
});
