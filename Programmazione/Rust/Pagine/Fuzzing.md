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
  - "Fuzzing"
  - "cargo-fuzz"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Property testing]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
related:
  - "[[Programmazione/Rust/Pagine/Miri]]"
  - "[[Programmazione/Rust/Pagine/Undefined behavior]]"
  - "[[Programmazione/Rust/Pagine/cargo audit]]"
---

# Fuzzing

## Sintesi

Il **fuzzing** esegue il codice con molti input generati automaticamente per scoprire panic, crash, violazioni di asserzioni, bug di parsing e vulnerabilita. In Rust lo strumento piu comune per progetti Cargo e `cargo-fuzz`, basato su libFuzzer.

E particolarmente utile per parser, decoder, formati binari, unsafe code, FFI, algoritmi complessi e qualunque funzione esposta a input non fidato.

## Quando usarlo

Usa fuzzing quando:

- il codice accetta input esterno non fidato;
- hai parser o deserializzatori custom;
- usi `unsafe`;
- integri codice C/C++;
- vuoi cercare panic non coperti da test normali;
- vuoi hardenare una libreria pubblica.

Il fuzzing non dimostra assenza di bug: aumenta la probabilita di trovare casi che test manuali non avrebbero immaginato.

## Come funziona

Un fuzzer genera input, li passa a un fuzz target e osserva il comportamento del programma. Se trova crash o panic, salva l'input che li riproduce. I fuzz target dovrebbero essere piccoli e concentrati su una API.

Flusso tipico:

1. inizializzi la struttura `fuzz/`;
2. crei un fuzz target;
3. esegui il fuzzer;
4. analizzi crash e corpus;
5. riduci e trasformi crash in regression test;
6. mantieni fuzzing in locale o CI dedicata.

## API / Sintassi

Comandi tipici:

```powershell
cargo install cargo-fuzz
cargo fuzz init
cargo +nightly fuzz run parse_input
```

Fuzz target schematico:

```rust
#![no_main]

use libfuzzer_sys::fuzz_target;

fuzz_target!(|data: &[u8]| {
    let _ = my_crate::parse_bytes(data);
});
```

Il target non deve verificare solo che il codice compili: deve chiamare una funzione significativa con input fuzzer-controlled.

## Esempio pratico

Fuzzing di un parser UTF-8:

```rust
#![no_main]

use libfuzzer_sys::fuzz_target;

fuzz_target!(|data: &[u8]| {
    if let Ok(text) = std::str::from_utf8(data) {
        let _ = my_crate::parse_command(text);
    }
});
```

Se il parser va in panic su un input valido UTF-8, il fuzzer salva un caso riproducibile. Quel caso dovrebbe diventare un test unitario o di integrazione.

## Varianti

- **Coverage-guided fuzzing**: genera input in base alla copertura raggiunta.
- **Structure-aware fuzzing**: genera input piu vicini al formato atteso.
- **Fuzzing parser**: uno degli usi piu comuni.
- **Fuzzing unsafe/FFI**: utile con sanitizers e Miri dove applicabile.
- **Regression fuzz tests**: crash salvati trasformati in test normali.
- **CI fuzzing**: job separati, spesso non a ogni commit.

## Errori comuni

- Fuzz target troppo grande e lento.
- Ignorare crash invece di convertirli in test.
- Generare solo input invalidi che non entrano nel parser.
- Fare I/O, rete o sleep dentro fuzz target.
- Confondere fuzzing e property testing.
- Non fissare limiti per input che causano allocazioni enormi.
- Pensare che safe Rust renda inutile il fuzzing.

## Checklist

- Il target esercita una API critica?
- L'input controlla davvero il comportamento?
- Crash e panic sono salvati come regression test?
- Il target e veloce e deterministico?
- Le allocazioni sono limitate?
- Il fuzzing gira con toolchain appropriata?
- Fuzzing, Miri e test normali si completano a vicenda?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Property testing]]
- [[Programmazione/Rust/Pagine/Miri]]
- [[Programmazione/Rust/Pagine/Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Undefined behavior]]
- [[Programmazione/Rust/Pagine/cargo audit]]
