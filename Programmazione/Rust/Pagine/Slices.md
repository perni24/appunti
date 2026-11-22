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
  - slices
  - borrowing
aliases:
  - Slice Rust
  - "&[T]"
  - string slice
prerequisites:
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
  - "[[Programmazione/Rust/Pagine/Tipi di dato primitivi]]"
related:
  - "[[Programmazione/Rust/Pagine/Stringhe String e &str]]"
  - "[[Programmazione/Rust/Pagine/Vec]]"
  - "[[Programmazione/Rust/Pagine/Borrow checker]]"
title: Slices
---

# Slices

## Sintesi

Il tipo slice `[T]` rappresenta una sequenza contigua di elementi con dimensione determinata a runtime. Si usa spesso tramite `&[T]` o `&mut [T]`, viste prese in prestito che non possiedono gli elementi. `str` e il tipo di testo UTF-8, normalmente preso in prestito con `&str`.

Queste firme rendono le API flessibili: `&[T]` puo ricevere viste di array e `Vec<T>`, `&str` di `String` e letterali. Non sono conversioni fra sequenze generiche e testo. Esempi indipendenti per `src/main.rs`, baseline **Rust 1.99.1, edition 2024**.

## Quando usarlo

- Quando una funzione deve leggere una sequenza senza modificarla.
- Quando si vuole accettare sia `Vec<T>` sia array.
- Quando si vuole lavorare su una parte di una collection.
- Quando una funzione non deve prendere ownership dei dati.

## Come funziona

Un riferimento a slice porta l'informazione necessaria per trovare gli elementi e conoscerne la lunghezza:

- un puntatore al primo elemento;
- una lunghezza, in elementi per `&[T]`, in byte per `&str`.

Non ha una capacita da aumentare o un'operazione `push`: creare una vista non copia gli elementi e non clona il contenitore. `Vec<T>` possiede il buffer; una vista non deve sopravvivere ai dati da cui deriva. Il tipo `[T]` e dinamicamente dimensionato, non e sinonimo di riferimento: esiste anche un contenitore posseduto come `Box<[T]>`.

### Porzione senza copia

```rust
fn main() {
    let values = vec![10, 20, 30, 40];
    let part = &values[1..3];
    assert_eq!(part, &[20, 30]);
    assert_eq!(part.len(), 2);
    assert_eq!(values.len(), 4);
}
```

`1..3` include l'indice 1 ed esclude il 3. Il contenitore resta proprietario di tutti gli elementi; non puo essere modificato in conflitto con una vista ancora in uso.

## API / Sintassi

### Intervalli e vista completa

```rust
fn main() {
    let array = [1, 2, 3, 4];
    let all: &[i32] = &array;
    let first_two = &array[..2];
    let last_two = &array[2..];
    assert_eq!(all, &[1, 2, 3, 4]);
    assert_eq!(first_two, &[1, 2]);
    assert_eq!(last_two, &[3, 4]);
    assert_eq!(&array[1..=2], &[2, 3]);
    assert!(array[4..4].is_empty());
}
```

Gli estremi devono rispettare il range del contenitore e l'ordine richiesto. Un intervallo vuoto `len..len` e valido; l'elemento di indice `len` non esiste. L'indicizzazione `[]` fuori intervallo genera panic, non un `None`.

### Accesso fallibile con get

```rust
fn main() {
    let values = [10, 20, 30, 40];
    assert_eq!(values.get(1), Some(&20));
    assert_eq!(values.get(4), None);
    assert_eq!(values.get(1..3), Some(&[20, 30][..]));
    assert_eq!(values.get(3..5), None);
    assert_eq!(values.get(4..4), Some(&[][..]));
}
```

`get` restituisce un `Option` con un riferimento o una vista; `get_mut` e la variante mutabile. Un risultato assente va gestito: sostituire `[]` con `get(...).unwrap()` reintroduce un possibile panic.

### Slice mutabile

```rust
fn main() {
    let mut values = [3, 1, 2];
    let view: &mut [i32] = &mut values;
    view.sort();
    view[0] = 0;
    assert_eq!(values, [0, 2, 3]);
}
```

Si modificano gli elementi originali, non una copia. La lunghezza del contenitore non cambia; il contratto di una slice mutabile non e quello di `&mut Vec<T>`.

### String slice e confini UTF-8

```rust
fn main() {
    let text = String::from("caff\u{00E8}");
    assert_eq!(text.len(), 6);
    assert_eq!(text.get(0..4), Some("caff"));
    assert_eq!(text.get(4..6), Some("\u{00E8}"));
    assert_eq!(text.get(0..5), None);
    assert_eq!(text.get(6..6), Some(""));
}
```

Gli indici sono byte: l'ultimo carattere del demo occupa due byte. `&text[0..5]` genererebbe panic perche taglia la codifica a meta. Anche un range entro `len()` deve avere estremi su confini validi. Per navigare per valori scalari Unicode usa `chars()` o `char_indices()`; un confine di `char` non garantisce un confine di grafema, cioe di carattere percepito dall'utente.

## Esempio pratico

### Media di una sequenza

```rust
fn mean(values: &[f64]) -> Option<f64> {
    if values.is_empty() {
        return None;
    }

    let sum: f64 = values.iter().sum();
    Some(sum / values.len() as f64)
}

fn main() {
    let array = [10.0, 20.0, 30.0];
    let values = vec![2.0, 4.0, 6.0];
    assert_eq!(mean(&array), Some(20.0));
    assert_eq!(mean(&values), Some(4.0));
    assert_eq!(mean(&values[1..]), Some(5.0));
    assert_eq!(mean(&[]), None);
}
```

La stessa firma accetta array, vettori e loro porzioni senza acquisire ownership. Il demo usa valori piccoli con risultati esatti; **None indica soltanto input vuoto**. Non filtra `NaN`/infinito, non protegge dall'overflow della somma e non garantisce stabilita numerica o precisione per ogni dimensione: per statistiche affidabili serve un contratto numerico piu specifico.

## Varianti

- `&[T]`: slice immutabile.
- `&mut [T]`: slice mutabile.
- `&str`: slice di testo UTF-8.
- `&mut str`: testo modificabile con API che preservano UTF-8, senza poterlo far crescere come una `String`.
- `&[u8]`: slice di byte, comune in I/O e parsing.
- Range `a..b`, `..b`, `a..`, `..` per selezionare porzioni.
- `to_vec()` su una slice con elementi `Clone`: crea un vettore posseduto duplicando gli elementi secondo la loro semantica di clone.

### Due porzioni mutabili disgiunte

```rust
fn main() {
    let mut values = [1, 2, 3, 4];
    let (left, right) = values.split_at_mut(2);
    left[0] = 10;
    right[0] = 30;
    assert_eq!(left, &[10, 2]);
    assert_eq!(right, &[30, 4]);
    assert_eq!(values, [10, 2, 30, 4]);
}
```

`split_at_mut` restituisce viste non sovrapposte, senza duplicare gli elementi. Il punto di separazione puo essere `0` o `len()`, producendo una parte vuota; oltre `len()` causa panic. Due indicizzazioni mutabili scritte separatamente non comunicano necessariamente la stessa prova di separazione al compilatore.

## Errori comuni

- Usare `&Vec<T>` nelle API quando basta `&[T]`.
- Tagliare una `String` usando indici non allineati a caratteri UTF-8.
- Confondere `&str` con `String`: `&str` non possiede il testo.
- Accedere a una slice con un indice fuori range causando panic.
- Credere che copiare un `&[T]` duplichi gli elementi o ne prolunghi la vita.
- Trattare una sequenza di byte qualsiasi come testo UTF-8 valido senza conversione controllata.

## Checklist

- La funzione deve solo leggere elementi? Preferisci `&[T]`.
- Deve modificare elementi senza cambiare lunghezza? Usa `&mut [T]`.
- Deve cambiare lunghezza? Serve un contenitore che lo consenta, per esempio `Vec<T>` o `&mut Vec<T>`, non una semplice vista.
- Stai usando indici su testo UTF-8? Verifica i boundary.
- Tutti gli usi della vista avvengono mentre i dati restano validi e senza mutazioni incompatibili?

## Collegamenti

- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Stringhe String e &str|Stringhe String e &str]]
- [[Programmazione/Rust/Pagine/Vec|Vec]]
- [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]]

## Fonti

- [Rust Reference: slice types](https://doc.rust-lang.org/reference/types/slice.html).
- [Rust Book: The Slice Type](https://doc.rust-lang.org/book/ch04-03-slices.html).
- [Standard library: slice, get e split_at_mut](https://doc.rust-lang.org/std/primitive.slice.html).
- [Standard library: str e accesso ai confini UTF-8](https://doc.rust-lang.org/std/primitive.str.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
