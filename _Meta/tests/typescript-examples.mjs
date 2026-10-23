import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
export const ts = require("typescript");

// Run the real checker and emitter against a virtual module; never write output.
export function compile(source, overrides = {}) {
  const filename = path.resolve("typescript-note-fixture.cts");
  const options = {
    strict: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
    types: [],
    noEmitOnError: true,
    ...overrides,
  };
  const host = ts.createCompilerHost(options);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, languageVersion, ...args) =>
    path.resolve(name) === filename
      ? ts.createSourceFile(name, source, languageVersion, true)
      : originalGetSourceFile(name, languageVersion, ...args);
  const program = ts.createProgram([filename], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  const output = new Map();
  program.emit(undefined, (name, content) => output.set(name, content));
  return {
    diagnostics,
    js: [...output.entries()].find(([name]) => name.endsWith(".cjs"))?.[1],
  };
}

function diagnosticText(result) {
  return result.diagnostics
    .map(
      (item) =>
        `${item.code}: ${ts.flattenDiagnosticMessageText(item.messageText, "\n")}`,
    )
    .join("\n");
}

export function valid(source, options) {
  const result = compile(source, options);
  assert.equal(result.diagnostics.length, 0, diagnosticText(result));
  assert.equal(typeof result.js, "string");
  return result;
}

export function invalid(source, code, options) {
  const result = compile(source, options);
  assert.ok(
    result.diagnostics.some((item) => item.code === code),
    `Expected TS${code}\n${diagnosticText(result)}`,
  );
  assert.equal(result.js, undefined, "noEmitOnError must prevent output");
}

export function run(source, expression = "undefined", globals = {}) {
  const { js } = valid(source);
  const output = [];
  const context = vm.createContext({
    exports: {},
    console: { log: (...args) => output.push(structuredClone(args)) },
    ...globals,
  });
  const value = vm.runInContext(`${js}\n;(${expression})`, context, {
    timeout: 1000,
  });
  return { value, output };
}

export const hasName = (name) => (error) => error?.name === name;
export const typeChecks = `
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;
`;
