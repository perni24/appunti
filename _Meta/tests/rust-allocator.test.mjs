import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/Allocator.md",
).tree.children.filter((n) => n.type === "code" && n.lang === "rust");
const boxed = blocks.find((b) => b.value.includes("fn try_box_value")).value;
const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";

function compiler(t) {
  const root = fs.realpathSync(os.tmpdir());
  const cwd = fs.mkdtempSync(path.join(root, "vault-rust-allocator-"));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(cwd)), root);
    assert.ok(path.basename(cwd).startsWith("vault-rust-allocator-"));
    fs.rmSync(cwd, { recursive: true, maxRetries: 3 });
  });
  const exe = path.join(
    cwd,
    process.platform === "win32" ? "note.exe" : "note",
  );
  function run(tool, args, input) {
    const r = spawnSync(tool, args, {
      cwd,
      input,
      encoding: "utf8",
      timeout: 60000,
      windowsHide: true,
    });
    assert.ifError(r.error);
    assert.equal(r.signal, null);
    assert.equal(r.status, 0, r.stdout + r.stderr);
  }
  return (code, level) => {
    run(
      rustc,
      ["--edition=2024", "-C", "opt-level=" + level, "-o", exe, "-"],
      code,
    );
    run(exe, []);
  };
}

test("i tre programmi pubblicati sono eseguibili con e senza ottimizzazioni", (t) => {
  assert.equal(blocks.length, 3);
  const execute = compiler(t);
  for (const level of [0, 3])
    for (const block of blocks) execute(block.value, level);
});

test("Box rispetta allineamento e distruzione unica, anche con uno ZST", (t) => {
  const checks = `
use std::cell::Cell;
use std::sync::atomic::{AtomicUsize, Ordering};

#[repr(align(256))]
struct Tracked<'a>(&'a Cell<usize>);
impl Drop for Tracked<'_> {
    fn drop(&mut self) { self.0.set(self.0.get() + 1); }
}
static EMPTY_DROPS: AtomicUsize = AtomicUsize::new(0);
#[repr(align(64))]
struct Empty;
impl Drop for Empty {
    fn drop(&mut self) { EMPTY_DROPS.fetch_add(1, Ordering::Relaxed); }
}
fn main() {
    let drops = Cell::new(0);
    let b = try_box_value(Tracked(&drops)).ok().unwrap();
    assert!(std::ptr::from_ref(&*b).is_aligned());
    assert_eq!(drops.get(), 0);
    drop(b);
    assert_eq!(drops.get(), 1);
    assert_eq!(std::mem::size_of::<Empty>(), 0);
    let zst = try_box_value(Empty).ok().unwrap();
    assert!(std::ptr::from_ref(&*zst).is_aligned());
    assert_eq!(EMPTY_DROPS.load(Ordering::Relaxed), 0);
    drop(zst);
    assert_eq!(EMPTY_DROPS.load(Ordering::Relaxed), 1);
}`;
  compiler(t)(boxed.replace("fn main()", "fn demo()") + checks, 3);
});

test("se l'allocatore segnala il fallimento, Err conserva il valore originale", (t) => {
  const checks = `
use std::alloc::{GlobalAlloc, System};
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering::Relaxed};

#[repr(align(256))]
struct Ticket(String);
static DROPS: AtomicUsize = AtomicUsize::new(0);
impl Drop for Ticket {
    fn drop(&mut self) { DROPS.fetch_add(1, Relaxed); }
}
static REJECT: AtomicBool = AtomicBool::new(false);
struct Gate;
#[global_allocator]
static GLOBAL: Gate = Gate;

// SAFETY: richieste accettate e rilasci sono inoltrati a System invariati.
unsafe impl GlobalAlloc for Gate {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        if REJECT.load(Relaxed) && layout == Layout::new::<Ticket>() {
            return std::ptr::null_mut();
        }
        unsafe { System.alloc(layout) }
    }
    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        unsafe { System.dealloc(ptr, layout) }
    }
}
fn main() {
    let input = Ticket(String::from("integro"));
    REJECT.store(true, Relaxed);
    let result = try_box_value(input);
    REJECT.store(false, Relaxed);
    let Err(ticket) = result else { panic!("richiesta non rifiutata") };
    assert_eq!(ticket.0, "integro");
    assert_eq!(DROPS.load(Relaxed), 0);
    drop(ticket);
    assert_eq!(DROPS.load(Relaxed), 1);
}`;
  compiler(t)(boxed.replace("fn main()", "fn demo()") + checks, 0);
});
