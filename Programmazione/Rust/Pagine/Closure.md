---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags: [programmazione, rust, closure, funzioni]
aliases:
  - "Closure Rust"
  - "Funzioni anonime Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Funzioni]]"
  - "[[Programmazione/Rust/Pagine/Ownership]]"
related:
  - "[[Programmazione/Rust/Pagine/Iteratori]]"
  - "[[Programmazione/Rust/Pagine/Move semantics]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
---

# Closure

## Sintesi

Una closure e una funzione anonima che puo catturare variabili dall'ambiente in cui viene definita. In Rust le closure sono usate spesso con iteratori, callback, thread e API che accettano comportamento parametrico.

La cattura puo avvenire per riferimento, per riferimento mutabile o per move, in base a come la closure usa le variabili.

## Quando usarlo

- Quando vuoi passare una piccola funzione come argomento.
- Quando usi iteratori con `map`, `filter`, `fold`, `find`.
- Quando vuoi catturare configurazione locale senza definire una funzione separata.
- Quando l'API richiede un parametro che implementa `Fn`, `FnMut` o `FnOnce`.

## Come funziona

Sintassi base:

```rust
let doppio = |n: i32| n * 2;
println!("{}", doppio(4));
```

Con cattura:

```rust
let prefisso = String::from("id-");
let formatta = |n| format!("{prefisso}{n}");
```

La closure cattura `prefisso` dall'ambiente. Il modo di cattura dipende dall'uso.

## API / Sintassi

```rust
let c = |argomento| espressione;
let c = |a: i32, b: i32| -> i32 { a + b };
```

`move` forza la cattura per ownership:

```rust
let nome = String::from("worker");
let task = move || {
    println!("{nome}");
};
```

Trait delle closure:

```rust
fn applica<F>(f: F) -> i32
where
    F: Fn(i32) -> i32,
{
    f(10)
}
```

## Esempio pratico

```rust
fn filtra_con_soglia(numeri: &[i32], soglia: i32) -> Vec<i32> {
    numeri
        .iter()
        .copied()
        .filter(|n| *n >= soglia)
        .collect()
}

fn main() {
    let numeri = vec![1, 5, 10];
    let filtrati = filtra_con_soglia(&numeri, 5);
    println!("{filtrati:?}");
}
```

La closure passata a `filter` cattura `soglia` e decide quali elementi mantenere.

## Varianti

- `Fn`: closure chiamabile piu volte senza modificare o consumare catture.
- `FnMut`: closure che puo modificare lo stato catturato.
- `FnOnce`: closure che puo consumare catture e quindi essere chiamata almeno una volta.
- Closure `move`: cattura ownership dei valori usati.
- Function pointer `fn`: funzione senza cattura dell'ambiente.

## Errori comuni

- Usare `move` e poi aspettarsi di usare ancora il valore catturato.
- Confondere il tipo ricevuto da `filter`: spesso e un riferimento.
- Scrivere closure troppo grandi invece di estrarre una funzione.
- Richiedere `Fn` in una API quando serve `FnMut` o `FnOnce`.
- Non capire perche una closure puo essere chiamata una sola volta dopo aver mosso un valore.

## Checklist

- La closure deve leggere, modificare o consumare variabili catturate?
- L'API richiede `Fn`, `FnMut` o `FnOnce`?
- Serve `move` per thread, async o durata oltre lo scope corrente?
- La closure resta leggibile o conviene una funzione nominata?
- Stai passando valori posseduti o riferimenti?

## Collegamenti

- [[Programmazione/Rust/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Rust/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Rust/Pagine/Move semantics|Move semantics]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Threads|Threads]]

