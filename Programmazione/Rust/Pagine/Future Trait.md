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
  - "Future"
  - "std::future::Future"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Async Await]]"
  - "[[Programmazione/Rust/Pagine/Pin e Unpin]]"
related:
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]"
  - "[[Programmazione/Rust/Pagine/select join e cancellation]]"
  - "[[Programmazione/Rust/Pagine/Async streams]]"
---

# Future Trait

## Sintesi

`Future` e il trait che rappresenta un calcolo asincrono che produrra un valore in futuro. Una future viene avanzata tramite polling: il runtime la chiama finche restituisce `Poll::Ready`.

Le `async fn` generano tipi anonimi che implementano `Future`.

## Quando usarlo

- Quando vuoi capire cosa produce una `async fn`.
- Quando scrivi API generiche che accettano future.
- Quando implementi primitive async avanzate.
- Quando devi capire `Pin<&mut Self>` e `Poll`.

## Come funziona

Forma semplificata:

```rust
trait Future {
    type Output;

    fn poll(
        self: std::pin::Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Self::Output>;
}
```

`Poll::Pending` significa che la future non e pronta e deve essere risvegliata tramite waker. `Poll::Ready(value)` significa completata.

## API / Sintassi

Bound generico:

```rust
use std::future::Future;

fn accepts_future<F>(future: F)
where
    F: Future<Output = i32>,
{
    let _ = future;
}
```

Future boxed:

```rust
use std::future::Future;
use std::pin::Pin;

type BoxFuture<'a, T> = Pin<Box<dyn Future<Output = T> + Send + 'a>>;
```

## Esempio pratico

```rust
use std::future::Future;

async fn value() -> i32 {
    10
}

fn make_future() -> impl Future<Output = i32> {
    value()
}
```

`impl Future` nasconde il tipo concreto generato dal compilatore.

## Varianti

- Future anonime generate da `async`.
- `impl Future<Output = T>`: ritorno statico.
- `Pin<Box<dyn Future<Output = T>>>`: trait object boxed.
- Future `Send`: spostabile tra thread del runtime.
- Future non `Send`: usabile su executor single-thread/local.

## Errori comuni

- Implementare manualmente `Future` senza capire pinning.
- Pensare che una future faccia lavoro se non viene pollata.
- Dimenticare che cancellare una future significa dropparla.
- Usare `BoxFuture` quando `impl Future` basta.
- Conservare valori non `Send` attraverso `.await` in task spawnate su runtime multi-thread.

## Checklist

- Serve esporre `impl Future` o `async fn` basta?
- La future deve essere `Send`?
- Serve boxing per eterogeneita o ricorsione?
- Chi esegue il polling?
- La cancellazione tramite drop lascia invarianti valide?

## Collegamenti

- [[Programmazione/Rust/Pagine/Async Await|Async Await]]
- [[Programmazione/Rust/Pagine/Pin e Unpin|Pin e Unpin]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async Tokio e async-std]]
- [[Programmazione/Rust/Pagine/select join e cancellation|select join e cancellation]]
- [[Programmazione/Rust/Pagine/Async streams|Async streams]]
