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
  - "Message passing Rust"
  - "std::sync::mpsc"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Threads]]"
  - "[[Programmazione/Rust/Pagine/Ownership]]"
related:
  - "[[Programmazione/Rust/Pagine/Channel async]]"
  - "[[Programmazione/Rust/Pagine/Shared state]]"
  - "[[Programmazione/Rust/Pagine/Graceful shutdown]]"
---

# Message passing

## Sintesi

Message passing significa comunicare tra thread o task inviando messaggi invece di condividere direttamente stato mutabile. In Rust e un pattern naturale perche il messaggio puo trasferire ownership dal produttore al consumatore.

Nella standard library il canale principale e `std::sync::mpsc`.

## Quando usarlo

- Quando vuoi evitare lock espliciti.
- Quando un thread produce lavoro e un altro lo consuma.
- Quando vuoi modellare worker, code, eventi o comandi.
- Quando il trasferimento di ownership e piu semplice della condivisione.

## Come funziona

```rust
use std::sync::mpsc;
use std::thread;

let (tx, rx) = mpsc::channel();

thread::spawn(move || {
    tx.send(String::from("ciao")).unwrap();
});

let msg = rx.recv().unwrap();
println!("{msg}");
```

`send` muove il messaggio nel canale. `recv` blocca finche arriva un messaggio o tutti i sender vengono chiusi.

## API / Sintassi

```rust
let (tx, rx) = std::sync::mpsc::channel::<String>();

tx.send(String::from("job"))?;
let job = rx.recv()?;
```

Canale bounded:

```rust
let (tx, rx) = std::sync::mpsc::sync_channel(10);
```

Iterazione:

```rust
for message in rx {
    println!("{message}");
}
```

## Esempio pratico

```rust
use std::sync::mpsc;
use std::thread;

enum Command {
    Work(u64),
    Stop,
}

fn worker(rx: mpsc::Receiver<Command>) {
    while let Ok(command) = rx.recv() {
        match command {
            Command::Work(id) => println!("job {id}"),
            Command::Stop => break,
        }
    }
}
```

Il messaggio `Stop` rende esplicito lo shutdown.

## Varianti

- `mpsc::channel`: canale non bounded.
- `mpsc::sync_channel`: canale bounded con backpressure.
- Async channels: `tokio::sync::mpsc`, `async_std::channel` o crate dedicate.
- One-shot channel: risposta singola.
- Broadcast/watch channel: modelli async specifici.

## Errori comuni

- Usare canali non bounded senza controllo di memoria.
- Ignorare errori di `send`: indicano ricevitore chiuso.
- Tenere sender clonati e impedire la chiusura del receiver.
- Mandare messaggi troppo grandi senza valutare il costo di move.
- Usare channel quando basta una chiamata diretta.

## Checklist

- Serve ownership transfer o condivisione?
- Il canale deve essere bounded?
- Come viene segnalata la chiusura?
- Gli errori di `send` e `recv` sono gestiti?
- Il protocollo dei messaggi e modellato con enum chiari?

## Collegamenti

- [[Programmazione/Rust/Pagine/Threads|Threads]]
- [[Programmazione/Rust/Pagine/Channel async|Channel async]]
- [[Programmazione/Rust/Pagine/Shared state|Shared state]]
- [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]]
- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
