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
  - Marker types
  - Tipi marker
prerequisites:
  - "[[Programmazione/Rust/Pagine/Zero-sized types]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/PhantomData]]"
related:
  - "[[Programmazione/Rust/Pagine/Typestate pattern]]"
  - "[[Programmazione/Rust/Pagine/Newtype pattern]]"
  - "[[Programmazione/Rust/Pagine/Send e Sync Traits]]"
title: Marker types
---

# Marker types

## Sintesi

Un **marker type** e un tipo usato per distinguere un ruolo, uno stato o un'unita di misura nel sistema dei tipi. Spesso e una unit struct senza dati, associata a un wrapper tramite `PhantomData`.

Il marker non dimostra da solo che il contenuto sia valido: la garanzia dipende da costruttori, visibilita e operazioni disponibili. Due etichette diverse possono impedire uno scambio accidentale senza eseguire alcun controllo sui dati. [Rust By Example: phantom types](https://doc.rust-lang.org/rust-by-example/generics/phantom.html).

Esempi verificati con **Rust 1.99.1, edition 2024**, sola standard library: quattro programmi validi e tre controesempi dichiarati. La baseline non e una MSRV.

## Quando usarlo

- Impedire di sommare valori con unita incompatibili.
- Rendere disponibile un'operazione soltanto dopo una transizione valida.
- Distinguere modalita di utilizzo di un'API.
- Raggruppare i tipi ammessi a un'operazione mediante un bound.

Per pochi valori di dominio puo bastare un newtype. Per stati scelti e conservati dinamicamente puo essere piu semplice una enum. Non aggiungere un parametro generico se non cambia alcun contratto utile.

## Come funziona

### Concetti da non confondere

| Concetto | Significato |
| --- | --- |
| Tipo marker | Un tipo come Raw, Meters o ReadOnly |
| PhantomData | Il campo che associa il parametro senza conservarne un valore |
| Trait marker | Un trait senza metodi, usato come bound |
| Auto trait | Un trait con regole speciali del compilatore, come Send |
| Stato runtime | Un valore da controllare durante l'esecuzione |

Un `trait Trusted {}` e un normale trait: non viene implementato automaticamente solo perche i campi lo implementano. La mancanza di metodi non rende un trait auto, unsafe o una garanzia di autorizzazione. [Rust Reference: auto traits](https://doc.rust-lang.org/reference/special-types-and-traits.html#auto-traits).

### Identita e rappresentazione

`Quantity<Meters>` e `Quantity<Seconds>` sono tipi diversi. Due alias dello stesso tipo non creano invece questa distinzione: `type Meters = f64` e `type Seconds = f64` restano entrambi f64. [Type aliases](https://doc.rust-lang.org/reference/items/type-aliases.html).

Il campo marker puo occupare zero byte; il wrapper contiene comunque i suoi dati. Non dedurre un ABI FFI, il layout esatto del wrapper o prestazioni migliori dal solo nome "zero-sized". Le funzioni generiche possono essere monomorfizzate; validazione, calcoli e allocazioni restano operazioni runtime.

## API / Sintassi

Ogni blocco valido e un programma autonomo.

### Marker abitabile e marker non abitabile

```rust
use std::marker::PhantomData;
use std::mem::size_of;

struct Ready;
enum Pending {}

struct Tagged<State>(PhantomData<fn() -> State>);

fn main() {
    let _ready = Ready;
    let _pending_tag = Tagged::<Pending>(PhantomData);

    assert_eq!(size_of::<Ready>(), 0);
    assert_eq!(size_of::<Tagged<Pending>>(), 0);
}
```

Ready ha un valore costruibile. Pending non ha varianti: non puoi costruirne un valore ordinario, ma puoi nominarlo come parametro generico. Tagged non contiene un Pending, quindi l'enum vuota **non impedisce** di costruire il wrapper. Sono i costruttori e i campi privati a controllarlo.

Nei demo T e un'etichetta, per questo si usa `PhantomData<fn() -> T>`. Per ownership o prestiti logici servono altre scelte; vedi [[Programmazione/Rust/Pagine/PhantomData|PhantomData]]. [Enum senza varianti](https://doc.rust-lang.org/reference/items/enumerations.html#zero-variant-enums).

## Esempio pratico

### Quantita con unita distinte

```rust
mod units {
    use std::marker::PhantomData;

    pub struct Meters;
    pub struct Kilometers;
    pub struct Seconds;

    pub struct Quantity<Unit> {
        value: f64,
        _unit: PhantomData<fn() -> Unit>,
    }

    impl<Unit> Quantity<Unit> {
        pub fn new(value: f64) -> Option<Self> {
            if !value.is_finite() || value < 0.0 {
                return None;
            }
            Some(Self { value, _unit: PhantomData })
        }

        pub fn value(&self) -> f64 {
            self.value
        }

        pub fn checked_add(self, other: Self) -> Option<Self> {
            Self::new(self.value + other.value)
        }
    }

    impl Quantity<Kilometers> {
        pub fn into_meters(self) -> Option<Quantity<Meters>> {
            Quantity::new(self.value * 1000.0)
        }
    }
}

use units::{Kilometers, Meters, Quantity};

fn main() {
    let a = Quantity::<Meters>::new(250.0).unwrap();
    let b = Quantity::<Meters>::new(750.0).unwrap();
    let total = a.checked_add(b).unwrap();
    assert_eq!(total.value(), 1000.0);

    let km = Quantity::<Kilometers>::new(1.5).unwrap();
    assert_eq!(km.into_meters().unwrap().value(), 1500.0);
    assert!(Quantity::<Meters>::new(f64::NAN).is_none());
    assert!(Quantity::<Meters>::new(-1.0).is_none());
}
```

La policy di questo esempio ammette soltanto valori finiti non negativi, incluso -0.0: e adatta a distanze e durate, non a ogni grandezza fisica.

Il tipo impedisce di aggiungere Seconds a Meters. Non impedisce al chiamante di etichettare erroneamente un numero letto dall'esterno: quella responsabilita resta al confine di input.

`checked_add` e un metodo del demo, non un'API f64 standard: rifiuta risultati non finiti, ma non elimina arrotondamenti o perdita di precisione. La conversione moltiplica davvero il valore; cambiare solo il marker non convertirebbe l'unita. Non sono implementati algebra dimensionale o operatori fra grandezze diverse. [f64 e is_finite](https://doc.rust-lang.org/std/primitive.f64.html#method.is_finite).

### Validazione con transizione controllata

Un controllo come `email.contains('@')` accetta anche `"@"`: non valida un indirizzo email. Il demo seguente usa invece una policy locale dichiarata: **3..=32 byte, soltanto lettere ASCII, cifre e underscore**. Non verifica unicita, identita o autorizzazioni.

```rust
mod names {
    use std::marker::PhantomData;

    pub struct Raw;
    pub struct Validated;

    #[derive(Debug, PartialEq, Eq)]
    pub enum ValidationError {
        Length,
        Characters,
    }

    pub struct Username<State> {
        value: String,
        _state: PhantomData<fn() -> State>,
    }

    impl Username<Raw> {
        pub fn new(value: String) -> Self {
            Self { value, _state: PhantomData }
        }

        pub fn validate(
            self,
        ) -> Result<Username<Validated>, (Self, ValidationError)> {
            let error = if !(3..=32).contains(&self.value.len()) {
                Some(ValidationError::Length)
            } else if !self.value.bytes().all(|b| {
                b.is_ascii_alphanumeric() || b == b'_'
            }) {
                Some(ValidationError::Characters)
            } else {
                None
            };

            if let Some(error) = error {
                return Err((self, error));
            }
            Ok(Username {
                value: self.value,
                _state: PhantomData,
            })
        }
    }

    impl Username<Validated> {
        pub fn as_str(&self) -> &str {
            &self.value
        }
    }

    impl<State> Username<State> {
        pub fn into_inner(self) -> String {
            self.value
        }
    }
}

use names::{Raw, Username, ValidationError};

fn main() {
    let raw = Username::<Raw>::new("luca_42".to_owned());
    let valid = raw.validate()
        .unwrap_or_else(|_| panic!("valid demo input"));
    assert_eq!(valid.as_str(), "luca_42");

    let bad = Username::<Raw>::new("a@b".to_owned());
    let (original, error) = match bad.validate() {
        Err(failure) => failure,
        Ok(_) => panic!("invalid demo input"),
    };
    assert_eq!(error, ValidationError::Characters);
    assert_eq!(original.into_inner(), "a@b");
}
```

La validazione avviene a runtime. Il risultato positivo cambia il tipo, spostando la stessa String; quello negativo restituisce input e motivo del rifiuto. Non vengono rimossi spazi o modificati maiuscole e minuscole. Per caratteri non ASCII questa policy rifiuta il nome, non lo normalizza. [Controlli ASCII su u8](https://doc.rust-lang.org/std/primitive.u8.html#method.is_ascii_alphanumeric).

Il modulo espone il costruttore soltanto per Raw; i campi sono privati. All'esterno non puoi creare direttamente un Username validato o modificarne la String tramite `as_str`. Un ipotetico getter mutabile potrebbe distruggere la garanzia.

`into_inner` consuma il wrapper e restituisce una String ordinaria: l'informazione di validazione non e piu nel tipo. Deserializzazione o altri costruttori devono rispettare la stessa policy. I moduli figli del modulo proprietario possono accedere ai campi privati: fanno parte del confine di implementazione da controllare. [Privacy](https://doc.rust-lang.org/reference/visibility-and-privacy.html).

## Varianti

### Trait marker con insieme di implementazioni chiuso

```rust
mod buffers {
    use std::marker::PhantomData;

    pub struct ReadOnly;
    pub struct Writable;

    mod sealed {
        pub trait Sealed {}
    }

    pub trait CanWrite: sealed::Sealed {}
    impl sealed::Sealed for Writable {}
    impl CanWrite for Writable {}

    pub struct Buffer<Mode> {
        data: String,
        _mode: PhantomData<fn() -> Mode>,
    }

    impl Buffer<Writable> {
        pub fn new() -> Self {
            Self { data: String::new(), _mode: PhantomData }
        }

        pub fn freeze(self) -> Buffer<ReadOnly> {
            Buffer { data: self.data, _mode: PhantomData }
        }
    }

    impl<Mode: CanWrite> Buffer<Mode> {
        pub fn append(&mut self, text: &str) {
            self.data.push_str(text);
        }
    }

    impl<Mode> Buffer<Mode> {
        pub fn contents(&self) -> &str {
            &self.data
        }
    }
}

use buffers::{Buffer, Writable};

fn main() {
    let mut buffer = Buffer::<Writable>::new();
    buffer.append("Rust");
    buffer.append(" notes");
    let frozen = buffer.freeze();
    assert_eq!(frozen.contents(), "Rust notes");
}
```

CanWrite e un trait marker ordinario: il bound rende disponibile append. Il supertrait in un modulo privato impedisce a un chiamante esterno al modulo di aggiungere liberamente altri tipi ammessi. In una libreria lo stesso pattern puo chiudere le implementazioni alle crate downstream, purche il supertrait non venga riesposto. [Rust API Guidelines: sealed traits](https://rust-lang.github.io/api-guidelines/future-proofing.html#sealed-traits-protect-against-downstream-implementations-c-sealed).

`freeze(self)` consuma il buffer scrivibile e trasferisce la String al buffer di sola lettura. E una restrizione dell'API in memoria: non modifica permessi del sistema operativo e non autentica l'utente.

### Stati type-level rispetto a stato runtime

Una firma come `Client<Disconnected> -> Result<Client<Connected>, Error>` ha senso solo se la transizione esegue davvero l'operazione dichiarata. Il marker Connected non mantiene attiva per sempre una connessione: gli errori I/O successivi restano possibili.

Due rami runtime che producono wrapper con marker diversi non restituiscono automaticamente lo stesso tipo. Puoi usare una enum che contenga i due casi, un'astrazione comune o effettuare l'operazione dentro ciascun ramo. Il typestate riduce alcune sequenze invalide, non elimina tutti i controlli runtime. [Rust Book: stati e tipi](https://doc.rust-lang.org/book/ch18-03-oo-design-patterns.html#encoding-states-and-behavior-as-types).

## Errori comuni

I tre programmi seguenti **non compilano intenzionalmente**; isolano il vincolo di tipo, non ripetono tutte le API dei demo.

### Mescolare unita diverse

```rust
use std::marker::PhantomData;

struct Meters;
struct Seconds;
struct Quantity<U>(f64, PhantomData<fn() -> U>);

fn distance(_: Quantity<Meters>) {}

fn main() {
    let duration = Quantity::<Seconds>(10.0, PhantomData);
    distance(duration);
}
```

Errore E0308: stessa rappresentazione numerica non significa stessa unita. Una conversione deve avere significato nel dominio; durata e distanza non sono convertibili senza ulteriori dati.

### Chiamare un metodo nello stato sbagliato

```rust
use std::marker::PhantomData;

struct Raw;
struct Validated;
struct Name<State>(String, PhantomData<fn() -> State>);

impl Name<Validated> {
    fn as_str(&self) -> &str {
        &self.0
    }
}

fn main() {
    let raw = Name::<Raw>("abc".to_owned(), PhantomData);
    let _text = raw.as_str();
}
```

Errore E0599: as_str non e definito per Raw. Nel demo completo bisogna passare da validate e gestire il Result; aggiungere il metodo indiscriminatamente cambierebbe il contratto.

### Aspettarsi la propagazione di un trait ordinario

```rust
trait Trusted {}

struct Inner;
impl Trusted for Inner {}

struct Wrapper(Inner);

fn require_trusted<T: Trusted>() {}

fn main() {
    require_trusted::<Wrapper>();
}
```

Errore E0277: Wrapper non implementa Trusted soltanto perche lo implementa Inner. Un impl esplicito e una decisione dell'autore, non una validazione effettuata dal compilatore.

Altri errori da evitare:

- Esportare i campi del wrapper o un costruttore generico che permetta qualunque stato.
- Confondere il nome Validated con una prova che la policy sia corretta o completa.
- Usare un marker public come credenziale o confine di sicurezza.
- Presumere Copy/Clone senza controllare i bound introdotti dai derive.
- Credere che un alias o una conversione che cambia solo il tag cambi i dati.
- Inserire PhantomData con forma arbitraria: varianza, auto trait e ownership logica restano rilevanti.
- Aggiungere stati e trait quando bastano un newtype o una enum.

## Checklist

- Quale errore concreto impedisce il marker?
- La policy runtime e esplicita e verificabile?
- Le transizioni preservano dati e invarianti anche in caso di errore?
- Costruttori, setter e deserializzazione possono saltare i controlli?
- Il parametro e un'etichetta o rappresenta ownership/prestiti?
- Il trait deve essere aperto o sealed?
- Ho distinto costo del marker da costo del contenitore?
- Una scelta runtime richiede un tipo comune esplicito?

## Collegamenti

- [[Programmazione/Rust/Pagine/Zero-sized types|Zero-sized types]]
- [[Programmazione/Rust/Pagine/PhantomData|PhantomData]]
- [[Programmazione/Rust/Pagine/Typestate pattern|Typestate pattern]]
- [[Programmazione/Rust/Pagine/Newtype pattern|Newtype pattern]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Derive traits|Derive traits]]
- [[Programmazione/Rust/Pagine/Visibilita pub use e mod|Visibilita, pub, use e mod]]

## Fonti

- [Rust By Example: phantom type parameters](https://doc.rust-lang.org/rust-by-example/generics/phantom.html).
- [Rust Reference: auto traits](https://doc.rust-lang.org/reference/special-types-and-traits.html#auto-traits), [type aliases](https://doc.rust-lang.org/reference/items/type-aliases.html) e [zero-variant enums](https://doc.rust-lang.org/reference/items/enumerations.html#zero-variant-enums).
- [Rust Reference: visibility and privacy](https://doc.rust-lang.org/reference/visibility-and-privacy.html).
- [Rust API Guidelines: sealed traits](https://rust-lang.github.io/api-guidelines/future-proofing.html#sealed-traits-protect-against-downstream-implementations-c-sealed).
- [Rust Book: encoding states as types](https://doc.rust-lang.org/book/ch18-03-oo-design-patterns.html#encoding-states-and-behavior-as-types).
- [Standard library: f64](https://doc.rust-lang.org/std/primitive.f64.html#method.is_finite) e [controlli ASCII](https://doc.rust-lang.org/std/primitive.u8.html#method.is_ascii_alphanumeric).

Consultate il 2026-11-17. Le pagine online possono avanzare rispetto alla toolchain di prova; nessuna feature nightly usata.

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
