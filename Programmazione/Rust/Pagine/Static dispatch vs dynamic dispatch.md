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
  - Static dispatch
  - Dynamic dispatch
  - Dispatch Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Generics]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Trait objects e dyn Trait]]"
related:
  - "[[Programmazione/Rust/Pagine/Zero-cost abstractions]]"
  - "[[Programmazione/Rust/Pagine/Object safety]]"
  - "[[Programmazione/Rust/Pagine/Performance e profiling]]"
title: Static dispatch vs dynamic dispatch
---

# Static dispatch vs dynamic dispatch

## Sintesi

Il **dispatch** riguarda il modo in cui viene individuata l'implementazione da chiamare:

- **Static dispatch**: la destinazione della chiamata puo essere determinata dal tipo noto al compilatore, per esempio un'implementazione di trait per un tipo concreto.
- **Dynamic dispatch tramite trait object**: l'interfaccia e nota staticamente, ma la chiamata usa l'implementazione associata al valore nascosto da `dyn Trait`.

Non e una distinzione tra “codice eseguito in compilazione” e “codice eseguito a runtime”: anche una funzione con dispatch statico normalmente elabora dati durante l'esecuzione.

La formula “generics = statico, dyn = dinamico” e utile come prima approssimazione, ma non descrive da sola tutte le chiamate interne a una funzione. Un generic puo ricevere un trait object attraverso un riferimento, oppure un puntatore a funzione la cui destinazione varia.

Gli esempi sono verificati con **Rust 1.99.1, edition 2024**. Ogni blocco Rust e autonomo; il controesempio indicato deve fallire in compilazione. Sono verifiche di tipi e risultati, **non benchmark o garanzie sul codice macchina prodotto**.

## Quando usarlo

- Preferisci parametri generici quando vuoi conservare informazioni sul tipo e comporre implementazioni senza cancellarne l'identita.
- Usa `dyn Trait` quando serve un'interfaccia comune per valori concreti diversi, per esempio handler selezionabili o servizi sostituibili.
- Considera un enum quando le alternative sono poche e note e vuoi rappresentarle esplicitamente.
- Esamina i costi quando il profiling indica un percorso rilevante: non scegliere soltanto in base alla parola “statico” o “dinamico”.

Una dipendenza sostituibile non richiede sempre `dyn`: anche una funzione generica puo accettare un test double. Analogamente, una decisione runtime non richiede per forza una vtable.

## Come funziona

### Monomorfizzazione e informazione sul tipo

Con `fn run<T: Task>(task: &T)`, il chiamante determina `T`. Rust usa la **monomorfizzazione** per tradurre il codice generico nelle istanze concrete necessarie: non genera una nuova versione a runtime per ogni valore passato. [Rust Book: generics e monomorfizzazione](https://doc.rust-lang.org/book/ch10-01-syntax.html#performance-of-code-using-generics)

Questo rende disponibili informazioni utili alle ottimizzazioni, ma non garantisce che ogni chiamata venga inlined, che ogni istanza resti un simbolo separato nel binario o che il programma sia piu veloce. Specializzazione, inlining e dimensione finale sono aspetti collegati ma diversi.

### Trait object e selezione indiretta

Con `fn run(task: &dyn Task)`, l'interfaccia non dipende dal tipo concreto del task. Il puntatore al trait object porta le informazioni necessarie a individuare i metodi tramite vtable. L'implementazione deve comunque essere valida e il trait deve essere dyn-compatible. [Rust Reference: trait objects](https://doc.rust-lang.org/reference/types/trait-object.html)

`&dyn Task` non obbliga ad allocare sullo heap. `Box<TaskConcreto>` non impone da solo dynamic dispatch. La scelta del proprietario o puntatore e distinta dalla scelta dell'interfaccia: i dettagli sono in [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]].

### Una firma generica non descrive tutto il percorso

Se un parametro `T: Trait + ?Sized` viene istanziato con `T = dyn Trait`, la funzione resta generica, ma la chiamata al metodo sul parametro usa l'interfaccia dinamica. Anche un wrapper concreto puo inoltrare a un `dyn Trait` interno.

Non basta quindi trovare `<T>` nella firma per concludere che l'intero algoritmo sia privo di indirezioni. Il compilatore puo ottimizzare il programma preservandone il comportamento; questi esempi non stabiliscono quante istruzioni di chiamata rimangano dopo l'ottimizzazione.

## API / Sintassi

### Stampa con lo stesso contratto di prestito

```rust
use std::fmt::Display;

fn stampa<T: Display>(value: &T) {
    println!("{value}");
}

fn stampa_dyn(value: &dyn Display) {
    println!("{value}");
}

fn main() {
    let number = 7u32;
    let text = String::from("note");
    stampa(&number);
    stampa_dyn(&number);
    stampa(&text);
    stampa_dyn(&text);
    assert_eq!(text, "note");
}
```

Entrambe le funzioni prendono un prestito condiviso e producono lo stesso testo per lo stesso input. Il confronto non introduce un move in una variante e un prestito nell'altra.

Questo esempio mostra due interfacce, non dimostra che tutte le operazioni interne alla formattazione siano statiche. La stampa include formattazione e I/O: cronometrare questo programma non isola il costo del dispatch.

### Parametro nominato, impl Trait in input e dyn Trait

```rust
trait Task {
    fn execute(&self) -> usize;
}

struct TextSize(String);

impl Task for TextSize {
    fn execute(&self) -> usize { self.0.len() }
}

fn run_generic<T: Task>(task: &T) -> usize {
    task.execute()
}

fn run_impl(task: &impl Task) -> usize {
    task.execute()
}

fn run_dyn(task: &dyn Task) -> usize {
    task.execute()
}

fn main() {
    let task = TextSize(String::from("test"));
    assert_eq!(run_generic::<TextSize>(&task), 4);
    assert_eq!(run_impl(&task), 4);
    assert_eq!(run_dyn(&task), 4);
    assert_eq!(task.0, "test");
}
```

`&impl Task` introduce un parametro di tipo anonimo: non e un'abbreviazione di `&dyn Task`. La forma nominata consente `run_generic::<TextSize>`; non puoi usare lo stesso turbofish per scegliere il parametro anonimo di `run_impl`.

Due parametri separati `&impl Task` possono avere tipi diversi. Due parametri `&T` con lo stesso `T` richiedono invece un tipo comune. Anche per questo cambiare la firma di un'API pubblica non e sempre una sostituzione trasparente. [Rust Reference: impl Trait nei parametri](https://doc.rust-lang.org/reference/types/impl-trait.html#anonymous-type-parameters)

### impl Trait in ritorno nasconde un tipo concreto

```rust
fn values(end: u8) -> impl Iterator<Item = u8> {
    0..end
}

fn single<T>(value: T) -> impl Iterator<Item = T> {
    std::iter::once(value)
}

fn main() {
    assert_eq!(values(4).collect::<Vec<_>>(), [0, 1, 2, 3]);
    assert!(values(0).next().is_none());

    assert_eq!(single(7u32).next(), Some(7));
    assert_eq!(single(String::from("owned")).next().unwrap(), "owned");
}
```

Qui il tipo concreto restituito lo sceglie l'implementazione della funzione, non il chiamante. `values` restituisce sempre un `Range<u8>`; `end` ne cambia i valori, non il tipo.

Il tipo nascosto puo dipendere dai parametri generici: `single::<u32>` e `single::<String>` usano rispettivamente `Once<u32>` e `Once<String>`. Per una stessa istanza della funzione, i possibili rami di ritorno devono comunque concordare su un tipo concreto. Non viene automaticamente creato un trait object. [Rust Reference: abstract return types](https://doc.rust-lang.org/reference/types/impl-trait.html#abstract-return-types)

Nascondere il tipo limita anche l'interfaccia esposta: `values` dichiara `Iterator`, non `DoubleEndedIterator`. Il chiamante non puo usare `values(4).rev()` soltanto perche il tipo nascosto `Range<u8>` supporta quel metodo; occorrerebbe esporre anche il relativo bound.

## Esempio pratico

### Handler equivalenti e scelta runtime tramite riferimento

```rust
trait Handler {
    fn handle(&self, input: &str) -> usize;
}

struct ByteCount;
struct ScalarCount;

impl Handler for ByteCount {
    fn handle(&self, input: &str) -> usize { input.len() }
}

impl Handler for ScalarCount {
    fn handle(&self, input: &str) -> usize { input.chars().count() }
}

fn static_run<H: Handler>(handler: &H, input: &str) -> usize {
    handler.handle(input)
}

fn dynamic_run(handler: &dyn Handler, input: &str) -> usize {
    handler.handle(input)
}

fn process_batch<H: Handler + ?Sized>(
    handler: &H,
    inputs: &[&str],
) -> Vec<usize> {
    inputs.iter().map(|input| handler.handle(input)).collect()
}

fn select<'a>(
    unicode: bool,
    bytes: &'a ByteCount,
    scalars: &'a ScalarCount,
) -> &'a dyn Handler {
    if unicode { scalars } else { bytes }
}

fn main() {
    let bytes = ByteCount;
    let scalars = ScalarCount;
    let input = "caff\u{e8}";

    assert_eq!(static_run(&bytes, input), 6);
    assert_eq!(dynamic_run(&bytes, input), 6);
    assert_eq!(static_run(&scalars, input), 5);
    assert_eq!(dynamic_run(&scalars, input), 5);

    let chosen = select(true, &bytes, &scalars);
    assert_eq!(dynamic_run(chosen, input), 5);
    assert_eq!(process_batch(&scalars, &[input, ""]), [5, 0]);
    assert_eq!(process_batch(chosen, &[input, ""]), [5, 0]);
}
```

Le due funzioni `static_run` e `dynamic_run` applicano **lo stesso handler allo stesso input**, senza differenze di ownership. Il parametro di `select` puo provenire da una configurazione runtime; nel main e fissato per rendere il risultato verificabile.

`process_batch` accetta sia `H = ScalarCount` sia `H = dyn Handler` grazie a `?Sized`. Il secondo caso non recupera magicamente il tipo concreto nascosto: la chiamata interna resta descritta tramite trait object. Il vettore di risultati e un costo comune della funzione, non un costo introdotto soltanto dalla variante dinamica.

Limiti del demo:

- `ByteCount` misura byte UTF-8; `ScalarCount` conta valori scalari Unicode, non grafemi o larghezza sul terminale.
- `handle` non e un endpoint HTTP, un parser o un sistema di plugin.
- Il confronto verifica risultati equivalenti, non tempi di esecuzione. Confrontare ByteCount contro ScalarCount come “statico contro dinamico” misurerebbe anche algoritmi diversi.

## Varianti

### Scelta runtime con un enum e un ritorno opaco

```rust
trait Handler {
    fn handle(&self, input: &str) -> usize;
}

enum HandlerKind {
    Bytes,
    Scalars,
}

impl Handler for HandlerKind {
    fn handle(&self, input: &str) -> usize {
        match self {
            Self::Bytes => input.len(),
            Self::Scalars => input.chars().count(),
        }
    }
}

fn make_handler(unicode: bool) -> impl Handler {
    if unicode { HandlerKind::Scalars } else { HandlerKind::Bytes }
}

fn main() {
    let text = "\u{e8}";
    assert_eq!(make_handler(false).handle(text), 2);
    assert_eq!(make_handler(true).handle(text), 1);

    let handlers = [HandlerKind::Bytes, HandlerKind::Scalars];
    assert_eq!(handlers[0].handle(text), 2);
    assert_eq!(handlers[1].handle(text), 1);
}
```

Il valore della variante puo cambiare a runtime, ma il tipo e sempre `HandlerKind`. La chiamata al suo `impl Handler` non richiede una vtable; e poi il `match` a distinguere il comportamento.

Un enum rappresenta un insieme chiuso: aggiungere un caso richiede aggiornare la definizione e i match pertinenti. Con `dyn Handler` puoi accettare ulteriori implementazioni compatibili senza aggiungere varianti all'enum. Entrambe sono scelte valide; il codice macchina finale dipende anche dalle ottimizzazioni.

### Un puntatore a funzione puo variare senza dyn

```rust
fn byte_len(text: &str) -> usize {
    text.len()
}

fn scalar_len(text: &str) -> usize {
    text.chars().count()
}

fn select_counter(unicode: bool) -> fn(&str) -> usize {
    if unicode { scalar_len } else { byte_len }
}

fn apply<F: Fn(&str) -> usize>(function: F, text: &str) -> usize {
    function(text)
}

fn main() {
    let text = "\u{e8}";
    let first: fn(&str) -> usize = select_counter(false);
    let second: fn(&str) -> usize = select_counter(true);
    assert_eq!(apply(first, text), 2);
    assert_eq!(apply(second, text), 1);
}
```

I due valori hanno lo stesso tipo `fn(&str) -> usize`, ma possono puntare a funzioni diverse. La funzione `apply` e generica; in queste chiamate `F` e un tipo puntatore a funzione. Questo non obbliga la destinazione puntata a essere nota staticamente.

E una chiamata indiretta che **non usa la vtable di un trait object**. Un function item passato direttamente e un function pointer non vanno confusi; inoltre una closure con catture non puo essere convertita semplicemente in `fn(...)`. [Rust Reference: function pointer types](https://doc.rust-lang.org/reference/types/function-pointer.html)

## Errori comuni

### Restituire due tipi diversi con impl Trait

Controesempio: deve fallire con **E0308**.

```rust
fn values(reverse: bool) -> impl Iterator<Item = u8> {
    if reverse {
        (1u8..=3).rev()
    } else {
        1u8..=3
    }
}

fn main() {
    let _ = values(true);
}
```

`Rev<RangeInclusive<u8>>` e `RangeInclusive<u8>` sono tipi diversi, anche se implementano entrambi `Iterator<Item = u8>`.

Puoi usare un tipo comune, come un wrapper enum, oppure scegliere intenzionalmente `Box<dyn Iterator<Item = u8>>` e convertire entrambi i rami. Quest'ultima soluzione e mostrata in [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]: non e una correzione gratuita o sempre necessaria.

### Dedurre le prestazioni dalla sintassi

- Una funzione generica puo aumentare specializzazioni e tempi di compilazione; non puoi dedurre un numero fisso di copie nel binario dalla sola firma.
- Una chiamata diretta puo favorire inlining e altre ottimizzazioni, ma non e una promessa. Persino gli attributi `inline` sono indicazioni per il compilatore, non un criterio per stabilire quale design sia migliore. [Rust Reference: inline](https://doc.rust-lang.org/reference/attributes/codegen.html#the-inline-attribute)
- `dyn` e allocazione sono decisioni distinte: confronta `&T` con `&dyn Trait` se vuoi tenere costante l'ownership.
- Un benchmark con `println!`, input costanti o risultati ignorati puo misurare I/O o lavoro eliminato dall'ottimizzatore, invece del dispatch.
- `black_box` aiuta a limitare alcune ottimizzazioni nei benchmark, ma e best-effort: non rende automaticamente corretto il disegno della misura. [Standard library: black_box](https://doc.rust-lang.org/std/hint/fn.black_box.html)
- Cambiare algoritmo, dati, numero di allocazioni o modalita di errore fra le due versioni rende il confronto ambiguo.

## Checklist

- [ ] Sto ragionando sulla chiamata specifica o generalizzando a tutto il programma?
- [ ] Il tipo concreto e noto, nascosto in dyn oppure contenuto in un wrapper?
- [ ] impl Trait si trova in input o in ritorno, e cosa puo scegliere il chiamante?
- [ ] Una scelta runtime potrebbe essere espressa con un enum o due rami espliciti?
- [ ] Le alternative hanno lo stesso contratto di ownership, input e risultato?
- [ ] Ho separato dispatch, allocazioni, I/O, code size e tempi di compilazione?
- [ ] Se misuro, uso la stessa toolchain, target e impostazioni di build per entrambe?
- [ ] Ho input rappresentativi e consumo i risultati, senza dichiarare una superiorita universale?

Per una misura reale, parti dal profilo del progetto e da [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]. Le impostazioni Cargo possono modificare le ottimizzazioni: confrontare debug con release non isola la scelta dell'interfaccia. [Cargo Book: profili](https://doc.rust-lang.org/cargo/reference/profiles.html)

## Collegamenti

- [[Programmazione/Rust/Pagine/Generics|Generics]]
- [[Programmazione/Rust/Pagine/Trait bounds|Trait bounds]]
- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]
- [[Programmazione/Rust/Pagine/Object safety|Object safety]]
- [[Programmazione/Rust/Pagine/Closure|Closure]]
- [[Programmazione/Rust/Pagine/Zero-cost abstractions|Zero-cost abstractions]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]
- [[Programmazione/Rust/Pagine/Benchmarking con Criterion|Benchmarking con Criterion]]

## Fonti

- [Rust Book: monomorfizzazione](https://doc.rust-lang.org/book/ch10-01-syntax.html#performance-of-code-using-generics).
- [Rust Reference: impl Trait](https://doc.rust-lang.org/reference/types/impl-trait.html).
- [Rust Reference: trait objects](https://doc.rust-lang.org/reference/types/trait-object.html).
- [Rust Reference: function pointer types](https://doc.rust-lang.org/reference/types/function-pointer.html).
- [Rust Reference: attributi inline](https://doc.rust-lang.org/reference/attributes/codegen.html#the-inline-attribute).
- [Standard library: black_box e limiti](https://doc.rust-lang.org/std/hint/fn.black_box.html).
- [Cargo Book: build profiles](https://doc.rust-lang.org/cargo/reference/profiles.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
