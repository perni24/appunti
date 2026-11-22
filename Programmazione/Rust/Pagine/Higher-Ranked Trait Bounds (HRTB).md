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
  - HRTB
  - Higher-Ranked Trait Bounds
  - for<'a>
prerequisites:
  - "[[Programmazione/Rust/Pagine/Lifetime annotations]]"
  - "[[Programmazione/Rust/Pagine/Trait bounds]]"
  - "[[Programmazione/Rust/Pagine/Lifetimes nei trait]]"
related:
  - "[[Programmazione/Rust/Pagine/Generic Associated Types (GAT)]]"
  - "[[Programmazione/Rust/Pagine/Lifetimes avanzati]]"
  - "[[Programmazione/Rust/Pagine/Closure]]"
title: Higher-Ranked Trait Bounds (HRTB)
---

# Higher-Ranked Trait Bounds (HRTB)

## Sintesi

Gli **Higher-Ranked Trait Bounds** esprimono un vincolo valido per ogni lifetime introdotto da `for<'a>`. Per esempio, `F: for<'a> Fn(&'a str)` richiede che lo stesso tipo `F` possa essere chiamato con string slice prese in prestito per durate diverse, anche molto brevi.

Non significa che la closure debba vivere per sempre o non possa catturare dati locali. Il lifetime dell'argomento, quello delle catture e quello del risultato sono contratti distinti.

Gli esempi sono programmi autonomi verificati con **Rust 1.99.1, edition 2024**. I tre esempi in `Errori comuni` sono intenzionalmente non compilabili; la versione indicata e una baseline di verifica, non una MSRV.

## Quando usarlo

- Una funzione crea dati temporanei e vuole passarne una vista a un callback.
- Un visitor deve implementare un trait per tutti i lifetime degli input.
- Il risultato di un callback deve conservare la relazione con il riferimento ricevuto.
- Un trait object deve accettare input di durata arbitraria, pur prendendo in prestito una configurazione locale.
- Una firma generica usa GAT e vincoli su una famiglia di tipi associati.

Non aggiungere HRTB automaticamente: se il callback deve conservare riferimenti a una collezione ricevuta dall'esterno, un lifetime nominato della collezione puo essere il contratto corretto.

## Come funziona

### Lifetime esterno e quantificazione universale

In un bound `F: Trait<'input>`, `'input` e un parametro della firma esterna: il vincolo riguarda quel lifetime. Con `F: for<'input> Trait<'input>`, invece, il vincolo deve funzionare per ogni scelta di `'input` dentro il bound.

La differenza conta quando e la funzione chiamata a creare il dato. Chi invoca la funzione non puo scegliere un lifetime esterno che renda utilizzabile, dopo il ritorno, una variabile locale creata e distrutta al suo interno.

| Contratto | Cosa vincola |
| --- | --- |
| Lifetime nominato | Un lifetime della firma esterna. |
| `for<'a>` | Tutti i lifetime nel bound quantificato. |
| `F: 'env` | I riferimenti contenuti nel tipo `F` devono durare almeno `'env`. |
| `F: 'static` | `F` non deve contenere prestiti non statici; il valore puo comunque essere distrutto prima. |
| `Fn` / `FnMut` / `FnOnce` | La modalita di chiamata del callback, non la durata dei suoi argomenti. |

Qui `for` quantifica lifetime, non tipi generici arbitrari. I nomi introdotti dal binder valgono nel suo ambito e non diventano lifetime utilizzabili liberamente nel resto della funzione.

### Callback esplicito ed eliso

`Fn(&str)`, in questo semplice bound, e la forma elisa di `for<'a> Fn(&'a str)`. L'esempio mostra entrambe le scritture sullo stesso comportamento.

```rust
fn apply<F>(f: F)
where
    F: for<'a> Fn(&'a str),
{
    let local = String::from("rust");
    f(local.as_str());
}

fn apply_elided<F>(f: F)
where
    F: Fn(&str),
{
    let local = String::from("rust");
    f(local.as_str());
}

fn check(input: &str) {
    assert_eq!(input, "rust");
}

fn main() {
    apply(check);

    let expected = String::from("rust");
    apply_elided(|input| assert_eq!(input, expected.as_str()));
}
```

Il callback accetta il prestito locale creato da `apply`; non deve trattenere quel riferimento oltre la sua validita. La seconda closure cattura `expected` per riferimento: un HRTB sull'input **non vieta catture locali**.

Queste funzioni chiamano il callback una sola volta: `Fn` serve qui per il confronto sintattico, ma `FnOnce` sarebbe sufficiente per la singola chiamata.

## API / Sintassi

### Due contratti per visitare una collezione

`FnMut` permette al callback di modificare il proprio stato catturato. La scelta tra un lifetime universale e uno nominato resta indipendente da questa possibilita.

```rust
fn visit<F>(items: &[String], mut f: F)
where
    F: for<'a> FnMut(&'a str),
{
    for item in items {
        f(item.as_str());
    }
}

fn visit_borrowed<'items, F>(items: &'items [String], mut f: F)
where
    F: FnMut(&'items str),
{
    for item in items {
        f(item.as_str());
    }
}

fn main() {
    let items = vec![String::from("rust"), String::from("cargo")];

    let mut owned = Vec::new();
    visit(&items, |text| owned.push(text.to_owned()));
    assert_eq!(owned, ["rust", "cargo"]);

    let mut borrowed = Vec::new();
    visit_borrowed(&items, |text| borrowed.push(text));
    assert_eq!(borrowed, ["rust", "cargo"]);
}
```

- `visit` richiede un callback valido anche per prestiti brevissimi. Il callback puo conservare una copia posseduta, come `String`, ma non accumulare quegli input in un contenitore esterno di `&str`.
- `visit_borrowed` promette al callback riferimenti legati a `'items`. Puo quindi raccogliere viste, purche non sopravvivano ai dati in `items`.
- Entrambe visitano gli elementi in ordine; una collezione vuota non produce chiamate.

Non usare `to_owned()` per nascondere una firma inadatta: scegli prima se l'API deve consentire di conservare prestiti, poi valuta il costo delle copie.

### Trait personalizzato valido per ogni input

```rust
trait Visit<'input> {
    fn visit(&self, input: &'input str) -> bool;
}

struct StartsWith<'config> {
    prefix: &'config str,
}

impl<'input> Visit<'input> for StartsWith<'_> {
    fn visit(&self, input: &'input str) -> bool {
        input.starts_with(self.prefix)
    }
}

fn run<V>(visitor: V) -> (bool, bool)
where
    V: for<'input> Visit<'input>,
{
    let local = String::from("rust");
    (visitor.visit(local.as_str()), visitor.visit("test"))
}

fn main() {
    let prefix = String::from("ru");
    let visitor = StartsWith { prefix: &prefix };

    assert_eq!(run(visitor), (true, false));
}
```

L'implementazione accetta ogni lifetime dell'input senza richiedere che la configurazione `prefix` sia statica. `run` usa sia una stringa locale sia un literal: non sta soltanto dimostrando il caso facile di un `&'static str`.

Il controllo del prefisso distingue maiuscole e minuscole e non normalizza il testo. HRTB garantisce il contratto di prestito, non la correttezza di una regola applicativa.

### Posizione del binder e trait di chiamata

Per un singolo bound, `F: for<'a> Trait<'a>` e `for<'a> F: Trait<'a>` esprimono lo stesso requisito. Nella prima forma il binder riguarda il trait che segue; nella seconda puo coprire l'intero predicato. Con piu bound, non spostarlo senza ricontrollare dove vale `'a`.

Per callback sincroni:

- `Fn` consente chiamate tramite `&self`; non promette assenza di effetti collaterali. Una cattura con interior mutability puo cambiare stato.
- `FnMut` consente chiamate ripetute tramite `&mut self` e modifiche alle catture.
- `FnOnce` consuma `self` nella chiamata; permette anche callback che spostano fuori una cattura. Con questo solo bound non puoi chiamare due volte lo stesso valore.
- Un callback `Fn` e utilizzabile dove basta `FnMut`; entrambi sono utilizzabili dove basta `FnOnce`.

`move` riguarda come vengono catturati i dati. Non implica da solo ne `FnOnce` come unica modalita supportata, ne `'static`, ne `Send` o `Sync`.

## Esempio pratico

### Dati temporanei e risultato indipendente

```rust
fn with_temp<F, R>(f: F) -> R
where
    F: for<'a> FnOnce(&'a str) -> R,
{
    let temp = String::from("temporaneo");
    f(temp.as_str())
}

fn main() {
    let len = with_temp(|text| text.len());
    assert_eq!(len, 10);

    let owned = with_temp(str::to_owned);
    assert_eq!(owned, "temporaneo");

    let external = String::from("esterno");
    let retained = with_temp(|_| external.as_str());
    assert_eq!(retained, "esterno");

    let prefix = String::from("report");
    let moved = with_temp(move |text| (prefix, text.len()));
    assert_eq!(moved, (String::from("report"), 10));
}
```

`R` e un unico tipo scelto per la chiamata, indipendente dal lifetime `'a` introdotto dentro il bound:

1. La lunghezza puo uscire dalla funzione; `str::len` conta byte.
2. Una `String` copiata puo uscire perche possiede il proprio contenuto.
3. Un riferimento a `external` puo uscire: la sua validita dipende da `external`, non da `temp`.
4. `FnOnce` accetta anche la closure che restituisce la cattura posseduta `prefix`, consumandola.

Quindi **risultato indipendente da `'a` non significa necessariamente risultato posseduto o statico**. Non puoi invece restituire una vista di `temp`: la stringa viene distrutta prima che il chiamante possa usarla.

### Risultato collegato al lifetime dell'input

Se il dato arriva dall'esterno, il callback puo restituirne una vista con la relazione esplicita `&'a str -> &'a str`.

```rust
fn transform<'source, F>(input: &'source str, f: F) -> &'source str
where
    F: for<'a> Fn(&'a str) -> &'a str,
{
    f(input)
}

fn main() {
    let source = String::from("  Rust  ");

    let trimmed = {
        let allow_trim = true;
        transform(&source, |text| {
            if allow_trim { text.trim() } else { text }
        })
    };
    assert_eq!(trimmed, "Rust");

    let identity: for<'a> fn(&'a str) -> &'a str = |text| text;
    assert_eq!(transform(&source, identity), source.as_str());
}
```

A differenza di `with_temp`, il tipo restituito **contiene** il lifetime quantificato. Per ogni chiamata, il risultato e utilizzabile secondo il prestito dell'input. Non puo dipendere da una cattura locale piu breve.

`trimmed` resta utilizzabile dopo la distruzione della closure e della sua configurazione `allow_trim`, ma non dopo quella di `source`. `trim` restituisce una sottostringa senza allocazione e riconosce gli spazi Unicode.

Il puntatore `fn` annotato fornisce il contesto di tipo alla closure senza catture. Una closure che cattura dati non e convertibile in un semplice puntatore `fn`: puo comunque essere accettata come parametro generico `F`, come nel primo uso di `transform`.

## Varianti

### Due lifetime indipendenti

```rust
fn left<'a, 'b>(first: &'a str, _second: &'b str) -> &'a str {
    first
}

fn select_left<F>(first: &str, f: F) -> &str
where
    F: for<'a, 'b> Fn(&'a str, &'b str) -> &'a str,
{
    let temporary = String::from("confronto");
    f(first, temporary.as_str())
}

fn main() {
    let source = String::from("persistente");
    let selected = select_left(&source, left);

    assert_eq!(selected, "persistente");
}
```

`'a` e `'b` sono indipendenti. Il callback deve poter restituire una vista del primo input anche quando il secondo vive molto meno. Una funzione che richiede lo stesso lifetime per entrambi gli input e restituisce una vista legata a quel lifetime non soddisfa questo contratto piu generale.

Se vuoi poter restituire **uno qualsiasi** dei due input, usa un contratto che ne esprima la durata comune; non promettere che il risultato dipenda solo dal primo.

### Trait object e configurazione catturata

```rust
fn make_checker<'env>(
    prefix: &'env str,
) -> Box<dyn for<'a> Fn(&'a str) -> bool + 'env> {
    Box::new(move |input| input.starts_with(prefix))
}

fn main() {
    let prefix = String::from("ru");
    let checker = make_checker(&prefix);

    {
        let input = String::from("rust");
        assert!(checker(&input));
    }

    assert!(!checker("test"));
}
```

Qui ci sono due livelli distinti:

- `for<'a>` riguarda gli argomenti delle chiamate: il checker accetta anche un input locale che viene poi distrutto.
- `+ 'env` riguarda il trait object e i riferimenti che contiene: il checker non puo essere usato oltre la configurazione presa in prestito.

`move` cattura il riferimento `prefix`, non trasforma la stringa originale in una stringa posseduta dalla closure. Omettere `+ 'env` da questo tipo restituito introduce il default `'static` del trait object dentro `Box`, incompatibile con il prestito locale.

`Box` aggiunge un'allocazione per conservare questa closure con catture e `dyn` usa dispatch dinamico. Per i costi e le alternative vedi la nota sui trait object.

### HRTB e Generic Associated Types

Un vincolo come `for<'a> S::Item<'a>: Debug` parla di una famiglia di tipi associati, non del solo tipo di un callback. Devi considerare anche i `where` che rendono utilizzabile `Item<'a>`.

Non sostituire meccanicamente questi vincoli con quelli degli esempi precedenti: alcune combinazioni di GAT e HRTB hanno limiti del compilatore documentati e verificati nella nota [[Programmazione/Rust/Pagine/Generic Associated Types (GAT)|Generic Associated Types (GAT)]]. Un HRTB su un callback non comporta, in generale, un requisito `'static` sulle catture.

## Errori comuni

### Callback limitato a riferimenti statici

Questo programma **non compila**: `static_only` non puo essere chiamata con il prestito locale di `local`.

```rust
fn apply<F>(f: F)
where
    F: for<'a> Fn(&'a str),
{
    let local = String::from("rust");
    f(local.as_str());
}

fn static_only(input: &'static str) {
    assert!(!input.is_empty());
}

fn main() {
    apply(static_only);
}
```

Il diagnostico indica che l'implementazione di `Fn` / `FnOnce` non e sufficientemente generale. Rendere la funzione o la closure stessa `'static` non rende statici tutti i suoi possibili argomenti.

### Restituire il prestito del buffer temporaneo

Questo programma **non compila**: il risultato dipenderebbe dal lifetime interno che `R` non puo conservare.

```rust
fn with_temp<F, R>(f: F) -> R
where
    F: for<'a> FnOnce(&'a str) -> R,
{
    let temp = String::from("temporaneo");
    f(temp.as_str())
}

fn main() {
    let leaked = with_temp(|text| text);
    assert_eq!(leaked, "temporaneo");
}
```

`move` non risolve il problema: cambia le catture, non la durata di `temp`. Restituisci dati posseduti oppure fai arrivare il buffer dal chiamante, con un lifetime esplicito nel risultato.

### Closure isolata senza il contesto richiesto

Questo programma **non compila nella baseline verificata**:

```rust
fn main() {
    let identity = |text: &str| -> &str { text };
    assert_eq!(identity("rust"), "rust");
}
```

Non basta annotare separatamente input e output con `&str` per ottenere automaticamente la relazione universale desiderata. Il compilatore segnala che un lifetime potrebbe non durare abbastanza.

Nell'esempio `transform`, il bound della funzione fornisce il contesto alla closure passata direttamente. Per una closure senza catture puoi anche usare il tipo esplicito `for<'a> fn(&'a str) -> &'a str`; in alternativa scrivi una funzione nominata con quella relazione.

Altri errori da evitare:

- Interpretare `Fn` come garanzia di purezza o `for<'a>` come garanzia di thread safety.
- Richiedere un HRTB a un visitor che deve trattenere viste legate alla collezione originale.
- Aggiungere `'static` o copie indiscriminate per far sparire un errore senza chiarire il proprietario dei dati.
- Confondere il lifetime della closure con quello del riferimento che restituisce.

## Checklist

- Chi possiede l'input: il chiamante o la funzione che invoca il callback?
- Serve davvero un contratto valido per ogni lifetime?
- Il callback deve conservare viste degli input oppure soltanto osservarli?
- Il risultato e indipendente dal prestito (`R`) oppure ne conserva il lifetime?
- Le catture hanno un lifetime distinto da quello degli argomenti?
- Basta `FnOnce` o servono chiamate ripetute con `FnMut` / `Fn`?
- Ho provato anche un input locale, non soltanto string literal statici?
- Ho verificato con il compilatore sia il caso valido sia quello da rifiutare?

## Collegamenti

- [[Programmazione/Rust/Pagine/Lifetime annotations|Lifetime annotations]]
- [[Programmazione/Rust/Pagine/Lifetime elision|Lifetime elision]]
- [[Programmazione/Rust/Pagine/Lifetimes nei trait|Lifetimes nei trait]]
- [[Programmazione/Rust/Pagine/Lifetimes avanzati|Lifetimes avanzati]]
- [[Programmazione/Rust/Pagine/Trait bounds|Trait bounds]]
- [[Programmazione/Rust/Pagine/Generic Associated Types (GAT)|Generic Associated Types (GAT)]]
- [[Programmazione/Rust/Pagine/Closure|Closure]]
- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]

## Fonti

- [Rust Reference: higher-ranked trait bounds](https://doc.rust-lang.org/reference/trait-bounds.html#higher-ranked-trait-bounds).
- [Rustonomicon: Higher-Rank Trait Bounds](https://doc.rust-lang.org/nomicon/hrtb.html).
- [Rust Reference: lifetime elision](https://doc.rust-lang.org/reference/lifetime-elision.html).
- [Rust Reference: closure types, call traits e coercions](https://doc.rust-lang.org/reference/types/closure.html#call-traits-and-coercions).
- [Rust Reference: function pointer types](https://doc.rust-lang.org/reference/types/function-pointer.html).
- [Rust Reference: trait object lifetime bounds](https://doc.rust-lang.org/reference/types/trait-object.html#trait-object-lifetime-bounds).
- [Standard library: FnOnce](https://doc.rust-lang.org/std/ops/trait.FnOnce.html) e [FnMut](https://doc.rust-lang.org/std/ops/trait.FnMut.html).
- [Standard library: str](https://doc.rust-lang.org/std/primitive.str.html).
- [Rust issue 86921: contesto di inferenza per closure che restituiscono riferimenti](https://github.com/rust-lang/rust/issues/86921).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
