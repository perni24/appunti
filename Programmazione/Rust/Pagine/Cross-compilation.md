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
  - "Cross-compilation"
  - "Cross compilation"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo]]"
  - "[[Programmazione/Rust/Pagine/Build profiles]]"
  - "[[Programmazione/Rust/Pagine/Linking]]"
related:
  - "[[Programmazione/Rust/Pagine/no_std]]"
  - "[[Programmazione/Rust/Pagine/Embedded Rust]]"
  - "[[Programmazione/Rust/Pagine/Build scripts]]"
  - "[[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version]]"
---

# Cross-compilation

## Sintesi

La **cross-compilation** consiste nel compilare un programma su una macchina host per eseguirlo su un target diverso. In Rust il compilatore gestisce bene molte differenze di architettura, ma il risultato dipende anche da linker, librerie native, target triple, ABI e dipendenze C.

Per codice Rust puro spesso basta installare il target. Per programmi che linkano librerie native, usano FFI o producono firmware embedded, serve configurare anche toolchain esterna e linking.

## Quando usarlo

Usa cross-compilation quando:

- sviluppi su x86_64 ma devi distribuire su ARM;
- compili binari Linux da Windows, macOS o CI;
- produci firmware embedded;
- vuoi creare build statiche con musl;
- devi testare supporto multipiattaforma;
- distribuisci CLI o servizi per piu sistemi.

Non e solo un comando Cargo: appena entrano librerie C, OpenSSL, database client o system package, devi controllare anche l'ambiente del target.

## Come funziona

Rust identifica le piattaforme tramite **target triple**, ad esempio:

- `x86_64-unknown-linux-gnu`;
- `x86_64-unknown-linux-musl`;
- `aarch64-unknown-linux-gnu`;
- `thumbv7em-none-eabihf`;
- `wasm32-unknown-unknown`.

Una build cross richiede:

- supporto Rust per il target;
- linker compatibile con il target;
- eventuale sysroot o librerie native;
- configurazione Cargo;
- feature crate compatibili con la piattaforma.

Comando base:

```powershell
rustup target add aarch64-unknown-linux-gnu
cargo build --target aarch64-unknown-linux-gnu --release
```

Se il progetto usa solo Rust puro, questo puo bastare. Se usa C o system libraries, Cargo deve sapere quale linker e quali librerie usare.

## API / Sintassi

Configurazione tipica in `.cargo/config.toml`:

```toml
[build]
target = "aarch64-unknown-linux-gnu"

[target.aarch64-unknown-linux-gnu]
linker = "aarch64-linux-gnu-gcc"
```

Variabili utili:

```powershell
$env:CC_aarch64_unknown_linux_gnu = "aarch64-linux-gnu-gcc"
$env:PKG_CONFIG_ALLOW_CROSS = "1"
```

Per embedded:

```toml
[target.thumbv7em-none-eabihf]
runner = "probe-rs run --chip STM32F407VGTx"
rustflags = [
  "-C", "link-arg=-Tlink.x",
]
```

Evita di mettere configurazioni specifiche della tua macchina in `Cargo.toml`: di solito stanno meglio in `.cargo/config.toml` o nella CI.

## Esempio pratico

Build di una CLI Rust per Linux musl:

```powershell
rustup target add x86_64-unknown-linux-musl
cargo build --release --target x86_64-unknown-linux-musl
```

Questo target e spesso usato per binari Linux piu portabili, ma non rende automaticamente statiche tutte le dipendenze native. Se una crate usa librerie C esterne, devi verificare come vengono compilate e linkate.

Per controllare il risultato:

```powershell
cargo metadata --format-version 1
cargo tree
```

`cargo tree` aiuta a individuare dipendenze che portano build script o FFI.

## Varianti

- **Rust puro**: cross-compilation piu semplice.
- **GNU target**: dipende dalla libc e toolchain GNU del target.
- **musl target**: utile per binari Linux piu autocontenuti.
- **Embedded target**: spesso `no_std`, linker script e runner dedicato.
- **WASM target**: produce WebAssembly, con ABI e runtime diversi.
- **CI multi-target**: costruisce e pubblica artefatti per piu piattaforme.

## Errori comuni

- Installare il target Rust ma non il linker.
- Dimenticare che le crate con `build.rs` possono compilare codice C.
- Usare `pkg-config` dell'host per librerie del target.
- Assumere che una crate supporti tutti i target.
- Mescolare `gnu` e `musl` senza capire le differenze di libc.
- Trattare cross-compilation e cross-testing come la stessa cosa: compilare non significa poter eseguire.
- Salvare nel repository path assoluti validi solo sulla propria macchina.

## Checklist

- Qual e il target triple preciso?
- Il target Rust e installato?
- Il linker del target e disponibile?
- Le dipendenze native sono compilate per il target?
- Le feature Cargo sono compatibili con la piattaforma?
- La CI verifica almeno la build del target?
- Esiste un modo per eseguire o smoke-testare il binario risultante?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Cargo]]
- [[Programmazione/Rust/Pagine/Build profiles]]
- [[Programmazione/Rust/Pagine/Linking]]
- [[Programmazione/Rust/Pagine/Build scripts]]
- [[Programmazione/Rust/Pagine/no_std]]
- [[Programmazione/Rust/Pagine/Embedded Rust]]
- [[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version]]
