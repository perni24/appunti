---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - closure
  - funzioni
aliases:
  - Closure Rust
  - Funzioni anonime Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Funzioni]]"
  - "[[Programmazione/Rust/Pagine/Ownership]]"
related:
  - "[[Programmazione/Rust/Pagine/Iteratori]]"
  - "[[Programmazione/Rust/Pagine/Move semantics]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
title: Closure
---

# Closure

## Sintesi

Una closure e un valore chiamabile con un tipo anonimo, che puo catturare dati dall'ambiente. Serve per passare comportamento a iteratori e callback, conservando le regole di ownership e borrowing.

Occorre distinguere **come cattura** i dati da **come li usa quando viene chiamata**. `move` riguarda la cattura; `Fn`, `FnMut` e `FnOnce` descrivono la modalita di chiamata.

Esempi autonomi di closure sincrone per Rust stable, edition 2024. Il controesempio finale non deve compilare.

## Quando usarlo

- Passare a `map`, `filter` o `fold` una piccola trasformazione.
- Configurare un comportamento con valori locali senza introdurre stato globale.
- Differire un calcolo o accettare una callback in una propria API.
- Restituire un comportamento che possiede la configurazione necessaria.
- Estrarre una funzione nominata quando la logica diventa lunga o riutilizzabile senza catture.

## Come funziona

### Sintassi e inferenza

```rust
fn main() {
    let double = |n: i32| -> i64 { i64::from(n) * 2 };
    assert_eq!(double(4), 8);
    assert_eq!(double(i32::MAX), 4_294_967_294);

    let prefix = String::from("id-");
    let format_id = |id: u32| format!("{prefix}{id}");
    assert_eq!(format_id(42), "id-42");
    assert_eq!(prefix, "id-");

    let identity = |value| value;
    assert_eq!(identity(String::from("text")), "text");
}
```

I parametri sono fra `|...|`; senza parametri si scrive `||`. L'ultima espressione e il risultato. Le annotazioni possono essere inferite dall'uso, ma una closure non diventa per questo una funzione genericamente polimorfica: `identity` qui ha input e output `String` e non accetta poi un intero.

Ogni espressione closure ha un tipo distinto, anche con la stessa firma. `format_id` cattura un prestito condiviso di `prefix`; non sposta il testo per il solo fatto di usarlo in `format!`.

### Prestiti sulle catture

```rust
fn main() {
    let mut message = String::from("ready");
    {
        let read = || message.len();
        assert_eq!(read(), 5);
        assert_eq!(message, "ready");
    }
    {
        let mut append = || message.push('!');
        append();
        append();
    }
    assert_eq!(message, "ready!!");
}
```

Il compilatore deduce catture adeguate al corpo: lettura condivisa, accesso mutabile o acquisizione del valore. I prestiti valgono gia quando la closure viene creata e possono impedire accessi incompatibili finche la closure li usa.

Qui i blocchi rendono esplicita la fine dei prestiti; non sono sempre necessari grazie ai lifetime inferiti. `let mut append` consente di chiamare una closure tramite accesso mutabile al suo stato.

Il modello introduttivo non esaurisce i dettagli: la Reference descrive anche catture di singoli campi e prestiti unici di riferimenti mutabili.

## API / Sintassi

### move non significa chiamata singola

```rust
fn call_twice<F: Fn() -> usize>(f: F) -> (usize, usize) {
    (f(), f())
}

fn main() {
    let name = String::from("worker");
    let length = move || name.len();
    assert_eq!(call_twice(&length), (6, 6));
    assert_eq!(length(), 6);

    let number = 7u32;
    let copied = move || number;
    assert_eq!(copied(), 7);
    assert_eq!(number, 7);
}
```

`length` possiede la stringa ma la legge senza estrarla: implementa `Fn` ed e richiamabile. La variabile `name` originale non e piu utilizzabile. `number` e `Copy`, quindi resta disponibile.

`move` cattura per valore anche i riferimenti: muovere un `&T` **non prolunga la vita di T**. Non rende automaticamente una closure `'static` o `Send`. Per esempio `thread::spawn` richiede entrambi i vincoli oltre a `FnOnce`; una cattura `Rc` non diventa trasferibile fra thread grazie a `move`.

### Scegliere il bound della callback

| Bound           | Accesso alla closure        | Uso previsto                                             |
| --------------- | --------------------------- | -------------------------------------------------------- |
| `Fn() -> R`     | Condiviso, come `&self`     | Chiamate senza mutare direttamente o estrarre le catture |
| `FnMut() -> R`  | Esclusivo, come `&mut self` | Chiamate ripetute che possono aggiornare lo stato        |
| `FnOnce() -> R` | Per valore, come `self`     | Una chiamata consumante, che puo estrarre le catture     |

I trait sono cumulativi: chi implementa `Fn` implementa anche `FnMut` e `FnOnce`; chi implementa `FnMut` implementa anche `FnOnce`. Non sono tre categorie disgiunte.

```rust
fn apply<F: Fn(i32) -> i64>(f: F, value: i32) -> i64 {
    f(value)
}

fn run_twice<F: FnMut()>(mut callback: F) {
    callback();
    callback();
}

fn run_once<F: FnOnce() -> R, R>(callback: F) -> R {
    callback()
}

fn main() {
    assert_eq!(apply(|n| i64::from(n) * 2, 10), 20);

    let mut count = 0;
    let increment = || count += 1;
    run_twice(increment);
    assert_eq!(count, 2);

    let payload = String::from("complete");
    let consume = || payload;
    assert_eq!(run_once(consume), "complete");
}
```

Il corpo di `consume` restituisce la stringa catturata, spostandola fuori: non puo essere richiamato sullo stesso valore. Non serve scrivere `move` perche il corpo impone gia una cattura per valore.

Il solo bound `FnOnce` autorizza una chiamata consumante, ma **non garantisce che l'API chiami la callback**: puo anche scartarla. Se devi chiamarla ripetutamente usa almeno `FnMut`. Per una sola invocazione `FnOnce` e normalmente il requisito meno restrittivo; `apply` sopra mostra `Fn` a scopo didattico, non una necessita di quell'implementazione.

### Restituire una closure con configurazione posseduta

```rust
fn formatter(prefix: String) -> impl Fn(u32) -> String {
    move |id| format!("{prefix}{id}")
}

fn main() {
    let format_id = formatter(String::from("task-"));
    assert_eq!(format_id(1), "task-1");
    assert_eq!(format_id(2), "task-2");
}
```

Il valore restituito possiede `prefix` e puo sopravvivere alla funzione. `impl Fn` nasconde un tipo concreto: non significa che ogni ramo possa restituire un tipo di closure diverso. Non e necessario un `Box` solo perche la closure e anonima.

## Esempio pratico

### Filtrare con una soglia catturata

```rust
fn filter_at_least(numbers: &[i32], threshold: i32) -> Vec<i32> {
    numbers.iter().copied()
        .filter(|n| *n >= threshold)
        .collect()
}

fn main() {
    let numbers = vec![1, 5, 10, 5];
    assert_eq!(filter_at_least(&numbers, 5), [5, 10, 5]);
    assert!(filter_at_least(&[], 5).is_empty());
    assert_eq!(numbers, [1, 5, 10, 5]);
}
```

La closure legge `threshold`; il prestito dura soltanto durante la pipeline consumata dalla funzione. `copied` rende `Item = i32`, ma `filter` riceve `&Item`, quindi `n` e `&i32`.

Ordine e duplicati sono conservati. Il confronto include la soglia e non fa somme che possano traboccare; l'output alloca un nuovo vettore. La funzione non limita il numero di elementi accettati.

### Fn non significa funzione pura

```rust
use std::cell::Cell;

fn observe_twice<F: Fn() -> u32>(f: F) -> (u32, u32) {
    (f(), f())
}

fn main() {
    let count = Cell::new(0u32);
    let next = || {
        let value = count.get() + 1;
        count.set(value);
        value
    };
    assert_eq!(observe_twice(next), (1, 2));
    assert_eq!(count.get(), 2);
}
```

Il riferimento catturato non cambia, ma `Cell` consente di aggiornare il contenuto tramite accesso condiviso. Anche una closure `Fn` puo avere effetti o dipendere da stato esterno: il bound non garantisce purezza, determinismo, assenza di panic o sicurezza fra thread.

Questo contatore serve a mostrare due chiamate; per un contatore applicativo arbitrariamente lungo occorre definire una politica di overflow.

## Varianti

### Funzioni e closure senza catture

```rust
fn increment(value: i32) -> i64 {
    i64::from(value) + 1
}

fn main() {
    let callbacks: [fn(i32) -> i64; 2] = [
        increment,
        |value| i64::from(value) * 2,
    ];
    assert_eq!(callbacks[0](4), 5);
    assert_eq!(callbacks[1](4), 8);
}
```

Una closure sincrona senza catture puo essere convertita a un function pointer `fn(...) -> ...`. Una closure che cattura configurazione non puo perdere quell'ambiente per entrare nello stesso tipo.

- Parametro generico `F: Fn...`: accetta tipi concreti diversi di chiamabili; non richiede allocazione della closure.
- `&mut F`: permette a un'API di usare una callback mutabile senza consumare il valore del chiamante.
- `Box<dyn Fn...>`: utile per memorizzare tipi diversi dietro una stessa interfaccia, con dispatch dinamico; vedi i trait object.
- Closure async e futures hanno vincoli ulteriori: non dedurre il loro comportamento dal solo schema delle closure sincrone.

## Errori comuni

### Chiamare due volte una closure che estrae la cattura

Controesempio intenzionale: la prima chiamata consuma il valore non Copy.

```rust
fn main() {
    let text = String::from("one-shot");
    let take = || text;
    println!("{}", take());
    println!("{}", take());
}
```

Per chiamate ripetute cambia il contratto: restituisci un risultato calcolato leggendo la cattura, oppure clona consapevolmente il dato. Non aggiungere clone per nascondere un trasferimento che dovrebbe restare unico.

- Confondere cattura per valore con consumo a ogni invocazione.
- Interpretare `FnOnce` come obbligo di esecuzione o `Fn` come assenza di effetti.
- Richiedere `Fn` quando l'API puo accettare `FnMut` o `FnOnce`.
- Riutilizzare la sorgente mentre una closure conserva un prestito incompatibile.
- Aspettarsi che `move` corregga riferimenti a dati locali o catture non `Send`.
- Usare `return` dentro la closure pensando di uscire dalla funzione esterna.

## Checklist

- Tipi di parametri e risultato inferibili senza ambiguita?
- Catture possedute, condivise o mutabili identificate?
- Il corpo legge, modifica oppure estrae i dati catturati?
- Il bound richiesto e il meno restrittivo compatibile con l'API?
- Lifetime e Send verificati dove la callback viene conservata o trasferita?
- Una funzione nominata renderebbe il codice piu leggibile?

## Collegamenti

- [[Programmazione/Rust/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Rust/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Rust/Pagine/Move semantics|Move semantics]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Cell T|Cell<T>]]
- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]
- [[Programmazione/Rust/Pagine/Threads|Threads]]
- [[Programmazione/Rust/Pagine/Async Await|Async/Await]]

## Fonti

Baseline consultata: **Rust 1.99.1**, edition **2024**. Esempi sincroni, senza crate esterne; nessuna dichiarazione di MSRV.

- [Rust Book: closure, catture e trait](https://doc.rust-lang.org/book/ch13-01-closures.html)
- [Reference: espressioni closure](https://doc.rust-lang.org/reference/expressions/closure-expr.html)
- [Reference: tipi delle closure e modalita di cattura](https://doc.rust-lang.org/reference/types/closure.html)
- [Fn: chiamata con ricevente condiviso](https://doc.rust-lang.org/std/ops/trait.Fn.html)
- [FnMut: chiamata con ricevente mutabile](https://doc.rust-lang.org/std/ops/trait.FnMut.html)
- [FnOnce: chiamata per valore](https://doc.rust-lang.org/std/ops/trait.FnOnce.html)
- [thread::spawn: vincoli FnOnce, Send e static](https://doc.rust-lang.org/std/thread/fn.spawn.html)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
