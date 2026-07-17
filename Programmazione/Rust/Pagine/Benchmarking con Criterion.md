---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - testing-qualita-e-sicurezza
aliases:
  - "Benchmarking con Criterion"
  - "Criterion.rs"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Performance e profiling]]"
  - "[[Programmazione/Rust/Pagine/Build profiles]]"
related:
  - "[[Programmazione/Rust/Pagine/Unit test]]"
  - "[[Programmazione/Rust/Pagine/cargo-nextest]]"
  - "[[Programmazione/Rust/Pagine/Clippy]]"
---

# Benchmarking con Criterion

## Sintesi

Criterion.rs e una libreria per microbenchmark statistici in Rust. Misura funzioni o porzioni di codice piu volte, applica analisi statistica e aiuta a confrontare prestazioni tra versioni.

Un benchmark non sostituisce il profiling: il benchmark misura uno scenario controllato, mentre il profiler mostra dove il programma reale consuma tempo.

## Quando usarlo

Usa Criterion quando:

- vuoi confrontare due implementazioni;
- devi evitare regressioni prestazionali;
- vuoi misurare una funzione pura o quasi pura;
- vuoi microbenchmark piu robusti del tempo misurato manualmente;
- vuoi osservare varianza e rumore;
- stai ottimizzando un percorso caldo gia identificato.

Non usarlo per dimostrare che tutto il programma e veloce: per quello servono benchmark end-to-end e profiling.

## Come funziona

Criterion esegue benchmark in piu fasi:

- warm-up;
- raccolta campioni;
- analisi statistica;
- confronto con baseline precedenti;
- report testuale e, quando configurato, grafici.

I benchmark stanno spesso nella cartella `benches/`. Per evitare ottimizzazioni eccessive del compilatore si usa `black_box`, che rende piu difficile eliminare lavoro dal benchmark.

## API / Sintassi

Esempio in `benches/sum.rs`:

```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn bench_sum(c: &mut Criterion) {
    c.bench_function("sum", |b| {
        b.iter(|| {
            let values = black_box([1_u64, 2, 3, 4]);
            values.iter().sum::<u64>()
        })
    });
}

criterion_group!(benches, bench_sum);
criterion_main!(benches);
```

Esecuzione:

```powershell
cargo bench
```

## Esempio pratico

Confrontare due strategie:

```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn manual_sum(values: &[u64]) -> u64 {
    let mut total = 0;
    for value in values {
        total += value;
    }
    total
}

fn iterator_sum(values: &[u64]) -> u64 {
    values.iter().copied().sum()
}

fn bench_strategies(c: &mut Criterion) {
    let values: Vec<u64> = (0..10_000).collect();

    c.bench_function("manual_sum", |b| {
        b.iter(|| manual_sum(black_box(&values)))
    });

    c.bench_function("iterator_sum", |b| {
        b.iter(|| iterator_sum(black_box(&values)))
    });
}

criterion_group!(benches, bench_strategies);
criterion_main!(benches);
```

Il benchmark misura una differenza specifica, non tutto il comportamento dell'applicazione.

## Varianti

- **Microbenchmark**: funzione isolata.
- **Benchmark con input**: confronta dimensioni diverse.
- **Benchmark group**: raggruppa misure correlate.
- **Baseline**: confronta contro esecuzioni precedenti.
- **Async benchmark**: misura future con executor configurato.
- **Profiling esterno**: usa profiler quando serve capire il perche.

## Errori comuni

- Benchmarkare build debug.
- Misurare codice che il compilatore elimina.
- Usare input troppo piccoli o non realistici.
- Trarre conclusioni da differenze dentro il rumore.
- Confondere throughput, latenza e allocazioni.
- Ottimizzare un punto non caldo del programma reale.
- Rendere il benchmark dipendente da rete, disco o tempo esterno.

## Checklist

- Il benchmark misura una domanda precisa?
- Gli input rappresentano casi reali?
- `black_box` evita eliminazioni indesiderate?
- La varianza e accettabile?
- Il risultato e coerente con il profiling?
- Esiste una baseline da confrontare?
- L'ottimizzazione peggiora API o leggibilita?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Performance e profiling]]
- [[Programmazione/Rust/Pagine/Build profiles]]
- [[Programmazione/Rust/Pagine/Unit test]]
- [[Programmazione/Rust/Pagine/cargo-nextest]]
- [[Programmazione/Rust/Pagine/Clippy]]
