---
date: 2026-05-21
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - astrazione-e-generici
aliases:
  - Bound di trait
  - Vincoli generici Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Generics]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch]]"
  - "[[Programmazione/Rust/Pagine/Associated types]]"
  - "[[Programmazione/Rust/Pagine/From Into TryFrom e TryInto]]"
title: Trait bounds
---

# Trait bounds

## Sintesi

Un bound esprime un requisito statico: con `T: Display` il corpo puo usare la formattazione `{}`; con `T: Clone` puo richiedere un clone. Il chiamante deve fornire un tipo che soddisfa i requisiti.

I bound non convertono valori, non validano dati a runtime e non producono automaticamente implementazioni. Dichiarali dove servono, senza richiedere capacita che il corpo non usa.

## Quando usarlo

- Usare metodi o operatori su tipi generici.
- Collegare tipi di input, output o elementi di un iteratore.
- Rendere disponibili solo alcuni metodi di un contenitore.
- Documentare i requisiti minimi di una API riusabile.

Non chiedere `Clone` per compensare automaticamente un errore di ownership. Prima verifica se il problema richiede davvero una copia, un move o un prestito.

## Come funziona

### Bound inline e where

Tutti i blocchi sono programmi autonomi, tranne il controesempio dichiarato. Baseline: Rust 1.99.1, edition 2024, standard library.

```rust
use std::fmt::Debug;

fn clone_inline<T: Debug + Clone>(value: &T) -> T {
    println!("{value:?}");
    value.clone()
}

fn clone_where<T>(value: &T) -> T
where
    T: Debug + Clone,
{
    println!("{value:?}");
    value.clone()
}

fn main() {
    let value = String::from("api");
    assert_eq!(clone_inline(&value), "api");
    assert_eq!(clone_where(&value), "api");
    assert_eq!(value, "api");
}
```

I due esempi hanno lo stesso contratto e lo stesso comportamento. `+` richiede **tutti** i trait, non uno a scelta. `Debug` serve alla stampa e `Clone` al valore restituito; senza stampa basterebbe `Clone`.

`where` cambia la disposizione, non la forza del vincolo. Puo esprimere anche requisiti su tipi associati. Dichiarare `E: Error` in una funzione che restituisce sempre `Ok(())` complica soltanto l'inferenza dell'errore senza offrire un comportamento utile.

### impl Trait nei parametri

```rust
use std::fmt::Display;

fn render<T: Display>(value: &T) -> String {
    format!("{value}")
}

fn render_anon(value: &impl Display) -> String {
    format!("{value}")
}

fn two_types(left: &impl Display, right: &impl Display) -> String {
    format!("{left}:{right}")
}

fn same_type<T: Display>(left: &T, right: &T) -> String {
    format!("{left}:{right}")
}

fn main() {
    assert_eq!(render::<u32>(&7), render_anon(&7_u32));
    assert_eq!(two_types(&7_u32, &"api"), "7:api");
    assert_eq!(same_type(&7_u32, &9_u32), "7:9");
}
```

`impl Display` in posizione di parametro e un generico anonimo. Le prime due funzioni hanno un uso simile, **non sono sostituibili in ogni API**: `render::<u32>` e valido, `render_anon::<u32>` no.

Due parametri `impl Display` sono indipendenti; un solo `T` condiviso lega i tipi. Nessuna delle forme introduce da sola `dyn Display`.

## API / Sintassi

### Bound solo sul metodo che ne ha bisogno

```rust
use std::fmt::Display;

struct Slot<T> {
    value: T,
}

impl<T> Slot<T> {
    fn new(value: T) -> Self {
        Self { value }
    }

    fn into_inner(self) -> T {
        self.value
    }
}

impl<T: Display> Slot<T> {
    fn render(&self) -> String {
        self.value.to_string()
    }
}

fn main() {
    let number = Slot::new(42);
    assert_eq!(number.render(), "42");

    let bytes = Slot::new(vec![1_u8, 2]);
    assert_eq!(bytes.into_inner(), [1, 2]);
}
```

Un `Slot<Vec<u8>>` e valido anche se `Vec<u8>` non implementa `Display`: non avra quel metodo `render`. Mettere `T: Display` sulla struct restringerebbe inutilmente l'intero tipo. Se un bound e invece necessario alla definizione dei campi, va dichiarato anche sul tipo.

### Rilassare Sized attraverso un riferimento

```rust
use std::fmt::Display;

fn render<T: Display + ?Sized>(value: &T) -> String {
    format!("{value}")
}

fn main() {
    let owned = String::from("api");
    assert_eq!(render(&owned), "api");
    assert_eq!(render::<str>("api"), "api");

    let number = 42;
    let erased: &dyn Display = &number;
    assert_eq!(render(erased), "42");
}
```

I parametri di tipo hanno normalmente il bound implicito `Sized`. `?Sized` lo rilassa: accetta tipi sized **e** unsized, non richiede un tipo unsized. `str` e `dyn Display` sono unsized; i riferimenti usati qui sono sized.

Non significa `Display` facoltativo: il bound rimane obbligatorio. Non autorizza a passare un `str` per valore. Il `Self` implicito di un trait e un'eccezione al default `Sized`.

### Vincolo sul tipo di elemento

```rust
use std::fmt::Display;

fn render_items<I>(items: I) -> Vec<String>
where
    I: IntoIterator,
    I::Item: Display,
{
    items.into_iter().map(|item| item.to_string()).collect()
}

fn main() {
    let numbers = [1_u8, 2, 3];
    assert_eq!(render_items(&numbers), ["1", "2", "3"]);
    assert_eq!(numbers, [1, 2, 3]);

    let names = vec![String::from("api")];
    assert_eq!(render_items(names), ["api"]);
}
```

Il bound `Display` e su `I::Item`, non sul contenitore. Una forma come `I: Iterator<Item = String>` impone invece un'uguaglianza precisa del tipo associato.

`items` e ricevuto per valore: con `&numbers` si passa un riferimento, con `names` si sposta il vettore. Il bound non decide da solo la ownership.

## Esempio pratico

### Unire valori mostrabili

```rust
use std::fmt::Display;

fn join_display<T: Display>(items: &[T], separator: &str) -> String {
    items
        .iter()
        .map(|item| item.to_string())
        .collect::<Vec<_>>()
        .join(separator)
}

fn main() {
    assert_eq!(join_display(&[10, 20, 30], ", "), "10, 20, 30");
    assert_eq!(join_display::<i32>(&[], ", "), "");
    assert_eq!(join_display(&[10], ", "), "10");
    assert_eq!(join_display(&["a", "b"], ""), "ab");
}
```

Non richiede `Clone` sui valori: formatta tramite un prestito. Mantiene l'ordine, non aggiunge separatori iniziali/finali, produce una stringa vuota per input vuoto.

La variante e semplice ma crea stringhe intermedie e un `Vec`. Per input grandi valuta una scrittura incrementale con `std::fmt::Write` e misura le differenze. La lunghezza dell'output non e limitata; `Display` non garantisce una rappresentazione priva di perdita, parsabile, escapata o adatta a CSV/SQL/HTML. Un formatter personalizzato puo anche fare panic.

## Varianti

### impl Trait nel risultato

```rust
use std::fmt::Display;

fn make_label(success: bool) -> impl Display {
    if success {
        String::from("ready")
    } else {
        String::from("pending")
    }
}

fn main() {
    assert_eq!(make_label(true).to_string(), "ready");
    assert_eq!(make_label(false).to_string(), "pending");
}
```

Qui il tipo concreto e scelto dalla funzione, non dal chiamante. Entrambi i rami restituiscono `String`: non basta che tipi differenti implementino entrambi `Display`. Non c'e boxing implicito.

- `T: 'a` riguarda i riferimenti contenuti nel tipo, non il tempo per cui il valore deve essere conservato.
- `T: 'static` non rende immortale un valore: una `String` owned puo soddisfarlo ed essere distrutta subito.
- `for<'a>` esprime un requisito per ogni lifetime appropriato; vedi [[Programmazione/Rust/Pagine/Higher-Ranked Trait Bounds (HRTB)|Higher-Ranked Trait Bounds]].
- Un supertrait aggiunge requisiti a `Self`; non genera impl mancanti.

## Errori comuni

### Bound assente anche se la chiamata usa un tipo valido

Questo programma **non compila**: `u32` implementa `Display`, ma il corpo e dichiarato per un `T` senza quel requisito.

```rust
fn render<T>(value: &T) -> String {
    format!("{value}")
}

fn main() {
    assert_eq!(render(&7_u32), "7");
}
```

La correzione e dichiarare `T: std::fmt::Display`, non aggiungere cast alla chiamata.

- Considerare equivalenti funzioni che clonano, spostano o scartano valori.
- Aggiungere `Clone`, `Default` o un errore generico che il corpo non usa.
- Confondere bound con controlli runtime su input non fidati.
- Usare `dyn Trait` come sinonimo di `impl Trait`.
- Assumere che `?Sized` disattivi tutti i controlli sulla dimensione.

## Checklist

- Ogni bound e necessario al corpo o al contratto?
- Tipo preso per valore o tramite riferimento?
- I parametri devono essere indipendenti oppure condividere un tipo?
- Il requisito e su `T` o sul suo associated type?
- Sono dichiarati costi e limiti dell'output?

## Collegamenti

- [[Programmazione/Rust/Pagine/Generics|Generics]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Associated types|Associated types]]
- [[Programmazione/Rust/Pagine/Higher-Ranked Trait Bounds (HRTB)|Higher-Ranked Trait Bounds (HRTB)]]
- [[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch|Static dispatch vs dynamic dispatch]]
- [[Programmazione/Rust/Pagine/From Into TryFrom e TryInto|From, Into, TryFrom e TryInto]]

## Fonti

- [Rust Reference: trait e lifetime bounds](https://doc.rust-lang.org/reference/trait-bounds.html).
- [Rust Reference: impl Trait nei parametri e nel risultato](https://doc.rust-lang.org/reference/types/impl-trait.html).
- [Sized e ?Sized](https://doc.rust-lang.org/std/marker/trait.Sized.html).
- [Display: limiti della rappresentazione testuale](https://doc.rust-lang.org/std/fmt/trait.Display.html).
- [std::fmt::Write per output incrementale](https://doc.rust-lang.org/std/fmt/trait.Write.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
