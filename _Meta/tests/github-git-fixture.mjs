import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseNote } from "../../site/scripts/vault.mjs";

const root = fs.realpathSync(os.tmpdir());
const prefix = "vault-github-git-";
const pages = "Programmazione/GitHub/Pagine/";

export function fixture(t) {
  const dir = fs.mkdtempSync(path.join(root, prefix));
  t.after(() => {
    const actual = fs.realpathSync(dir);
    assert.equal(path.dirname(actual), root);
    assert.ok(path.basename(actual).startsWith(prefix));
    fs.rmSync(actual, { recursive: true, maxRetries: 3 });
  });
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([k]) => !k.toUpperCase().startsWith("GIT_"),
    ),
  );
  Object.assign(env, {
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: path.join(dir, "empty-gitconfig"),
    GIT_ALLOW_PROTOCOL: "file",
    GIT_TERMINAL_PROMPT: "0",
  });
  function run(cwd, args, success = true) {
    const r = spawnSync(
      "git",
      [
        "-c",
        "core.hooksPath=" + path.join(dir, "no-hooks"),
        "-c",
        "core.autocrlf=false",
        ...args,
      ],
      { cwd, env, encoding: "utf8", windowsHide: true },
    );
    assert.ifError(r.error);
    assert.ok(Number.isInteger(r.status));
    assert.equal(r.status === 0, success, args.join(" ") + ": " + r.stderr);
    return r.stdout.trimEnd();
  }
  function example(page, cmd, cwd, args, success = true) {
    const blocks = parseNote(pages + page + ".md").tree.children;
    assert.ok(
      blocks.some(
        (n) => n.type === "code" && n.lang === "bash" && n.value === cmd,
      ),
      cmd,
    );
    return run(cwd, args ?? cmd.slice(4).split(" "), success);
  }
  function repo(name) {
    const cwd = path.join(dir, name);
    fs.mkdirSync(cwd);
    example("Repository GitHub", "git init -b main", cwd);
    run(cwd, ["config", "user.name", "Autore Test"]);
    run(cwd, ["config", "user.email", "autore@example.invalid"]);
    fs.writeFileSync(path.join(cwd, "README.md"), "Avvio\n");
    example("Repository GitHub", "git add -- README.md", cwd);
    run(cwd, ["commit", "-qm", "base"]);
    return cwd;
  }
  return { dir, run, example, repo };
}
