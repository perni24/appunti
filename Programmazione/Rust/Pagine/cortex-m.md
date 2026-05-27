---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags:
  - programmazione
  - rust
  - embedded
aliases:
  - "cortex-m"
  - "cortex-m-rt"
  - "ARM Cortex-M"
prerequisites:
  - "[[Programmazione/Rust/Pagine/no_std]]"
  - "[[Programmazione/Rust/Pagine/Memory layout e alignment]]"
  - "[[Programmazione/Rust/Pagine/Cross-compilation]]"
related:
  - "[[Programmazione/Rust/Pagine/Embedded Rust]]"
  - "[[Programmazione/Rust/Pagine/embedded-hal]]"
  - "[[Programmazione/Rust/Pagine/probe-rs]]"
  - "[[Programmazione/Rust/Pagine/RTIC]]"
---

# cortex-m

## Sintesi

`cortex-m` e una crate per lavorare con microcontrollori ARM Cortex-M in Rust. Espone accesso a primitive e periferiche core dell'architettura, come interrupt, sezioni critiche, registri speciali, delay basati su cycle counter e istruzioni assembly utili.

La crate collegata `cortex-m-rt` fornisce il runtime di avvio per firmware bare-metal Cortex-M: entry point, reset handler, vettore degli interrupt e integrazione con linker script.

## Quando usarlo

Usa `cortex-m` e `cortex-m-rt` quando:

- sviluppi firmware per MCU ARM Cortex-M;
- hai bisogno di `#![no_std]` e `#![no_main]`;
- devi definire entry point e interrupt;
- devi configurare sezioni critiche o primitive core;
- usi PAC/HAL basate sull'ecosistema Rust embedded;
- devi integrare flashing e debug tramite `probe-rs`.

Non usarlo per architetture non Cortex-M, come RISC-V, Xtensa o Linux embedded.

## Come funziona

Un firmware Cortex-M non parte da `fn main()` come un programma desktop. All'accensione la CPU usa una tabella vettori, esegue il reset handler, inizializza memoria e poi chiama l'entry point applicativo.

`cortex-m-rt` gestisce questo startup e richiede una configurazione di memoria, di solito tramite `memory.x` o linker script equivalente.

I livelli tipici sono:

- `cortex-m`: primitive core;
- `cortex-m-rt`: startup e interrupt;
- PAC generata da SVD;
- HAL della MCU;
- applicazione embedded.

## API / Sintassi

Entry point:

```rust
#![no_std]
#![no_main]

use cortex_m_rt::entry;
use panic_halt as _;

#[entry]
fn main() -> ! {
    loop {
        cortex_m::asm::wfi();
    }
}
```

Sezione critica:

```rust
cortex_m::interrupt::free(|_cs| {
    // Accesso a stato condiviso con interrupt disabilitati.
});
```

La sezione critica va tenuta breve: blocca interrupt e puo peggiorare latenza real-time.

## Esempio pratico

Uso schematico di un interrupt:

```rust
#![no_std]
#![no_main]

use cortex_m_rt::entry;
use panic_halt as _;

#[entry]
fn main() -> ! {
    loop {
        cortex_m::asm::wfi();
    }
}

// In un progetto reale l'attributo interrupt e spesso riesportato
// dalla PAC della MCU specifica.
#[allow(non_snake_case)]
fn EXTI0() {
    // Handler interrupt specifico della periferica.
}
```

I nomi reali degli interrupt dipendono dalla PAC della MCU. Non conviene inventarli a mano fuori dal modello generato.

## Varianti

- **cortex-m**: accesso a primitive core.
- **cortex-m-rt**: runtime di startup.
- **PAC specifica**: registri e interrupt della MCU.
- **HAL specifica**: API sicure per periferiche.
- **RTIC**: framework concorrente basato su interrupt e priorita.
- **Embassy**: runtime async embedded che puo girare su Cortex-M.

## Errori comuni

- Dimenticare `memory.x` o configurarlo con flash/RAM sbagliate.
- Usare una PAC non corrispondente al chip reale.
- Tenere sezioni critiche troppo lunghe.
- Confondere interrupt core e interrupt periferici.
- Usare `static mut` direttamente senza una disciplina chiara.
- Non verificare target triple e linker script.
- Fare lavoro pesante dentro handler interrupt.

## Checklist

- Il target triple corrisponde alla CPU?
- La memoria dichiarata corrisponde alla scheda reale?
- `memory.x` e incluso nel build?
- PAC e HAL corrispondono al chip?
- Gli interrupt sono brevi?
- Lo stato condiviso e protetto?
- Flashing e debug sono configurati?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/no_std]]
- [[Programmazione/Rust/Pagine/Embedded Rust]]
- [[Programmazione/Rust/Pagine/embedded-hal]]
- [[Programmazione/Rust/Pagine/probe-rs]]
- [[Programmazione/Rust/Pagine/RTIC]]
- [[Programmazione/Rust/Pagine/Memory layout e alignment]]
- [[Programmazione/Rust/Pagine/Cross-compilation]]
