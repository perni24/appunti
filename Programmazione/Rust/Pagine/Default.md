---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags:
  - programmazione
  - rust
  - standard-library
aliases:
  - "Default trait"
  - "Default Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Derive traits]]"
  - "[[Programmazione/Rust/Pagine/Structs]]"
related:
  - "[[Programmazione/Rust/Pagine/Builder pattern]]"
  - "[[Programmazione/Rust/Pagine/Configurazione applicativa]]"
  - "[[Programmazione/Rust/Pagine/Derive traits]]"
---

# Default

## Sintesi

`Default` definisce un valore predefinito per un tipo. E utile per configurazioni, inizializzazione parziale, test e pattern builder.

Un default deve essere sensato e sicuro: non dovrebbe nascondere valori obbligatori o produrre stati invalidi.

## Quando usarlo

- Quando un tipo ha un valore iniziale naturale.
- Quando vuoi permettere `..Default::default()` nelle struct.
- Quando vuoi semplificare configurazioni con molti campi opzionali.
- Quando un generic richiede la possibilita di creare un valore vuoto o iniziale.

## Come funziona

Derive:

```rust
#[derive(Default)]
struct Config {
    debug: bool,
    retries: u32,
}
```

Uso:

```rust
let config = Config::default();
```

Implementazione manuale:

```rust
impl Default for Config {
    fn default() -> Self {
        Self {
            debug: false,
            retries: 3,
        }
    }
}
```

## API / Sintassi

Update syntax:

```rust
let config = Config {
    debug: true,
    ..Default::default()
};
```

Bound generico:

```rust
fn make<T: Default>() -> T {
    T::default()
}
```

Enum con variante default:

```rust
#[derive(Default)]
enum Mode {
    #[default]
    Normal,
    Debug,
}
```

## Esempio pratico

```rust
#[derive(Debug)]
struct ServerConfig {
    host: String,
    port: u16,
    workers: usize,
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            host: String::from("127.0.0.1"),
            port: 8080,
            workers: 4,
        }
    }
}
```

Il default produce una configurazione locale avviabile.

## Varianti

- `#[derive(Default)]`: generazione automatica.
- Implementazione manuale: quando i valori non sono default dei campi.
- `Default::default()`: chiamata generica.
- `T::default()`: forma associata al tipo.
- Struct update con `..Default::default()`.

## Errori comuni

- Definire default che violano invarianti.
- Usare `Default` per evitare costruttori espliciti necessari.
- Nascondere campi obbligatori dietro valori fittizi.
- Derivare `Default` quando il default dei campi non ha senso di dominio.
- Confondere default tecnico con configurazione di produzione.

## Checklist

- Il valore predefinito e valido e sicuro?
- Tutti i campi hanno un default sensato?
- Serve un costruttore invece di `Default`?
- Il default va bene per test, sviluppo o produzione?
- La struct update syntax migliora la leggibilita?

## Collegamenti

- [[Programmazione/Rust/Pagine/Derive traits|Derive traits]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Builder pattern|Builder pattern]]
- [[Programmazione/Rust/Pagine/Configurazione applicativa|Configurazione applicativa]]
- [[Programmazione/Rust/Pagine/Structs|Structs]]
