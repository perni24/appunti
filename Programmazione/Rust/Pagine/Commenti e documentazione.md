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
  - documentazione
aliases: []
prerequisites: []
related: []
---

# Commenti e documentazione

## Sintesi

Rust distingue commenti normali e commenti di documentazione. I commenti normali spiegano il codice per chi lo legge. I commenti doc generano documentazione con `rustdoc` e possono includere esempi eseguibili come test.

## Quando usarlo

- Quando devi chiarire una scelta non ovvia.
- Quando esponi API pubbliche di crate o moduli.
- Quando vuoi esempi verificabili nella documentazione.

## Come funziona

I commenti `//` e `/* ... */` sono ignorati dal compilatore. I commenti doc `///` e `//!` vengono letti da `rustdoc`. `///` documenta l'item seguente; `//!` documenta il modulo o crate che contiene il commento.

## API / Sintassi

```rust
// Commento su una riga

/*
Commento su piu righe
*/

/// Somma due numeri.
///
/// # Esempio
///
/// ```
/// let result = my_crate::add(2, 3);
/// assert_eq!(result, 5);
/// ```
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

## Esempio pratico

```rust
//! Utility matematiche condivise.

/// Restituisce `true` se il numero e pari.
pub fn is_even(value: i32) -> bool {
    value % 2 == 0
}
```

La documentazione puo essere generata con:

```powershell
cargo doc --open
```

## Varianti

- `//`: commento ordinario.
- `/* ... */`: commento multilinea.
- `///`: documentazione dell'item successivo.
- `//!`: documentazione del modulo o crate corrente.

## Errori comuni

- Commentare cosa fa una riga ovvia invece di spiegare perche esiste.
- Lasciare documentazione pubblica non aggiornata.
- Inserire esempi doc che non compilano.
- Usare commenti per nascondere codice morto invece di rimuoverlo.

## Checklist

- Le API pubbliche hanno documentazione chiara.
- Gli esempi doc sono minimali e compilabili.
- I commenti spiegano decisioni, invarianti o vincoli.
- La documentazione non contraddice il codice.

## Collegamenti

- [[Programmazione/Rust/Pagine/rustdoc|rustdoc]]
- [[Programmazione/Rust/Pagine/Doc test|Doc test]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]

