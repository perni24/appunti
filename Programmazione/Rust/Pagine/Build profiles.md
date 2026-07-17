---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - cargo-editions-e-compatibilita
aliases:
  - "Cargo profiles"
  - "Profili Cargo"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo]]"
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
related:
  - "[[Programmazione/Rust/Pagine/Performance e profiling]]"
  - "[[Programmazione/Rust/Pagine/Build scripts]]"
  - "[[Programmazione/Rust/Pagine/Cross-compilation]]"
---

# Build profiles

## Sintesi

I build profiles configurano come Cargo compila il codice: ottimizzazioni, debug info, overflow checks, panic strategy, link-time optimization e altri dettagli. I profili principali sono `dev` e `release`.

Permettono di bilanciare velocita di compilazione, performance runtime, dimensione binario e debug experience.

## Quando usarlo

- Quando vuoi ottimizzare il binario release.
- Quando vuoi profili diversi per sviluppo, test o produzione.
- Quando devi ridurre dimensione binario.
- Quando fai profiling e vuoi debug info in release.
- Quando configuri panic strategy o LTO.

## Come funziona

In `Cargo.toml`:

```toml
[profile.release]
opt-level = 3
lto = "thin"
codegen-units = 1
```

Cargo applica il profilo in base al comando:

```bash
cargo build
cargo build --release
```

`cargo build` usa `dev`; `--release` usa `release`.

## API / Sintassi

Opzioni comuni:

```toml
[profile.release]
opt-level = 3
debug = false
lto = "thin"
panic = "abort"
codegen-units = 1
strip = "symbols"
```

Profilo custom:

```toml
[profile.profiling]
inherits = "release"
debug = true
```

Uso:

```bash
cargo build --profile profiling
```

## Esempio pratico

Profilo release per CLI piccola:

```toml
[profile.release]
opt-level = "z"
lto = true
codegen-units = 1
panic = "abort"
strip = "symbols"
```

Questa configurazione punta a ridurre la dimensione, non necessariamente a massimizzare performance.

## Varianti

- `dev`: compilazione rapida con debug.
- `release`: ottimizzata.
- `test`: profilo per test.
- `bench`: benchmark.
- Profili custom con `inherits`.
- Override per package specifici.

## Errori comuni

- Cambiare profili senza misurare.
- Usare configurazioni release lente in sviluppo.
- Disabilitare debug info e poi non poter profilare.
- Usare `panic = "abort"` senza considerare debugging e unwinding.
- Ottimizzare dimensione quando serve throughput.

## Checklist

- Obiettivo: velocita build, performance o dimensione?
- Hai misurato prima e dopo?
- Serve debug info in release?
- LTO e codegen-units rallentano troppo la build?
- Il profilo e documentato per chi mantiene il progetto?

## Collegamenti

- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]
- [[Programmazione/Rust/Pagine/Build scripts|Build scripts]]
- [[Programmazione/Rust/Pagine/Cross-compilation|Cross-compilation]]
