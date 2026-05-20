---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags: [programmazione, rust, mutabilita, borrowing]
aliases:
  - "Mutability Rust"
  - "mut"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Variabili mutabilita e shadowing]]"
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
related:
  - "[[Programmazione/Rust/Pagine/Interior mutability]]"
  - "[[Programmazione/Rust/Pagine/Cell T]]"
  - "[[Programmazione/Rust/Pagine/RefCell T]]"
---

# Mutabilita

## Sintesi

In Rust le variabili sono immutabili per default. Per modificare un valore tramite un binding serve `mut`. Per modificare un valore tramite riferimento serve `&mut T`. Questa scelta rende espliciti i punti del programma dove lo stato puo cambiare.

Mutabilita non significa ownership: puoi possedere un valore immutabile, possedere un valore mutabile, oppure prendere in prestito un valore in modo mutabile.

## Quando usarlo

- Usa `mut` quando un binding deve cambiare valore o quando il valore deve essere modificato.
- Usa `&mut T` quando una funzione deve modificare un valore del chiamante.
- Preferisci immutabilita quando il valore non deve cambiare.
- Usa interior mutability solo quando le regole normali non modellano bene il caso d'uso.

## Come funziona

Binding mutabile:

```rust
let mut contatore = 0;
contatore += 1;
```

Riferimento mutabile:

```rust
fn incrementa(n: &mut i32) {
    *n += 1;
}

let mut valore = 10;
incrementa(&mut valore);
```

Per ottenere un `&mut T`, anche il binding originale deve essere mutabile.

## API / Sintassi

```rust
let x = 1;
// x = 2; // errore

let mut y = 1;
y = 2;
```

Mutabilita dei campi:

```rust
struct Config {
    debug: bool,
}

let mut config = Config { debug: false };
config.debug = true;
```

In Rust non si marca un singolo campo come mutabile: la mutabilita dipende dal binding e dal tipo di accesso.

## Esempio pratico

```rust
fn normalizza_tag(tag: &mut String) {
    *tag = tag.trim().to_lowercase();
}

fn main() {
    let mut tag = String::from("  RUST  ");
    normalizza_tag(&mut tag);
    println!("{tag}");
}
```

La funzione non prende ownership della `String`, ma riceve permesso esclusivo di modificarla per la durata della chiamata.

## Varianti

- Binding immutabile: `let x = ...`.
- Binding mutabile: `let mut x = ...`.
- Riferimento immutabile: `&T`.
- Riferimento mutabile: `&mut T`.
- Interior mutability: tipi come `Cell<T>`, `RefCell<T>`, `Mutex<T>` permettono modifica tramite riferimento condiviso con regole specifiche.

## Errori comuni

- Aggiungere `mut` a un parametro pensando di modificare il valore del chiamante.
- Confondere `mut parametro: T` con `parametro: &mut T`.
- Tenere un borrow mutabile attivo troppo a lungo.
- Usare `RefCell<T>` o `Mutex<T>` quando basta ristrutturare il codice.
- Rendere mutabili variabili che non cambiano, riducendo chiarezza.

## Checklist

- Il valore deve davvero cambiare?
- La modifica deve essere visibile al chiamante? Usa `&mut T`.
- Il parametro e posseduto dalla funzione? `mut parametro: T` modifica solo la copia/move locale.
- Esistono riferimenti immutabili ancora attivi?
- L'interior mutability e una necessita del modello o una scorciatoia?

## Collegamenti

- [[Programmazione/Rust/Pagine/Variabili mutabilita e shadowing|Variabili mutabilita e shadowing]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]]
- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]
- [[Programmazione/Rust/Pagine/RefCell T|RefCell T]]

