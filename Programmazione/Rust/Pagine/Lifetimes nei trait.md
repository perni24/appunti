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
  - Trait con lifetime
  - Lifetimes nei trait Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Lifetime annotations]]"
  - "[[Programmazione/Rust/Pagine/Associated types]]"
related:
  - "[[Programmazione/Rust/Pagine/Generic Associated Types (GAT)]]"
  - "[[Programmazione/Rust/Pagine/Higher-Ranked Trait Bounds (HRTB)]]"
  - "[[Programmazione/Rust/Pagine/Lifetimes nelle struct]]"
title: Lifetimes nei trait
---

# Lifetimes nei trait

## Sintesi

I lifetime nei trait descrivono **da quali dati dipende un risultato** e per quali prestiti deve funzionare un'implementazione. Non prolungano la vita di un proprietario e non trasferiscono ownership.

La posizione del parametro cambia il contratto: sul metodo riguarda la chiamata; sul trait entra negli argomenti dell'implementazione; su un associated type permette una famiglia di risultati. Il bound di un trait object e un altro vincolo ancora.

Gli otto programmi sono verificati con Rust **1.99.1**, edition **2024**. I due controesempi in Errori comuni sono volutamente non compilabili.

## Quando usarlo

- Quando un metodo restituisce una vista su self oppure su un input.
- Quando un'implementazione contiene dati presi in prestito.
- Quando il tipo del risultato deve dipendere dalla durata della sorgente o della chiamata.
- Quando un componente generico deve accettare prestiti temporanei creati al proprio interno.
- Quando restituisci un trait object che contiene riferimenti non static.

## Come funziona

### Scegliere la relazione, non aggiungere annotazioni a tentativi

| Forma | Relazione espressa |
| --- | --- |
| `fn name(&self) -> &str` | Il risultato e legato al prestito di self tramite elision. |
| `fn field<'row>(&self, row: &'row str) -> Option<&'row str>` | Il risultato e legato a row, indipendentemente dal prestito di self. |
| `trait Parser<'input>` | La durata fa parte del trait implementato; un associated type ordinario puo usarla. |
| `type Item<'call> where Self: 'call` | Il GAT descrive una famiglia di tipi indicizzata dalla durata del prestito. |
| `for<'input> P: Parser<'input>` | P deve soddisfare il trait per ogni scelta della durata. |
| `dyn Named + 'data` | Il tipo concreto nascosto deve rispettare il bound di validita 'data. |

Avere riferimenti nei campi **non obbliga a parametrizzare anche il trait**: `Borrowed<'data>` puo implementare semplicemente `Named`. Inoltre `Parser<'input>` non implica da solo `Self: 'input`: se serve quel requisito, deve risultare dal contratto.

Un lifetime sul trait non e automaticamente meno flessibile: `impl<'input> Parser<'input> for Trim` copre ogni durata. Il punto e distinguere un bound richiesto per una durata specifica da uno universale.

### Il contratto viene prima del corpo

L'implementazione deve rispettare le relazioni dichiarate dal trait. Non puo accettare soltanto input static se il metodo promette di funzionare con prestiti locali.

Il corpo puo restituire un dato valido piu a lungo, ma il chiamante generico dispone delle garanzie della firma. Non puo ricavare un riferimento static da `fn name(&self) -> &str` soltanto perche una particolare implementazione usa un literal.

## API / Sintassi

### View e Named: lifetime del metodo e elision

```rust
trait View {
    fn view<'call>(&'call self) -> &'call str;
}

trait Named {
    fn name(&self) -> &str;
}

struct Borrowed<'data> {
    text: &'data str,
}

impl View for Borrowed<'_> {
    fn view<'call>(&'call self) -> &'call str {
        self.text
    }
}

impl Named for Borrowed<'_> {
    fn name(&self) -> &str {
        self.text
    }
}

fn main() {
    let text = String::from("Rust");
    let item = Borrowed { text: &text };
    assert_eq!(item.view(), "Rust");
    assert_eq!(item.name(), "Rust");

    let erased: &dyn View = &item;
    assert_eq!(erased.view(), "Rust");
}
```

Le due firme legano il risultato al receiver; quella di View scrive la relazione esplicitamente. La durata interna `'data` non diventa automaticamente la durata pubblica del risultato.

I soli parametri lifetime di un metodo non impediscono il dispatch tramite `dyn`. Restano da rispettare le altre regole di dyn compatibility: questo non vale automaticamente per metodi generici su tipi o per trait con GAT.

### Parser: lifetime sul trait e associated type ordinario

```rust
trait Parser<'input> {
    type Output;

    fn parse(&self, input: &'input str) -> Self::Output;
}

struct Trim;

impl<'input> Parser<'input> for Trim {
    type Output = &'input str;

    fn parse(&self, input: &'input str) -> Self::Output {
        input.trim()
    }
}

fn parse_with<'input, P>(parser: &P, input: &'input str) -> P::Output
where
    P: Parser<'input> + ?Sized,
{
    parser.parse(input)
}

fn main() {
    let input = String::from("  Rust \n");
    let result;
    {
        let parser = Trim;
        result = parse_with(&parser, &input);
    }
    assert_eq!(result, "Rust");
    assert_eq!(parse_with(&Trim, ""), "");
}
```

Output e un tipo associato ordinario: puo usare `'input` perche questo parametro e gia presente nell'impl. Non e necessario introdurre un GAT in questa forma di API.

Il risultato di Trim e una slice dell'input, non un prestito del parser. `trim` rimuove whitespace Unicode alle estremita, senza validare o analizzare una grammatica. La stringa vuota e un risultato valido; non sono previste diagnosi di parsing.

`parse_with` richiede il trait per il lifetime dell'input ricevuto. `?Sized` consente anche un trait object con Output specificato, non cambia le regole dei prestiti.

## Esempio pratico

### FieldReader: risultato legato alla riga, non al lettore

```rust
trait FieldReader {
    fn field<'row>(&self, row: &'row str) -> Option<&'row str>;
}

struct FirstField;

impl FieldReader for FirstField {
    fn field<'row>(&self, row: &'row str) -> Option<&'row str> {
        row.split(',').next()
    }
}

struct Column {
    index: usize,
}

impl FieldReader for Column {
    fn field<'row>(&self, row: &'row str) -> Option<&'row str> {
        row.split(',').nth(self.index)
    }
}

fn main() {
    let row = String::from("Ada,Rust,2026");
    let saved;
    {
        let reader = Column { index: 1 };
        let erased: &dyn FieldReader = &reader;
        saved = erased.field(&row).expect("la seconda colonna esiste");
    }
    assert_eq!(saved, "Rust");
    assert_eq!(FirstField.field(""), Some(""));
    assert_eq!(FirstField.field(",Rust"), Some(""));
    assert_eq!(Column { index: 9 }.field(&row), None);
}
```

Il lettore puo uscire dallo scope prima di usare saved: la firma collega l'output solo alla riga. La riga invece deve restare valida; spostare o modificare il suo buffer mentre saved serve ancora non e consentito.

Qui si dividono stringhe sulla virgola letterale. **Non e un parser CSV**: non interpreta virgolette, escape o record multilinea, e non rimuove spazi. Per esempio, in `"a,b",c` la prima virgola resta un separatore, anche se e tra virgolette.

Con questo separatore FirstField restituisce sempre Some, anche per input vuoto. Option resta nell'interfaccia per lettori come Column, che possono non trovare una colonna. Campo vuoto e colonna assente sono casi distinti.

## Varianti

### Source: GAT legato al prestito della chiamata

```rust
trait Source {
    type Item<'call>
    where
        Self: 'call;

    fn next<'call>(&'call mut self) -> Option<Self::Item<'call>>;
}

struct Rows {
    items: Vec<String>,
    index: usize,
}

impl Source for Rows {
    type Item<'call> = &'call str where Self: 'call;

    fn next<'call>(&'call mut self) -> Option<Self::Item<'call>> {
        if self.index >= self.items.len() {
            return None;
        }
        let index = self.index;
        self.index += 1;
        Some(self.items[index].as_str())
    }
}

fn main() {
    let mut source = Rows {
        items: vec![String::from("Ada"), String::from("Rust")],
        index: 0,
    };
    assert_eq!(source.next(), Some("Ada"));
    assert_eq!(source.next(), Some("Rust"));
    assert_eq!(source.next(), None);
    assert_eq!(source.next(), None);
}
```

Rows possiede le stringhe; next ne presta una senza copiarla. Non puoi conservare il primo risultato, chiamare nuovamente next e poi usare entrambi: il primo prestito mutabile deve essere terminato. Gli assert del demo consumano subito la vista.

`Self: 'call` e il bound richiesto in questo trait per la famiglia Item; non rende Rows static e non prolunga nessun riferimento. Il tipo concreto Rows non ha bisogno di un parametro lifetime, perche possiede i dati.

Questo Source non implementa `Iterator` e non e dyn-compatible sulla baseline. Per un'API che restituisce sempre e soltanto `&str` basterebbe un metodo `fn next(&mut self) -> Option<&str>`: il GAT serve quando vuoi astrarre anche la famiglia dei tipi restituiti. Per adattatori e ulteriori vincoli, vedi la nota dedicata ai GAT.

### HRTB: usare il trait con una sorgente creata internamente

```rust
trait Parser<'input> {
    type Output;

    fn parse(&self, input: &'input str) -> Self::Output;
}

struct Trim;

impl<'input> Parser<'input> for Trim {
    type Output = &'input str;

    fn parse(&self, input: &'input str) -> Self::Output {
        input.trim()
    }
}

fn parse_owned<P>(parser: &P, input: String) -> String
where
    P: for<'input> Parser<'input, Output = &'input str>,
{
    let view = parser.parse(&input);
    view.to_owned()
}

fn main() {
    let saved = parse_owned(&Trim, String::from("  Rust  "));
    assert_eq!(saved, "Rust");
    assert_eq!(parse_owned(&Trim, String::new()), "");
}
```

Il bound universale consente di usare il prestito locale di input. Una sola implementazione `Parser<'static>` non soddisfa il requisito; `for<'input>` non equivale a scegliere una durata molto lunga.

Il risultato viene copiato in una String prima che input venga distrutta. Un HRTB non permetterebbe di restituire la slice sul buffer locale. E un esempio di ownership al confine dell'API, non un modo per evitare copie.

Lo stesso genere di requisito si usa con funzioni e closure, per esempio `for<'a> Fn(&'a str) -> &'a str`. Questo vincolo riguarda la relazione input/output, non impone da solo che la closure non catturi riferimenti locali.

### Trait object: prestito del contenitore e bound dell'oggetto

```rust
trait Named {
    fn name(&self) -> &str;
}

struct BorrowedName<'data>(&'data str);

impl Named for BorrowedName<'_> {
    fn name(&self) -> &str {
        self.0
    }
}

fn boxed_name<'data>(text: &'data str) -> Box<dyn Named + 'data> {
    Box::new(BorrowedName(text))
}

fn name_of<'borrow, 'object>(
    value: &'borrow (dyn Named + 'object),
) -> &'borrow str {
    value.name()
}

fn main() {
    let text = String::from("nome locale");
    let value = boxed_name(&text);
    assert_eq!(name_of(value.as_ref()), "nome locale");
    drop(value);
    assert_eq!(text, "nome locale");
}
```

Box possiede BorrowedName, **non** la stringa a cui BorrowedName si riferisce. Il bound `+ 'data` permette quel prestito nel tipo nascosto, senza mantenerne vivo il proprietario.

In name_of, `'borrow` descrive il prestito dell'oggetto e il risultato di name; `'object` vincola il tipo concreto nascosto. Non e automaticamente il lifetime del riferimento restituito da ogni metodo.

Per Named, privo di propri lifetime bound, `Box<dyn Named>` in una firma usa il default `'static` e non accetta questo BorrowedName locale. Nelle espressioni il bound puo essere inferito dal contesto: non generalizzare il default di una firma a ogni variabile locale. Un valore posseduto con bound static puo comunque essere distrutto normalmente.

## Errori comuni

### Elidere il risultato quando deriva dall'altro input

Questo programma **non compila**: l'elision collega il risultato a self, mentre il corpo restituisce una slice di row.

```rust
trait FieldReader {
    fn field(&self, row: &str) -> Option<&str>;
}

struct FirstField;

impl FieldReader for FirstField {
    fn field(&self, row: &str) -> Option<&str> {
        row.split(',').next()
    }
}

fn main() {}
```

La correzione e la firma esplicita mostrata nell'esempio pratico, sia nel trait sia nell'impl. Legare self e row allo stesso lifetime potrebbe compilare, ma aggiungerebbe una dipendenza non necessaria dal lettore.

### Restringere l'implementazione a input static

Questo programma **non compila**: l'impl non rispetta la firma universale del metodo del trait.

```rust
trait FieldReader {
    fn field<'row>(&self, row: &'row str) -> Option<&'row str>;
}

struct StaticOnly;

impl FieldReader for StaticOnly {
    fn field(&self, row: &'static str) -> Option<&'static str> {
        row.split(',').next()
    }
}

fn main() {}
```

Non correggere il problema imponendo static a tutti gli input se l'API deve leggere dati locali. L'implementazione deve accettare i prestiti promessi dal trait.

Altri errori da evitare:

- Mettere un lifetime sul trait solo perche l'implementatore contiene riferimenti.
- Confondere `T: 'a`, `Trait<'a>` e `for<'a> Trait<'a>`.
- Interpretare un associated type come indipendente dai parametri dell'impl.
- Collegare `&'a mut self` a una durata esterna quando serve solo un prestito breve.
- Confondere un metodo generico sui lifetime con uno generico su tipi.
- Scegliere un GAT senza avere bisogno di astrarre il tipo del risultato.

## Checklist

- Il risultato deriva da self, da un parametro o da dati posseduti nuovi?
- La durata serve al metodo, all'implementazione del trait o alla famiglia di output?
- Una struct borrowed puo implementare un trait senza lifetime?
- L'impl accetta tutti gli input promessi dalla dichiarazione?
- Serve una singola istanza del bound o un requisito universale?
- Ho distinto tipo associato ordinario e GAT?
- Il trait deve funzionare tramite dyn?
- Sono espliciti i costi delle copie e i limiti del parser dimostrativo?

## Collegamenti

- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Lifetime annotations|Lifetime annotations]]
- [[Programmazione/Rust/Pagine/Lifetime elision|Lifetime elision]]
- [[Programmazione/Rust/Pagine/Lifetimes nelle struct|Lifetimes nelle struct]]
- [[Programmazione/Rust/Pagine/Associated types|Associated types]]
- [[Programmazione/Rust/Pagine/Generic Associated Types (GAT)|Generic Associated Types (GAT)]]
- [[Programmazione/Rust/Pagine/Higher-Ranked Trait Bounds (HRTB)|Higher-Ranked Trait Bounds (HRTB)]]
- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]
- [[Programmazione/Rust/Pagine/Object safety|Object safety e dyn compatibility]]

## Fonti

- [Rust Reference: trait e dyn compatibility](https://doc.rust-lang.org/reference/items/traits.html).
- [Rust Reference: lifetime e higher-ranked bounds](https://doc.rust-lang.org/reference/trait-bounds.html).
- [Rust Reference: associated items e bound dei GAT](https://doc.rust-lang.org/reference/items/associated-items.html).
- [Rust Reference: elision e default dei trait object](https://doc.rust-lang.org/reference/lifetime-elision.html).
- [Rust Reference: trait object types](https://doc.rust-lang.org/reference/types/trait-object.html).
- [Rustonomicon: Higher-Rank Trait Bounds](https://doc.rust-lang.org/nomicon/hrtb.html).
- [Standard library: split e trim su str](https://doc.rust-lang.org/std/primitive.str.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
