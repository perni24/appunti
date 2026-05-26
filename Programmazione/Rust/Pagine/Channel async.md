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
  - "Async channels"
  - "tokio::sync::mpsc"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Async Await]]"
  - "[[Programmazione/Rust/Pagine/Message passing]]"
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]"
related:
  - "[[Programmazione/Rust/Pagine/select join e cancellation]]"
  - "[[Programmazione/Rust/Pagine/Async streams]]"
  - "[[Programmazione/Rust/Pagine/Graceful shutdown]]"
---

# Channel async

## Sintesi

I channel async permettono a task asincrone di comunicare senza bloccare thread. Sono il corrispettivo async del message passing: una task invia messaggi, un'altra li riceve con `.await`.

La scelta del tipo di channel determina backpressure, numero di consumer e semantica di aggiornamento.

## Quando usarlo

- Quando task async devono comunicare eventi o comandi.
- Quando vuoi separare produttori e consumatori.
- Quando serve backpressure con canali bounded.
- Quando devi coordinare shutdown o fan-out.

## Come funziona

Con Tokio:

```rust
let (tx, mut rx) = tokio::sync::mpsc::channel::<String>(32);

tokio::spawn(async move {
    tx.send(String::from("job")).await.unwrap();
});

while let Some(message) = rx.recv().await {
    println!("{message}");
}
```

`send().await` puo attendere se il buffer e pieno.

## API / Sintassi

Tipi comuni Tokio:

```rust
tokio::sync::mpsc
tokio::sync::oneshot
tokio::sync::broadcast
tokio::sync::watch
```

Pattern richiesta/risposta:

```rust
let (reply_tx, reply_rx) = tokio::sync::oneshot::channel();
```

## Esempio pratico

```rust
enum Command {
    Work(String),
    Shutdown,
}

async fn worker(mut rx: tokio::sync::mpsc::Receiver<Command>) {
    while let Some(command) = rx.recv().await {
        match command {
            Command::Work(job) => println!("{job}"),
            Command::Shutdown => break,
        }
    }
}
```

Il protocollo e esplicito e modellato con un enum.

## Varianti

- `mpsc`: molti producer, un consumer.
- `oneshot`: singolo valore.
- `broadcast`: ogni receiver riceve messaggi.
- `watch`: conserva ultimo valore e notifica cambiamenti.
- Channel bounded vs unbounded.

## Errori comuni

- Usare channel unbounded e perdere controllo memoria.
- Ignorare errore di `send`, che indica receiver chiuso.
- Non chiudere sender e impedire terminazione del receiver.
- Usare `broadcast` quando serve coda per ogni consumer.
- Mescolare channel sync in contesti async causando blocchi.

## Checklist

- Quanti producer e consumer servono?
- Serve backpressure?
- Il messaggio trasferisce ownership?
- Come si chiude il canale?
- Serve distinguere shutdown normale da errore?

## Collegamenti

- [[Programmazione/Rust/Pagine/Message passing|Message passing]]
- [[Programmazione/Rust/Pagine/Async Await|Async Await]]
- [[Programmazione/Rust/Pagine/select join e cancellation|select join e cancellation]]
- [[Programmazione/Rust/Pagine/Async streams|Async streams]]
- [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]]
