---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags:
  - programmazione
  - rust
  - sintassi
aliases: []
prerequisites: []
related: []
---

# Sintassi di base

## Sintesi

La sintassi di base di Rust combina elementi familiari dei linguaggi C-like con regole piu esplicite su tipi, scope, mutabilita e gestione degli errori. Il punto importante e che molte scelte sintattiche rendono visibili vincoli che in altri linguaggi restano impliciti.

## Quando usarlo

- Quando leggi o scrivi qualunque file Rust.
- Quando devi distinguere espressioni, statement e blocchi.
- Quando vuoi capire perche il compilatore richiede `let`, `mut`, `;`, `{}` o annotazioni di tipo.

## Come funziona

Un programma Rust e composto da item, come funzioni, moduli, struct, enum, trait e costanti. L'esecuzione di un binario parte dalla funzione `main`.

Rust usa blocchi delimitati da `{}`. Molti costrutti sono espressioni, cioe producono un valore. Questo vale anche per blocchi, `if`, `match` e chiamate di funzione. Il punto e virgola `;` trasforma un'espressione in uno statement che non restituisce un valore utile.

## API / Sintassi

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
- `!`: indica spesso una macro, come `println!`.

## Esempio pratico

```rust
fn main() {
    let x = 10;
    let y = {
        let doubled = x * 2;
        doubled + 1
    };

    println!("Risultato: {y}");
}
```

Il blocco assegnato a `y` restituisce `doubled + 1` perche l'ultima riga non ha `;`.

## Varianti

- File binario: contiene `fn main()`.
- Libreria: espone funzioni, tipi e moduli da `lib.rs`.
- Espressione con valore: ultima riga senza `;`.
- Statement: istruzione terminata con `;`.

## Errori comuni

- Aggiungere `;` all'ultima espressione quando si vuole restituire un valore.
- Dimenticare `mut` e poi provare a modificare un binding.
- Confondere macro e funzioni: `println!()` e una macro, non una funzione normale.
- Scrivere codice pensando che `if` sia solo controllo di flusso: in Rust puo anche restituire un valore.

## Checklist

- La funzione `main` esiste nei binari.
- I blocchi che devono restituire un valore non hanno `;` sull'ultima espressione.
- I binding modificati sono dichiarati con `mut`.
- Le macro sono chiamate con `!`.

## Collegamenti

- [[Programmazione/Rust/Pagine/Variabili mutabilita e shadowing|Variabili, mutabilita e shadowing]]
- [[Programmazione/Rust/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Rust/Pagine/Controllo di flusso|Controllo di flusso]]

