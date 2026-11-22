---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - rust-di-sistema
aliases:
  - Cross-compilation
  - Cross compilation
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo|Cargo]]"
  - "[[Programmazione/Rust/Pagine/Build scripts|Build scripts]]"
related:
  - "[[Programmazione/Rust/Pagine/Linking|Linking]]"
  - "[[Programmazione/Rust/Pagine/Build profiles|Build profiles]]"
  - "[[Programmazione/Rust/Pagine/no_std|no_std]]"
  - "[[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]]"
  - "[[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version|MSRV]]"
title: Cross-compilation
---

# Cross-compilation

## Sintesi

La **cross-compilation** produce un artefatto per una piattaforma (*target*) usando strumenti che girano su un'altra (*host*). Da Windows x64 puoi, per esempio, controllare una CLI per Linux ARM64 senza mai eseguirla. Per sapere se parte devi anche collegarla e avviarla in un ambiente compatibile.

## Come scegliere il target

Parti dall'ambiente di destinazione, non soltanto dal processore. `aarch64-unknown-linux-gnu` indica ARM a 64 bit con Linux e ABI GNU; un binario così costruito può richiedere un loader e una versione di glibc disponibili sul dispositivo. `x86_64-unknown-linux-musl` indica una diversa architettura e libc: musl può semplificare la distribuzione di una CLI statica, ma non garantisce che ogni sua dipendenza C venga collegata staticamente.

Per conoscere l'host del compilatore, leggi la riga `host:`:

```sh
rustc -vV
```

Per vedere quali target sono già installati **per la toolchain attiva**:

```sh
rustup target list --installed
```

| Fase | Cosa verifica | Cosa non dimostra |
| --- | --- | --- |
| `cargo check --target …` | Il codice selezionato per il target supera i controlli del compilatore. | Che l'eseguibile finale si colleghi. Eventuali build script possono comunque richiedere strumenti esterni. |
| `cargo build --target …` su una CLI | Il compilatore e il linker producono un eseguibile per quel target. | Che il dispositivo abbia loader, librerie e funzionalità richieste. |
| `cargo run --target …` | L'eseguibile parte e percorre il caso provato sull'host compatibile o tramite un *runner*. | Che ogni funzione operi sul dispositivo reale. Per eseguire i test usa `cargo test`, non solo `cargo test --no-run`. |

## Linux ARM64: dal controllo al collegamento

Dalla radice di una CLI Cargo, installa le librerie Rust distribuite per il target:

```sh
rustup target add aarch64-unknown-linux-gnu
```

Controlla il codice senza chiedere il binario finale:

```sh
cargo check --target aarch64-unknown-linux-gnu
```

Per **collegare** questa CLI serve anche una catena di linking adatta a Linux ARM64, persino se il sorgente è tutto Rust. Per esempio, su un host che ha il cross-compiler GNU `aarch64-linux-gnu-gcc` nel `PATH` e le librerie di sviluppo del target, puoi indicarlo come driver del linker in `.cargo/config.toml`:

```toml
[target.aarch64-unknown-linux-gnu]
linker = "aarch64-linux-gnu-gcc"
```

```sh
cargo build --release --target aarch64-unknown-linux-gnu
```

L'eseguibile di una CLI si trova normalmente in `target/aarch64-unknown-linux-gnu/release/`. Copialo su un sistema ARM64 compatibile e prova un'operazione nota, oppure configura un runner con un emulatore e le librerie del target. `cargo metadata` e `cargo tree` aiutano a risalire alle dipendenze: non ispezionano né eseguono il binario prodotto.

### Build script e librerie native

Il *build script* e le macro procedurali vengono compilati per l'**host**: devono poter girare durante la build. In `build.rs`, `cfg!(target_os = "linux")` descrive quindi il sistema del build script, non quello della CLI. Per scegliere cosa collegare leggi le variabili che Cargo passa al processo: `HOST`, `TARGET` (triple complete) o `CARGO_CFG_TARGET_OS` (solo sistema operativo).

Se una crate compila anche C, la voce Cargo `linker` non seleziona automaticamente quel compilatore C. Per esempio, la crate `cc` riconosce `CC_aarch64_unknown_linux_gnu`. Se una dipendenza interroga `pkg-config`, servono i file `.pc`, gli header e le librerie **del target**, spesso in un *sysroot* (una radice che rappresenta il filesystem di sviluppo della destinazione). Abilitare soltanto `PKG_CONFIG_ALLOW_CROSS` non li fornisce e può far selezionare librerie dell'host.

## Esempio riproducibile: eseguire una CLI WASI

Questo caso non richiede un dispositivo ARM né un cross-compiler C. Il target `wasm32-wasip1` supporta `std` e, per questa CLI senza dipendenze native, usa il linker distribuito con Rust. Produce un modulo per **WASI Preview 1**: non un eseguibile Windows/Linux, né una pagina che si possa aprire nel browser. Prerequisiti: Rust con rustup e Node.js 24 nel `PATH`, usato qui come runtime per **codice proprio**, non come ambiente sicuro per moduli non fidati.

Crea il progetto:

```sh
cargo new --bin cross-demo
```

```sh
cd cross-demo
```

Crea `build.rs` accanto a `Cargo.toml`. Lo script gira sull'host, ma chiede a Cargo la triple **di destinazione** e la rende disponibile al compilatore della CLI. Non prova a ricostruirla dai nomi di architettura e sistema operativo:

```rust
fn main() {
    let target = std::env::var("TARGET").expect("Cargo deve impostare TARGET");
    println!("cargo:rustc-env=CLI_TARGET={target}");
}
```

Sostituisci `src/main.rs` con questo programma. `env!("CLI_TARGET")` incorpora il valore durante la compilazione; il primo argomento, invece, arriva durante l'esecuzione:

```rust
use std::env;

fn main() {
    let label = env::args().nth(1).unwrap_or_default();
    println!("{} {label}", env!("CLI_TARGET"));
}
```

Installa il target e produci l'artefatto:

```sh
rustup target add wasm32-wasip1
```

```sh
cargo build --target wasm32-wasip1
```

A questo punto esiste `target/wasm32-wasip1/debug/cross-demo.wasm`, ma non è ancora stato eseguito. Crea `run-wasi.mjs` nella radice del progetto:

```js
import { readFile } from "node:fs/promises";
import { WASI } from "node:wasi";

const [file, ...args] = process.argv.slice(2);
const wasi = new WASI({ version: "preview1", args: [file, ...args], returnOnExit: true });
const module = await WebAssembly.compile(await readFile(file));
const instance = await WebAssembly.instantiate(module, wasi.getImportObject());
process.exitCode = wasi.start(instance);
```

Crea la directory `.cargo` e inserisci questa sezione in `.cargo/config.toml`. Cargo passa al runner il percorso dell'artefatto seguito dagli argomenti del programma. Esegui i comandi dalla radice del progetto così che Node trovi lo script:

```toml
[target.wasm32-wasip1]
runner = ["node", "run-wasi.mjs"]
```

```sh
cargo run --target wasm32-wasip1 -- verifica
```

La riga della CLI deve essere **`wasm32-wasip1 verifica`**. Se compare un avviso sperimentale di Node su WASI, è separato dall'output della CLI. Per confrontare, `cargo run -- verifica` (senza un target predefinito in configurazione) stampa invece la triple riportata da `rustc -vV` alla voce `host:`, seguita da `verifica`.

## Diagnosi rapida

| Sintomo | Primo controllo |
| --- | --- |
| Il compilatore non trova `core` o `std`. | Verifica toolchain attiva, nome del target e disponibilità delle librerie. Un target bare-metal come `thumbv7em-none-eabihf` non offre una normale `std`: vedi [[Programmazione/Rust/Pagine/no_std\|no_std]]. |
| Il controllo passa ma il linker manca o rifiuta un file. | Controlla il driver selezionato, l'architettura delle librerie C e il sysroot. Il linker deve girare sull'host e produrre il formato del target. |
| Il file esiste, ma il sistema non lo avvia. | Controlla formato, loader, ABI e runtime. Su una scheda embedded il runner può invece caricare il firmware via sonda; scheda, chip e linker script devono corrispondere. |

## Fonti ufficiali

- [rustup: cross-compilation](https://rust-lang.github.io/rustup/cross-compilation.html)
- [Cargo: configurazione del linker e del runner per target](https://doc.rust-lang.org/cargo/reference/config.html#targettriplelinker)
- [Cargo: variabili d'ambiente dei build script](https://doc.rust-lang.org/cargo/reference/environment-variables.html#environment-variables-cargo-sets-for-build-scripts)
- [rustc: supporto del target wasm32-wasip1](https://doc.rust-lang.org/rustc/platform-support/wasm32-wasip1.html)
- [Node.js 24: API WASI e limiti di sicurezza](https://nodejs.org/docs/latest-v24.x/api/wasi.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Build profiles|Build profiles]]
- [[Programmazione/Rust/Pagine/Linking|Linking]]
- [[Programmazione/Rust/Pagine/Build scripts|Build scripts]]
- [[Programmazione/Rust/Pagine/no_std|no_std]]
- [[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]]
- [[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version|MSRV Minimum Supported Rust Version]]
