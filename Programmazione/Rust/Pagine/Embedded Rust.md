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
  - "Embedded Rust"
  - "Rust embedded"
prerequisites:
  - "[[Programmazione/Rust/Pagine/no_std]]"
  - "[[Programmazione/Rust/Pagine/cortex-m]]"
  - "[[Programmazione/Rust/Pagine/embedded-hal]]"
related:
  - "[[Programmazione/Rust/Pagine/Allocator]]"
  - "[[Programmazione/Rust/Pagine/defmt]]"
  - "[[Programmazione/Rust/Pagine/probe-rs]]"
  - "[[Programmazione/Rust/Pagine/RTIC]]"
  - "[[Programmazione/Rust/Pagine/Embassy]]"
---

# Embedded Rust

## Sintesi

**Embedded Rust** e l'uso di Rust su microcontrollori, firmware bare metal e sistemi con risorse limitate. In questo contesto spesso non sono disponibili sistema operativo, heap, filesystem o standard library completa, quindi il codice usa `#![no_std]`, accesso diretto ai registri hardware e crate specializzate per startup, periferiche, interrupt e debug.

Il valore principale di Rust embedded e portare ownership, type system e astrazioni sicure in un dominio dove errori di memoria, race su registri e gestione errata degli interrupt possono causare blocchi difficili da diagnosticare.

## Quando usarlo

Usa Rust embedded quando devi scrivere firmware per microcontrollori, driver hardware, runtime su bare metal o software vicino al dispositivo.

E utile soprattutto quando:

- vuoi evitare classi comuni di bug C/C++ come use-after-free e data race;
- lavori con periferiche memory-mapped;
- devi modellare lo stato dell'hardware con tipi espliciti;
- vuoi condividere codice portabile tra HAL diverse tramite trait comuni;
- devi mantenere controllo su memoria, timing e dimensione del binario.

Non e una scelta automatica per ogni dispositivo: servono supporto del target, toolchain, linker script, crate mature per la famiglia hardware e una strategia chiara per debug e flashing.

## Come funziona

Un progetto embedded Rust tipico combina piu livelli:

- **target**: descrive architettura, ABI e vincoli di compilazione;
- **startup/runtime**: inizializza stack, memoria e vettore degli interrupt;
- **PAC**: Peripheral Access Crate generata dai descrittori hardware, espone registri a basso livello;
- **HAL**: Hardware Abstraction Layer che incapsula registri e periferiche in API piu sicure;
- **BSP**: Board Support Package, cioe configurazione specifica della scheda;
- **applicazione**: logica firmware.

Spesso il crate principale contiene:

```rust
#![no_std]
#![no_main]
```

`no_std` rimuove la dipendenza dalla standard library completa. `no_main` indica che l'entry point non e il `main` standard di un programma hosted, ma una funzione gestita dal runtime embedded.

Molte API embedded usano il type system per rappresentare lo stato dell'hardware. Per esempio, un pin puo essere trasformato da input a output consumando il valore precedente e restituendo un nuovo tipo:

```rust
let pin = pins.pa5.into_push_pull_output();
```

Questo evita di usare una periferica in modalita sbagliata dopo la configurazione.

## API / Sintassi

Elementi ricorrenti:

- `#![no_std]`: disabilita `std`;
- `#![no_main]`: usa un entry point non standard;
- `panic_handler`: funzione richiesta quando non c'e runtime standard;
- `#[entry]`: attributo fornito da runtime come `cortex-m-rt` per dichiarare l'ingresso del firmware;
- `#[interrupt]`: attributo per definire handler di interrupt;
- `embedded-hal`: insieme di trait portabili per periferiche come GPIO, SPI, I2C e delay;
- `critical-section`: crate e pattern per sezioni critiche senza sistema operativo;
- `defmt`: logging compatto pensato per dispositivi embedded.

Esempio schematico:

```rust
#![no_std]
#![no_main]

use cortex_m_rt::entry;
use panic_halt as _;

#[entry]
fn main() -> ! {
    loop {
        // Logica firmware.
    }
}
```

Il codice reale dipende dalla MCU, dalla HAL e dal probe usato.

## Esempio pratico

Un pattern comune e separare inizializzazione hardware e loop applicativo:

```rust
#![no_std]
#![no_main]

use cortex_m_rt::entry;
use panic_halt as _;

struct App<L> {
    led: L,
}

impl<L> App<L>
where
    L: embedded_hal::digital::OutputPin,
{
    fn tick(&mut self) {
        let _ = self.led.toggle();
    }
}

#[entry]
fn main() -> ! {
    let peripherals = take_peripherals();
    let led = configure_led(peripherals);
    let mut app = App { led };

    loop {
        app.tick();
    }
}

# fn take_peripherals() -> () { () }
# fn configure_led(_: ()) -> FakeLed { FakeLed }
# struct FakeLed;
# impl embedded_hal::digital::ErrorType for FakeLed {
#     type Error = core::convert::Infallible;
# }
# impl embedded_hal::digital::OutputPin for FakeLed {
#     fn set_low(&mut self) -> Result<(), Self::Error> { Ok(()) }
#     fn set_high(&mut self) -> Result<(), Self::Error> { Ok(()) }
# }
# impl embedded_hal::digital::StatefulOutputPin for FakeLed {
#     fn is_set_high(&mut self) -> Result<bool, Self::Error> { Ok(false) }
#     fn is_set_low(&mut self) -> Result<bool, Self::Error> { Ok(true) }
# }
```

L'esempio mostra l'idea: la logica dell'applicazione dipende da un trait (`OutputPin`) invece che dalla periferica concreta. Questo rende piu facile testare e cambiare HAL.

## Varianti

- **Bare metal sincrono**: loop principale e interrupt, senza executor async.
- **RTIC**: framework per concorrenza real-time basata su task e priorita.
- **Embassy**: runtime async embedded con executor e driver async.
- **Firmware con allocatore**: alcuni target usano un heap limitato, ma va dimensionato e controllato.
- **Linux embedded**: non e bare metal; spesso usa `std`, syscall, file descriptor e crate normali.

## Errori comuni

- Confondere `no_std` con "niente crate": molte crate supportano `core` o `alloc`.
- Usare `unsafe` direttamente nell'applicazione invece di incapsularlo in HAL o driver.
- Ignorare il linker script: su embedded la disposizione di flash, RAM, stack e heap e parte del programma.
- Allocare dinamicamente senza sapere quanta memoria e disponibile.
- Fare lavoro lungo dentro un interrupt.
- Usare logging o panic handler troppo pesanti per il dispositivo.
- Non distinguere tra PAC, HAL e BSP.

## Checklist

- Il target Rust e installato?
- Esiste una HAL mantenuta per la MCU?
- Il progetto ha linker script, memory layout e runner configurati?
- Gli interrupt condividono stato tramite sezioni critiche o primitive adatte?
- Il panic handler e coerente con il metodo di debug?
- Il firmware e compilato in release per misurare dimensione e timing reali?
- Le astrazioni hardware espongono API sicure e confinano l'`unsafe`?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/no_std]]
- [[Programmazione/Rust/Pagine/cortex-m]]
- [[Programmazione/Rust/Pagine/embedded-hal]]
- [[Programmazione/Rust/Pagine/defmt]]
- [[Programmazione/Rust/Pagine/probe-rs]]
- [[Programmazione/Rust/Pagine/RTIC]]
- [[Programmazione/Rust/Pagine/Embassy]]
- [[Programmazione/Rust/Pagine/Allocator]]
