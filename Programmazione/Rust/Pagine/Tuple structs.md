---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags: [programmazione, rust, tuple-structs, newtype]
aliases:
  - "Tuple struct Rust"
  - "Newtype semplice"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Structs]]"
  - "[[Programmazione/Rust/Pagine/Tipi di dato primitivi]]"
related:
  - "[[Programmazione/Rust/Pagine/Newtype pattern]]"
  - "[[Programmazione/Rust/Pagine/Pattern Matching]]"
  - "[[Programmazione/Rust/Pagine/Derive traits]]"
---

# Tuple structs

## Sintesi

Una tuple struct e una struct con campi posizionali invece che nominati. Serve quando vuoi creare un tipo distinto con struttura leggera, spesso per dare significato a un valore primitivo o a una tupla.

Il caso piu comune e il newtype: avvolgere un valore in un tipo dedicato per evitare confusione tra dati simili.

## Quando usarlo

- Quando vuoi distinguere concetti che hanno la stessa rappresentazione, per esempio `UserId(u64)` e `OrderId(u64)`.
- Quando i campi sono pochi e la posizione e chiara.
- Quando vuoi un wrapper sottile intorno a un tipo esistente.
- Quando vuoi implementare trait per un tipo locale.

## Come funziona

La dichiarazione usa il nome della struct seguito dai tipi dei campi:

```rust
struct UserId(u64);
struct Coordinate(i32, i32);
```

I campi si accedono per indice:

```rust
let id = UserId(42);
println!("{}", id.0);
```

Anche se contiene un `u64`, `UserId` e un tipo diverso da `u64`.

## API / Sintassi

```rust
#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
struct UserId(u64);

impl UserId {
    fn new(value: u64) -> Self {
        Self(value)
    }

    fn get(self) -> u64 {
        self.0
    }
}
```

Pattern matching:

```rust
let UserId(raw) = UserId(10);
println!("{raw}");
```

## Esempio pratico

```rust
#[derive(Debug, Copy, Clone, PartialEq)]
struct Celsius(f64);

#[derive(Debug, Copy, Clone, PartialEq)]
struct Fahrenheit(f64);

fn celsius_to_fahrenheit(c: Celsius) -> Fahrenheit {
    Fahrenheit(c.0 * 9.0 / 5.0 + 32.0)
}

fn main() {
    let temperatura = Celsius(20.0);
    let converted = celsius_to_fahrenheit(temperatura);
    println!("{converted:?}");
}
```

Senza tipi distinti, sarebbe facile passare un valore in Fahrenheit dove la funzione si aspetta Celsius.

## Varianti

- Tuple struct a un campo: tipica forma newtype.
- Tuple struct a piu campi: utile quando la posizione e naturale, per esempio coordinate.
- Unit-like struct: nessun campo, utile come marker.
- Wrapper generico: `struct Id<T>(u64, PhantomData<T>)`.

## Errori comuni

- Usare tuple struct con molti campi e rendere il codice poco leggibile.
- Esporre il campo interno pubblicamente quando vuoi mantenere invarianti.
- Dimenticare di derivare trait utili come `Debug`, `Copy`, `Clone`, `Eq`, `Hash`.
- Usare un alias di tipo al posto di un newtype quando serve davvero distinzione di tipo.
- Accedere a `.0`, `.1`, `.2` in molti punti invece di fornire metodi chiari.

## Checklist

- Il tipo rappresenta un concetto distinto dal valore interno?
- Un alias `type` sarebbe troppo debole?
- Il campo interno deve essere pubblico?
- Servono metodi per costruire o validare il valore?
- La tuple struct resta leggibile con campi posizionali?

## Collegamenti

- [[Programmazione/Rust/Pagine/Structs|Structs]]
- [[Programmazione/Rust/Pagine/Newtype pattern|Newtype pattern]]
- [[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]]
- [[Programmazione/Rust/Pagine/Derive traits|Derive traits]]
- [[Programmazione/Rust/Pagine/PhantomData|PhantomData]]

