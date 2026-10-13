import assert from "node:assert/strict";
import { before, test } from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  realpath,
  rm,
  readdir,
  access,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join, dirname, basename, sep } from "node:path";
import { snippet } from "./note-examples.mjs";
import { parseNote } from "../../site/scripts/vault.mjs";

const exec = promisify(execFile);
const note = "Supply chain security npm";
const cli =
  process.env.NPM_CLI_PATH ||
  join(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js");
const demo = JSON.parse(snippet(note, '"npm-scripts-demo"', "json"));
const command = (marker) =>
  snippet(note, marker, "sh").trim().split(/\s+/).slice(1);
const exists = async (file) =>
  access(file).then(
    () => true,
    () => false,
  );

before(async () => {
  const { stdout } = await exec(process.execPath, [cli, "--version"]);
  assert.equal(
    stdout.trim(),
    "11.19.0",
    "Set NPM_CLI_PATH to npm 11.19.0 for this versioned demonstration",
  );
  console.log(
    `Supply chain CLI: Node ${process.version}, npm ${stdout.trim()}`,
  );
});

async function fixture(t, dependency = false) {
  const temp = await realpath(tmpdir());
  const root = await mkdtemp(join(temp, "appunti-npm-review-"));
  const checked = async (target) => {
    const actual = await realpath(target);
    assert.ok(actual === root || actual.startsWith(root + sep));
    assert.ok(root.startsWith(resolve(temp) + sep));
    assert.ok(basename(root).startsWith("appunti-npm-review-"));
    return actual;
  };
  t.after(async () => {
    await checked(root);
    await rm(root, { recursive: true, force: true });
  });
  const cwd = join(root, "project");
  await mkdir(cwd);
  const userconfig = join(root, "user.npmrc");
  const globalconfig = join(root, "global.npmrc");
  await writeFile(userconfig, "");
  await writeFile(globalconfig, "");
  // Do not pass registry credentials or arbitrary npm/Node configuration to fixtures.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      /^(PATH|SYSTEMROOT|WINDIR|COMSPEC|PATHEXT|TEMP|TMP|HOME|USERPROFILE)$/i.test(
        key,
      ),
    ),
  );
  Object.assign(env, {
    npm_config_userconfig: userconfig,
    npm_config_globalconfig: globalconfig,
    npm_config_cache: join(root, "cache"),
    npm_config_registry: "http://127.0.0.1:9/",
    npm_config_offline: "true",
    npm_config_update_notifier: "false",
    npm_config_audit: "false",
    npm_config_fund: "false",
  });
  async function npm(args, dir = cwd) {
    await checked(dir);
    try {
      const result = await exec(process.execPath, [cli, ...args], {
        cwd: dir,
        env,
        timeout: 20_000,
        maxBuffer: 1024 * 1024,
      });
      return { code: 0, ...result };
    } catch (error) {
      if (typeof error.code !== "number") throw error;
      return { code: error.code, stdout: error.stdout, stderr: error.stderr };
    }
  }
  const ok = (result) => {
    assert.equal(result.code, 0, result.stderr || result.stdout);
    return result;
  };
  const pkg = structuredClone(demo);
  if (dependency) {
    const source = join(root, "dependency");
    await mkdir(source);
    await writeFile(
      join(source, "package.json"),
      JSON.stringify({
        name: "review-local-dependency",
        version: "1.0.0",
        scripts: { postinstall: "node marker.cjs" },
        main: "index.cjs",
      }),
    );
    await writeFile(
      join(source, "marker.cjs"),
      'require("node:fs").writeFileSync("installed.txt", "ran");',
    );
    await writeFile(
      join(source, "index.cjs"),
      'module.exports = "local fixture";',
    );
    const result = ok(
      await npm(["pack", "--ignore-scripts", "--json"], source),
    );
    const [{ filename }] = JSON.parse(result.stdout);
    pkg.dependencies = {
      "review-local-dependency": `file:../dependency/${filename}`,
    };
    // The second logical dependency is a dev-only alias of the same harmless local tarball.
    pkg.devDependencies = {
      "review-local-tool": `file:../dependency/${filename}`,
    };
  }
  const save = () =>
    writeFile(join(cwd, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
  await save();
  const lock = async () =>
    ok(await npm(command("npm install --package-lock-only")));
  const ci = () => npm(command("npm ci --ignore-scripts"));
  return { cwd, pkg, save, npm, ok, lock, ci };
}

test("Supply chain: demo privata e comandi separati nel Markdown", () => {
  assert.equal(demo.private, true);
  assert.equal(demo.dependencies, undefined);
  for (const script of Object.values(demo.scripts)) {
    assert.match(script, /^node -e "console\.log\('[A-Z]+'\)"$/);
  }
  const blocks = parseNote(
    `Programmazione/JavaScript/Pagine/${note}.md`,
  ).tree.children.filter((n) => n.type === "code" && n.lang === "sh");
  assert.ok(blocks.length >= 14);
  assert.ok(blocks.every((n) => n.value.trim().split(/\r?\n/).length === 1));
});

test("Supply chain: lockfile-only non esegue postinstall e non crea node_modules", async (t) => {
  const f = await fixture(t);
  const result = await f.lock();
  assert.equal(await exists(join(f.cwd, "package-lock.json")), true);
  assert.equal(await exists(join(f.cwd, "node_modules")), false);
  assert.doesNotMatch(result.stdout, /^INSTALL$/m);
});

test("Supply chain: ci senza lockfile fallisce senza creare un lock", async (t) => {
  const f = await fixture(t);
  const result = await f.ci();
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /lockfile|package-lock|shrinkwrap/i);
  assert.equal(await exists(join(f.cwd, "package-lock.json")), false);
});

test("Supply chain: ci ignora gli script e conserva manifest e lockfile", async (t) => {
  const f = await fixture(t, true);
  await f.lock();
  const manifest = await readFile(join(f.cwd, "package.json"), "utf8");
  const lock = await readFile(join(f.cwd, "package-lock.json"), "utf8");
  const result = f.ok(await f.ci());
  assert.doesNotMatch(result.stdout, /^INSTALL$/m);
  assert.equal(
    await exists(join(f.cwd, "node_modules/review-local-dependency/index.cjs")),
    true,
  );
  assert.equal(
    await exists(
      join(f.cwd, "node_modules/review-local-dependency/installed.txt"),
    ),
    false,
  );
  assert.equal(await readFile(join(f.cwd, "package.json"), "utf8"), manifest);
  assert.equal(await readFile(join(f.cwd, "package-lock.json"), "utf8"), lock);
});

test("Supply chain: ci ricrea node_modules eliminando un file estraneo", async (t) => {
  const f = await fixture(t, true);
  await f.lock();
  await mkdir(join(f.cwd, "node_modules"));
  await writeFile(
    join(f.cwd, "node_modules/untracked-fixture.txt"),
    "temporary",
  );
  f.ok(await f.ci());
  assert.equal(
    await exists(join(f.cwd, "node_modules/untracked-fixture.txt")),
    false,
  );
  assert.equal(
    await exists(join(f.cwd, "node_modules/review-local-dependency/index.cjs")),
    true,
  );
});

test("Supply chain: ci rifiuta manifest e lockfile disallineati", async (t) => {
  const f = await fixture(t, true);
  await f.lock();
  const lock = await readFile(join(f.cwd, "package-lock.json"), "utf8");
  f.pkg.dependencies["review-added"] =
    f.pkg.dependencies["review-local-dependency"];
  await f.save();
  const result = await f.ci();
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /in sync|Missing|lock file/i);
  assert.equal(await readFile(join(f.cwd, "package-lock.json"), "utf8"), lock);
});

test("Supply chain npm 11: senza ignore-scripts i lifecycle locali vengono eseguiti", async (t) => {
  const f = await fixture(t, true);
  await f.lock();
  const result = f.ok(
    await f.npm(
      command("npm ci --ignore-scripts").filter(
        (arg) => arg !== "--ignore-scripts",
      ),
    ),
  );
  assert.match(result.stdout, /^INSTALL$/m);
  assert.equal(
    await readFile(
      join(f.cwd, "node_modules/review-local-dependency/installed.txt"),
      "utf8",
    ),
    "ran",
  );
});

test("Supply chain: run build con ignore-scripts esegue build ma non pre e post", async (t) => {
  const f = await fixture(t);
  const result = f.ok(await f.npm(command("npm run build --ignore-scripts")));
  assert.match(result.stdout, /^BUILD$/m);
  assert.doesNotMatch(result.stdout, /^(PRE|POST)$/m);
});

test("Supply chain: run build normale esegue gli hook in ordine", async (t) => {
  const f = await fixture(t);
  const result = f.ok(await f.npm(["run", "build"]));
  const lines = result.stdout
    .split(/\r?\n/)
    .filter((line) => /^(PRE|BUILD|POST)$/.test(line));
  assert.deepEqual(lines, ["PRE", "BUILD", "POST"]);
});

test("Supply chain: npm ls e explain ricostruiscono l'albero locale", async (t) => {
  const f = await fixture(t, true);
  await f.lock();
  f.ok(await f.ci());
  const list = JSON.parse(
    f.ok(await f.npm([...command("npm ls --all"), "--json"])).stdout,
  );
  assert.equal(list.dependencies["review-local-dependency"].version, "1.0.0");
  const args = command("npm explain nome-pacchetto").map((arg) =>
    arg === "nome-pacchetto" ? "review-local-dependency" : arg,
  );
  const explanation = JSON.parse(f.ok(await f.npm([...args, "--json"])).stdout);
  assert.equal(explanation[0].name, "review-local-dependency");
  assert.ok(explanation[0].dependents.some((item) => item.type === "prod"));
});

test("Supply chain: omit=dev non elimina la dipendenza dal lockfile", async (t) => {
  const f = await fixture(t, true);
  await f.lock();
  f.ok(await f.npm([...command("npm ci --ignore-scripts"), "--omit=dev"]));
  assert.equal(
    await exists(join(f.cwd, "node_modules/review-local-dependency")),
    true,
  );
  assert.equal(
    await exists(join(f.cwd, "node_modules/review-local-tool")),
    false,
  );
  const lock = JSON.parse(
    await readFile(join(f.cwd, "package-lock.json"), "utf8"),
  );
  assert.ok(lock.packages["node_modules/review-local-tool"]);
});

test("Supply chain: pack dry-run elenca i file senza tarball o hook", async (t) => {
  const f = await fixture(t);
  f.pkg.scripts.prepack = "node -e \"console.log('PACK_HOOK')\"";
  f.pkg.files = ["index.js"];
  await f.save();
  await writeFile(join(f.cwd, "index.js"), "export const value = 1;\n");
  await writeFile(join(f.cwd, "private-fixture.txt"), "not a real secret");
  const result = f.ok(await f.npm(command("npm pack --dry-run")));
  const [{ files }] = JSON.parse(result.stdout);
  assert.deepEqual(files.map((file) => file.path).sort(), [
    "index.js",
    "package.json",
  ]);
  assert.doesNotMatch(result.stdout, /^PACK_HOOK$/m);
  assert.equal(
    (await readdir(f.cwd)).some((file) => file.endsWith(".tgz")),
    false,
  );
});
