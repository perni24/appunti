---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - lifetimes
aliases:
  - Struct con lifetime
  - Riferimenti nelle struct
prerequisites:
  - "[[Programmazione/Rust/Pagine/Structs]]"
  - "[[Programmazione/Rust/Pagine/Lifetime annotations]]"
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
related:
  - "[[Programmazione/Rust/Pagine/Lifetimes nei trait]]"
  - "[[Programmazione/Rust/Pagine/Lifetimes avanzati]]"
  - "[[Programmazione/Rust/Pagine/Ownership]]"
title: Lifetimes nelle struct
---

# Lifetimes nelle struct

## Sintesi

Una struct con campi presi in prestito descrive una **vista su dati posseduti altrove**. Un parametro come `'a` collega i riferimenti contenuti alle condizioni in cui l'istanza puo essere usata; non alloca, non copia i dati e non mantiene vivo il proprietario.

Nei tipi dei campi reference serve una durata esplicita: un parametro dichiarato dalla struct oppure, se appropriato, `'static`. Una struct con il solo campo `name: &'static str` non ha bisogno di un parametro lifetime generico.

Gli otto programmi sono verificati con Rust **1.99.1**, edition **2024**. I due esempi nella sezione Errori comuni sono volutamente non compilabili.

## Quando usarlo

- Per passare viste su stringhe, slice o altri dati senza duplicarli.
- Per rappresentare risultati di parsing legati al buffer sorgente.
- Per dare accesso temporaneo, anche mutabile, a una parte di un oggetto.
- Quando il proprietario e il periodo di utilizzo della vista sono chiari.
- Non come scelta automatica per dati da conservare indipendentemente: spesso `String`, `Vec<T>` o ownership condivisa sono piu semplici.

## Come funziona

### Dato posseduto, vista e ultimo uso

`Excerpt<'a>` con un campo `&'a str` possiede il **riferimento**, non i byte della stringa. Spostare la vista non sposta il proprietario dei byte; copiare un riferimento condiviso non copia il suo contenuto.

I dati devono restare validi e accessibili in modo compatibile finche il prestito serve. Non basta confrontare le parentesi graffe dei binding: una vista senza distruttore che acceda ai dati puo non essere piu usata prima della fine del proprio scope.

Aggiungere un'implementazione di `Drop` cambia i vincoli da considerare: il distruttore puo usare il prestito alla fine dello scope. L'ultimo uso visibile nel corpo non e sempre l'ultimo accesso potenziale ai dati.

### Una durata comune oppure relazioni indipendenti

In `PairView<'a>` entrambi i campi devono soddisfare una durata comune. Non serve che i due proprietari siano nati insieme o vengano distrutti insieme.

Usa piu parametri quando l'API deve conservare l'indipendenza dei prestiti. Non e sempre un errore usare lo stesso lifetime: una coppia consumata tutta insieme puo avere bisogno soltanto della regione comune. Lifetime distinti diventano utili, per esempio, quando restituisci uno dei campi senza legarlo inutilmente all'altro.

## API / Sintassi

### Excerpt: metodo sui dati e fine del prestito

```rust
struct Excerpt<'a> {
    text: &'a str,
}

impl<'a> Excerpt<'a> {
    fn len(&self) -> usize {
        self.text.len()
    }

    fn as_str(&self) -> &'a str {
        self.text
    }
}

fn main() {
    let source = String::from("Rust lifetimes");
    let view = Excerpt { text: &source };
    assert_eq!(view.len(), 14);
    assert_eq!(view.as_str(), "Rust lifetimes");
    drop(source);

    let other = String::from("altro testo");
    let retained;
    {
        let temporary_view = Excerpt { text: &other };
        retained = temporary_view.as_str();
    }
    assert_eq!(retained, "altro testo");
}
```

Il primo `drop(source)` e valido perche `view` non viene piu usata e non implementa `Drop`. Aggiungere dopo quel punto una lettura di `view` rende il programma invalido. Non significa che il proprietario venga distrutto automaticamente all'ultimo uso della vista.

`len()` conta byte UTF-8. `as_str` restituisce il riferimento condiviso gia presente nel campo: il risultato dipende da `'a`, non dal breve prestito `&self`. Con `fn as_str(&self) -> &str` l'elision legherebbe invece il risultato al receiver e l'esempio con `temporary_view` non compilerebbe.

### PairView e MixedView: scegliere il contratto

```rust
struct PairView<'a> {
    left: &'a str,
    right: &'a str,
}

struct MixedView<'title, 'body> {
    title: &'title str,
    body: &'body str,
}

impl<'title, 'body> MixedView<'title, 'body> {
    fn title(&self) -> &'title str {
        self.title
    }
}

fn main() {
    let heading = String::from("Guida");
    let retained_title;
    {
        let body = String::from("Contenuto breve");
        let pair = PairView { left: &heading, right: &body };
        assert_eq!(pair.left, "Guida");
        assert_eq!(pair.right, "Contenuto breve");

        let mixed = MixedView { title: &heading, body: &body };
        assert_eq!(mixed.body, "Contenuto breve");
        retained_title = mixed.title();
    }
    assert_eq!(retained_title, "Guida");
}
```

`retained_title` puo essere usato dopo la distruzione di `body` perche la firma lo collega soltanto a `'title`. Unificando entrambi i parametri e il ritorno del metodo in un unico `'a`, quel contratto sarebbe piu restrittivo.

Non puoi invece conservare e usare l'intera `MixedView` dopo la distruzione di una sua sorgente. Lifetime distinti non rendono indipendenti i dati presi in prestito dalla loro ownership.

### Vista mutabile: reborrow oppure trasferimento

```rust
struct BytesMut<'a> {
    bytes: &'a mut [u8],
}

impl<'a> BytesMut<'a> {
    fn as_mut(&mut self) -> &mut [u8] {
        self.bytes
    }

    fn into_inner(self) -> &'a mut [u8] {
        self.bytes
    }
}

fn main() {
    let mut storage = [1, 2, 3];
    let mut view = BytesMut { bytes: &mut storage };

    view.as_mut()[0] = 9;
    view.as_mut()[1] = 8;

    let bytes = view.into_inner();
    bytes[2] = 7;
    assert_eq!(storage, [9, 8, 7]);
}
```

`as_mut` crea un reborrow legato al prestito temporaneo della vista. Puoi chiamarlo di nuovo quando il precedente reborrow non serve piu. Scrivere `&'a mut self` legherebbe inutilmente il receiver alla durata del campo.

`into_inner` consuma la vista e trasferisce il riferimento esclusivo al chiamante. Non lo duplica: `&mut T` non e `Copy` o `Clone`. Restituire `&'a mut [u8]` da un semplice `&mut self` non e equivalente, perche lascerebbe la vista riutilizzabile mentre il riferimento e ancora attivo.

## Esempio pratico

### Token sul buffer e conversione esplicita in owned

```rust
struct Token<'a> {
    kind: &'static str,
    text: &'a str,
}

struct OwnedToken {
    kind: &'static str,
    text: String,
}

impl Token<'_> {
    fn into_owned(self) -> OwnedToken {
        OwnedToken {
            kind: self.kind,
            text: self.text.to_owned(),
        }
    }
}

fn first_word(input: &str) -> Option<Token<'_>> {
    let word = input.split_whitespace().next()?;
    Some(Token { kind: "word", text: word })
}

fn main() {
    let source = String::from("  Rust lifetimes");
    let token = first_word(&source).expect("il demo contiene una parola");
    assert_eq!(token.kind, "word");
    assert_eq!(token.text, "Rust");

    let saved = token.into_owned();
    drop(source);
    assert_eq!(saved.kind, "word");
    assert_eq!(saved.text, "Rust");
    assert!(first_word(" \t\n").is_none());
}
```

`Token` conserva una slice dentro l'input. Il campo `kind` usa un literal static; non costringe anche `text` a essere static. La funzione restituisce `None` se non trova sequenze non whitespace.

Qui "parola" significa sequenza delimitata da whitespace Unicode: punteggiatura e simboli restano nel token. Non e un lexer per un linguaggio o un'analisi linguistica.

`into_owned` copia il testo mentre il prestito e valido. Dopo la conversione, `OwnedToken` puo sopravvivere al buffer originale; il costo della copia e intenzionale. Spostare soltanto `Token`, oppure clonarne i riferimenti, non darebbe quella indipendenza.

## Varianti

### Struct mista con Cow

```rust
use std::borrow::Cow;

struct Page<'a> {
    title: String,
    body: Cow<'a, str>,
}

impl Page<'_> {
    fn into_owned(self) -> Page<'static> {
        Page {
            title: self.title,
            body: Cow::Owned(self.body.into_owned()),
        }
    }
}

fn main() {
    let source = String::from("rust");
    let mut page = Page {
        title: String::from("Demo"),
        body: Cow::Borrowed(&source),
    };
    assert!(matches!(&page.body, Cow::Borrowed(_)));

    page.body.to_mut().make_ascii_uppercase();
    assert!(matches!(&page.body, Cow::Owned(_)));
    assert_eq!(page.body.as_ref(), "RUST");
    assert_eq!(source, "rust");

    let saved = page.into_owned();
    drop(source);
    assert_eq!(saved.title, "Demo");
    assert_eq!(saved.body.as_ref(), "RUST");
}
```

`title` e sempre posseduto; `body` puo essere borrowed oppure owned. `to_mut` converte il caso borrowed in una String modificabile, copiando il testo; sul caso gia owned riusa il valore posseduto. La modifica mostrata riguarda solo lettere ASCII, non il maiuscolo Unicode completo.

Il lifetime del tipo non diventa automaticamente `'static` quando cambia la variante runtime. La conversione esplicita ricostruisce un `Page<'static>` senza prestiti non static: `into_owned` di Cow copia se necessario, oppure trasferisce la String gia posseduta. `'static` non impedisce di distruggere normalmente `saved`.

Se tutti i dati devono sempre essere indipendenti, `String` puo essere piu chiaro di Cow. Per condividere lo stesso contenuto fra proprietari, valuta `Rc` o `Arc`, senza confonderli con viste o copie profonde.

### Possedere il buffer e creare viste nei metodi

```rust
struct Document {
    text: String,
}

impl Document {
    fn new(text: String) -> Self {
        Self { text }
    }

    fn first_word(&self) -> Option<&str> {
        self.text.split_whitespace().next()
    }
}

fn main() {
    let document = Document::new(String::from("Rust ownership"));
    assert_eq!(document.first_word(), Some("Rust"));
    let moved = document;
    assert_eq!(moved.first_word(), Some("Rust"));
}
```

Questa struct non memorizza riferimenti al proprio contenuto: produce viste quando richieste. Il risultato di `first_word` e legato al prestito di `self`; non puoi spostare o modificare il documento mentre una sua vista deve ancora essere usata.

Un'altra rappresentazione possibile conserva indici o intervalli nel buffer, validandoli e mantenendoli coerenti con le modifiche; gli offset di una String sono byte e devono rispettare i confini UTF-8.

## Errori comuni

### Una vista non puo uscire da una sorgente locale

Questo programma **non compila** (E0515):

```rust
struct Excerpt<'a> {
    text: &'a str,
}

fn invalid<'a>() -> Excerpt<'a> {
    let source = String::from("locale");
    Excerpt { text: &source }
}

fn main() {}
```

Il proprietario verrebbe distrutto al ritorno. Un parametro `'a` non lo mantiene vivo: restituisci i dati posseduti, oppure ricevi la sorgente in prestito dal chiamante.

### Un parametro lifetime non crea un collegamento autoreferenziale

Questo programma **non compila** (E0505 ed E0515):

```rust
struct SelfRef<'a> {
    text: String,
    view: &'a str,
}

fn invalid<'a>(text: String) -> SelfRef<'a> {
    let view = text.as_str();
    SelfRef { text, view }
}

fn main() {}
```

`'a` non significa "un riferimento all'altro campo della stessa istanza". La costruzione prende in prestito `text` e poi tenta di trasferirla nel risultato mantenendo quel prestito.

Non dedurre che ogni move di String sposti i byte del suo buffer: il problema dell'API comprende costruzione, accessi e possibili invalidazioni, non soltanto l'indirizzo dell'allocazione. Usa una rappresentazione come `Document` quando basta. Per vere strutture autoreferenziali servono astrazioni dedicate e invarianti piu forti; aggiungere `Pin` da solo non riscrive questi riferimenti ne rende valido il costruttore.

Altri errori da evitare:

- Usare `'static` per nascondere una dipendenza da dati locali.
- Aggiungere un lifetime diverso a ogni campo senza una necessita dell'API.
- Pensare che un derive Clone su campi reference duplichi il testo.
- Bloccare la vista mutabile con `&'a mut self` quando serve un reborrow breve.
- Dimenticare che `Drop` e le viste ancora usate possono mantenere attivo un prestito.

## Checklist

- La struct possiede dati o soltanto riferimenti?
- Chi garantisce la validita di ogni sorgente?
- Serve davvero una durata comune a tutti i campi?
- Un metodo restituisce dati legati al campo o al prestito di self?
- Un accesso mutabile deve essere un reborrow oppure un trasferimento?
- Il dato deve sopravvivere alla sorgente? Ho una conversione owned esplicita?
- Sto creando una vera vista esterna o tentando un riferimento interno?
- Eventuali distruttori e modifiche al buffer rispettano i prestiti?

## Collegamenti

- [[Programmazione/Rust/Pagine/Lifetime annotations|Lifetime annotations]]
- [[Programmazione/Rust/Pagine/Lifetime elision|Lifetime elision]]
- [[Programmazione/Rust/Pagine/Lifetimes nei trait|Lifetimes nei trait]]
- [[Programmazione/Rust/Pagine/Lifetimes avanzati|Lifetimes avanzati]]
- [[Programmazione/Rust/Pagine/Structs|Structs]]
- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Copy e Clone|Copy e Clone]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop Trait]]
- [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc e Arc]]
- [[Programmazione/Rust/Pagine/Pin e Unpin|Pin e Unpin]]

## Fonti

- [Rust Book: lifetime nelle struct e nei metodi](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html).
- [Rust Reference: Struct types](https://doc.rust-lang.org/reference/types/struct.html).
- [Rust Reference: Destructors](https://doc.rust-lang.org/reference/destructors.html).
- [Rustonomicon: Drop Check](https://doc.rust-lang.org/nomicon/dropck.html).
- [Standard library: References](https://doc.rust-lang.org/std/primitive.reference.html).
- [Standard library: str](https://doc.rust-lang.org/std/primitive.str.html).
- [Standard library: Cow](https://doc.rust-lang.org/std/borrow/enum.Cow.html).
- [Standard library: Pin e strutture autoreferenziali](https://doc.rust-lang.org/std/pin/index.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
