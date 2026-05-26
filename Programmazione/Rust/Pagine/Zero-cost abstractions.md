---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags:
  - programmazione
  - rust
  - rust-di-sistema
aliases:
  - "Zero-cost abstractions"
  - "Astrazioni zero-cost"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Generics]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Iterator API]]"
related:
  - "[[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch]]"
  - "[[Programmazione/Rust/Pagine/Performance e profiling]]"
  - "[[Programmazione/Rust/Pagine/Rayon e parallel iterators]]"
---

# Zero-cost abstractions

## Sintesi

Le **zero-cost abstractions** sono astrazioni che offrono ergonomia e sicurezza senza imporre un costo runtime aggiuntivo rispetto a codice manuale equivalente. In Rust questo principio appare in generics, iteratori, trait con dispatch statico, newtype, pattern matching e API basate su ownership.

"Zero-cost" non significa "sempre gratis": significa che il costo non e nascosto e, quando l'astrazione viene compilata, il risultato puo essere equivalente a codice scritto a mano. Ci possono comunque essere costi di compile time, dimensione binario o scelte API.

## Quando usarlo

Ragiona in termini di astrazioni zero-cost quando:

- vuoi scrivere API generiche senza perdere performance;
- devi scegliere tra iteratori e loop espliciti;
- stai progettando trait e tipi wrapper;
- vuoi evitare dynamic dispatch non necessario;
- lavori su codice di sistema o percorsi caldi;
- devi mantenere codice leggibile senza sacrificare controllo.

Il concetto serve anche a evitare micro-ottimizzazioni premature: in Rust molte astrazioni idiomatiche sono gia pensate per compilare bene.

## Come funziona

Rust abilita astrazioni zero-cost tramite diversi meccanismi:

- **monomorphization**: il compilatore genera versioni concrete del codice generico;
- **inlining**: funzioni piccole e combinatori possono essere fuse nel chiamante;
- **static dispatch**: chiamate a trait generici possono essere risolte a compile time;
- **ownership**: evita runtime garbage collector e molte verifiche dinamiche;
- **enum e pattern matching**: rappresentano alternative tipizzate senza gerarchie runtime;
- **iterator fusion**: catene di iteratori possono diventare loop ottimizzati.

Esempio: una funzione generica con trait bound puo compilare in codice specifico per ogni tipo usato:

```rust
fn max_value<T: Ord + Copy>(left: T, right: T) -> T {
    if left >= right {
        left
    } else {
        right
    }
}
```

Non serve una tabella virtuale se il tipo e noto a compile time.

## API / Sintassi

Forme comuni:

```rust
fn parse_all<I>(items: I) -> usize
where
    I: IntoIterator<Item = String>,
{
    items.into_iter().filter(|item| !item.is_empty()).count()
}
```

Trait object con dynamic dispatch:

```rust
trait Draw {
    fn draw(&self);
}

fn draw_all(items: &[Box<dyn Draw>]) {
    for item in items {
        item.draw();
    }
}
```

La prima forma tende a usare static dispatch e monomorphization. La seconda usa dynamic dispatch tramite `dyn Trait`, utile quando serve eterogeneita runtime, ma con costo e vincoli diversi.

## Esempio pratico

Loop esplicito:

```rust
fn sum_even(values: &[u64]) -> u64 {
    let mut total = 0;

    for value in values {
        if value % 2 == 0 {
            total += value;
        }
    }

    total
}
```

Versione con iteratori:

```rust
fn sum_even(values: &[u64]) -> u64 {
    values
        .iter()
        .copied()
        .filter(|value| value % 2 == 0)
        .sum()
}
```

In build ottimizzate, la versione con iteratori puo compilare in codice equivalente al loop manuale. La scelta dovrebbe quindi considerare anche chiarezza, testabilita e possibilita di composizione.

## Varianti

- **Generics statici**: performance alta, possibile aumento del binario.
- **Trait object**: flessibilita runtime, costo di dispatch indiretto.
- **Iteratori**: composizione espressiva, spesso ottimizzata in loop.
- **Newtype**: sicurezza semantica senza wrapper runtime significativo.
- **Typestate**: stati rappresentati nel type system invece che con flag runtime.
- **Zero-sized types**: tipi senza dati runtime, utili come marker.

## Errori comuni

- Pensare che ogni astrazione Rust sia automaticamente zero-cost.
- Usare `Box<dyn Trait>` quando basta un generic parameter.
- Sostituire iteratori con loop senza misurare.
- Ignorare code size e tempi di compilazione causati da monomorphization.
- Nascondere allocazioni dentro API apparentemente leggere.
- Confondere costo runtime nullo con complessita concettuale nulla.
- Usare troppi tipi avanzati rendendo l'API difficile da capire.

## Checklist

- Il dispatch e statico o dinamico?
- L'astrazione introduce allocazioni?
- Il codice e compilato in release quando misuri?
- La monomorphization aumenta troppo il binario?
- L'API resta leggibile per chi la usa?
- Hai verificato il percorso caldo con profiling?
- Il costo dell'astrazione e documentato se non e nullo?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Generics]]
- [[Programmazione/Rust/Pagine/Traits]]
- [[Programmazione/Rust/Pagine/Iterator API]]
- [[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch]]
- [[Programmazione/Rust/Pagine/Performance e profiling]]
- [[Programmazione/Rust/Pagine/Rayon e parallel iterators]]
