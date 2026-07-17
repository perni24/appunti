---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - rust-di-sistema
aliases:
  - "bindgen"
  - "cbindgen"
prerequisites:
  - "[[Programmazione/Rust/Pagine/FFI]]"
  - "[[Programmazione/Rust/Pagine/Build scripts]]"
related:
  - "[[Programmazione/Rust/Pagine/libc e nix]]"
  - "[[Programmazione/Rust/Pagine/Linking]]"
  - "[[Programmazione/Rust/Pagine/Cross-compilation]]"
---

# bindgen e cbindgen

## Sintesi

`bindgen` genera binding Rust a partire da header C/C++. `cbindgen` fa il percorso opposto: genera header C/C++ a partire da API Rust esposte via FFI.

Sono strumenti utili quando il confine FFI e abbastanza grande da rendere fragile scrivere dichiarazioni manuali.

## Quando usarlo

- Usa `bindgen` per consumare librerie C con header esistenti.
- Usa `cbindgen` per esporre una libreria Rust a codice C/C++.
- Usa build script quando i binding devono essere rigenerati durante la build.
- Evita generazione automatica per API minuscole dove binding manuali sono piu leggibili.

## Come funziona

`bindgen` legge header e produce dichiarazioni Rust unsafe:

```text
wrapper.h -> bindings.rs
```

`cbindgen` legge crate Rust e produce header:

```text
lib.rs -> my_crate.h
```

In entrambi i casi serve comunque verificare ownership, layout e contratti di sicurezza.

## API / Sintassi

Build script con bindgen:

```rust
fn main() {
    println!("cargo:rerun-if-changed=wrapper.h");

    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .generate()
        .expect("generazione binding");

    let out = std::path::PathBuf::from(std::env::var("OUT_DIR").unwrap());
    bindings.write_to_file(out.join("bindings.rs")).unwrap();
}
```

Include:

```rust
include!(concat!(env!("OUT_DIR"), "/bindings.rs"));
```

## Esempio pratico

Header C:

```c
int add(int a, int b);
```

Wrapper Rust generato o manuale:

```rust
unsafe extern "C" {
    fn add(a: i32, b: i32) -> i32;
}

pub fn safe_add(a: i32, b: i32) -> i32 {
    unsafe { add(a, b) }
}
```

Il binding unsafe resta interno; l'API pubblica puo essere safe se il contratto C e semplice.

## Varianti

- Binding generati a build time.
- Binding generati e committati nel repository.
- Allowlist/blocklist di tipi e funzioni.
- Header generati con `cbindgen` per librerie Rust.
- Crate `-sys`: crate basso livello che espone binding FFI.

## Errori comuni

- Fidarsi dei binding generati senza rivedere layout e ownership.
- Rigenerare binding in modo non deterministico.
- Non gestire include path e toolchain C in CI.
- Esporre direttamente binding unsafe agli utenti finali.
- Mescolare wrapper safe e binding raw nello stesso modulo pubblico.

## Checklist

- I binding sono generati in modo riproducibile?
- La toolchain C richiesta e documentata?
- Gli unsafe binding sono isolati in un modulo interno?
- Esiste un wrapper safe dove possibile?
- Cross-compilation e CI usano header/librerie corrette?

## Collegamenti

- [[Programmazione/Rust/Pagine/FFI|FFI]]
- [[Programmazione/Rust/Pagine/Build scripts|Build scripts]]
- [[Programmazione/Rust/Pagine/libc e nix|libc e nix]]
- [[Programmazione/Rust/Pagine/Linking|Linking]]
- [[Programmazione/Rust/Pagine/Cross-compilation|Cross-compilation]]
