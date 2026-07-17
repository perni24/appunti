---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - webassembly
aliases:
  - "wasm-pack"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo]]"
  - "[[Programmazione/Rust/Pagine/wasm-bindgen]]"
  - "[[Programmazione/Rust/Pagine/Packaging e release]]"
related:
  - "[[Programmazione/Rust/Pagine/Cross-compilation]]"
  - "[[Programmazione/Rust/Pagine/Interop con JavaScript]]"
  - "[[Programmazione/Rust/Pagine/Build profiles]]"
---

# wasm-pack

## Sintesi

`wasm-pack` e uno strumento per compilare crate Rust in pacchetti WebAssembly consumabili da JavaScript. Automatizza build, invocazione di `wasm-bindgen`, generazione dei wrapper JS, metadata del package e preparazione dell'output per browser, bundler o Node.js.

E utile quando vuoi distribuire codice Rust come libreria frontend o package npm senza gestire manualmente tutti i passaggi della toolchain Wasm.

## Quando usarlo

Usa `wasm-pack` quando:

- vuoi integrare Rust in una web app JavaScript;
- vuoi pubblicare un package WebAssembly;
- usi `wasm-bindgen`;
- vuoi generare wrapper JS e TypeScript declaration;
- vuoi target diversi come bundler, web o Node.js;
- vuoi rendere ripetibile il processo di build Wasm.

Se stai compilando per WASI o per un runtime non JS, `wasm-pack` di solito non e lo strumento centrale.

## Come funziona

`wasm-pack` parte da un crate Rust configurato come libreria e produce una cartella, spesso `pkg/`, contenente:

- modulo `.wasm`;
- wrapper JavaScript;
- definizioni TypeScript;
- `package.json`;
- file di supporto generati da `wasm-bindgen`.

Il crate deve esporre funzioni o tipi con `#[wasm_bindgen]`. In `Cargo.toml` e comune configurare il crate type:

```toml
[lib]
crate-type = ["cdylib"]
```

`cdylib` indica che il crate produce una libreria dinamica adatta a essere consumata fuori da Rust.

## API / Sintassi

Comandi tipici:

```powershell
wasm-pack build
wasm-pack build --target web
wasm-pack build --target bundler
wasm-pack build --target nodejs
```

Test browser o headless, quando configurati:

```powershell
wasm-pack test --headless --firefox
```

Struttura minima del crate:

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
```

## Esempio pratico

Package Rust esportato per una web app:

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn score_text(text: &str) -> u32 {
    text.split_whitespace()
        .map(|word| word.len() as u32)
        .sum()
}
```

Build:

```powershell
wasm-pack build --target bundler
```

Uso tipico lato JavaScript con un bundler:

```javascript
import init, { score_text } from "./pkg/my_wasm_package.js";

await init();
console.log(score_text("hello from rust"));
```

L'inizializzazione e spesso asincrona perche il modulo `.wasm` deve essere caricato.

## Varianti

- **target bundler**: pensato per strumenti come Vite, webpack o simili.
- **target web**: uso diretto nel browser come ES module.
- **target nodejs**: uso lato Node.js.
- **package npm**: pubblicazione del contenuto generato.
- **profilo release**: riduce dimensione e migliora performance.
- **ottimizzazione post-build**: strumenti esterni possono ridurre il `.wasm`.

## Errori comuni

- Dimenticare `crate-type = ["cdylib"]`.
- Usare target sbagliato rispetto al modo in cui JavaScript importa il package.
- Chiamare funzioni esportate prima di `init()`.
- Committare output generato senza una decisione esplicita.
- Ignorare dimensione del pacchetto.
- Aspettarsi che API di sistema siano disponibili nel browser.
- Confondere packaging npm e pubblicazione di una crate su crates.io.

## Checklist

- Il crate e configurato come `cdylib`?
- Le funzioni esportate usano `#[wasm_bindgen]`?
- Il target `wasm-pack` corrisponde all'ambiente JS?
- L'inizializzazione del modulo e gestita?
- La dimensione del `.wasm` e controllata?
- Il package generato viene distribuito nel modo previsto?
- I test coprono almeno le API esportate?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/wasm-bindgen]]
- [[Programmazione/Rust/Pagine/Interop con JavaScript]]
- [[Programmazione/Rust/Pagine/Packaging e release]]
- [[Programmazione/Rust/Pagine/Cargo]]
- [[Programmazione/Rust/Pagine/Cross-compilation]]
- [[Programmazione/Rust/Pagine/Build profiles]]
