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
  - pattern-matching
  - if-let
  - while-let
aliases:
  - if let Rust
  - while let Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Pattern Matching]]"
  - "[[Programmazione/Rust/Pagine/Option]]"
related:
  - "[[Programmazione/Rust/Pagine/Enums]]"
  - "[[Programmazione/Rust/Pagine/Result]]"
  - "[[Programmazione/Rust/Pagine/Control flow avanzato]]"
title: if let e while let
---

# if let e while let

## Sintesi

`if let` esegue un ramo quando un valore corrisponde a un pattern; `while let` ripete finche il pattern continua a corrispondere. Sono utili quando non serve distinguere esplicitamente tutte le alternative con `match`.

Gli esempi sono programmi indipendenti per `src/main.rs`, verificati con **Rust 1.99.1, edition 2024**. Le let chain richiedono **Rust 1.88 o successivo e edition 2024**; non sono necessarie per gli esempi iniziali.

## Quando usarlo

- `if let`: un solo caso interessante, altri ignorabili o trattati insieme.
- `while let`: estrazione ripetuta da uno stato che avanza, per esempio `pop()`.
- `match`: piu casi importanti, soprattutto errori da distinguere.
- `let ... else`: proseguire con i binding nel blocco esterno dopo un controllo iniziale.

## Come funziona

Il segno `=` separa pattern ed espressione: non e un'assegnazione a variabili preesistenti ne un confronto booleano. I binding vengono introdotti solo se il pattern riesce.

Con `if let` l'espressione viene valutata una volta; i binding sono visibili nel ramo corrispondente, non dopo l'intero costrutto o nel suo `else`. Con `while let` la condizione viene rivalutata a ogni iterazione, compresa la prova finale che fa uscire dal ciclo.

### Un caso con fallback

```rust
fn label(value: &Option<String>) -> String {
    if let Some(text) = value {
        format!("presente: {text}")
    } else {
        String::from("assente")
    }
}

fn main() {
    let value = Some(String::from("ciao"));
    assert_eq!(label(&value), "presente: ciao");
    assert_eq!(label(&None), "assente");
    assert_eq!(value.as_deref(), Some("ciao"));
}
```

Il parametro in prestito conserva il dato. Per valore, `Some(text)` potrebbe muovere la stringa. Senza `else`, il risultato normale dell'espressione deve essere `()`; con `else`, i rami devono convergere a un tipo comune.

Per la scelta dei rami, `if let Some(text) = value` equivale a un match con `Some(text)` e fallback. Non estendere l'equivalenza alla durata dei temporanei: in edition 2024 quelli della condizione di `if let` vengono distrutti prima di entrare nell'`else`; un `match` puo mantenerli piu a lungo. E rilevante con guardie di lock e risorse, non solo con valori numerici.

## API / Sintassi

### Estrarre da uno stack

```rust
fn main() {
    let mut stack = vec![1, 2, 3];
    let mut extracted = Vec::new();

    while let Some(number) = stack.pop() {
        extracted.push(number);
    }

    assert_eq!(extracted, vec![3, 2, 1]);
    assert!(stack.is_empty());
}
```

`Vec::pop` rimuove dalla fine: ordine **LIFO**, non ordine di inserimento. Il ciclo termina quando restituisce `None`. `break` interrompe subito il ciclo; `continue` torna alla condizione, che deve comunque avanzare.

### Osservare un errore senza perdere il risultato

```rust
fn main() {
    let result = "abc".parse::<u16>();
    let mut errors = Vec::new();

    if let Err(error) = &result {
        errors.push(error.to_string());
    }

    assert_eq!(errors.len(), 1);
    assert!(result.is_err());
}
```

Qui il successo non richiede lavoro aggiuntivo; l'errore viene raccolto senza consumare `result`. E un esempio in memoria, non una funzione di salvataggio. Se il chiamante deve conoscere il fallimento, mantieni o propaga `Result`: registrare un messaggio non equivale a recuperare dall'errore.

## Esempio pratico

### Una coda di comandi

```rust
use std::collections::VecDeque;

enum Command {
    Print(String),
    Exit,
}

fn execute(command: Command, output: &mut Vec<String>) -> bool {
    if let Command::Print(text) = command {
        output.push(text);
        true
    } else {
        false
    }
}

fn drain_until_exit(commands: &mut VecDeque<Command>) -> Vec<String> {
    let mut output = Vec::new();
    while let Some(command) = commands.pop_front() {
        if !execute(command, &mut output) {
            break;
        }
    }
    output
}

fn main() {
    let mut commands = VecDeque::from([
        Command::Print(String::from("primo")),
        Command::Print(String::from("secondo")),
        Command::Exit,
        Command::Print(String::from("rimasto")),
    ]);

    assert_eq!(drain_until_exit(&mut commands), vec!["primo", "secondo"]);
    assert_eq!(commands.len(), 1);
}
```

`pop_front` estrae in ordine **FIFO**. Il comando `Exit` viene consumato, quelli successivi restano in coda. `Print` qui aggiunge testo a un vettore: non scrive su una periferica e non termina il processo.

Il fallback di `execute` e adatto al piccolo enum attuale. Aggiungendo una variante, la funzione continuerebbe a compilarla come richiesta di arresto: se ogni nuova variante deve richiedere una scelta, usa `match` esplicito.

## Varianti

### Uscita anticipata con let else

```rust
fn first_character(input: Option<&str>) -> Option<char> {
    let Some(text) = input else {
        return None;
    };
    text.chars().next()
}

fn main() {
    assert_eq!(first_character(Some("rust")), Some('r'));
    assert_eq!(first_character(Some("")), None);
    assert_eq!(first_character(None), None);
}
```

`text` resta disponibile dopo il controllo. Il ramo `else` deve divergere: per esempio `return`, `break` o `continue` in un ciclo appropriato, oppure panic. Qui assenza e stringa vuota producono entrambe `None`, scelta esplicita del contratto; `chars()` restituisce uno scalare Unicode, non un grafema.

### Catene di condizioni

```rust
fn configured_port(input: Option<&str>) -> Option<u16> {
    if let Some(raw) = input
        && let Ok(port) = raw.parse::<u16>()
        && port != 0
    {
        Some(port)
    } else {
        None
    }
}

fn main() {
    assert_eq!(configured_port(Some("8080")), Some(8080));
    assert_eq!(configured_port(Some("0")), None);
    assert_eq!(configured_port(Some("abc")), None);
    assert_eq!(configured_port(None), None);
}
```

Le condizioni `&&` sono valutate da sinistra a destra con short-circuit; i binding precedenti sono utilizzabili in quelle successive. Le stesse catene sono ammesse in `while`. Non usare `||` per concatenare questi binding.

L'esempio unifica assenza, parsing fallito e porta zero in `None`: se servono motivi distinti usa `Result`. Non fa trim, non apre socket e non verifica la disponibilita della porta. Il divieto di zero e una politica del demo.

### Fermarsi non significa filtrare

```rust
fn main() {
    let mut items = [Ok(1), Err("dato non valido"), Ok(2)].into_iter();
    let mut accepted = Vec::new();

    while let Some(Ok(number)) = items.next() {
        accepted.push(number);
    }

    assert_eq!(accepted, vec![1]);
    assert_eq!(items.next(), Some(Ok(2)));
}
```

La chiamata che restituisce `Some(Err(...))` e gia avvenuta: l'elemento di errore e stato estratto, ma non gestito dal corpo. Il ciclo si ferma senza continuare fino a `Ok(2)`. Per elaborare tutto, usa `for item in items` e un `match` interno, decidendo se registrare, propagare o ignorare ogni errore.

## Errori comuni

### Un else che non esce

Questo programma **non compila** (E0308):

```rust
fn main() {
    let value: Option<i32> = None;
    let Some(number) = value else {
        eprintln!("assente");
    };
    println!("{number}");
}
```

Dopo il messaggio aggiungi un'uscita coerente con la funzione, come `return;`. Altrimenti il flusso proseguirebbe senza un valore per `number`.

Altri errori frequenti:

- Ignorare silenziosamente `Err` con `if let Ok(...)`.
- Scrivere `while let Some(number) = option` su un `Option<i32>` invariato: essendo copiabile, il ciclo puo ripetersi indefinitamente.
- Confondere `while let` con un filtro che salta i valori non corrispondenti.
- Riutilizzare una `String` gia estratta per valore o un binding fuori dal suo scope.
- Presumere che `if let` segnali tutte le nuove varianti aggiunte a un enum.

## Checklist

- Gli altri casi possono essere ignorati o condividere lo stesso fallback?
- Il dato deve restare disponibile? Usa un prestito dove serve.
- La condizione del ciclo avanza e ha una terminazione prevista?
- Quale elemento viene consumato quando il pattern fallisce?
- Ordine LIFO/FIFO ed elementi rimasti sono intenzionali?
- Errori distinti sono conservati quando servono al chiamante?
- Edition e versione supportano la sintassi usata?

## Collegamenti

- [[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]]
- [[Programmazione/Rust/Pagine/Option|Option]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Control flow avanzato|Control flow avanzato]]
- [[Programmazione/Rust/Pagine/Destructuring|Destructuring]]
- [[Programmazione/Rust/Pagine/VecDeque BTreeMap e BTreeSet|VecDeque, BTreeMap e BTreeSet]]
- [[Programmazione/Rust/Pagine/Rust 2018 2021 e 2024|Rust 2018, 2021 e 2024]]

## Fonti

- [Rust Book: if let e let else](https://doc.rust-lang.org/book/ch06-03-if-let.html).
- [Rust Reference: if expressions](https://doc.rust-lang.org/reference/expressions/if-expr.html).
- [Rust Reference: while let](https://doc.rust-lang.org/reference/expressions/loop-expr.html#while-let-patterns).
- [Rust Reference: let statements](https://doc.rust-lang.org/reference/statements.html#let-statements).
- [Rust 1.88: stabilizzazione delle let chain](https://blog.rust-lang.org/2025/06/26/Rust-1.88.0/).
- [Edition Guide: let chains](https://doc.rust-lang.org/edition-guide/rust-2024/let-chains.html).
- [Edition Guide: durata dei temporanei in if let](https://doc.rust-lang.org/edition-guide/rust-2024/temporary-if-let-scope.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
