---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [programmazione, rust, ownership, borrowing, references]
aliases:
  - "Riferimenti Rust"
  - "Borrowing in Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Mutabilita]]"
related:
  - "[[Programmazione/Rust/Pagine/Borrow checker]]"
  - "[[Programmazione/Rust/Pagine/Lifetime impliciti]]"
  - "[[Programmazione/Rust/Pagine/Slices]]"
---

# References e Borrowing

## Sintesi

Un riferimento permette di usare un valore senza prenderne ownership. Il borrowing e il prestito temporaneo di un valore tramite `&T` o `&mut T`. Rust controlla questi prestiti a compile time per impedire data race, riferimenti pendenti e modifiche non coordinate.

## Quando usarlo

- Usa `&T` quando una funzione deve leggere un valore senza consumarlo.
- Usa `&mut T` quando una funzione deve modificare un valore senza diventarne proprietaria.
- Usa riferimenti per evitare copie e `clone` non necessari.
- Usa `&str` e slice per accettare dati senza imporre un tipo posseduto.

## Come funziona

Un riferimento immutabile consente lettura:

```rust
fn lunghezza(s: &String) -> usize {
    s.len()
}
```

Un riferimento mutabile consente modifica:

```rust
fn aggiungi(s: &mut String) {
    s.push_str("!");
}
```

Le regole principali sono:

- Puoi avere molti riferimenti immutabili contemporanei.
- Puoi avere un solo riferimento mutabile alla volta.
- Non puoi avere riferimenti immutabili e mutabili attivi nello stesso momento sullo stesso valore.
- Un riferimento non puo vivere piu a lungo del valore referenziato.

## API / Sintassi

```rust
let mut testo = String::from("ciao");

let r1 = &testo;
let r2 = &testo;
println!("{r1} {r2}");

let r3 = &mut testo;
r3.push_str("!");
println!("{r3}");
```

Con non-lexical lifetimes, il compilatore considera finito un borrow dopo l'ultimo uso effettivo, non necessariamente alla fine del blocco.

## Esempio pratico

```rust
fn normalizza(nome: &mut String) {
    let pulito = nome.trim().to_lowercase();
    nome.clear();
    nome.push_str(&pulito);
}

fn stampa(nome: &str) {
    println!("utente: {nome}");
}

fn main() {
    let mut nome = String::from("  LUCA  ");

    normalizza(&mut nome);
    stampa(&nome);
}
```

`normalizza` modifica la `String` in prestito mutabile. `stampa` accetta `&str`, quindi funziona con `String`, string literal e slice.

## Varianti

- `&T`: riferimento condiviso, lettura.
- `&mut T`: riferimento esclusivo, modifica.
- `&str`: riferimento a una sequenza UTF-8.
- `&[T]`: riferimento a una sequenza di elementi.
- Reborrow: creare un prestito temporaneo a partire da un riferimento gia esistente.

## Errori comuni

- Tenere un riferimento immutabile attivo e poi provare a creare un `&mut`.
- Restituire un riferimento a una variabile locale.
- Usare `&String` quando `&str` sarebbe piu flessibile.
- Usare `&Vec<T>` quando `&[T]` sarebbe piu generale.
- Confondere il riferimento con ownership: un riferimento non possiede il valore.

## Checklist

- La funzione deve leggere soltanto? Usa `&T` o una slice.
- Deve modificare? Usa `&mut T`.
- Deve conservare il valore oltre la chiamata? Prendi ownership.
- Il riferimento puo sopravvivere al valore referenziato? Se si, il design e sbagliato.
- La firma e troppo specifica? Preferisci `&str` o `&[T]` quando possibile.

## Collegamenti

- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]]
- [[Programmazione/Rust/Pagine/Lifetime impliciti|Lifetime impliciti]]
- [[Programmazione/Rust/Pagine/Slices|Slices]]
- [[Programmazione/Rust/Pagine/Stringhe String e &str|Stringhe String e &str]]

