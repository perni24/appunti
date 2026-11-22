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
  - Interop con JavaScript
  - Rust JavaScript interop
prerequisites:
  - "[[Programmazione/Rust/Pagine/wasm-bindgen|wasm-bindgen]]"
  - "[[Programmazione/Rust/Pagine/Serde e serializzazione|Serde e serializzazione]]"
  - "[[Programmazione/Rust/Pagine/Limiti del runtime WebAssembly|Limiti del runtime WebAssembly]]"
related:
  - "[[Programmazione/Rust/Pagine/wasm-pack|wasm-pack]]"
  - "[[Programmazione/Rust/Pagine/FFI|FFI]]"
  - "[[Programmazione/Rust/Pagine/Memory layout e alignment|Memory layout e alignment]]"
title: Interop con JavaScript
---

# Interop con JavaScript

## Sintesi

Il confine tra JavaScript e Rust non è solo una firma: devi decidere **quali valori accetti, chi possiede i dati e come si osserva un errore**. Per esempio, se una pagina passa `{ values: [2, 3], double: false }`, ci aspettiamo un totale di 5. Se passa la stringa `"false"`, vogliamo un errore, non un calcolo apparentemente valido.

Qui usiamo [[Programmazione/Rust/Pagine/wasm-bindgen|wasm-bindgen]] per i binding e [[Programmazione/Rust/Pagine/wasm-pack|wasm-pack]] per il pacchetto web. La nota riguarda ciò che passa attraverso quel confine, non il procedimento di packaging.

## Scegliere una rappresentazione

| Cosa deve attraversare il confine | Rappresentazione utile | Conseguenza per chi chiama |
| --- | --- | --- |
| Un valore JS da controllare o restituire com'è | `JsValue` | Per un oggetto conserva un riferimento al valore JS: non crea una copia profonda. `as_bool()` distingue un vero booleano da altri tipi; `unwrap_or(false)` nasconderebbe gli errori di tipo. |
| Un record con campi noti | `JsValue` al confine, struct Serde in Rust | `from_value` legge i campi e costruisce dati Rust; `to_value` crea il risultato JS. Non servono `JSON.stringify` o `JSON.parse`. |
| Un lotto di byte indipendente | `Uint8Array` in JS, `Box<[u8]>` nella firma Rust | In questa firma i byte vengono copiati in entrata e in uscita. Il chiamante può continuare a usare l'array originale. |
| Un'operazione non ancora conclusa | `Promise` in JS, una future attesa in Rust | JS vede un'altra Promise dall'export `async`. Un errore rifiuta la Promise; non viene lanciato al momento della chiamata. |

Una vista costruita esplicitamente sulla memoria Wasm è un contratto diverso da una copia: bisogna sapere fino a quando l'allocazione resta valida e quando ricreare la vista dopo una crescita della memoria. Una `Uint8Array` da sola non dimostra che due ambienti condividano i dati.

## Esempio: un totale con un contratto esplicito

`compute` richiede `values` (una sequenza di interi da 0 a 4 294 967 295) e `double` (un booleano). Somma gli elementi, poi raddoppia **il totale** soltanto se richiesto. La sequenza vuota vale zero; un campo mancante, un tipo sbagliato o un risultato fuori da `u32` sono errori. I campi aggiuntivi non fanno parte del calcolo. Il risultato è un oggetto JS `{ total }`, non una stringa JSON.

### Lato Rust

Con Cargo e wasm-pack installati, crea il progetto e spostati nella nuova cartella:

```sh
cargo new --lib interop-demo
```

```sh
cd interop-demo
```

In `Cargo.toml`:

```toml
[package]
name = "interop-demo"
version = "0.1.0"
edition = "2024"

[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "=0.2.130"
serde = { version = "1", features = ["derive"] }
serde-wasm-bindgen = "=0.6.5"
js-sys = "0.3"
wasm-bindgen-futures = "0.4"
```

In `src/lib.rs`:

```rust
use js_sys::{Function, Promise};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;

#[derive(Deserialize)]
struct Input {
    values: Vec<u32>,
    double: bool,
}

#[derive(Serialize)]
struct Output {
    total: u32,
}

#[wasm_bindgen]
pub fn compute(input: JsValue) -> Result<JsValue, JsError> {
    let data: Input = serde_wasm_bindgen::from_value(input)
        .map_err(|err| JsError::new(&format!("Input non valido: {err}")))?;
    let sum = data.values.into_iter().try_fold(0u32, u32::checked_add);
    let total = sum
        .and_then(|n| if data.double { n.checked_mul(2) } else { Some(n) })
        .ok_or_else(|| JsError::new("Totale fuori da u32"))?;
    Ok(serde_wasm_bindgen::to_value(&Output { total })?)
}

#[wasm_bindgen]
pub fn reverse_bytes(mut bytes: Box<[u8]>) -> Box<[u8]> {
    bytes.reverse();
    bytes
}

#[wasm_bindgen]
pub fn compute_and_notify(input: JsValue, notify: &Function) -> Result<JsValue, JsValue> {
    let result = compute(input)?;
    notify.call1(&JsValue::UNDEFINED, &result)?;
    Ok(result)
}

#[wasm_bindgen]
pub async fn compute_when_ready(pending: Promise) -> Result<JsValue, JsValue> {
    let input = JsFuture::from(pending).await?;
    Ok(compute(input)?)
}
```

`from_value` controlla la forma dei dati; non sa se una somma entra in un `u32`. Per questo il calcolo usa `checked_add` e `checked_mul`: l'errore resta lo stesso in debug e in release, senza affidarsi a un panic o a un risultato che riparte da zero. Una dichiarazione TypeScript può guidare chi chiama, ma non convalida un oggetto ricevuto a runtime.

### Lato JavaScript

Compila dalla radice della crate:

```sh
wasm-pack build --dev --target web
```

Crea `index.html` accanto a `pkg/`:

```html
<!doctype html>
<meta charset="utf-8">
<title>Contratto JS e Rust</title>
<pre id="esito"></pre>
<script type="module">
  import init, { compute, compute_and_notify, compute_when_ready, reverse_bytes }
    from "./pkg/interop_demo.js";

  await init();
  const lines = [];
  const input = { values: [2, 3], double: false };
  compute_and_notify(input, ({ total }) => lines.push("Callback: " + total));

  try {
    compute({ ...input, double: "false" });
  } catch (error) {
    lines.push("Input rifiutato: " + (error instanceof Error));
  }

  const bytes = new Uint8Array([10, 20, 30]);
  const reversed = reverse_bytes(bytes);
  lines.push("Byte: " + bytes.join(",") + " -> " + reversed.join(","));

  const later = await compute_when_ready(Promise.resolve({ ...input, double: true }));
  lines.push("Totale asincrono: " + later.total);
  document.querySelector("#esito").textContent = lines.join("\n");
</script>
```

Per provare la pagina dalla stessa cartella, servila via HTTP (qui con Python 3), apri `http://127.0.0.1:8000/` e ferma il server con `Ctrl+C` dopo la prova.

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Dovresti leggere:

```text
Callback: 5
Input rifiutato: true
Byte: 10,20,30 -> 30,20,10
Totale asincrono: 10
```

## Errori, callback e durata

| Situazione | Cosa osserva JavaScript |
| --- | --- |
| `compute({ values: [0xffffffff, 1], double: false })` | Due interi validi, somma non rappresentabile: la chiamata **lancia** un `Error` con messaggio `Totale fuori da u32`. |
| La callback lancia un'eccezione | Rust chiama JS tramite `Function::call1`; il suo `Result` intercetta l'eccezione e `?` la restituisce al chiamante senza convertirla in testo. La callback viene invocata solo dopo un calcolo riuscito. |
| La Promise in ingresso è rifiutata | Il calcolo non parte. La Promise restituita da `compute_when_ready` è rifiutata con il motivo originale, anche se non è un oggetto `Error`. |
| La Promise si risolve ma il contenuto è invalido | È la validazione Rust a fallire. Per intercettare il rifiuto usa `try { await compute_when_ready(p); } catch (reason) { ... }` o `.catch(...)`; un `try` attorno alla sola creazione della Promise non basta. |

La callback del demo è sincrona e **non viene conservata**. Se invece Rust registra una propria `Closure` come listener JS, occorre mantenerla viva e rimuovere il listener prima di rilasciarla. Per chiamare un'API host nota puoi dichiarare un import (per esempio `console.log`) o usare i binding `web-sys` per il DOM; un runtime senza browser non fornisce necessariamente quelle API.

## Prima di ottimizzare

Invia un lotto per chiamata quando puoi: nel demo Rust riceve tutti i numeri una volta, non una chiamata per addendo. Misura tempo di conversione, calcolo e restituzione insieme. L'uso di una Promise non sposta il calcolo su un altro thread: su una pagina, una lunga elaborazione sincrona può ancora bloccare l'interfaccia. Se JavaScript deve solo aggiornare il DOM, attraversare il confine per ogni elemento potrebbe non dare alcun vantaggio.

## Fonti ufficiali

- [serde-wasm-bindgen 0.6.5: rappresentazioni native di oggetti e sequenze](https://docs.rs/serde-wasm-bindgen/0.6.5/serde_wasm_bindgen/)
- [wasm-bindgen: copie per le slice numeriche possedute](https://wasm-bindgen.github.io/wasm-bindgen/reference/types/boxed-number-slices.html)
- [wasm-bindgen: Result ed eccezioni JavaScript](https://wasm-bindgen.github.io/wasm-bindgen/reference/types/result.html)
- [wasm-bindgen: Promise e future](https://wasm-bindgen.github.io/wasm-bindgen/reference/js-promises-and-rust-futures.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/wasm-bindgen|wasm-bindgen]]
- [[Programmazione/Rust/Pagine/wasm-pack|wasm-pack]]
- [[Programmazione/Rust/Pagine/Serde e serializzazione|Serde e serializzazione]]
- [[Programmazione/Rust/Pagine/Limiti del runtime WebAssembly|Limiti del runtime WebAssembly]]
- [[Programmazione/Rust/Pagine/FFI|FFI]]
- [[Programmazione/Rust/Pagine/Memory layout e alignment|Memory layout e alignment]]
- [[Programmazione/JavaScript/Pagine/Buffer e Typed Arrays|Buffer e Typed Arrays in JavaScript]]
- [[Programmazione/JavaScript/Pagine/Promises|Promise in JavaScript]]
