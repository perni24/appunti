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
  - "Shutdown graceful"
  - "Graceful shutdown Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Async Await]]"
  - "[[Programmazione/Rust/Pagine/select join e cancellation]]"
  - "[[Programmazione/Rust/Pagine/Channel async]]"
related:
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]"
  - "[[Programmazione/Rust/Pagine/Message passing]]"
  - "[[Programmazione/Rust/Pagine/Shared state]]"
---

# Graceful shutdown

## Sintesi

Graceful shutdown significa terminare un sistema in modo controllato: smettere di accettare nuovo lavoro, notificare task e worker, completare o annullare operazioni pendenti, rilasciare risorse e attendere la terminazione.

In Rust async si combina spesso con channel, cancellation token, `select!`, segnali OS e join dei task.

## Quando usarlo

- In server HTTP, worker, daemon e consumer di code.
- Quando ci sono task background da chiudere.
- Quando bisogna salvare stato o svuotare buffer.
- Quando un processo deve reagire a Ctrl+C o segnali di sistema.

## Come funziona

Pattern base:

```rust
tokio::select! {
    _ = run_server() => {}
    _ = tokio::signal::ctrl_c() => {
        println!("shutdown");
    }
}
```

Dopo il segnale, bisogna propagare la chiusura ai task figli e attendere il loro completamento.

## API / Sintassi

Con channel:

```rust
let (tx, mut rx) = tokio::sync::watch::channel(false);

tokio::spawn(async move {
    while !*rx.borrow() {
        rx.changed().await.unwrap();
    }
});

tx.send(true).unwrap();
```

Con task:

```rust
let handle = tokio::spawn(async move {
    // worker
});

handle.abort();
```

`abort` e cancellation brusca; graceful shutdown di solito preferisce un segnale cooperativo.

## Esempio pratico

```rust
async fn worker(mut shutdown: tokio::sync::watch::Receiver<bool>) {
    loop {
        tokio::select! {
            changed = shutdown.changed() => {
                if changed.is_ok() && *shutdown.borrow() {
                    break;
                }
            }
            _ = tokio::time::sleep(std::time::Duration::from_secs(1)) => {
                println!("tick");
            }
        }
    }
}
```

Il worker controlla periodicamente il segnale e termina volontariamente.

## Varianti

- Segnale OS: `ctrl_c`.
- Channel di shutdown: `watch`, `broadcast`, `oneshot`.
- Cancellation token da crate esterne.
- Timeout di shutdown.
- Abort forzato dopo periodo di grazia.

## Errori comuni

- Fermare solo il task principale e lasciare task background vivi.
- Usare solo `abort` senza cleanup.
- Non chiudere sender/channel.
- Tenere lock o risorse durante shutdown.
- Non mettere timeout al periodo di attesa finale.

## Checklist

- Chi riceve il segnale di shutdown?
- Come viene propagato ai task figli?
- Le operazioni pendenti sono completate o cancellate?
- I task vengono attesi?
- Esiste un timeout dopo cui forzare l'uscita?

## Collegamenti

- [[Programmazione/Rust/Pagine/select join e cancellation|select join e cancellation]]
- [[Programmazione/Rust/Pagine/Channel async|Channel async]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async Tokio e async-std]]
- [[Programmazione/Rust/Pagine/Message passing|Message passing]]
- [[Programmazione/Rust/Pagine/Shared state|Shared state]]
