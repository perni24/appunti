---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags:
  - programmazione
  - rust
  - testing-qualita-e-sicurezza
aliases:
  - "Unit test"
  - "Test unitari Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Funzioni]]"
  - "[[Programmazione/Rust/Pagine/Result]]"
related:
  - "[[Programmazione/Rust/Pagine/Integration test]]"
  - "[[Programmazione/Rust/Pagine/Doc test]]"
  - "[[Programmazione/Rust/Pagine/cargo-nextest]]"
---

# Unit test

## Sintesi

Gli **unit test** in Rust verificano piccole unita di codice, di solito funzioni, metodi o moduli. Vengono scritti vicino al codice sorgente, spesso dentro un modulo `tests` annotato con `#[cfg(test)]`.

Il vantaggio principale e che possono testare anche dettagli privati del modulo, perche vivono nello stesso file o nello stesso modulo logico del codice testato.

## Quando usarlo

Usa unit test quando:

- vuoi verificare logica pura e deterministica;
- devi coprire casi limite;
- vuoi testare funzioni private;
- vuoi proteggere invarianti di un modulo;
- vuoi feedback rapido durante lo sviluppo;
- un bug puo essere isolato in una funzione piccola.

Per verificare il comportamento pubblico della crate, preferisci anche integration test.

## Come funziona

Rust usa funzioni annotate con `#[test]`. `cargo test` compila il crate in modalita test e lancia le funzioni di test.

Pattern comune:

- modulo `tests`;
- attributo `#[cfg(test)]`;
- `use super::*`;
- funzioni `#[test]`;
- macro `assert!`, `assert_eq!`, `assert_ne!`;
- ritorno `Result` quando vuoi usare `?` nel test.

`#[cfg(test)]` evita che il codice di test venga compilato nelle build normali.

## API / Sintassi

Esempio minimo:

```rust
fn add(left: i32, right: i32) -> i32 {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adds_two_numbers() {
        assert_eq!(add(2, 3), 5);
    }
}
```

Test che restituisce `Result`:

```rust
#[test]
fn parses_number() -> Result<(), std::num::ParseIntError> {
    let value: i32 = "42".parse()?;
    assert_eq!(value, 42);
    Ok(())
}
```

## Esempio pratico

Testare casi limite di una funzione:

```rust
pub fn clamp_percentage(value: i32) -> u8 {
    value.clamp(0, 100) as u8
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn clamps_below_zero() {
        assert_eq!(clamp_percentage(-10), 0);
    }

    #[test]
    fn keeps_value_inside_range() {
        assert_eq!(clamp_percentage(42), 42);
    }

    #[test]
    fn clamps_above_hundred() {
        assert_eq!(clamp_percentage(120), 100);
    }
}
```

Questi test documentano il comportamento atteso meglio di un solo test generico.

## Varianti

- **Test di funzioni pure**: veloci e facili da mantenere.
- **Test di metodi**: verificano stato e transizioni.
- **Test di errori**: controllano `Result`, `Option` e messaggi.
- **Test con fixture locali**: dati minimi creati nel test.
- **Test parametrizzati manuali**: ciclo su casi di input/output.
- **Test `#[should_panic]`**: utile solo quando il panic e parte del contratto.

## Errori comuni

- Testare solo il caso felice.
- Scrivere test troppo legati all'implementazione.
- Usare nomi di test generici come `test_1`.
- Usare `unwrap()` senza contesto quando il fallimento diventa poco leggibile.
- Rendere i test dipendenti dall'ordine di esecuzione.
- Usare unit test per verificare integrazioni con filesystem, rete o database.
- Duplicare logica della funzione nel test.

## Checklist

- Il test ha un nome che descrive il comportamento?
- Copre almeno un caso limite?
- Fallisce con un messaggio comprensibile?
- Non dipende da stato globale?
- Non richiede rete, orario reale o filesystem se non necessario?
- Usa `Result` quando rende piu chiara la gestione errori?
- Esiste anche un integration test per l'API pubblica?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Integration test]]
- [[Programmazione/Rust/Pagine/Doc test]]
- [[Programmazione/Rust/Pagine/cargo-nextest]]
- [[Programmazione/Rust/Pagine/Result]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico]]
