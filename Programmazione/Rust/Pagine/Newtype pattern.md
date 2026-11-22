---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - api-design-idiomatico
aliases:
  - Newtype
  - Newtype pattern
prerequisites:
  - "[[Programmazione/Rust/Pagine/Tuple structs]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Derive traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Public API design]]"
  - "[[Programmazione/Rust/Pagine/Marker types]]"
  - "[[Programmazione/Rust/Pagine/Typestate pattern]]"
  - "[[Programmazione/Rust/Pagine/Deref Trait]]"
title: Newtype pattern
---

# Newtype pattern

## Sintesi

Un **newtype** e un tipo distinto che avvolge una rappresentazione esistente, spesso tramite una tuple struct a un campo. Serve a separare concetti di dominio e decidere quali operazioni esporre.

Non aggiunge automaticamente validazione, delega dei metodi o conversioni. La garanzia deriva dall'intera API: un campo privato puo essere esposto da un metodo che viola il contratto.

Esempi verificati con **Rust 1.99.1, edition 2024**, sola standard library: cinque programmi validi e tre controesempi dichiarati. La baseline non e una MSRV.

## Quando usarlo

- Distinguere identificatori con la stessa rappresentazione numerica.
- Accettare soltanto valori che soddisfano una policy.
- Esporre una vista o una formattazione diversa di un tipo esistente.
- Implementare un trait esterno su un tipo locale.
- Nascondere la rappresentazione di un'API pubblica.

Se serve soltanto abbreviare un tipo, un alias puo bastare. Per molti ruoli correlati valuta un wrapper generico con marker, senza moltiplicare tipi inutilmente.

## Come funziona

### Identita e conversioni

| Scelta | Effetto |
| --- | --- |
| Alias | Altro nome dello stesso tipo |
| Newtype | Tipo distinto, API propria |
| From | Conversione infallibile esplicita |
| TryFrom | Conversione con possibile errore |
| AsRef | Vista presa in prestito |

Un alias come `type UserId = u64` non impedisce di passare un numero usato come OrderId. Una struct distinta si. Anche con identica rappresentazione, il compilatore non inserisce automaticamente una conversione per valore. [Type aliases](https://doc.rust-lang.org/reference/items/type-aliases.html).

Implementare From fornisce anche Into; TryFrom fornisce TryInto. Si chiamano esplicitamente e non implicano necessariamente clonazione o allocazione. From non dovrebbe fare panic per input non ammesso: in quel caso serve una conversione fallibile. [From](https://doc.rust-lang.org/std/convert/trait.From.html), [TryFrom](https://doc.rust-lang.org/std/convert/trait.TryFrom.html).

### Il confine degli invarianti

Un campo privato impedisce costruzione e accesso diretto **dall'esterno del modulo proprietario**; quel modulo e i suoi discendenti possono accedervi. Il compilatore non dimostra che tutti i metodi mantengano la policy.

Controlla costruttori, setter, conversioni, trait derivati e deserializzazione. Derivare Default su un wrapper che richiede una String non vuota puo creare proprio una stringa vuota, senza passare dal costruttore. [Privacy](https://doc.rust-lang.org/reference/visibility-and-privacy.html).

## API / Sintassi

Ogni blocco valido e un programma autonomo.

### Identificatori di dominio

UserId separa il dominio, ma qui **ogni u64 e ammesso**, incluso zero: non certifica l'esistenza dell'utente nel database.

```rust
mod ids {
    #[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
    pub struct UserId(u64);

    #[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
    pub struct OrderId(u64);

    impl UserId {
        pub fn new(value: u64) -> Self {
            Self(value)
        }

        pub fn get(self) -> u64 {
            self.0
        }
    }

    impl OrderId {
        pub fn new(value: u64) -> Self {
            Self(value)
        }
    }

    pub fn user_number(id: UserId) -> u64 {
        id.get()
    }
}

use ids::{UserId, user_number};

fn main() {
    let id = UserId::new(42);
    assert_eq!(user_number(id), 42);
    assert_eq!(id.get(), 42);
}
```

I derive sono scelte esplicite, non ereditarieta. Copy e adatto a questo identificatore numerico, non a una struct che possiede una String. I bound dei wrapper generici vanno valutati separatamente: [[Programmazione/Rust/Pagine/Derive traits|Derive traits]].

### Stringa non vuota con aggiornamento validato

```rust
mod text {
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct NonEmptyString(String);

    #[derive(Debug, PartialEq, Eq)]
    pub struct EmptyStringError;

    impl TryFrom<String> for NonEmptyString {
        type Error = EmptyStringError;

        fn try_from(value: String) -> Result<Self, Self::Error> {
            if value.is_empty() {
                return Err(EmptyStringError);
            }
            Ok(Self(value))
        }
    }

    impl NonEmptyString {
        pub fn as_str(&self) -> &str {
            &self.0
        }

        pub fn try_replace(
            &mut self,
            value: String,
        ) -> Result<(), EmptyStringError> {
            let next = Self::try_from(value)?;
            *self = next;
            Ok(())
        }

        pub fn into_inner(self) -> String {
            self.0
        }
    }

    impl AsRef<str> for NonEmptyString {
        fn as_ref(&self) -> &str {
            self.as_str()
        }
    }
}

use text::{EmptyStringError, NonEmptyString};

fn main() {
    let mut name = NonEmptyString::try_from("Luca".to_owned()).unwrap();
    assert_eq!(name.try_replace(String::new()), Err(EmptyStringError));
    assert_eq!(name.as_str(), "Luca");

    name.try_replace("Ada".to_owned()).unwrap();
    let view: &str = name.as_ref();
    assert_eq!(view, "Ada");
    assert_eq!(name.into_inner(), "Ada");
}
```

La policy e solo **almeno un byte UTF-8**: spazi, newline e caratteri Unicode non vuoti sono ammessi. Non e un controllo su testo visibile, username o email. String garantisce gia UTF-8 valido.

TryFrom consuma l'input: il successo sposta la String senza clonarla, mentre l'errore di questo demo non restituisce l'input. `try_replace` valida prima di sostituire il contenuto: un rifiuto lascia il wrapper invariato. `into_inner` consuma il wrapper e restituisce una String senza vincolo nel tipo.

AsRef offre una vista esplicita, non una conversione automatica a &str. Non sono implementati Default, DerefMut o accesso a &mut String. Anche eventuali impl di deserializzazione devono validare. La variante con Deref e nella [[Programmazione/Rust/Pagine/Deref Trait|nota dedicata]].

## Esempio pratico

### Temperature intere senza troncamento silenzioso

Il demo mantiene la rappresentazione intera: ammette solo risultati Fahrenheit **esatti e rappresentabili in i32**. Non arrotonda: 1 grado Celsius richiederebbe 33,8 Fahrenheit e viene rifiutato.

```rust
mod temperatures {
    #[derive(Debug, Copy, Clone, PartialEq, Eq)]
    pub struct Celsius(i32);

    #[derive(Debug, Copy, Clone, PartialEq, Eq)]
    pub struct Fahrenheit(i32);

    #[derive(Debug, PartialEq, Eq)]
    pub enum ConversionError {
        FractionalDegree,
        OutOfRange,
    }

    impl Celsius {
        pub fn new(value: i32) -> Self {
            Self(value)
        }
    }

    impl Fahrenheit {
        pub fn get(self) -> i32 {
            self.0
        }
    }

    impl TryFrom<Celsius> for Fahrenheit {
        type Error = ConversionError;

        fn try_from(value: Celsius) -> Result<Self, Self::Error> {
            let numerator = i64::from(value.0) * 9 + 160;
            if numerator % 5 != 0 {
                return Err(ConversionError::FractionalDegree);
            }

            let degrees = i32::try_from(numerator / 5)
                .map_err(|_| ConversionError::OutOfRange)?;
            Ok(Self(degrees))
        }
    }
}

use temperatures::{Celsius, ConversionError, Fahrenheit};

fn main() {
    assert_eq!(
        Fahrenheit::try_from(Celsius::new(100)).unwrap().get(),
        212,
    );
    assert_eq!(
        Fahrenheit::try_from(Celsius::new(-40)).unwrap().get(),
        -40,
    );
    assert_eq!(
        Fahrenheit::try_from(Celsius::new(1)),
        Err(ConversionError::FractionalDegree),
    );
    assert_eq!(
        Fahrenheit::try_from(Celsius::new(2_000_000_000)),
        Err(ConversionError::OutOfRange),
    );
}
```

La formula e `(C * 9 + 160) / 5`. Convertire a i64 **prima** della moltiplicazione evita overflow per ogni input i32; convertire dopo non correggerebbe un overflow gia avvenuto. Si controlla prima la parte frazionaria, poi il range del risultato.

Il tipo distingue l'unita, ma non sostituisce il calcolo. `value * 9 / 5 + 32` in i32 puo perdere la frazione o andare in overflow. La divisione intera tronca verso zero, non e una policy di arrotondamento universale. [Operatori numerici](https://doc.rust-lang.org/reference/expressions/operator-expr.html#arithmetic-and-logical-binary-operators).

E un esempio aritmetico, non un modello fisico: non impone lo zero assoluto, non gestisce decimali ne implementa la conversione inversa. Per altre esigenze scegli una rappresentazione e una policy di precisione adeguate.

## Varianti

### Trait esterno su wrapper locale

Una vista presa in prestito puo personalizzare la formattazione senza possedere o clonare il contenuto.

```rust
use std::fmt;

struct DisplayList<'a>(&'a [String]);

impl fmt::Display for DisplayList<'_> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("[")?;
        for (index, item) in self.0.iter().enumerate() {
            if index > 0 {
                f.write_str(", ")?;
            }
            f.write_str(item)?;
        }
        f.write_str("]")
    }
}

fn main() {
    let items = ["red".to_owned(), "green".to_owned()];
    let display = DisplayList(&items);
    assert_eq!(format!("{display}"), "[red, green]");
    assert_eq!(items.len(), 2);
}
```

Display e esterno, ma DisplayList e locale: l'impl rispetta la orphan rule. Non cambia l'implementazione di Vec o String e non rende formattabili con Display tutte le slice. Un alias di Vec non risolverebbe il problema.

Il wrapper non clona gli elementi; `format!` produce comunque una nuova String. Il formato e dimostrativo: non fa escaping e non promette un protocollo serializzabile o il rispetto di tutti i flag di formattazione.

Le regole di coerenza vietano anche impl sovrapposti. Con trait generici non basta dire "compare un tipo locale": contano la posizione del primo tipo locale e i parametri generici scoperti. [Coerenza degli impl](https://doc.rust-lang.org/reference/items/implementations.html#trait-implementation-coherence), [Rust Book: newtype](https://doc.rust-lang.org/book/ch20-02-advanced-traits.html#using-the-newtype-pattern-to-implement-external-traits-on-external-types).

### Layout esplicito con repr transparent

```rust
use std::mem::{align_of, size_of};

#[repr(transparent)]
struct Handle(u32);

fn main() {
    let handle = Handle(7);
    assert_eq!(handle.0, 7);
    assert_eq!(size_of::<Handle>(), size_of::<u32>());
    assert_eq!(align_of::<Handle>(), align_of::<u32>());
}
```

Qui `#[repr(transparent)]` garantisce layout e ABI del campo u32. In generale ammette al massimo un campo diverso da quelli di dimensione zero e allineamento uno; gli altri possono essere marker compatibili. Non e un attributo da aggiungere per una presunta ottimizzazione. [Layout transparent](https://doc.rust-lang.org/reference/type-layout.html#the-transparent-representation).

Il wrapper resta un tipo distinto, senza conversioni implicite. Le asserzioni verificano dimensione/allineamento sul target corrente, non eseguono chiamate FFI. L'ABI garantito deriva dalla specifica, non dalle misure.

Con rappresentazione predefinita non dedurre equivalenza ABI dal solo campo unico. Nemmeno transparent garantisce che una funzione esterna rispetti gli invarianti o che un tipo interno Rust sia adatto a una API C.

### API mirata, Deref e marker

- I metodi del tipo interno non sono automaticamente metodi del newtype.
- Deref va scelto per una semantica simile a un puntatore; non fa ereditare tutti i trait del target.
- Esporre &mut String, direttamente o tramite DerefMut, permetterebbe clear e puo rompere NonEmptyString. Il caso &mut str e diverso: le operazioni safe non ne cambiano la lunghezza.
- Un riferimento condiviso puo consentire interior mutability: controlla le operazioni reali, non soltanto la presenza di &mut.
- Un wrapper generico con PhantomData puo distinguere ruoli; e complementare al newtype. Vedi [[Programmazione/Rust/Pagine/Marker types|Marker types]] e [[Programmazione/Rust/Pagine/PhantomData|PhantomData]].

Validare, clonare, allocare e formattare non diventa gratuito. Il pattern non implica un'allocazione aggiuntiva, ma non certifica prestazioni o codice macchina identici. [Deref](https://doc.rust-lang.org/std/ops/trait.Deref.html).

## Errori comuni

I tre programmi seguenti **non compilano intenzionalmente**.

### Confondere due identificatori

```rust
struct UserId(u64);
struct OrderId(u64);

fn load_user(_: UserId) {}

fn main() {
    let order = OrderId(42);
    load_user(order);
}
```

E0308: serve l'identificatore corretto del dominio. Rinominare o ricopiare un numero non dimostra che identifichi un utente.

### Implementare un trait esterno su un tipo esterno

```rust
use std::fmt;

impl fmt::Display for Vec<String> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{self:?}")
    }
}

fn main() {}
```

E0117: trait e tipo sono esterni, senza il tipo locale richiesto dalla orphan rule. Il wrapper DisplayList mostra una soluzione; un alias non crea quel tipo locale.

### Saltare il confine del modulo

```rust
mod text {
    pub struct NonEmptyString(String);
}

fn main() {
    let _invalid = text::NonEmptyString(String::new());
}
```

E0603: il costruttore posizionale non e pubblico perche il campo e privato. Nel programma completo si usa TryFrom e si gestisce Result. Rendere pubblico il campo farebbe compilare la costruzione, ma distruggerebbe la protezione desiderata.

Altri errori:

- Derivare Default senza controllare il valore prodotto.
- Aggiungere From alla stessa coppia per cui si vuole una TryFrom fallibile: esiste gia una blanket implementation di TryFrom per conversioni Into.
- Esporre mutazioni, deserializzazione o conversioni che saltano la policy.
- Confondere un identificatore ben tipizzato con esistenza o autorizzazione.
- Derivare Eq/Hash o implementare Borrow senza rispettarne i contratti.
- Presumere che transparent renda sicuri transmute o FFI senza altre verifiche.

## Checklist

- Basta un alias o serve un nuovo tipo?
- La policy e dichiarata e verificabile?
- Ogni costruttore e aggiornamento la rispetta?
- Le conversioni possono fallire, perdere precisione o andare in overflow?
- Ho scelto trait e viste senza esporre inutilmente tutta la rappresentazione?
- La formattazione e leggibile oppure deve essere un formato stabile?
- Distinguo costo del wrapper, costo dei dati e garanzie ABI?

## Collegamenti

- [[Programmazione/Rust/Pagine/Tuple structs|Tuple structs]]
- [[Programmazione/Rust/Pagine/Marker types|Marker types]]
- [[Programmazione/Rust/Pagine/Typestate pattern|Typestate pattern]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/Deref Trait|Deref Trait]]
- [[Programmazione/Rust/Pagine/Derive traits|Derive traits]]
- [[Programmazione/Rust/Pagine/From Into TryFrom e TryInto|From, Into, TryFrom e TryInto]]
- [[Programmazione/Rust/Pagine/AsRef AsMut e Borrow|AsRef, AsMut e Borrow]]
- [[Programmazione/Rust/Pagine/Default|Default]]

## Fonti

- [Rust Book: newtype ed external traits](https://doc.rust-lang.org/book/ch20-02-advanced-traits.html#using-the-newtype-pattern-to-implement-external-traits-on-external-types).
- [Rust Reference: type aliases](https://doc.rust-lang.org/reference/items/type-aliases.html), [privacy](https://doc.rust-lang.org/reference/visibility-and-privacy.html) e [coerenza](https://doc.rust-lang.org/reference/items/implementations.html#trait-implementation-coherence).
- [Rust Reference: transparent](https://doc.rust-lang.org/reference/type-layout.html#the-transparent-representation) e [operatori](https://doc.rust-lang.org/reference/expressions/operator-expr.html#arithmetic-and-logical-binary-operators).
- [Standard library: From](https://doc.rust-lang.org/std/convert/trait.From.html), [TryFrom](https://doc.rust-lang.org/std/convert/trait.TryFrom.html) e [Deref](https://doc.rust-lang.org/std/ops/trait.Deref.html).

Consultate il 2026-11-17. Le fonti online possono avanzare rispetto alla toolchain di prova; nessuna feature nightly utilizzata.

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
