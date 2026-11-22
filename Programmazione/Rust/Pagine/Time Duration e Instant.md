---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - standard-library
aliases:
  - Time
  - Duration
  - Instant
prerequisites:
  - "[[Programmazione/Rust/Pagine/Tipi di dato primitivi]]"
  - "[[Programmazione/Rust/Pagine/Result]]"
related:
  - "[[Programmazione/Rust/Pagine/Async Await]]"
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]"
  - "[[Programmazione/Rust/Pagine/Performance e profiling]]"
title: Time, Duration e Instant
---

# Time, Duration e Instant

## Sintesi

`std::time` distingue tre concetti: `Duration` e un intervallo non negativo, `Instant` serve a misurare tempo trascorso e scadenze locali, `SystemTime` rappresenta l'orologio di sistema.

Non sono intercambiabili: un timeout di due secondi e una durata, il momento in cui scade e un istante, la data da registrare in un log e un timestamp. Per calendario, timezone e formattazione di date servono librerie dedicate, per esempio `time` o `chrono`.

## Quando usarlo

- Configurare attese, timeout o intervalli con unita esplicite.
- Misurare un'operazione sincrona senza usare l'orologio civile.
- Calcolare quanto manca a una scadenza.
- Registrare un timestamp scambiabile con altri sistemi, specificandone riferimento e unita.
- Gestire input temporali non validi senza trasformarli in panic.

## Come funziona

### Scegliere il tipo giusto

| Tipo | Rappresenta | Operazione tipica | Limite da ricordare |
| --- | --- | --- | --- |
| `Duration` | Quantita di tempo non negativa | `checked_add` restituisce `Option<Duration>` | Non rappresenta una data o un intervallo negativo |
| `Instant` | Lettura di un orologio monotono | `checked_duration_since` restituisce `Option<Duration>` | Non e un timestamp Unix da salvare o inviare |
| `SystemTime` | Lettura dell'orologio di sistema | `duration_since` restituisce `Result<Duration, SystemTimeError>` | L'orologio puo essere corretto avanti o indietro |

Il modello generale e descritto nel [modulo ufficiale std::time](https://doc.rust-lang.org/std/time/index.html).

### Monotono non significa perfetto

`Instant` e progettato per essere **non decrescente**, non strettamente crescente: due letture possono coincidere. Non garantisce tick uniformi; l'inclusione del tempo trascorso durante la sospensione del sistema dipende dalla piattaforma. Restano possibili anomalie del sistema operativo, dell'hardware o della virtualizzazione.

Usalo per differenze locali, non per ricostruire una data o confrontare macchine diverse. La precisione con cui `Duration` rappresenta un valore non garantisce la stessa precisione dell'orologio o dello scheduler. Vedi i [limiti di Instant](https://doc.rust-lang.org/std/time/struct.Instant.html#monotonicity).

## API / Sintassi

Gli esempi sono programmi indipendenti, senza dipendenze esterne. Riferimento verificato: Rust 1.99.1, edition 2024.

### Creare durate e convertire le unita

`Duration::new` normalizza la parte in nanosecondi; `as_secs` restituisce i secondi interi. I metodi `subsec_*` descrivono soltanto la frazione del secondo, mentre `as_millis`, `as_micros` e `as_nanos` restituiscono il totale come `u128`.

```rust
use std::time::Duration;

fn main() {
    let timeout = Duration::from_secs(3);
    let pause = Duration::from_millis(250);
    let tick = Duration::from_nanos(100);
    assert!(timeout > pause && pause > tick);

    let delay = Duration::new(1, 1_500_000_000);
    assert_eq!(delay, Duration::from_millis(2_500));
    assert_eq!(delay.as_secs(), 2);
    assert_eq!(delay.subsec_millis(), 500);
    assert_eq!(delay.as_millis(), 2_500);

    let millis: u64 = delay.as_millis().try_into()
        .expect("la durata dimostrativa entra in u64");
    assert_eq!(millis, 2_500);

    let restored = Duration::new(delay.as_secs(), delay.subsec_nanos());
    assert_eq!(restored, delay);
    println!("{}.{:09} s", delay.as_secs(), delay.subsec_nanos());
}
```

Stampa `2.500000000 s`. Per input esterni propaga o gestisci l'errore di conversione al posto di `expect`. Un cast `as u64` puo perdere i bit alti; convertire prima a millisecondi perde comunque le frazioni inferiori al millisecondo.

`Duration` non implementa `Display`: scegli unita e formato, oppure usa `{:?}` per debug. Vedi [costruttori e conversioni di Duration](https://doc.rust-lang.org/std/time/struct.Duration.html).

### Calcolare senza nascondere errori

Le operazioni `checked_*` restituiscono `None` per risultati non rappresentabili o divisori nulli. Le varianti `saturating_*` limitano il risultato all'intervallo valido: e una politica, non una validazione dell'input. Gli operatori aritmetici su `Duration` possono invece causare panic.

```rust
use std::time::Duration;

fn next_delay(current: Duration, cap: Duration) -> Duration {
    current.saturating_mul(2).min(cap)
}

fn main() {
    let budget = Duration::from_millis(800);
    let used = Duration::from_millis(300);

    assert_eq!(budget.checked_sub(used), Some(Duration::from_millis(500)));
    assert_eq!(used.checked_sub(budget), None);
    assert_eq!(budget.checked_sub(budget), Some(Duration::ZERO));
    assert_eq!(Duration::MAX.checked_add(Duration::from_nanos(1)), None);
    assert_eq!(budget.checked_mul(2), Some(Duration::from_millis(1_600)));
    assert_eq!(budget.checked_div(0), None);

    let cap = Duration::from_secs(2);
    assert_eq!(next_delay(Duration::from_millis(1_500), cap), cap);
    assert_eq!(next_delay(Duration::MAX, cap), cap);

    assert_eq!(
        Duration::try_from_secs_f64(0.125).unwrap(),
        Duration::from_millis(125),
    );
    for invalid in [-0.5, f64::NAN, f64::INFINITY] {
        assert!(Duration::try_from_secs_f64(invalid).is_err());
    }
}
```

Qui il raddoppio saturante e intenzionale: `next_delay` non supera mai `cap`. Non aspetta e non implementa un retry completo.

`try_from_secs_f64` arrotonda alla precisione rappresentabile e restituisce `Result<Duration, TryFromFloatSecsError>`; verifica separatamente che il valore sia diverso da zero se lo richiede il dominio. Vedi [conversione fallibile da secondi floating point](https://doc.rust-lang.org/std/time/struct.TryFromFloatSecsError.html).

## Esempio pratico

### Misurare una funzione sincrona

```rust
use std::time::{Duration, Instant};

fn measure<F, T>(f: F) -> (T, Duration)
where
    F: FnOnce() -> T,
{
    let start = Instant::now();
    let result = f();
    let elapsed = start.elapsed();
    (result, elapsed)
}

fn main() {
    let values = vec![8, 3, 5, 1];
    let (sorted, elapsed) = measure(move || {
        let mut values = values;
        values.sort_unstable();
        values
    });

    assert_eq!(sorted, vec![1, 3, 5, 8]);
    println!("{sorted:?}; {:.6} s", elapsed.as_secs_f64());
}
```

`FnOnce` permette alla closure di consumare un valore catturato. Il risultato viene restituito insieme alla durata; se e un `Result`, anche un `Err` resta un normale risultato. Se la closure va in panic, la funzione non restituisce la coppia.

Misuri tempo trascorso, inclusi attese e scheduling, non soltanto tempo CPU. Una singola esecuzione minuscola non dimostra una differenza di prestazioni: servono ripetizioni e un benchmark progettato correttamente. `std::hint::black_box` puo ostacolare alcune ottimizzazioni, ma e soltanto un aiuto best-effort, non rende automaticamente valido un benchmark. Vedi [black_box](https://doc.rust-lang.org/std/hint/fn.black_box.html) e [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]].

Passare una closure che **crea** una future misurerebbe quella creazione, non l'esecuzione asincrona della future.

### Gestire una scadenza e l'ordine degli istanti

```rust
use std::time::{Duration, Instant};

fn remaining(deadline: Instant, now: Instant) -> Duration {
    deadline.saturating_duration_since(now)
}

fn main() {
    let start = Instant::now();
    let Some(deadline) = start.checked_add(Duration::from_millis(500)) else {
        eprintln!("Scadenza non rappresentabile");
        return;
    };
    let Some(later) = deadline.checked_add(Duration::from_millis(100)) else {
        eprintln!("Istante di prova non rappresentabile");
        return;
    };

    assert_eq!(remaining(deadline, start), Duration::from_millis(500));
    assert_eq!(remaining(deadline, deadline), Duration::ZERO);
    assert_eq!(remaining(deadline, later), Duration::ZERO);

    assert_eq!(start.checked_duration_since(deadline), None);
    assert_eq!(
        deadline.checked_duration_since(start),
        Some(Duration::from_millis(500)),
    );
}
```

Gli istanti di prova sono costruiti, non ottenuti aspettando: i controlli non dipendono dalla velocita del computer.

`remaining` tratta una scadenza passata come zero. Per rilevare un ordine errato usa invece `checked_duration_since`. In Rust 1.99.1 anche `duration_since`, `elapsed` e la sottrazione tra istanti saturano a zero nei casi inversi; la documentazione avverte che questo comportamento potrebbe cambiare. Il nome `saturating_duration_since` rende esplicita la scelta.

`checked_add` e `checked_sub` restituiscono `Option<Instant>`: il range rappresentabile dipende dalla piattaforma. Vedi [operazioni di Instant](https://doc.rust-lang.org/std/time/struct.Instant.html#implementations).

### Ottenere un timestamp e gestire date precedenti all'epoch

```rust
use std::time::{Duration, SystemTime, SystemTimeError, UNIX_EPOCH};

fn unix_parts(time: SystemTime) -> Result<(u64, u32), SystemTimeError> {
    let since_epoch = time.duration_since(UNIX_EPOCH)?;
    Ok((since_epoch.as_secs(), since_epoch.subsec_nanos()))
}

fn main() {
    let sample = UNIX_EPOCH.checked_add(Duration::from_millis(12_250))
        .expect("il timestamp dimostrativo e rappresentabile");
    assert_eq!(unix_parts(sample).unwrap(), (12, 250_000_000));

    let before = UNIX_EPOCH.checked_sub(Duration::from_secs(2))
        .expect("il timestamp dimostrativo e rappresentabile");
    let error = unix_parts(before).unwrap_err();
    assert_eq!(error.duration(), Duration::from_secs(2));

    match unix_parts(SystemTime::now()) {
        Ok((seconds, nanos)) => println!("Unix: {seconds}.{nanos:09} s"),
        Err(error) => eprintln!("Orologio prima dell'epoch: {:?}", error.duration()),
    }
}
```

`UNIX_EPOCH` corrisponde al 1 gennaio 1970, 00:00:00 UTC. I secondi ottenuti sono timestamp Unix/POSIX, senza conteggio dei leap seconds. Nel formato scelto la parte frazionaria ha nove cifre: non indica che il sistema abbia una risoluzione reale di un nanosecondo. Vedi [UNIX_EPOCH](https://doc.rust-lang.org/std/time/constant.UNIX_EPOCH.html).

La funzione rifiuta i tempi precedenti all'epoch. `SystemTimeError::duration()` restituisce la distanza positiva nella direzione opposta, **non** un timestamp negativo. Per supportarli in un protocollo occorre scegliere esplicitamente una rappresentazione con segno. Vedi [SystemTimeError](https://doc.rust-lang.org/std/time/struct.SystemTimeError.html).

`SystemTime::elapsed()` restituisce anch'esso un `Result<Duration, SystemTimeError>`: non sostituisce il cronometro monotono. `SystemTime` non contiene il fuso orario e non formatta una data civile. Anche le sue operazioni `checked_add` e `checked_sub` verificano un range dipendente dalla piattaforma. Vedi [SystemTime](https://doc.rust-lang.org/std/time/struct.SystemTime.html).

### Attendere senza pretendere una precisione esatta

```rust
use std::thread;
use std::time::{Duration, Instant};

fn main() {
    let requested = Duration::from_millis(10);
    let start = Instant::now();

    thread::sleep(requested);

    println!("Richiesti: {requested:?}; trascorsi: {:?}", start.elapsed());
}
```

`thread::sleep` blocca il thread per almeno la durata richiesta; il risveglio puo avvenire dopo. Non confrontare il risultato con `== requested` e non presumere un ritardo massimo garantito. Una durata nulla non e un modo portabile per cedere tempo CPU: per quella intenzione esiste `thread::yield_now`, senza garanzie su quale thread verra eseguito. Vedi [thread::sleep](https://doc.rust-lang.org/std/thread/fn.sleep.html).

Un valore chiamato `timeout` o una scadenza calcolata **non interrompe da solo** un'operazione bloccante. L'API usata deve supportare timeout, cancellazione o controlli cooperativi. Nel polling si puo limitare ogni attesa al tempo residuo, ma una singola operazione lunga puo comunque superare la scadenza.

## Varianti

- **Async:** usa i timer del runtime, per esempio Tokio, invece di bloccare il thread dell'executor. La standard library non fornisce un equivalente async di `thread::sleep`. Vedi [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async Tokio e async-std]].
- **Attivita periodiche:** eseguire il lavoro e poi attendere un periodo somma il tempo del lavoro a ogni ciclo. Se vuoi una cadenza, pianifica scadenze successive e decidi se saltare o recuperare quelle perse.
- **Calendario:** una durata di 24 ore non significa necessariamente "la stessa ora locale domani". Lascia calendario e timezone a una libreria che ne gestisca le regole.
- **Test:** passa l'istante corrente come parametro alle funzioni di calcolo, come in `remaining`; non modificare l'orologio del computer per simulare una scadenza.

## Errori comuni

- Confondere `subsec_millis()` con i millisecondi totali.
- Trasformare un errore di conversione in zero senza una decisione esplicita.
- Usare `SystemTime` per misurare prestazioni.
- Interpretare `None` e `Some(Duration::ZERO)` come lo stesso esito.
- Salvare la rappresentazione debug di `Instant` come timestamp persistente.
- Aspettarsi che nanosecondi nel tipo significhino attese precise al nanosecondo.
- Usare `sleep` come timeout di un'altra operazione o dentro il lavoro async ordinario.

## Checklist

- Ti serve una durata, una scadenza locale o un timestamp?
- Il formato esterno dichiara unita, riferimento e gestione dei valori negativi?
- La conversione numerica controlla range e perdita di precisione?
- Hai scelto consapevolmente tra errore, saturazione e panic?
- Il timeout e applicato dall'API o soltanto memorizzato in una variabile?
- I test evitano uguaglianze e limiti superiori fragili sui tempi reali?
- Il caso di sospensione del sistema richiede una verifica specifica della piattaforma?

## Collegamenti

- [[Programmazione/Rust/Pagine/Async Await|Async Await]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async Tokio e async-std]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Operatore|Operatore ?]]
- [[Programmazione/Rust/Pagine/From Into TryFrom e TryInto|From, Into, TryFrom e TryInto]]
- [[Programmazione/Rust/Pagine/Closure|Closure]]

## Fonti

Documentazione ufficiale consultata per Rust 1.99.1. I limiti degli orologi e dei timer non costituiscono garanzie real-time.

- [std::time](https://doc.rust-lang.org/std/time/index.html)
- [Duration](https://doc.rust-lang.org/std/time/struct.Duration.html)
- [Instant](https://doc.rust-lang.org/std/time/struct.Instant.html)
- [SystemTime](https://doc.rust-lang.org/std/time/struct.SystemTime.html)
- [UNIX_EPOCH](https://doc.rust-lang.org/std/time/constant.UNIX_EPOCH.html)
- [SystemTimeError](https://doc.rust-lang.org/std/time/struct.SystemTimeError.html)
- [TryFromFloatSecsError](https://doc.rust-lang.org/std/time/struct.TryFromFloatSecsError.html)
- [thread::sleep](https://doc.rust-lang.org/std/thread/fn.sleep.html)
- [hint::black_box](https://doc.rust-lang.org/std/hint/fn.black_box.html)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
