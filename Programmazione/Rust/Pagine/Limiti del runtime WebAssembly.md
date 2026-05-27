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
  - "Limiti del runtime WebAssembly"
  - "Limiti WebAssembly"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cross-compilation]]"
  - "[[Programmazione/Rust/Pagine/Memory layout e alignment]]"
  - "[[Programmazione/Rust/Pagine/Interop con JavaScript]]"
related:
  - "[[Programmazione/Rust/Pagine/wasm-bindgen]]"
  - "[[Programmazione/Rust/Pagine/wasm-pack]]"
  - "[[Programmazione/Rust/Pagine/WASI]]"
  - "[[Programmazione/Rust/Pagine/no_std]]"
---

# Limiti del runtime WebAssembly

## Sintesi

WebAssembly non e un sistema operativo e non e automaticamente equivalente a un binario nativo. E un formato di esecuzione sandboxato con memoria lineare, set di istruzioni controllato e dipendenza dal runtime host per I/O, rete, filesystem, timer, thread e API esterne.

Quando compili Rust in WebAssembly, devi progettare attorno ai limiti del target: ambiente browser, WASI, runtime server-side o embedded host possono offrire capability molto diverse.

## Quando usarlo

Studia i limiti del runtime WebAssembly quando:

- una crate Rust non compila per Wasm;
- vuoi portare logica Rust nel browser;
- devi scegliere tra browser Wasm e WASI;
- lavori con file, socket, thread, clock o randomness;
- devi ottimizzare dimensione e tempo di avvio;
- stai decidendo se Wasm e adatto al problema.

WebAssembly e ottimo per portabilita e sandboxing, ma non e la scelta giusta per ogni workload.

## Come funziona

Un modulo WebAssembly esegue codice in una sandbox. Il modulo ha:

- memoria lineare;
- funzioni importate ed esportate;
- accesso limitato a tipi primitivi;
- nessun accesso automatico alle API del sistema;
- dipendenza dal runtime host.

Nel browser, il modulo passa da JavaScript per molte interazioni. In WASI, passa da capability concesse dal runtime. In runtime custom, l'host decide quali funzioni importare.

Questo influenza:

- I/O;
- gestione errori;
- performance al confine host/Wasm;
- disponibilita di crate;
- modello di sicurezza;
- debugging e profiling.

## API / Sintassi

Target comuni:

```powershell
rustup target add wasm32-unknown-unknown
rustup target add wasm32-wasip1
```

Il primo e tipico per browser e `wasm-bindgen`; il secondo per WASI.

Codice condizionale per target:

```rust
#[cfg(target_arch = "wasm32")]
fn platform_name() -> &'static str {
    "wasm32"
}

#[cfg(not(target_arch = "wasm32"))]
fn platform_name() -> &'static str {
    "native"
}
```

Feature gating:

```rust
#[cfg(feature = "browser")]
pub fn init_browser_hooks() {
    // Inizializzazione specifica browser.
}
```

## Esempio pratico

Separare core portabile e adattatore host:

```rust
pub fn compute_score(values: &[u32]) -> u32 {
    values.iter().sum()
}

#[cfg(target_arch = "wasm32")]
pub fn run_in_wasm() -> u32 {
    compute_score(&[1, 2, 3])
}

#[cfg(not(target_arch = "wasm32"))]
pub fn run_native() -> u32 {
    compute_score(&[1, 2, 3])
}
```

La parte `compute_score` resta indipendente dal runtime. Le integrazioni con browser, filesystem o rete stanno in layer separati.

## Varianti

- **Browser Wasm**: nessun filesystem nativo, interazione tramite JS e Web APIs.
- **WASI**: capability di sistema controllate dal runtime.
- **Server-side Wasm**: host specifico, spesso orientato a plugin o sandbox.
- **no_std Wasm**: riduce dipendenze, ma richiede piu lavoro manuale.
- **Wasm con JS glue**: comodo ma introduce costo e dipendenza da JS.
- **Wasm standalone**: piu semplice da embeddare, ma con ABI piu limitata.

## Errori comuni

- Assumere che tutte le crate Rust funzionino su Wasm.
- Usare API di filesystem o networking senza verificare il runtime.
- Fare molte chiamate piccole tra JS e Wasm.
- Ignorare dimensione del modulo e tempo di inizializzazione.
- Pensare che sandbox significhi sicurezza completa senza modello di threat.
- Non distinguere browser, WASI e runtime custom.
- Usare thread o atomics senza supporto esplicito dell'ambiente.

## Checklist

- Il target Wasm corrisponde all'ambiente reale?
- Le crate dipendenti supportano quel target?
- I confini host/Wasm sono pochi e ben progettati?
- I/O, tempo, randomness e filesystem sono disponibili?
- La dimensione del modulo e accettabile?
- Il codice core e separato dagli adattatori host?
- Il comportamento e testato nel runtime finale?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/wasm-bindgen]]
- [[Programmazione/Rust/Pagine/wasm-pack]]
- [[Programmazione/Rust/Pagine/Interop con JavaScript]]
- [[Programmazione/Rust/Pagine/WASI]]
- [[Programmazione/Rust/Pagine/Cross-compilation]]
- [[Programmazione/Rust/Pagine/Memory layout e alignment]]
- [[Programmazione/Rust/Pagine/no_std]]
