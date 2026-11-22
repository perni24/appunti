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
  - enums
  - tipi-dato
aliases:
  - Enum Rust
  - Enumerazioni Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Structs]]"
  - "[[Programmazione/Rust/Pagine/Pattern base]]"
related:
  - "[[Programmazione/Rust/Pagine/Option]]"
  - "[[Programmazione/Rust/Pagine/Result]]"
  - "[[Programmazione/Rust/Pagine/Pattern Matching]]"
title: Enums
---

# Enums

## Sintesi

Un **enum** descrive alternative: un valore appartiene a una sola variante alla volta, con gli eventuali dati di quella variante. Una struct riunisce campi; un enum sceglie fra forme diverse.

Questo aiuta a modellare stati, comandi e risultati senza combinazioni incoerenti di flag. Non valida automaticamente i dati contenuti o le transizioni fra stati. Gli esempi autonomi sono verificati con Rust **1.99.1**, edition **2024**; il controesempio non compilabile e indicato.

## Quando usarlo

- Quando un valore puo assumere un insieme definito di forme alternative.
- Quando ogni stato richiede dati diversi.
- Quando vuoi che match controlli la copertura dei casi.
- Quando una API deve distinguere assenza, successo ed errore tramite Option o Result.

Gli enum sono adatti a un insieme di varianti definito dal tipo. Per implementazioni estensibili da altri utenti puo servire un trait; non e lo stesso problema.

## Come funziona

Le varianti si costruiscono attraverso il nome dell'enum e ::. Possono essere senza dati, tuple-like o con campi nominati. Non sono tipi indipendenti da usare come parametro al posto dell'enum.

### Tre forme nello stesso tipo

```rust
enum OrderState {
    Created,
    Paid { receipt: String },
    Shipped(String),
    Cancelled,
}

fn describe(state: &OrderState) -> String {
    match state {
        OrderState::Created => String::from("creato"),
        OrderState::Paid { receipt } => format!("pagato: {receipt}"),
        OrderState::Shipped(tracking) => format!("spedito: {tracking}"),
        OrderState::Cancelled => String::from("annullato"),
    }
}

fn main() {
    let states = [
        OrderState::Created,
        OrderState::Paid { receipt: String::from("R-1") },
        OrderState::Shipped(String::from("TRK123")),
        OrderState::Cancelled,
    ];
    let descriptions: Vec<String> = states.iter().map(describe).collect();
    assert_eq!(descriptions, [
        "creato", "pagato: R-1", "spedito: TRK123", "annullato",
    ]);
}
```

Il match prende in prestito state: receipt e tracking sono riferimenti, non copie delle String. La funzione produce una nuova descrizione posseduta. Un valore Paid contiene receipt, ma il solo enum non impedisce una ricevuta vuota o fittizia.

In un enum pubblico le varianti e i relativi campi seguono la visibilita dell'enum, diversamente dai campi privati di una struct pubblica. Per imporre validazione possono servire tipi di payload con costruzione controllata o un wrapper privato.

## API / Sintassi

### Metodi, modifica e consumo

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(u8, u8, u8),
}

impl Message {
    fn kind(&self) -> &'static str {
        match self {
            Self::Quit => "quit",
            Self::Move { .. } => "move",
            Self::Write(_) => "write",
            Self::ChangeColor(..) => "color",
        }
    }

    fn append_marker(&mut self) {
        if let Self::Write(text) = self {
            text.push('!');
        }
    }

    fn into_text(self) -> Option<String> {
        match self {
            Self::Write(text) => Some(text),
            _ => None,
        }
    }
}

fn main() {
    let mut message = Message::Write(String::from("ciao"));
    assert_eq!(message.kind(), "write");
    message.append_marker();
    assert_eq!(message.into_text(), Some(String::from("ciao!")));

    assert_eq!(Message::Quit.kind(), "quit");
    assert_eq!(Message::Move { x: 1, y: 2 }.kind(), "move");
    assert_eq!(Message::ChangeColor(255, 0, 0).kind(), "color");
}
```

kind restituisce literal statici; append_marker modifica solo Write; into_text consuma l'enum e trasferisce la String senza clonarla. Non ogni match per valore sposta tutti i dati: dipende dai binding del pattern. In questo caso text e acquisito per valore.

Il ramo \_ di into_text e intenzionale: le altre varianti non contengono testo. Nel metodo kind si elencano invece tutti i casi, cosi una nuova variante richiede una decisione esplicita.

### Caso non coperto

Questo programma **non compila** (E0004):

```rust
enum State {
    Ready,
    Busy,
}

fn is_ready(state: State) -> bool {
    match state {
        State::Ready => true,
    }
}

fn main() {}
```

Aggiungi il ramo Busy con il comportamento desiderato. Una wildcard rende esaustivo il match, ma puo nascondere la necessita di trattare nuove varianti in modo diverso.

## Esempio pratico

### Comandi con dati pertinenti

```rust
#[derive(Debug)]
enum Command {
    List,
    Add { title: String },
    Remove(u64),
}

fn command_summary(command: Command) -> String {
    match command {
        Command::List => String::from("lista elementi"),
        Command::Add { title } => format!("aggiungo {title}"),
        Command::Remove(id) => format!("rimuovo {id}"),
    }
}

fn main() {
    assert_eq!(command_summary(Command::List), "lista elementi");
    assert_eq!(
        command_summary(Command::Add { title: String::from("studiare Rust") }),
        "aggiungo studiare Rust",
    );
    assert_eq!(command_summary(Command::Remove(42)), "rimuovo 42");
}
```

List non puo avere un id aggiuntivo, mentre Add richiede title. La funzione **genera soltanto un riepilogo**, non esegue operazioni su database o filesystem. Non dimostra autorizzazione, esistenza dell'ID o validita del titolo: queste regole richiedono altre verifiche.

Per un workflow, dichiarare gli stati non vincola da solo l'ordine delle transizioni. Le transizioni vanno modellate con funzioni, metodi o tipi dedicati.

## Varianti

### Enum generici gia disponibili

```rust
fn parse_limit(input: Option<&str>) -> Result<Option<u32>, std::num::ParseIntError> {
    input.map(str::parse::<u32>).transpose()
}

fn main() {
    assert_eq!(parse_limit(None).unwrap(), None);
    assert_eq!(parse_limit(Some("12")).unwrap(), Some(12));
    assert!(parse_limit(Some("abc")).is_err());
}
```

Option distingue assenza da presenza; Result distingue successo da errore. Sono enum generici della standard library: non serve creare un Maybe<T> identico. Nel demo assente, valido e malformato rimangono tre esiti distinti. Le API map e transpose sono approfondite nelle note dedicate.

### Ricorsione con indirezione

```rust
enum List {
    Empty,
    Node(i32, Box<List>),
}

impl List {
    fn len(&self) -> usize {
        match self {
            Self::Empty => 0,
            Self::Node(_, tail) => 1 + tail.len(),
        }
    }
}

fn main() {
    let list = List::Node(10, Box::new(
        List::Node(20, Box::new(List::Empty)),
    ));
    assert_eq!(list.len(), 2);
    assert_eq!(List::Empty.len(), 0);
}
```

Un collegamento diretto Node(i32, List) richiederebbe una dimensione infinita. Box interrompe la ricorsione del layout; non e l'unica possibile indirezione. Il demo e piccolo: visita e distruzione di catene molto profonde possono esaurire lo stack. Per una sequenza ordinaria valuta Vec, senza introdurre liste concatenate per abitudine.

### Discriminanti espliciti

```rust
#[repr(u8)]
enum Priority {
    Low = 1,
    High = 2,
}

fn main() {
    assert_eq!(Priority::Low as u8, 1);
    assert_eq!(Priority::High as u8, 2);
}
```

Questo enum senza payload ha codici espliciti. Non implica una conversione automatica inversa da qualsiasi u8. La rappresentazione Rust ordinaria non va trattata come formato binario stabile: padding, discriminante e ottimizzazioni del layout non sono una serializzazione.

## Errori comuni

- Usare flag indipendenti per stati che dovrebbero escludersi a vicenda.
- Pensare che esaustivita equivalga a correttezza della logica.
- Supporre che un enum impedisca contenuti invalidi o transizioni non autorizzate.
- Clonare payload per poterli leggere, quando basta un riferimento.
- Derivare Copy se una variante contiene String, oppure Eq se contiene f64.
- Convertire byte non validati in enum tramite unsafe.
- Aggiungere varianti a una API pubblica senza considerare i match degli utilizzatori.

Per API destinate a crescere, non_exhaustive cambia il contratto visto da altre crate: i consumatori devono prevedere casi non noti. Non ha lo stesso effetto dentro la crate che definisce il tipo; non e un sostituto di una politica di compatibilita.

## Checklist

- Le varianti sono davvero alternative?
- Ogni variante contiene soltanto i dati pertinenti?
- Validazione dei payload e transizioni sono esplicite?
- Il match legge, modifica o consuma?
- Le wildcard sono una scelta intenzionale?
- Layout e serializzazione sono tenuti distinti?
- Qual e l'effetto di una variante nuova sugli utilizzatori?

## Collegamenti

- [[Programmazione/Rust/Pagine/Pattern base|Pattern base]]
- [[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]]
- [[Programmazione/Rust/Pagine/Option|Option]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/Structs|Structs]]
- [[Programmazione/Rust/Pagine/Box T|Box<T>]]
- [[Programmazione/Rust/Pagine/Typestate pattern|Typestate pattern]]

## Fonti

- [Rust Book: Defining an Enum](https://doc.rust-lang.org/book/ch06-01-defining-an-enum.html).
- [Rust Book: match](https://doc.rust-lang.org/book/ch06-02-match.html).
- [Rust Reference: Enumerations](https://doc.rust-lang.org/reference/items/enumerations.html).
- [Rust Reference: Type layout](https://doc.rust-lang.org/reference/type-layout.html).
- [Rust Reference: non_exhaustive](https://doc.rust-lang.org/reference/attributes/type_system.html#the-non_exhaustive-attribute).
- [Rust Book: Recursive types with Box](https://doc.rust-lang.org/book/ch15-01-box.html).
- [Standard library: Option e transpose](https://doc.rust-lang.org/std/option/enum.Option.html#method.transpose).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
