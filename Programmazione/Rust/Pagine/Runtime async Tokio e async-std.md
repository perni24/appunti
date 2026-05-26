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
  - concorrenza-e-asincronia
aliases:
  - "Tokio"
  - "async-std"
  - "Runtime async Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Async Await]]"
  - "[[Programmazione/Rust/Pagine/Future Trait]]"
related:
  - "[[Programmazione/Rust/Pagine/Channel async]]"
  - "[[Programmazione/Rust/Pagine/select join e cancellation]]"
  - "[[Programmazione/Rust/Pagine/Graceful shutdown]]"
---

# Runtime async: Tokio e async-std

## Sintesi

La standard library definisce `Future`, `async` e `.await`, ma non fornisce un runtime async completo per I/O, timer e scheduling di task. Per eseguire applicazioni async si usa un runtime, spesso Tokio o async-std.

Il runtime e responsabile di pollare future, gestire reactor I/O, timer, task e primitive async.

## Quando usarlo

- Usa Tokio quando lavori con ecosistema web/server Rust moderno, networking, database async e librerie che lo richiedono.
- Usa async-std quando vuoi API ispirate alla standard library con runtime async.
- Scegli un runtime principale per applicazione.
- Evita di mescolare runtime senza una ragione precisa.

## Come funziona

Tokio:

```rust
#[tokio::main]
async fn main() {
    println!("hello async");
}
```

async-std:

```rust
#[async_std::main]
async fn main() {
    println!("hello async");
}
```

Le macro creano e avviano il runtime, poi eseguono la future `main`.

## API / Sintassi

Dipendenza Tokio tipica:

```toml
[dependencies]
tokio = { version = "1", features = ["rt-multi-thread", "macros"] }
```

Spawn:

```rust
tokio::spawn(async move {
    println!("task");
});
```

Sleep:

```rust
tokio::time::sleep(std::time::Duration::from_secs(1)).await;
```

## Esempio pratico

```rust
async fn do_work(id: u64) -> u64 {
    id * 2
}

#[tokio::main]
async fn main() {
    let handle = tokio::spawn(async {
        do_work(21).await
    });

    let result = handle.await.unwrap();
    println!("{result}");
}
```

La task viene schedulata dal runtime e il risultato viene recuperato dal `JoinHandle`.

## Varianti

- Tokio current-thread runtime.
- Tokio multi-thread runtime.
- async-std runtime.
- Runtime locali per future non `Send`.
- Esecuzione manuale tramite builder del runtime.

## Errori comuni

- Usare API Tokio dentro async-std o viceversa senza compatibilita.
- Bloccare un thread del runtime con I/O sync o CPU work lungo.
- Usare `std::thread::sleep` in async invece del timer del runtime.
- Spawnare task e ignorare errori/panic del `JoinHandle`.
- Mescolare piu runtime nella stessa app senza confini chiari.

## Checklist

- Quale runtime usa l'ecosistema delle librerie scelte?
- Le task spawnate devono essere `Send + 'static`?
- Hai separato lavoro CPU-bound con `spawn_blocking` o Rayon?
- I timer e i channel sono del runtime corretto?
- Lo shutdown del runtime e gestito?

## Collegamenti

- [[Programmazione/Rust/Pagine/Async Await|Async Await]]
- [[Programmazione/Rust/Pagine/Future Trait|Future Trait]]
- [[Programmazione/Rust/Pagine/Channel async|Channel async]]
- [[Programmazione/Rust/Pagine/select join e cancellation|select join e cancellation]]
- [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]]
