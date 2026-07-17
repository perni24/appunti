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
  - "Linking"
  - "Linker"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo]]"
  - "[[Programmazione/Rust/Pagine/Build scripts]]"
  - "[[Programmazione/Rust/Pagine/FFI]]"
related:
  - "[[Programmazione/Rust/Pagine/Cross-compilation]]"
  - "[[Programmazione/Rust/Pagine/libc e nix]]"
  - "[[Programmazione/Rust/Pagine/bindgen e cbindgen]]"
---

# Linking

## Sintesi

Il **linking** e la fase che combina codice Rust compilato, crate, librerie native e simboli esterni in un artefatto finale: binario, libreria statica, libreria dinamica o firmware. In Rust di sistema diventa importante quando usi FFI, dipendenze C, cross-compilation, embedded o distribuzione di binari.

Molti progetti Rust non richiedono interventi manuali sul linker. La complessita appare quando devi collegare librerie native, scegliere linking statico o dinamico, passare argomenti al linker o controllare l'ABI esportata.

## Quando usarlo

Approfondisci linking quando:

- usi `extern "C"` o crate FFI;
- devi linkare una libreria C/C++;
- compili per target diversi dall'host;
- produci una libreria da usare in C;
- vuoi un binario statico o piu portabile;
- stai lavorando su embedded e linker script;
- ricevi errori come "undefined reference" o "cannot find -l".

## Come funziona

Il compilatore Rust produce oggetti intermedi e delega la risoluzione finale dei simboli al linker. Il linker deve sapere:

- quali oggetti includere;
- dove cercare librerie native;
- quali librerie linkare;
- se usare linking statico o dinamico;
- quali simboli esportare;
- quali script o argomenti specifici applicare.

Cargo coordina questa fase usando metadati delle crate, configurazione target e output dei build script.

Un build script puo comunicare istruzioni a Cargo stampando righe speciali:

```rust
fn main() {
    println!("cargo:rustc-link-search=native=/usr/local/lib");
    println!("cargo:rustc-link-lib=dylib=example");
}
```

Cargo inoltra poi queste istruzioni a `rustc` e al linker.

## API / Sintassi

Strumenti e direttive comuni:

- `#[link(name = "foo")]`: indica una libreria nativa da linkare;
- `extern "C"`: dichiara funzioni o simboli esterni;
- `build.rs`: rileva librerie e comunica istruzioni di link;
- `cargo:rustc-link-lib`: aggiunge una libreria;
- `cargo:rustc-link-search`: aggiunge una directory di ricerca;
- `RUSTFLAGS`: passa opzioni aggiuntive al compilatore;
- `.cargo/config.toml`: configura linker e rustflags per target.

Esempio FFI:

```rust
#[link(name = "m")]
unsafe extern "C" {
    fn cos(x: f64) -> f64;
}

fn main() {
    let value = unsafe { cos(0.0) };
    println!("{value}");
}
```

L'esempio collega la libreria matematica C su piattaforme dove e richiesta.

## Esempio pratico

Build script per linkare una libreria statica locale:

```rust
fn main() {
    println!("cargo:rustc-link-search=native=vendor/lib");
    println!("cargo:rustc-link-lib=static=my_library");
}
```

Poi nel codice Rust dichiari le funzioni esterne:

```rust
unsafe extern "C" {
    fn my_library_init() -> i32;
}

pub fn init() -> Result<(), i32> {
    let code = unsafe { my_library_init() };

    if code == 0 {
        Ok(())
    } else {
        Err(code)
    }
}
```

Il wrapper Rust deve trasformare convenzioni C in un'API Rust piu sicura, per esempio usando `Result`.

## Varianti

- **Static linking**: include la libreria nel binario finale, quando possibile.
- **Dynamic linking**: il binario dipende da librerie presenti a runtime.
- **cdylib**: libreria dinamica Rust pensata per essere usata da altri linguaggi.
- **staticlib**: libreria statica Rust per integrazione con toolchain esterne.
- **rlib**: formato interno Rust per crate Rust.
- **Linker script**: usato spesso in embedded per controllare layout di memoria.

## Errori comuni

- Confondere errori di compilazione Rust con errori di linker.
- Linkare una libreria dell'host durante una cross-compilation.
- Non distribuire le librerie dinamiche richieste a runtime.
- Dimenticare ABI e name mangling quando si espongono funzioni a C.
- Usare path assoluti nel build script.
- Mescolare librerie compilate con ABI incompatibili.
- Nascondere troppo linking in `RUSTFLAGS` non documentati.

## Checklist

- La libreria nativa e compilata per lo stesso target?
- Serve linking statico o dinamico?
- Il linker sa dove cercare la libreria?
- Le funzioni esterne hanno ABI corretta?
- I simboli esportati sono stabili e documentati?
- La distribuzione include eventuali librerie dinamiche?
- La configurazione funziona anche in CI?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Cargo]]
- [[Programmazione/Rust/Pagine/Build scripts]]
- [[Programmazione/Rust/Pagine/FFI]]
- [[Programmazione/Rust/Pagine/Cross-compilation]]
- [[Programmazione/Rust/Pagine/libc e nix]]
- [[Programmazione/Rust/Pagine/bindgen e cbindgen]]
