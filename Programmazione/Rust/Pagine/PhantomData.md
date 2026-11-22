---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - compile-time-e-type-level-programming
aliases:
  - PhantomData
  - std::marker::PhantomData
prerequisites:
  - "[[Programmazione/Rust/Pagine/Lifetimes avanzati]]"
  - "[[Programmazione/Rust/Pagine/Generics]]"
  - "[[Programmazione/Rust/Pagine/Zero-sized types]]"
related:
  - "[[Programmazione/Rust/Pagine/Marker types]]"
  - "[[Programmazione/Rust/Pagine/Typestate pattern]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
title: PhantomData
---

# PhantomData

## Sintesi

`PhantomData<T>` e un campo zero-sized: collega un tipo o un lifetime alla struttura senza conservare un valore di quel tipo. Influenza controlli statici, varianza e alcuni auto trait, ma non alloca, non dereferenzia puntatori e non esegue il distruttore di un `T` inesistente.

La domanda non e soltanto "come elimino il parametro inutilizzato?", ma **quale relazione voglio rappresentare?** Una etichetta di tipo, un prestito e un proprietario logico richiedono scelte diverse. [PhantomData](https://doc.rust-lang.org/std/marker/struct.PhantomData.html).

Esempi verificati con **Rust 1.99.1, edition 2024**, sola standard library: cinque programmi validi e sei controesempi dichiarati. La baseline non e una MSRV.

## Quando usarlo

- Identificatori tipizzati: un numero associato a User non deve essere confuso con uno associato a Order.
- Wrapper di puntatori o handle con una relazione di prestito che non compare nei campi runtime.
- Stati o ruoli type-level, con API che controllano le transizioni.
- Controllo deliberato di varianza e auto trait nelle astrazioni avanzate.

Se devi conservare e leggere un dato preso in prestito, preferisci un vero `&'a T` quando basta. Per ownership effettiva, valuta un campo `T`, `Box<T>` o un altro proprietario esistente.

## Come funziona

### Relazione statica, non risorsa runtime

`PhantomData` e sia il nome del tipo sia il valore con cui inizializzare il campo. `PhantomData::<T>` rende esplicito il parametro.

Il marker ha dimensione 0 e allineamento 1, anche per `T` non Sized. Questo non rende zero-sized l'intero wrapper e non certifica il suo layout per FFI. [Layout di PhantomData](https://doc.rust-lang.org/std/marker/struct.PhantomData.html#layout).

### Scegliere la forma

La tabella descrive il **contributo del solo campo marker**, non il risultato garantito per qualsiasi struttura che lo contiene.

| Campo | Effetti |
| --- | --- |
| `PhantomData<T>` | Covariante in T. Send/Sync seguono T. |
| `PhantomData<&'a T>` | Covariante in T. Send e Sync se T: Sync. |
| `PhantomData<&'a mut T>` | Invariante in T. Send se T: Send; Sync se T: Sync. |
| `PhantomData<*const T>` | Covariante in T. Non Send, non Sync. |
| `PhantomData<*mut T>` | Invariante in T. Non Send, non Sync. |
| `PhantomData<fn() -> T>` | Covariante in T. Send e Sync senza bound su T. |
| `PhantomData<fn(T)>` | Contravariante in T. Send e Sync senza bound su T. |
| `PhantomData<fn(T) -> T>` | Invariante in T. Send e Sync senza bound su T. |

Le due forme con riferimenti sono covarianti nel lifetime esterno `'a`; `&'a mut T` e invece invariante in **T**. Le forme con function pointer non contengono una funzione e non esprimono ownership di T. [Rust Reference: varianza](https://doc.rust-lang.org/reference/subtyping.html), [Rustonomicon: forme del marker](https://doc.rust-lang.org/nomicon/phantom-data.html#table-of-phantomdata-patterns).

### Auto trait e altri campi

Un campo `PhantomData<fn() -> T>` non rende Send una struttura che contiene anche `Rc<T>` o un raw pointer. Si devono considerare tutti i campi. Non scegliere una forma soltanto per aggirare un errore del compilatore se contraddice la relazione con la risorsa. [Send](https://doc.rust-lang.org/std/marker/trait.Send.html), [Sync](https://doc.rust-lang.org/std/marker/trait.Sync.html).

`PhantomData<T>` non propaga ogni proprieta di T: in particolare implementa Copy e Clone senza richiedere questi trait a T. Copy non implica Unpin: nella baseline `PhantomData<PhantomPinned>` e `!Unpin`, mentre `PhantomData<fn() -> PhantomPinned>` e Unpin. [Copy](https://doc.rust-lang.org/std/marker/trait.Copy.html#how-can-i-implement-copy), [Auto trait di PhantomData](https://doc.rust-lang.org/std/marker/struct.PhantomData.html#synthetic-implementations).

Per dichiarare esplicitamente che un wrapper non deve implementare automaticamente Unpin, usa un campo `PhantomPinned`. La presenza del campo non realizza da sola il pinning. [PhantomPinned](https://doc.rust-lang.org/std/marker/struct.PhantomPinned.html).

## API / Sintassi

Ogni blocco e un programma autonomo; quelli nella sezione Errori comuni sono intenzionalmente invalidi.

### Dimensione e assenza di un valore T

```rust
use std::marker::PhantomData;
use std::mem::{align_of, needs_drop, size_of};

fn require_copy<T: Copy>() {}

fn main() {
    let marker: PhantomData<String> = PhantomData;
    let _copy = marker;
    let _again = marker;

    require_copy::<PhantomData<String>>();
    assert_eq!(size_of::<PhantomData<String>>(), 0);
    assert_eq!(align_of::<PhantomData<String>>(), 1);
    assert_eq!(size_of::<PhantomData<str>>(), 0);
    assert!(!needs_drop::<PhantomData<String>>());
}
```

Nessuna String viene costruita o distrutta. Il risultato riguarda il marker, non un ipotetico puntatore posseduto accanto a esso.

## Esempio pratico

### Identificatori senza ownership di T

```rust
use std::marker::PhantomData;

struct User;
struct Order;

struct Id<T> {
    value: u64,
    _kind: PhantomData<fn() -> T>,
}

impl<T> Id<T> {
    fn new(value: u64) -> Self {
        Self { value, _kind: PhantomData }
    }
}

impl<T> Copy for Id<T> {}

impl<T> Clone for Id<T> {
    fn clone(&self) -> Self {
        *self
    }
}

fn user_number(id: Id<User>) -> u64 {
    id.value
}

fn main() {
    let user = Id::<User>::new(42);
    let order = Id::<Order>::new(42);

    assert_eq!(user_number(user), 42);
    assert_eq!(user_number(user), 42);
    assert_eq!(order.value, 42);
}
```

Il numero puo coincidere, i tipi no. Qui T e soltanto un'etichetta: l'ID non contiene, possiede o prende in prestito un User. Non verifica che il numero esista in un database e non rappresenta un'autorizzazione.

Copy e Clone sono implementati manualmente per non richiedere che User sia Copy/Clone. Un derive sul wrapper puo imporre bound superflui: controlla anche le implementazioni derivate di Debug, confronto e Hash prima di esporle come contratto pubblico. [Clone: derive e bound](https://doc.rust-lang.org/std/clone/trait.Clone.html#derivable).

### Descrittore legato a una slice

```rust
use std::marker::PhantomData;

mod view {
    use super::PhantomData;

    pub struct SliceView<'a, T> {
        ptr: *const T,
        len: usize,
        _borrow: PhantomData<&'a T>,
    }

    impl<'a, T> SliceView<'a, T> {
        pub fn new(source: &'a [T]) -> Self {
            Self {
                ptr: source.as_ptr(),
                len: source.len(),
                _borrow: PhantomData,
            }
        }

        pub fn len(&self) -> usize {
            self.len
        }

        pub fn as_ptr(&self) -> *const T {
            self.ptr
        }
    }
}

use view::SliceView;

fn main() {
    let values = vec![10, 20, 30];
    let view = SliceView::new(&values);

    assert_eq!(view.len(), 3);
    assert_eq!(view.as_ptr(), values.as_ptr());
}
```

La firma del costruttore lega `'a` alla slice; i campi privati impediscono al chiamante di inventare un descrittore incoerente. Il marker da solo non collega automaticamente il puntatore a un dato concreto.

Questo esempio espone soltanto indirizzo e lunghezza: **non e una implementazione completa di una slice**. Non dereferenzia il raw pointer e non contiene unsafe. Estrarre il puntatore elimina dal tipo del risultato il lifetime: non autorizza a usarlo dopo la distruzione del proprietario.

Non vengono implementati Send/Sync: il campo raw pointer ne impedisce la derivazione automatica. Aggiungere il marker di prestito non cambia questa proprieta del puntatore. Per una normale vista leggibile, conserva direttamente `&'a [T]`.

## Varianti

### Verificare i bound senza avviare thread

```rust
use std::cell::Cell;
use std::marker::PhantomData;
use std::rc::Rc;

struct Label<T>(PhantomData<fn() -> T>);

fn require_send<T: Send>() {}
fn require_sync<T: Sync>() {}

fn main() {
    require_send::<PhantomData<String>>();
    require_sync::<PhantomData<String>>();
    require_send::<PhantomData<&'static String>>();
    require_sync::<PhantomData<&'static String>>();
    require_send::<PhantomData<&'static mut Cell<u8>>>();

    require_send::<Label<Rc<()>>>();
    require_sync::<Label<Rc<()>>>();
}
```

Label non contiene un Rc reale: il suo parametro e soltanto un'etichetta. La prova controlla i bound statici, non esegue operazioni concorrenti. `&mut Cell<u8>` e Send ma non Sync: mutabilita esclusiva e condivisione sono contratti distinti. [Sync: riferimenti](https://doc.rust-lang.org/std/marker/trait.Sync.html).

### Verificare la direzione della varianza

```rust
use std::marker::PhantomData;

struct Output<T>(PhantomData<fn() -> T>);
struct Input<T>(PhantomData<fn(T)>);

fn shorten<'long: 'short, 'short>(
    value: Output<&'long str>,
) -> Output<&'short str> {
    value
}

fn lengthen_input<'long: 'short, 'short>(
    value: Input<&'short str>,
) -> Input<&'long str> {
    value
}

fn main() {
    let output = Output::<&'static str>(PhantomData);
    let _shortened = shorten(output);
    let input = Input::<&str>(PhantomData);
    let _longer = lengthen_input(input);
}
```

Sono le firme generiche a verificare il verso delle conversioni, non una misura runtime. Covarianza conserva la relazione fra lifetime, contravarianza la inverte; invarianza non permette di ricavare quel sottotipo. Non significa che User diventi convertibile in Order. [Subtyping](https://doc.rust-lang.org/reference/subtyping.html).

### Ownership logica e drop check

Un wrapper con `ptr: *mut T` e `_owner: PhantomData<T>` dichiara una relazione di ownership logica, ma non libera il puntatore. Allocazione, validita, distruzione e deallocazione restano responsabilita dell'implementazione. Non aggiungere un Drop che ricostruisce un Box senza averne rispettato il contratto.

La vecchia regola "ogni proprietario con puntatore deve aggiungere PhantomData per il drop checker" e incompleta: un `impl<T> Drop` induce gia controlli conservativi sull'uso di T durante la distruzione. Il marker puo restare necessario per altri aspetti. [Rustonomicon: drop checking](https://doc.rust-lang.org/nomicon/phantom-data.html#generic-parameters-and-drop-checking).

Non ridurre il drop check al solo marker: contano il distruttore e la distruzione ricorsiva dei campi. `#[may_dangle]` e un meccanismo instabile avanzato, non una correzione da aggiungere ai demo. [Drop: controlli di validita](https://doc.rust-lang.org/std/ops/trait.Drop.html#drop-check).

## Errori comuni

I sei programmi seguenti **non compilano intenzionalmente**.

### Parametro non usato nei campi

```rust
struct Id<T> {
    value: u64,
}

fn main() {}
```

Errore E0392: T non compare nella rappresentazione del tipo. Scegli un marker coerente, un campo reale o elimina il parametro; un impl separato non sostituisce il campo.

### Mescolare identificatori

```rust
use std::marker::PhantomData;

struct User;
struct Order;
struct Id<T>(u64, PhantomData<fn() -> T>);

fn accept_user(_: Id<User>) {}

fn main() {
    let order = Id::<Order>(42, PhantomData);
    accept_user(order);
}
```

Errore E0308. La correzione non e un cast arbitrario: usa l'identificatore del dominio corretto o una conversione deliberata e validata.

### Far uscire una relazione di prestito

```rust
use std::marker::PhantomData;

struct View<'a>(PhantomData<&'a [u8]>);

fn borrow(source: &[u8]) -> View<'_> {
    let _ = source;
    View(PhantomData)
}

fn invalid() -> View<'static> {
    let local = vec![1, 2, 3];
    borrow(&local)
}

fn main() {}
```

Errore E0515: la firma mantiene la dipendenza dai dati locali anche se il marker non conserva un indirizzo. Un costruttore che restituisse arbitrariamente `View<'static>` eliminerebbe quella garanzia. In codice safe il marker vuoto non causa da solo UB, ma non deve diventare una falsa prova per dereferenziare un puntatore.

### Confondere marker Send con contenuto Send

```rust
use std::marker::PhantomData;
use std::rc::Rc;

fn require_send<T: Send>() {}

fn main() {
    require_send::<PhantomData<Rc<()>>>();
}
```

Errore E0277: questa forma segue Rc. Usa `fn() -> T` solo se T e realmente un'etichetta senza ownership; non e un espediente per trasferire un Rc fra thread.

### Derive che richiede Copy al parametro

```rust
use std::marker::PhantomData;

struct User;

#[derive(Copy, Clone)]
struct Id<T>(u64, PhantomData<fn() -> T>);

fn require_copy<T: Copy>() {}

fn main() {
    require_copy::<Id<User>>();
}
```

Errore E0277: il derive impone User: Copy. Le implementazioni manuali dell'esempio valido copiano soltanto il numero e il marker, senza copiare un User. [Copy: derive](https://doc.rust-lang.org/std/marker/trait.Copy.html#how-can-i-implement-copy).

### Ignorare la distruzione implicita

```rust
use std::marker::PhantomData;

struct Guard<'a>(PhantomData<&'a str>);

impl Drop for Guard<'_> {
    fn drop(&mut self) {}
}

fn guard(_: &str) -> Guard<'_> {
    Guard(PhantomData)
}

fn main() {
    let source = String::from("data");
    let _guard = guard(&source);
    drop(source);
}
```

Errore E0505: Guard verra distrutta dopo la riga che tenta di consumare source. Anche con corpo Drop vuoto, il controllo e conservativo. Distruggi prima la guardia o organizza gli scope; non prolungare artificialmente il lifetime.

Senza un distruttore rilevante, non presumere invece che ogni marker mantenga il prestito fino alla parentesi finale: liveness e drop check sono distinti. [Drop check](https://doc.rust-lang.org/std/ops/trait.Drop.html#drop-check).

## Checklist

- T rappresenta un'etichetta, un prestito o ownership logica?
- Il costruttore collega davvero i lifetime ai dati?
- I campi privati preservano gli invarianti dichiarati?
- Ho considerato varianza e tutti i campi per Send/Sync?
- I derive introducono bound superflui?
- Il proprietario reale gestisce le risorse, indipendentemente dal marker?
- Ho distinto PhantomData, PhantomPinned e pinning?
- Potrei usare un riferimento o uno smart pointer esistente?

## Collegamenti

- [[Programmazione/Rust/Pagine/Zero-sized types|Zero-sized types]]
- [[Programmazione/Rust/Pagine/Marker types|Marker types]]
- [[Programmazione/Rust/Pagine/Typestate pattern|Typestate pattern]]
- [[Programmazione/Rust/Pagine/Lifetimes avanzati|Lifetimes avanzati]]
- [[Programmazione/Rust/Pagine/Derive traits|Derive traits]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop Trait]]
- [[Programmazione/Rust/Pagine/Pin e Unpin|Pin e Unpin]]
- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]

## Fonti

- [Standard library: PhantomData](https://doc.rust-lang.org/std/marker/struct.PhantomData.html).
- [Rust Reference: subtyping e variance](https://doc.rust-lang.org/reference/subtyping.html).
- [Rustonomicon: PhantomData](https://doc.rust-lang.org/nomicon/phantom-data.html).
- [Standard library: Send](https://doc.rust-lang.org/std/marker/trait.Send.html) e [Sync](https://doc.rust-lang.org/std/marker/trait.Sync.html).
- [Standard library: Copy](https://doc.rust-lang.org/std/marker/trait.Copy.html) e [Clone](https://doc.rust-lang.org/std/clone/trait.Clone.html).
- [Standard library: Drop](https://doc.rust-lang.org/std/ops/trait.Drop.html#drop-check) e [PhantomPinned](https://doc.rust-lang.org/std/marker/struct.PhantomPinned.html).

Consultate il 2026-11-17. La documentazione online puo avanzare rispetto alla toolchain di prova; nessuna feature nightly usata.

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
