---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - concorrenza-e-asincronia
aliases:
  - "select!"
  - "join!"
  - "Cancellation async Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Async Await]]"
  - "[[Programmazione/Rust/Pagine/Future Trait]]"
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]"
related:
  - "[[Programmazione/Rust/Pagine/Channel async]]"
  - "[[Programmazione/Rust/Pagine/Graceful shutdown]]"
  - "[[Programmazione/Rust/Pagine/Async streams]]"
---

# select!, join! e cancellation

## Sintesi

`join!` e `select!` sono strumenti per coordinare piu future. `join!` attende che tutte completino. `select!` reagisce alla prima future pronta tra piu rami. La cancellation in Rust async avviene normalmente droppando una future.

Questo rende importante progettare future cancellation-safe, soprattutto con `select!`.

## Quando usarlo

- Usa `join!` quando piu operazioni devono completare tutte.
- Usa `select!` quando vuoi reagire al primo evento: messaggio, timeout, shutdown, I/O.
- Usa cancellation quando interrompere lavoro pendente e corretto.
- Usa timeout per limitare attese su I/O o servizi esterni.

## Come funziona

Con Tokio:

```rust
let (a, b) = tokio::join!(op_a(), op_b());
```

`join!` esegue le future concorrenti nella stessa task.

```rust
tokio::select! {
    value = op_a() => println!("a: {value:?}"),
    _ = op_b() => println!("b pronta"),
}
```

Quando un ramo completa, gli altri rami vengono droppati.

## API / Sintassi

Timeout:

```rust
let result = tokio::time::timeout(
    std::time::Duration::from_secs(5),
    operation(),
).await;
```

Shutdown:

```rust
tokio::select! {
    _ = work() => {}
    _ = shutdown_signal() => {}
}
```

## Esempio pratico

```rust
async fn run_until_shutdown() {
    tokio::select! {
        _ = async { println!("work"); } => {
            println!("work completato");
        }
        _ = tokio::signal::ctrl_c() => {
            println!("shutdown richiesto");
        }
    }
}
```

La task reagisce al completamento del lavoro o a un segnale di shutdown.

## Varianti

- `join!`: tutte le future devono completare.
- `try_join!`: si ferma al primo errore.
- `select!`: primo ramo pronto.
- Timeout: cancellation tramite drop della future interna.
- Cancellation token: segnale esplicito condiviso.

## Errori comuni

- Usare `join!` aspettandosi parallelismo CPU.
- Usare `select!` su operazioni non cancellation-safe.
- Perdere dati quando una future viene droppata a meta operazione.
- Ignorare bias/fairness della macro usata.
- Dimenticare di propagare shutdown ai task figli.

## Checklist

- Devi attendere tutte le future o la prima pronta?
- Le future droppate lasciano stato coerente?
- Serve timeout?
- Serve un cancellation token?
- I task spawnati vengono attesi o abortiti esplicitamente?

## Collegamenti

- [[Programmazione/Rust/Pagine/Async Await|Async Await]]
- [[Programmazione/Rust/Pagine/Future Trait|Future Trait]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async Tokio e async-std]]
- [[Programmazione/Rust/Pagine/Channel async|Channel async]]
- [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]]
