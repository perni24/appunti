---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags: [programmazione, rust, ownership, copy, clone]
aliases:
  - "Trait Copy"
  - "Trait Clone"
  - "Copy vs Clone"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Move semantics]]"
related:
  - "[[Programmazione/Rust/Pagine/Derive traits]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
---

# Copy e Clone

## Sintesi

`Copy` e `Clone` sono trait che definiscono come duplicare un valore. `Copy` indica una copia implicita, economica e bitwise. `Clone` indica una duplicazione esplicita, che puo essere costosa e puo allocare memoria.

Capire la differenza evita errori di ownership e aiuta a non introdurre copie inutili.

## Quando usarlo

- Usa `Copy` per tipi piccoli, semplici e senza ownership di risorse esterne.
- Usa `Clone` quando serve duplicare esplicitamente un valore posseduto.
- Usa `#[derive(Clone)]` o `#[derive(Copy, Clone)]` su struct semplici quando tutti i campi lo permettono.
- Evita `clone` come soluzione automatica agli errori del borrow checker.

## Come funziona

I tipi `Copy` non vengono mossi: vengono copiati.

```rust
let a = 10;
let b = a;

println!("{a} {b}");
```

`i32` implementa `Copy`, quindi `a` resta valido.

Con `String`, invece, l'assegnazione e un move:

```rust
let a = String::from("rust");
let b = a;

// println!("{a}"); // errore
println!("{b}");
```

Per duplicare una `String` serve `clone`:

```rust
let a = String::from("rust");
let b = a.clone();

println!("{a} {b}");
```

## API / Sintassi

```rust
#[derive(Debug, Copy, Clone)]
struct Punto {
    x: i32,
    y: i32,
}

let p1 = Punto { x: 1, y: 2 };
let p2 = p1;

println!("{p1:?} {p2:?}");
```

Una struct puo essere `Copy` solo se tutti i suoi campi sono `Copy`.

```rust
#[derive(Clone)]
struct Documento {
    titolo: String,
}
```

`Documento` puo essere `Clone`, ma non `Copy`, perche `String` possiede memoria sullo heap.

## Esempio pratico

```rust
#[derive(Debug, Copy, Clone)]
struct Coordinate {
    riga: usize,
    colonna: usize,
}

fn evidenzia(pos: Coordinate) {
    println!("{}:{}", pos.riga, pos.colonna);
}

fn main() {
    let pos = Coordinate { riga: 3, colonna: 12 };

    evidenzia(pos);
    evidenzia(pos);
}
```

`Coordinate` e piccolo e non possiede risorse: `Copy` rende naturale passarlo per valore.

## Varianti

- `Copy`: duplicazione implicita, nessun metodo chiamato.
- `Clone`: duplicazione esplicita tramite `.clone()`.
- `clone_from`: puo riutilizzare allocazioni esistenti quando implementato.
- `to_owned`: spesso usato per ottenere un valore posseduto da un riferimento, per esempio da `&str` a `String`.

## Errori comuni

- Implementare `Copy` su tipi che concettualmente possiedono una risorsa unica.
- Chiamare `.clone()` su valori grandi dentro loop caldi senza misurare.
- Pensare che `Clone` sia sempre una copia superficiale: dipende dall'implementazione.
- Dimenticare che `Copy` richiede anche `Clone`.

## Checklist

- Il tipo possiede memoria, file descriptor, lock o altre risorse? Non dovrebbe essere `Copy`.
- La duplicazione e economica e ovvia? `Copy` puo andare bene.
- La duplicazione puo allocare o avere costo visibile? Usa `Clone`.
- Il clone e davvero necessario o puoi prendere in prestito con `&T`?
- Tutti i campi della struct supportano il trait che vuoi derivare?

## Collegamenti

- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/Move semantics|Move semantics]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Derive traits|Derive traits]]

