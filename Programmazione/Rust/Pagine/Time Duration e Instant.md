---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - standard-library
aliases:
  - "Time"
  - "Duration"
  - "Instant"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Tipi di dato primitivi]]"
  - "[[Programmazione/Rust/Pagine/Result]]"
related:
  - "[[Programmazione/Rust/Pagine/Async Await]]"
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]"
  - "[[Programmazione/Rust/Pagine/Performance e profiling]]"
---

# Time, Duration e Instant

## Sintesi

La standard library espone tipi base per tempo e durate in `std::time`. `Duration` rappresenta una durata. `Instant` rappresenta un punto monotonicamente crescente utile per misurare intervalli. `SystemTime` rappresenta il tempo di sistema, soggetto a cambiamenti dell'orologio.

Per date, timezone e formattazione avanzata si usano crate esterne come `time` o `chrono`.

## Quando usarlo

- Usa `Duration` per timeout, attese e intervalli.
- Usa `Instant` per misurare tempo trascorso.
- Usa `SystemTime` per timestamp legati all'orologio di sistema.
- Evita `SystemTime` per benchmark o misure di durata.

## Come funziona

```rust
use std::time::{Duration, Instant};

let start = Instant::now();
std::thread::sleep(Duration::from_millis(10));
let elapsed = start.elapsed();
```

`Instant` e monotonic e adatto a misurare durata. `SystemTime` puo andare avanti o indietro se l'orologio del sistema cambia.

## API / Sintassi

Creazione di durate:

```rust
let a = Duration::from_secs(5);
let b = Duration::from_millis(250);
let c = Duration::from_nanos(100);
```

Operazioni:

```rust
let total = a + b;
let checked = a.checked_sub(b);
```

Tempo di sistema:

```rust
let now = std::time::SystemTime::now();
let unix = now.duration_since(std::time::UNIX_EPOCH)?;
```

## Esempio pratico

```rust
use std::time::{Duration, Instant};

fn measure<F, T>(f: F) -> (T, Duration)
where
    F: FnOnce() -> T,
{
    let start = Instant::now();
    let result = f();
    let elapsed = start.elapsed();
    (result, elapsed)
}
```

La funzione usa `Instant` per misurare una durata indipendente dall'orologio di sistema.

## Varianti

- `Duration`: durata non negativa.
- `Instant`: tempo monotonic per misure.
- `SystemTime`: tempo di sistema.
- `UNIX_EPOCH`: riferimento per timestamp Unix.
- Timer async: forniti da runtime come Tokio, non dalla standard library sync.

## Errori comuni

- Usare `SystemTime` per misurare performance.
- Ignorare che `duration_since` puo fallire se il tempo e precedente al riferimento.
- Usare `thread::sleep` in codice async.
- Aspettarsi precisione perfetta da sleep e timer.
- Reinventare gestione timezone con `SystemTime`.

## Checklist

- Stai misurando durata o registrando un timestamp?
- Serve monotonicita? Usa `Instant`.
- Il codice e sync o async?
- Hai gestito possibili errori di `SystemTime`?
- Serve una crate esterna per date/timezone/formattazione?

## Collegamenti

- [[Programmazione/Rust/Pagine/Async Await|Async Await]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async Tokio e async-std]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Operatore|Operatore ?]]
