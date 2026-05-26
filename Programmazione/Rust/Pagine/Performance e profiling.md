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
  - rust-di-sistema
aliases:
  - "Performance e profiling"
  - "Profiling Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Build profiles]]"
  - "[[Programmazione/Rust/Pagine/Iterator API]]"
  - "[[Programmazione/Rust/Pagine/Zero-cost abstractions]]"
related:
  - "[[Programmazione/Rust/Pagine/Benchmarking con Criterion]]"
  - "[[Programmazione/Rust/Pagine/Rayon e parallel iterators]]"
  - "[[Programmazione/Rust/Pagine/Tracing con tracing]]"
  - "[[Programmazione/Rust/Pagine/Allocator]]"
---

# Performance e profiling

## Sintesi

In Rust la performance deriva da controllo esplicito su memoria, assenza di garbage collector, ottimizzazioni aggressive del compilatore e astrazioni spesso risolte a compile time. Il **profiling** serve a misurare dove il programma spende tempo, memoria o I/O prima di ottimizzare.

La regola pratica e: prima misura, poi cambia il codice. Rust rende possibile scrivere codice molto veloce, ma non impedisce automaticamente allocazioni inutili, lock contesi, parsing inefficiente o I/O mal progettato.

## Quando usarlo

Approfondisci performance e profiling quando:

- il programma e lento in produzione o su input reali;
- devi ridurre latenza, memoria o dimensione del binario;
- stai scegliendo tra allocazione, borrowing e streaming;
- vuoi confrontare implementazioni alternative;
- devi capire il costo di async, lock, iteratori, trait object o serializzazione;
- stai ottimizzando codice di sistema, CLI, backend o embedded.

Non ottimizzare sulla base di sensazioni: il compilatore puo rendere irrilevanti alcune differenze e amplificarne altre.

## Come funziona

La performance Rust va osservata su piu livelli:

- **build profile**: debug e release hanno caratteristiche molto diverse;
- **CPU time**: funzioni calde, branch, cache miss;
- **allocazioni**: numero, dimensione e durata;
- **I/O**: syscalls, buffering, rete, disco;
- **concorrenza**: lock contention, scheduling, wakeup;
- **code size**: monomorphization, inlining e LTO;
- **panic e error path**: gestione errori e unwinding/abort.

Profiling e benchmarking sono diversi:

- il **benchmark** confronta prestazioni in scenari controllati;
- il **profiling** mostra dove il programma reale consuma risorse.

Entrambi sono utili: il benchmark protegge da regressioni, il profiler evita ottimizzazioni nel punto sbagliato.

## API / Sintassi

Comandi e impostazioni comuni:

```powershell
cargo build --release
cargo test --release
cargo bench
```

Profilo release in `Cargo.toml`:

```toml
[profile.release]
lto = "thin"
codegen-units = 1
debug = true
```

`debug = true` nel profilo release conserva informazioni utili per profiler e simboli senza trasformare la build in debug.

Per microbenchmark, una scelta comune e Criterion:

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

`black_box` aiuta a evitare che l'ottimizzatore elimini lavoro utile al benchmark.

## Esempio pratico

Prima versione:

```rust
fn join_words(words: &[String]) -> String {
    let mut out = String::new();

    for word in words {
        out.push_str(word);
        out.push(' ');
    }

    out
}
```

Possibile miglioramento se conosci approssimativamente la dimensione finale:

```rust
fn join_words(words: &[String]) -> String {
    let capacity = words.iter().map(|word| word.len() + 1).sum();
    let mut out = String::with_capacity(capacity);

    for word in words {
        out.push_str(word);
        out.push(' ');
    }

    out
}
```

L'idea non e che `with_capacity` vada usato sempre, ma che ridurre riallocazioni puo contare nei percorsi caldi.

## Varianti

- **Microbenchmark**: misura funzioni isolate.
- **Macrobenchmark**: misura scenari completi e input realistici.
- **CPU profiling**: individua funzioni piu costose.
- **Heap profiling**: misura allocazioni e memoria residente.
- **Tracing**: osserva latenza e flussi applicativi.
- **Static analysis**: ispeziona dimensione binario, monomorfizzazioni e dipendenze.
- **Load test**: misura comportamento sotto concorrenza o traffico.

## Errori comuni

- Misurare solo build debug.
- Ottimizzare codice non caldo.
- Confondere benchmark sintetico e comportamento reale.
- Dimenticare che I/O e allocazioni possono dominare sul costo CPU.
- Usare `clone()` per risolvere problemi di ownership senza verificare il costo.
- Aggiungere parallelismo senza misurare overhead e contention.
- Cambiare profili release senza documentare l'effetto su debug, simboli e dimensione.

## Checklist

- Stai misurando una build release?
- L'input del benchmark rappresenta casi reali?
- Hai identificato il percorso caldo?
- Hai contato allocazioni e copie?
- Hai verificato I/O e buffering?
- L'ottimizzazione peggiora leggibilita o API pubblica?
- Hai aggiunto benchmark o test per evitare regressioni?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Build profiles]]
- [[Programmazione/Rust/Pagine/Benchmarking con Criterion]]
- [[Programmazione/Rust/Pagine/Zero-cost abstractions]]
- [[Programmazione/Rust/Pagine/Iterator API]]
- [[Programmazione/Rust/Pagine/Rayon e parallel iterators]]
- [[Programmazione/Rust/Pagine/Tracing con tracing]]
- [[Programmazione/Rust/Pagine/Allocator]]
