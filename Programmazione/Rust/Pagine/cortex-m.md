---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - embedded
aliases:
  - cortex-m
  - cortex-m-rt
  - ARM Cortex-M
prerequisites:
  - "[[Programmazione/Rust/Pagine/no_std|no_std]]"
  - "[[Programmazione/Rust/Pagine/Memory layout e alignment|Memory layout e alignment]]"
  - "[[Programmazione/Rust/Pagine/Cross-compilation|Cross-compilation]]"
related:
  - "[[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]]"
  - "[[Programmazione/Rust/Pagine/embedded-hal|embedded-hal]]"
  - "[[Programmazione/Rust/Pagine/probe-rs|probe-rs]]"
  - "[[Programmazione/Rust/Pagine/RTIC|RTIC]]"
title: cortex-m
---

# cortex-m

## Sintesi

`cortex-m` dà accesso al **processore**: per esempio mette in pausa il core con `wfi()` o configura il suo timer SysTick. Non sa quale pin accende il LED della scheda. `cortex-m-rt` risolve un altro problema: prepara il firmware all'avvio e collega le funzioni Rust ai vettori delle eccezioni. Per GPIO, UART e altre periferiche del microcontrollore servono invece la PAC (*Peripheral Access Crate*) o la HAL del chip.

## Quando usarlo

| Devo... | Dove guardare |
| --- | --- |
| Accedere a SysTick, NVIC o registri del core | `cortex-m`; controllare nel manuale quali unità sono presenti. Per esempio il contatore di cicli DWT non è universale. |
| Scegliere la funzione di ingresso o gestire l'eccezione SysTick | `cortex-m-rt`: attributi `#[entry]` e `#[exception]`. |
| Reagire a un pin o a una UART | PAC/HAL del microcontrollore: nome dell'IRQ, configurazione della sorgente e gestione dei flag. |
| Far convivere più attività a priorità diverse | Valutare [[Programmazione/Rust/Pagine/RTIC\|RTIC]] o [[Programmazione/Rust/Pagine/Embassy\|Embassy]] prima di prendere il controllo di un timer già usato dal framework. |

Queste crate riguardano i Cortex-M bare-metal: non sono un runtime per un'applicazione Linux o per un chip RISC-V.

## Come funziona

Al reset, il core legge dalla tabella dei vettori il puntatore di stack iniziale e l'indirizzo del gestore di reset. Il runtime inizializza la memoria statica (tra l'altro copia `.data` e azzera `.bss`) prima di chiamare la funzione marcata `#[entry]`. Il linker deve conoscere la memoria **del dispositivo**, non soltanto il target Rust.

Un vettore contiene un **indirizzo**, non il nome di una funzione Rust. Ecco perché `fn EXTI0()`, da sola, può compilare senza mai essere chiamata:

- **SysTick è un'eccezione del core**, vettore numero 15 contando da zero. Il runtime collega `#[exception] fn SysTick()`; l'abilitazione della richiesta avviene nel registro di controllo di SysTick.
- **Un IRQ esterno appartiene al chip**. Si usa l'attributo `#[interrupt]` esposto dalla PAC con il nome previsto per quel modello (abilitando il supporto runtime della PAC, quando richiesto). Occorre anche configurare la periferica, gestire il suo flag come da manuale e abilitare la linea nel NVIC. L'attributo collega il gestore, non abilita la sorgente.

## Esempio pratico: attendere 1 000 tick

Il firmware avvia SysTick, attende che il gestore sia stato eseguito almeno 1 000 volte, poi ferma il timer. Non usa pin, non scrive sulla seriale e non richiede una PAC. L'esempio assume un microcontrollore **single-core**, SysTick disponibile e un clock del processore **già a 16 MHz**. La costante non configura il clock: se la scheda o il bootloader lo hanno cambiato, usare la frequenza effettiva.

### Calcolare il periodo senza hardware

In un progetto vuoto, questo è il `Cargo.toml`. Le dipendenze del firmware sono limitate al target bare-metal: il calcolo si può provare sul computer.

```toml
[package]
name = "tick_notes"
version = "0.1.0"
edition = "2024"

[target.'cfg(all(target_arch = "arm", target_os = "none"))'.dependencies]
cortex-m = "=0.7.7"
cortex-m-rt = "=0.7.5"
panic-halt = "=1.0.0"
```

SysTick conta all'indietro. A regime il periodo è `LOAD + 1` cicli: a 16 MHz, per 1 kHz servono 16 000 cicli e quindi **LOAD = 15 999**. Il registro è a 24 bit; zero non produce la transizione da 1 a 0 necessaria per il tick periodico. In `src/lib.rs` rifiutiamo anche i rapporti non interi: è una scelta dell'esempio per non arrotondare la frequenza in silenzio.

```rust
#![no_std]

pub fn reload_for(core_hz: u32, tick_hz: u32) -> Option<u32> {
    if tick_hz == 0 || core_hz % tick_hz != 0 {
        return None;
    }
    let cycles = core_hz / tick_hz;
    (2..=0x0100_0000).contains(&cycles).then(|| cycles - 1)
}

#[cfg(test)]
mod tests {
    use super::reload_for;

    #[test]
    fn exact_period_and_limits() {
        assert_eq!(reload_for(16_000_000, 1_000), Some(15_999));
        assert_eq!(reload_for(2, 1), Some(1));
        assert_eq!(reload_for(0x0100_0000, 1), Some(0x00ff_ffff));
        for (clock, rate) in [(16, 0), (0, 1), (1, 1), (16, 3), (0x0100_0001, 1)] {
            assert_eq!(reload_for(clock, rate), None);
        }
    }
}
```

### Collegare il timer al gestore

In `examples/tick.rs`, `Peripherals::take()` consegna una sola volta i riferimenti proprietari alle periferiche del core. Non richiamarlo per ottenere un secondo SysTick: passa invece il valore al codice che lo deve configurare.

```rust
#![no_std]
#![no_main]

use core::cell::Cell;
use cortex_m::{
    asm,
    interrupt::{free, Mutex},
    peripheral::{syst::SystClkSource, Peripherals},
};
use cortex_m_rt::{entry, exception};
use panic_halt as _;
use tick_notes::reload_for;

static TICKS: Mutex<Cell<u32>> = Mutex::new(Cell::new(0));

#[entry]
fn main() -> ! {
    let mut timer = Peripherals::take().unwrap().SYST;
    let reload = reload_for(16_000_000, 1_000).unwrap();
    timer.set_clock_source(SystClkSource::Core);
    timer.set_reload(reload);
    timer.clear_current();
    timer.enable_interrupt();
    timer.enable_counter();

    loop {
        asm::wfi();
        if free(|cs| TICKS.borrow(cs).get()) >= 1_000 {
            break;
        }
    }
    timer.disable_counter();
    timer.disable_interrupt();
    loop { asm::wfi(); }
}

#[exception]
fn SysTick() {
    free(|cs| {
        let ticks = TICKS.borrow(cs);
        ticks.set(ticks.get().wrapping_add(1));
    });
}
```

`wfi()` attende un evento di risveglio, **non** un millisecondo né necessariamente SysTick. Per questo il ciclo legge il contatore impostato dal gestore dopo ogni risveglio. `TICKS` conta gli ingressi nel gestore, non il tempo assoluto: se le eccezioni restano mascherate per più periodi, diverse scadenze possono lasciare una sola richiesta pendente.

`interrupt::free` salva e ripristina lo stato della maschera degli interrupt del core corrente. Qui rende indivisibile l'accesso a `Cell` rispetto a SysTick; **non** esclude NMI, HardFault, DMA o un secondo core. Tenere nella sezione critica solo l'accesso al dato, mai una stampa, un'attesa o un'operazione lenta.

### Verificare senza programmare la scheda

Dalla radice del progetto, eseguire il test aritmetico sull'host:

```sh
cargo test --lib
```

Per ottenere un ELF per **NUCLEO-F401RE** senza bootloader, riprendere `memory.x`, `build.rs` e `.cargo/config.toml` dalla sezione «Collegare il firmware per NUCLEO-F401RE» di [[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]]. Installare il target, se manca:

```sh
rustup target add thumbv7em-none-eabi
```

Compilare e collegare il firmware, senza eseguire il flash:

```sh
cargo build --release --example tick --target thumbv7em-none-eabi
```

Il risultato è `target/thumbv7em-none-eabi/release/examples/tick`. Nel file ELF, la parola a offset `15 × 4 = 60` della sezione `.vector_table` deve contenere l'indirizzo di `SysTick` con il bit Thumb impostato, non quello di `DefaultHandler`. Questa verifica distingue un gestore collegato da una normale funzione con lo stesso nome. Non dimostra la frequenza reale: su scheda, un breakpoint sulla riga `timer.disable_counter()` verifica che la soglia sia stata raggiunta; una misura separata serve per verificare il periodo.

## Errori comuni

| Sintomo | Primo controllo |
| --- | --- |
| Il binario compila ma il gestore non parte | Controllare separatamente vettore, abilitazione della sorgente e maschera degli interrupt. Per SysTick non cercare un IRQ esterno da abilitare. |
| Il tick arriva con regolarità ma al ritmo sbagliato | Verificare quale clock alimenta SysTick e il valore `LOAD + 1`; non dedurre il clock dalla frequenza massima stampata sul datasheet. |
| Un'altra libreria non riesce a ottenere le periferiche del core | Verificare chi ha già chiamato `take()`. Non usare `steal()` per eludere l'esclusività. |
| Il firmware non arriva a `main` | Prima del timer verificare modello, origine di Flash e RAM in `memory.x`, vettori e script del linker. |

## Fonti

- [cortex-m 0.7.7: metodi di SYST](https://docs.rs/cortex-m/0.7.7/cortex_m/peripheral/struct.SYST.html) e [sezioni critiche con interrupt::free](https://docs.rs/cortex-m/0.7.7/cortex_m/interrupt/fn.free.html).
- [cortex-m-rt 0.7.5: runtime e tabella dei vettori](https://docs.rs/cortex-m-rt/0.7.5/cortex_m_rt/) e [The Embedded Rust Book: eccezioni](https://docs.rust-embedded.org/book/start/exceptions.html).
- [ST, manuale di programmazione Cortex-M4, §4.5.2: registro STK_LOAD](https://www.st.com/resource/en/programming_manual/pm0214-stm32-cortexm4-mcus-and-mpus-programming-manual-stmicroelectronics.pdf).

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/no_std|no_std]]
- [[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]]
- [[Programmazione/Rust/Pagine/embedded-hal|embedded-hal]]
- [[Programmazione/Rust/Pagine/probe-rs|probe-rs]]
- [[Programmazione/Rust/Pagine/RTIC|RTIC]]
- [[Programmazione/Rust/Pagine/Memory layout e alignment|Memory layout e alignment]]
- [[Programmazione/Rust/Pagine/Cross-compilation|Cross-compilation]]
