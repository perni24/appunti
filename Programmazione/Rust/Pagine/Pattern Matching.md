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
  - pattern-matching
  - match
aliases:
  - match Rust
  - Pattern matching Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Enums]]"
  - "[[Programmazione/Rust/Pagine/Pattern base]]"
related:
  - "[[Programmazione/Rust/Pagine/if let e while let]]"
  - "[[Programmazione/Rust/Pagine/Pattern matching avanzato]]"
  - "[[Programmazione/Rust/Pagine/Destructuring]]"
title: Pattern Matching
---

# Pattern Matching

## Sintesi

Il pattern matching riconosce la forma di un valore ed estrae dati. `match` sceglie un ramo fra alternative esaustive; non e una sequenza di confronti arbitrari ne un meccanismo di eccezioni.

Gli esempi sono programmi indipendenti per `src/main.rs`, verificati con **Rust 1.99.1, edition 2024**. I due esempi non compilabili sono indicati esplicitamente.

## Quando usarlo

- Per distinguere tutte le varianti importanti di un enum.
- Per separare presenza/assenza con `Option` o successo/errore con `Result`.
- Per calcolare un risultato dalla forma del dato, senza flag intermedi.
- Per estrarre campi scegliendo consapevolmente fra move e prestito.

Se interessa un solo caso e ignorare gli altri e intenzionale, valuta `if let`. Per semplici trasformazioni di `Option` o `Result`, anche i loro metodi possono essere piu leggibili.

## Come funziona

Il valore esaminato si chiama _scrutinee_. Rust prova i bracci nell'ordine scritto: esegue il primo con pattern corrispondente **e guardia vera**, se presente. Una guardia falsa fa proseguire la ricerca. Non c'e fall-through al ramo successivo.

I binding appartengono alla guardia e al corpo del rispettivo braccio. Un normale nome locale nel pattern introduce un binding, non confronta il dato con una variabile esterna omonima. Per quel confronto usa una guardia.

`match` e un'espressione: i risultati dei bracci devono convergere a un tipo comune, anche tramite coercizioni consentite. Un ramo che esegue `return` non produce un valore per il risultato del match. Aggiungere un punto e virgola all'ultima espressione di un blocco ne cambia normalmente il risultato in `()`.

### Un valore dal match

```rust
fn describe(value: Option<i32>) -> String {
    match value {
        Some(number) => format!("numero {number}"),
        None => String::from("assente"),
    }
}

fn parse_summary(raw: &str) -> String {
    match raw.parse::<u16>() {
        Ok(number) => format!("letto {number}"),
        Err(error) => format!("non valido: {error}"),
    }
}

fn main() {
    assert_eq!(describe(Some(0)), "numero 0");
    assert_eq!(describe(None), "assente");
    assert_eq!(parse_summary("42"), "letto 42");
    assert!(parse_summary("abc").starts_with("non valido: "));
}
```

Il secondo esempio descrive il risultato del parsing, non conserva un errore tipizzato per il chiamante. In un'API che deve propagare il fallimento conviene restituire `Result`, non una stringa indistinguibile dal risultato normale. Zero e assenza rimangono casi diversi.

## API / Sintassi

### Guardie e valori esterni

```rust
fn category(number: i32) -> &'static str {
    match number {
        value if value < 0 => "negativo",
        0 => "zero",
        _ => "positivo",
    }
}

fn equals_expected(value: Option<i32>, expected: i32) -> bool {
    match value {
        Some(actual) if actual == expected => true,
        Some(_) | None => false,
    }
}

fn main() {
    assert_eq!(category(-1), "negativo");
    assert_eq!(category(0), "zero");
    assert_eq!(category(1), "positivo");
    assert!(equals_expected(Some(7), 7));
    assert!(!equals_expected(Some(8), 7));
    assert!(!equals_expected(None, 7));
}
```

`Some(expected)` creerebbe invece un nuovo binding locale: accetterebbe qualsiasi `Some`. Costanti e varianti risolte come path non sono normali binding locali. Mantieni le guardie semplici e possibilmente prive di effetti collaterali.

### Leggere e modificare in prestito

```rust
fn main() {
    let mut message = Some(String::from("ciao"));

    let bytes = match &message {
        Some(text) => {
            let borrowed: &String = text;
            borrowed.len()
        }
        None => 0,
    };
    assert_eq!(bytes, 4);

    match &mut message {
        Some(text) => text.push('!'),
        None => {}
    }
    assert_eq!(message.as_deref(), Some("ciao!"));
}
```

Con `&message` il binding e `&String`, con `&mut message` e `&mut String`. Non serve clonare. Con `match message { Some(text) => ... }`, invece, `text` prenderebbe ownership della `String`. Il solo uso della parola `match` non implica sempre un move: contano il pattern e i binding.

### Campi e ordine dei rami

```rust
struct Point {
    x: i32,
    y: i32,
}

fn location(point: &Point) -> &'static str {
    match point {
        Point { x: 0, y: 0 } => "origine",
        Point { y: 0, .. } => "asse x",
        Point { x: 0, .. } => "asse y",
        Point { .. } => "altrove",
    }
}

fn main() {
    assert_eq!(location(&Point { x: 0, y: 0 }), "origine");
    assert_eq!(location(&Point { x: 3, y: 0 }), "asse x");
    assert_eq!(location(&Point { x: 0, y: 4 }), "asse y");
    assert_eq!(location(&Point { x: 3, y: 4 }), "altrove");
}
```

Il caso origine precede i casi degli assi, che lo accetterebbero a loro volta. `..` ignora i campi rimanenti; non significa che siano assenti.

## Esempio pratico

### Eventi e alternative

```rust
enum Event {
    Click { x: i32, y: i32 },
    Key(char),
    Close,
}

#[derive(Debug, PartialEq)]
enum Action {
    Select(i32, i32),
    Input(char),
    Exit,
}

fn handle(event: Event) -> Action {
    match event {
        Event::Click { x, y } => Action::Select(x, y),
        Event::Key('q') | Event::Close => Action::Exit,
        Event::Key(character) => Action::Input(character),
    }
}

fn main() {
    assert_eq!(handle(Event::Click { x: 3, y: 4 }), Action::Select(3, 4));
    assert_eq!(handle(Event::Key('q')), Action::Exit);
    assert_eq!(handle(Event::Close), Action::Exit);
    assert_eq!(handle(Event::Key('a')), Action::Input('a'));
}
```

Il demo decide un'azione ma non apre finestre, modifica file o termina il processo. La scelta di `q` come uscita e una regola applicativa, non una regola Rust; le coordinate non vengono validate.

`|` unisce pattern alternativi, non espressioni booleane. Se introducono binding, tutte le alternative dello stesso braccio devono fornire gli stessi nomi con tipi e modi di binding compatibili. Qui le due alternative di uscita non introducono nomi.

## Varianti

- `if let`: tratta un caso e lascia gli altri a un eventuale `else`.
- `while let`: ripete finche il pattern corrisponde.
- `let PATTERN = value`: destructuring irrefutabile.
- `let ... else`: continua solo se il pattern riesce, altrimenti esce dal flusso corrente.
- Range, `@` e combinazioni annidate: approfonditi in [[Programmazione/Rust/Pagine/Pattern matching avanzato|Pattern matching avanzato]].

### Un predicato con matches!

```rust
fn main() {
    let message = Some(String::from("ciao"));
    assert!(matches!(&message, Some(text) if !text.is_empty()));
    assert_eq!(message.as_deref(), Some("ciao"));
    assert!(!matches!(None::<String>, Some(_)));
}
```

La macro restituisce un `bool`, non esporta i binding al codice successivo. Anche qui un binding per valore puo spostare dati: `&message` rende esplicita l'intenzione di conservare il contenitore.

## Errori comuni

### Guardie senza fallback

Questo programma **non compila** (E0004):

```rust
fn sign(number: i32) -> &'static str {
    match number {
        value if value < 0 => "negativo",
        value if value >= 0 => "non negativo",
    }
}

fn main() {}
```

Anche se le due condizioni sembrano coprire tutti gli interi, le guardie non forniscono questa garanzia al controllo di esaustivita. Sostituisci il secondo pattern con `_ => "non negativo"`.

### Tipi incompatibili

Questo programma **non compila** (E0308):

```rust
fn main() {
    let value = Some(3);
    let result = match value {
        Some(number) => number,
        None => "assente",
    };
    println!("{result}");
}
```

Decidi un contratto comune: per esempio una `String`, oppure `Option<i32>` se l'assenza deve restare strutturata. Rust non crea automaticamente un'unione tra intero e stringa.

Altri errori frequenti:

- Mettere un catch-all prima dei casi specifici: i bracci successivi diventano irraggiungibili.
- Usare `_` su enum in evoluzione quando vuoi che nuove varianti richiedano una decisione esplicita.
- Confondere esaustivita con correttezza della logica o validazione dei dati.
- Usare dopo il match un contenitore dal quale e stato spostato un campo.

## Checklist

- Ogni caso importante ha un comportamento esplicito?
- Il primo ramo valido e quello desiderato, anche ai confini?
- Le guardie hanno un fallback non condizionato?
- Sai se i binding copiano, spostano o prendono in prestito?
- Il tipo comune rappresenta anche assenza ed errore?
- Le nuove varianti devono richiedere un aggiornamento o ricadere nel catch-all?

## Collegamenti

- [[Programmazione/Rust/Pagine/Enums|Enums]]
- [[Programmazione/Rust/Pagine/Pattern base|Pattern base]]
- [[Programmazione/Rust/Pagine/if let e while let|if let e while let]]
- [[Programmazione/Rust/Pagine/Destructuring|Destructuring]]
- [[Programmazione/Rust/Pagine/Pattern matching avanzato|Pattern matching avanzato]]
- [[Programmazione/Rust/Pagine/Option|Option]]
- [[Programmazione/Rust/Pagine/Result|Result]]

## Fonti

- [Rust Book: match](https://doc.rust-lang.org/book/ch06-02-match.html).
- [Rust Reference: match expressions](https://doc.rust-lang.org/reference/expressions/match-expr.html).
- [Rust Book: pattern syntax e guardie](https://doc.rust-lang.org/book/ch19-03-pattern-syntax.html).
- [Standard library: matches!](https://doc.rust-lang.org/std/macro.matches.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
