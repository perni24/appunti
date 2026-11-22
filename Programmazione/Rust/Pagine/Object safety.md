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
  - Object safety Rust
  - dyn compatibility
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Trait objects e dyn Trait]]"
related:
  - "[[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch]]"
  - "[[Programmazione/Rust/Pagine/Associated types]]"
  - "[[Programmazione/Rust/Pagine/Public API design]]"
title: Object safety
---

# Object safety

## Sintesi

**Object safety** e il nome storico di cio che la documentazione Rust chiama **dyn compatibility**: le condizioni che permettono a un trait di essere il trait base di un tipo come `dyn Parser`.

Non significa sicurezza della memoria, correttezza dell'algoritmo o thread safety. Un trait non dyn-compatible puo essere valido e utile con tipi concreti e parametri generici; e la sua trasformazione in trait object a non essere disponibile.

Questa nota riguarda **Rust 1.99.1, edition 2024**. Ogni blocco Rust e autonomo; i due controesempi segnalati devono fallire con **E0038**. Il titolo storico resta invariato per conservare collegamenti e URL.

## Quando usarlo

- Quando progetti un'interfaccia da usare tramite `&dyn Trait`, `Box<dyn Trait>` o altri puntatori.
- Quando il compilatore segnala E0038 e occorre individuare l'item incompatibile.
- Quando vuoi mantenere costruttori o helper generici per i tipi concreti, senza esporli tramite `dyn`.
- Quando valuti un cambiamento a un trait pubblico: aggiungere un item puo impedirne l'uso come trait object.

Non ogni trait deve diventare dyn-compatible. Prima stabilisci se serve davvero cancellare il tipo concreto: vedi [[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch|Static dispatch vs dynamic dispatch]].

## Come funziona

### Trait compatibile e metodo invocabile non sono la stessa cosa

Un trait object espone un contratto comune senza rivelare il tipo concreto. Per una chiamata dinamica devono essere determinati firma, receiver e tipi degli argomenti/risultati; non basta che ogni implementazione sappia eseguire il proprio metodo.

Un trait puo contenere **metodi esclusi** con `where Self: Sized`. Il trait rimane utilizzabile come `dyn` se soddisfa le altre regole, ma quei metodi richiedono un implementatore concreto sized. Il vincolo non e una conversione o un controllo runtime. [Diagnostica E0038](https://doc.rust-lang.org/error_codes/E0038.html)

Al contrario, `trait Parser: Sized` impone il vincolo all'intero trait e impedisce `dyn Parser`. Un `Box<dyn Parser>` ha dimensione nota, ma il valore `dyn Parser` al suo interno resta unsized. [Standard library: Sized](https://doc.rust-lang.org/std/marker/trait.Sized.html)

### Regole da controllare

| Elemento                                     | Compatibilita con l'interfaccia dinamica                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Supertrait                                   | Devono essere dyn-compatible; non devono imporre `Self: Sized`.                                                          |
| `&self`, `&mut self`                         | Receiver ammessi.                                                                                                        |
| `self: Box<Self>`, `Rc<Self>`, `Arc<Self>`   | Receiver ammessi; il contratto di ownership resta quello del puntatore.                                                  |
| `self: Pin<P>`                               | Ammesso quando P e uno dei receiver puntatore supportati, non per qualunque wrapper arbitrario.                          |
| Metodo con parametri di tipo o const         | Non dispatchabile; puo essere escluso con `where Self: Sized`. Vale anche per `impl Trait` nei parametri.                |
| Metodo con sole lifetime generiche           | Puo essere dispatchabile: non va confuso con un metodo generico sul tipo.                                                |
| Funzione associata senza receiver            | Non dispatchabile; puo restare nel trait con `where Self: Sized`.                                                        |
| `Self` concreto come argomento/risultato     | Non dispatchabile, anche in `&Self` fuori dal receiver. Un tipo associato fissato, come `Self::Item`, e un caso diverso. |
| Tipo associato ordinario                     | Ammesso, specificandolo nel trait object quando richiesto, per esempio `dyn Iterator<Item = u8>`.                        |
| GAT disponibile nell'interfaccia dinamica    | Non supportato nella baseline di questa nota.                                                                            |
| Costante associata                           | Impedisce dyn compatibility, anche con un valore di default.                                                             |
| Metodo `async fn` o con ritorno `impl Trait` | Non dispatchabile nativamente; stabilita della sintassi e compatibilita con dyn sono questioni distinte.                 |

Questa e una guida di lettura delle [regole della Rust Reference](https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility), non una promessa sul layout o sull'ABI della vtable.

Il receiver ammesso non garantisce che qualsiasi costruttore del puntatore funzioni: `Pin::new` richiede `Unpin` sul valore puntato. Un semplice `dyn Trait` non promette quel marker; costruire prima un Pin sul tipo concreto Unpin e poi convertirlo e diverso dal chiamare Pin::new su un riferimento gia cancellato. [Standard library: Pin::new](https://doc.rust-lang.org/std/pin/struct.Pin.html#method.new)

### Perche restituire Self e diverso da restituire un tipo noto

Controesempio: il trait e valido, ma la conversione richiesta in `main` deve fallire con **E0038**.

```rust
trait CloneLike {
    fn clone_like(&self) -> Self;
}

struct Token(u32);

impl CloneLike for Token {
    fn clone_like(&self) -> Self { Token(self.0) }
}

fn main() {
    let token = Token(7);
    assert_eq!(token.clone_like().0, 7);
    let _object: &dyn CloneLike = &token;
}
```

La chiamata sul tipo concreto funziona; la stessa interfaccia cancellata non espone quale tipo concreto debba tornare. Anche `fn compare(&self, other: &Self)` richiede che l'altro argomento abbia lo stesso tipo concreto nascosto: non equivale a un qualunque `&dyn CloneLike`.

La soluzione dipende dal contratto: escludere il metodo, mantenere il tipo concreto o progettare un ritorno erased esplicito. Lo standard `Clone` richiede inoltre `Sized`: aggiungerlo come supertrait non rende clonabile automaticamente un trait object. [Standard library: Clone](https://doc.rust-lang.org/std/clone/trait.Clone.html)

## API / Sintassi

### Parser con costruttore e helper esclusi

```rust
trait Parser {
    fn parse(&self, input: &str) -> bool;

    fn new() -> Self
    where
        Self: Sized;

    fn accepts<T: AsRef<str>>(&self, input: T) -> bool
    where
        Self: Sized,
    {
        self.parse(input.as_ref())
    }
}

struct AsciiDigits;

impl Parser for AsciiDigits {
    fn new() -> Self { Self }

    fn parse(&self, input: &str) -> bool {
        !input.is_empty() && input.bytes().all(|byte| byte.is_ascii_digit())
    }
}

fn run(parser: &dyn Parser, input: &str) -> bool {
    parser.parse(input)
}

fn main() {
    let parser = AsciiDigits::new();
    assert!(parser.accepts(String::from("0123")));
    assert!(run(&parser, "42"));
    assert!(!run(&parser, ""));
    assert!(!run(&parser, "-2"));
}
```

`new` e `accepts` restano disponibili su `AsciiDigits`; `parse` e chiamabile attraverso `&dyn Parser`. Togliere il bound da uno dei due item esclusi rende il trait incompatibile.

Il demo riconosce soltanto una sequenza non vuota di cifre ASCII. Non converte in un intero, non impone un limite numerico, non esegue trim e non e un parser generale: anche una sequenza molto lunga di cifre e accettata.

Un `Box<dyn Parser>` non rende automaticamente invocabile `accepts`: il box non implementa da solo ogni trait personalizzato del suo contenuto. Il metodo sul valore cancellato continua a richiedere `Self: Sized`.

### Tipi associati fissati nel contratto

```rust
trait Source {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
}

struct Words(std::vec::IntoIter<String>);

impl Source for Words {
    type Item = String;
    fn next(&mut self) -> Option<Self::Item> { self.0.next() }
}

fn main() {
    let mut words = Words(vec![String::from("uno"), String::from("due")].into_iter());
    let source: &mut dyn Source<Item = String> = &mut words;
    assert_eq!(source.next().as_deref(), Some("uno"));
    assert_eq!(source.next().as_deref(), Some("due"));
    assert_eq!(source.next(), None);
}
```

`Self::Item` qui e noto come `String`: non e il tipo concreto nascosto dell'implementatore. Omettere il vincolo `Item` non significa "qualunque tipo a ogni chiamata".

Un GAT e una famiglia di tipi e non e intercambiabile con questo esempio. Un GAT escluso tramite `Self: Sized` non viene reso utilizzabile attraverso `dyn`; una API lending basata su quel GAT richiede un altro design. Vedi [[Programmazione/Rust/Pagine/Generic Associated Types (GAT)|Generic Associated Types (GAT)]].

### Parametri del trait e lifetime dei metodi

```rust
trait Convert<T> {
    fn convert(&self, value: T) -> String;
}

trait Word {
    fn first<'a>(&self, input: &'a str) -> &'a str;
}

struct TextTools;

impl Convert<u32> for TextTools {
    fn convert(&self, value: u32) -> String { value.to_string() }
}

impl Word for TextTools {
    fn first<'a>(&self, input: &'a str) -> &'a str {
        input.split_whitespace().next().unwrap_or("")
    }
}

fn main() {
    let tools = TextTools;
    let converter: &dyn Convert<u32> = &tools;
    assert_eq!(converter.convert(42), "42");

    let input = String::from("  prima seconda");
    let words: &dyn Word = &tools;
    assert_eq!(words.first(&input), "prima");
    assert_eq!(words.first(""), "");
}
```

Il parametro del **trait** e fissato in `dyn Convert<u32>`; non permette di scegliere un nuovo tipo per ogni chiamata al metodo. Invece la lifetime di `first` e un parametro del metodo compatibile con dyn e lega il risultato all'input, non alla durata di `TextTools`.

`split_whitespace` definisce il significato di "parola" del demo: non e tokenizzazione linguistica o parsing di comandi con virgolette. Per una stringa vuota o fatta di soli spazi il risultato e `""`.

## Esempio pratico

### Command con helper di boxing e consumo esplicito

```rust
trait Command {
    fn name(&self) -> &str;
    fn execute(&self) -> String;

    fn finish(self: Box<Self>) -> String {
        self.execute()
    }

    fn boxed(self) -> Box<dyn Command>
    where
        Self: Sized + 'static,
    {
        Box::new(self)
    }
}

struct Message(String);

impl Command for Message {
    fn name(&self) -> &str { "message" }
    fn execute(&self) -> String { format!("message: {}", self.0) }
}

fn main() {
    let command = Message(String::from("ciao")).boxed();
    assert_eq!(command.name(), "message");
    assert_eq!(command.execute(), "message: ciao");
    assert_eq!(command.finish(), "message: ciao");
}
```

- `name` ed `execute` usano un prestito condiviso e sono invocabili dal trait object.
- `finish` usa `self: Box<Self>`: consuma il proprietario boxed ed e dispatchabile anche su `Box<dyn Command>`. Dopo la chiamata il box non e riutilizzabile.
- `boxed` prende `Self` per valore ed e escluso con `Self: Sized`; l'helper viene chiamato prima di cancellare il tipo.
- `'static` sul helper evita prestiti non-static nel valore restituito. Non obbliga il comando a vivere per sempre: viene distrutto normalmente.
- `execute` produce solo una stringa. Non avvia processi, non esegue shell, non gestisce errori I/O e non costituisce un sistema di plugin con ABI stabile.

Un receiver `self` per valore non e equivalente a `self: Box<Self>`. Un trait con `fn consume(self)` puo essere dyn-compatible, ma non puoi spostare direttamente il valore unsized fuori da un trait object per invocarlo.

## Varianti

### Async nativo non significa dyn-compatible

Controesempio: sulla baseline indicata il metodo `async fn` e valido, ma `&dyn NativeLookup` deve fallire con **E0038**.

```rust
trait NativeLookup {
    async fn find(&self, key: &str) -> bool;
}

struct Memory;

impl NativeLookup for Memory {
    async fn find(&self, key: &str) -> bool { key == "name" }
}

fn main() {
    let service = Memory;
    let _object: &dyn NativeLookup = &service;
}
```

Lo stesso problema riguarda un metodo che restituisce direttamente `impl Future` o un altro `impl Trait`. Puoi mantenerlo per i tipi concreti con `where Self: Sized`, ma cosi non puoi chiamarlo via dyn.

L'introduzione di async fn e return-position impl Trait nei trait non implicava il supporto al dispatch dinamico. [Rust Blog: stabilizzazione in Rust 1.75](https://blog.rust-lang.org/2023/12/21/async-fn-rpit-in-traits/)

### Future restituito come trait object

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll, Waker};

trait Lookup {
    fn find<'a>(
        &'a self,
        key: &'a str,
    ) -> Pin<Box<dyn Future<Output = Option<&'a str>> + 'a>>;
}

struct MemoryName(String);

impl Lookup for MemoryName {
    fn find<'a>(
        &'a self,
        key: &'a str,
    ) -> Pin<Box<dyn Future<Output = Option<&'a str>> + 'a>> {
        Box::pin(async move {
            if key == "name" { Some(self.0.as_str()) } else { None }
        })
    }
}

fn main() {
    let memory = MemoryName(String::from("Ada"));
    let service: &dyn Lookup = &memory;
    let mut future = service.find("name");
    let mut context = Context::from_waker(Waker::noop());
    assert_eq!(future.as_mut().poll(&mut context), Poll::Ready(Some("Ada")));
}
```

Qui la firma espone un tipo preciso di puntatore, non un ritorno opaco diverso per implementazione. `Future` e dyn-compatible quando specifichi `Output`; `Pin` consente il polling anche quando il future non e `Unpin`. [Standard library: Future](https://doc.rust-lang.org/std/future/trait.Future.html)

Il future prende in prestito servizio e chiave: `'a` non ne prolunga la vita. Questa firma **non promette Send**; aggiungerlo richiede che le implementazioni e le catture soddisfino il vincolo.

Il test esegue un solo poll perche questa implementazione non attende nulla e restituisce subito Ready. **Non e un executor**: un future I/O che restituisce Pending richiede un runtime e notifiche di risveglio reali, non un ciclo che lo interroga continuamente. Non ripollare un future completato. [Future::poll](https://doc.rust-lang.org/std/future/trait.Future.html#tymethod.poll), [Waker::noop](https://doc.rust-lang.org/std/task/struct.Waker.html#method.noop)

### Separare l'interfaccia dinamica dagli helper

Puoi lasciare nel trait base solo le operazioni necessarie ai consumer dinamici e spostare costruttori/helper generici in metodi inerenti o in un extension trait. Non aggiungere un vincolo `Sized` all'intero trait base per risolvere un solo metodo.

Una costante associata che deve essere accessibile dinamicamente puo diventare un metodo con receiver, per esempio `fn version(&self) -> u32`. E un cambiamento di contratto, non un modo per mettere la stessa costante nella vtable.

`dyn Trait + Send + Sync` richiede inoltre implementazioni compatibili con quei marker: non ripara un trait non dyn-compatible e non rende automaticamente thread-safe uno stato interno.

## Errori comuni

- **Considerare ogni uso di Self vietato**: il receiver e necessario, e `Self::Item` fissato non equivale a restituire l'implementatore concreto.
- **Confondere trait generico e metodo generico**: `dyn Convert<u32>` puo funzionare; `fn convert<T>` senza esclusione no.
- **Escludere un metodo e aspettarsi di chiamarlo via dyn**: `Self: Sized` conserva la compatibilita del trait proprio restringendo l'accesso a quel metodo.
- **Pensare che un default basti**: una costante associata o un metodo generico restano problematici anche se hanno gia un'implementazione.
- **Dimenticare i supertrait**: `Clone`, `Sized` o un supertrait che usa `Self` come proprio parametro possono impedire l'interfaccia dinamica.
- **Trasformare ogni API in Box**: ownership, lifetime, allocazioni e Send restano scelte separate dalla compatibilita.
- **Equiparare object safety a sicurezza dell'applicazione**: non dimostra autorizzazioni, validazione, assenza di panic o correttezza logica.

## Checklist

- [ ] Mi serve davvero un trait object oppure posso mantenere il tipo concreto?
- [ ] Tutti i supertrait sono compatibili e non impongono Self: Sized?
- [ ] Ci sono costanti associate, GAT o usi del Self concreto da riprogettare?
- [ ] I metodi dinamici hanno receiver supportati e non hanno parametri tipo/const?
- [ ] Ho distinto i parametri lifetime dai parametri di tipo?
- [ ] Costruttori e helper esclusi sono ancora disponibili dove mi servono?
- [ ] Ho specificato tipi associati e argomenti del trait nel tipo dyn?
- [ ] Async, ownership, lifetime e Send sono espliciti nel contratto?
- [ ] Ho verificato sia la costruzione del trait object sia le chiamate richieste?

## Collegamenti

- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]
- [[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch|Static dispatch vs dynamic dispatch]]
- [[Programmazione/Rust/Pagine/Associated types|Associated types]]
- [[Programmazione/Rust/Pagine/Generic Associated Types (GAT)|Generic Associated Types (GAT)]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]

## Fonti

- [Rust Reference: dyn compatibility](https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility).
- [Rust: spiegazione dell'errore E0038](https://doc.rust-lang.org/error_codes/E0038.html).
- [Rust Reference: trait object types](https://doc.rust-lang.org/reference/types/trait-object.html).
- [Standard library: Sized](https://doc.rust-lang.org/std/marker/trait.Sized.html).
- [Standard library: Clone](https://doc.rust-lang.org/std/clone/trait.Clone.html).
- [Rust Blog: async fn e impl Trait nei trait](https://blog.rust-lang.org/2023/12/21/async-fn-rpit-in-traits/).
- [Standard library: Future e contratto di poll](https://doc.rust-lang.org/std/future/trait.Future.html).
- [Standard library: Waker::noop](https://doc.rust-lang.org/std/task/struct.Waker.html#method.noop).
- [Standard library: Pin::new e Unpin](https://doc.rust-lang.org/std/pin/struct.Pin.html#method.new).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
