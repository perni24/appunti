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
  - pattern
aliases: []
prerequisites: []
related: []
title: Pattern base
---

# Pattern base

## Sintesi

I pattern in Rust descrivono la forma di un valore e permettono di estrarre parti interne. Compaiono in `let`, parametri di funzione, `match`, `if let`, `while let` e cicli `for`.

Non sono espressioni arbitrarie: `Some(value)` in un pattern riconosce una variante ed estrae un binding; non chiama una funzione. Gli esempi sono programmi indipendenti per `src/main.rs`, verificati con **Rust 1.99.1, edition 2024**.

## Quando usarlo

- Quando devi destrutturare tuple, array, struct o enum.
- Quando vuoi gestire casi diversi con `match`.
- Quando vuoi ignorare parti di un valore.

## Come funziona

Un pattern viene confrontato con un valore. Se la forma coincide, Rust lega nomi alle parti estratte. Alcuni pattern sono irrefutabili, cioe funzionano sempre; altri sono refutabili, cioe possono fallire.

La distinzione dipende dal tipo: `(x, y)` e irrefutabile per una coppia, mentre `Some(x)` e refutabile per `Option<T>`, che puo contenere `None`. Un normale `let`, un parametro di funzione o il pattern di un `for` richiedono un pattern irrefutabile. Per gestire un possibile mancato match usa `match`, `if let`, `while let` oppure `let ... else`.

Il matching non copia sempre i dati: un binding puo copiare un tipo `Copy`, spostare un valore posseduto o prendere un riferimento, secondo il pattern e il valore esaminato. Questo aspetto e distinto dalla scelta del ramo.

## API / Sintassi

### Tuple, array e parametri

```rust
fn sum_pair((left, right): (i32, i32)) -> i32 {
    left + right
}

fn main() {
    let (x, y) = (10, 20);
    let [first, .., last] = [1, 2, 3, 4];
    assert_eq!(sum_pair((x, y)), 30);
    assert_eq!((first, last), (1, 4));
}
```

`..` ignora il resto della struttura; qui la lunghezza dell'array e nota. Lo stesso pattern applicato a una slice di lunghezza variabile potrebbe non riuscire. La somma dimostrativa usa piccoli interi: per input arbitrari resta da decidere la politica di overflow.

### Letterali, alternative e range

```rust
fn category(value: i32) -> &'static str {
    match value {
        0 => "zero",
        1 | 2 => "piccolo",
        3..=5 => "medio",
        _ => "altro",
    }
}

fn main() {
    assert_eq!(category(0), "zero");
    assert_eq!(category(2), "piccolo");
    assert_eq!(category(5), "medio");
    assert_eq!(category(-1), "altro");
}
```

`|` separa alternative, non e un OR fra condizioni booleane; i binding nelle alternative devono essere coerenti. Il range `3..=5` include entrambi gli estremi. Per una condizione calcolata sul valore estratto si usa una guardia, non una chiamata arbitraria al posto del pattern.

## Esempio pratico

### Descrivere un punto

```rust
fn describe(point: (i32, i32)) -> &'static str {
    match point {
        (0, 0) => "origine",
        (0, _) => "asse y",
        (_, 0) => "asse x",
        _ => "punto generico",
    }
}

fn main() {
    assert_eq!(describe((0, 0)), "origine");
    assert_eq!(describe((0, 4)), "asse y");
    assert_eq!(describe((-3, 0)), "asse x");
    assert_eq!(describe((2, 4)), "punto generico");
}
```

Il caso piu specifico viene prima: `(0, _)` accetterebbe anche l'origine. `_` copre una posizione senza creare un nome; l'ultimo ramo copre tutti i punti restanti.

## Varianti

- Literal pattern: `0`, `"ok"`, `true`.
- Wildcard: `_`.
- Binding: `name`.
- Or pattern: `0 | 1`.
- Tuple pattern: `(x, y)`.
- Range pattern: `1..=5`.

### Un solo caso con if let

```rust
fn main() {
    let name = Some(String::from("Ada"));
    if let Some(text) = &name {
        let borrowed: &String = text;
        assert_eq!(borrowed, "Ada");
    }
    assert_eq!(name.as_deref(), Some("Ada"));
}
```

Il match e su `&name`, quindi `text` prende in prestito la stringa e `name` resta utilizzabile. Con `if let Some(text) = name`, invece, una `String` verrebbe spostata. Non aggiungere automaticamente `ref` a questo esempio: edition 2024 restringe alcune combinazioni con i binding gia inferiti per riferimento.

### Binding nuovo o confronto con un valore esistente

```rust
fn matches_expected(value: Option<i32>, expected: i32) -> bool {
    match value {
        Some(actual) if actual == expected => true,
        _ => false,
    }
}

fn main() {
    assert!(matches_expected(Some(4), 4));
    assert!(!matches_expected(Some(9), 4));
    assert!(!matches_expected(None, 4));
}
```

Scrivere `Some(expected)` introdurrebbe un nuovo binding che nasconde il parametro, non un confronto con esso. Qui il confronto e nella guardia. I nomi di costanti o varianti enum risolti come path sono un caso diverso: non ogni identificatore in un pattern crea una variabile.

### Wildcard e nome con underscore

```rust
fn main() {
    let name = String::from("Ada");
    let _ = name;
    assert_eq!(name, "Ada");

    let _owned = name;
    assert_eq!(_owned, "Ada");
}
```

`_` non crea un binding e in questa assegnazione non sposta la stringa. `_owned` e un normale binding, con l'avviso di inutilizzo silenziato: qui prende ownership. Non usare questa regola come garanzia di durata per temporanei o guardie di lock; un valore prodotto direttamente in `let _ = espressione` puo essere distrutto subito.

## Errori comuni

- Usare `_` quando poi serve il valore.
- Dimenticare che `match` deve essere esaustivo.
- Confondere pattern refutabili e irrefutabili.
- Fare shadowing involontario di nomi gia esistenti dentro un pattern.

### Pattern refutabile in un normale let

Questo programma **non compila**, anche se il valore dimostrativo e `Some`: il tipo `Option<i32>` ammette anche `None`.

```rust
fn main() {
    let value = Some(7);
    let Some(number) = value;
    println!("{number}");
}
```

Usa `if let` per elaborare solo il caso presente oppure `let Some(number) = value else { return; };` se l'assenza deve interrompere la funzione. Il ramo `else` di `let ... else` deve uscire dal flusso corrente, non limitarsi a stampare un messaggio e continuare.

## Checklist

- Usa `_` solo per valori davvero inutili.
- Controlla che `match` copra tutti i casi.
- Usa `if let` per un solo caso rilevante.
- Usa nomi espliciti nei binding per rendere chiara l'estrazione.
- Sai se un binding copia, sposta o prende in prestito il dato.
- Non confondi `_`, `_name` e un confronto con una variabile esterna.

## Collegamenti

- [[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]]
- [[Programmazione/Rust/Pagine/Destructuring|Destructuring]]
- [[Programmazione/Rust/Pagine/if let e while let|if let e while let]]
- [[Programmazione/Rust/Pagine/Pattern matching avanzato|Pattern matching avanzato]]
- [[Programmazione/Rust/Pagine/Ownership|Ownership]]

## Fonti

- [Rust Reference: Patterns](https://doc.rust-lang.org/reference/patterns.html).
- [Rust Book: Refutability](https://doc.rust-lang.org/book/ch19-02-refutability.html).
- [Rust Book: Pattern Syntax](https://doc.rust-lang.org/book/ch19-03-pattern-syntax.html).
- [Edition Guide: match ergonomics in Rust 2024](https://doc.rust-lang.org/edition-guide/rust-2024/match-ergonomics.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
