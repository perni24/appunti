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
  - controllo-di-flusso
aliases: []
prerequisites: []
related: []
title: Controllo di flusso
---

# Controllo di flusso

## Sintesi

Il controllo di flusso in Rust usa `if`, `loop`, `while`, `for` e `match`. Molti di questi costrutti sono espressioni, quindi possono produrre valori.

Non tutti producono un risultato utile allo stesso modo: `if` e `match` possono scegliere un valore; `loop` puo produrlo tramite `break valore`; `while` e `for` terminati normalmente producono `()`. Esempi indipendenti per `src/main.rs`, verificati con **Rust 1.99.1, edition 2024**.

## Quando usarlo

- Quando devi scegliere tra rami alternativi.
- Quando devi iterare su range, collezioni o iteratori.
- Quando devi gestire casi multipli in modo esaustivo.

## Come funziona

`if` richiede una condizione booleana. Non c'e conversione implicita da interi o altri tipi a `bool`. I loop possono essere interrotti con `break`; `loop` puo anche restituire un valore usando `break valore`.

### Scegliere il costrutto

- `if` / `else if`: condizioni in ordine; esegue il primo ramo la cui condizione e vera.
- `match`: pattern e possibili guardie; esegue il primo ramo applicabile e richiede copertura dei casi. Non c'e fall-through fra rami.
- `for`: ottiene un iteratore tramite `IntoIterator`, poi ne consuma gli elementi finche termina o incontra `break`.
- `while`: controlla la condizione prima di ogni iterazione, quindi puo non eseguire mai il corpo.
- `loop`: non ha condizione implicita di arresto; la logica deve prevedere un'uscita, se deve terminare.

`break` esce dal ciclo selezionato, `continue` passa all'iterazione successiva e `return` esce dall'intera funzione. Con cicli annidati, senza label, `break` e `continue` riguardano il ciclo piu interno.

## API / Sintassi

### If come espressione

```rust
fn main() {
    let enabled = true;
    let limit = if enabled { 10 } else { 0 };
    assert_eq!(limit, 10);

    if limit > 0 {
        println!("Attivo");
    }
}
```

I rami che producono un valore devono avere tipi compatibili. L'`if` finale e usato per un effetto e puo omettere `else`; non e la forma per produrre un numero se la condizione e falsa.

### Range e for

```rust
fn main() {
    let mut exclusive = Vec::new();
    for number in 1..4 {
        exclusive.push(number);
    }
    let mut inclusive = Vec::new();
    for number in 1..=4 {
        inclusive.push(number);
    }
    assert_eq!(exclusive, [1, 2, 3]);
    assert_eq!(inclusive, [1, 2, 3, 4]);

    let mut countdown = Vec::new();
    for number in (1..=3).rev() {
        countdown.push(number);
    }
    assert_eq!(countdown, [3, 2, 1]);
}
```

`a..b` esclude `b`, `a..=b` lo include. Un range crescente con inizio maggiore della fine non conta all'indietro: per invertire questo range usa `.rev()`. `0..items.len()` e vuoto se la collezione e vuota; `0..=items.len()` include invece un indice non valido.

### Lettura e modifica di una collezione

```rust
fn main() {
    let mut values = vec![1, 2, 3];
    let mut total = 0;
    for value in &values {
        total += *value;
    }
    assert_eq!(total, 6);

    for value in &mut values {
        *value *= 2;
    }
    assert_eq!(values, [2, 4, 6]);
}
```

Per `Vec<T>`, `for value in values` consuma il vettore; `&values` presta riferimenti condivisi, `&mut values` riferimenti mutabili. Non generalizzare il consumo a ogni tipo: per esempio alcuni array sono `Copy`. La modifica degli elementi non autorizza automaticamente `push` o `remove` sul vettore mentre e gia preso in prestito dal ciclo.

## Esempio pratico

### Classificare tutti i segni

```rust
fn classify(value: i32) -> &'static str {
    if value < 0 {
        "negativo"
    } else if value == 0 {
        "zero"
    } else {
        "positivo"
    }
}

fn main() {
    assert_eq!(classify(-2), "negativo");
    assert_eq!(classify(0), "zero");
    assert_eq!(classify(3), "positivo");
    for number in [-2, 0, 3] {
        println!("{}", classify(number));
    }
}
```

## Varianti

- `if` / `else if` / `else`: scelta condizionale.
- `loop`: ciclo infinito controllato da `break`.
- `while`: ciclo finche la condizione e vera.
- `for`: iterazione su un iteratore.
- `match`: selezione esaustiva su pattern.

### While con avanzamento esplicito

```rust
fn main() {
    let mut remaining = 3;
    let mut visited = Vec::new();
    while remaining > 0 {
        remaining -= 1;
        if remaining == 1 {
            continue;
        }
        visited.push(remaining);
    }
    assert_eq!(visited, [2, 0]);
    assert_eq!(remaining, 0);
}
```

L'avanzamento e prima di `continue`: altrimenti un ramo potrebbe saltare l'aggiornamento necessario per terminare. Non usare un loop di polling continuo per attendere eventi o I/O: le primitive appropriate dipendono dal runtime.

### Loop che produce un risultato

```rust
fn main() {
    let mut count = 0;
    let result = loop {
        count += 1;
        if count == 3 {
            break count * 10;
        }
    };
    assert_eq!(result, 30);
}
```

I `break` che terminano lo stesso loop devono produrre tipi compatibili. Un semplice `break;` produce `()`. `break valore` non e ammesso per restituire un valore da un `while` o da un `for`.

### Match esaustivo su Option

```rust
fn describe(value: Option<i32>) -> &'static str {
    match value {
        Some(0) => "zero",
        Some(_) => "presente",
        None => "assente",
    }
}

fn main() {
    assert_eq!(describe(Some(0)), "zero");
    assert_eq!(describe(Some(-2)), "presente");
    assert_eq!(describe(None), "assente");
}
```

`Some(_)` copre qualsiasi altro valore contenuto, ma non `None`. L'ordine conta: mettere `Some(_)` prima di `Some(0)` renderebbe irraggiungibile il ramo specifico. Un catch-all `_` puo essere corretto, ma puo anche nascondere nuovi casi che volevi gestire esplicitamente.

### Uscire da un ciclo esterno

```rust
fn main() {
    let mut found = None;
    'search: for row in 0..3 {
        for column in 0..3 {
            if row + column == 3 {
                found = Some((row, column));
                break 'search;
            }
        }
    }
    assert_eq!(found, Some((1, 2)));
}
```

La label evita di continuare il ciclo esterno dopo il ritrovamento; non e un lifetime di un riferimento, anche se usa l'apostrofo. Per `if let`, `while let`, `let else`, blocchi con label e propagazione con `?`, prosegui nelle note collegate.

## Errori comuni

- Usare `if value` invece di una condizione booleana.
- Dimenticare che i rami di un `if` usato come espressione devono avere lo stesso tipo.
- Usare loop manuali dove un iteratore sarebbe piu idiomatico.
- Ignorare `match` quando i casi devono essere esaustivi.
- Dimenticare l'avanzamento prima di `continue`, causando un ciclo senza fine.
- Aggiungere o rimuovere elementi dalla stessa collezione presa in prestito dal `for`.
- Usare un range inclusivo per indici la cui fine e `len()`.

### Break con valore nel costrutto sbagliato

Questo programma **non compila**: `while` non restituisce `count` tramite `break`.

```rust
fn main() {
    let mut count = 0;
    let result = while count < 3 {
        count += 1;
        break count;
    };
    println!("{result:?}");
}
```

Scegli `loop` con `break valore`, oppure mantieni il risultato in un binding esterno. Non aggiungere un cast per mascherare l'errore: e una regola del costrutto.

## Checklist

- Le condizioni sono `bool`.
- I rami restituiscono tipi coerenti.
- Usi `for` con iteratori per collezioni.
- Usi `match` quando i casi devono essere completi.
- Ogni ciclo destinato a terminare ha un avanzamento o un'uscita verificabile.
- Sono chiari i confini dei range e il comportamento con input vuoto.
- Sai se stai consumando, leggendo o modificando gli elementi.

## Collegamenti

- [[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]]
- [[Programmazione/Rust/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Rust/Pagine/Pattern base|Pattern base]]
- [[Programmazione/Rust/Pagine/Control flow avanzato|Controllo di flusso avanzato]]
- [[Programmazione/Rust/Pagine/if let e while let|if let e while let]]
- [[Programmazione/Rust/Pagine/Funzioni|Funzioni]]

## Fonti

- [Rust Book: Control Flow](https://doc.rust-lang.org/book/ch03-05-control-flow.html).
- [Rust Reference: Loop expressions](https://doc.rust-lang.org/reference/expressions/loop-expr.html).
- [Rust Reference: Match expressions](https://doc.rust-lang.org/reference/expressions/match-expr.html).
- [Standard library: IntoIterator](https://doc.rust-lang.org/std/iter/trait.IntoIterator.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
