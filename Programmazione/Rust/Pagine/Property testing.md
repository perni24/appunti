---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags:
  - programmazione
  - rust
  - testing-qualita-e-sicurezza
aliases:
  - "Property testing"
  - "Property-based testing"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Unit test]]"
  - "[[Programmazione/Rust/Pagine/Invariants]]"
related:
  - "[[Programmazione/Rust/Pagine/Fuzzing]]"
  - "[[Programmazione/Rust/Pagine/Snapshot testing]]"
  - "[[Programmazione/Rust/Pagine/Option]]"
---

# Property testing

## Sintesi

Il **property testing** verifica proprieta generali del codice su molti input generati automaticamente. Invece di scrivere solo esempi specifici, definisci una regola che deve valere per una classe ampia di valori.

In Rust si usa spesso con crate come `proptest` o `quickcheck`. E particolarmente utile per parser, serializzazione, algoritmi, strutture dati e funzioni con invarianti precise.

## Quando usarlo

Usa property testing quando:

- puoi formulare una proprieta generale;
- ci sono molti casi limite difficili da elencare;
- vuoi generare input casuali ma riproducibili;
- lavori su parser o formati dati;
- vuoi verificare roundtrip, ordinamento o idempotenza;
- un bug dipende da combinazioni di input non ovvie.

Non usarlo se non sai quale proprieta verificare: input casuali senza oracle producono test deboli.

## Come funziona

Un test property-based contiene:

- generatori di input;
- una proprieta da verificare;
- molti casi generati automaticamente;
- shrinking del caso fallito verso un input piu piccolo.

Esempi di proprieta:

- serializzare e deserializzare restituisce lo stesso valore;
- ordinare una lista produce una lista ordinata;
- applicare due volte una normalizzazione non cambia il risultato;
- una funzione non va mai in panic su input valido;
- un parser rifiuta input invalidi senza corrompere stato.

## API / Sintassi

Esempio con `proptest`:

```rust
use proptest::prelude::*;

fn reverse_twice(mut values: Vec<u8>) -> Vec<u8> {
    values.reverse();
    values.reverse();
    values
}

proptest! {
    #[test]
    fn reversing_twice_returns_original(values in proptest::collection::vec(any::<u8>(), 0..100)) {
        let original = values.clone();
        prop_assert_eq!(reverse_twice(values), original);
    }
}
```

Le strategie definiscono quali valori generare e con quali limiti.

## Esempio pratico

Verifica di idempotenza:

```rust
use proptest::prelude::*;

fn normalize(input: &str) -> String {
    input.trim().to_lowercase()
}

proptest! {
    #[test]
    fn normalize_is_idempotent(input in ".*") {
        let once = normalize(&input);
        let twice = normalize(&once);

        prop_assert_eq!(once, twice);
    }
}
```

Se la proprieta fallisce, il framework prova a ridurre l'input a un caso minimo piu facile da capire.

## Varianti

- **Roundtrip property**: `decode(encode(x)) == x`.
- **Idempotenza**: `f(f(x)) == f(x)`.
- **Invarianti strutturali**: una struttura resta valida dopo operazioni.
- **Metamorphic testing**: trasformazioni correlate mantengono relazioni note.
- **Differential testing**: confronta due implementazioni.
- **Generatori custom**: producono dati validi per il dominio.

## Errori comuni

- Scrivere proprieta tautologiche.
- Generare input troppo generici e poco validi.
- Ignorare shrinking e casi minimi.
- Testare solo che il codice non vada in panic.
- Riprodurre nel test la stessa logica del codice testato.
- Non fissare limiti su dimensione o complessita degli input.
- Rendere il test lento e instabile.

## Checklist

- La proprieta e davvero significativa?
- I generatori producono dati validi e casi limite?
- Gli input hanno limiti ragionevoli?
- I fallimenti sono riproducibili?
- Lo shrinking produce casi leggibili?
- La proprieta non duplica l'implementazione?
- I test example-based coprono casi espliciti importanti?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Unit test]]
- [[Programmazione/Rust/Pagine/Invariants]]
- [[Programmazione/Rust/Pagine/Fuzzing]]
- [[Programmazione/Rust/Pagine/Snapshot testing]]
- [[Programmazione/Rust/Pagine/Option]]
