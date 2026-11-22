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
  - Generics Rust
  - Tipi generici Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Structs]]"
  - "[[Programmazione/Rust/Pagine/Enums]]"
  - "[[Programmazione/Rust/Pagine/Funzioni]]"
related:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Trait bounds]]"
  - "[[Programmazione/Rust/Pagine/Zero-cost abstractions]]"
title: Generics
---

# Generics

## Sintesi

I generics parametrizzano una definizione su tipi, lifetime o costanti. Il corpo viene controllato rispetto ai requisiti dichiarati, non alle sole chiamate che scrivi: conoscere gli argomenti di una chiamata non permette di usare su `T` operazioni prive del relativo bound.

Per i parametri di tipo Rust usa normalmente la monomorfizzazione. Non implica un costo runtime di dispatch dinamico, ma puo aumentare codice generato e tempi di compilazione. Non e una promessa di prestazioni per qualsiasi implementazione.

## Quando usarlo

- Riutilizzare un algoritmo mantenendo i tipi concreti.
- Conservare dati con ownership esplicita in un contenitore.
- Collegare il tipo di un argomento al risultato.
- Accettare comportamenti descritti da trait senza scegliere subito un trait object.

Per un elenco chiuso di alternative con significati diversi puo essere piu chiaro un enum. Per dati eterogenei scelti a runtime valuta enum o trait object: generico non significa contenitore di qualsiasi valore mescolato.

## Come funziona

### Identita, inferenza e ownership

Ogni blocco Rust di questa nota e un programma autonomo, salvo il controesempio dichiarato non compilabile. Baseline di verifica: Rust 1.99.1, edition 2024, libreria standard.

```rust
fn identity<T>(value: T) -> T {
    value
}

fn main() {
    let number: u16 = identity(10);
    let explicit = identity::<u32>(20);
    let original = String::from("rust");
    let returned = identity(original);

    assert_eq!(number, 10);
    assert_eq!(explicit, 20);
    assert_eq!(returned, "rust");
}
```

Il contesto o gli argomenti aiutano a inferire `T`; `::<u32>` lo indica esplicitamente (turbofish). Non e una conversione: `identity::<u32>(20_u16)` non converte l'intero.

La firma prende per valore. `original` e spostata e non e piu utilizzabile, mentre per tipi `Copy` il passaggio copia il valore. Non avviene una clonazione automatica. Senza bound espliciti puoi, per esempio, spostare, prendere in prestito, scartare o impacchettare `T`; non puoi presumere `Clone`, `Display` o un ordinamento.

### Un parametro condiviso o tipi indipendenti

```rust
fn same_pair<T>(left: T, right: T) -> (T, T) {
    (left, right)
}

fn pair<A, B>(left: A, right: B) -> (A, B) {
    (left, right)
}

fn main() {
    assert_eq!(same_pair(1_u8, 2_u8), (1, 2));
    let mixed = pair(1_u8, String::from("ready"));
    assert_eq!(mixed.0, 1);
    assert_eq!(mixed.1, "ready");
}
```

Ripetere `T` richiede un unico tipo per entrambi i parametri, dopo le coercizioni consentite dal contesto. `A` e `B` sono indipendenti: possono essere uguali, ma non devono esserlo. La scelta dei nomi non cambia i vincoli.

## API / Sintassi

### Struct e metodi generici

```rust
struct Wrapper<T> {
    value: T,
}

impl<T> Wrapper<T> {
    fn new(value: T) -> Self {
        Self { value }
    }

    fn get(&self) -> &T {
        &self.value
    }

    fn into_inner(self) -> T {
        self.value
    }

    fn pair_with<U>(self, other: U) -> (T, U) {
        (self.value, other)
    }
}

impl Wrapper<String> {
    fn byte_len(&self) -> usize {
        self.value.len()
    }
}

fn main() {
    let text = Wrapper::new(String::from("api"));
    assert_eq!(text.get(), "api");
    assert_eq!(text.byte_len(), 3);
    assert_eq!(text.pair_with(200_u16), (String::from("api"), 200));
    assert_eq!(Wrapper::new(7_u8).into_inner(), 7);
}
```

`impl<T>` dichiara il parametro per l'implementazione; `Wrapper<T>` lo usa. `Self` qui significa `Wrapper<T>`. `U` e invece dichiarato dal solo metodo `pair_with`.

`impl Wrapper<String>` aggiunge un metodo a un tipo concreto: non e la feature di specializzazione dei trait. Non rende disponibile `byte_len` su `Wrapper<u8>` e non autorizza definizioni sovrapposte dello stesso metodo.

### Enum e informazione di tipo mancante

```rust
enum Maybe<T> {
    Some(T),
    None,
}

fn main() {
    let present = Maybe::Some(String::from("api"));
    let absent: Maybe<String> = Maybe::None;
    let explicit = Maybe::<u32>::None;

    match present {
        Maybe::Some(value) => assert_eq!(value, "api"),
        Maybe::None => panic!("valore atteso"),
    }
    assert!(matches!(absent, Maybe::None));
    assert!(matches!(explicit, Maybe::None));
}
```

`Maybe` serve solo a vedere la sintassi: nel codice reale usa `Option<T>`. `None` non contiene un valore da cui inferire `T`; se il resto del programma non lo determina, occorre un'annotazione.

Un `Vec<Wrapper<String>>` contiene elementi di quel tipo, non anche `Wrapper<u8>`. I generics non cancellano l'identita del tipo.

## Esempio pratico

### Una voce con chiave e valore indipendenti

```rust
struct CacheEntry<K, V> {
    key: K,
    value: V,
}

impl<K, V> CacheEntry<K, V> {
    fn new(key: K, value: V) -> Self {
        Self { key, value }
    }

    fn as_parts(&self) -> (&K, &V) {
        (&self.key, &self.value)
    }

    fn into_parts(self) -> (K, V) {
        (self.key, self.value)
    }
}

fn main() {
    let entry = CacheEntry::new("user:1", String::from("Luca"));
    let (key_ref, value_ref) = entry.as_parts();
    assert_eq!(*key_ref, "user:1");
    assert_eq!(value_ref, "Luca");

    let (key, value) = entry.into_parts();
    assert_eq!(key, "user:1");
    assert_eq!(value, "Luca");
}
```

`as_parts` presta i campi; `into_parts` consuma il contenitore e restituisce i dati senza richiedere `Clone`. Un prestito ancora usato impedirebbe lo spostamento.

Il nome indica una voce, **non una cache implementata**: non ci sono lookup, scadenza, eviction, persistenza o sincronizzazione. `K` non richiede `Hash` o `Ord` finche nessuna operazione ne ha bisogno. Se un campo e un riferimento, il contenitore possiede quel riferimento, non necessariamente il dato puntato.

## Varianti

### Parametri lifetime e const

```rust
struct View<'a, T> {
    values: &'a [T],
}

struct Batch<T, const N: usize> {
    values: [T; N],
}

fn main() {
    let items = [10_u16, 20];
    let view = View { values: &items };
    let batch = Batch { values: items };

    assert_eq!(view.values[1], 20);
    assert_eq!(batch.values.len(), 2);

    let empty: Batch<u8, 0> = Batch { values: [] };
    assert!(empty.values.is_empty());
}
```

Il lifetime descrive un rapporto tra prestiti: non prolunga la vita di `items`. `N` e una costante parte del tipo, quindi `Batch<u8, 2>` e `Batch<u8, 3>` sono tipi diversi. Dettagli nei capitoli dedicati.

- Un trait puo avere parametri, per esempio `trait Parser<T>`: non confonderli con un associated type.
- `impl Trait` in un parametro e un parametro generico anonimo; nel risultato nasconde un tipo concreto scelto dall'implementazione.
- Un generico puo contenere o ricevere un trait object: genericita e dispatch dinamico non sono categorie sempre incompatibili. E il tipo effettivo e il punto di chiamata a determinare il dispatch.

## Errori comuni

### Usare un'operazione non dichiarata

Questo programma **non compila**, anche se lo chiami solo con interi: manca il bound necessario all'operatore `>`.

```rust
fn greater<T>(left: T, right: T) -> bool {
    left > right
}

fn main() {
    assert!(greater(2_u8, 1_u8));
}
```

Per questo confronto basta `T: PartialOrd`. Non equivale a un ordine totale: valori come `f64::NAN` possono essere incomparabili. Vedi [[Programmazione/Rust/Pagine/Trait bounds|Trait bounds]].

- Scrivere `impl Wrapper<T>` senza dichiarare `T`.
- Pretendere che inferenza o turbofish convertano i valori.
- Richiedere `Copy` o `Clone` quando basta restituire un riferimento o spostare.
- Generalizzare un solo caso d'uso senza un vantaggio concreto.
- Interpretare monomorfizzazione come assenza di allocazioni: `String` e `Vec` continuano ad avere i propri costi.

## Checklist

- Quali parametri devono essere lo stesso tipo e quali sono indipendenti?
- La funzione prende ownership, presta o restituisce un prestito?
- Il compilatore dispone di abbastanza informazioni per inferire i tipi?
- Ogni operazione sul parametro ha il bound necessario?
- Sto promettendo prestazioni senza averle misurate?

## Collegamenti

- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Trait bounds|Trait bounds]]
- [[Programmazione/Rust/Pagine/Const generics|Const generics]]
- [[Programmazione/Rust/Pagine/Lifetime annotations|Lifetime annotations]]
- [[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch|Static dispatch vs dynamic dispatch]]
- [[Programmazione/Rust/Pagine/Zero-cost abstractions|Zero-cost abstractions]]

## Fonti

- [Rust Book: generic data types](https://doc.rust-lang.org/book/ch10-01-syntax.html).
- [Rust Reference: generic parameters](https://doc.rust-lang.org/reference/items/generics.html).
- [Rust Reference: implementations](https://doc.rust-lang.org/reference/items/implementations.html).
- [Rust Reference: impl Trait](https://doc.rust-lang.org/reference/types/impl-trait.html).
- [PartialOrd e ordinamento parziale](https://doc.rust-lang.org/std/cmp/trait.PartialOrd.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
