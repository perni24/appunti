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
  - sintassi
aliases: []
prerequisites: []
related: []
title: Sintassi di base
---

# Sintassi di base

## Sintesi

Rust distingue **item** (definizioni come funzioni e tipi), **statement** (istruzioni) ed **espressioni** (calcoli che producono un valore). Capire questa distinzione evita molti errori con blocchi, `;` e valori restituiti.

Gli esempi validi sono programmi indipendenti: ciascuno puo sostituire `src/main.rs` in un progetto Cargo binario. I controesempi sono dichiarati esplicitamente. Riferimento di verifica: Rust **1.99.1**, edition **2024**; nessuna dipendenza esterna.

## Quando usarlo

- Quando leggi o scrivi qualunque file Rust.
- Quando devi distinguere espressioni, statement e blocchi.
- Quando vuoi capire perche il compilatore richiede `let`, `mut`, `;`, `{}` o annotazioni di tipo.

## Come funziona

### Item e punto di ingresso

Funzioni, moduli, struct, enum, trait e costanti sono item. Un normale binario con la libreria standard parte da `fn main()`. In un progetto Cargo convenzionale il file e `src/main.rs`; una libreria usa `src/lib.rs` e non richiede `main`. I programmi `no_std` con ingresso personalizzato sono un caso distinto.

Le variabili locali e le operazioni eseguibili stanno dentro le funzioni o altri blocchi appropriati, non direttamente nel corpo di un modulo.

### Espressioni, punto e virgola e unit

`x + 1`, una chiamata, un blocco e un `if` possono produrre valori. In un blocco che termina normalmente, l'espressione finale senza `;` ne determina il risultato. Se manca, il risultato e `()`, il valore del tipo **unit**: non significa `null` o dato mancante.

Una normale espressione seguita da `;` viene valutata ma non diventa il risultato del blocco. Gli effetti avvengono comunque. Non basta pero contare i `;`: una funzione con corpo e alcuni statement con blocco, come `if`, possono comparire senza un `;` finale.

### Scope

Le graffe introducono un blocco. Un binding locale dichiarato al suo interno non e accessibile dopo la chiusura del blocco. Le graffe non cancellano gli effetti prodotti su valori esterni tramite accessi consentiti.

## API / Sintassi

### Programma minimo

```rust
fn main() {
    let name = "Rust";
    println!("Ciao, {name}");
}
```

Elementi base:

- `fn`: definisce una funzione.
- `let`: crea un binding.
- `mut`: rende un binding mutabile.
- `//`: commento su una riga.
- `{}`: delimita un blocco.
- `println!(...)`: invoca una macro; il suffisso `!` la distingue da una chiamata di funzione.
- `: Tipo`: annota il tipo di un binding o parametro; `-> Tipo` quello di ritorno.
- `snake_case`: convenzione per nomi di funzioni e variabili.

`!` non indica sempre una macro: `!active` nega un booleano. Il significato dipende dalla posizione sintattica.

### Valore del blocco e valore unit

```rust
fn main() {
    let x = 10;
    let y = {
        let doubled = x * 2;
        doubled + 1
    };
    let side_effect: () = {
        println!("Calcolo eseguito");
    };

    assert_eq!(y, 21);
    assert_eq!(side_effect, ());
    println!("Risultato: {y}");
}
```

Il `;` dopo `}` chiude la dichiarazione `let y = ...;`. Non elimina il risultato del blocco: e il `;` **dentro** il blocco, dopo l'ultima espressione, a cambiarne il risultato.

## Esempio pratico

### Funzione e if come espressione

```rust
fn delivery_fee(is_member: bool) -> u32 {
    if is_member { 0 } else { 5 }
}

fn main() {
    let fee = delivery_fee(true);
    assert_eq!(fee, 0);
    assert_eq!(delivery_fee(false), 5);
    println!("Consegna: {fee}");
}
```

Il tipo `u32` e dichiarato dopo `->`; entrambi i rami producono un valore compatibile con quel tipo. La condizione deve essere `bool`: Rust non tratta `0` o una stringa vuota come falsi. `return valore;` puo uscire prima dalla funzione; per il risultato finale basta l'espressione conclusiva.

## Varianti

- `match` puo produrre un valore, con regole di tipi ed esaustivita approfondite nelle note sul controllo di flusso.
- Un `if` usato solo per effetti puo omettere `else`; non e la forma per scegliere fra due valori non-unit.
- Un blocco che esce con `return` o non termina non raggiunge una normale espressione finale: la regola pratica su `()` riguarda i blocchi che terminano normalmente.

## Errori comuni

- Aggiungere `;` all'ultima espressione quando si vuole restituire un valore.
- Dimenticare `mut` e poi provare a modificare un binding.
- Confondere macro e funzioni: `println!()` e una macro, non una funzione normale.
- Scrivere codice pensando che `if` sia solo controllo di flusso: in Rust puo anche restituire un valore.

### Punto e virgola che cambia il risultato

Questo programma **non compila**: `answer` promette `u32`, ma il suo corpo produce `()`.

```rust
fn answer() -> u32 {
    42;
}

fn main() {
    println!("{}", answer());
}
```

Correzione: `42` senza `;`, oppure `return 42;`. Non cambiare il tipo in `()` solo per silenziare l'errore se il chiamante ha bisogno del numero.

### Rami con tipi incompatibili

Anche questo **non compila**: i due rami non forniscono un risultato di tipo comune.

```rust
fn main() {
    let enabled = true;
    let value = if enabled { 1 } else { "off" };
    println!("{value}");
}
```

Scegli una rappresentazione coerente oppure un enum; non esiste una conversione automatica da numero a stringa.

## Checklist

- Il normale target binario ha il suo punto di ingresso `main`.
- I blocchi che devono restituire un valore non hanno `;` sull'ultima espressione.
- I binding modificati sono dichiarati con `mut`.
- Le macro sono chiamate con `!`.
- Distinguo il `;` della dichiarazione da quello dell'espressione finale.
- Non uso fuori dal blocco variabili definite solo al suo interno.

## Collegamenti

- [[Programmazione/Rust/Pagine/Variabili mutabilita e shadowing|Variabili, mutabilita e shadowing]]
- [[Programmazione/Rust/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Rust/Pagine/Controllo di flusso|Controllo di flusso]]
- [[Programmazione/Rust/Pagine/Moduli crate e package|Moduli, crate e package]]
- [[Programmazione/Rust/Pagine/Cargo|Cargo]]

## Fonti

- [Rust Book: Functions](https://doc.rust-lang.org/book/ch03-03-how-functions-work.html).
- [Rust Reference: Block expressions](https://doc.rust-lang.org/reference/expressions/block-expr.html).
- [Rust Reference: Statements](https://doc.rust-lang.org/reference/statements.html).
- [Rust Reference: If expressions](https://doc.rust-lang.org/reference/expressions/if-expr.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
