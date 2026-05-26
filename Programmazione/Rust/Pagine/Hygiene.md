---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags:
  - programmazione
  - rust
  - macros
aliases:
  - "Macro hygiene"
  - "Igiene macro"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Macro dichiarative]]"
  - "[[Programmazione/Rust/Pagine/Procedural macros]]"
related:
  - "[[Programmazione/Rust/Pagine/Function-like macros]]"
  - "[[Programmazione/Rust/Pagine/Attribute macros]]"
  - "[[Programmazione/Rust/Pagine/Public API design]]"
---

# Hygiene

## Sintesi

Hygiene, o igiene delle macro, indica le regole che impediscono a nomi generati da una macro di catturare o essere catturati accidentalmente da nomi nel codice chiamante. In Rust riduce molti problemi tipici dei preprocessori testuali, ma non elimina ogni attenzione necessaria.

Capire hygiene aiuta a scrivere macro riusabili, esportabili e meno fragili.

## Quando usarlo

- Quando una macro genera identificatori, variabili temporanee o path.
- Quando esporti macro da una crate.
- Quando una macro usa item della propria crate.
- Quando incontri errori di risoluzione nomi dentro codice generato.

## Come funziona

In una macro dichiarativa:

```rust
macro_rules! example {
    ($value:expr) => {{
        let temp = $value;
        temp + 1
    }};
}
```

Il nome `temp` generato dalla macro non collide normalmente con un `temp` del chiamante.

Per riferirsi a item della crate che definisce la macro esportata, si usa spesso `$crate`:

```rust
macro_rules! call_helper {
    () => {
        $crate::helper()
    };
}
```

## API / Sintassi

Path qualificati:

```rust
::std::vec::Vec::new()
```

Uso di `$crate`:

```rust
#[macro_export]
macro_rules! make_value {
    () => {
        $crate::Value::new()
    };
}
```

Metavariabili:

```rust
macro_rules! bind {
    ($name:ident, $value:expr) => {
        let $name = $value;
    };
}
```

Qui il nome viene fornito dal chiamante e quindi deve essere visibile nel suo contesto.

## Esempio pratico

```rust
#[macro_export]
macro_rules! bail_if {
    ($condition:expr, $message:expr) => {
        if $condition {
            return Err($message.into());
        }
    };
}
```

La macro usa `Err` e `Into` disponibili nel prelude. In macro piu complesse conviene qualificare path esterni per evitare dipendenze dal contesto del chiamante.

## Varianti

- Hygiene di identificatori generati.
- `$crate` per macro esportate.
- Path assoluti come `::std::...`.
- Span nelle procedural macros.
- Identificatori intenzionalmente forniti dal chiamante con `$ident`.

## Errori comuni

- Usare path relativi e aspettarsi che funzionino in ogni modulo.
- Dimenticare `$crate` nelle macro esportate.
- Generare nomi pubblici non documentati.
- Pensare che hygiene risolva anche ogni problema di path.
- Creare macro che dipendono da import presenti nel chiamante.

## Checklist

- La macro deve funzionare da altri moduli o crate?
- I path generati sono assoluti o usano `$crate`?
- Gli identificatori generati possono collidere?
- Gli identificatori forniti dal chiamante sono intenzionali?
- Gli errori puntano al codice chiamante o al codice generato?

## Collegamenti

- [[Programmazione/Rust/Pagine/Macro dichiarative|Macro dichiarative]]
- [[Programmazione/Rust/Pagine/Procedural macros|Procedural macros]]
- [[Programmazione/Rust/Pagine/Function-like macros|Function-like macros]]
- [[Programmazione/Rust/Pagine/Attribute macros|Attribute macros]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
