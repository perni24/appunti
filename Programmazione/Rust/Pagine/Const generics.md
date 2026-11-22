---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - compile-time-e-type-level-programming
aliases:
  - Const generics
  - Generics const Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Generics]]"
  - "[[Programmazione/Rust/Pagine/const fn]]"
related:
  - "[[Programmazione/Rust/Pagine/Zero-sized types]]"
  - "[[Programmazione/Rust/Pagine/Typestate pattern]]"
  - "[[Programmazione/Rust/Pagine/PhantomData]]"
title: Const generics
---

# Const generics

## Sintesi

I **const generics** parametrizzano tipi e funzioni con valori costanti. In `[T; N]`, `T` indica il tipo degli elementi e `N` la lunghezza: `[u8; 4]` e `[u8; 8]` sono tipi diversi.

Servono quando un valore deve far parte del contratto statico dell'API. Non trasformano una dimensione letta a runtime in un nuovo tipo, e non sostituiscono la validazione dei dati. [Introduzione ai const generics](https://blog.rust-lang.org/2021/02/26/const-generics-mvp-beta/).

Esempi verificati con **Rust 1.99.1, edition 2024**, standard library: sette programmi validi e quattro controesempi dichiarati. La baseline non e una MSRV.

## Quando usarlo

| Esigenza | Forma indicativa |
| --- | --- |
| Lunghezza esatta nel tipo | `[T; N]`, `Buffer<N>` |
| Righe e colonne nel tipo | `Matrix<T, R, C>` |
| Prestito senza vincolo statico di lunghezza | `&[T]` |
| Numero di elementi variabile | `Vec<T>` |
| Modalita fissata dal chiamante | Parametro `const FLAG: bool` |

Una funzione che deve soltanto scorrere dei dati spesso non ha bisogno di conoscere `N`: accettare una slice evita di vincolare inutilmente il chiamante.

Per un buffer con capacita fissa ma occupazione variabile servono anche lunghezza logica e gestione degli elementi presenti. Un semplice `[T; N]` contiene invece **N elementi inizializzati**, non "al massimo N".

## Come funziona

### Parametro, argomento e tipo risultante

In `struct Buffer<const N: usize>`, `N` e il parametro. In `Buffer<16>`, `16` e l'argomento. Nel corpo puoi usare `N` come valore; non e automaticamente un campo memorizzato in ogni istanza.

`N = 0` e valido. Se il dominio richiede una dimensione positiva devi esprimere un controllo aggiuntivo. Avere una lunghezza statica non rende valido un indice runtime fuori intervallo. [Array](https://doc.rust-lang.org/std/primitive.array.html).

### Tipi ammessi nella baseline stable

I parametri const possono essere interi primitivi:

- `u8`, `u16`, `u32`, `u64`, `u128`, `usize`;
- `i8`, `i16`, `i32`, `i64`, `i128`, `isize`;
- anche `bool` e `char`.

Non `String`, `&str`, float o un enum applicativo. Il fatto che un valore sia esprimibile come `const` non rende il suo tipo ammesso come parametro generico. Le lunghezze degli array richiedono `usize`. [Generic parameters](https://doc.rust-lang.org/reference/items/generics.html).

### Versioni da distinguere

- Il nucleo dei const generics e stabile da **Rust 1.51**.
- `std::array::from_fn` e disponibile da **1.63**.
- L'argomento const inferito esplicitamente con `_` e stabile da **1.89**.

Non attribuire l'intera pagina alla MSRV 1.51. Fonti: [Rust 1.51](https://blog.rust-lang.org/2021/03/25/Rust-1.51.0/), [from_fn](https://doc.rust-lang.org/std/array/fn.from_fn.html), [Rust 1.89](https://blog.rust-lang.org/2025/08/07/Rust-1.89.0/).

## API / Sintassi

Ogni blocco valido e un programma autonomo.

### Buffer, impl e valore predefinito

```rust
struct Buffer<const N: usize = 16> {
    data: [u8; N],
}

impl<const N: usize> Buffer<N> {
    fn new(data: [u8; N]) -> Self {
        Self { data }
    }

    fn len(&self) -> usize {
        N
    }

    fn as_slice(&self) -> &[u8] {
        &self.data
    }
}

fn main() {
    let small = Buffer::new([1, 2, 3]);
    let four = Buffer::<{ 2 + 2 }>::new([0; 4]);
    let default: Buffer = Buffer::new([0; 16]);

    assert_eq!(small.len(), 3);
    assert_eq!(small.as_slice(), &[1, 2, 3]);
    assert_eq!(four.len(), 4);
    assert_eq!(default.len(), 16);
}
```

L'array permette di inferire `N = 3`; l'annotazione `Buffer` usa invece il default `16`. Un default non sovrascrive una dimensione specificata dal contesto.

La dichiarazione del parametro usa `const N: usize`; il suo impiego usa `N`. Per argomenti composti come `2 + 2` servono le graffe. Queste risolvono la sintassi, non eliminano i limiti sui calcoli generici mostrati piu avanti. [Sintassi degli argomenti const](https://doc.rust-lang.org/reference/items/generics.html#const-generics).

### Funzione generica e inferenza

```rust
fn first<T: Copy, const N: usize>(items: &[T; N]) -> Option<T> {
    items.first().copied()
}

fn main() {
    let items = [10, 20, 30];
    let empty: [i32; 0] = [];

    assert_eq!(first(&items), Some(10));
    assert_eq!(first::<i32, 3>(&items), Some(10));
    assert_eq!(first::<_, _>(&items), Some(10));
    assert_eq!(first(&empty), None);
}
```

Il parametro e un prestito: l'array non viene consumato. Il bound `Copy` serve per restituire una copia del primo elemento; una variante che restituisce `Option<&T>` non richiede quel bound.

`_` chiede inferenza dal contesto, non rappresenta una dimensione arbitraria a runtime. Non e ammesso al posto di una dimensione nella firma pubblica di un item. [Rust 1.89: inferenza const](https://blog.rust-lang.org/2025/08/07/Rust-1.89.0/).

### Matrice con due dimensioni

```rust
struct Matrix<T, const R: usize, const C: usize> {
    data: [[T; C]; R],
}

impl<T, const R: usize, const C: usize> Matrix<T, R, C> {
    fn new(data: [[T; C]; R]) -> Self {
        Self { data }
    }

    fn shape(&self) -> (usize, usize) {
        (R, C)
    }

    fn get(&self, row: usize, column: usize) -> Option<&T> {
        self.data.get(row)?.get(column)
    }
}

fn main() {
    let matrix = Matrix::new([[1, 2, 3], [4, 5, 6]]);

    assert_eq!(matrix.shape(), (2, 3));
    assert_eq!(matrix.get(1, 2), Some(&6));
    assert_eq!(matrix.get(2, 0), None);
    assert_eq!(matrix.get(0, 3), None);
}
```

Le dimensioni sono note, ma gli indici ricevuti da `get` restano valori runtime. Gli array annidati non richiedono `T: Copy`: il costruttore riceve dati gia costruiti e li sposta nella struct.

`[[T; C]; R]` evita di dover esprimere `[T; R * C]` nel tipo generico, forma non supportata nella baseline stable.

## Esempio pratico

### Costruire elementi non Copy

```rust
use std::array;

fn main() {
    let labels: [String; 3] =
        array::from_fn(|index| format!("item-{index}"));

    assert_eq!(labels, ["item-0", "item-1", "item-2"]);

    let mut calls = 0;
    let empty: [String; 0] = array::from_fn(|_| {
        calls += 1;
        String::from("unused")
    });

    assert!(empty.is_empty());
    assert_eq!(calls, 0);
}
```

`from_fn` costruisce ciascun elemento, senza richiedere `Copy`, e non chiama la closure per `N = 0`. La lunghezza e statica, ma la costruzione qui avviene a runtime. Nella baseline `from_fn` non e un'API const stabile. [from_fn](https://doc.rust-lang.org/std/array/fn.from_fn.html).

`[value; N]` non e una clonazione implicita: per lunghezze maggiori di 1 un normale valore ripetuto richiede `Copy`. Esistono forme con costanti o blocchi const, per esempio `[const { String::new() }; 3]`.

Con lunghezze concrete 0 o 1 non serve `Copy`, ma un'espressione ordinaria viene comunque valutata una volta, anche in `[String::from("unused"); 0]`. Un blocco const o un riferimento a un item costante con lunghezza zero non viene invece valutato. Non confondere queste regole con le chiamate della closure di `from_fn`. [Rust Reference: array expressions](https://doc.rust-lang.org/reference/expressions/array-expr.html).

### FixedStr: lunghezza e UTF-8 sono invarianti diverse

```rust
mod text {
    pub struct FixedStr<const N: usize> {
        bytes: [u8; N],
    }

    impl<const N: usize> FixedStr<N> {
        pub fn from_bytes(
            bytes: [u8; N],
        ) -> Result<Self, std::str::Utf8Error> {
            std::str::from_utf8(&bytes)?;
            Ok(Self { bytes })
        }

        pub fn as_bytes(&self) -> &[u8; N] {
            &self.bytes
        }

        pub fn as_str(&self) -> &str {
            std::str::from_utf8(&self.bytes)
                .expect("validated UTF-8")
        }
    }
}

use text::FixedStr;

fn main() {
    let word = FixedStr::from_bytes(*b"rust").unwrap();
    let letter = FixedStr::from_bytes([0xc3, 0xa8]).unwrap();

    assert_eq!(word.as_bytes(), b"rust");
    assert_eq!(word.as_str(), "rust");
    assert_eq!(letter.as_bytes().len(), 2);
    assert_eq!(letter.as_str().chars().count(), 1);
    assert!(FixedStr::from_bytes([0xff]).is_err());
}
```

`N` conta **byte**, non caratteri o grafemi. Il tipo rappresenta esattamente N byte di testo, non una stringa variabile con capacita massima N.

Il costruttore controlla UTF-8; campo privato e assenza di accesso mutabile impediscono al chiamante di invalidarlo. `as_str` ricontrolla i byte con l'API sicura: e una scelta didattica, non una conversione a costo zero. L'`expect` si basa sull'invariante del modulo, non sull'input non validato. [from_utf8](https://doc.rust-lang.org/std/str/fn.from_utf8.html).

### Passare da una slice runtime a una dimensione fissata

```rust
fn four_bytes(
    input: &[u8],
) -> Result<&[u8; 4], std::array::TryFromSliceError> {
    input.try_into()
}

fn main() {
    let input = vec![1, 2, 3, 4];
    let fixed = four_bytes(&input).unwrap();

    assert_eq!(fixed, &[1, 2, 3, 4]);
    assert_eq!(fixed.as_ptr(), input.as_ptr());
    assert!(four_bytes(&input[..3]).is_err());
}
```

Il target e sempre `&[u8; 4]`: viene controllata la lunghezza della slice. Non si genera un parametro const dal suo `len()`.

Il risultato prende in prestito gli stessi dati, senza copiarli; il lifetime resta legato all'input. Una conversione a `[u8; 4]` posseduto avrebbe invece semantica di copia degli elementi. [Conversioni degli array](https://doc.rust-lang.org/std/primitive.array.html), [slice](https://doc.rust-lang.org/std/primitive.slice.html).

## Varianti

### Parametro booleano per una modalita

```rust
fn format_id<const UPPER: bool>(value: u8) -> String {
    if UPPER {
        format!("{value:02X}")
    } else {
        format!("{value:02x}")
    }
}

fn main() {
    assert_eq!(format_id::<true>(175), "AF");
    assert_eq!(format_id::<false>(175), "af");
}
```

La modalita e statica, il numero da formattare no. Se la modalita arriva dall'utente, un normale parametro `bool` puo essere piu semplice; in alternativa scegli esplicitamente fra le due chiamate.

I const generics possono generare istanze monomorfizzate differenti. Molti valori distinti possono aumentare lavoro di compilazione e dimensioni del binario, ma il codice finale dipende dalle ottimizzazioni: nessuna promessa di duplicazione esatta o velocita superiore. [Generics e monomorfizzazione](https://doc.rust-lang.org/book/ch10-01-syntax.html#performance-of-code-using-generics).

Un const parameter puo anche distinguere tipi senza comparire in un campo. Per distinguere invece tipi o lifetime logici, vedi [[Programmazione/Rust/Pagine/PhantomData|PhantomData]] e [[Programmazione/Rust/Pagine/Marker types|Marker types]].

## Errori comuni

I quattro programmi seguenti **non compilano intenzionalmente**.

### Confondere lunghezze diverse

```rust
fn accept_four(_: [u8; 4]) {}

fn main() {
    accept_four([0; 3]);
}
```

Errore `E0308`: la firma richiede quattro elementi. Rendere il chiamante generico non crea una conversione automatica. Se qualunque lunghezza e accettabile, cambia il contratto in una slice.

### Usare una variabile locale come argomento const

```rust
fn zeros<const N: usize>() -> [u8; N] {
    [0; N]
}

fn main() {
    let size = 3;
    let _data = zeros::<{ size }>();
}
```

Errore `E0435`: un `let` immutabile non e una costante, neppure con un inizializzatore letterale. Usa un `const` se la dimensione appartiene al sorgente; per una dimensione runtime valuta `Vec` o una selezione fra casi statici noti.

### Calcolare N + 1 dentro un tipo

```rust
fn extended<const N: usize>() -> [u8; N + 1] {
    [0; N + 1]
}

fn main() {
    let _data = extended::<3>();
}
```

Il compilatore rifiuta l'uso di parametri generici in queste operazioni const. `[u8; N]` e valido, ma `[u8; N + 1]` non lo e nella baseline stable. Aggiungere graffe, un blocco const o una chiamata a `const fn` non aggira il limite.

Puoi usare array annidati, campi separati o un `Vec`, a seconda del contratto richiesto. Campi separati non promettono lo stesso layout di un array unico. Per un'istanza concreta `Buffer<{ 3 + 1 }>` e invece ammesso.

La feature nightly `generic_const_exprs` e documentata come incompleta: non e necessaria per gli esempi validi di questa pagina e non viene abilitata. [Unstable Book](https://doc.rust-lang.org/unstable-book/language-features/generic-const-exprs.html).

### Parametro const con tipo non ammesso

```rust
struct Label<const NAME: &'static str>;

fn main() {}
```

`&'static str` non e un tipo ammesso per un parametro const nella baseline. Un nome puo essere un normale campo, oppure una costante associata a un tipo marker: sono scelte diverse, non un equivalente automatico.

Altri errori da evitare:

- Inferire `N` senza alcun contesto sufficiente: aggiungi un tipo o un argomento esplicito.
- Dichiarare un item `const` annidato pensando che catturi i generics esterni: gli item hanno uno scope distinto; vedi [[Programmazione/Rust/Pagine/const fn|blocchi const]].
- Presumere `Default` per array di qualunque lunghezza: nella baseline le implementazioni standard coprono 0..=32. Per altri casi puoi costruire gli elementi con `from_fn`, se il contratto lo consente.
- Credere che un array sia necessariamente sullo stack: e memorizzato inline nel suo proprietario, che puo trovarsi anche sull'heap.
- Deducere validita del contenuto, UTF-8 o indici sicuri dalla sola lunghezza.

## Checklist

- La dimensione deve essere parte del tipo o basta una slice?
- Ho distinto lunghezza esatta e capacita?
- Il caso N = 0 e gestito o rifiutato esplicitamente?
- Il tipo del parametro e ammesso dalla toolchain supportata?
- Le espressioni generiche usate sono disponibili su stable?
- L'inizializzazione richiede Copy o costruisce ogni elemento?
- La validazione runtime resta presente dove serve?
- Ho considerato MSRV e numero di istanze generate?

## Collegamenti

- [[Programmazione/Rust/Pagine/Generics|Generics]]
- [[Programmazione/Rust/Pagine/const fn|const fn]]
- [[Programmazione/Rust/Pagine/const e static|const e static]]
- [[Programmazione/Rust/Pagine/Slices|Slices]]
- [[Programmazione/Rust/Pagine/Vec|Vec]]
- [[Programmazione/Rust/Pagine/Default|Default]]
- [[Programmazione/Rust/Pagine/Zero-sized types|Zero-sized types]]
- [[Programmazione/Rust/Pagine/Typestate pattern|Typestate pattern]]
- [[Programmazione/Rust/Pagine/PhantomData|PhantomData]]

## Fonti

- [Rust Reference: generic parameters](https://doc.rust-lang.org/reference/items/generics.html).
- [Rust Blog: const generics MVP](https://blog.rust-lang.org/2021/02/26/const-generics-mvp-beta/), contesto storico.
- [Rust 1.51](https://blog.rust-lang.org/2021/03/25/Rust-1.51.0/) e [Rust 1.89](https://blog.rust-lang.org/2025/08/07/Rust-1.89.0/).
- [Standard library: array](https://doc.rust-lang.org/std/primitive.array.html), [slice](https://doc.rust-lang.org/std/primitive.slice.html) e [from_fn](https://doc.rust-lang.org/std/array/fn.from_fn.html).
- [Standard library: from_utf8](https://doc.rust-lang.org/std/str/fn.from_utf8.html).
- [Rust Book: generic data types](https://doc.rust-lang.org/book/ch10-01-syntax.html).
- [Unstable Book: generic_const_exprs](https://doc.rust-lang.org/unstable-book/language-features/generic-const-exprs.html).

Consultate il 2026-11-17. Le pagine online possono avanzare rispetto alla toolchain di prova; gli esempi e i limiti dichiarati sono verificati su Rust 1.99.1.

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
