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
  - ZST
  - Zero-sized types
prerequisites:
  - "[[Programmazione/Rust/Pagine/Structs]]"
  - "[[Programmazione/Rust/Pagine/Enums]]"
related:
  - "[[Programmazione/Rust/Pagine/PhantomData]]"
  - "[[Programmazione/Rust/Pagine/Marker types]]"
  - "[[Programmazione/Rust/Pagine/Typestate pattern]]"
title: Zero-sized types
---

# Zero-sized types

## Sintesi

Uno **zero-sized type (ZST)** ha dimensione nota pari a zero: `size_of::<T>() == 0`. Puo distinguere ruoli o comportamenti senza aggiungere byte per il valore stesso. Questo non elimina ownership, allineamento, distruttori o il costo delle operazioni che lo usano.

**Zero-sized non significa zero-cost**: il tipo puo avere metodi costosi, un `Drop` con effetti osservabili o essere contenuto in una struttura con altri dati. [size_of](https://doc.rust-lang.org/std/mem/fn.size_of.html), [distruttori](https://doc.rust-lang.org/reference/destructors.html).

Esempi verificati con **Rust 1.99.1, edition 2024**, sola standard library: quattro programmi validi e due controesempi intenzionali. E una baseline di verifica, non una MSRV.

## Quando usarlo

- Marker di formato, ruolo o stato scelto tramite un parametro generico.
- Implementazioni di trait che non richiedono configurazione per istanza.
- Campi `PhantomData` per esprimere una relazione statica senza conservare il valore del parametro.
- Comprendere i casi limite di collezioni generiche e layout.

Se la scelta cambia durante l'esecuzione, un enum runtime puo essere piu semplice. Se servono dati specifici per istanza, conservarli esplicitamente: un marker non li sostituisce.

## Come funziona

### Dimensione, allineamento e identita

`Sized` non significa dimensione positiva: anche `()` e una unit struct come `struct Marker;` sono Sized. L'allineamento resta almeno 1 e puo essere maggiore anche quando la dimensione e 0. `[u64; 0]`, per esempio, conserva l'allineamento di `u64`. [Rust Reference: dimensione e allineamento](https://doc.rust-lang.org/reference/type-layout.html#size-and-alignment).

Un campo ZST non aggiunge dati, ma il suo allineamento puo introdurre padding nel contenitore. Non dedurre il layout dell'intera struttura dalla sola dimensione dei campi.

Indirizzi diversi non sono garantiti per valori ZST: i campi possono condividere un indirizzo e gli elementi di un array ZST hanno distanza in byte pari a zero. Non usare questi indirizzi come identificatori unici. Anche i riferimenti a ZST devono essere non nulli e correttamente allineati. [Layout dei campi](https://doc.rust-lang.org/reference/type-layout.html#the-rust-representation), [Rustonomicon](https://doc.rust-lang.org/nomicon/exotic-sizes.html#zero-sized-types-zsts).

### Cosa misurano le API

| API | Significato |
| --- | --- |
| `size_of::<T>()` | Dimensione del tipo Sized, padding incluso. |
| `align_of::<T>()` | Allineamento richiesto, non numero di byte del valore. |
| `size_of_val(&value)` | Dimensione del valore puntato, anche per slice. |
| `needs_drop::<T>()` | Se la distruzione del tipo richiede attenzione; non misura tempo o byte. |
| `Vec::len()` | Numero di elementi logici, non occupazione in byte. |

`size_of_val` applicato a una slice ZST puo restituire 0 anche se la slice non e vuota. La dimensione del riferimento alla slice e un'altra cosa. [size_of_val](https://doc.rust-lang.org/std/mem/fn.size_of_val.html), [needs_drop](https://doc.rust-lang.org/std/mem/fn.needs_drop.html).

## API / Sintassi

Ogni blocco Rust e autonomo. I due blocchi nella sezione Errori comuni sono intenzionalmente invalidi.

### Misurare dimensione e allineamento

```rust
use std::marker::PhantomData;
use std::mem::{align_of, size_of};

struct Marker;

#[repr(align(64))]
struct Aligned;

#[repr(C)]
struct Envelope {
    byte: u8,
    marker: Aligned,
}

fn main() {
    assert_eq!(size_of::<Marker>(), 0);
    assert_eq!(size_of::<()>(), 0);
    assert_eq!(size_of::<[u64; 0]>(), 0);
    assert_eq!(align_of::<[u64; 0]>(), align_of::<u64>());

    assert_eq!(size_of::<Aligned>(), 0);
    assert_eq!(align_of::<Aligned>(), 64);
    assert_eq!(align_of::<Envelope>(), 64);
    assert_eq!(size_of::<Envelope>(), 64);

    assert_eq!(size_of::<PhantomData<Aligned>>(), 0);
    assert_eq!(align_of::<PhantomData<Aligned>>(), 1);
    assert_eq!(size_of::<&Marker>(), size_of::<usize>());
}
```

`Envelope` dimostra il padding dovuto al campo allineato. `repr(C)` rende esplicita la regola di layout usata nel demo, ma **non rende automaticamente portabile una struct vuota a C/C++**. `PhantomData<Aligned>` non contiene un Aligned e non ne eredita l'allineamento. [PhantomData: layout](https://doc.rust-lang.org/std/marker/struct.PhantomData.html#layout), [layout C](https://doc.rust-lang.org/reference/type-layout.html#the-c-representation).

## Esempio pratico

### Marker di formato senza serializzazione implicita

```rust
use std::marker::PhantomData;
use std::mem::size_of;

struct Json;
struct Toml;

trait Format {
    fn name() -> &'static str;
}

impl Format for Json {
    fn name() -> &'static str { "json" }
}

impl Format for Toml {
    fn name() -> &'static str { "toml" }
}

struct FileName<F> {
    stem: String,
    format: PhantomData<fn() -> F>,
}

impl<F: Format> FileName<F> {
    fn new(stem: String) -> Self {
        Self { stem, format: PhantomData }
    }

    fn render(&self) -> String {
        format!("{}.{}", self.stem, F::name())
    }
}

fn main() {
    assert_eq!(size_of::<Json>(), 0);
    assert_eq!(size_of::<Toml>(), 0);

    let json = FileName::<Json>::new("settings".to_owned());
    let toml = FileName::<Toml>::new("settings".to_owned());
    assert_eq!(json.render(), "settings.json");
    assert_eq!(toml.render(), "settings.toml");
    assert!(size_of::<FileName<Json>>() >= size_of::<String>());
}
```

`FileName<Json>` e `FileName<Toml>` sono tipi distinti, anche se entrambi i marker sono ZST. `PhantomData<fn() -> F>` esprime qui solo una etichetta di tipo: non conserva ne possiede un F. Per auto trait e varianza, vedi [[Programmazione/Rust/Pagine/PhantomData|PhantomData]].

Il demo **compone nomi**, non serializza JSON/TOML, non crea file e non valida percorsi: accetta anche nomi vuoti o separatori. `stem` e il risultato di `render` sono String reali; il marker non elimina le loro allocazioni o il lavoro di formattazione.

Lo stesso principio vale per un client con endpoint String e marker Connected/Disconnected: e zero-sized il marker, non il client; la connessione va gestita realmente. Vedi [[Programmazione/Rust/Pagine/Typestate pattern|Typestate pattern]].

### Collezioni, Box e distruttori

```rust
use std::cell::Cell;
use std::mem::{needs_drop, size_of, size_of_val};

thread_local! {
    static DROPS: Cell<usize> = const { Cell::new(0) };
}

struct Ticket;

impl Drop for Ticket {
    fn drop(&mut self) {
        DROPS.with(|count| count.set(count.get() + 1));
    }
}

fn main() {
    assert_eq!(size_of::<Ticket>(), 0);
    assert!(needs_drop::<Ticket>());

    let mut tickets = Vec::new();
    for _ in 0..3 { tickets.push(Ticket); }

    assert_eq!(tickets.len(), 3);
    assert_eq!(tickets.capacity(), usize::MAX);
    assert_eq!(size_of_val(tickets.as_slice()), 0);
    assert!(size_of_val(&tickets) > 0);

    let first = &tickets[0] as *const Ticket;
    let second = &tickets[1] as *const Ticket;
    assert_eq!(first, second);

    drop(tickets.pop().expect("three tickets"));
    assert_eq!(tickets.len(), 2);
    assert_eq!(DROPS.with(Cell::get), 1);
    drop(tickets);
    assert_eq!(DROPS.with(Cell::get), 3);

    let boxed = Box::new(Ticket);
    assert_eq!(size_of_val(boxed.as_ref()), 0);
    assert_eq!(size_of_val(&boxed), size_of::<usize>());
    drop(boxed);
    assert_eq!(DROPS.with(Cell::get), 4);
}
```

`Vec<Ticket>` mantiene lunghezza e altri metadati, ma non alloca il buffer degli elementi ZST; la capacita e `usize::MAX`. Non significa elementi infiniti o cicli gratuiti: ogni elemento resta logicamente presente e il suo Drop puo eseguire lavoro. Il confronto di puntatori riguarda due elementi dello **stesso buffer ZST**, non promette uguaglianza fra qualsiasi coppia di ZST. [Vec](https://doc.rust-lang.org/std/vec/struct.Vec.html#guarantees).

`Box::new` non alloca per il valore ZST, ma `Box<Ticket>` e comunque un proprietario rappresentato da un puntatore; la distruzione del contenuto resta attiva. Non dedurre un'allocazione valida dal puntatore e non deallocarlo manualmente. [Box::new](https://doc.rust-lang.org/std/boxed/struct.Box.html#method.new), [layout di Box](https://doc.rust-lang.org/std/boxed/index.html#memory-layout).

`Ticket` usa un contatore esterno thread-local per rendere osservabili i Drop: quel contatore occupa memoria. Non gestisce una risorsa reale. La dimostrazione vale per il normale flusso del programma; `mem::forget`, abort o uscita del processo possono evitare la distruzione. [Rust Reference: distruttori](https://doc.rust-lang.org/reference/destructors.html).

## Varianti

### Zero byte non significa zero valori

- `()` ha un valore, scritto `()`, e puo essere costruito normalmente.
- `struct Marker;` e una unit struct: Marker e anche il costruttore del valore.
- `[T; 0]` non contiene elementi, anche se T non e ZST; `[Marker; N]` ha elementi logici ma occupazione zero.
- `PhantomData<T>` e abitabile anche quando T non lo e: non contiene un T.
- `enum Void {}` non ha varianti e non ha valori validi: non e un marker che puoi istanziare.

**Dimensione e abitabilita sono proprieta diverse.** Non fabbricare un Void con zeroed o transmute. Un enum con una sola variante senza payload puo essere ZST, ma un enum con piu varianti deve distinguere quale e attiva: non basta che i payload siano vuoti. [Enum senza varianti](https://doc.rust-lang.org/reference/items/enumerations.html#zero-variant-enums).

### Un tipo non abitabile in un contesto abitabile

```rust
use std::marker::PhantomData;
use std::mem::size_of;

enum Void {}

fn unwrap_infallible(value: Result<u16, Void>) -> u16 {
    match value {
        Ok(number) => number,
        Err(impossible) => match impossible {},
    }
}

fn main() {
    let empty: [Void; 0] = [];
    let values: Vec<Void> = Vec::new();
    let marker: PhantomData<Void> = PhantomData;

    assert!(empty.is_empty());
    assert!(values.is_empty());
    assert_eq!(size_of::<Void>(), 0);
    assert_eq!(std::mem::size_of_val(&marker), 0);
    assert_eq!(unwrap_infallible(Ok(7)), 7);
}
```

`size_of::<Void>()` interroga il tipo, non crea un valore. Array vuoto, Vec vuoto e PhantomData sono costruibili perche non contengono alcun Void. Il ramo Err non puo contenere un valore valido; `match impossible {}` esprime questa impossibilita. Nelle API reali valuta anche `std::convert::Infallible`.

Una closure senza catture e un altro caso utile di ZST nella baseline; il suo corpo puo comunque eseguire operazioni costose. Non confondere il tipo della closure con un function pointer, che ha una propria rappresentazione.

## Errori comuni

### Assumere Copy perche non ci sono dati

Controesempio intenzionale: errore E0382.

```rust
struct Marker;

fn consume(_: Marker) {}

fn main() {
    let marker = Marker;
    consume(marker);
    consume(marker);
}
```

La dimensione non concede Copy. Se il ruolo lo permette, aggiungi `#[derive(Clone, Copy)]`; altrimenti passa un riferimento o rispetta il consumo. Un tipo con Drop non puo implementare Copy. [Copy](https://doc.rust-lang.org/std/marker/trait.Copy.html#when-cant-my-type-be-copy).

### Confondere marker distinti con valori intercambiabili

Controesempio intenzionale: errore E0308.

```rust
struct Json;
struct Toml;

fn main() {
    let use_json = true;
    let _format = if use_json { Json } else { Toml };
}
```

I rami devono avere un tipo compatibile anche se la condizione e letterale. Per una scelta runtime usa, per esempio, un enum FormatChoice con varianti Json e Toml; mantieni il parametro generico quando la scelta e statica.

Altri errori da evitare:

- Equiparare dimensione zero ad assenza di Drop, allocazioni nei metodi o costi di monomorfizzazione.
- Usare un indirizzo ZST come chiave di identita o assumere che sia sempre diverso/sempre uguale.
- Creare riferimenti nulli o disallineati perche "non si leggono byte".
- Confondere `PhantomData<T>` con un vero campo T, o ignorarne gli effetti sui trait.
- Applicare le osservazioni di layout a FFI senza verificare rappresentazione e ABI.

## Checklist

- Ho distinto dimensione del marker, contenitore, riferimento e memoria esterna?
- Ho controllato allineamento e padding, non soltanto size_of?
- Gli effetti di metodi e distruttori sono documentati?
- L'ownership e le implementazioni Copy/Clone sono intenzionali?
- Ho distinto tipo non abitabile, valore unit e collezione vuota?
- La scelta statica giustifica generics e marker, oppure basta un enum runtime?
- Gli esempi non promettono serializzazione, rete o risorse che non gestiscono?

## Collegamenti

- [[Programmazione/Rust/Pagine/Marker types|Marker types]]
- [[Programmazione/Rust/Pagine/PhantomData|PhantomData]]
- [[Programmazione/Rust/Pagine/Typestate pattern|Typestate pattern]]
- [[Programmazione/Rust/Pagine/Structs|Structs]]
- [[Programmazione/Rust/Pagine/Enums|Enums]]
- [[Programmazione/Rust/Pagine/Memory layout e alignment|Memory layout e alignment]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop Trait]]
- [[Programmazione/Rust/Pagine/Vec|Vec]]
- [[Programmazione/Rust/Pagine/Box T|Box]]

## Fonti

- [Rust Reference: type layout](https://doc.rust-lang.org/reference/type-layout.html).
- [Rustonomicon: ZST e tipi non abitabili](https://doc.rust-lang.org/nomicon/exotic-sizes.html).
- [std::mem: size_of](https://doc.rust-lang.org/std/mem/fn.size_of.html), [size_of_val](https://doc.rust-lang.org/std/mem/fn.size_of_val.html), [needs_drop](https://doc.rust-lang.org/std/mem/fn.needs_drop.html).
- [PhantomData](https://doc.rust-lang.org/std/marker/struct.PhantomData.html).
- [Vec: garanzie](https://doc.rust-lang.org/std/vec/struct.Vec.html#guarantees), [Box: new](https://doc.rust-lang.org/std/boxed/struct.Box.html#method.new).
- [Rust Reference: distruttori](https://doc.rust-lang.org/reference/destructors.html), [enum senza varianti](https://doc.rust-lang.org/reference/items/enumerations.html#zero-variant-enums).

La documentazione online puo avanzare rispetto alla baseline degli esempi. Le verifiche locali non sono benchmark, prove FFI o garanzie per ogni compilatore e target.

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
