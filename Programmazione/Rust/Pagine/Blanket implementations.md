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
  - Blanket impl
  - Blanket implementation
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Trait bounds]]"
related:
  - "[[Programmazione/Rust/Pagine/Extension traits]]"
  - "[[Programmazione/Rust/Pagine/From Into TryFrom e TryInto]]"
  - "[[Programmazione/Rust/Pagine/Public API design]]"
title: Blanket implementations
---

# Blanket implementations

## Sintesi

Una **blanket implementation** fornisce un'implementazione di trait a una famiglia di tipi. La forma comune `impl<T: Summary> Loggable for T` rende Loggable ogni T che soddisfa Summary, con gli ulteriori vincoli impliciti o espliciti dell'impl.

Non e ereditarieta, una macro che modifica le struct o un controllo dei tipi a runtime. E una regola di implementazione che il compilatore deve poter applicare senza conflitti.

Gli esempi sono verificati con **Rust 1.99.1, edition 2024**. Ogni blocco Rust e autonomo; i due controesempi indicati devono essere rifiutati con E0119 o E0210. I test verificano contratti e risultati, non prestazioni.

## Quando usarlo

- Quando un comportamento si puo derivare correttamente da un altro contratto per tutti i tipi ammessi.
- Per extension trait che aggiungono operazioni a tipi esistenti senza modificarli.
- Per evitare molte implementazioni identiche, quando non devono essere personalizzate singolarmente.
- Per collegare due interfacce, come la relazione standard tra From e Into.

Evitala se la famiglia richiede strategie incompatibili o se una funzione generica sarebbe sufficiente. Un bound prova che certe operazioni sono disponibili, non che siano adeguate a ogni esigenza applicativa.

## Come funziona

### Un'implementazione condizionale, non un supertrait

```rust
trait Summary {
    fn summary(&self) -> String;
}

trait Loggable {
    fn log(&self);
}

impl<T: Summary + ?Sized> Loggable for T {
    fn log(&self) {
        println!("{}", self.summary());
    }
}

struct Article(String);

impl Summary for Article {
    fn summary(&self) -> String { format!("article: {}", self.0) }
}

fn main() {
    let article = Article(String::from("Rust"));
    article.log();
    assert_eq!(article.0, "Rust");
}
```

L'output e `article: Rust`. L'implementazione usa solo il contratto Summary e prende un prestito condiviso: non consuma Article.

La direzione e **Summary implica Loggable**, non il contrario. Una dichiarazione `trait Loggable: Summary` da sola imporrebbe un requisito agli implementatori, ma non creerebbe l'implementazione di Loggable.

`?Sized` rimuove il Sized implicito di T: questa versione puo applicarsi anche a un `dyn Summary`. Senza quel rilassamento i tipi unsized non sarebbero coperti direttamente. I riferimenti sono a loro volta tipi: una chiamata che funziona tramite autoderef non prova che il tipo del riferimento implementi il trait.

Il demo scrive su stdout, senza livelli, filtri, destinazione configurabile o recupero degli errori di output. Non e un logger di produzione.

### Generico non e sempre sinonimo di blanket

La definizione precisa riguarda la presenza di parametri di tipo **non coperti** da un costruttore di tipo nella testa dell'impl:

- In `impl<T> Trait for T`, T e non coperto.
- In `impl<T> Trait<T> for Vec<T>`, l'argomento T del trait e non coperto.
- In `impl<T> Trait<Vec<T>> for Vec<T>`, entrambe le occorrenze di T sono coperte da Vec: l'impl e generica, ma non blanket secondo questa definizione.

La distinzione e utile soprattutto per coherence e compatibilita delle librerie. [Rust Reference: blanket implementation](https://doc.rust-lang.org/reference/glossary.html#blanket-implementation)

### Coherence: non si sceglie semplicemente l'impl piu specifica

Per la stessa istanza di trait, inclusi i suoi argomenti, e lo stesso tipo implementatore non devono risultare applicabili due impl incompatibili. Due impl generiche possono sovrapporsi anche se hanno bound scritti diversamente.

Essere autorizzati dalle orphan rules non basta: un trait locale puo comunque avere impl in conflitto. L'ordine nel file, l'ordine degli import e il modulo che contiene l'impl non risolvono la sovrapposizione. [Rust Reference: coherence](https://doc.rust-lang.org/reference/items/implementations.html#trait-implementation-coherence)

## API / Sintassi

### StringExt anche per str e trait object

```rust
mod text {
    pub trait StringExt {
        fn is_blank(&self) -> bool;
    }

    impl<T: AsRef<str> + ?Sized> StringExt for T {
        fn is_blank(&self) -> bool {
            self.as_ref().trim().is_empty()
        }
    }
}

use text::StringExt;

struct Label(String);

impl AsRef<str> for Label {
    fn as_ref(&self) -> &str { &self.0 }
}

fn main() {
    let owned = String::from(" \t");
    assert!(owned.is_blank());
    assert!(<str as StringExt>::is_blank("\n"));
    assert!(!Label(String::from("Rust")).is_blank());

    let view: &dyn AsRef<str> = &owned;
    assert!(StringExt::is_blank(view));
    assert_eq!(owned, " \t");
}
```

Il trait deve essere visibile per usare normalmente la sintassi metodo; la chiamata qualificata permette di scegliere esplicitamente il trait.

`trim` considera i whitespace Unicode riconosciuti da Rust; non significa "qualunque carattere invisibile". L'helper non modifica, normalizza o valida il contenuto per HTML, SQL o un formato applicativo. [Standard library: str::trim](https://doc.rust-lang.org/std/primitive.str.html#method.trim)

Non assumere che qualunque T implementi `AsRef<T>`: la standard library non fornisce quella blanket impl riflessiva universale. Inoltre implementare Deref non equivale automaticamente a soddisfare ogni bound AsRef. [Standard library: AsRef](https://doc.rust-lang.org/std/convert/trait.AsRef.html)

## Esempio pratico

### Validazione e scrittura su una destinazione esplicita

Limitarsi a `validate()?; Ok(())` non salva nulla. Qui Save richiede anche la produzione del record e scrive realmente su una destinazione Write; nel main e un buffer in memoria.

```rust
use std::io::{self, Write};

trait Validate {
    fn validate(&self) -> Result<(), &'static str>;
}

trait Record {
    fn record(&self) -> String;
}

#[derive(Debug)]
enum SaveError {
    Invalid(&'static str),
    Io(io::Error),
}

trait Save {
    fn save<W: Write + ?Sized>(&self, output: &mut W) -> Result<(), SaveError>;
}

impl<T: Validate + Record + ?Sized> Save for T {
    fn save<W: Write + ?Sized>(&self, output: &mut W) -> Result<(), SaveError> {
        self.validate().map_err(SaveError::Invalid)?;
        let record = self.record();
        output.write_all(record.as_bytes()).map_err(SaveError::Io)?;
        Ok(())
    }
}

struct Note(String);

impl Validate for Note {
    fn validate(&self) -> Result<(), &'static str> {
        if self.0.trim().is_empty() {
            Err("empty")
        } else if self.0.contains(['\r', '\n']) {
            Err("line break")
        } else {
            Ok(())
        }
    }
}

impl Record for Note {
    fn record(&self) -> String { format!("{}\n", self.0) }
}

fn main() {
    let mut output = Vec::new();
    let note = Note(String::from("prima"));
    note.save(&mut output).unwrap();
    assert_eq!(output, b"prima\n");
    assert_eq!(note.0, "prima");

    let error = Note(String::from(" \t")).save(&mut output).unwrap_err();
    assert!(matches!(error, SaveError::Invalid("empty")));
    assert_eq!(output, b"prima\n");
}
```

La blanket impl centralizza l'ordine: **valida, costruisci il record, scrivi**. Un errore di validazione interrompe il procedimento prima di produrre il record o chiamare Write; un errore I/O viene conservato nella variante Io.

Limiti importanti:

- La policy Note ammette testo non vuoto senza CR/LF; non e validazione universale, escaping o controllo di sicurezza.
- Il record e una String posseduta. I costi della sua costruzione non scompaiono perche l'impl e generica.
- Scrivere su Vec non significa persistenza su disco. Il demo non contiene database, deduplicazione, concorrenza, autorizzazioni o transazioni.
- `write_all` puo avere scritto una parte dei byte prima di restituire un errore: **non c'e rollback**. Riprovare ciecamente puo duplicare dati. Non viene eseguito flush e non viene promessa durabilita. [Standard library: Write::write_all](https://doc.rust-lang.org/std/io/trait.Write.html#method.write_all)
- I bound non dimostrano che un'implementazione arbitraria di Validate o Record sia pura o semanticamente corretta.
- Il metodo save e generico su W: questo trait non offre direttamente `dyn Save`. Vedi [[Programmazione/Rust/Pagine/Object safety|Object safety]].

## Varianti

### From fornisce Into, senza implementarlo due volte

```rust
struct Batch<T>(Vec<T>);

impl<T> From<Batch<T>> for Vec<T> {
    fn from(batch: Batch<T>) -> Self { batch.0 }
}

fn main() {
    let batch = Batch(vec![String::from("uno"), String::from("due")]);
    let values: Vec<String> = batch.into();
    assert_eq!(values, ["uno", "due"]);
}
```

La standard library fornisce `impl<T, U> Into<U> for T where U: From<T>`. Il nostro From rende quindi disponibile Into; aggiungere anche un'impl manuale di Into per la stessa conversione crea un conflitto. Il verso opposto non e automatico: un Into manuale non genera From. [Standard library: Into](https://doc.rust-lang.org/std/convert/trait.Into.html)

La conversione consuma Batch e sposta il Vec, senza richiedere Clone sugli elementi. Il tipo di destinazione guida l'inferenza. Questa conversione e infallibile; per conversioni che possono fallire usa TryFrom/TryInto, approfonditi nella [[Programmazione/Rust/Pagine/From Into TryFrom e TryInto|nota sulle conversioni]].

L'esempio e anche rilevante per le orphan rules: From e Vec sono esterni, ma Batch e locale nella posizione dell'argomento del trait e T in Vec<T> e coperto. La regola non si riduce a "il tipo dopo for deve sempre essere locale".

### Un wrapper con un comportamento esplicito

```rust
use std::fmt::Display;

trait Label {
    fn label(&self) -> String;
}

impl<T: Display> Label for T {
    fn label(&self) -> String { self.to_string() }
}

struct VerboseNumber(u32);

impl Label for VerboseNumber {
    fn label(&self) -> String { format!("number={}", self.0) }
}

fn main() {
    assert_eq!(7u32.label(), "7");
    assert_eq!(VerboseNumber(7).label(), "number=7");
}
```

VerboseNumber e un tipo locale distinto e **non implementa Display**, quindi qui non ricade nella blanket impl. Se gli aggiungi anche Display, le due implementazioni di Label tornano a sovrapporsi.

Un newtype non aggira automaticamente qualunque blanket impl: se quest'ultima copre tutti i tipi sized senza ulteriori bound, coprira anche un nuovo wrapper sized. Altre alternative sono un metodo con nome diverso, una funzione generica, un trait separato o una strategia passata esplicitamente.

### Metodo default, marker e compatibilita pubblica

Un metodo con corpo predefinito nel trait non implementa da solo il trait per nuovi tipi: richiede comunque un'impl. Una blanket impl, invece, assegna il trait a tutti i tipi del dominio dichiarato e impedisce una seconda impl sovrapposta.

Marker trait, lifetime e bound multipli possono restringere il dominio, ma due bound diversi non sono necessariamente disgiunti. Anche `'static` e un vincolo sui tipi ammessi, non la promessa che il valore viva per sempre.

Aggiungere una blanket impl a un trait pubblico esistente puo entrare in conflitto con impl legali scritte dai consumer. Non trattarla automaticamente come un'aggiunta compatibile: e una scelta da valutare al momento della progettazione e del versionamento. [RFC 2451: effetti sulle crate dipendenti](https://rust-lang.github.io/rfcs/2451-re-rebalancing-coherence.html#effects-on-parent-crates)

## Errori comuni

### Un'impl specifica non sovrascrive quella generica

Controesempio: deve fallire con **E0119**.

```rust
use std::fmt::Display;

trait Label {
    fn label(&self) -> String;
}

impl<T: Display> Label for T {
    fn label(&self) -> String { self.to_string() }
}

impl Label for u32 {
    fn label(&self) -> String { format!("number={self}") }
}

fn main() {}
```

u32 soddisfa Display e quindi entrambe le impl sarebbero applicabili. La correzione non consiste nello spostarle in moduli diversi o nell'importarne una sola. [Diagnostica E0119](https://doc.rust-lang.org/error_codes/E0119.html)

La specializzazione generale non e una soluzione stable sulla baseline della nota: non aggiungere `default impl` o feature nightly a un progetto stable per nascondere il problema di design. [Rust Unstable Book: specialization](https://doc.rust-lang.org/unstable-book/language-features/specialization.html)

### Un tipo locale nell'impl non basta sempre

Controesempio: deve fallire con **E0210**.

```rust
struct Wrapper<T>(T);

impl<T> From<Wrapper<T>> for T {
    fn from(wrapper: Wrapper<T>) -> Self { wrapper.0 }
}

fn main() {}
```

Per un trait esterno si considera l'ordine del tipo implementatore e poi degli argomenti del trait. Prima del primo tipo locale non possono comparire parametri di tipo non coperti: qui T dopo `for` precede Wrapper<T> ed e non coperto.

Un metodo inerente `Wrapper::into_inner(self) -> T` puo esprimere lo spacchettamento senza quell'impl vietata. Un alias non crea un tipo locale nuovo; inoltre `Vec<Locale>` non diventa locale soltanto per il suo elemento. Tipi fondamentali come Box hanno regole specifiche: non generalizzare da Vec a tutti i puntatori. [Rust Reference: orphan rules](https://doc.rust-lang.org/reference/items/implementations.html#orphan-rules), [Diagnostica E0210](https://doc.rust-lang.org/error_codes/E0210.html)

### Altri equivoci da evitare

- `?Sized` non elimina gli altri bound e non rende automaticamente dyn-compatible il trait.
- Un bound nel where non vincola necessariamente un parametro dell'impl: `impl<T, U> LocalTrait for T where U: Default` lascia U non determinato e produce E0207. Collegalo al tipo implementatore, al trait o a una proiezione associata appropriata. [Diagnostica E0207](https://doc.rust-lang.org/error_codes/E0207.html)
- I metodi possono avere lo stesso nome in trait diversi: la disambiguazione della chiamata e distinta dal conflitto fra due impl dello stesso trait.
- Le regole considerano anche gli scenari consentiti fra crate: "oggi non vedo un tipo che soddisfa entrambi i bound" non e una prova generale di non sovrapposizione.

## Checklist

- [ ] Il comportamento e davvero valido per ogni tipo ammesso dai bound?
- [ ] Voglio includere tipi unsized oppure il Sized implicito e intenzionale?
- [ ] Sto introducendo un'impl oppure soltanto un metodo default?
- [ ] Esistono impl esplicite, blanket della standard library o possibili sovrapposizioni?
- [ ] Trait locale e orphan rules sono verificati separatamente dalla sovrapposizione?
- [ ] Import e chiamata qualificata sono chiari per chi usa l'extension trait?
- [ ] Ownership, errori ed effetti parziali restano espliciti?
- [ ] La nuova impl limita personalizzazioni o compatibilita delle crate dipendenti?
- [ ] Una funzione, un metodo nominato o un wrapper rende il contratto piu chiaro?

## Collegamenti

- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Trait bounds|Trait bounds]]
- [[Programmazione/Rust/Pagine/Extension traits|Extension traits]]
- [[Programmazione/Rust/Pagine/From Into TryFrom e TryInto|From Into TryFrom e TryInto]]
- [[Programmazione/Rust/Pagine/Object safety|Object safety]]
- [[Programmazione/Rust/Pagine/Newtype pattern|Newtype pattern]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/Compatibility e breaking changes|Compatibility e breaking changes]]

## Fonti

- [Rust Reference: definizione di blanket implementation](https://doc.rust-lang.org/reference/glossary.html#blanket-implementation).
- [Rust Reference: coherence e orphan rules](https://doc.rust-lang.org/reference/items/implementations.html#trait-implementation-coherence).
- [Standard library: AsRef](https://doc.rust-lang.org/std/convert/trait.AsRef.html).
- [Standard library: From](https://doc.rust-lang.org/std/convert/trait.From.html).
- [Standard library: Into e blanket impl](https://doc.rust-lang.org/std/convert/trait.Into.html).
- [Standard library: Write::write_all](https://doc.rust-lang.org/std/io/trait.Write.html#method.write_all).
- [Diagnostica E0119](https://doc.rust-lang.org/error_codes/E0119.html), [E0210](https://doc.rust-lang.org/error_codes/E0210.html), [E0207](https://doc.rust-lang.org/error_codes/E0207.html).
- [RFC 2451: coherence e compatibilita](https://rust-lang.github.io/rfcs/2451-re-rebalancing-coherence.html).
- [Rust Unstable Book: specialization](https://doc.rust-lang.org/unstable-book/language-features/specialization.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
