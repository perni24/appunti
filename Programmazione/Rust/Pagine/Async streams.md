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
  - "Stream async"
  - "Async Stream Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Async Await]]"
  - "[[Programmazione/Rust/Pagine/Future Trait]]"
  - "[[Programmazione/Rust/Pagine/Iterator API]]"
related:
  - "[[Programmazione/Rust/Pagine/Channel async]]"
  - "[[Programmazione/Rust/Pagine/select join e cancellation]]"
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]"
---

# Async streams

## Sintesi

Uno stream async e l'equivalente asincrono di un iteratore: produce una sequenza di valori nel tempo. Ogni elemento puo richiedere attesa, per esempio messaggi da rete, righe da socket o eventi da channel.

Nella pratica si usano trait e utility da ecosystem come `futures`, `tokio-stream` o runtime specifici.

## Quando usarlo

- Quando ricevi molti valori asincroni nel tempo.
- Quando vuoi trasformare eventi con pipeline simili agli iteratori.
- Quando leggi da channel, socket o sorgenti I/O incrementali.
- Quando una singola `Future` non basta per rappresentare piu output.

## Come funziona

Concettualmente:

```rust
trait Stream {
    type Item;
    fn poll_next(...) -> Poll<Option<Self::Item>>;
}
```

Uno stream restituisce:

- `Some(item)` per un valore disponibile;
- `None` quando la sequenza e finita;
- `Pending` quando bisogna attendere.

## API / Sintassi

Con `StreamExt`:

```rust
use futures::StreamExt;

while let Some(item) = stream.next().await {
    println!("{item:?}");
}
```

Adattatori:

```rust
stream
    .filter(|item| async move { item.is_valid() })
    .map(|item| item.value())
```

## Esempio pratico

```rust
use futures::StreamExt;

async fn consume_numbers<S>(mut stream: S)
where
    S: futures::Stream<Item = u64> + Unpin,
{
    while let Some(n) = stream.next().await {
        println!("{n}");
    }
}
```

La funzione consuma una sequenza asincrona di numeri.

## Varianti

- `Stream` da crate `futures`.
- `tokio_stream` per integrazione Tokio.
- Receiver async convertiti in stream.
- Stream boxed per tipi eterogenei.
- Stream pinned quando il tipo non e `Unpin`.

## Errori comuni

- Confondere `Iterator` e `Stream`: il secondo richiede `.await`.
- Dimenticare `Unpin` o pinning quando si usa `.next().await`.
- Creare stream che non gestiscono cancellation.
- Usare stream per un singolo valore invece di `Future`.
- Non gestire backpressure.

## Checklist

- La sorgente produce molti valori nel tempo?
- Serve trasformare o filtrare eventi?
- Il runtime e compatibile con lo stream scelto?
- Serve pinning o boxing?
- Cosa succede se il consumer si ferma?

## Collegamenti

- [[Programmazione/Rust/Pagine/Iterator API|Iterator API]]
- [[Programmazione/Rust/Pagine/Future Trait|Future Trait]]
- [[Programmazione/Rust/Pagine/Channel async|Channel async]]
- [[Programmazione/Rust/Pagine/select join e cancellation|select join e cancellation]]
- [[Programmazione/Rust/Pagine/Pin e Unpin|Pin e Unpin]]
