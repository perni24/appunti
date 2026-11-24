---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - testing-qualita-e-sicurezza
aliases:
  - Benchmarking con Criterion
  - Criterion.rs
prerequisites:
  - "[[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]"
  - "[[Programmazione/Rust/Pagine/Build profiles|Build profiles]]"
related:
  - "[[Programmazione/Rust/Pagine/Unit test|Unit test]]"
  - "[[Programmazione/Rust/Pagine/cargo-nextest|cargo-nextest]]"
  - "[[Programmazione/Rust/Pagine/Clippy|Clippy]]"
title: Benchmarking con Criterion
---

# Benchmarking con Criterion

## Sintesi

È più veloce sommare una slice con un ciclo o con un iteratore? Un **microbenchmark** misura il costo di una chiamata su dati definiti. Criterion ripete l'operazione, raccoglie campioni e stima un intervallo per il tempo per chiamata. Non stabilisce se la funzione sia corretta, né quanto pesi sull'intera applicazione.

## Quando usarlo

Usa Criterion dopo aver individuato un percorso costoso con il [[Programmazione/Rust/Pagine/Performance e profiling|profiling]], oppure per sorvegliare un'operazione eseguita spesso. Prima di misurare, scrivi la domanda in termini concreti: qui interessa **la somma di valori già presenti in memoria**, non il tempo necessario per allocare e riempire un vettore. Se ti interessa il costo dell'intera richiesta, misura anche quello separatamente.

## Esempio pratico

### 1. Configurare il progetto

Da una directory di lavoro crea una libreria con Cargo. Per la prima compilazione serve l'accesso al registro, oppure una cache con le dipendenze.

```sh
cargo new --lib --vcs none sum_notes
```

Da qui in avanti lavora nella cartella `sum_notes`. Aggiungi a `Cargo.toml` queste sezioni (se `[dev-dependencies]` esiste già, aggiungi solo la dipendenza). L'esempio usa Criterion **0.8.2** su Rust stabile. Conserva `Cargo.lock` durante il confronto, così non cambiano le versioni risolte.

```toml
[dev-dependencies]
criterion = "=0.8.2"

[[bench]]
name = "sum"
harness = false
```

`name = "sum"` corrisponde a `benches/sum.rs`. Con `harness = false` Cargo non genera il proprio programma di test per quel target: il punto di ingresso è quello di Criterion.

### 2. Verificare che le due funzioni facciano lo stesso lavoro

Sostituisci `src/lib.rs` con questo blocco. L'accumulatore è un `u64` in entrambe le versioni: il test con due `u32::MAX` scoprirebbe una somma effettuata in `u32` e convertita soltanto alla fine.

```rust
pub fn manual_sum(values: &[u32]) -> u64 {
    let mut total = 0_u64;
    for &value in values {
        total += u64::from(value);
    }
    total
}

pub fn iterator_sum(values: &[u32]) -> u64 {
    values.iter().copied().map(u64::from).sum()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn both_match_expected_sums() {
        for (input, expected) in [
            (&[][..], 0),
            (&[2, 3, 5][..], 10),
            (&[u32::MAX, u32::MAX][..], 2 * u64::from(u32::MAX)),
        ] {
            assert_eq!(manual_sum(input), expected);
            assert_eq!(iterator_sum(input), expected);
        }
    }
}
```

```sh
cargo test --lib
```

### 3. Misurare per dimensione dell'input

Crea la directory `benches` e il file `benches/sum.rs`. Il gruppo produce quattro casi: due strategie, ciascuna con 64 e 4096 elementi. Ogni iterazione percorre la stessa slice; non include la sua costruzione, né simula il primo accesso a memoria fredda.

```rust
use criterion::{criterion_group, criterion_main, BenchmarkId, Criterion, Throughput};
use std::hint::black_box;
use sum_notes::{iterator_sum, manual_sum};

fn bench_sum(c: &mut Criterion) {
    let mut group = c.benchmark_group("sum");
    for size in [64_u32, 4096] {
        let data: Vec<u32> = (0..size).collect();
        group.throughput(Throughput::Elements(u64::from(size)));

        group.bench_with_input(BenchmarkId::new("manual", size), &data, |b, values| {
            b.iter(|| manual_sum(black_box(values.as_slice())))
        });
        group.bench_with_input(BenchmarkId::new("iterator", size), &data, |b, values| {
            b.iter(|| iterator_sum(black_box(values.as_slice())))
        });
    }
    group.finish();
}

criterion_group!(benches, bench_sum);
criterion_main!(benches);
```

`b.iter` ripete la closure e ne consuma il risultato; restituisci la somma, senza terminarla con un punto e virgola. `std::hint::black_box` sull'input limita le ottimizzazioni che dipenderebbero dal conoscere in anticipo i dati: è un suggerimento al compilatore, non disattiva le ottimizzazioni e non garantisce da solo una misura corretta.

Per una prova veloce dei quattro casi, **senza raccogliere misure**, usa:

```sh
cargo test --bench sum
```

Per misurare davvero, usa il target `sum` con il [[Programmazione/Rust/Pagine/Build profiles|profilo bench]] (ottimizzato per impostazione predefinita):

```sh
cargo bench --bench sum
```

## Leggere i risultati

Il riscaldamento precede la raccolta dei campioni. Distingui queste righe nel report testuale:

| Campo | Cosa indica | Come usarlo |
| --- | --- | --- |
| ID, per esempio `sum/manual/64` | Strategia e dimensione del caso. | Confronta manuale e iteratore **a parità di dimensione**. |
| `time` | Stima centrale del tempo per una somma, fra i due estremi dell'intervallo di confidenza. | Non leggere gli estremi come minimo e massimo delle singole chiamate. |
| `thrpt` | Elementi elaborati al secondo, calcolati dalla dimensione dichiarata. | Più è alto, maggiore è il throughput; non è un conteggio di byte o allocazioni. |
| `change` | Variazione rispetto ai dati precedenti **dello stesso ID**, se disponibili. | Non è il confronto statistico tra la riga `manual` e la riga `iterator`. Per il **tempo**, una variazione negativa indica una stima più bassa. |

### Confrontare due revisioni

Sulla versione di riferimento misura un solo caso e salva la baseline con un nome:

```sh
cargo bench --bench sum -- 'sum/manual/4096' --save-baseline prima
```

Dopo aver cambiato **solo l'implementazione** di `manual_sum`, ripeti il test di correttezza. Poi misura con lo stesso filtro, input, compilatore, profilo, macchina e directory dei risultati:

```sh
cargo bench --bench sum -- 'sum/manual/4096' --baseline prima
```

Il primo `--` separa le opzioni di Cargo da quelle di Criterion. `--save-baseline prima` crea o **sovrascrive** il riferimento; `--baseline prima` lo legge senza aggiornarlo. I dati si trovano normalmente sotto `target/criterion/`: cancellarli, cambiare ID o usare una directory di output diversa può rendere il riferimento indisponibile.

**Esempio di lettura, non una misura della tua macchina:** una variazione del tempo stimata a −0,4% con intervallo da −1,2% a +0,5% è compatibile anche con nessuna differenza. Non scegliere un'implementazione su quel dato. Anche una differenza ripetibile può essere troppo piccola per contare nel programma reale: decidi una soglia utile e verifica l'effetto sul percorso completo.

## Varianti e limiti

- **Input consumato o modificato:** per misurare un ordinamento serve un input non ordinato a ogni iterazione. Con `iter_batched` o `iter_batched_ref` puoi preparare l'input separatamente dal lavoro misurato; copiarlo dentro `b.iter` risponde a una domanda diversa.
- **Codice asincrono:** serve il supporto async di Criterion per l'executor scelto. Distingui il costo dell'operazione dal tempo di scheduling e da eventuali attese esterne.
- **Grafici e profiling:** i report grafici, quando abilitati, aiutano a leggere la distribuzione. Per capire *perché* un caso è più lento, usa un profiler; il solo tempo non identifica la causa.

## Errori comuni

- Scambiare un test verde o una compilazione con `--no-run` per una misura.
- Misurare una versione mentre l'altra prepara dati, stampa o controlla il risultato a ogni iterazione.
- Confrontare il portatile a batteria e sotto carica, esecuzioni con processi concorrenti, o input diversi. Ripeti il confronto in condizioni comparabili prima di attribuire la differenza al codice.
- Concludere che «gli iteratori sono più veloci dei cicli» da un unico caso: possono anche produrre codice macchina equivalente.

## Checklist

- Ho verificato i risultati prima di cronometrare?
- Il nome del caso indica il lavoro misurato e la dimensione dell'input?
- Ho conservato ID, baseline, toolchain e condizioni del confronto?
- La differenza supera il rumore ed è utile per l'applicazione?

## Fonti

- [Criterion.rs 0.8.2: API del benchmark](https://docs.rs/criterion/0.8.2/criterion/)
- [Criterion.rs: opzioni e baseline](https://criterion-rs.github.io/book/user_guide/command_line_options.html)
- [Criterion.rs: interpretare l'output](https://criterion-rs.github.io/book/user_guide/command_line_output.html)
- [The Cargo Book: cargo bench](https://doc.rust-lang.org/cargo/commands/cargo-bench.html)
- [Libreria standard: limiti di black_box](https://doc.rust-lang.org/std/hint/fn.black_box.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]
- [[Programmazione/Rust/Pagine/Build profiles|Build profiles]]
- [[Programmazione/Rust/Pagine/Unit test|Unit test]]
- [[Programmazione/Rust/Pagine/cargo-nextest|cargo-nextest]]
- [[Programmazione/Rust/Pagine/Clippy|Clippy]]
