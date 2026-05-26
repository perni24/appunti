---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - compile-time-e-type-level-programming
aliases:
  - "const"
  - "static"
  - "Costanti Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Tipi di dato primitivi]]"
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Mutabilita]]"
related:
  - "[[Programmazione/Rust/Pagine/const fn]]"
  - "[[Programmazione/Rust/Pagine/OnceLock e LazyLock]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
---

# const e static

## Sintesi

`const` e `static` definiscono valori disponibili a livello globale o compile-time, ma hanno semantiche diverse. `const` e un valore inlined dove viene usato. `static` e una singola locazione di memoria con durata `'static`.

La distinzione e importante per evitare stato globale mutabile, inizializzazione non controllata e assunzioni sbagliate sull'identita in memoria.

## Quando usarlo

- Usa `const` per valori immutabili noti a compile time, come limiti, dimensioni e stringhe.
- Usa `static` per una singola istanza globale con indirizzo stabile.
- Usa `OnceLock` o `LazyLock` quando serve inizializzazione runtime sicura.
- Evita `static mut`: richiede unsafe ed e facile violare aliasing e data race.

## Come funziona

`const`:

```rust
const MAX_RETRIES: u32 = 3;
```

Il valore viene sostituito nei punti d'uso. Non rappresenta una cella globale unica.

`static`:

```rust
static APP_NAME: &str = "notes";
```

`APP_NAME` ha una locazione globale e durata `'static`.

## API / Sintassi

Costante associata:

```rust
struct Limits;

impl Limits {
    const MAX_USERS: usize = 1000;
}
```

Static con inizializzazione lazy:

```rust
use std::sync::LazyLock;

static CONFIG_PATH: LazyLock<String> = LazyLock::new(|| {
    String::from("config.toml")
});
```

Static mutabile sicuro tramite lock:

```rust
use std::sync::Mutex;

static COUNTER: Mutex<u64> = Mutex::new(0);
```

## Esempio pratico

```rust
const DEFAULT_PORT: u16 = 8080;

struct ServerConfig {
    port: u16,
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self { port: DEFAULT_PORT }
    }
}
```

`DEFAULT_PORT` e una costante di dominio, non uno stato globale.

## Varianti

- `const`: valore compile-time senza identita globale.
- `static`: valore globale con indirizzo stabile.
- `static mut`: globale mutabile unsafe.
- Costanti associate: `Type::CONST`.
- `LazyLock` e `OnceLock`: inizializzazione globale sicura.

## Errori comuni

- Usare `static mut` per configurazione globale.
- Pensare che `const` abbia un indirizzo unico.
- Mettere dati runtime in `const`.
- Usare global state quando una dipendenza esplicita sarebbe piu testabile.
- Confondere lifetime `'static` con valore necessariamente globale.

## Checklist

- Il valore e noto a compile time?
- Serve identita globale o basta una costante?
- Il dato deve essere inizializzato a runtime?
- La mutabilita globale e sincronizzata?
- Il valore globale rende test e configurazione piu difficili?

## Collegamenti

- [[Programmazione/Rust/Pagine/const fn|const fn]]
- [[Programmazione/Rust/Pagine/OnceLock e LazyLock|OnceLock e LazyLock]]
- [[Programmazione/Rust/Pagine/Default|Default]]
- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Lifetime annotations|Lifetime annotations]]
