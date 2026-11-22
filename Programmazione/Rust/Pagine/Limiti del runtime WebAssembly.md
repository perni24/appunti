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
  - Limiti del runtime WebAssembly
  - Limiti WebAssembly
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cross-compilation|Cross-compilation]]"
  - "[[Programmazione/Rust/Pagine/Memory layout e alignment|Memory layout e alignment]]"
  - "[[Programmazione/Rust/Pagine/Interop con JavaScript|Interop con JavaScript]]"
related:
  - "[[Programmazione/Rust/Pagine/wasm-bindgen|wasm-bindgen]]"
  - "[[Programmazione/Rust/Pagine/wasm-pack|wasm-pack]]"
  - "[[Programmazione/Rust/Pagine/WASI|WASI]]"
  - "[[Programmazione/Rust/Pagine/no_std|no_std]]"
title: Limiti del runtime WebAssembly
---

# Limiti del runtime WebAssembly

## Sintesi

Una build Rust riuscita non dimostra che il programma possa aprire un file, consultare un orologio o creare un thread. **Il target decide quale codice viene compilato; il runtime decide se può eseguirlo; l'host fornisce i servizi e le risorse.** Il calcolo che somma due interi non ha bisogno di un sistema operativo. Leggere il valore di uno di quegli interi da un file, invece, richiede un adattatore.

## Cosa dice il target

| Contesto | Cosa puoi dedurre | Cosa non puoi dedurre |
| --- | --- | --- |
| `wasm32-unknown-unknown` | Rust produce un modulo Wasm a 32 bit. Su questo target la libreria standard non importa servizi di sistema dall'host; per esempio, le operazioni di `std::fs` restituiscono errori. | Non significa «browser»: lo stesso modulo può essere caricato da un motore senza DOM. Un server HTTP che distribuisce il modulo non gli concede accesso al filesystem. |
| `wasm32-wasip1` / `wasm32-wasip2` | Il codice può richiedere le interfacce [[Programmazione/Rust/Pagine/WASI|WASI]]. P1 produce un modulo core, P2 un componente. | Avere l'interfaccia non significa avere la risorsa: anche con un runtime compatibile, un file può trovarsi fuori dalle directory concesse. |
| Host personalizzato | L'applicazione che istanzia il modulo può fornire gli import richiesti, anche senza JavaScript. | Un import chiamato `baseline` non ha una semantica universale: nome, firma e significato devono coincidere tra host e modulo. |

`#[cfg(target_arch = "wasm32")]` include **anche WASI**. Per scegliere l'adattatore WASI verifica `target_os = "wasi"`; per il target minimale a 32 bit usa la combinazione mostrata sotto. Una feature Cargo chiamata `browser` seleziona codice deciso dall'autore della crate: non rileva `window`, non abilita la rete e non fornisce i binding mancanti. Analogamente, `no_std` cambia la libreria usata da Rust, non i permessi dell'host.

## Esempio: chi legge davvero il file?

La pagina deve sommare una base configurabile a una variazione. Il **browser** carica `config.json` e valida la base; il **modulo Rust** riceve quel numero attraverso un import e calcola il totale. Per confronto il modulo prova anche ad aprire lo stesso nome con `std::fs`. L'esempio non usa wasm-bindgen: per due numeri basta l'ABI del modulo core.

### Compilare il modulo

Prerequisiti: Rust con rustup, un browser moderno e Python 3 per il server locale. Lavora in una cartella di prova vuota. Crea `limiti.rs`:

```rust
fn compute_score(base: i32, delta: i32) -> i64 {
    i64::from(base) + i64::from(delta)
}

fn config_is_readable() -> bool {
    std::fs::read("config.json").is_ok()
}

#[cfg(all(target_arch = "wasm32", target_os = "unknown"))]
mod adapter {
    #[link(wasm_import_module = "settings")]
    unsafe extern "C" {
        // L'host fornisce una funzione senza puntatori, di firma () -> i32.
        safe fn baseline() -> i32;
    }

    #[unsafe(no_mangle)]
    pub extern "C" fn demo_score(delta: i32) -> i64 {
        super::compute_score(baseline(), delta)
    }

    #[unsafe(no_mangle)]
    pub extern "C" fn demo_reads_file() -> i32 {
        i32::from(super::config_is_readable())
    }
}
```

`#[unsafe(no_mangle)]` mantiene stabili i nomi degli export in questa libreria; chi la costruisce deve evitare collisioni di simboli. La funzione importata non legge direttamente alcun file: restituisce solo il valore scelto dall'host. La somma usa `i64` per rappresentare anche la somma dei due massimi `i32`.

```sh
rustup target add wasm32-unknown-unknown
```

```sh
rustc --edition=2024 --crate-type=cdylib --target wasm32-unknown-unknown -O limiti.rs -o limiti.wasm
```

### Fornire il valore dal browser

Crea `config.json` accanto al modulo compilato:

```json
{ "base": 40 }
```

Nella stessa cartella crea `index.html`:

```html
<!doctype html>
<meta charset="utf-8">
<title>Limiti del runtime Wasm</title>
<pre id="esito"></pre>
<script type="module">
  const out = document.querySelector("#esito");
  async function load(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(path + ": HTTP " + response.status);
    return response;
  }

  try {
    const { base } = await (await load("./config.json")).json();
    if (!Number.isInteger(base) || base < -2147483648 || base > 2147483647) {
      throw new Error("base deve essere un i32");
    }

    const bytes = await (await load("./limiti.wasm")).arrayBuffer();
    const module = await WebAssembly.compile(bytes);
    const instance = await WebAssembly.instantiate(module, {
      settings: { baseline: () => base },
    });

    out.textContent = [
      "Base fornita dall'host: " + base,
      "Totale: " + instance.exports.demo_score(2),
      "File letto da std::fs: " + (instance.exports.demo_reads_file() !== 0),
    ].join("\n");
  } catch (error) {
    out.textContent = error.name + ": " + error.message;
  }
</script>
```

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Apri `http://127.0.0.1:8000/`. Con il file indicato, l'output è:

```text
Base fornita dall'host: 40
Totale: 42
File letto da std::fs: false
```

Il `false` è atteso: **lo stesso file è disponibile a `fetch` come risorsa HTTP, non a `std::fs` come percorso locale**. Cambia la base in 5 e ricarica: il totale diventa 7 senza ricompilare. Se invece lasci `settings: {}` nell'oggetto degli import, il modulo compila ma l'istanziazione fallisce con `WebAssembly.LinkError`: manca la funzione. Il risultato Rust `i64` arriva a JS come `bigint`; nella pagina la concatenazione lo mostra come testo. Ferma il server con `Ctrl+C` dopo le prove.

## Diagnosticare per fase

| Dove si ferma | Prima verifica |
| --- | --- |
| Build Rust | Controlla i `cfg` effettivi, le feature Cargo e le dipendenze specifiche per sistema operativo. Con `rustc --print cfg --target wasm32-wasip1` puoi vedere perché anche WASI soddisfa `target_arch="wasm32"`. |
| Download o compilazione nel motore | Un 404 è un problema HTTP. Se i byte arrivano ma non sono un modulo valido, o il motore non supporta una feature emessa, la compilazione può produrre `WebAssembly.CompileError`. Controlla anche che il server non abbia restituito HTML con stato 200. |
| Istanziazione | Confronta `WebAssembly.Module.imports(module)` con l'oggetto fornito dall'host. Controlla namespace, nome e tipo. Per i componenti WASI verifica invece le interfacce del runtime, non l'API JS per i moduli core. |
| Esecuzione | Un errore applicativo gestito (come il mancato accesso al file) non è un *trap*. Un trap Wasm interrompe la chiamata e si manifesta in JS come `WebAssembly.RuntimeError`; non è un normale `Result::Err` di Rust. |

## Memoria, thread e costi

- **Memoria:** lo spazio di indirizzamento a 32 bit non è una promessa di 4 GiB allocabili. Contano i limiti della memoria del modulo e del runtime. Se conservi una vista JS su un normale buffer Wasm non condiviso di lunghezza fissa, ricreala dopo la crescita della memoria. Non confondere quella vista con un array copiato dal binding.
- **Concorrenza:** una chiamata Wasm sincrona sul thread della UI blocca la pagina fino al ritorno. Una Promise non sposta il calcolo. Per isolarlo puoi usare un [[Programmazione/JavaScript/Pagine/Web Workers|Web Worker]]; condividere memoria tra worker è un passo distinto, che richiede supporto ad atomiche/memoria condivisa e, nel browser, un contesto sicuro con isolamento tra origini. Sul target Rust minimale, `std::thread::spawn` non crea automaticamente un Worker.
- **Prestazioni:** confronta la soluzione nativa dell'host con quella Wasm a parità di input e risultato. Separa download, compilazione e istanziazione dalla durata del calcolo a modulo caldo; includi copie, conversioni e numero di chiamate al confine. Non dedurre un vantaggio dai soli tempi del ciclo Rust.
- **Permessi e risorse:** concedi all'istanza soltanto le operazioni necessarie. Un import limitato a un numero non equivale a una funzione che apre un percorso arbitrario. Limitare gli import, però, non assegna da solo un budget di tempo o memoria.

## Fonti ufficiali

- [Rust: cosa supporta davvero wasm32-unknown-unknown](https://doc.rust-lang.org/rustc/platform-support/wasm32-unknown-unknown.html)
- [MDN: istanziazione, import ed errori WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface/instantiate_static)
- [MDN: crescita della memoria e validità dei buffer](https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface/Memory/grow)
- [MDN: requisiti per condividere memoria tra thread](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/wasm-bindgen|wasm-bindgen]]
- [[Programmazione/Rust/Pagine/wasm-pack|wasm-pack]]
- [[Programmazione/Rust/Pagine/Interop con JavaScript|Interop con JavaScript]]
- [[Programmazione/Rust/Pagine/WASI|WASI]]
- [[Programmazione/Rust/Pagine/Cross-compilation|Cross-compilation]]
- [[Programmazione/Rust/Pagine/Memory layout e alignment|Memory layout e alignment]]
- [[Programmazione/Rust/Pagine/no_std|no_std]]
- [[Programmazione/JavaScript/Pagine/WebAssembly interop|WebAssembly dal lato JavaScript]]
