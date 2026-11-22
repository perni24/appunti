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
  - Embedded Rust
  - Rust embedded
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
title: Embedded Rust
---

# Embedded Rust

## Sintesi

Un firmware bare-metal non parte come un programma desktop. Prima che venga eseguita la logica Rust, il processore deve trovare il vettore di reset e uno stack valido, e il runtime deve preparare la memoria. Il target del compilatore descrive l'architettura e l'ABI: **non** dice quale pin pilota il LED né quanta RAM c'è sulla scheda.

Questa nota segue un lampeggio dall'API portabile fino a un eseguibile ARM. La scheda di riferimento è la **NUCLEO-F401RE** con STM32F401RE e LED utente LD2 attivo alto su PA5, nella configurazione standard. Non usare automaticamente pin, indirizzi o dimensioni di questo esempio su un'altra scheda.

## Quando usarlo

Usa questo modello per un firmware su microcontrollore, un driver riutilizzabile o un'applicazione con vincoli di memoria e temporizzazione. Prima di partire controlla la disponibilità di un target, una HAL per il chip e strumenti di debug. Se il dispositivo esegue Linux, spesso puoi usare `std`, file e processi: *embedded* non significa necessariamente *bare-metal*.

## Come funziona

| Livello | Domanda a cui risponde | Nell'esempio |
| --- | --- | --- |
| Target | Quali istruzioni e quale ABI deve usare il compilatore? | `thumbv7em-none-eabi` per Cortex-M4, ABI a virgola mobile software. |
| Linker e runtime | Dove vanno codice e dati? Chi esegue il reset? | `memory.x` descrive Flash e RAM; `cortex-m-rt` fornisce `link.x`, vettori e startup. |
| PAC | Come si accede ai registri di questa MCU? | `pac::Peripherals::take()` consegna i token delle periferiche del dispositivo una sola volta tramite l'API safe. |
| HAL e BSP | Come configuro una periferica? Come è cablata sulla scheda? | La HAL STM32 configura GPIO e clock. Il collegamento LD2→PA5 viene dal manuale della scheda; qui non serve una crate BSP. |
| Applicazione | Quando deve cambiare lo stato dell'uscita? | Una piccola libreria dipende solo dal trait `OutputPin` di `embedded-hal` 1.0. |

Su questo Cortex-M, al reset il processore legge dalla tabella dei vettori lo stack pointer iniziale e l'indirizzo del gestore di reset. Il runtime prepara, tra l'altro, `.data` e `.bss`, poi chiama la funzione marcata `#[entry]`. `#![no_std]` non fornisce questi passaggi; `#![no_main]` non inventa un punto di ingresso. Un firmware completo richiede anche un gestore di panic, fornito qui da `panic-halt`.

## API / Sintassi

### Separare la sequenza delle scritture dal GPIO

In una crate Cargo indipendente, questo è `Cargo.toml`. Le dipendenze di scheda sono selezionate solo per il target ARM indicato; i test nativi usano il vero trait della versione dichiarata, ma nessun registro hardware. Conserva `Cargo.lock` per riprodurre anche le versioni transitive del firmware.

```toml
[package]
name = "led_notes"
version = "0.1.0"
edition = "2024"

[dependencies]
embedded-hal = "=1.0.0"

[target.thumbv7em-none-eabi.dependencies]
cortex-m = "=0.7.7"
cortex-m-rt = "=0.7.5"
panic-halt = "=1.0.0"
stm32f4xx-hal = { version = "=0.22.1", features = ["stm32f401"] }
```

In `src/lib.rs`, `start` imposta un livello iniziale noto. Ogni `tick` richiede il livello successivo. Con `OutputPin` bastano `set_high` e `set_low`; per usare il metodo `toggle()` di `embedded-hal` 1.0 servirebbe il trait `StatefulOutputPin`. Lo stato qui registra **il prossimo comando**, non una misura del livello elettrico.

```rust
#![no_std]

use embedded_hal::digital::OutputPin;

pub struct Blink<P> {
    pin: P,
    next_high: bool,
}

impl<P: OutputPin> Blink<P> {
    pub fn start(mut pin: P) -> Result<Self, P::Error> {
        pin.set_low()?;
        Ok(Self { pin, next_high: true })
    }

    pub fn tick(&mut self) -> Result<(), P::Error> {
        if self.next_high {
            self.pin.set_high()?;
        } else {
            self.pin.set_low()?;
        }
        self.next_high = !self.next_high;
        Ok(())
    }
}
```

Un errore di scrittura viene restituito al chiamante **prima** di avanzare la sequenza. Se il chiamante riprova, chiede lo stesso livello. Non è una garanzia che l'hardware sia rimasto invariato dopo l'errore.

### Provare la logica senza scheda

In `tests/blink.rs` il pin registra i comandi e rifiuta una volta il livello alto. Il test deve osservare basso all'avvio, alto rifiutato, alto ritentato e infine basso:

```rust
use embedded_hal::digital::{ErrorKind, ErrorType, OutputPin};
use led_notes::Blink;

#[derive(Default)]
struct TestPin {
    writes: Vec<bool>,
    fail_high: bool,
}

impl ErrorType for TestPin {
    type Error = ErrorKind;
}

impl OutputPin for TestPin {
    fn set_low(&mut self) -> Result<(), Self::Error> {
        self.writes.push(false);
        Ok(())
    }

    fn set_high(&mut self) -> Result<(), Self::Error> {
        self.writes.push(true);
        if std::mem::take(&mut self.fail_high) { Err(ErrorKind::Other) } else { Ok(()) }
    }
}

#[test]
fn retries_same_level() {
    let mut pin = TestPin { fail_high: true, ..Default::default() };
    let mut blink = Blink::start(&mut pin).unwrap();
    assert_eq!(blink.tick(), Err(ErrorKind::Other));
    blink.tick().unwrap();
    blink.tick().unwrap();
    assert_eq!(pin.writes, [false, true, true, false]);
}
```

Dalla radice della crate, avvia il solo test nativo:

```sh
cargo test --test blink
```

## Esempio pratico

### Collegare il firmware per NUCLEO-F401RE

Metti `memory.x` accanto al manifest. Questa mappa assume applicazione all'inizio della Flash, senza bootloader residente che ne occupi una parte. È specifica del modello **STM32F401RE**:

```ld
MEMORY
{
  FLASH : ORIGIN = 0x08000000, LENGTH = 512K
  RAM   : ORIGIN = 0x20000000, LENGTH = 96K
}
```

In `build.rs` rendi disponibile il percorso della mappa al linker e dichiara l'input a Cargo:

```rust
fn main() {
    println!("cargo::rerun-if-changed=memory.x");
    println!("cargo::rustc-link-search={}", env!("CARGO_MANIFEST_DIR"));
}
```

In `.cargo/config.toml`, applica lo script di linking del runtime **solo** al target ARM. Non impostare un target di default: lo stesso progetto deve ancora poter eseguire i test sul computer.

```toml
[target.thumbv7em-none-eabi]
rustflags = ["-C", "link-arg=-Tlink.x"]
```

In `examples/blink.rs`, la HAL trasforma PA5 in un'uscita push-pull consumando il precedente valore del pin. SysTick fornisce il ritardo usando i clock configurati. Il LED è comandato alto e basso per circa mezzo secondo ciascuno; non si presume che il tempo di un ciclo vuoto sia stabile.

```rust
#![no_std]
#![no_main]

use cortex_m_rt::entry;
use led_notes::Blink;
use panic_halt as _;
use stm32f4xx_hal::{pac, prelude::*};

#[entry]
fn main() -> ! {
    let device = pac::Peripherals::take().unwrap();
    let core = cortex_m::Peripherals::take().unwrap();
    let clocks = device.RCC.constrain().cfgr.sysclk(48.MHz()).freeze();
    let pin = device.GPIOA.split().pa5.into_push_pull_output();
    let mut delay = core.SYST.delay(&clocks);
    let mut blink = Blink::start(pin).expect("GPIO init");
    loop {
        blink.tick().expect("GPIO write");
        delay.delay_ms(500_u32);
    }
}
```

La libreria propaga gli errori; questo binario dimostrativo sceglie di fermarsi in caso di panic. `panic-halt` non stampa automaticamente il testo di `expect`. Non serve un allocatore: il `Vec` che registra le scritture appartiene soltanto al test sul computer.

Se manca il target, questo comando ne installa le librerie nella toolchain rustup selezionata:

```sh
rustup target add thumbv7em-none-eabi
```

Per compilare **e collegare** l'eseguibile:

```sh
cargo build --release --example blink --target thumbv7em-none-eabi
```

L'artefatto atteso è l'ELF `target/thumbv7em-none-eabi/release/examples/blink`. Un ELF con tabella dei vettori all'inizio della Flash è una prova più forte di `cargo check`, ma **non** dimostra che il LED lampeggi. Per provarlo servono la scheda corretta, un probe compatibile e la verifica sul dispositivo. La build non programma la Flash; farlo in seguito può sovrascrivere il firmware presente.

## Varianti e limiti

- **Loop sincrono:** sufficiente per il LED. Il ritardo blocca il flusso principale; se il firmware deve svolgere altri compiti, valuta timer e una macchina a stati.
- **Interrupt e concorrenza:** tieni brevi i gestori e usa atomiche o sezioni critiche adatte al target per lo stato condiviso. Il possesso di un token GPIO non garantisce da solo correttezza temporale o sicurezza di ogni accesso concorrente.
- **RTIC ed Embassy:** il primo organizza task e priorità, il secondo permette flussi async con executor e driver compatibili. Non sono prerequisiti per eseguire il primo firmware.
- **Memoria e diagnostica:** l'heap è opzionale e va dimensionato quando serve. Per osservare un firmware scegli un trasporto di log compatibile con la scheda e il debugger; `defmt` e `probe-rs` svolgono ruoli diversi.

## Errori comuni

- **Il test passa, ma il LED resta spento:** il test non conosce il cablaggio. Verifica revisione della scheda, pin, polarità, configurazione GPIO e clock.
- **Il linker non trova `memory.x`:** controlla il percorso di ricerca e che la build usi lo script del runtime. Cambiare il driver del pin non risolve un errore di linking.
- **Prendere un risultato `Ok` come prova di un tempo o livello misurato:** i trait descrivono il contratto software. Verifica periodo, consumo e livelli fisici sul dispositivo.

## Checklist

- Target, feature della MCU e mappa di memoria corrispondono al chip montato?
- È chiaro chi fornisce reset, gestore di panic, clock e inizializzazione del pin?
- I test coprono ordine delle scritture ed errori, non solo la compilazione?
- Ho distinto i tre esiti: test sul computer, firmware collegato e comportamento osservato sulla scheda?

## Collegamenti

- [[Programmazione/Rust/Pagine/no_std|no_std]]
- [[Programmazione/Rust/Pagine/cortex-m|cortex-m]]
- [[Programmazione/Rust/Pagine/embedded-hal|embedded-hal]]
- [[Programmazione/Rust/Pagine/defmt|defmt]]
- [[Programmazione/Rust/Pagine/probe-rs|probe-rs]]
- [[Programmazione/Rust/Pagine/RTIC|RTIC]]
- [[Programmazione/Rust/Pagine/Embassy|Embassy]]
- [[Programmazione/Rust/Pagine/Allocator|Allocator]]

## Fonti

- STMicroelectronics: [manuale Nucleo-64 UM1724, LED LD2 e connettori](https://www.st.com/resource/en/user_manual/dm00105823-nucleo-f401re-user-manual-stmicroelectronics.pdf) e [datasheet STM32F401xD/xE, mappa di memoria](https://www.st.com/resource/en/datasheet/stm32f401re.pdf).
- [embedded-hal 1.0.0: OutputPin](https://docs.rs/embedded-hal/1.0.0/embedded_hal/digital/trait.OutputPin.html) e [StatefulOutputPin](https://docs.rs/embedded-hal/1.0.0/embedded_hal/digital/trait.StatefulOutputPin.html).
- [stm32f4xx-hal 0.22.1](https://docs.rs/stm32f4xx-hal/0.22.1/stm32f4xx_hal/) e [cortex-m-rt 0.7.5: startup e linker](https://docs.rs/cortex-m-rt/0.7.5/cortex_m_rt/).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
