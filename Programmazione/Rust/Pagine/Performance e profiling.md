---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - rust-di-sistema
aliases:
  - Performance e profiling
  - Profiling Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Build profiles|Build profiles]]"
  - "[[Programmazione/Rust/Pagine/Iterator API|Iterator API]]"
  - "[[Programmazione/Rust/Pagine/Zero-cost abstractions|Zero-cost abstractions]]"
related:
  - "[[Programmazione/Rust/Pagine/Benchmarking con Criterion|Benchmarking con Criterion]]"
  - "[[Programmazione/Rust/Pagine/Rayon e parallel iterators|Rayon e parallel iterators]]"
  - "[[Programmazione/Rust/Pagine/Tracing con tracing|Tracing con tracing]]"
  - "[[Programmazione/Rust/Pagine/Allocator|Allocator]]"
title: Performance e profiling
---

# Performance e profiling

## Sintesi

Un **benchmark** risponde a «quanto costa questa operazione, con questo input?». Un **profilo** risponde a «dove viene spesa la risorsa che mi interessa?». Se una richiesta dura 200 ms, il cronometro misura anche il tempo in attesa; i campioni di un profiler CPU descrivono invece dove il programma era in esecuzione. Le due misure possono essere corrette e raccontare cose diverse.

## Scegliere cosa misurare

| Domanda | Prima misura utile | Limite da ricordare |
| --- | --- | --- |
| L'utente aspetta troppo? | Latenza da richiesta a risposta, anche p95 o p99, a carico fissato. | La media può nascondere la coda. Il p95 richiede osservazioni di richieste individuali, non medie di lotti. |
| Quanti dati elabora il servizio? | Throughput in richieste/s o byte/s, annotando concorrenza ed errori. | Più throughput non implica minore latenza; una coda può allungarsi. |
| La CPU è il limite? | Utilizzo CPU e profilo a campionamento con stack sul carico reale. | Un thread in attesa di disco, rete o lock non accumula CPU come uno che sta calcolando. |
| La memoria cresce? | Profilo heap: numero di allocazioni, byte allocati nel tempo e byte ancora vivi. | La memoria residente del processo comprende anche stack e pagine mappate; non equivale ai byte vivi sull'heap. |

Per la dimensione del binario confronta gli artefatti per lo stesso target e con la stessa gestione dei simboli. Per il costo di una richiesta async osserva anche attese, code e contesa tramite [[Programmazione/Rust/Pagine/Tracing con tracing|tracing]]; non dedurre cache miss o troppi risvegli da un semplice tempo totale.

## Rendere confrontabili due misure

1. Definisci operazione, unità e confini: il tempo include generazione dell'input, allocazione, distruzione del risultato, I/O o avvio del processo? Sceglili in funzione della domanda.
2. Conserva una **baseline**: versione del codice e del compilatore, target, profilo Cargo, feature, dimensione e distribuzione degli input, macchina e numero di thread. Cambia una sola cosa per confronto.
3. Separa avvio a freddo e regime caldo. Ripeti le prove, alterna l'ordine A/B e B/A. Confronta centro e dispersione, non soltanto il tempo migliore. Quando una differenza si confonde con il rumore, la conclusione utile è «non distinguibile con questa prova».
4. Controlla l'output prima di cronometrare. Poi verifica l'effetto sul programma completo: dimezzare una funzione che assorbe il 10% del tempo iniziale riduce il tempo totale di circa il 5%, se il resto non cambia.

Per indagare una build ottimizzata conviene partire dal profilo di produzione e **aggiungere simboli**, non cambiare contemporaneamente LTO, `codegen-units`, controlli e strategia di panic. Le informazioni di debug non trasformano una build ottimizzata in una build `dev`; conserva eseguibile e simboli della stessa build.

## Laboratorio: riservare memoria conviene?

Vogliamo concatenare parole UTF-8 con **uno spazio dopo ciascuna**, anche dopo l'ultima e dopo una parola vuota. Una strategia lascia crescere la `String`; l'altra conta prima i **byte** necessari e riserva spazio. La seconda evita la crescita durante gli inserimenti, ma aggiunge un passaggio sui dati. Quale sia più veloce non fa parte del contratto di `String`.

### Preparazione

Servono Rust/Cargo 1.85 o successivi e il linker dell'host; nessuna crate esterna. Crea un progetto di prova fuori dal vault:

```sh
cargo new --bin --vcs none profilo-demo
```

```sh
cd profilo-demo
```

Aggiungi questo profilo in `Cargo.toml`:

```toml
[profile.profiling]
inherits = "release"
debug = true
```

Crea `src/lib.rs`. Le due funzioni differiscono solo nella preparazione del buffer. Il test fissa il comportamento atteso indipendentemente dalla velocità:

```rust
fn append_words(out: &mut String, words: &[&str]) {
    for &word in words {
        out.push_str(word);
        out.push(' ');
    }
}

pub fn grow(words: &[&str]) -> String {
    let mut out = String::new();
    append_words(&mut out, words);
    out
}

pub fn reserve(words: &[&str]) -> String {
    let bytes = words.iter().map(|word| word.len() + 1).sum();
    let mut out = String::with_capacity(bytes);
    append_words(&mut out, words);
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn stessa_uscita_in_byte() {
        for (words, expected) in [
            (&[][..], ""),
            (&[""][..], " "),
            (&["caffè", "", "blu"][..], "caffè  blu "),
        ] {
            assert_eq!(grow(words), expected);
            assert_eq!(reserve(words), expected);
        }
    }
}
```

Sostituisci `src/main.rs`. La CLI scalda la funzione scelta, poi cronometra cinque lotti identici. Preparazione dell'input e stampa sono fuori dal tratto misurato; costruzione **e distruzione** di ogni stringa risultante sono dentro. `black_box` rende più difficile eliminare il lavoro inutilizzato: è un aiuto al benchmark, non una garanzia sul codice macchina.

```rust
use profilo_demo::{grow, reserve};
use std::{env, hint::black_box, num::NonZeroU32, time::Instant};

fn main() {
    let mut args = env::args().skip(1);
    let mode = args.next().expect("indicare grow oppure reserve");
    let join: fn(&[&str]) -> String = match mode.as_str() {
        "grow" => grow,
        "reserve" => reserve,
        _ => panic!("modalità ammessa: grow oppure reserve"),
    };
    let rounds: NonZeroU32 = args.next().unwrap_or_else(|| "500".into())
        .parse().expect("il numero di iterazioni deve essere positivo");
    let words = ["uno", "caffè", "", "blu"].repeat(512);
    let once = || drop(black_box(join(black_box(&words))));
    for _ in 0..20 { once(); }

    for sample in 1..=5 {
        let start = Instant::now();
        for _ in 0..rounds.get() { once(); }
        let elapsed = start.elapsed();
        let ns = elapsed.as_nanos() / u128::from(rounds.get());
        println!("{mode} lotto={sample} ns_per_join={ns}");
    }
}
```

### Misura e interpretazione

Prima controlla che le due versioni siano equivalenti sui casi della nota:

```sh
cargo test --release
```

```sh
cargo run --profile profiling -- grow 500
```

```sh
cargo run --profile profiling -- reserve 500
```

Ogni riga contiene la **media dei nanosecondi per concatenazione in un lotto**, non la latenza di una singola parola o un percentile. Entrambe le modalità lavorano su 2048 parole e producono 8192 byte per chiamata. Ripeti invertendo l'ordine; prova poi, separatamente, poche parole lunghe o molte parole vuote. Non trasferire i risultati di questo input caldo a un servizio sotto carico.

`with_capacity(n)` garantisce spazio per **almeno** `n` byte: se aggiungi esattamente quei byte non serve crescere. Non garantisce che la capacità sia esattamente `n`, un certo numero di chiamate al sistema o un tempo minore. Per controllare la crescita, osserva `capacity()` dopo gli inserimenti in una prova separata: una transizione di capacità non dimostra che il puntatore sia cambiato. Per confronti statistici ripetuti usa [[Programmazione/Rust/Pagine/Benchmarking con Criterion|Criterion]]; `cargo bench` esegue i benchmark configurati, `cargo test --release` verifica la correttezza.

## Dal cronometro al profiler

Usa un profiler quando vuoi sapere **quale parte** del programma merita un esperimento. Costruisci una volta, poi profila l'eseguibile, non `cargo run`: altrimenti puoi campionare Cargo o la compilazione. Aumenta le iterazioni se il processo termina prima che si raccolgano stack utili.

```sh
cargo build --profile profiling
```

**Linux**, con `perf` disponibile e permesso di profilare il proprio processo: dalla directory del progetto registra la CLI. Il comando crea `perf.data` nella directory corrente; usa una cartella di prova se devi conservare una registrazione precedente.

```sh
perf record --call-graph dwarf -- ./target/profiling/profilo-demo grow 20000
```

```sh
perf report --stdio
```

**Windows**, con Visual Studio e gli strumenti di profilazione: apri *Performance Profiler*, scegli come destinazione l'eseguibile `target\profiling\profilo-demo.exe`, passa `grow 20000`, seleziona *CPU Usage* e raccogli gli stack. Con MSVC conserva anche il PDB corrispondente.

Nel call tree distingui il costo **inclusivo** (funzione più discendenti) dal costo **proprio** (campioni attribuiti direttamente alla funzione). Un genitore in cima alla classifica può semplicemente chiamare una funzione costosa: non sommare le percentuali inclusive di genitore e figlio. Con l'inlining una funzione Rust può non apparire come frame separato. Se emerge l'allocatore, ripeti con `reserve` mantenendo lo stesso input; verifica poi i tempi **senza profiler**, perché la raccolta ha un costo. Se la CPU resta poco occupata rispetto al tempo trascorso, passa a una traccia di attese o I/O prima di riscrivere il ciclo.

## Errori comuni

- Scambiare la ricompilazione, il logging per iterazione o la creazione dei dati per costo della funzione misurata.
- Interpretare `clone()`, iteratori o trait object come colli di bottiglia senza un percorso caldo osservato. Il risultato dipende da tipi, input e ottimizzazioni.
- Aggiungere thread perché il microbenchmark è lento senza misurare accodamento, lavoro per thread e contesa.
- Pubblicare un solo numero senza unità, input e configurazione, oppure usare una soglia di tempo assoluta come test di correttezza in CI condivisa.

## Fonti ufficiali

- [Cargo: profili, informazioni di debug e profili personalizzati](https://doc.rust-lang.org/cargo/reference/profiles.html)
- [Rust: limiti di black_box](https://doc.rust-lang.org/std/hint/fn.black_box.html)
- [Rust: String::with_capacity](https://doc.rust-lang.org/std/string/struct.String.html#method.with_capacity)
- [Rust Performance Book: profiling](https://nnethercote.github.io/perf-book/profiling.html)
- [Microsoft: interpretare un profilo CPU in Visual Studio](https://learn.microsoft.com/en-us/visualstudio/profiling/cpu-usage)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Build profiles|Build profiles]]
- [[Programmazione/Rust/Pagine/Benchmarking con Criterion|Benchmarking con Criterion]]
- [[Programmazione/Rust/Pagine/Zero-cost abstractions|Zero-cost abstractions]]
- [[Programmazione/Rust/Pagine/Iterator API|Iterator API]]
- [[Programmazione/Rust/Pagine/Rayon e parallel iterators|Rayon e parallel iterators]]
- [[Programmazione/Rust/Pagine/Tracing con tracing|Tracing con tracing]]
- [[Programmazione/Rust/Pagine/Allocator|Allocator]]
