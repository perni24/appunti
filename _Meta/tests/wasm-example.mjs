import { createRequire } from "node:module";
import { snippet } from "./note-examples.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const createWabt = require(process.env.WABT_MODULE_PATH || "wabt");
const wabt = await createWabt();
const parsed = wabt.parseWat(
  "math.wat",
  snippet("WebAssembly interop", "(module", "wat"),
);
let binary;
try {
  parsed.resolveNames();
  parsed.validate();
  binary = Uint8Array.from(parsed.toBinary({ write_debug_names: true }).buffer);
} finally {
  parsed.destroy();
}

export { binary };
export const note = "WebAssembly interop";
export const loader = snippet(note, "async function loadWasm");
export const memoryHelpers = snippet(note, "function memoryRegion");
