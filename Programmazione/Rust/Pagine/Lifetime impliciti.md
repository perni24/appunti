---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags: [programmazione, rust, lifetimes, borrowing]
aliases:
  - "Lifetimes impliciti"
  - "Lifetime elision base"
prerequisites:
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
  - "[[Programmazione/Rust/Pagine/Borrow checker]]"
related:
  - "[[Programmazione/Rust/Pagine/Lifetime annotations]]"
  - "[[Programmazione/Rust/Pagine/Lifetime elision]]"
  - "[[Programmazione/Rust/Pagine/Lifetimes nelle struct]]"
---

# Lifetime impliciti

## Sintesi

I lifetime descrivono per quanto tempo un riferimento e valido. In molti casi Rust li deduce automaticamente: questi sono i lifetime impliciti. Il compilatore non "allunga" la vita dei dati, ma verifica che ogni riferimento non sopravviva al valore a cui punta.

I lifetime diventano visibili solo quando la relazione tra input e output non puo essere dedotta in modo univoco.

## Quando usarlo

- Quando una funzione prende riferimenti e restituisce un riferimento.
- Quando si leggono errori del borrow checker relativi alla durata dei riferimenti.
- Quando si vuole capire perche una firma non richiede annotazioni esplicite.
- Quando si prepara lo studio dei lifetime espliciti e delle struct con riferimenti.

## Come funziona

Questa funzione non richiede annotazioni:

```rust
fn primo(s: &str) -> &str {
    &s[..1]
}
```

Il compilatore capisce che il riferimento restituito deriva dal parametro `s`.

Con piu input, la relazione puo diventare ambigua:

```rust
// fn piu_lunga(a: &str, b: &str) -> &str {
//     if a.len() > b.len() { a } else { b }
// }
```

Qui Rust non puo sapere quale lifetime assegnare all'output senza annotazioni esplicite.

## API / Sintassi

Lifetime implicito in input:

```rust
fn lunghezza(s: &str) -> usize {
    s.len()
}
```

Lifetime implicito in metodo:

```rust
struct Buffer {
    testo: String,
}

impl Buffer {
    fn as_str(&self) -> &str {
        &self.testo
    }
}
```

Nei metodi, se c'e `&self` o `&mut self`, Rust assume spesso che il riferimento restituito sia legato a `self`.

## Esempio pratico

```rust
fn prima_parola(testo: &str) -> &str {
    match testo.split_whitespace().next() {
        Some(parola) => parola,
        None => "",
    }
}

fn main() {
    let frase = String::from("rust ownership");
    let parola = prima_parola(&frase);

    println!("{parola}");
}
```

`parola` e valido finche `frase` resta valida. La funzione non restituisce una nuova stringa: restituisce una vista dentro l'input.

## Varianti

- Lifetime impliciti: dedotti dal compilatore.
- Lifetime espliciti: scritti come `'a` quando serve chiarire relazioni.
- Lifetime `'static`: riferimento valido per tutta la durata del programma, comune nei literal.
- Lifetime in struct: necessari quando una struct contiene riferimenti.

## Errori comuni

- Pensare che un lifetime estenda la vita di un valore.
- Restituire riferimenti a variabili locali create dentro la funzione.
- Confondere lifetime con scope sintattico: i non-lexical lifetimes ragionano sull'ultimo uso.
- Usare annotazioni lifetime a caso per "soddisfare" il compilatore.
- Restituire `&str` quando il testo viene costruito localmente e dovrebbe essere `String`.

## Checklist

- Il riferimento restituito deriva da un input o da un valore locale?
- Se ci sono piu input, il compilatore puo capire quale input e collegato all'output?
- Il valore referenziato vive abbastanza a lungo?
- Una `String` posseduta sarebbe piu corretta di un riferimento?
- La firma comunica chiaramente la relazione tra dati presi in prestito e dati restituiti?

## Collegamenti

- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]]
- [[Programmazione/Rust/Pagine/Lifetime annotations|Lifetime annotations]]
- [[Programmazione/Rust/Pagine/Lifetime elision|Lifetime elision]]
- [[Programmazione/Rust/Pagine/Lifetimes nelle struct|Lifetimes nelle struct]]

