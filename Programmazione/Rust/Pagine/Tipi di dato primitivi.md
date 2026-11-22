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
  - tipi
aliases: []
prerequisites: []
related: []
title: Tipi di dato primitivi
---

# Tipi di dato primitivi

## Sintesi

Rust e staticamente tipizzato: il compilatore controlla il tipo delle espressioni, anche quando lo inferisce senza annotazioni. Questa nota introduce scalari (`bool`, interi, float, `char`) e tipi composti incorporati nel linguaggio (tuple, array, slice e riferimenti).

`String` e `Vec<T>` sono invece tipi della libreria standard. Gli esempi sono programmi indipendenti, verificati con Rust **1.99.1**, edition **2024**, senza dipendenze esterne.

## Quando usarlo

- Quando devi scegliere il tipo corretto per dati semplici.
- Quando vuoi capire inferenza e annotazioni di tipo.
- Quando lavori con memoria, array, slice e conversioni numeriche.

## Come funziona

### Inferenza e dimensioni

Il tipo dipende dal valore **e dall'uso**. Quando mancano altri vincoli, un letterale intero usa `i32` e uno floating point `f64`; non significa che ogni numero abbia sempre quel tipo. Una funzione che richiede `u8`, per esempio, puo vincolare un letterale a `u8`.

`u32` occupa 32 bit; `usize` e `isize` dipendono invece dal **target di compilazione**, non dal sistema che ospita il compilatore. `usize` e il tipo ordinario di indici e lunghezze, non un intero universale per dati salvati o scambiati in rete.

### Valori e rappresentazioni

- `bool`: solo `true` e `false`, senza conversione implicita da numeri o testo.
- `char`: un valore scalare Unicode, 4 byte; non necessariamente un intero simbolo visibile.
- Tuple: numero di elementi e tipi fissati; `(u32, bool)` contiene tipi diversi.
- Array `[T; N]`: `N` e parte del tipo; tutti gli elementi hanno tipo `T`.
- Slice `[T]`: sequenza di lunghezza non inclusa nel tipo; normalmente usata tramite `&[T]` o `&mut [T]`.
- `str`: testo UTF-8 normalmente preso in prestito come `&str`; un letterale stringa ha tipo `&'static str`.
- `()`: tipo unit con un unico valore, distinto dall'assenza rappresentata tramite `Option<T>`.

## API / Sintassi

### Dichiarazioni e accessi

```rust
fn main() {
    let active: bool = true;
    let letter: char = 'R';
    let count: u32 = 42;
    let temperature: f64 = 21.5;
    let pair: (i32, bool) = (10, active);
    let values: [i32; 3] = [1, 2, 3];
    let zeros = [0u8; 4];

    assert_eq!(pair.0, 10);
    assert_eq!(values[1], 2);
    assert_eq!(zeros, [0, 0, 0, 0]);
    println!("{letter}: {count}, {temperature}, {}", pair.1);
}
```

Tipi numerici principali:

- Interi signed: `i8`, `i16`, `i32`, `i64`, `i128`, `isize`.
- Interi unsigned: `u8`, `u16`, `u32`, `u64`, `u128`, `usize`.
- Floating point: `f32`, `f64`.

Un intero unsigned a `n` bit va da `0` a `2^n - 1`; un signed da `-2^(n-1)` a `2^(n-1) - 1`. Per esempio `u8` ammette `0..=255` e `i8` ammette `-128..=127`. Controlla anche il range, non soltanto la presenza del segno.

### Letterali e divisione intera

```rust
fn main() {
    let decimal = 1_000u32;
    let hex = 0xffu8;
    let binary = 0b1111_0000u8;
    let byte = b'R';

    assert_eq!((decimal, hex, binary, byte), (1000, 255, 240, 82));
    assert_eq!(7 / 2, 3);
    assert_eq!(-7 / 2, -3);
    assert_eq!(-7 % 2, -1);
}
```

La divisione intera tronca verso zero, non verso meno infinito. Il suffisso indica il tipo; `_` separa le cifre senza cambiarne il valore. Per resto sempre non negativo con divisore positivo, valuta `rem_euclid`.

## Esempio pratico

### Array, slice e accesso controllato

```rust
fn main() {
    let numbers = [10, 20, 30];
    let first = numbers[0];
    let len: usize = numbers.len();
    let tail: &[i32] = &numbers[1..];

    assert_eq!(tail, &[20, 30]);
    assert_eq!(numbers.get(1), Some(&20));
    assert_eq!(numbers.get(len), None);
    println!("Primo valore: {first}, lunghezza: {len}");
}
```

`get` restituisce `Option<&T>`: `Some` se l'indice esiste, `None` altrimenti. Con `numbers[index]` un indice fuori limite causa panic; quando l'errore e evidente staticamente il compilatore puo gia rifiutare il codice. Per input non affidabile, gestisci `Option` invece di assumere che l'indice sia valido.

La slice prende in prestito gli elementi: non copia l'array e non e un contenitore che cresce.

## Varianti

### Overflow: scegliere la politica

```rust
fn main() {
    let limit = u8::MAX;
    assert_eq!(limit.checked_add(1), None);
    assert_eq!(limit.wrapping_add(1), 0);
    assert_eq!(limit.saturating_add(1), 255);
    assert_eq!(limit.overflowing_add(1), (0, true));
}
```

`checked_*` segnala il fallimento, `wrapping_*` usa aritmetica modulare, `saturating_*` si ferma al limite, `overflowing_*` restituisce risultato modulare e flag. Nessuna politica e automaticamente corretta per ogni dominio.

Per `+`, `-` e `*`, i controlli runtime dipendono dalla configurazione: Cargo normalmente li abilita in dev e li disabilita in release. Non basare la logica sul fatto che una build faccia panic e un'altra no; usa un'operazione esplicita. Divisione intera per zero e `MIN / -1` non diventano operazioni valide disabilitando i controlli.

### Conversioni senza perdere dati di nascosto

```rust
fn main() {
    let small = 200u8;
    let wide = u32::from(small);
    let too_large = 300u16;

    assert_eq!(wide, 200);
    assert_eq!(u8::try_from(255u16), Ok(255));
    assert!(u8::try_from(too_large).is_err());
    assert!(u32::try_from(-1i32).is_err());
    assert_eq!(too_large as u8, 44);
}
```

`From` e adatto alle conversioni supportate che non possono fallire; `TryFrom` restituisce un `Result` quando il valore potrebbe non essere rappresentabile. `as` **non valida il range**: qui tronca i bit alti. Non ogni coppia di tipi ha una conversione `From` o `TryFrom`.

### Float: precisione e valori speciali

```rust
fn main() {
    let result = 0.1_f64 + 0.2;
    let tolerance = 1e-12;
    assert!((result - 0.3).abs() < tolerance);
    assert!(f64::NAN.is_nan());
    assert!(!f64::INFINITY.is_finite());
    assert!((1.0_f64 / 0.0).is_infinite());
}
```

`f32` e `f64` usano rappresentazioni binarie con precisione finita. La tolleranza dell'esempio vale per questi piccoli valori: non e una formula universale di confronto. Scala, errore ammesso, NaN e infiniti richiedono una politica; `EPSILON` da solo non risolve ogni confronto. Per importi esatti servono un modello a unita minime intere o un tipo decimale appropriato.

### Unicode: byte, char e testo

```rust
fn main() {
    let letter = '\u{00E8}';
    let text = "\u{00E8}";
    let decomposed = "e\u{0300}";

    assert_eq!(std::mem::size_of::<char>(), 4);
    assert_eq!(letter.len_utf8(), 2);
    assert_eq!(text.len(), 2);
    assert_eq!(text.chars().count(), 1);
    assert_eq!(decomposed.chars().count(), 2);
}
```

Le ultime due stringhe possono apparire equivalenti al lettore, ma non hanno la stessa sequenza di scalari. `.len()` conta byte UTF-8; `.chars().count()` conta scalari, non grafemi. Gli escape rendono visibile la differenza senza dipendere dall'editor.

## Errori comuni

- Confondere `char` con byte: un `char` Rust rappresenta un valore Unicode scalare.
- Usare `usize` per dati di dominio solo perche e comodo.
- Confondere array `[T; N]` e slice `&[T]`.
- Aspettarsi conversioni numeriche implicite: Rust richiede cast o conversioni esplicite.
- Confondere `(value)` con la tupla a un elemento `(value,)`.
- Usare float o cast `as` come se garantissero precisione o validazione.
- Considerare tutti i tipi incorporati `Copy`: per esempio `&mut T` non lo e; tuple e array dipendono dai tipi contenuti.

## Checklist

- Scegli segno e range in base al dominio e alle operazioni, incluse le sottrazioni.
- Usa `usize` per indici e lunghezze.
- Usa `f64` come default per floating point se non hai vincoli specifici.
- Preferisci slice `&[T]` nei parametri quando non serve possedere l'array.
- Definisci cosa fare con overflow, conversioni fallite e indici assenti.
- Non scambiare numero di byte, scalari Unicode e simboli percepiti.

## Collegamenti

- [[Programmazione/Rust/Pagine/Stringhe String e &str|Stringhe: String e &str]]
- [[Programmazione/Rust/Pagine/Slices|Slices]]
- [[Programmazione/Rust/Pagine/Stack e Heap|Stack e Heap]]
- [[Programmazione/Rust/Pagine/From Into TryFrom e TryInto|Conversioni From e TryFrom]]
- [[Programmazione/Rust/Pagine/Option|Option]]
- [[Programmazione/Rust/Pagine/Copy e Clone|Copy e Clone]]

## Fonti

- [Rust Book: Data Types](https://doc.rust-lang.org/book/ch03-02-data-types.html).
- [Rust Reference: Operator expressions](https://doc.rust-lang.org/reference/expressions/operator-expr.html).
- [Standard library: u8](https://doc.rust-lang.org/std/primitive.u8.html), [f64](https://doc.rust-lang.org/std/primitive.f64.html), [char](https://doc.rust-lang.org/std/primitive.char.html) e [slice](https://doc.rust-lang.org/std/primitive.slice.html).
- [Standard library: TryFrom](https://doc.rust-lang.org/std/convert/trait.TryFrom.html).
- [Cargo Book: Profiles](https://doc.rust-lang.org/cargo/reference/profiles.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
