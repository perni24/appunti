---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags:
  - programmazione
  - rust
  - webassembly
aliases:
  - "Interop con JavaScript"
  - "Rust JavaScript interop"
prerequisites:
  - "[[Programmazione/Rust/Pagine/wasm-bindgen]]"
  - "[[Programmazione/Rust/Pagine/Serde e serializzazione]]"
  - "[[Programmazione/Rust/Pagine/Limiti del runtime WebAssembly]]"
related:
  - "[[Programmazione/Rust/Pagine/wasm-pack]]"
  - "[[Programmazione/Rust/Pagine/FFI]]"
  - "[[Programmazione/Rust/Pagine/Memory layout e alignment]]"
---

# Interop con JavaScript

## Sintesi

L'**interop con JavaScript** e l'insieme di tecniche per far comunicare codice Rust compilato in WebAssembly con codice JavaScript. Include esportazione di funzioni Rust, chiamate a funzioni JS, conversione di tipi, gestione di errori, promesse, callback e accesso alle API browser.

Il punto centrale e che Rust e JavaScript hanno modelli molto diversi: Rust usa ownership, tipi statici e memoria lineare Wasm; JavaScript usa oggetti dinamici, garbage collector e API host. L'interoperabilita va progettata, non trattata come una chiamata di funzione ordinaria.

## Quando usarlo

Serve interop Rust/JS quando:

- una web app vuole delegare calcolo pesante a Rust;
- vuoi riusare librerie Rust nel browser;
- devi chiamare DOM, Canvas, WebGL o Web APIs da Rust;
- vuoi esporre un motore Rust a TypeScript;
- devi scambiare JSON o strutture dati con JavaScript;
- vuoi integrare Wasm in un'applicazione esistente.

Non conviene spostare in Rust logica semplice che vive gia bene in JavaScript: il costo di integrazione puo superare il beneficio.

## Come funziona

Il confine JS/Wasm usa:

- funzioni esportate dal modulo Wasm;
- import di funzioni JavaScript;
- memoria lineare condivisa dal modulo Wasm;
- wrapper generati da strumenti come `wasm-bindgen`;
- conversioni tra tipi Rust e valori JS.

Tipi semplici come numeri sono economici. Stringhe, array, oggetti, errori e callback richiedono wrapper e conversioni. Per dati grandi spesso conviene:

- ridurre il numero di attraversamenti;
- passare buffer;
- serializzare/deserializzare una volta;
- mantenere lo stato principale su un solo lato.

## API / Sintassi

Esportare una funzione Rust:

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn double(value: u32) -> u32 {
    value * 2
}
```

Chiamare JavaScript da Rust:

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(message: &str);
}

#[wasm_bindgen]
pub fn run() {
    log("called from Rust");
}
```

Gestire valori JS:

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn parse_flag(value: JsValue) -> bool {
    value.as_bool().unwrap_or(false)
}
```

`JsValue` e flessibile ma meno tipizzato: conviene usarlo ai bordi e convertire presto in tipi Rust.

## Esempio pratico

Scambio dati con Serde:

```rust
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Debug, Deserialize)]
struct Input {
    values: Vec<u32>,
}

#[derive(Debug, Serialize)]
struct Output {
    total: u32,
}

#[wasm_bindgen]
pub fn compute(input: JsValue) -> Result<JsValue, JsValue> {
    let input: Input = serde_wasm_bindgen::from_value(input)
        .map_err(|error| JsValue::from_str(&error.to_string()))?;

    let output = Output {
        total: input.values.iter().sum(),
    };

    serde_wasm_bindgen::to_value(&output)
        .map_err(|error| JsValue::from_str(&error.to_string()))
}
```

Questo mantiene il confine dinamico vicino all'API pubblica e usa tipi Rust all'interno.

## Varianti

- **Funzioni Rust chiamate da JS**: caso piu comune.
- **API browser chiamate da Rust**: tramite `web-sys`.
- **Tipi JS standard**: tramite `js-sys`.
- **Serde verso JsValue**: utile per oggetti strutturati.
- **Buffer condivisi**: adatti a dati binari grandi.
- **Promise/Future interop**: collega async JS e async Rust.

## Errori comuni

- Chiamare JS e Rust a ogni elemento di un grande array.
- Usare `JsValue` ovunque invece di convertirlo in tipi Rust.
- Non gestire errori e panic in modo comprensibile per JS.
- Esporre API Rust troppo legate a lifetime o ownership interni.
- Passare oggetti grandi quando basta un buffer.
- Dimenticare inizializzazione asincrona del modulo Wasm.
- Assumere che thread, filesystem o socket siano disponibili nel browser.

## Checklist

- Il confine JS/Wasm e piccolo e chiaro?
- I tipi dinamici sono convertiti presto in tipi Rust?
- I dati grandi attraversano il confine poche volte?
- Gli errori sono tradotti in valori JS utili?
- Le API esportate sono comode da usare da TypeScript?
- L'inizializzazione del modulo e gestita dal chiamante?
- Il lavoro spostato in Rust giustifica il costo di interop?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/wasm-bindgen]]
- [[Programmazione/Rust/Pagine/wasm-pack]]
- [[Programmazione/Rust/Pagine/Serde e serializzazione]]
- [[Programmazione/Rust/Pagine/Limiti del runtime WebAssembly]]
- [[Programmazione/Rust/Pagine/FFI]]
- [[Programmazione/Rust/Pagine/Memory layout e alignment]]
