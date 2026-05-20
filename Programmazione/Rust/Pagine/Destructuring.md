---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags: [programmazione, rust, destructuring, pattern]
aliases:
  - "Destrutturazione Rust"
  - "Destructuring in Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Pattern Matching]]"
  - "[[Programmazione/Rust/Pagine/Structs]]"
related:
  - "[[Programmazione/Rust/Pagine/Enums]]"
  - "[[Programmazione/Rust/Pagine/Tuple structs]]"
  - "[[Programmazione/Rust/Pagine/Pattern matching avanzato]]"
---

# Destructuring

## Sintesi

Il destructuring permette di estrarre parti di un valore usando pattern. In Rust funziona con tuple, array, slice, struct, tuple struct ed enum. Puo comparire in `let`, parametri di funzione, `match`, `if let`, `while let` e `for`.

E importante per scrivere codice leggibile quando il dato ha struttura chiara.

## Quando usarlo

- Quando vuoi estrarre campi da una struct.
- Quando vuoi separare valori dentro una tupla.
- Quando vuoi leggere dati contenuti in una variante enum.
- Quando vuoi ignorare parti non rilevanti con `_` o `..`.
- Quando vuoi rendere esplicita la forma attesa del dato.

## Come funziona

Tuple:

```rust
let punto = (3, 4);
let (x, y) = punto;
```

Struct:

```rust
struct Utente {
    id: u64,
    email: String,
}

let utente = Utente {
    id: 1,
    email: String::from("luca@example.com"),
};

let Utente { id, email } = utente;
```

Il destructuring puo muovere ownership dei campi. Se non vuoi muovere, usa riferimenti.

## API / Sintassi

```rust
let (a, b) = coppia;
let Struct { campo, altro } = valore;
let Struct { campo, .. } = valore;
let Enum::Variante(x) = valore else {
    return;
};
```

Destructuring nei parametri:

```rust
fn distanza_da_zero((x, y): (i32, i32)) -> i32 {
    x.abs() + y.abs()
}
```

## Esempio pratico

```rust
struct Richiesta {
    metodo: String,
    path: String,
    body: Option<String>,
}

fn gestisci(richiesta: Richiesta) {
    let Richiesta { metodo, path, body } = richiesta;

    match body {
        Some(contenuto) => println!("{metodo} {path}: {contenuto}"),
        None => println!("{metodo} {path}: body vuoto"),
    }
}
```

La destructuring rende evidente quali parti della richiesta vengono usate.

## Varianti

- Tuple destructuring: `let (a, b) = valore`.
- Struct destructuring: `let Nome { campo } = valore`.
- Enum destructuring: `match valore { Enum::V(x) => ... }`.
- Ignorare valori: `_`.
- Ignorare resto: `..`.
- Binding con `@`: assegna un nome al valore mentre controlla un pattern.

## Errori comuni

- Muovere un campo `String` e poi provare a usare ancora la struct intera.
- Usare `_` quando servirebbe mantenere il valore vivo con un nome.
- Usare `..` e ignorare campi importanti per la logica.
- Confondere destructuring irrefutabile in `let` con pattern refutabili.
- Scrivere pattern troppo complessi invece di estrarre passaggi intermedi.

## Checklist

- Il pattern puo fallire? Allora non usarlo in un `let` semplice.
- Vuoi muovere i campi o prenderli in prestito?
- I nomi estratti sono chiari?
- Stai ignorando campi intenzionalmente?
- Il pattern migliora la leggibilita o la peggiora?

## Collegamenti

- [[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]]
- [[Programmazione/Rust/Pagine/Structs|Structs]]
- [[Programmazione/Rust/Pagine/Enums|Enums]]
- [[Programmazione/Rust/Pagine/Tuple structs|Tuple structs]]
- [[Programmazione/Rust/Pagine/Pattern matching avanzato|Pattern matching avanzato]]

