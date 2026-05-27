---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - embedded
aliases:
  - "defmt"
prerequisites:
  - "[[Programmazione/Rust/Pagine/no_std]]"
  - "[[Programmazione/Rust/Pagine/probe-rs]]"
  - "[[Programmazione/Rust/Pagine/Embedded Rust]]"
related:
  - "[[Programmazione/Rust/Pagine/Logging con log]]"
  - "[[Programmazione/Rust/Pagine/Tracing con tracing]]"
  - "[[Programmazione/Rust/Pagine/RTIC]]"
  - "[[Programmazione/Rust/Pagine/Embassy]]"
---

# defmt

## Sintesi

`defmt` e un framework di logging pensato per firmware embedded Rust. Il suo obiettivo e produrre log compatti, adatti a microcontrollori con poca memoria e banda limitata verso l'host.

A differenza del logging testuale classico, `defmt` sposta parte della formattazione fuori dal target: il firmware emette dati codificati in modo compatto, mentre il tool lato host li decodifica usando informazioni del binario.

## Quando usarlo

Usa `defmt` quando:

- lavori in `no_std`;
- hai poca RAM, flash o banda di logging;
- vuoi log leggibili durante flashing e debug;
- usi `probe-rs` o RTT;
- devi diagnosticare firmware senza `println!` standard;
- vuoi includere valori tipizzati nei log.

Per applicazioni desktop, backend o CLI, usa logging/tracing normale. `defmt` e specializzato per embedded.

## Come funziona

Il firmware usa macro come `defmt::info!`, `defmt::warn!` o `defmt::error!`. I messaggi vengono codificati in un formato compatto. L'host legge lo stream, ad esempio via RTT, e decodifica i log usando metadati del firmware.

Questo riduce il lavoro sul microcontrollore:

- meno stringhe complete in flash;
- meno formattazione runtime;
- meno bytes trasferiti;
- log piu sostenibili su target piccoli.

La conseguenza e che il log non e solo testo grezzo: serve la toolchain corretta per decodificarlo.

## API / Sintassi

Macro base:

```rust
defmt::info!("system started");
defmt::warn!("battery low: {} mV", 3300u16);
defmt::error!("sensor error: {}", 5u8);
```

Derive per tipi custom:

```rust
#[derive(defmt::Format)]
struct Reading {
    temperature: i16,
    humidity: u8,
}

fn log_reading(reading: Reading) {
    defmt::info!("reading = {}", reading);
}
```

Panic handler tipico:

```rust
use panic_probe as _;
```

La configurazione effettiva dipende da runner, probe e target.

## Esempio pratico

Firmware schematico con log:

```rust
#![no_std]
#![no_main]

use cortex_m_rt::entry;
use panic_probe as _;

#[entry]
fn main() -> ! {
    defmt::info!("boot");

    let mut counter = 0u32;

    loop {
        counter = counter.wrapping_add(1);

        if counter % 1000 == 0 {
            defmt::debug!("counter={}", counter);
        }
    }
}
```

Con un runner compatibile, i messaggi vengono letti e decodificati sul computer di sviluppo.

## Varianti

- **defmt + probe-rs**: flusso comune per run e log.
- **defmt + RTT**: trasporto log dal target all'host.
- **panic-probe**: panic handler integrato con logging.
- **defmt::Format**: formattazione compatta per tipi custom.
- **feature di logging**: log attivabili/disattivabili per profili o target.
- **logging tradizionale**: non equivalente, piu adatto a sistemi con `std`.

## Errori comuni

- Aspettarsi log leggibili senza decoder lato host.
- Usare formati o tipi non supportati da `defmt::Format`.
- Lasciare log troppo rumorosi in percorsi ad alta frequenza.
- Usare logging come sostituto di misure temporali precise.
- Dimenticare panic handler compatibile.
- Non configurare runner/probe per leggere RTT.
- Confondere `defmt` con `log` o `tracing`.

## Checklist

- Il firmware usa un panic handler adatto?
- Il runner legge e decodifica i log?
- I tipi custom derivano `defmt::Format` quando necessario?
- I log ad alta frequenza sono limitati?
- I livelli di log sono coerenti?
- La dimensione del firmware resta accettabile?
- La documentazione del progetto spiega come vedere i log?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/no_std]]
- [[Programmazione/Rust/Pagine/probe-rs]]
- [[Programmazione/Rust/Pagine/Embedded Rust]]
- [[Programmazione/Rust/Pagine/Logging con log]]
- [[Programmazione/Rust/Pagine/Tracing con tracing]]
- [[Programmazione/Rust/Pagine/RTIC]]
- [[Programmazione/Rust/Pagine/Embassy]]
