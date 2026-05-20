---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags: [programmazione, rust, slices, borrowing]
aliases:
  - "Slice Rust"
  - "&[T]"
  - "string slice"
prerequisites:
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
  - "[[Programmazione/Rust/Pagine/Tipi di dato primitivi]]"
related:
  - "[[Programmazione/Rust/Pagine/Stringhe String e &str]]"
  - "[[Programmazione/Rust/Pagine/Vec]]"
  - "[[Programmazione/Rust/Pagine/Borrow checker]]"
---

# Slices

## Sintesi

Una slice e un riferimento a una porzione contigua di dati. Non possiede gli elementi: li prende in prestito. Le forme piu comuni sono `&[T]` per sequenze generiche e `&str` per testo UTF-8.

Le slice sono fondamentali per scrivere API flessibili, perche permettono di accettare array, `Vec<T>`, `String`, string literal e porzioni senza imporre ownership.

## Quando usarlo

- Quando una funzione deve leggere una sequenza senza modificarla.
- Quando si vuole accettare sia `Vec<T>` sia array.
- Quando si vuole lavorare su una parte di una collection.
- Quando una funzione non deve prendere ownership dei dati.

## Come funziona

Una slice contiene:

- un puntatore al primo elemento;
- una lunghezza.

Non contiene capacita e non puo riallocare. Per questo una slice e diversa da `Vec<T>`: `Vec<T>` possiede il buffer, mentre `&[T]` lo osserva.

```rust
let numeri = vec![10, 20, 30, 40];
let parte = &numeri[1..3];

println!("{parte:?}"); // [20, 30]
```

L'intervallo `1..3` include l'indice 1 ed esclude l'indice 3.

## API / Sintassi

```rust
let array = [1, 2, 3, 4];
let tutti: &[i32] = &array;
let primi_due: &[i32] = &array[..2];
let ultimi: &[i32] = &array[2..];
```

Slice mutabile:

```rust
let mut numeri = [3, 1, 2];
let s: &mut [i32] = &mut numeri[..];
s.sort();
```

String slice:

```rust
let testo = String::from("rust");
let parte: &str = &testo[0..2];
```

Con `str`, gli indici devono cadere su boundary UTF-8 validi.

## Esempio pratico

```rust
fn media(valori: &[f64]) -> Option<f64> {
    if valori.is_empty() {
        return None;
    }

    let somma: f64 = valori.iter().sum();
    Some(somma / valori.len() as f64)
}

fn main() {
    let array = [10.0, 20.0, 30.0];
    let vec = vec![2.0, 4.0, 6.0];

    println!("{:?}", media(&array));
    println!("{:?}", media(&vec));
    println!("{:?}", media(&vec[1..]));
}
```

La funzione accetta qualsiasi sequenza leggibile come slice.

## Varianti

- `&[T]`: slice immutabile.
- `&mut [T]`: slice mutabile.
- `&str`: slice di testo UTF-8.
- `&[u8]`: slice di byte, comune in I/O e parsing.
- Range `a..b`, `..b`, `a..`, `..` per selezionare porzioni.

## Errori comuni

- Usare `&Vec<T>` nelle API quando basta `&[T]`.
- Tagliare una `String` usando indici non allineati a caratteri UTF-8.
- Confondere `&str` con `String`: `&str` non possiede il testo.
- Accedere a una slice con un indice fuori range causando panic.

## Checklist

- La funzione deve solo leggere elementi? Preferisci `&[T]`.
- Deve modificare elementi senza cambiare lunghezza? Usa `&mut [T]`.
- Deve aggiungere o rimuovere elementi? Serve `Vec<T>` o `&mut Vec<T>`.
- Stai usando indici su testo UTF-8? Verifica i boundary.
- La slice deve vivere meno del contenitore da cui deriva?

## Collegamenti

- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Stringhe String e &str|Stringhe String e &str]]
- [[Programmazione/Rust/Pagine/Vec|Vec]]
- [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]]

