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
  - tuple-structs
  - newtype
aliases:
  - Tuple struct Rust
  - Newtype semplice
prerequisites:
  - "[[Programmazione/Rust/Pagine/Structs]]"
  - "[[Programmazione/Rust/Pagine/Tipi di dato primitivi]]"
related:
  - "[[Programmazione/Rust/Pagine/Newtype pattern]]"
  - "[[Programmazione/Rust/Pagine/Pattern Matching]]"
  - "[[Programmazione/Rust/Pagine/Derive traits]]"
title: Tuple structs
---

# Tuple structs

## Sintesi

Una **tuple struct** e un tipo nominale con campi posizionali: si costruisce con il suo nome e si accede ai campi con .0, .1 e cosi via. Non e un alias di una tupla o del tipo interno.

Con un solo campo e una forma comune del **newtype pattern**: permette di distinguere concetti che hanno la stessa rappresentazione. Non eredita automaticamente conversioni, operatori o metodi del valore interno. Gli esempi autonomi sono verificati con Rust **1.99.1**, edition **2024**; il controesempio e indicato.

## Quando usarlo

- Per distinguere UserId da OrderId, pur usando u64 per entrambi.
- Per poche posizioni con significato naturale, come coordinate.
- Per controllare come si costruisce o si espone un valore.
- Per definire comportamento e implementazioni di trait su un tipo locale.

Con molti campi o posizioni difficili da ricordare, preferisci campi nominati. La brevita non basta a rendere chiaro un modello.

## Come funziona

Il costruttore della tuple struct prende i campi nell'ordine dichiarato. Nella sintassi convenzionale si usa Position(x, y); i campi non hanno nomi semantici.

### Campi posizionali e alias

```rust
struct Position(i32, i32);
type Pair = (i32, i32);

fn main() {
    let position = Position(3, 4);
    assert_eq!(position.0, 3);
    assert_eq!(position.1, 4);

    let pair: Pair = (3, 4);
    let ordinary_tuple: (i32, i32) = pair;
    assert_eq!(ordinary_tuple, (3, 4));
}
```

Pair e un altro nome per (i32, i32). Position e invece un tipo distinto: non si converte automaticamente in Pair. Anche type Id = u64 lascerebbe intercambiabili Id e u64.

## API / Sintassi

### Identificativo con campo privato

```rust
mod ids {
    #[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
    pub struct UserId(u64);

    impl UserId {
        pub fn new(value: u64) -> Option<Self> {
            if value == 0 { None } else { Some(Self(value)) }
        }

        pub fn get(self) -> u64 {
            self.0
        }
    }
}

fn main() {
    let id = ids::UserId::new(42).unwrap();
    assert_eq!(id.get(), 42);
    assert_eq!(id.get(), 42);
    assert_eq!(ids::UserId::new(0), None);
}
```

Lo zero e escluso per scelta applicativa. Il main non puo chiamare ids::UserId(0) o leggere id.0: il campo e privato nel modulo ids. Pub sul tipo non rende pubblico il costruttore posizionale se i campi non sono tutti pubblici.

Get prende self per valore: nel demo Copy permette di richiamarlo senza perdere id. Su un wrapper non Copy, un metodo self lo consumerebbe. Gli unwrap sono limitati a input noti; dati esterni richiedono gestione di None.

### Destructuring e ownership

```rust
struct Label(String);

fn main() {
    let label = Label(String::from("rust"));
    let Label(view) = &label;
    assert_eq!(view, "rust");
    assert_eq!(label.0, "rust");

    let Label(owned) = label;
    assert_eq!(owned, "rust");
}
```

Il primo pattern prende in prestito il campo (view e &String); il secondo sposta la String. La destrutturazione non e una copia implicita e richiede accesso ai campi. Con Drop sul wrapper lo spostamento del campo ha ulteriori limiti.

## Esempio pratico

### Unita di misura distinte

```rust
#[derive(Debug, Copy, Clone, PartialEq)]
struct Celsius(f64);

#[derive(Debug, Copy, Clone, PartialEq)]
struct Fahrenheit(f64);

fn celsius_to_fahrenheit(value: Celsius) -> Option<Fahrenheit> {
    if !value.0.is_finite() {
        return None;
    }
    let converted = value.0 * (9.0 / 5.0) + 32.0;
    if converted.is_finite() {
        Some(Fahrenheit(converted))
    } else {
        None
    }
}

fn main() {
    let converted = celsius_to_fahrenheit(Celsius(20.0)).unwrap();
    assert!((converted.0 - 68.0).abs() < 1e-10);
    assert_eq!(celsius_to_fahrenheit(Celsius(f64::NAN)), None);
}
```

La funzione richiede Celsius, non un f64 o Fahrenheit. I tipi impediscono lo scambio accidentale delle unita, ma non validano automaticamente il dominio fisico: i costruttori qui sono accessibili nello stesso modulo.

Il demo rifiuta valori non finiti e risultati che diventano infiniti. Non impone lo zero assoluto, non elimina gli errori floating point e non distingue la causa del fallimento tramite None. PartialEq su f64 non e Eq: NaN non e uguale nemmeno a se stesso; per questo non si aggiunge Eq al derive.

## Varianti

### Esporre un comportamento scelto

```rust
use std::fmt;

struct Username(String);

impl fmt::Display for Username {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "utente: {}", self.0)
    }
}

fn main() {
    let name = Username(String::from("luca"));
    assert_eq!(name.to_string(), "utente: luca");
}
```

Il wrapper implementa Display, non eredita tutti i trait di String. La creazione di un tipo locale consente implementazioni nel rispetto delle regole di coerenza; non autorizza implementazioni in conflitto.

Altre forme sono le tuple struct a piu campi, una unit-like struct senza campi, oppure wrapper generici con PhantomData. I marker avanzati restano nella nota collegata.

Per interoperabilita non assumere che un wrapper a un campo abbia automaticamente ABI e layout del campo. Quando appropriato, repr(transparent) esprime specifiche garanzie di rappresentazione; non aggiunge conversioni implicite o validazione. Non introdurlo soltanto per una presunta ottimizzazione.

## Errori comuni

### Due wrapper non sono intercambiabili

Questo programma **non compila** (E0308):

```rust
struct UserId(u64);
struct OrderId(u64);

fn load_user(_id: UserId) {}

fn main() {
    load_user(OrderId(42));
}
```

Non correggerlo estraendo e riavvolgendo indiscriminatamente il numero: prima verifica che la conversione abbia senso nel dominio.

Altri errori frequenti:

- Usare type quando serve realmente un nuovo tipo.
- Rendere pubblico il campo di un wrapper che dovrebbe validare la costruzione.
- Derivare trait senza verificarne requisiti e semantica.
- Aspettarsi che .len(), + o conversioni numeriche siano inoltrati al campo interno.
- Usare .0 in molti punti quando un metodo nominato sarebbe piu leggibile.
- Promettere costo nullo, layout o sicurezza degli input dal solo wrapper.

## Checklist

- Serve distinzione di tipo o soltanto un alias leggibile?
- I campi posizionali sono chiari?
- Il costruttore deve accettare tutti i valori del tipo interno?
- Quali trait e operazioni si vogliono esporre?
- Get deve consumare, copiare o prendere in prestito?
- I vincoli di rappresentazione sono realmente necessari?

## Collegamenti

- [[Programmazione/Rust/Pagine/Structs|Structs]]
- [[Programmazione/Rust/Pagine/Newtype pattern|Newtype pattern]]
- [[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]]
- [[Programmazione/Rust/Pagine/Derive traits|Derive traits]]
- [[Programmazione/Rust/Pagine/PhantomData|PhantomData]]
- [[Programmazione/Rust/Pagine/Copy e Clone|Copy e Clone]]
- [[Programmazione/Rust/Pagine/Memory layout e alignment|Memory layout e alignment]]

## Fonti

- [Rust Reference: Structs](https://doc.rust-lang.org/reference/items/structs.html).
- [Rust Book: Defining and Instantiating Structs](https://doc.rust-lang.org/book/ch05-01-defining-structs.html).
- [Rust Reference: Type aliases](https://doc.rust-lang.org/reference/items/type-aliases.html).
- [Rust Reference: Visibility and privacy](https://doc.rust-lang.org/reference/visibility-and-privacy.html).
- [Rust Reference: Type layout](https://doc.rust-lang.org/reference/type-layout.html).
- [Standard library: f64](https://doc.rust-lang.org/std/primitive.f64.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
