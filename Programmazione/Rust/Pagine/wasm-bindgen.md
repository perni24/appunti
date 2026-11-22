---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - webassembly
aliases:
  - wasm-bindgen
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cross-compilation|Cross-compilation]]"
related:
  - "[[Programmazione/Rust/Pagine/Serde e serializzazione|Serde e serializzazione]]"
  - "[[Programmazione/Rust/Pagine/Interop con JavaScript|Interop con JavaScript]]"
  - "[[Programmazione/Rust/Pagine/wasm-pack|wasm-pack]]"
  - "[[Programmazione/Rust/Pagine/Limiti del runtime WebAssembly|Limiti del runtime WebAssembly]]"
  - "[[Programmazione/Rust/Pagine/FFI|FFI]]"
title: wasm-bindgen
---

# wasm-bindgen

## Sintesi

`wasm-bindgen` serve quando JavaScript deve chiamare Rust compilato in WebAssembly, o quando Rust deve chiamare una funzione dell'ambiente JavaScript. Per esempio, il browser passa una stringa a Rust e ottiene un'altra stringa o un'eccezione. La memoria lineare del modulo non contiene oggetti JavaScript: è il *binding*, cioè il codice di collegamento generato, a tradurre la chiamata.

| Passaggio | Cosa produce | Chi lo usa |
| --- | --- | --- |
| La macro `#[wasm_bindgen]` descrive export e import; Cargo compila per `wasm32-unknown-unknown` | Un modulo Wasm con le informazioni sui binding | La CLI `wasm-bindgen` |
| La CLI elabora il modulo con `--target web` | Un modulo ES `.js`, il binario `_bg.wasm` e dichiarazioni `.d.ts` | Il browser usa JS e Wasm; TypeScript usa le dichiarazioni |
| JavaScript importa il wrapper e attende `init()` | Un'istanza pronta per le chiamate | Il codice applicativo |

I due *target* rispondono a domande diverse: quello di Cargo decide **per quale architettura e ambiente compilare Rust**; quello della CLI decide **come JavaScript caricherà il modulo**. Non occorre un bundler per l'esempio seguente. Per automatizzare la preparazione del pacchetto vedi [[Programmazione/Rust/Pagine/wasm-pack|wasm-pack]].

## Esempio: validare un nome dal browser

Il contratto: togliere gli spazi bianchi alle estremità, richiedere almeno tre **valori scalari Unicode** nel testo rimasto e restituirlo in minuscolo. Se il nome è troppo corto, JavaScript deve ricevere un oggetto `Error`. La regola si applica **prima** della conversione in minuscolo. Non è una regola sui grafemi visibili né una normalizzazione Unicode NFC.

### Preparare la libreria

Servono Rust con Cargo e rustup, un browser con moduli ES e un server HTTP locale (qui Python 3). I comandi usano la stessa versione di crate e CLI per mantenere compatibile il formato dei binding. Se la CLI è già installata, controlla `wasm-bindgen --version` prima di sostituirla.

```sh
rustup target add wasm32-unknown-unknown
```

```sh
cargo install wasm-bindgen-cli --version 0.2.130 --locked
```

```sh
cargo new --lib nomi-web
```

```sh
cd nomi-web
```

In `Cargo.toml` usa questo manifest. `cdylib` produce il modulo da distribuire, non un eseguibile con `main`.

```toml
[package]
name = "nomi-web"
version = "0.1.0"
edition = "2024"

[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "=0.2.130"
```

### Definire il confine in Rust

In `src/lib.rs` le funzioni pubbliche annotate sono **export**, chiamabili da JS. La dichiarazione nel blocco `extern` va nell'altra direzione: è un **import** di `console.info` fornito dall'ambiente. Una funzione numerica non deve tradurre stringhe; per `&str`, invece, il wrapper codifica il testo in UTF-8 nella memoria Wasm. Il riferimento è valido durante la chiamata; il valore restituito come `String` diventa una stringa JavaScript.

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console, js_name = info)]
    fn log_info(message: &str);
}

#[wasm_bindgen]
pub fn add(left: i16, right: i16) -> i32 {
    i32::from(left) + i32::from(right)
}

#[wasm_bindgen]
pub fn normalize_username(input: &str) -> Result<String, JsError> {
    let name = input.trim();
    if name.chars().take(3).count() < 3 {
        return Err(JsError::new("Il nome richiede almeno 3 caratteri"));
    }
    log_info("Nome accettato");
    Ok(name.to_lowercase())
}

#[wasm_bindgen]
pub struct Counter {
    value: u32,
}

#[wasm_bindgen]
impl Counter {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self { value: 0 }
    }

    pub fn increment(&mut self) {
        self.value = self.value.saturating_add(1);
    }

    #[wasm_bindgen(getter)]
    pub fn value(&self) -> u32 {
        self.value
    }
}
```

`"éé".len()` in Rust vale **4 byte**, ma il nome contiene solo **2 valori scalari**: per questo non usiamo `len()`. Al contrario, una lettera seguita da un accento combinante conta come due scalari anche se può apparire come un solo segno. Un requisito basato su ciò che l'utente vede richiederebbe la segmentazione in grafemi.

### Generare e caricare i binding

Dalla radice del progetto compila, poi genera in `pkg/` i file destinati al browser. Nel nome dell'artefatto Cargo il trattino di `nomi-web` diventa un trattino basso.

```sh
cargo build --release --target wasm32-unknown-unknown
```

```sh
wasm-bindgen --target web --out-dir pkg target/wasm32-unknown-unknown/release/nomi_web.wasm
```

Crea `index.html` **accanto a** `pkg/`, non al suo interno. L'import predefinito è l'inizializzatore asincrono; dopo `await init()` le tre API usate nell'esempio sono sincrone. La classe JS `Counter` conserva un riferimento allo stato Rust: non è una copia dell'oggetto. `free()` lo rilascia esplicitamente; dopo il rilascio non usare più l'istanza.

```html
<!doctype html>
<html lang="it">
<meta charset="utf-8">
<title>Nomi con Rust</title>
<pre id="risultato"></pre>
<script type="module">
  import init, { add, Counter, normalize_username } from "./pkg/nomi_web.js";

  await init();
  const counter = new Counter();
  const lines = [];
  try {
    for (const input of ["  ALÌ  ", "éé"]) {
      try {
        lines.push(normalize_username(input));
        counter.increment();
      } catch (error) {
        if (!(error instanceof Error)) throw error;
        lines.push(error.message);
      }
    }
    lines.push("Accettati: " + counter.value, "Somma: " + add(2, 3));
    document.querySelector("#risultato").textContent = lines.join("\n");
  } finally {
    counter.free();
  }
</script>
</html>
```

Avvia il server dalla stessa cartella e apri `http://127.0.0.1:8000/`. Il server pubblica la cartella sul solo loopback; interrompilo con `Ctrl+C`.

```sh
python -m http.server 8000 --bind 127.0.0.1
```

La pagina deve mostrare, nell'ordine: `alì`, `Il nome richiede almeno 3 caratteri`, `Accettati: 1` e `Somma: 5`. In console compare `Nome accettato` una sola volta. Il wrapper restituisce direttamente il contenuto di `Ok`; per `Err(JsError)` **lancia** un'eccezione, non restituisce un oggetto `Result` da ispezionare. Un `panic!` non è un'alternativa a un errore di validazione.

## Diagnosi e scelte di progetto

| Sintomo o esigenza | Cosa verificare |
| --- | --- |
| L'import JS funziona, ma la prima chiamata fallisce | Con `--target web` attendi la risoluzione di `init()` prima di usare un export o costruire un oggetto. |
| Il browser non carica il binario | Servi via HTTP il wrapper e il suo `_bg.wasm` della **stessa build**. Nel pannello Network controlla percorso, stato, risposta effettiva e tipo `application/wasm` per lo streaming. Un server può restituire la pagina HTML di fallback anche con stato 200. |
| La generazione segnala versioni incompatibili | Confronta `wasm-bindgen --version` con la versione della crate risolta in `Cargo.lock`; aggiornale insieme e rigenera entrambi i file. |
| Rust deve chiamare una funzione JS che può lanciare | A differenza di un export, sull'import usa `#[wasm_bindgen(catch)]` e una firma che restituisca `Result<T, JsValue>` per gestire l'eccezione in Rust. |
| L'algoritmo è veloce ma l'integrazione è lenta | Misura il lavoro completo, incluse conversioni e copie. Preferisci una chiamata per lotto a una per elemento; per pochi numeri e nessun oggetto host può bastare una semplice ABI Wasm senza questi binding. |

`js-sys` offre binding per i tipi standard JS, `web-sys` per API del browser come il DOM. Per oggetti strutturati, Serde e `serde-wasm-bindgen` evitano di progettare a mano ogni campo: vedi [[Programmazione/Rust/Pagine/Interop con JavaScript|Interop con JavaScript]]. Un runtime [[Programmazione/Rust/Pagine/WASI|WASI]] non fornisce automaticamente né DOM né `console`: non è il destinatario di questo wrapper.

## Fonti ufficiali

- [Guida wasm-bindgen: caricare il modulo senza bundler](https://wasm-bindgen.github.io/wasm-bindgen/examples/without-a-bundler.html)
- [Guida wasm-bindgen: Result e conversione in eccezione](https://wasm-bindgen.github.io/wasm-bindgen/reference/types/result.html)
- [API di JsError, versione 0.2.130](https://docs.rs/wasm-bindgen/0.2.130/wasm_bindgen/struct.JsError.html)
- [Guida wasm-bindgen: classi generate da struct Rust](https://wasm-bindgen.github.io/wasm-bindgen/reference/types/exported-rust-types.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/wasm-pack|wasm-pack]]
- [[Programmazione/Rust/Pagine/Interop con JavaScript|Interop con JavaScript]]
- [[Programmazione/Rust/Pagine/Limiti del runtime WebAssembly|Limiti del runtime WebAssembly]]
- [[Programmazione/Rust/Pagine/Cross-compilation|Cross-compilation]]
- [[Programmazione/Rust/Pagine/Serde e serializzazione|Serde e serializzazione]]
- [[Programmazione/Rust/Pagine/FFI|FFI]]
