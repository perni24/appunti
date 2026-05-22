---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - lifetimes
aliases:
  - "Struct con lifetime"
  - "Riferimenti nelle struct"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Structs]]"
  - "[[Programmazione/Rust/Pagine/Lifetime annotations]]"
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
related:
  - "[[Programmazione/Rust/Pagine/Lifetimes nei trait]]"
  - "[[Programmazione/Rust/Pagine/Lifetimes avanzati]]"
  - "[[Programmazione/Rust/Pagine/Ownership]]"
---

# Lifetimes nelle struct

## Sintesi

Una struct puo contenere riferimenti, ma in quel caso deve dichiarare lifetime espliciti. Il lifetime dice che la struct non puo vivere piu a lungo dei dati a cui i suoi riferimenti puntano.

Spesso una struct con riferimenti rappresenta una vista temporanea, non ownership dei dati.

## Quando usarlo

- Quando vuoi evitare copie o allocazioni creando viste su dati esistenti.
- Quando una struct deve contenere slice, `&str` o riferimenti a valori esterni.
- Quando il dato sorgente vive chiaramente piu a lungo della struct.
- Quando vuoi modellare parsing, tokenizzazione, viste o wrapper temporanei.

## Come funziona

```rust
struct Excerpt<'a> {
    text: &'a str,
}
```

`Excerpt<'a>` puo esistere solo finche il testo referenziato resta valido.

```rust
let source = String::from("Rust lifetimes");
let view = Excerpt { text: &source };

println!("{}", view.text);
```

Se `source` venisse distrutto prima di `view`, il compilatore rifiuterebbe il codice.

## API / Sintassi

Struct con piu riferimenti:

```rust
struct PairView<'a> {
    left: &'a str,
    right: &'a str,
}
```

Lifetime diversi:

```rust
struct MixedView<'a, 'b> {
    title: &'a str,
    body: &'b str,
}
```

Impl:

```rust
impl<'a> Excerpt<'a> {
    fn len(&self) -> usize {
        self.text.len()
    }

    fn as_str(&self) -> &'a str {
        self.text
    }
}
```

## Esempio pratico

```rust
struct Token<'a> {
    kind: &'static str,
    text: &'a str,
}

fn first_word(input: &str) -> Option<Token<'_>> {
    let word = input.split_whitespace().next()?;
    Some(Token {
        kind: "word",
        text: word,
    })
}
```

`Token` non possiede il testo: conserva una vista dentro `input`.

## Varianti

- Struct borrowed: contiene `&'a T`.
- Struct owned: contiene `String`, `Vec<T>` o altri valori posseduti.
- Struct mista: alcuni campi owned, altri borrowed.
- Lifetime multipli: campi che dipendono da sorgenti diverse.
- `Cow<'a, str>`: puo contenere dato borrowed o owned.

## Errori comuni

- Usare struct con riferimenti quando ownership sarebbe piu semplice.
- Provare a restituire una struct che contiene riferimenti a variabili locali.
- Dare lo stesso lifetime a campi che potrebbero avere durate diverse.
- Pensare che la struct possieda i dati referenziati.
- Complicare il modello dati con lifetime quando bastano `String` o `Arc<T>`.

## Checklist

- La struct e una vista o deve possedere i dati?
- I dati referenziati vivono piu a lungo della struct?
- Serve un solo lifetime o lifetime separati?
- Un tipo owned semplificherebbe la API?
- Il lifetime nel nome della struct rende il modello piu chiaro?

## Collegamenti

- [[Programmazione/Rust/Pagine/Lifetime annotations|Lifetime annotations]]
- [[Programmazione/Rust/Pagine/Lifetime elision|Lifetime elision]]
- [[Programmazione/Rust/Pagine/Structs|Structs]]
- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/Lifetimes avanzati|Lifetimes avanzati]]
