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
  - "async await Rust"
  - "Async/Await"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Future Trait]]"
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Lifetimes avanzati]]"
related:
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]"
  - "[[Programmazione/Rust/Pagine/select join e cancellation]]"
  - "[[Programmazione/Rust/Pagine/Pin e Unpin]]"
---

# Async/Await

## Sintesi

`async`/`.await` permette di scrivere codice asincrono in forma sequenziale. Una funzione `async fn` non esegue subito il corpo: restituisce una `Future` che viene eseguita quando un runtime la poll-a.

Rust async e cooperativo: una task cede controllo quando raggiunge `.await`.

## Quando usarlo

- Per I/O concorrente: rete, socket, timer, database async.
- Per molte operazioni attese senza dedicare un thread per ciascuna.
- Con runtime come Tokio o async-std.
- Quando le librerie usate espongono API async.

## Come funziona

```rust
async fn fetch() -> String {
    String::from("data")
}
```

Chiamare `fetch()` produce una future. Per ottenere il risultato serve `.await` dentro un contesto async:

```rust
let data = fetch().await;
```

Il compilatore trasforma il corpo async in una state machine.

## API / Sintassi

Funzione async:

```rust
async fn run() -> Result<(), Box<dyn std::error::Error>> {
    do_work().await?;
    Ok(())
}
```

Blocco async:

```rust
let fut = async {
    42
};
```

Spawn su runtime:

```rust
tokio::spawn(async move {
    println!("task");
});
```

## Esempio pratico

```rust
async fn load_user(id: u64) -> Result<String, String> {
    Ok(format!("user-{id}"))
}

async fn handler() -> Result<(), String> {
    let user = load_user(1).await?;
    println!("{user}");
    Ok(())
}
```

Il flusso e scritto in modo lineare, ma ogni `.await` puo sospendere la task.

## Varianti

- `async fn`: funzione che restituisce una future anonima.
- `async move`: blocco che cattura ownership.
- `.await`: sospensione fino al completamento della future.
- `join!`: attende piu future concorrenti.
- `select!`: attende il primo evento tra piu future.

## Errori comuni

- Pensare che chiamare una `async fn` esegua subito il lavoro.
- Usare operazioni bloccanti dentro async senza `spawn_blocking`.
- Tenere un `std::sync::MutexGuard` attraverso `.await`.
- Dimenticare `move` quando la task deve possedere dati.
- Confondere concorrenza async con parallelismo CPU.

## Checklist

- Hai un runtime che esegue le future?
- Il lavoro e I/O-bound o CPU-bound?
- Ogni `.await` puo sospendere la task in uno stato valido?
- Stai usando primitive async invece di bloccare thread?
- Le future spawnate devono essere `Send + 'static`?

## Collegamenti

- [[Programmazione/Rust/Pagine/Future Trait|Future Trait]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async Tokio e async-std]]
- [[Programmazione/Rust/Pagine/select join e cancellation|select join e cancellation]]
- [[Programmazione/Rust/Pagine/Pin e Unpin|Pin e Unpin]]
- [[Programmazione/Rust/Pagine/Async streams|Async streams]]
