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
  - Lifetimes avanzati Rust
  - Outlives e variance
prerequisites:
  - "[[Programmazione/Rust/Pagine/Lifetime annotations]]"
  - "[[Programmazione/Rust/Pagine/Lifetimes nelle struct]]"
  - "[[Programmazione/Rust/Pagine/Trait bounds]]"
related:
  - "[[Programmazione/Rust/Pagine/Higher-Ranked Trait Bounds (HRTB)]]"
  - "[[Programmazione/Rust/Pagine/PhantomData]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
title: Lifetimes avanzati
---

# Lifetimes avanzati

## Sintesi

I lifetime avanzati servono a progettare relazioni tra prestiti, tipi generici e contenitori: **outlives**, **reborrow**, **varianza** e bound dei trait object. Sono vincoli verificati dal compilatore, non un sistema che prolunga la vita dei dati.

In una API ordinaria conviene partire da ownership, riferimenti ed elision. Questi strumenti diventano utili quando devi capire perche una relazione valida per un riferimento non si trasferisce automaticamente al contenitore che lo contiene.

I dieci programmi sono verificati con Rust **1.99.1**, edition **2024**: otto validi e due controesempi espliciti in Errori comuni. Non viene eseguito codice unsafe.

## Quando usarlo

- Per progettare wrapper borrowed e API generiche senza vincoli superflui.
- Per leggere diagnosi che citano outlives, invarianza o riferimenti static.
- Per distinguere il prestito di un contenitore dai riferimenti contenuti.
- Per restituire trait object che prendono in prestito dati locali.
- Per rappresentare dipendenze di lifetime non espresse da un campo reference reale.

## Come funziona

### Outlives: durata dei dati e durata del prestito

`'long: 'short` significa che 'long copre almeno la regione richiesta da 'short. Non significa che i due proprietari siano creati o distrutti insieme.

`T: 'a` riguarda la validita dei lifetime rappresentati nel tipo T: per esempio, un `Vec<&'data str>` puo soddisfare quel bound se i suoi prestiti lo permettono. Il fatto che Vec possieda il proprio buffer non rende possedute anche le stringhe referenziate.

`&'a T` descrive invece un riferimento a T. Perche il tipo sia ben formato occorre `T: 'a`; nella firma di una funzione questo bound e implicito. Il bound non implica automaticamente un trait come Display o Clone.

### Accorciare una garanzia non allunga la memoria

Un riferimento valido per una regione piu ampia puo, nelle posizioni covarianti, essere usato con una garanzia piu breve. Non avvengono copie del contenuto o modifiche alla durata reale del proprietario.

La **varianza** dice se questa sostituzione attraversa un tipo generico. Non e una conversione numerica, un cast da base a sottoclasse o una proprieta determinata dal solo nome del contenitore.

## API / Sintassi

### Outlives esplicito e bound implicito

```rust
fn require_outlives<'a, T: ?Sized + 'a>(_value: &'a T) {}

fn inferred<'a, T: ?Sized>(value: &'a T) {
    require_outlives(value);
}

fn shorten<'long, 'short, T: ?Sized>(value: &'long T) -> &'short T
where
    'long: 'short,
{
    value
}

fn main() {
    let source = String::from("Rust");
    require_outlives(source.as_str());
    inferred(source.as_str());

    {
        let view = shorten(source.as_str());
        assert_eq!(view, "Rust");
    }
    assert_eq!(source, "Rust");
}
```

Il bound esplicito di require_outlives e didattico: in questo esempio si puo omettere senza cambiare il contratto, perche deriva da `&'a T`. `?Sized` serve a includere str; non modifica i lifetime.

In shorten il verso del bound conta: l'input deve essere valido almeno per la regione promessa dal risultato. La funzione non puo trasformare un riferimento locale in uno valido per una durata arbitrariamente maggiore.

### Riferimento static e bound static sul tipo

```rust
fn require_static<T: 'static>(_value: &T) {}

fn main() {
    let text: &'static str = "testo nel binario";
    require_static(&text);

    let owned = String::from("dato posseduto");
    require_static(&owned);
    assert_eq!(owned, "dato posseduto");
    drop(owned);
}
```

`&'static str` garantisce la validita dei dati per il resto dell'esecuzione. Il literal esiste nel programma compilato; non tutti i riferimenti static devono necessariamente essere stati creati all'avvio.

`T: 'static` non impone che un valore di tipo T resti vivo per sempre. String soddisfa il bound, ma owned viene distrutta normalmente. Il breve `&T` passato a require_static non deve essere un riferimento static.

Un `&str` su una String locale non soddisfa invece il bound static quando e esso stesso il T da controllare. La distinzione e tra `T = String` e `T = &str`, non tra variabile con o senza il prefisso mut.

### Reborrow: riutilizzare il riferimento esclusivo

```rust
fn push_one(v: &mut Vec<i32>) {
    let r: &mut Vec<i32> = v;
    r.push(1);
    assert!(!v.is_empty());
}

fn main() {
    let mut values = Vec::new();
    let original = &mut values;
    push_one(original);
    push_one(original);
    original.push(2);
    assert_eq!(values, [1, 1, 2]);
}
```

L'annotazione del tipo di r permette il reborrow implicito: viene creato un prestito temporaneo del valore gia raggiunto da v. La forma esplicita e `let r = &mut *v;`.

L'accesso a v torna possibile dopo l'ultimo uso di r nel demo. Non puoi usare contemporaneamente i due prestiti in modi incompatibili. `&mut T` non diventa Copy: sostituire quella riga con il semplice `let r = v;` trasferisce il riferimento e rende invalido l'uso successivo di v.

### Placeholder: lifetime inferito, non cancellato

```rust
fn fields(input: &str) -> std::str::Split<'_, char> {
    input.split(',')
}

fn main() {
    let input = String::from("a,,b,");
    let view: std::str::Split<'_, char> = fields(&input);
    let parts: Vec<&str> = view.collect();
    assert_eq!(parts, ["a", "", "b", ""]);

    let saved: Vec<String> = parts.iter().map(|part| (*part).to_owned()).collect();
    drop(input);
    assert_eq!(saved, ["a", "", "b", ""]);
}
```

`'_` chiede di inferire una durata secondo il contesto; non significa static o indipendente dalla sorgente. Anche dopo collect, `Vec<&str>` conserva prestiti sul buffer. La conversione in `Vec<String>` copia i testi prima che input venga distrutta.

Il demo separa sulla virgola letterale e conserva i campi vuoti. Non interpreta CSV, virgolette o escape. La raccolta del Vec puo allocare anche quando i suoi elementi sono soltanto riferimenti.

## Esempio pratico

### BorrowedDisplay: vista generica e risultato posseduto

```rust
use std::fmt::Display;

struct BorrowedDisplay<'a, T>
where
    T: Display + ?Sized,
{
    value: &'a T,
}

impl<'a, T> BorrowedDisplay<'a, T>
where
    T: Display + ?Sized,
{
    fn render(&self) -> String {
        format!("{}", self.value)
    }
}

fn main() {
    let rendered;
    {
        let source = String::from("Rust");
        let view = BorrowedDisplay { value: source.as_str() };
        rendered = view.render();
    }
    assert_eq!(rendered, "Rust");

    let number = 42;
    let erased: &dyn Display = &number;
    assert_eq!(BorrowedDisplay { value: erased }.render(), "42");
}
```

La struct prende in prestito T; non ne assume l'ownership. `?Sized` permette sia str sia dyn Display. Il campo reference fornisce il vincolo di validita necessario: non serve aggiungere static per usare un tipo generico.

render produce una String indipendente dalla sorgente. La formattazione ha un costo e non e una vista senza copia. Display non garantisce serializzazione reversibile, escaping HTML o validazione.

Il demo non converte gli errori in Result: format! puo andare in panic se un'implementazione scorretta di Display restituisce un errore mentre scrive nella String.

## Varianti

### Varianza: quale parametro cambia

| Tipo | Rispetto al lifetime esterno | Rispetto a T |
| --- | --- | --- |
| `&'a T` | Covariante in 'a | Covariante |
| `&'a mut T` | Covariante in 'a | Invariante |
| `Box<T>`, `Vec<T>` | Non applicabile | Covariante |
| `Cell<T>`, `RefCell<T>` | Non applicabile | Invariante |
| `PhantomData<T>` | Dipende dalla forma di T | Covariante |

Covariante conserva il verso della relazione; invariante non permette di ricavare la sostituzione dal solo outlives. Le funzioni hanno invece argomenti **contravarianti** e risultato covariante: `fn(T) -> U` inverte il verso per T e lo conserva per U.

```rust
fn shorter_vec<'long: 'short, 'short>(
    values: Vec<&'long str>,
) -> Vec<&'short str> {
    values
}

fn shorter_mut<'long: 'short, 'short>(
    value: &'long mut i32,
) -> &'short mut i32 {
    value
}

fn longer_input<'short, 'long: 'short>(
    handler: fn(&'short str),
) -> fn(&'long str) {
    handler
}

fn accept(text: &str) {
    assert!(!text.is_empty());
}

fn main() {
    let words = shorter_vec(vec!["uno", "due"]);
    assert_eq!(words, ["uno", "due"]);

    let mut value = 1;
    *shorter_mut(&mut value) += 1;
    assert_eq!(value, 2);

    let handler: fn(&'static str) = longer_input(accept);
    handler("valido");
}
```

shorter_vec trasferisce il Vec, non clona il buffer. shorter_mut accorcia il prestito esterno senza cambiare i32: questo e compatibile con l'invarianza di `&mut T` rispetto a T.

Un handler capace di accettare il prestito 'short puo essere usato dove gli si fornisce un riferimento valido per 'long. Il contrario non e garantito. Il tipo generico della funzione longer_input verifica questo verso; accept e soltanto un chiamante dimostrativo.

Per `&mut &'data str`, il lifetime 'data fa parte di **T**, non del prestito esterno. Consentire di sostituirlo arbitrariamente permetterebbe di scrivere nel contenitore un riferimento con durata insufficiente. I controesempi mostrano il rifiuto.

Le struct derivano la varianza dall'uso dei parametri nei campi. Inserire un parametro in posizioni incompatibili puo rendere il tipo invariante: non dedurre la varianza dal solo fatto che un wrapper esponga metodi in sola lettura.

### Box e lifetime del trait object

```rust
use std::fmt::Display;

fn boxed<'a>(value: &'a str) -> Box<dyn Display + 'a> {
    Box::new(value)
}

fn main() {
    let source = String::from("dato locale");
    let value = boxed(&source);
    assert_eq!(value.to_string(), "dato locale");
    drop(value);
    assert_eq!(source, "dato locale");
}
```

Box possiede qui un riferimento, non i byte della sorgente. Il bound `+ 'a` permette un tipo concreto con quel prestito. Non coincide necessariamente con la durata di un successivo `&Box<...>` o `&dyn Display`.

In questa firma togliere `+ 'a` richiederebbe il default static dell'oggetto Display e renderebbe invalido il ritorno. Nelle espressioni locali il bound puo invece essere inferito dal contesto. La nota sui lifetime nei trait approfondisce questa distinzione.

### PhantomData: dipendenza senza un campo reference

```rust
use std::marker::PhantomData;

struct Position<'src> {
    offset: usize,
    _source: PhantomData<&'src str>,
}

impl Position<'_> {
    fn offset(&self) -> usize {
        self.offset
    }
}

fn locate(source: &str, needle: char) -> Option<Position<'_>> {
    source.find(needle).map(|offset| Position {
        offset,
        _source: PhantomData,
    })
}

fn main() {
    let source = String::from("nome:Rust");
    let position = locate(&source, ':').expect("il separatore e presente");
    assert_eq!(position.offset(), 4);
    assert!(locate(&source, '?').is_none());
}
```

Il marker e un campo reale ma zero-sized: non contiene un riferimento runtime. La firma di locate collega il parametro di Position alla sorgente, e il marker rende questa dipendenza parte del tipo. Finche position deve essere usata, il prestito limita mutazioni incompatibili della sorgente.

L'offset e in **byte UTF-8**, non in caratteri. Estrarre il semplice usize elimina la relazione dal tipo del risultato: non usarlo come prova che un indice appartenga a una qualunque stringa. Questo demo non conserva l'identita del buffer e non fornisce un accesso unchecked.

PhantomData non mantiene vivo un proprietario, non dereferenzia puntatori e non rende sicuro automaticamente un wrapper unsafe. La forma del marker influenza varianza, auto trait e controlli sui distruttori: `PhantomData<T>` e `PhantomData<&'a T>` non vanno scelti come se fossero intercambiabili.

Per un normale dato preso in prestito, memorizzare direttamente il riferimento resta spesso la rappresentazione piu chiara. Il caso avanzato con raw pointer richiede anche invarianti che questa nota non implementa.

## Errori comuni

### Invarianza del contenuto dietro un riferimento mutabile

Questo programma **non compila** (E0597):

```rust
fn replace<T>(slot: &mut T, value: T) {
    *slot = value;
}

fn main() {
    let mut slot: &'static str = "iniziale";
    let local = String::from("temporaneo");
    replace(&mut slot, local.as_str());
    assert_eq!(slot, "temporaneo");
}
```

Il riferimento esterno a slot puo essere breve, ma T resta `&'static str`. La scrittura non puo sostituirlo con un riferimento locale. Un riferimento condiviso piu breve al testo iniziale sarebbe un'altra operazione: leggere non permette questa sostituzione del contenuto.

Le alternative dipendono dal bisogno: usare dati tutti static, conservare un riferimento con una durata compatibile con ogni assegnazione, oppure rendere il contenuto posseduto, per esempio una String.

### Interior mutability non conserva la covarianza

Questo programma **non compila**: il compilatore richiede una relazione di lifetime che il bound fornito non garantisce.

```rust
use std::cell::Cell;

fn shorter_cell<'long: 'short, 'short>(
    value: Cell<&'long str>,
) -> Cell<&'short str> {
    value
}

fn main() {}
```

Cell e invariante in T perche consente di sostituire il valore tramite riferimenti condivisi. Possedere il contenitore passato a questa funzione non rende covariante il suo tipo.

Per questo Cell consumato, si puo estrarre il riferimento con into_inner e costruire un **nuovo** Cell con la durata piu breve. E una conversione esplicita del contenuto, non una coercizione del vecchio Cell e non una soluzione generale per tutti i wrapper invarianti.

Altri errori da evitare:

- Aggiungere static per eliminare una diagnosi senza rivedere ownership e contratto.
- Confondere `T: 'a` con il prestito esterno `&'a T`.
- Considerare `'_` una cancellazione dei vincoli.
- Trattare tutti i parametri di un tipo come se avessero la stessa varianza.
- Usare un riferimento originale in modo incompatibile mentre il reborrow serve ancora.
- Ricorrere a transmute o raw pointer per estendere artificialmente un prestito.
- Dimenticare che un distruttore puo mantenere rilevante un prestito oltre l'ultimo uso esplicito.

## Checklist

- Il vincolo riguarda il proprietario, il prestito esterno o un riferimento contenuto?
- Il verso di outlives e corretto?
- Il bound e gia implicito nella firma?
- Static e un requisito reale del tipo oppure una restrizione superflua?
- Sto creando un reborrow o trasferendo un riferimento esclusivo?
- Il contenitore permette la sostituzione del tipo contenuto?
- La conversione in owned o la ricostruzione del contenitore sarebbe piu chiara?
- Un marker esprime davvero il contratto dei costruttori senza promettere garanzie runtime?

## Collegamenti

- [[Programmazione/Rust/Pagine/Lifetime annotations|Lifetime annotations]]
- [[Programmazione/Rust/Pagine/Lifetime elision|Lifetime elision]]
- [[Programmazione/Rust/Pagine/Lifetimes nelle struct|Lifetimes nelle struct]]
- [[Programmazione/Rust/Pagine/Lifetimes nei trait|Lifetimes nei trait]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Trait bounds|Trait bounds]]
- [[Programmazione/Rust/Pagine/Higher-Ranked Trait Bounds (HRTB)|Higher-Ranked Trait Bounds (HRTB)]]
- [[Programmazione/Rust/Pagine/PhantomData|PhantomData]]
- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]

## Fonti

- [Rust Reference: lifetime bounds e implied bounds](https://doc.rust-lang.org/reference/trait-bounds.html).
- [Rust Reference: subtyping e varianza](https://doc.rust-lang.org/reference/subtyping.html).
- [Rustonomicon: varianza, riferimenti mutabili e Cell](https://doc.rust-lang.org/nomicon/subtyping.html).
- [Rust Reference: borrow operators](https://doc.rust-lang.org/reference/expressions/operator-expr.html#borrow-operators).
- [Rust By Example: static su riferimenti e bound](https://doc.rust-lang.org/rust-by-example/scope/lifetime/static_lifetime.html).
- [Rust Reference: placeholder e object lifetime defaults](https://doc.rust-lang.org/reference/lifetime-elision.html).
- [Standard library: str e split](https://doc.rust-lang.org/std/primitive.str.html).
- [Standard library: Display](https://doc.rust-lang.org/std/fmt/trait.Display.html).
- [Standard library: format e panic](https://doc.rust-lang.org/std/macro.format.html).
- [Standard library: PhantomData](https://doc.rust-lang.org/std/marker/struct.PhantomData.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
