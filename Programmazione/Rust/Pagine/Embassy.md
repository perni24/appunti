---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - embedded
aliases:
  - "Embassy"
  - "Embassy async"
prerequisites:
  - "[[Programmazione/Rust/Pagine/no_std]]"
  - "[[Programmazione/Rust/Pagine/Async Await]]"
  - "[[Programmazione/Rust/Pagine/Future Trait]]"
related:
  - "[[Programmazione/Rust/Pagine/Embedded Rust]]"
  - "[[Programmazione/Rust/Pagine/embedded-hal]]"
  - "[[Programmazione/Rust/Pagine/RTIC]]"
  - "[[Programmazione/Rust/Pagine/defmt]]"
  - "[[Programmazione/Rust/Pagine/Channel async]]"
---

# Embassy

## Sintesi

Embassy e un ecosistema Rust per sviluppo embedded async. Porta `async/await` su microcontrollori senza richiedere un sistema operativo tradizionale, usando executor, timer, driver async, primitive di sincronizzazione e HAL per diverse famiglie hardware.

Il vantaggio principale e scrivere firmware concorrente come un insieme di task async, invece di intrecciare manualmente state machine, interrupt e polling.

## Quando usarlo

Usa Embassy quando:

- il firmware ha molte attese su timer, I/O o periferiche;
- vuoi concorrenza cooperativa con `async/await`;
- lavori con HAL Embassy disponibili per la MCU;
- devi coordinare piu task embedded;
- vuoi evitare busy wait;
- il modello RTIC basato su priorita e interrupt non e il piu adatto.

Non e una bacchetta magica: richiede capire executor, lifetimes statici, memoria disponibile e driver supportati dal target.

## Come funziona

Embassy fornisce:

- **executor**: esegue task async su microcontrollore;
- **timer**: sleep e timeout senza bloccare CPU;
- **HAL async**: driver per periferiche;
- **sync primitives**: channel, signal, mutex e altre primitive embedded;
- **networking/USB**: componenti opzionali secondo target;
- **integrazione defmt**: logging compatto.

I task async sono spesso staticamente allocati o comunque gestiti con vincoli piu stretti rispetto a un runtime desktop. Il firmware resta `no_std` su molti target.

## API / Sintassi

Entry point schematico:

```rust
#![no_std]
#![no_main]

use embassy_executor::Spawner;
use embassy_time::{Duration, Timer};
use panic_probe as _;

#[embassy_executor::main]
async fn main(_spawner: Spawner) {
    loop {
        defmt::info!("tick");
        Timer::after(Duration::from_millis(1000)).await;
    }
}
```

Task separato:

```rust
#[embassy_executor::task]
async fn blink_task() {
    loop {
        defmt::info!("blink");
        embassy_time::Timer::after_millis(500).await;
    }
}
```

Le API concrete dipendono dalla HAL della famiglia hardware.

## Esempio pratico

Avvio di un task:

```rust
#![no_std]
#![no_main]

use embassy_executor::Spawner;
use embassy_time::Timer;
use panic_probe as _;

#[embassy_executor::task]
async fn worker() {
    loop {
        defmt::info!("worker running");
        Timer::after_millis(250).await;
    }
}

#[embassy_executor::main]
async fn main(spawner: Spawner) {
    spawner.spawn(worker()).unwrap();

    loop {
        Timer::after_millis(1000).await;
    }
}
```

Il task `worker` non blocca tutto il firmware durante l'attesa: restituisce controllo all'executor.

## Varianti

- **embassy-executor**: runtime async embedded.
- **embassy-time**: timer e delay async.
- **embassy-sync**: primitive di sincronizzazione.
- **HAL Embassy**: supporto per famiglie MCU specifiche.
- **embassy-net**: networking embedded dove supportato.
- **RTIC**: alternativa real-time interrupt-driven.

## Errori comuni

- Pensare che async embedded sia uguale a Tokio.
- Bloccare dentro task async con busy loop.
- Creare task troppo grandi per RAM disponibile.
- Usare driver non async dentro percorsi che dovrebbero cooperare.
- Ignorare priorita e latenza real-time.
- Usare `unwrap()` su spawn o driver senza strategia di errore.
- Scegliere Embassy senza verificare supporto HAL per il chip.

## Checklist

- Il chip ha supporto Embassy adeguato?
- I task sono dimensionati per RAM e stack disponibili?
- Le attese usano timer async invece di busy wait?
- I driver usati sono compatibili con il modello async?
- Gli errori dei task sono osservabili?
- Logging e panic handler sono configurati?
- Embassy e preferibile a RTIC per questo firmware?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/no_std]]
- [[Programmazione/Rust/Pagine/Embedded Rust]]
- [[Programmazione/Rust/Pagine/embedded-hal]]
- [[Programmazione/Rust/Pagine/RTIC]]
- [[Programmazione/Rust/Pagine/defmt]]
- [[Programmazione/Rust/Pagine/Async Await]]
- [[Programmazione/Rust/Pagine/Future Trait]]
- [[Programmazione/Rust/Pagine/Channel async]]
