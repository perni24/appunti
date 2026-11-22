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
  - Trait Rust
  - Interfacce Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Generics]]"
  - "[[Programmazione/Rust/Pagine/Structs]]"
  - "[[Programmazione/Rust/Pagine/Enums]]"
related:
  - "[[Programmazione/Rust/Pagine/Trait bounds]]"
  - "[[Programmazione/Rust/Pagine/Derive traits]]"
  - "[[Programmazione/Rust/Pagine/Trait objects e dyn Trait]]"
title: Traits
---

# Traits

## Sintesi

Un trait dichiara un contratto implementabile da tipi diversi: funzioni associate, metodi, tipi associati e costanti. `Self` indica il tipo che implementa il trait.

Non e ereditarieta di dati e non e riconoscimento automatico di metodi con lo stesso nome. Serve un'implementazione del trait, esplicita o ottenuta tramite meccanismi come derive e blanket impl. Il compilatore controlla il contratto di tipi, non dimostra tutte le proprieta semantiche promesse dalla documentazione.

## Quando usarlo

- Dare un contratto comune a implementazioni diverse.
- Esprimere le capacita richieste da un algoritmo generico.
- Separare una dipendenza dal codice che la usa e provarla con un test double.
- Estendere un tipo esistente con un trait locale.

Anche un solo implementatore puo giustificare un trait, per esempio per un confine pubblico o per test mirati. Non introdurlo automaticamente per ogni struct; per alternative chiuse un enum puo bastare.

## Come funziona

### Definire, implementare e importare

I blocchi Rust sono programmi autonomi, salvo il controesempio dichiarato. Verificati con Rust 1.99.1, edition 2024, senza crate esterne.

```rust
mod content {
    pub trait Summary {
        fn summarize(&self) -> String;
    }

    pub struct Article {
        pub title: String,
    }

    impl Summary for Article {
        fn summarize(&self) -> String {
            self.title.clone()
        }
    }
}

use content::{Article, Summary};

fn print_summary(item: &impl Summary) {
    println!("{}", item.summarize());
}

fn main() {
    let article = Article { title: String::from("Rust notes") };
    assert_eq!(article.summarize(), "Rust notes");
    assert_eq!(<Article as Summary>::summarize(&article), "Rust notes");
    print_summary(&article);
}
```

`impl Summary for Article` soddisfa il contratto. Un semplice metodo omonimo in `impl Article` non sarebbe sufficiente.

L'import del trait rende disponibile la sintassi a metodo in questo modulo; la forma qualificata `<Article as Summary>::summarize` identifica esplicitamente l'implementazione. E utile anche per disambiguare piu trait. I membri di un trait pubblico non si dichiarano singolarmente `pub` nell'impl.

Qui il risultato e una nuova `String`: il clone del titolo e una scelta dell'API. Un contratto che puo restituire solo testo gia conservato potrebbe scegliere `&str`.

## API / Sintassi

### Metodi richiesti, default e forwarding

```rust
trait Named {
    fn name(&self) -> &str;

    fn label(&self) -> String {
        format!("name={}", self.name())
    }
}

struct Project(String);

impl Named for Project {
    fn name(&self) -> &str {
        &self.0
    }

    fn label(&self) -> String {
        format!("project={}", self.name())
    }
}

impl<T: Named + ?Sized> Named for Box<T> {
    fn name(&self) -> &str {
        (**self).name()
    }

    fn label(&self) -> String {
        (**self).label()
    }
}

fn label<T: Named + ?Sized>(value: &T) -> String {
    value.label()
}

fn main() {
    let project = Project(String::from("vault"));
    assert_eq!(label(&project), "project=vault");

    let boxed = Box::new(project);
    assert_eq!(label(&boxed), "project=vault");

    let erased: Box<dyn Named> = boxed;
    assert_eq!(label(&erased), "project=vault");
}
```

Il metodo default puo usare quelli richiesti. `Project` lo sostituisce; non esiste una chiamata `super.label()` per recuperare automaticamente il corpo default.

L'impl per `Box<T>` inoltra **entrambi** i metodi. Se inoltrasse solo `name`, una chiamata al `label` del trait su `Box<Project>` userebbe il default del box (`name=vault`), non l'override `project=vault`. Autoderef nella ricerca di un metodo e implementazione di un trait per il contenitore sono concetti diversi.

`?Sized` consente anche `T = dyn Named`: approfondimento in [[Programmazione/Rust/Pagine/Trait bounds|Trait bounds]]. Non tutti i trait possono diventare `dyn Trait`.

### Riceventi e ownership

```rust
trait TextBuffer {
    fn append(&mut self, text: &str);
    fn byte_len(&self) -> usize;
    fn into_text(self) -> String;
}

impl TextBuffer for String {
    fn append(&mut self, text: &str) {
        self.push_str(text);
    }

    fn byte_len(&self) -> usize {
        self.len()
    }

    fn into_text(self) -> String {
        self
    }
}

fn main() {
    let mut buffer = String::from("api");
    buffer.append(" ready");
    assert_eq!(buffer.byte_len(), 9);
    let text = buffer.into_text();
    assert_eq!(text, "api ready");
}
```

`&self` prende un prestito condiviso, `&mut self` uno esclusivo, `self` riceve per valore. Non sono decorazioni: determinano come il chiamante puo usare il valore. `&self` non garantisce purezza in presenza, per esempio, di interior mutability.

Una funzione associata senza ricevente si richiama sul tipo o tramite sintassi qualificata. Associated types e costanti permettono di esprimere ulteriori parti del contratto; non sono campi di un oggetto.

## Esempio pratico

### Validazione con una policy dichiarata

Il semplice `email.contains('@')` non valida un indirizzo email: accetta anche `"@"`. Per concentrarsi sul trait, questo esempio usa invece una policy locale e verificabile sul nome visualizzato.

```rust
#[derive(Debug, PartialEq)]
enum ValidationError {
    EmptyName,
    NameTooLong,
    ControlCharacter,
}

trait Validator {
    fn validate(&self) -> Result<(), ValidationError>;
}

struct User {
    display_name: String,
}

impl Validator for User {
    fn validate(&self) -> Result<(), ValidationError> {
        if self.display_name.trim().is_empty() {
            return Err(ValidationError::EmptyName);
        }
        if self.display_name.chars().count() > 80 {
            return Err(ValidationError::NameTooLong);
        }
        if self.display_name.chars().any(char::is_control) {
            return Err(ValidationError::ControlCharacter);
        }
        Ok(())
    }
}

fn check_before_save<T: Validator>(value: &T) -> Result<(), ValidationError> {
    value.validate()
}

fn main() {
    let valid = User { display_name: String::from("Luca") };
    let empty = User { display_name: String::from("  ") };
    let long = User { display_name: "a".repeat(81) };
    let control = User { display_name: String::from("Lu\nca") };

    assert_eq!(check_before_save(&valid), Ok(()));
    assert_eq!(check_before_save(&empty), Err(ValidationError::EmptyName));
    assert_eq!(check_before_save(&long), Err(ValidationError::NameTooLong));
    assert_eq!(check_before_save(&control), Err(ValidationError::ControlCharacter));
}
```

Ordine della policy: nome non composto solo da whitespace, massimo **80 valori scalari Unicode**, nessun carattere di controllo. Non sono 80 byte o 80 grafemi visivi. Gli spazi ai bordi contribuiscono alla lunghezza e non vengono rimossi.

`check_before_save` **non salva nulla**: dimostra soltanto la dipendenza dal trait. Non effettua normalizzazione, escaping HTML, verifica identita o autorizzazione; non e un filtro generale di sicurezza. Un'implementazione scorretta di `Validator` potrebbe restituire sempre `Ok(())`: i test del dominio restano necessari.

## Varianti

### Trait esterno su tipo locale

```rust
use std::fmt;

struct Label(String);

impl fmt::Display for Label {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[{}]", self.0)
    }
}

fn main() {
    let label = Label(String::from("api"));
    assert_eq!(label.to_string(), "[api]");
}
```

`Display` e esterno, `Label` e locale: un newtype permette di scegliere una rappresentazione senza cambiare `String` globalmente.

- Trait marker: dichiara una proprieta senza metodi; un trait vuoto ordinario non diventa automaticamente un auto trait.
- Trait generico e associated type: due modi diversi di legare altri tipi al contratto.
- Supertrait: `trait Detailed: Named` richiede anche `Named`, ma non ne genera l'implementazione e non eredita campi.
- Extension trait e blanket impl: utili, ma vanno valutati per conflitti e compatibilita.
- `dyn Trait`: richiede dyn compatibility; vedi [[Programmazione/Rust/Pagine/Object safety|Object safety e dyn compatibility]].

## Errori comuni

### Implementare un trait esterno per un tipo esterno

Questo programma **non compila**: entrambi sono definiti nella libreria standard.

```rust
use std::fmt;

impl fmt::Display for Vec<u8> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} bytes", self.len())
    }
}

fn main() {}
```

Le regole di coherence comprendono orphan rules e assenza di impl sovrapposte. Per il caso semplice senza parametri del trait, ricorda: trait locale oppure tipo implementatore locale. **Non e la regola completa**: nei trait generici contano anche i tipi negli argomenti del trait e la posizione dei parametri non coperti. `Vec<LocalType>` non diventa locale solo perche contiene un tipo locale; esistono regole specifiche per wrapper fondamentali come `Box`.

- Aggiungere un secondo impl specifico che si sovrappone a uno generico non e override in stable Rust.
- Un tipo con metodi omonimi non soddisfa automaticamente il trait.
- Un metodo aggiuntivo non dichiarato nel trait va in un impl inerente o in un altro trait.
- Non confondere successo di compilazione e correttezza della policy.
- Evita contratti con responsabilita non correlate o che promettono salvataggi non implementati.

## Checklist

- Il contratto dichiara ownership, errori e proprieta semantiche?
- I default e il forwarding preservano il comportamento desiderato?
- Il trait e in scope dove uso la sintassi a metodo?
- Orphan rules e impl esistenti consentono l'implementazione?
- I test verificano anche i casi negativi della policy?

## Collegamenti

- [[Programmazione/Rust/Pagine/Trait bounds|Trait bounds]]
- [[Programmazione/Rust/Pagine/Derive traits|Derive traits]]
- [[Programmazione/Rust/Pagine/Associated types|Associated types]]
- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]
- [[Programmazione/Rust/Pagine/Blanket implementations|Blanket implementations]]
- [[Programmazione/Rust/Pagine/Extension traits|Extension traits]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]

## Fonti

- [Rust Book: traits e comportamento condiviso](https://doc.rust-lang.org/book/ch10-02-traits.html).
- [Rust Reference: trait e dyn compatibility](https://doc.rust-lang.org/reference/items/traits.html).
- [Rust Reference: coherence e orphan rules](https://doc.rust-lang.org/reference/items/implementations.html#trait-implementation-coherence).
- [Display e contratto della formattazione](https://doc.rust-lang.org/std/fmt/trait.Display.html).
- [str: trim e chars](https://doc.rust-lang.org/std/primitive.str.html).
- [char: is_control](https://doc.rust-lang.org/std/primitive.char.html#method.is_control).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
