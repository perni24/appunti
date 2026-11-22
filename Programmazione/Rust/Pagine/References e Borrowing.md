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
  - ownership
  - borrowing
  - references
aliases:
  - Riferimenti Rust
  - Borrowing in Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Mutabilita]]"
related:
  - "[[Programmazione/Rust/Pagine/Borrow checker]]"
  - "[[Programmazione/Rust/Pagine/Lifetime impliciti]]"
  - "[[Programmazione/Rust/Pagine/Slices]]"
title: References e Borrowing
---

# References e Borrowing

## Sintesi

Un riferimento permette di usare un valore senza acquisire ownership del dato referenziato. `&T` offre accesso condiviso, `&mut T` accesso esclusivo: le regole valgono anche in un programma con un solo thread.

Il riferimento e a sua volta un valore, che puo essere passato o restituito, ma non mantiene automaticamente in vita il proprietario come un contatore di riferimenti. Esempi indipendenti per `src/main.rs`, baseline **Rust 1.99.1, edition 2024**.

## Quando usarlo

- Usa `&T` quando una funzione deve leggere un valore senza consumarlo.
- Usa `&mut T` quando una funzione deve modificare un valore senza diventarne proprietaria.
- Usa riferimenti per evitare copie e `clone` non necessari.
- Usa `&str` e slice per accettare dati senza imporre un tipo posseduto.

## Come funziona

Le regole principali per l'accesso ordinario sono:

- Piu prestiti condivisi possono leggere contemporaneamente gli stessi dati.
- Un prestito mutabile attivo richiede accesso esclusivo alla parte interessata: non basta che le operazioni avvengano in un solo thread.
- Il proprietario non puo muovere, distruggere o modificare in modo incompatibile dati che devono ancora essere usati attraverso un prestito.
- Il riferimento deve restare valido per tutti gli usi consentiti dal suo lifetime.

La regola non vieta due riferimenti mutabili a parti disgiunte quando il compilatore o un'API sicura ne garantisce la separazione. Inoltre `&T` non significa immutabilita profonda universale: tipi con interior mutability, come `Cell<T>`, permettono modifiche attraverso API controllate.

## API / Sintassi

### Lettura senza consumo

```rust
fn byte_len(text: &str) -> usize {
    text.len()
}

fn main() {
    let text = String::from("rust");
    assert_eq!(byte_len(&text), 4);
    assert_eq!(byte_len("ciao"), 4);
    assert_eq!(text, "rust");
}
```

`&str` accetta sia una `String` presa in prestito sia un letterale; `len()` conta byte UTF-8. `&String` serve quando il contratto richiede proprio quel contenitore, non per una semplice lettura del testo.

### Modifica tramite riferimento

```rust
fn append_marker(text: &mut String) {
    text.push('!');
}

fn main() {
    let mut text = String::from("ciao");
    append_marker(&mut text);
    assert_eq!(text, "ciao!");
}
```

Il parametro non prende ownership della `String`: il chiamante la riusa dopo la chiamata. L'operatore `*` dereferenzia un riferimento; per molti metodi Rust effettua automaticamente la dereferenziazione necessaria.

### Prestiti condivisi seguiti da esclusivo

```rust
fn main() {
    let mut text = String::from("ciao");
    let first = &text;
    let second = &text;
    assert_eq!(first, second);

    let exclusive = &mut text;
    exclusive.push('!');
    assert_eq!(exclusive, "ciao!");
}
```

Qui i riferimenti condivisi non servono piu dopo l'asserzione. I non-lexical lifetimes consentono al compilatore di terminare quei prestiti prima della fine del blocco. Aggiungere un uso di `first` dopo la modifica renderebbe il programma non valido: conta il flusso degli usi, non soltanto la posizione della dichiarazione.

## Esempio pratico

### Preparare un nome visualizzato

```rust
fn normalize_name(name: &mut String) {
    let cleaned = name.trim().to_lowercase();
    name.clear();
    name.push_str(&cleaned);
}

fn print_name(name: &str) {
    println!("utente: {name}");
}

fn main() {
    let mut name = String::from("  LUCA  ");
    normalize_name(&mut name);
    assert_eq!(name, "luca");
    print_name(&name);
}
```

`trim()` restituisce una vista, ma `to_lowercase()` crea una nuova `String`: `cleaned` non prende piu in prestito `name`, che puo essere svuotata e modificata. La procedura non e priva di allocazioni e non e una politica completa per identificativi: non garantisce unicita, sicurezza o normalizzazione Unicode NFC; non rimuove gli spazi interni.

## Varianti

- `&T`: riferimento condiviso, lettura.
- `&mut T`: riferimento esclusivo, modifica.
- `&str`: riferimento a una sequenza UTF-8.
- `&[T]`: riferimento a una sequenza di elementi.
- Reborrow: creare un prestito temporaneo a partire da un riferimento gia esistente.

### Mutabilita del binding e del dato

```rust
fn main() {
    let first = 1;
    let second = 2;
    let mut selected = &first;
    assert_eq!(*selected, 1);
    selected = &second;
    assert_eq!(*selected, 2);

    let mut value = 10;
    let reference = &mut value;
    *reference += 1;
    assert_eq!(value, 11);
}
```

`mut selected` permette di cambiare il riferimento contenuto nel binding, non di scrivere attraverso `&i32`. Il binding `reference` non e `mut`, ma contiene un `&mut i32`: puo modificare il dato referenziato. La lettura finale di `value` avviene dopo l'ultimo uso di quel prestito.

### Reborrow temporaneo

```rust
fn main() {
    let mut value = 1;
    let reference = &mut value;
    {
        let shorter = &mut *reference;
        *shorter += 2;
    }
    *reference += 3;
    assert_eq!(*reference, 6);
}
```

Non sono due accessi esclusivi indipendenti: finche `shorter` deve essere usato, `reference` non puo essere usato in conflitto con esso. Alla fine del reborrow torna utilizzabile. Chiamare funzioni con parametri `&mut T` puo creare reborrow impliciti; `&mut T` non diventa per questo `Copy`.

### Restituire un riferimento al chiamante

```rust
fn first_value(values: &[i32]) -> Option<&i32> {
    values.first()
}

fn main() {
    let values = vec![10, 20];
    assert_eq!(first_value(&values), Some(&10));
    assert_eq!(first_value(&[]), None);
}
```

Il riferimento restituito proviene dall'input, non da una variabile locale della funzione. Le regole di elisione collegano il lifetime di uscita a quello dell'unico input preso in prestito; non allungano la vita dei dati. Per contratti con piu input vedi [[Programmazione/Rust/Pagine/Lifetime impliciti|Lifetime impliciti]].

## Errori comuni

- Tenere un riferimento immutabile attivo e poi provare a creare un `&mut`.
- Restituire un riferimento a una variabile locale.
- Usare `&String` quando `&str` sarebbe piu flessibile.
- Usare `&Vec<T>` quando `&[T]` sarebbe piu generale.
- Confondere il riferimento con ownership: un riferimento non possiede il valore.

## Checklist

- La funzione deve leggere soltanto? Usa `&T` o una slice.
- Deve modificare? Usa `&mut T`.
- Deve conservare il dato oltre la chiamata? Valuta ownership oppure un riferimento con un lifetime compatibile; la sola conservazione non impone automaticamente una copia.
- Il riferimento puo sopravvivere al valore referenziato? Se si, il design e sbagliato.
- La firma e troppo specifica? Preferisci `&str` o `&[T]` quando possibile.
- Hai distinto fine del prestito, fine dello scope del binding e distruzione della risorsa?

## Collegamenti

- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]]
- [[Programmazione/Rust/Pagine/Lifetime impliciti|Lifetime impliciti]]
- [[Programmazione/Rust/Pagine/Slices|Slices]]
- [[Programmazione/Rust/Pagine/Stringhe String e &str|Stringhe String e &str]]
- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]

## Fonti

- [Rust Book: References and Borrowing](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html).
- [Rust Reference: tipi riferimento](https://doc.rust-lang.org/reference/types/pointer.html).
- [Rust Reference: lifetime elision](https://doc.rust-lang.org/reference/lifetime-elision.html).
- [Standard library: trim e to_lowercase](https://doc.rust-lang.org/std/primitive.str.html).
- [Standard library: interior mutability](https://doc.rust-lang.org/std/cell/index.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
