---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - concorrenza-e-asincronia
aliases:
  - Rayon
  - Parallel iterators
prerequisites:
  - "[[Programmazione/Rust/Pagine/Iteratori]]"
  - "[[Programmazione/Rust/Pagine/Send e Sync Traits]]"
  - "[[Programmazione/Rust/Pagine/Threads]]"
related:
  - "[[Programmazione/Rust/Pagine/Iterator API]]"
  - "[[Programmazione/Rust/Pagine/Performance e profiling]]"
  - "[[Programmazione/Rust/Pagine/Zero-cost abstractions]]"
title: Rayon e parallel iterators
---

# Rayon e parallel iterators

## Sintesi

Rayon distribuisce **lavoro CPU-bound** su un pool di thread. I parallel iterator somigliano agli iteratori standard, ma usano trait diversi: la pipeline deve poter essere divisa in lavori indipendenti.

Non crea un thread per elemento e non e un runtime async. La correttezza del codice non implica un miglioramento delle prestazioni: costo per elemento, memoria e dimensione del lavoro contano piu del solo numero di elementi.

## Quando usarlo

- Trasformazioni, analisi, ordinamenti e aggregazioni CPU-bound su dati divisibili.
- Lavori che possono usare prestiti, produrre risultati indipendenti o modificare porzioni disgiunte.
- Calcoli per cui puoi confrontare una versione sequenziale con quella parallela.

Per richieste di rete e attese lunghe valuta un runtime async o un sistema dedicato all'I/O. Una piccola trasformazione di poche stringhe serve a capire l'API, non a dimostrare uno speedup.

## Come funziona

### Cargo.toml

Gli esempi sono programmi indipendenti per `src/main.rs`, con **Rayon 1.12.0** e **Rust 1.99.1, edition 2024**. Il manifest minimo e:

```toml
[package]
name = "rayon-notes"
version = "0.1.0"
edition = "2024"

[dependencies]
rayon = "=1.12.0"
```

La versione esatta rende esplicita la baseline; `rayon = "1"` accetta invece aggiornamenti compatibili della serie 1.x. Il solo vincolo diretto non fissa le dipendenze transitive: per l'applicazione conserva anche `Cargo.lock`. Vedi [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]].

### Pool, lavoro e completamento

Rayon suddivide il calcolo in job; i worker possono prendere lavoro dalle code degli altri worker (**work stealing**). Non assumere un worker fisso per elemento o un numero fisso di job. Anche con un solo worker il programma deve poter terminare.

`map` e `filter` costruiscono una pipeline lazy; un consumatore come `collect`, `sum` o `for_each` avvia il lavoro e attende il relativo completamento. Le closure non richiedono automaticamente `'static`: possono prendere in prestito dati che restano vivi per l'operazione. [Introduzione](https://docs.rs/rayon/1.12.0/rayon/), [FAQ](https://github.com/rayon-rs/rayon/blob/v1.12.0/FAQ.md).

### Prima pipeline completa

```rust
use rayon::prelude::*;

fn main() {
    let sum: i64 = (0_i64..1_000_000)
        .into_par_iter()
        .map(|n| n * 2)
        .sum();

    assert_eq!(sum, 999_999_000_000);
}
```

Il tipo numerico e esplicito: la somma non entra in `i32`. Rayon non risolve overflow o errori numerici. L'import del prelude porta in scope i trait che espongono i metodi paralleli.

## API / Sintassi

### Prestito condiviso, mutabile e ownership

Per slice e `Vec<T>`:

| Metodo | Elemento prodotto | Requisito rilevante |
| --- | --- | --- |
| `par_iter()` | `&T` | `T: Sync` |
| `par_iter_mut()` | `&mut T` disgiunti | `T: Send` |
| `into_par_iter()` sul `Vec` posseduto | `T` | `T: Send`; consuma il vettore |

Questi bound riguardano gli elementi: anche le catture della closure devono rispettare la firma del metodo. `map` e `for_each` richiedono una closure `Fn + Send + Sync`, non una `FnMut` che aggiorna liberamente una variabile esterna. [ParallelIterator](https://docs.rs/rayon/1.12.0/rayon/iter/trait.ParallelIterator.html), [prestiti mutabili](https://docs.rs/rayon/1.12.0/rayon/iter/trait.IntoParallelRefMutIterator.html).

```rust
use rayon::prelude::*;

fn main() {
    let mut values = vec![3_i32, 1, 4];
    let doubled: Vec<_> = values.par_iter().map(|&n| n * 2).collect();
    assert_eq!(doubled, [6, 2, 8]);
    assert_eq!(values, [3, 1, 4]);

    values.par_iter_mut().for_each(|n| *n += 10);
    assert_eq!(values, [13, 11, 14]);

    let labels: Vec<_> = values.into_par_iter().map(|n| n.to_string()).collect();
    assert_eq!(labels, ["13", "11", "14"]);
}
```

Non serve un mutex per modificare elementi disgiunti. `into_par_iter()` non significa sempre consumo del contenitore: chiamato su `&Vec<T>` itera sui riferimenti; qui il ricevente e il `Vec` posseduto.

### Ordine logico e ordine di esecuzione

- Su slice/Vec, `map(...).collect::<Vec<_>>()` conserva la posizione logica, anche se le closure terminano in ordine diverso. Anche `filter` conserva l'ordine relativo dei superstiti nella raccolta in `Vec`.
- `for_each` non ordina effetti come stampe o scritture esterne. Un mutex serializza gli accessi, non li rimette nell'ordine degli input.
- `find_any` trova una corrispondenza qualsiasi; `find_first` rispetta il primo elemento nell'ordine logico, quando la sorgente ha un ordine significativo.
- Una raccolta in `HashMap` non diventa ordinata; `par_bridge()` non garantisce l'ordine della sorgente.

Un iteratore **indexed** conosce lunghezza e suddivisione per posizione. Offre metodi come `enumerate`, `zip` e `with_min_len`. `filter` perde questa proprieta, non necessariamente l'ordine: per conservare gli indici originali metti `enumerate` prima di `filter`; per rinumerare i superstiti raccogli prima in un `Vec`. [IndexedParallelIterator](https://docs.rs/rayon/1.12.0/rayon/iter/trait.IndexedParallelIterator.html), [raccolte](https://docs.rs/rayon/1.12.0/rayon/iter/trait.FromParallelIterator.html).

## Esempio pratico

### Normalizzare stringhe senza lock

```rust
use rayon::prelude::*;

fn normalize_all(values: &[String]) -> Vec<String> {
    values
        .par_iter()
        .map(|s| s.trim().to_lowercase())
        .filter(|s| !s.is_empty())
        .collect()
}

fn main() {
    let values = vec![" Rust ".into(), "  ".into(), "RAYON".into(), "Rust".into()];
    let normalized = normalize_all(&values);
    assert_eq!(normalized, ["rust", "rayon", "rust"]);
    assert_eq!(values[0], " Rust ");
}
```

La funzione conserva ordine e duplicati, elimina whitespace ai bordi e stringhe diventate vuote; non modifica l'input. Non valida identificatori e non esegue normalizzazione Unicode o case folding completo. Lowercase puo espandere il testo. La policy e la stessa spiegata in [[Programmazione/Rust/Pagine/Iteratori|Iteratori]]; il parallelismo non cambia queste regole.

### Accumulatori locali con fold e reduce

Per contare valori pari e dispari, ogni job accumula una coppia locale; la riduzione combina le coppie senza aggiornare un contatore globale:

```rust
use rayon::prelude::*;

fn parity_counts(values: &[u32]) -> [usize; 2] {
    values
        .par_iter()
        .fold(
            || [0_usize; 2],
            |mut counts, &value| {
                counts[(value % 2) as usize] += 1;
                counts
            },
        )
        .reduce(
            || [0; 2],
            |left, right| [left[0] + right[0], left[1] + right[1]],
        )
}

fn main() {
    assert_eq!(parity_counts(&[2, 4, 7, 9, 10]), [3, 2]);
    assert_eq!(parity_counts(&[]), [0, 0]);
}
```

`fold` parallelo produce piu accumulatori, non necessariamente uno per thread. `reduce` li unisce; l'identita deve essere neutra e l'operazione associativa. Qui i conteggi sono limitati dalla lunghezza della slice. Sottrazione e somme floating point non sono associative: cambiare il raggruppamento puo cambiare il risultato.

`reduce_with` restituisce `None` sul vuoto; `reduce` usa l'identita. `sum` e comodo per somme, ma non impone una parentesizzazione sequenziale. [Riduzione](https://docs.rs/rayon/1.12.0/rayon/iter/trait.ParallelIterator.html#method.reduce).

### Risultati fallibili

```rust
use rayon::prelude::*;
use std::num::ParseIntError;

fn parse_all(values: &[&str]) -> Result<Vec<u32>, ParseIntError> {
    values.par_iter().map(|text| text.parse::<u32>()).collect()
}

fn main() {
    assert_eq!(parse_all(&["12", "0", "7"]).unwrap(), [12, 0, 7]);
    assert!(parse_all(&["12", "bad", "7"]).is_err());

    let result: Result<(), &str> = [10_u32, 25, 101]
        .par_iter()
        .try_for_each(|&value| {
            if value <= 100 { Ok(()) } else { Err("out of range") }
        });
    assert_eq!(result, Err("out of range"));
}
```

La raccolta in `Result` non restituisce il vettore parziale in caso di errore; con piu errori non garantisce quello alla posizione piu bassa. `try_for_each` tenta di fermare il lavoro residuo, ma non annulla gli effetti gia prodotti o i job in esecuzione. Per un report completo raccogli invece tutti i `Result` in un `Vec`. [Raccolta fallibile](https://docs.rs/rayon/1.12.0/rayon/iter/trait.FromParallelIterator.html).

## Varianti

### Pool dedicato e join

```rust
use rayon::prelude::*;

fn main() -> Result<(), rayon::ThreadPoolBuildError> {
    let pool = rayon::ThreadPoolBuilder::new()
        .num_threads(2)
        .build()?;

    let data = [1_u64, 2, 3, 4, 5];
    let (left, right) = data.split_at(2);
    let (a, b) = pool.install(|| {
        rayon::join(
            || left.par_iter().copied().sum::<u64>(),
            || right.par_iter().copied().sum::<u64>(),
        )
    });

    assert_eq!((a, b), (3, 12));
    Ok(())
}
```

`install` esegue la closure nel pool scelto e ne restituisce l'esito. `join` attende entrambe le closure e produce la coppia: offre parallelismo potenziale, non garantisce due thread distinti. Il parallelismo annidato usa il pool corrente. Con unwinding il panic viene propagato, non trasformato automaticamente in `Result`. [ThreadPool](https://docs.rs/rayon/1.12.0/rayon/struct.ThreadPool.html), [join](https://docs.rs/rayon/1.12.0/rayon/fn.join.html).

Riusa il pool; non crearne uno per elemento o richiesta. Il numero 2 e didattico, non un consiglio universale. Senza configurazione esplicita Rayon determina il numero dei worker in base all'ambiente/CPU; `num_threads` e `RAYON_NUM_THREADS` permettono di controllarlo. Il pool globale si inizializza una sola volta: una seconda `build_global()` fallisce. Non riconfigurarlo da una libreria. [ThreadPoolBuilder](https://docs.rs/rayon/1.12.0/rayon/struct.ThreadPoolBuilder.html).

### Granularita e sorgenti diverse

- `par_chunks_mut(n)` fornisce blocchi disgiunti; `n` deve essere positivo e l'ultimo blocco puo essere piu corto. Puo ridurre l'overhead per lavori molto piccoli.
- `with_min_len(n)` limita la suddivisione di un iteratore indexed; non assegna un blocco fisso a ogni thread.
- `par_bridge()` converte un `Iterator + Send` con item `Send`: le chiamate a `next()` restano sincronizzate e possono diventare il collo di bottiglia. Non e I/O async.
- `par_sort` / `par_sort_unstable` ordinano slice mutabili; scegli in base alla necessita di conservare l'ordine relativo degli elementi con chiave uguale.

[ParallelSliceMut](https://docs.rs/rayon/1.12.0/rayon/slice/trait.ParallelSliceMut.html), [ParallelBridge](https://docs.rs/rayon/1.12.0/rayon/iter/trait.ParallelBridge.html).

### Interazione con async e operazioni bloccanti

Chiamare una pipeline Rayon sincrona dentro un task async tiene occupato il thread che la attende. Per integrazioni reali serve un confine di esecuzione dedicato e un modo di ricevere il risultato senza bloccare l'executor; vedi [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async]].

I/O bloccante nei worker puo sprecare il parallelismo. Peggio, un job che aspetta un altro job dello stesso pool tramite un canale bloccante puo causare deadlock: lo scheduler non promette che quel job verra eseguito su un altro thread. Non usare barriere che richiedono l'esecuzione simultanea di tutti gli elementi. [Avvertenza di join](https://docs.rs/rayon/1.12.0/rayon/fn.join.html#warning-about-blocking-io).

## Errori comuni

### Mutare una cattura condivisa

Controesempio intenzionale, **non compila**:

```rust
use rayon::prelude::*;

fn main() {
    let mut output = Vec::new();
    [1, 2, 3].par_iter().for_each(|&n| output.push(n * 2));
}
```

La closure richiede accesso mutabile alla cattura, incompatibile con `Fn`. Per un risultato per input usa `map(...).collect()`; per aggregazioni usa accumulatori locali; per aggiornamenti indipendenti usa `par_iter_mut`. Un mutex puo essere corretto ma aggiunge contesa e non preserva l'ordine.

### Enumerare dopo filter

Anche questo frammento completo **non compila**:

```rust
use rayon::prelude::*;

fn main() {
    let _items: Vec<_> = [1, 2, 3, 4]
        .par_iter()
        .filter(|&&n| n % 2 == 0)
        .enumerate()
        .collect();
}
```

Dopo `filter` manca `IndexedParallelIterator`. Per ottenere le posizioni originali usa `par_iter().enumerate().filter(|(_, n)| **n % 2 == 0)`.

### Misurazioni e semantica

- Non dedurre uno speedup dal fatto che il codice usa tutti i core: misura build release, dati reali e versione sequenziale equivalente.
- Evita logging e lock per elemento nei benchmark; considera allocazioni, saturazione della memoria e costo di inizializzazione del pool.
- Non trasferire automaticamente tutte le API di `Iterator`: trait, bound e semantica delle riduzioni differiscono.
- Un errore o panic non e una transazione con rollback. Evita effetti esterni nel calcolo se devono essere applicati tutti insieme.
- La disponibilita dei thread dipende dal target; per ambienti senza supporto normale ai thread consulta i limiti di Rayon, senza assumere lo stesso parallelismo di desktop/server.

## Checklist

- Le unita di lavoro sono indipendenti e abbastanza costose?
- Ho scelto prestito, mutazione disgiunta o consumo in base all'ownership?
- L'ordine richiesto riguarda i risultati o anche gli effetti?
- Riduzione e identita sono corrette, anche con input vuoto?
- Ho gestito overflow, errori, panic ed effetti parziali?
- Il lavoro termina anche con un solo worker e non aspetta altri job bloccando?
- Ho confrontato tempi e memoria con una versione sequenziale in release?

## Collegamenti

- [[Programmazione/Rust/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Rust/Pagine/Iterator API|Iterator API]]
- [[Programmazione/Rust/Pagine/Threads|Threads]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]
- [[Programmazione/Rust/Pagine/Shared state|Shared state]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]
- [[Programmazione/Rust/Pagine/Zero-cost abstractions|Zero-cost abstractions]]

## Fonti

- [Rayon 1.12.0](https://docs.rs/rayon/1.12.0/rayon/) e [FAQ del tag v1.12.0](https://github.com/rayon-rs/rayon/blob/v1.12.0/FAQ.md).
- [ParallelIterator](https://docs.rs/rayon/1.12.0/rayon/iter/trait.ParallelIterator.html) e [IndexedParallelIterator](https://docs.rs/rayon/1.12.0/rayon/iter/trait.IndexedParallelIterator.html).
- [FromParallelIterator](https://docs.rs/rayon/1.12.0/rayon/iter/trait.FromParallelIterator.html): semantica delle raccolte.
- [ThreadPoolBuilder](https://docs.rs/rayon/1.12.0/rayon/struct.ThreadPoolBuilder.html), [ThreadPool](https://docs.rs/rayon/1.12.0/rayon/struct.ThreadPool.html) e [join](https://docs.rs/rayon/1.12.0/rayon/fn.join.html).
- [ParallelSliceMut](https://docs.rs/rayon/1.12.0/rayon/slice/trait.ParallelSliceMut.html) e [ParallelBridge](https://docs.rs/rayon/1.12.0/rayon/iter/trait.ParallelBridge.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
