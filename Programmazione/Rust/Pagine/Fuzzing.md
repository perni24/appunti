---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - testing-qualita-e-sicurezza
aliases:
  - Fuzzing
  - cargo-fuzz
prerequisites:
  - "[[Programmazione/Rust/Pagine/Property testing|Property testing]]"
  - "[[Programmazione/Rust/Pagine/Unit test|Unit test]]"
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]"
related:
  - "[[Programmazione/Rust/Pagine/Miri|Miri]]"
  - "[[Programmazione/Rust/Pagine/Undefined behavior|Undefined behavior]]"
  - "[[Programmazione/Rust/Pagine/cargo audit|cargo audit]]"
title: Fuzzing
---

# Fuzzing

## Sintesi

Un istogramma può contare tutti i pixel e tuttavia mettere il valore `64` nella fascia sbagliata. Per accorgersene servono due cose diverse: input che esercitino i confini e una regola che riconosca il risultato sbagliato. Nel **fuzzing guidato dalla copertura**, libFuzzer varia gli input e usa il comportamento osservato per scegliere quali conservare e modificare ancora. La regola di correttezza, detta **oracolo**, la scrivi tu.

## Quando usarlo

Il fuzzing è utile quando il codice ammette molte sequenze possibili, ma ogni singola esecuzione è veloce e ripetibile. Può affiancare i test di parser, decoder o algoritmi anche in safe Rust: un risultato errato non richiede un problema di memoria. Se invece sai già che `63` e `64` sono un confine importante, non aspettare che il fuzzer lo visiti: scrivi subito un test esplicito.

| Strumento | Da dove arrivano gli input | Cosa puoi concludere |
| --- | --- | --- |
| Test per esempi | Scegli tu input e risultato atteso. | Quel caso preciso continua a funzionare. |
| [[Programmazione/Rust/Pagine/Property testing\|Property testing]] con proptest | Una strategia descrive il dominio e come semplificare i casi. | La proprietà ha retto per i casi generati, oppure hai un controesempio. |
| Fuzzing con libFuzzer | Il motore modifica gli input e conserva nel *corpus* esempi utili al feedback di copertura. | Nei percorsi esercitati è stata o non è stata osservata una violazione. Non è una prova esaustiva. |

Una stessa proprietà può essere usata con entrambi gli strumenti. Cambia **come vengono scelti i prossimi input**, non il significato dell'asserzione.

## Esempio pratico

### 1. Definire il risultato atteso

Crea una libreria di prova e, per i passaggi successivi, lavora dalla directory `gray_notes`:

```sh
cargo new --lib --vcs none gray_notes
```

In `src/lib.rs` sostituisci il codice iniziale con questa funzione. Le quattro fasce di luminosità sono inclusive: **0–63, 64–127, 128–191, 192–255**. Un input vuoto dà quattro zeri; i pixel ripetuti contano ogni volta.

```rust
pub fn histogram(pixels: &[u8]) -> [usize; 4] {
    let mut bins = [0; 4];
    for &pixel in pixels {
        bins[usize::from(pixel) / 64] += 1;
    }
    bins
}
```

Crea `checks/oracle.rs`. Il modello conta i pixel che ricadono in ciascun intervallo del requisito: non usa la divisione dell'implementazione. Se entrambi utilizzassero la stessa formula errata, il confronto potrebbe passare.

```rust
pub fn check(pixels: &[u8]) {
    let ranges = [0_u8..=63, 64..=127, 128..=191, 192..=255];
    let expected = ranges.map(|range| {
        pixels.iter().filter(|&&pixel| range.contains(&pixel)).count()
    });
    assert_eq!(gray_notes::histogram(pixels), expected);
}
```

### 2. Provare l'oracolo su stable

Crea `tests/histogram.rs`. Il primo test usa risultati scritti a mano; il secondo confronta tutte le **256** intensità singole con il modello. Questo è esaustivo sui singoli byte, non sulle sequenze di più pixel.

```rust
#[path = "../checks/oracle.rs"]
mod oracle;

#[test]
fn counts_empty_and_repeated_pixels() {
    assert_eq!(gray_notes::histogram(&[]), [0; 4]);
    assert_eq!(gray_notes::histogram(&[63, 64, 64, 255]), [1, 2, 0, 1]);
}

#[test]
fn every_single_pixel_matches_the_model() {
    for pixel in u8::MIN..=u8::MAX {
        oracle::check(&[pixel]);
    }
}
```

```sh
cargo test --test histogram
```

**Controprova:** nel solo `src/lib.rs` cambia il divisore da `64` a `65`. Con il singolo pixel `[64]` la funzione restituisce `[1, 0, 0, 0]` invece di `[0, 1, 0, 0]`. Entrambi gli istogrammi hanno totale uno: controllare solo la somma non basterebbe. Ripristina `64` e riesegui i test prima di continuare.

### 3. Collegare lo stesso oracolo a libFuzzer

Questa parte richiede `cargo-fuzz`, una toolchain Rust **nightly** e il compilatore C++ con il supporto richiesto dalla piattaforma. Per Windows/MSVC la [guida di configurazione](https://rust-fuzz.github.io/book/cargo-fuzz/windows/setup.html) specifica anche il componente C++ AddressSanitizer e l'ambiente degli strumenti nativi. I test sopra non richiedono questi prerequisiti.

Con rustup, se manca nightly, installala senza cambiare la toolchain predefinita:

```sh
rustup toolchain install nightly --profile minimal
```

Per installare la versione della CLI usata nell'esempio:

```sh
cargo install cargo-fuzz --version 0.13.2 --locked
```

Dalla radice di `gray_notes`, inizializza **una sola volta** il progetto di fuzzing. Il nome esplicito evita di confondere il target con il nome della libreria:

```sh
cargo fuzz init --target histogram
```

Sostituisci `fuzz/fuzz_targets/histogram.rs` con il blocco seguente. I due `..` risalgono dal sorgente del target alla radice di `gray_notes`. L'oracolo è lo stesso eseguito dai test su stable; non deve diventare un'API pubblica della libreria.

```rust
#![no_main]

use libfuzzer_sys::fuzz_target;

#[path = "../../checks/oracle.rs"]
mod oracle;

fuzz_target!(|pixels: &[u8]| {
    oracle::check(pixels);
});
```

Prima controlla il nome registrato: l'elenco deve contenere `histogram`. Questo comando **non** esegue il target.

```sh
cargo fuzz list
```

Poi avvia una prova limitata: al massimo 1000 esecuzioni con input fino a 64 byte. Dopo `--` le opzioni sono di libFuzzer, non di Cargo.

```sh
cargo +nightly fuzz run histogram -- -runs=1000 -max_len=64
```

Un completamento senza errori significa che l'oracolo non ha segnalato differenze nei casi provati; non significa «1000 immagini distinte» o «copertura completa». Anche una campagna corta può esplorare combinazioni e ripetizioni assenti dai test sui valori singoli; non vi è garanzia che incontri un caso particolare.

## Leggere i risultati

- **Corpus:** in `fuzz/corpus/histogram/` il motore può conservare esempi utili alle mutazioni successive. Un nuovo elemento del corpus non indica di per sé un errore.
- **Copertura:** nell'output di libFuzzer, `cov` e `ft` descrivono segnali osservati nel codice strumentato, non percentuali dei requisiti verificati. Un aumento non convalida il risultato dell'istogramma.
- **Violazione:** se l'implementazione e l'oracolo danno risultati diversi, controlla quale dei due contraddice il requisito. Dopo la correzione, conserva un test leggibile con input e risultato atteso. Non affidare un confine noto alla casualità di una futura esecuzione.

## Varianti e limiti

- Qui **ogni byte è un pixel valido**. In un parser, invece, restituire un `Err` per dati non validi può essere corretto. Se il dominio ha una struttura, esempi iniziali validi o un generatore strutturato aiutano a esercitare anche la logica successiva alla validazione.
- Mantieni il target deterministico: niente rete, attese, orologio o dati lasciati da un'esecuzione precedente. Limita lunghezza degli input e costo dell'oracolo. Una prova breve in CI e una più lunga in locale hanno budget diversi, non garanzie diverse.
- Un oracolo funzionale non verifica da solo la sicurezza della memoria. Per codice unsafe o FFI, i controlli dinamici disponibili per la piattaforma e [[Programmazione/Rust/Pagine/Miri|Miri]], dove applicabile, rispondono a domande diverse.

## Checklist

- L'oracolo controlla il requisito, oppure verifica solo che la funzione termini?
- Un errore di classificazione con totale invariato farebbe fallire il test?
- I confini noti hanno anche un test deterministico?
- Sto distinguendo la prova su stable, l'elenco dei target e l'esecuzione strumentata con nightly?

## Fonti

- [Rust Fuzz Book: prerequisiti della toolchain](https://rust-fuzz.github.io/book/cargo-fuzz/setup.html)
- [cargo-fuzz 0.13.2: comandi e struttura del progetto](https://docs.rs/crate/cargo-fuzz/0.13.2)
- [libfuzzer-sys: macro fuzz_target!](https://docs.rs/libfuzzer-sys/0.4.13/libfuzzer_sys/macro.fuzz_target.html)
- [LLVM: corpus, opzioni e output di libFuzzer](https://llvm.org/docs/LibFuzzer.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Property testing|Property testing]]
- [[Programmazione/Rust/Pagine/Miri|Miri]]
- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Undefined behavior|Undefined behavior]]
- [[Programmazione/Rust/Pagine/cargo audit|cargo audit]]
