---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - cargo-editions-e-compatibilita
aliases:
  - "build.rs"
  - "Cargo build scripts"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo]]"
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
related:
  - "[[Programmazione/Rust/Pagine/bindgen e cbindgen]]"
  - "[[Programmazione/Rust/Pagine/FFI]]"
  - "[[Programmazione/Rust/Pagine/Build profiles]]"
---

# Build scripts

## Sintesi

Un build script e un programma Rust, di solito `build.rs`, eseguito da Cargo prima di compilare il package. Serve per generare codice, trovare librerie native, configurare linking, leggere metadata di sistema o produrre istruzioni per `rustc`.

Va usato solo quando serve davvero: introduce logica di build e puo rendere la compilazione meno prevedibile.

## Quando usarlo

- Quando devi linkare librerie C/native.
- Quando generi codice a compile time.
- Quando devi rilevare configurazioni del sistema.
- Quando integri `bindgen`, `cc` o strumenti esterni.
- Quando vuoi comunicare flag a `rustc`.

## Come funziona

Nel manifest:

```toml
[package]
build = "build.rs"

[build-dependencies]
cc = "1"
```

`build.rs` stampa istruzioni speciali su stdout:

```rust
fn main() {
    println!("cargo:rerun-if-changed=src/native.c");
}
```

Cargo interpreta queste righe come direttive di build.

## API / Sintassi

Direttive comuni:

```rust
println!("cargo:rerun-if-changed=path");
println!("cargo:rerun-if-env-changed=VAR");
println!("cargo:rustc-link-lib=dylib=ssl");
println!("cargo:rustc-link-search=native=/usr/local/lib");
println!("cargo:rustc-cfg=has_feature_x");
```

Generare file in `OUT_DIR`:

```rust
let out_dir = std::env::var("OUT_DIR").unwrap();
```

## Esempio pratico

```rust
fn main() {
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-env-changed=APP_BUILD_ID");

    if let Ok(build_id) = std::env::var("APP_BUILD_ID") {
        println!("cargo:rustc-env=APP_BUILD_ID={build_id}");
    }
}
```

Il build script passa una variabile d'ambiente al codice compilato.

## Varianti

- Generazione codice in `OUT_DIR`.
- Linking nativo con `cargo:rustc-link-*`.
- Compilazione C/C++ con crate `cc`.
- Binding automatici con `bindgen`.
- Configurazione condizionale con `cargo:rustc-cfg`.

## Errori comuni

- Fare lavoro non deterministico senza dichiarare `rerun-if-*`.
- Scrivere file fuori da `OUT_DIR`.
- Dipendere da strumenti esterni non documentati.
- Usare build script per configurazione runtime.
- Rendere la build lenta con operazioni inutili.

## Checklist

- Serve davvero un build script?
- Hai dichiarato correttamente `rerun-if-changed` o `rerun-if-env-changed`?
- I file generati vanno in `OUT_DIR`?
- Le dipendenze native sono documentate?
- La build funziona in CI e cross-compilation?

## Collegamenti

- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Build profiles|Build profiles]]
- [[Programmazione/Rust/Pagine/FFI|FFI]]
- [[Programmazione/Rust/Pagine/bindgen e cbindgen|bindgen e cbindgen]]
