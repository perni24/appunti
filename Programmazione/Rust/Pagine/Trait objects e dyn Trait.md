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
  - Trait object
  - dyn Trait
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Object safety]]"
  - "[[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch]]"
  - "[[Programmazione/Rust/Pagine/Trait bounds]]"
  - "[[Programmazione/Rust/Pagine/Box T]]"
title: Trait objects e dyn Trait
---

# Trait objects e dyn Trait

## Sintesi

Un **trait object** nasconde il tipo concreto di un valore e lo rende utilizzabile attraverso un'interfaccia comune. `dyn Trait` e il tipo dinamicamente dimensionato; `&dyn Trait`, `Box<dyn Trait>` e `Arc<dyn Trait>` sono modi diversi di riferirsi a quel valore o possederlo.

Le chiamate ai metodi disponibili attraverso l'interfaccia usano **dynamic dispatch**. Il compilatore verifica comunque che l'implementazione e i bound richiesti siano validi: non e duck typing o un oggetto a cui aggiungere metodi arbitrari durante l'esecuzione. [Rust Book: trait objects](https://doc.rust-lang.org/book/ch18-02-trait-objects.html)

Gli esempi sono verificati con **Rust 1.99.1, edition 2024**. Ogni blocco Rust e autonomo; il controesempio finale deve fallire in compilazione. Non e una verifica della versione minima supportata.

## Quando usarlo

- Per una collezione che contiene implementazioni concrete diverse della stessa interfaccia.
- Per scegliere un'implementazione in base a una configurazione runtime e restituire un tipo comune.
- Per passare un servizio sostituibile a una funzione che non deve conoscere il tipo concreto.
- Per limitare la specializzazione del codice generico dove questo ha un beneficio misurato.

Nascondere un tipo non impone `dyn`: `impl Trait` in ritorno puo bastare se la funzione restituisce un unico tipo concreto. Se le alternative sono poche e note, un enum puo essere piu esplicito. Il confronto e approfondito in [[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch|Static dispatch vs dynamic dispatch]].

## Come funziona

### Tipo unsized e puntatore sono cose diverse

`dyn Draw` non ha una dimensione unica nota staticamente, perche puo rappresentare implementazioni con layout diversi. Per questo non lo usi come elemento diretto di un `Vec<dyn Draw>`: lo metti dietro un riferimento o un puntatore appropriato.

Il puntatore a trait object contiene informazioni sul valore e sulla sua **vtable**, necessarie a scegliere le implementazioni dei metodi. Sono i puntatori a essere comunemente detti _wide_ o _fat pointers_, non il valore `dyn Draw` da solo. [Rust Reference: trait objects](https://doc.rust-lang.org/reference/types/trait-object.html)

Questo modello aiuta a capire il dispatch; non autorizza a dipendere dal layout binario della vtable, a trasmutarla o a usarla come ABI stabile per plugin esterni. Anche una dimensione osservata con `size_of` non e una garanzia portabile del layout. [Rust Reference: layout dei puntatori](https://doc.rust-lang.org/reference/type-layout.html#pointers-and-references-layout)

### Tipo nascosto non significa dato trasformato

Convertire `&Button` in `&dyn Draw` non clona il bottone e non richiede un'allocazione heap per il trait object. Il proprietario resta il chiamante.

`Box<dyn Draw>` invece possiede il valore concreto attraverso `Box`. Alla distruzione esegue il distruttore appropriato del valore e rilascia la sua allocazione, quando presente. Il costo del contenitore e distinto dal costo del dispatch; neppure `Box` implica un'allocazione per un valore zero-sized. [Standard library: Box](https://doc.rust-lang.org/std/boxed/index.html#memory-layout)

La vtable non rende visibili tutti i metodi del tipo originale: tramite `dyn Draw` usi l'interfaccia dichiarata, non i campi o i metodi inerenti di `Button`. Un `Box<dyn Draw>` consente la chiamata a `draw` tramite dereferenziazione, ma non implementa automaticamente ogni trait personalizzato del valore interno.

### Il trait deve essere dyn-compatible

Non tutti i trait possono diventare `dyn Trait`. Il termine attuale e **dyn compatibility**, storicamente _object safety_. Costruttori, metodi generici e uso di `Self` possono richiedere una diversa progettazione dell'interfaccia.

Qui usiamo metodi su `&self` o `&mut self` con firme definite. Un metodo escluso tramite `where Self: Sized` non diventa chiamabile sul trait object. Le regole complete restano nella nota [[Programmazione/Rust/Pagine/Object safety|Object safety]]. [Rust Reference: dyn compatibility](https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility)

## API / Sintassi

### Riferimenti a implementazioni diverse

```rust
trait Draw {
    fn draw(&self) -> &str;
}

struct Button {
    caption: String,
}

struct Text {
    content: String,
}

impl Draw for Button {
    fn draw(&self) -> &str {
        &self.caption
    }
}

impl Draw for Text {
    fn draw(&self) -> &str {
        &self.content
    }
}

fn render(item: &dyn Draw) -> &str {
    item.draw()
}

fn main() {
    let button = Button { caption: String::from("Salva") };
    let text = Text { content: String::from("Pronto") };
    let items: [&dyn Draw; 2] = [&button, &text];

    assert_eq!(render(items[0]), "Salva");
    assert_eq!(render(items[1]), "Pronto");
    assert_eq!(button.caption, "Salva");
}
```

L'array contiene due elementi dello stesso tipo `&dyn Draw`, che puntano a valori di tipi diversi. Non possiede quei valori. Le stringhe possedute dai due oggetti hanno i loro costi, separati dalla conversione a trait object.

`render` non e generica. `draw` restituisce qui solo una rappresentazione testuale: il demo **non disegna una GUI**.

### Factory e collezione con ownership

```rust
trait Draw {
    fn draw(&self) -> &str;
}

struct Button(String);
struct Text(String);

impl Draw for Button {
    fn draw(&self) -> &str { &self.0 }
}

impl Draw for Text {
    fn draw(&self) -> &str { &self.0 }
}

fn boxed(use_button: bool) -> Box<dyn Draw> {
    if use_button {
        Box::new(Button(String::from("button")))
    } else {
        Box::new(Text(String::from("text")))
    }
}

fn render(item: &dyn Draw) -> &str {
    item.draw()
}

fn main() {
    let items: Vec<Box<dyn Draw>> = vec![boxed(true), boxed(false)];
    assert_eq!(render(items[0].as_ref()), "button");
    assert_eq!(render(items[1].as_ref()), "text");
}
```

L'annotazione del ritorno fornisce il tipo comune verso cui convertire entrambi i rami. Nel vettore ogni elemento e un `Box<dyn Draw>`: non un `Vec<T>` che cambia `T` da una posizione all'altra.

`as_ref()` presta il valore interno come `&dyn Draw` senza trasferirlo. Il vettore possiede i box e, attraverso essi, gli oggetti. Sostituire semplicemente il ritorno con `impl Draw` non rende automaticamente compatibili due tipi concreti diversi.

### Un Box puo possedere un oggetto che prende in prestito dati

```rust
trait Label {
    fn label(&self) -> &str;
}

struct BorrowedLabel<'a>(&'a str);

impl Label for BorrowedLabel<'_> {
    fn label(&self) -> &str { self.0 }
}

fn make_label<'a>(text: &'a str) -> Box<dyn Label + 'a> {
    Box::new(BorrowedLabel(text))
}

fn main() {
    let mut text = String::from("locale");
    {
        let label = make_label(&text);
        assert_eq!(label.label(), "locale");
    }
    text.push('!');
    assert_eq!(text, "locale!");
}
```

Il box possiede `BorrowedLabel`, non la stringa del chiamante. `+ 'a` esprime il limite sui prestiti contenuti nel valore nascosto; non prolunga la vita di `text`.

Per questo trait, scrivere `Box<dyn Label>` **nella firma del ritorno** senza un bound esplicito equivale a richiedere `Box<dyn Label + 'static>`: il wrapper che prende in prestito un dato locale non soddisfa quel contratto. Puoi indicare `+ 'a`, oppure progettare un'implementazione che possieda una `String`.

`'static` non significa che il box viva per sempre: un valore senza prestiti non-static puo essere distrutto subito. Nei riferimenti, come `&'a dyn Label`, il contesto fornisce invece un bound coerente con `'a` per questo trait. Le regole di default dipendono dal contesto, non sono “ogni dyn e static”. [Rust Reference: default trait object lifetimes](https://doc.rust-lang.org/reference/lifetime-elision.html#default-trait-object-lifetimes)

## Esempio pratico

### Logger sostituibile, mutabile e fallibile

```rust
use std::io::{self, Write};

trait Logger {
    fn log(&mut self, message: &str) -> io::Result<()>;
}

struct StdoutLogger;

impl Logger for StdoutLogger {
    fn log(&mut self, message: &str) -> io::Result<()> {
        let mut output = io::stdout().lock();
        writeln!(output, "{message}")?;
        output.flush()
    }
}

#[derive(Default)]
struct MemoryLogger {
    messages: Vec<String>,
}

impl Logger for MemoryLogger {
    fn log(&mut self, message: &str) -> io::Result<()> {
        self.messages.push(message.to_owned());
        Ok(())
    }
}

fn run(logger: &mut dyn Logger) -> io::Result<()> {
    logger.log("avvio")?;
    logger.log("pronto")
}

fn main() -> io::Result<()> {
    let mut memory = MemoryLogger::default();
    run(&mut memory)?;
    assert_eq!(memory.messages, ["avvio", "pronto"]);

    let mut stdout = StdoutLogger;
    run(&mut stdout)?;
    Ok(())
}
```

`run` usa la stessa interfaccia per scrivere su stdout o raccogliere messaggi in memoria. `&mut dyn Logger` presta accesso esclusivo: il logger resta di proprieta del chiamante. Il receiver mutabile permette al logger in memoria di aggiornare il vettore senza introdurre interior mutability.

Gli errori di scrittura e flush vengono propagati. Se la prima chiamata fallisce, la seconda non parte; se fallisce la seconda, gli effetti della prima non vengono annullati. Un errore I/O non garantisce che nessun byte sia gia stato scritto. [Standard library: Write](https://doc.rust-lang.org/std/io/trait.Write.html)

E un logger didattico sincrono: nessun livello, filtro, rotazione, redazione dei dati sensibili o garanzia di persistenza. Il vettore in memoria cresce senza limite applicativo; il testo non viene sanitizzato. Non e una libreria di logging pronta per produzione.

## Varianti

### Tipo associato fissato nell'interfaccia

```rust
fn numbers(reverse: bool) -> Box<dyn Iterator<Item = u32>> {
    if reverse {
        Box::new((1u32..=3).rev())
    } else {
        Box::new(1u32..=3)
    }
}

fn main() {
    let forward: Vec<u32> = numbers(false).collect();
    let backward: Vec<u32> = numbers(true).collect();
    assert_eq!(forward, [1, 2, 3]);
    assert_eq!(backward, [3, 2, 1]);
}
```

Il tipo concreto dell'iteratore cambia fra i rami, ma `Item` rimane `u32`. Il chiamante deve conoscere il tipo degli elementi: non basta lasciare `dyn Iterator` senza specificarlo.

`collect` funziona qui anche perche la libreria standard implementa `Iterator` per `Box<I>` quando `I: Iterator + ?Sized`. Non e una regola automatica per ogni `Box<dyn Trait>` personalizzato. Vedi [[Programmazione/Rust/Pagine/Associated types|Associated types]] e [impl Iterator per Box](https://doc.rust-lang.org/std/boxed/struct.Box.html#impl-Iterator-for-Box%3CI,+A%3E).

### Ownership condivisa e requisiti per i thread

```rust
use std::sync::Arc;
use std::thread;

trait Label {
    fn label(&self) -> &str;
}

struct Name(String);

impl Label for Name {
    fn label(&self) -> &str { &self.0 }
}

fn main() {
    let name: Arc<dyn Label + Send + Sync> =
        Arc::new(Name(String::from("worker")));

    let worker_name = Arc::clone(&name);
    let worker = thread::spawn(move || worker_name.label().to_owned());
    assert_eq!(worker.join().unwrap(), "worker");
    assert_eq!(name.label(), "worker");
}
```

Il contatore atomico di `Arc` rende condivisibile l'ownership, non rende automaticamente thread-safe qualunque contenuto. I bound `Send + Sync` sono verificati sul valore concreto quando viene convertito nel trait object. Per il trait `Label` qui dichiarato, `Arc<dyn Label>` da solo non basta a passare l'oggetto a `thread::spawn`, anche se `Name` e adatto.

`Arc::clone` condivide lo stesso oggetto, non clona `Name`. Il `String` restituito dal worker e invece una copia esplicita del testo. Il demo attende il thread con `join`; non dimostra un sistema di sincronizzazione per mutazioni concorrenti. [Standard library: Arc thread safety](https://doc.rust-lang.org/std/sync/struct.Arc.html#thread-safety)

Altre scelte:

- `&dyn Trait`: prestito condiviso, nessun trasferimento di ownership.
- `&mut dyn Trait`: prestito esclusivo; non basta rendere mutabile il binding di un `&dyn Trait` per ottenere questo accesso.
- `Box<dyn Trait>`: ownership esclusiva attraverso `Box`.
- `Rc<dyn Trait>`: ownership condivisa non trasferibile tra thread.
- Generics o `impl Trait`: alternative quando non serve questa forma di type erasure.
- Enum: insieme chiuso di alternative, senza obbligo di boxare ogni variante.

## Errori comuni

### Un metodo che richiede il tipo concreto nel risultato

Controesempio: deve fallire con **E0038**, perche il trait non e dyn-compatible.

```rust
trait Factory {
    fn create(&self) -> Self;
}

struct Item;

impl Factory for Item {
    fn create(&self) -> Self { Item }
}

fn main() {
    let item = Item;
    let _factory: &dyn Factory = &item;
}
```

Mettere `where Self: Sized` sul metodo puo renderlo escluso dall'interfaccia dinamica, ma non permette poi di chiamarlo tramite `&dyn Factory`. La soluzione dipende da quali operazioni devono restare disponibili.

Altri errori frequenti:

- Tentare di usare `dyn Trait` direttamente per valore dove serve `Sized`.
- Cercare campi o metodi esclusivi del tipo concreto dopo averne nascosto l'identita.
- Usare `Box` per far sparire un errore di lifetime: possedere il wrapper non equivale a possedere i dati che esso prende in prestito.
- Scrivere `dyn TraitA + TraitB` con due trait ordinari: non e ammesso. Se appropriato, definisci un trait base con entrambi come supertrait e implementalo per i tipi desiderati. I due supertrait devono essere dyn-compatible.
- Omettere `Send`/`Sync` quando il contratto li richiede, oppure aspettarsi che aggiungerli renda valido un tipo concreto non compatibile.
- Dare per scontato che un trait object sia sempre piu lento o piu piccolo: dispatch, allocazioni, ottimizzazioni e dimensione del binario sono aspetti distinti da misurare.

## Checklist

- [ ] Serve davvero nascondere tipi concreti diversi dietro una stessa interfaccia?
- [ ] Il trait e dyn-compatible e include le operazioni necessarie?
- [ ] Ho scelto consapevolmente fra prestito, ownership esclusiva e condivisa?
- [ ] Lifetime e tipi associati sono espliciti dove necessario?
- [ ] Receiver e auto trait riflettono mutazioni e uso tra thread?
- [ ] Gli errori mantengono significato anche cambiando implementazione?
- [ ] Ho valutato un enum o un tipo generico senza assumere prestazioni universali?

## Collegamenti

- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Object safety|Object safety]]
- [[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch|Static dispatch vs dynamic dispatch]]
- [[Programmazione/Rust/Pagine/Associated types|Associated types]]
- [[Programmazione/Rust/Pagine/Trait bounds|Trait bounds]]
- [[Programmazione/Rust/Pagine/Box T|Box T]]
- [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc<T> e Arc<T>]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]

## Fonti

- [Rust Reference: trait objects](https://doc.rust-lang.org/reference/types/trait-object.html).
- [Rust Reference: layout dei puntatori](https://doc.rust-lang.org/reference/type-layout.html#pointers-and-references-layout).
- [Rust Reference: dyn compatibility](https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility).
- [Rust Reference: default trait object lifetimes](https://doc.rust-lang.org/reference/lifetime-elision.html#default-trait-object-lifetimes).
- [Rust Book: astrazione tramite trait objects](https://doc.rust-lang.org/book/ch18-02-trait-objects.html).
- [Standard library: Box](https://doc.rust-lang.org/std/boxed/index.html).
- [Standard library: Write e scrittura fallibile](https://doc.rust-lang.org/std/io/trait.Write.html).
- [Standard library: Arc e thread safety](https://doc.rust-lang.org/std/sync/struct.Arc.html#thread-safety).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
