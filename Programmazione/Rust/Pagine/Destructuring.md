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
  - destructuring
  - pattern
aliases:
  - Destrutturazione Rust
  - Destructuring in Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Pattern Matching]]"
  - "[[Programmazione/Rust/Pagine/Structs]]"
related:
  - "[[Programmazione/Rust/Pagine/Enums]]"
  - "[[Programmazione/Rust/Pagine/Tuple structs]]"
  - "[[Programmazione/Rust/Pagine/Pattern matching avanzato]]"
title: Destructuring
---

# Destructuring

## Sintesi

Il destructuring estrae parti di tuple, array, slice, struct, tuple struct ed enum tramite pattern. Non e una clonazione: i binding possono copiare, spostare o prendere in prestito i campi.

Gli esempi sono programmi indipendenti per `src/main.rs`, verificati con **Rust 1.99.1, edition 2024**. Il controesempio finale non compila intenzionalmente.

## Quando usarlo

- Per dare nomi chiari ai campi usati da una funzione.
- Per separare dati annidati senza ripetere accessi posizionali.
- Per prendere in prestito piu campi disgiunti.
- Per dichiarare quali parti sono rilevanti e quali vengono ignorate.

Un pattern molto denso non e automaticamente migliore: estrai passaggi intermedi quando la forma del dato diventa difficile da leggere.

## Come funziona

Un normale `let`, un parametro e il binding di un `for` richiedono pattern irrefutabili. `Some(value)` su `Option<T>` o un pattern non vuoto su una slice possono fallire: usa un costrutto con un ramo alternativo.

La sintassi del pattern somiglia a quella di costruzione, ma non esegue un costruttore. `field: local_name` rinomina il binding; `field` abbrevia `field: field`; `_` ignora una posizione, `..` il resto.

### Tuple e array

```rust
fn main() {
    let point = (3, 4);
    let (x, y) = point;
    assert_eq!((x, y), (3, 4));
    assert_eq!(point, (3, 4));

    let [first, .., last] = [1, 2, 3, 4];
    assert_eq!((first, last), (1, 4));

    let mut coordinates = Vec::new();
    for (row, column) in [(0, 1), (2, 3)] {
        coordinates.push((row, column));
    }
    assert_eq!(coordinates, vec![(0, 1), (2, 3)]);
}
```

Qui gli interi sono `Copy` e la coppia resta utilizzabile. Per l'array la lunghezza e nota dal tipo; `[first, .., last]` richiede almeno due elementi, che una slice generica non garantisce.

## API / Sintassi

### Rinominare e spostare campi

```rust
struct User {
    id: u64,
    email: String,
    active: bool,
}

fn main() {
    let user = User {
        id: 7,
        email: String::from("a@example.test"),
        active: true,
    };
    let User { id: user_id, email, .. } = user;
    assert_eq!(user_id, 7);
    assert_eq!(email, "a@example.test");
    assert_eq!(user.id, 7);
    assert!(user.active);
}
```

`id` viene copiato, `email` spostato, `active` ignorato e resta leggibile. Dopo il move parziale non puoi usare `user` come valore completo. I campi non spostati non spariscono e `..` non significa distruggerli subito.

I campi nominati devono essere accessibili dal modulo corrente. Non puoi aggirare la privacy con un pattern. Se il tipo contenitore implementa `Drop`, spostarne campi non `Copy` ha restrizioni aggiuntive: prendi un prestito o usa un'API apposita.

### Prestiti condivisi ed esclusivi

```rust
struct User {
    id: u64,
    email: String,
}

fn main() {
    let mut user = User {
        id: 7,
        email: String::from("a@example.test"),
    };

    let User { id, email } = &user;
    let borrowed_id: &u64 = id;
    let borrowed_email: &String = email;
    assert_eq!(*borrowed_id, 7);
    assert_eq!(borrowed_email, "a@example.test");

    let User { id, email } = &mut user;
    *id = 8;
    email.push_str(".invalid");
    assert_eq!(user.id, 8);
    assert_eq!(user.email, "a@example.test.invalid");
}
```

I binding seguono il riferimento esaminato: prima `&T`, poi `&mut T`. I primi prestiti non sono piu usati quando iniziano quelli esclusivi. Non serve rendere `mut` il binding locale per modificare un campo tramite `&mut`.

In edition 2024 non aggiungere automaticamente `ref` o `ref mut` a un pattern che usa gia il binding implicito per riferimento. Per esempio `let User { ref email, .. } = &user` non e la forma corretta in questa edition; usa la forma mostrata sopra.

### Parametri e limiti numerici

```rust
fn manhattan((x, y): (i32, i32)) -> u64 {
    u64::from(x.unsigned_abs()) + u64::from(y.unsigned_abs())
}

fn main() {
    assert_eq!(manhattan((3, -4)), 7);
    assert_eq!(manhattan((0, 0)), 0);
    assert_eq!(manhattan((i32::MIN, i32::MIN)), 4_294_967_296);
}
```

E la distanza Manhattan dall'origine, non quella euclidea. `i32::MIN.abs()` non e rappresentabile come `i32`, e anche la somma di valori assoluti singolarmente validi puo superarne il massimo. Qui ogni valore assoluto e `u32`, poi viene convertito a `u64` **prima** della somma. Il risultato massimo per due coordinate `i32` e 2^32, rappresentabile in `u64`.

## Esempio pratico

### Separare una richiesta

```rust
struct Request {
    method: String,
    path: String,
    body: Option<String>,
}

fn summary(request: Request) -> String {
    let Request { method, path, body } = request;
    let body_info = match body {
        Some(content) => format!("presente, {} byte", content.len()),
        None => String::from("assente"),
    };
    format!("{method} {path}: body {body_info}")
}

fn main() {
    let request = Request {
        method: String::from("POST"),
        path: String::from("/items"),
        body: Some(String::from("{}")),
    };
    assert_eq!(summary(request), "POST /items: body presente, 2 byte");
}
```

La funzione consuma la richiesta e restituisce soltanto un riepilogo. Non e un parser o un server HTTP: non valida metodo, percorso, codifica del protocollo o autorizzazioni. `String::len` conta byte UTF-8; un body presente ma vuoto resta diverso da `None`. Il contenuto del body non viene riportato, ma metodo e percorso potrebbero comunque contenere dati sensibili se il riepilogo fosse registrato.

## Varianti

### Slice con una parte restante

```rust
fn split_first(values: &[i32]) -> Option<(&i32, &[i32])> {
    match values {
        [] => None,
        [first, rest @ ..] => Some((first, rest)),
    }
}

fn main() {
    let values = [10, 20, 30];
    let (first, rest) = split_first(&values).unwrap();
    assert_eq!(*first, 10);
    assert_eq!(rest, &[20, 30]);
    assert_eq!(split_first(&[]), None);
}
```

`rest @ ..` assegna un nome alla parte restante: qui e una slice in prestito, non un nuovo vettore. I riferimenti dipendono dalla durata dell'input. L'`unwrap` nel test e giustificato dall'array noto non vuoto; per input esterno gestisci l'`Option`. Nella pratica esiste gia `slice::split_first`: la funzione mostra solo la sintassi.

### Wildcard, binding e ref esplicito

```rust
fn main() {
    let pair = (String::from("sinistra"), String::from("destra"));
    let (_, right) = pair;
    assert_eq!(right, "destra");
    assert_eq!(pair.0, "sinistra");

    let value = String::from("testo");
    let ref borrowed = value;
    assert_eq!(borrowed, "testo");
    let _ = value;
    assert_eq!(value, "testo");

    let _owned = value;
    assert_eq!(_owned, "testo");
}
```

`_` non introduce un binding e qui non sposta la parte ignorata. `_owned` e invece un normale nome, che puo prendere ownership. `ref borrowed` crea un prestito nel pattern; non va confuso con `&pattern`, che riconosce un riferimento.

Questo non garantisce che `let _ = create_resource();` conservi una risorsa: un temporaneo senza proprietario nominato puo essere distrutto subito. Per guardie e risorse considera esplicitamente lo scope.

Tuple struct, enum annidati e binding `@` con vincoli seguono le stesse regole di ownership; gli esempi specifici sono nelle note collegate.

## Errori comuni

### Slice refutabile in let

Questo programma **non compila** (E0005):

```rust
fn main() {
    let values: &[i32] = &[];
    let [first, ..] = values;
    println!("{first}");
}
```

Una slice puo essere vuota. Usa `let [first, ..] = values else { return; };`, un `match` o `first()`.

Altri errori frequenti:

- Usare l'intera struct dopo aver spostato una `String`.
- Aggiungere `clone()` per risolvere un move quando basta prendere un prestito.
- Confondere la rinomina `email: address` con un confronto fra valori.
- Ignorare campi con `..` che sono importanti per la decisione.
- Usare piu `..` nello stesso pattern di tupla o slice, rendendo ambigua la suddivisione.
- Assumere che un `for` con pattern refutabile scarti automaticamente gli elementi non corrispondenti.

## Checklist

- Il pattern e irrefutabile nel contesto scelto?
- Ogni binding ha tipo e proprieta attesi?
- Campi ignorati e move parziali sono intenzionali?
- La privacy e rispettata senza esporre dettagli inutili?
- Gli esempi numerici gestiscono anche i valori estremi?
- Un metodo standard renderebbe l'operazione piu immediata?

## Collegamenti

- [[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]]
- [[Programmazione/Rust/Pagine/Structs|Structs]]
- [[Programmazione/Rust/Pagine/Enums|Enums]]
- [[Programmazione/Rust/Pagine/Tuple structs|Tuple structs]]
- [[Programmazione/Rust/Pagine/Pattern matching avanzato|Pattern matching avanzato]]
- [[Programmazione/Rust/Pagine/Move semantics|Move semantics]]
- [[Programmazione/Rust/Pagine/Slices|Slices]]

## Fonti

- [Rust Reference: patterns](https://doc.rust-lang.org/reference/patterns.html).
- [Rust Book: refutability](https://doc.rust-lang.org/book/ch19-02-refutability.html).
- [Rust Book: pattern syntax](https://doc.rust-lang.org/book/ch19-03-pattern-syntax.html).
- [Edition Guide: match ergonomics in Rust 2024](https://doc.rust-lang.org/edition-guide/rust-2024/match-ergonomics.html).
- [Standard library: i32::unsigned_abs](https://doc.rust-lang.org/std/primitive.i32.html#method.unsigned_abs).
- [Standard library: slice::split_first](https://doc.rust-lang.org/std/primitive.slice.html#method.split_first).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
