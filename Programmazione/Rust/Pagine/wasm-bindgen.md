---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - webassembly
aliases:
  - "wasm-bindgen"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cross-compilation]]"
  - "[[Programmazione/Rust/Pagine/Interop con JavaScript]]"
  - "[[Programmazione/Rust/Pagine/Serde e serializzazione]]"
related:
  - "[[Programmazione/Rust/Pagine/wasm-pack]]"
  - "[[Programmazione/Rust/Pagine/Limiti del runtime WebAssembly]]"
  - "[[Programmazione/Rust/Pagine/FFI]]"
---

# wasm-bindgen

## Sintesi

`wasm-bindgen` e lo strumento principale dell'ecosistema Rust per esporre codice WebAssembly a JavaScript e per chiamare API JavaScript da Rust. Genera il glue code necessario per collegare il modulo `.wasm` con il mondo JS, gestendo conversioni di tipi, classi, funzioni esportate e import.

WebAssembly lavora nativamente con tipi numerici semplici e memoria lineare. `wasm-bindgen` colma il divario tra quel modello basso livello e valori JavaScript come `String`, `Object`, `Promise`, array, DOM API e funzioni callback.

## Quando usarlo

Usa `wasm-bindgen` quando:

- vuoi usare funzioni Rust da JavaScript o TypeScript;
- devi chiamare API browser da Rust;
- vuoi esportare tipi Rust come classi JS;
- devi integrare Rust in una web app esistente;
- vuoi usare `wasm-pack` per produrre un package npm;
- devi passare dati piu ricchi di semplici numeri tra Rust e JS.

Non serve per ogni uso di WebAssembly. Se il modulo espone solo funzioni numeriche semplici o gira in un runtime WASI, potresti non averne bisogno.

## Come funziona

Il flusso tipico e:

1. compili Rust per `wasm32-unknown-unknown`;
2. annoti funzioni, struct o import con `#[wasm_bindgen]`;
3. `wasm-bindgen` genera wrapper JavaScript e file TypeScript declaration;
4. JavaScript importa il package generato e chiama le funzioni esportate.

La macro `#[wasm_bindgen]` indica quali elementi devono attraversare il confine Wasm/JS. Questo confine e importante per performance e design: chiamate frequenti e conversioni grandi possono costare piu del calcolo Rust.

## API / Sintassi

Esportare una funzione:

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(left: i32, right: i32) -> i32 {
    left + right
}
```

Esportare una struct come classe JS:

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Counter {
    value: u32,
}

#[wasm_bindgen]
impl Counter {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Counter {
        Counter { value: 0 }
    }

    pub fn increment(&mut self) {
        self.value += 1;
    }

    pub fn value(&self) -> u32 {
        self.value
    }
}
```

Importare una funzione JavaScript:

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    fn alert(message: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    alert(&format!("Ciao, {name}!"));
}
```

## Esempio pratico

Funzione Rust esportata per validare input lato browser:

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn normalize_username(input: &str) -> Result<String, JsValue> {
    let normalized = input.trim().to_lowercase();

    if normalized.len() < 3 {
        return Err(JsValue::from_str("username too short"));
    }

    Ok(normalized)
}
```

Dal lato JavaScript il wrapper generato permette di importare e chiamare la funzione. Gli errori Rust devono essere convertiti in valori comprensibili per JS, spesso `JsValue` o tipi serializzati.

## Varianti

- **Funzioni esportate**: API semplice Rust -> JS.
- **Classi esportate**: struct Rust gestite come oggetti JS.
- **Import JS**: Rust chiama funzioni JavaScript.
- **web-sys**: binding tipizzati per API browser.
- **js-sys**: binding per tipi JavaScript standard.
- **serde-wasm-bindgen**: conversione tra valori Serde e `JsValue`.

## Errori comuni

- Attraversare il confine JS/Wasm in loop molto frequenti.
- Passare grandi strutture dati avanti e indietro invece di elaborarle in un solo lato.
- Pensare che tutti i tipi Rust siano esportabili direttamente.
- Dimenticare che panic e errori devono essere tradotti per JavaScript.
- Esportare API troppo vicine al modello interno Rust.
- Confondere `wasm32-unknown-unknown` con WASI.
- Ignorare dimensione del bundle e inizializzazione asincrona del modulo.

## Checklist

- L'API esportata e piccola e stabile?
- I dati attraversano il confine JS/Wasm solo quando serve?
- Errori e panic sono gestiti in modo leggibile?
- I tipi esposti sono adatti a JavaScript?
- Il modulo viene inizializzato correttamente prima dell'uso?
- La dimensione del bundle e accettabile?
- Serve davvero `wasm-bindgen` o basta una ABI Wasm piu semplice?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/wasm-pack]]
- [[Programmazione/Rust/Pagine/Interop con JavaScript]]
- [[Programmazione/Rust/Pagine/Limiti del runtime WebAssembly]]
- [[Programmazione/Rust/Pagine/Cross-compilation]]
- [[Programmazione/Rust/Pagine/Serde e serializzazione]]
- [[Programmazione/Rust/Pagine/FFI]]
