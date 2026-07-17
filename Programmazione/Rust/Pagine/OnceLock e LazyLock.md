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
  - smart-pointers-e-interior-mutability
aliases:
  - "OnceLock"
  - "LazyLock"
  - "Lazy initialization Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Interior mutability]]"
  - "[[Programmazione/Rust/Pagine/Mutex T e RwLock T]]"
  - "[[Programmazione/Rust/Pagine/const e static]]"
related:
  - "[[Programmazione/Rust/Pagine/Cell T]]"
  - "[[Programmazione/Rust/Pagine/Configurazione applicativa]]"
  - "[[Programmazione/Rust/Pagine/Shared state]]"
---

# OnceLock e LazyLock

## Sintesi

`OnceLock<T>` e `LazyLock<T>` servono per inizializzare un valore una sola volta in modo sicuro. Sono utili per configurazioni globali, cache read-only, singleton controllati e inizializzazione costosa rimandata al primo uso.

Sono alternative moderne a pattern manuali con `static mut`, che in Rust sono pericolosi.

## Quando usarlo

- Usa `OnceLock<T>` quando vuoi impostare un valore una volta, esplicitamente o al primo accesso.
- Usa `LazyLock<T>` quando vuoi inizializzazione lazy con closure dichiarata insieme allo static.
- Usa questi tipi per valori globali read-mostly.
- Evitali se puoi passare dipendenze esplicitamente tramite parametri o struct.

## Come funziona

`OnceLock`:

```rust
use std::sync::OnceLock;

static CONFIG: OnceLock<String> = OnceLock::new();

fn config() -> &'static String {
    CONFIG.get_or_init(|| String::from("default"))
}
```

`LazyLock`:

```rust
use std::sync::LazyLock;

static NAME: LazyLock<String> = LazyLock::new(|| String::from("rust"));
```

L'inizializzazione e thread-safe.

## API / Sintassi

```rust
let cell = OnceLock::new();
cell.set(10).ok();
let value = cell.get();
```

In static:

```rust
static PORT: OnceLock<u16> = OnceLock::new();

fn port() -> u16 {
    *PORT.get_or_init(|| 8080)
}
```

## Esempio pratico

```rust
use std::sync::OnceLock;

#[derive(Debug)]
struct Settings {
    database_url: String,
}

static SETTINGS: OnceLock<Settings> = OnceLock::new();

fn settings() -> &'static Settings {
    SETTINGS.get_or_init(|| Settings {
        database_url: String::from("postgres://localhost/app"),
    })
}
```

Il valore viene costruito al primo accesso e poi riusato come riferimento statico.

## Varianti

- `OnceLock<T>`: cella impostabile una volta.
- `LazyLock<T>`: inizializzazione lazy dichiarativa.
- `OnceCell` non-sync: variante single-thread in `std::cell`.
- `Mutex<T>`: valore globale modificabile.
- Passaggio esplicito della configurazione: spesso preferibile per testabilita.

## Errori comuni

- Usare global state quando una dipendenza esplicita sarebbe piu pulita.
- Mettere dentro `OnceLock` valori che dovrebbero cambiare durante il runtime.
- Nascondere dipendenze importanti dietro funzioni globali.
- Usare `static mut` invece di tipi sicuri.
- Rendere i test dipendenti da uno stato globale gia inizializzato.

## Checklist

- Il valore deve essere inizializzato una sola volta?
- Deve essere globale o puo essere passato esplicitamente?
- Serve thread-safety?
- I test devono poter usare configurazioni diverse?
- L'inizializzazione puo fallire? Serve modellare l'errore.

## Collegamenti

- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]
- [[Programmazione/Rust/Pagine/Mutex T e RwLock T|Mutex T e RwLock T]]
- [[Programmazione/Rust/Pagine/const e static|const e static]]
- [[Programmazione/Rust/Pagine/Configurazione applicativa|Configurazione applicativa]]
- [[Programmazione/Rust/Pagine/Shared state|Shared state]]
