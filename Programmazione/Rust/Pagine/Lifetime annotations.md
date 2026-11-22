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
  - Annotazioni lifetime
  - Lifetime espliciti
prerequisites:
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
  - "[[Programmazione/Rust/Pagine/Borrow checker]]"
  - "[[Programmazione/Rust/Pagine/Lifetime impliciti]]"
related:
  - "[[Programmazione/Rust/Pagine/Lifetime elision]]"
  - "[[Programmazione/Rust/Pagine/Lifetimes nelle struct]]"
  - "[[Programmazione/Rust/Pagine/Higher-Ranked Trait Bounds (HRTB)]]"
title: Lifetime annotations
---

# Lifetime annotations

## Sintesi

Le **lifetime annotations** sono parametri e vincoli del sistema di tipi: descrivono per quanto tempo un riferimento deve poter essere usato in relazione ad altri prestiti. Non sono timer e non prolungano la vita dei valori.

La firma stabilisce il contratto; il compilatore controlla separatamente corpo e chiamate. Se l'elision non determina il lifetime di un risultato, non basta che il corpo restituisca sempre lo stesso input: occorre dichiarare la relazione.

Gli otto programmi della nota sono verificati con Rust **1.99.1**, edition **2024**. I due controesempi nella sezione Errori comuni sono intenzionalmente non compilabili.

## Quando usarlo

- Per restituire un riferimento scegliendo tra piu input.
- Per precisare quale input vincola l'output, lasciando indipendenti gli altri.
- Per descrivere una struct che contiene prestiti e i suoi metodi.
- Per leggere bound come `T: 'a` e `'a: 'b`.
- Quando l'elision non basta; non aggiungere parametri a ogni funzione che riceve un riferimento.

## Come funziona

### Una regione comune, non proprietari con la stessa durata

In `fn longest<'a>(first: &'a str, second: &'a str) -> &'a str`, `'a` e dichiarato tra i parametri generici e usato nelle tre posizioni di riferimento. Il corpo deve funzionare per le durate ammesse dalla firma.

Alla chiamata i due prestiti devono essere validi per una regione comune che copra l'uso del risultato. **Non serve che le due String siano create o distrutte insieme.** Per questi riferimenti condivisi, una durata piu lunga puo essere usata dove ne basta una piu breve.

Dire "il risultato dura quanto l'input piu corto" e una scorciatoia: non misura il tempo di esecuzione, non impone una durata massima ai proprietari e non obbliga a conservare il risultato fino a quel limite. Conta la compatibilita dei prestiti con gli usi effettivi.

### La firma non descrive il ramo scelto

Il risultato di `longest` potrebbe derivare da entrambi gli input. Il chiamante non ottiene un lifetime diverso in base al confronto eseguito. Anche se una specifica chiamata seleziona il proprietario piu duraturo, la firma continua a imporre il vincolo comune.

Se una funzione restituisce solo il primo input, legare anche il secondo allo stesso lifetime puo limitare inutilmente il chiamante. Due parametri distinti `'a` e `'b` non significano durate obbligatoriamente diverse: significano che non hai imposto quel legame.

## API / Sintassi

### Scegliere tra due riferimenti

```rust
fn longest<'a>(first: &'a str, second: &'a str) -> &'a str {
    if first.len() > second.len() {
        first
    } else {
        second
    }
}

fn main() {
    let mut persistent = String::from("persistente");
    {
        let temporary = String::from("breve");
        let result = longest(&persistent, &temporary);
        assert_eq!(result, "persistente");
    }
    persistent.push('!');
    assert_eq!(persistent, "persistente!");
    assert_eq!(longest("ab", "cd"), "cd");
}
```

`len()` confronta **byte UTF-8**, non caratteri o grafemi. In parita viene scelto il secondo input. Il risultato non copia il testo; il primo proprietario resta disponibile dopo il blocco. La modifica e ammessa quando il prestito non serve piu, non perche l'annotazione abbia "sbloccato" la String.

### Legare l'output solo al primo input

```rust
fn first_with_label<'a>(text: &'a str, _label: &str) -> &'a str {
    text
}

fn main() {
    let owner = String::from("persistente");
    let result;
    {
        let label = String::from("anteprima");
        result = first_with_label(&owner, &label);
    }
    assert_eq!(result, "persistente");
}
```

Il lifetime eliso di `_label` e indipendente da `'a`. La forma espansa sarebbe `fn first_with_label<'a, 'b>(text: &'a str, _label: &'b str) -> &'a str`. Non occorre scrivere `'b` se non serve nominarlo.

Con un solo parametro, `fn f<'a>(input: &'a str) -> &'a str` potrebbe normalmente essere scritto `fn f(input: &str) -> &str`. Il placeholder `'_` chiede l'inferenza secondo le regole applicabili: non e un nome con cui collegare arbitrariamente due input.

### Struct e metodo: prestito dei dati e prestito di self

```rust
struct View<'a> {
    text: &'a str,
}

impl<'a> View<'a> {
    fn text(&self) -> &'a str {
        self.text
    }
}

fn main() {
    let owner = String::from("contenuto");
    let result;
    {
        let view = View { text: &owner };
        result = view.text();
    }
    assert_eq!(result, "contenuto");
}
```

`impl<'a>` dichiara il parametro usato in `View<'a>`. Il lifetime del breve prestito `&self` e distinto da quello dei dati `'a`. Qui il metodo copia un riferimento condiviso gia contenuto nella struct: il risultato puo restare usabile dopo la distruzione di `view`, ma non dopo quella di `owner`.

Cambiare il ritorno in `-> &str` lo legherebbe per elision al prestito di `self`, rendendo non valido questo uso fuori dal blocco. Non applicare lo stesso ragionamento al trasferimento di un `&mut T`: non e `Copy`.

### Outlives tra lifetime e tra tipo e lifetime

```rust
use std::fmt::Debug;

fn shorten<'long, 'short>(text: &'long str) -> &'short str
where
    'long: 'short,
{
    text
}

fn debug_ref<'a, T>(value: &'a T)
where
    T: Debug + ?Sized + 'a,
{
    println!("{value:?}");
}

fn main() {
    let owner = String::from("dato");
    assert_eq!(shorten(&owner), "dato");
    debug_ref(owner.as_str());
}
```

- `'long: 'short` permette di usare il riferimento garantito per `'long` come riferimento richiesto per `'short`. Il verso del bound conta.
- `T: 'a` richiede che le componenti lifetime di `T` soddisfino quel limite; **non impone che ogni valore di T resti vivo per tutta 'a**.
- In `debug_ref`, `T: 'a` e gia implicato dalla presenza di `&'a T`: qui e scritto per mostrare la sintassi, non perche necessario. `Debug` invece non viene dedotto da quel riferimento.
- `?Sized` permette anche `T = str`; senza di esso resta il requisito implicito `Sized`.
- I parametri lifetime precedono i parametri di tipo: `<'a, T>`. I nomi `'static` e `'_` non possono essere dichiarati come normali parametri generici.

## Esempio pratico

### Testo configurato oppure valore di riserva

```rust
fn choose_non_empty<'a>(primary: &'a str, fallback: &'a str) -> &'a str {
    if primary.is_empty() {
        fallback
    } else {
        primary
    }
}

fn main() {
    let config = String::from("  ");
    let fallback = String::from("localhost");

    let host = choose_non_empty(config.trim(), &fallback);
    assert_eq!(host, "localhost");
    assert_eq!(choose_non_empty("server", "localhost"), "server");
    assert_eq!(choose_non_empty("", ""), "");
    assert_eq!(choose_non_empty(" ", "fallback"), " ");

    let saved;
    {
        let temporary = String::from("temporaneo");
        saved = choose_non_empty("", &temporary).to_owned();
    }
    assert_eq!(saved, "temporaneo");
}
```

La funzione distingue soltanto stringa vuota e non vuota; il chiamante decide se usare `trim()` per trattare anche spazi e whitespace Unicode. Senza il trim, `" "` e un valore non vuoto.

Il risultato e una vista su uno degli input: non viene creata una nuova String. Quando serve conservare il testo oltre la validita dei prestiti, `to_owned()` produce una String indipendente **mentre la vista e ancora valida**, copiandone il contenuto. Il costo della copia e una scelta esplicita dell'API o del chiamante.

## Varianti

### Riferimento static, bound static e risultato posseduto

```rust
fn label() -> &'static str {
    "pronto"
}

fn accepts_static<T: 'static>(value: T) -> T {
    value
}

fn build_message() -> String {
    let text = String::from("nuovo testo");
    text
}

fn main() {
    assert_eq!(label(), "pronto");
    let owned = accepts_static(build_message());
    assert_eq!(owned, "nuovo testo");
    drop(owned);
    assert_eq!(accepts_static(label()), "pronto");
}
```

Un literal fornisce byte disponibili per tutta l'esecuzione. Un parametro generico `'a` puo accettare anche riferimenti static quando basta una garanzia piu breve.

`T: 'static` non equivale a `&'static T`: `String` soddisfa il bound e il suo valore puo essere distrutto normalmente, come nel demo. Essere proprietari di un contenitore non basta in generale: un `Vec<&'short str>` puo ancora contenere prestiti non static.

Restituire una String locale tramite move, come `build_message`, e diverso da restituirne un riferimento: il chiamante riceve la proprieta dei dati. Struct con piu lifetime, trait e `for<'a>` sono approfonditi nelle note dedicate.

## Errori comuni

### Usare il risultato dopo la fine di uno dei prestiti

Questo programma **non compila** (E0597), anche se `primary` non e vuota e il ramo scelto restituirebbe il primo input:

```rust
fn choose_non_empty<'a>(primary: &'a str, fallback: &'a str) -> &'a str {
    if primary.is_empty() { fallback } else { primary }
}

fn main() {
    let primary = String::from("persistente");
    let result;
    {
        let fallback = String::from("breve");
        result = choose_non_empty(&primary, &fallback);
    }
    println!("{result}");
}
```

Usa il risultato quando entrambi i prestiti sono validi oppure creane una copia posseduta prima di uscire dal blocco. Se la funzione non deve mai restituire il fallback, semplifica la firma e il corpo: non inventare un lifetime indipendente per un output che puo davvero provenire da entrambi.

### Restituire un riferimento a una String locale

Questo programma **non compila** (E0515):

```rust
fn invalid<'a>() -> &'a str {
    let text = String::from("locale");
    &text
}

fn main() {}
```

La String verrebbe distrutta al ritorno. L'annotazione non la mantiene viva; nemmeno sostituire `'a` con `'static` risolve il problema. Restituisci una String posseduta oppure lavora su dati forniti dal chiamante.

Altri errori da evitare:

- Confondere durata del proprietario, scope del nome e validita del prestito.
- Interpretare una durata comune come obbligo di distruzione simultanea.
- Pensare che mantenere entrambi i dati allocati basti: anche gli accessi devono rispettare i prestiti, senza mutazioni incompatibili mentre il risultato e ancora usato.
- Rendere tutte le API `'static` per far sparire un errore.
- Aggiungere bound o annotazioni che l'elision o i requisiti dei tipi gia forniscono.
- Aspettarsi che cambiare soltanto un nome come `'a` in `'data` modifichi il comportamento.

## Checklist

- Quale valore possiede realmente i dati?
- Da quali input puo provenire l'output?
- La firma vincola soltanto i prestiti necessari?
- Il chiamante usa il risultato prima che uno di quei prestiti diventi invalido?
- La relazione riguarda i dati interni oppure il prestito temporaneo di `self`?
- L'errore richiede un contratto piu preciso o una diversa gestione dell'ownership?
- Ho distinto `&'static T`, `T: 'static` e un valore posseduto?
- Una copia esplicita sarebbe piu semplice per questo caso d'uso?

## Collegamenti

- [[Programmazione/Rust/Pagine/Lifetime impliciti|Lifetime impliciti]]
- [[Programmazione/Rust/Pagine/Lifetime elision|Lifetime elision]]
- [[Programmazione/Rust/Pagine/Lifetimes nelle struct|Lifetimes nelle struct]]
- [[Programmazione/Rust/Pagine/Lifetimes nei trait|Lifetimes nei trait]]
- [[Programmazione/Rust/Pagine/Lifetimes avanzati|Lifetimes avanzati]]
- [[Programmazione/Rust/Pagine/Higher-Ranked Trait Bounds (HRTB)|Higher-Ranked Trait Bounds]]
- [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Stringhe String e &str|Stringhe: String e &str]]

## Fonti

- [Rust Book: Validating References with Lifetimes](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html).
- [Rust Reference: Generic parameters](https://doc.rust-lang.org/reference/items/generics.html).
- [Rust Reference: Lifetime bounds e implied bounds](https://doc.rust-lang.org/reference/trait-bounds.html).
- [Rust Reference: Lifetime elision](https://doc.rust-lang.org/reference/lifetime-elision.html).
- [Rust Reference: Subtyping and variance](https://doc.rust-lang.org/reference/subtyping.html).
- [Rust By Example: Static](https://doc.rust-lang.org/rust-by-example/scope/lifetime/static_lifetime.html).
- [Standard library: str, len, is_empty e trim](https://doc.rust-lang.org/std/primitive.str.html).
- [Rust error codes: E0515](https://doc.rust-lang.org/error_codes/E0515.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
