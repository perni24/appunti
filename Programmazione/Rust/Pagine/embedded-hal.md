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
  - embedded-hal
  - Embedded HAL
prerequisites:
  - "[[Programmazione/Rust/Pagine/no_std|no_std]]"
  - "[[Programmazione/Rust/Pagine/Traits|Traits]]"
  - "[[Programmazione/Rust/Pagine/Generics|Generics]]"
related:
  - "[[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]]"
  - "[[Programmazione/Rust/Pagine/cortex-m|cortex-m]]"
  - "[[Programmazione/Rust/Pagine/Embassy|Embassy]]"
  - "[[Programmazione/Rust/Pagine/RTIC|RTIC]]"
title: embedded-hal
---

# embedded-hal

## Sintesi

`embedded-hal` definisce **come un driver chiede un'operazione** a una periferica; non sa quali pin usare né come inizializzare il microcontrollore. Per esempio, un driver per il sensore LIS3DH deve conoscere il comando SPI che legge l'identificativo, ma non deve sapere se la scheda usa STM32 o RP2040. Questa nota usa i trait sincroni di **embedded-hal 1.0**.

## Chi decide cosa

| Livello | Responsabilità |
| --- | --- |
| PAC e HAL del microcontrollore | La PAC espone i registri; la HAL concreta configura e usa l'hardware e può implementare i trait di `embedded-hal`. |
| Applicazione sulla scheda | Sceglie pin, modalità SPI, frequenza, polarità del chip select (CS) e strategia di condivisione. Consegna al driver una periferica già pronta. |
| Driver portabile | Conosce il protocollo del componente: comandi, ordine dei byte, valori validi. Dipende dal trait minimo necessario e conserva l'errore restituito dalla HAL. |

«Portabile» significa che **lo stesso sorgente del driver** può usare implementazioni diverse del trait. Non garantisce che pin, livelli elettrici, frequenze o temporizzazioni della nuova scheda siano corretti.

## Scegliere il trait

- **Un'uscita digitale:** `OutputPin` comanda un livello alto o basso. Non misura la tensione sul pin. Un LED attivo basso si accende con `set_low()`; un impulso con durata minima richiede anche un riferimento temporale, per esempio `DelayNs`.
- **Un dispositivo SPI con CS:** `SpiDevice` rappresenta il dispositivo selezionato, anche su un bus condiviso. Una sola `transaction` può contenere più operazioni. L'implementazione gestisce accesso esclusivo durante la transazione, CS e completamento dei trasferimenti.
- **L'intero bus SPI:** `SpiBus` dà accesso esclusivo al bus, non seleziona da solo un determinato dispositivo. È il livello utile, per esempio, per costruire un adattatore che gestisca anche CS. Un driver che riceve già `SpiDevice` non dovrebbe commutare CS una seconda volta.
- **Un dispositivo I²C:** con `I2c::write_read` invii un indirizzo di registro e leggi la risposta nella stessa transazione con *repeated START*. Due chiamate separate a `write` e `read` inseriscono uno STOP tra le due fasi: non sono equivalenti per tutti i dispositivi.

## Esempio: riconoscere un LIS3DH via SPI

Il datasheet assegna a `WHO_AM_I` l'indirizzo `0x0F` e il valore atteso `0x33`. Per leggere un solo registro in SPI a quattro fili si imposta il bit di lettura: **`0x80 | 0x0F = 0x8F`**. Il driver invia questo byte e legge un byte di risposta **senza deselezionare il sensore**. Un ID diverso è un risultato del protocollo, non necessariamente un errore del controller SPI.

Crea una libreria, senza codice di avvio o configurazioni specifiche della scheda:

```sh
cargo new --lib sonda-hal
```

```sh
cd sonda-hal
```

In `Cargo.toml`:

```toml
[package]
name = "sonda-hal"
version = "0.1.0"
edition = "2024"

[dependencies]
embedded-hal = "=1.0.0"
```

In `src/lib.rs`:

```rust
#![no_std]

use embedded_hal::delay::DelayNs;
use embedded_hal::digital::OutputPin;
use embedded_hal::spi::{Operation, SpiDevice};

pub fn pulse_high<P: OutputPin>(
    pin: &mut P,
    delay: &mut impl DelayNs,
    duration_us: u32,
) -> Result<(), P::Error> {
    pin.set_high()?;
    delay.delay_us(duration_us);
    pin.set_low()
}

#[derive(Debug, PartialEq, Eq)]
pub enum ProbeError<E> {
    Bus(E),
    UnexpectedId(u8),
}

pub struct Lis3dh<D> {
    device: D,
}

impl<D: SpiDevice<u8>> Lis3dh<D> {
    pub fn new(device: D) -> Self {
        Self { device }
    }

    pub fn verify_id(&mut self) -> Result<(), ProbeError<D::Error>> {
        let mut id = [0u8; 1];
        self.device
            .transaction(&mut [Operation::Write(&[0x8f]), Operation::Read(&mut id)])
            .map_err(ProbeError::Bus)?;
        match id[0] {
            0x33 => Ok(()),
            other => Err(ProbeError::UnexpectedId(other)),
        }
    }

    pub fn release(self) -> D {
        self.device
    }
}
```

Perché non usare `device.write(...)` e poi `device.read(...)`? Ciascun metodo di `SpiDevice` apre e chiude una transazione: il sensore vedrebbe **due selezioni**, non due fasi dello stesso comando. Se il bus segnala un errore, l'implementazione deve tentare di rilasciare CS; non puoi dedurre dal solo `Err` lo stato elettrico finale del pin.

Il driver possiede il valore `D`, non necessariamente il controller fisico: `D` può anche essere un prestito mutabile o un adattatore a un bus condiviso. `release(self)` restituisce lo stesso valore senza clonarlo. Non occorrono heap, una PAC o un esecutore asincrono.

## Provare il protocollo senza scheda

Crea `tests/protocollo.rs`. Il doppio di test verifica **numero di transazioni, ordine delle operazioni e byte**. Se il driver divide la richiesta in due o usa un altro registro, il test fallisce anche se il valore di risposta simulato è quello giusto.

```rust
use embedded_hal::spi::{ErrorKind, ErrorType, Operation, SpiDevice};
use sonda_hal::{Lis3dh, ProbeError};

struct Script {
    reply: Result<u8, ErrorKind>,
    calls: usize,
}

impl ErrorType for Script {
    type Error = ErrorKind;
}

impl SpiDevice<u8> for Script {
    fn transaction(&mut self, ops: &mut [Operation<'_, u8>]) -> Result<(), Self::Error> {
        self.calls += 1;
        let [Operation::Write(command), Operation::Read(out)] = ops else {
            panic!("attesa una scrittura seguita da una lettura");
        };
        assert_eq!(*command, &[0x8f]);
        assert_eq!(out.len(), 1);
        out[0] = self.reply?;
        Ok(())
    }
}

#[test]
fn protocollo_e_diagnosi() {
    for (reply, expected) in [
        (Ok(0x33), Ok(())),
        (Ok(0x00), Err(ProbeError::UnexpectedId(0x00))),
        (Err(ErrorKind::Overrun), Err(ProbeError::Bus(ErrorKind::Overrun))),
    ] {
        let mut driver = Lis3dh::new(Script { reply, calls: 0 });
        assert_eq!(driver.verify_id(), expected);
        assert_eq!(driver.release().calls, 1);
    }
}
```

```sh
cargo test --test protocollo
```

Risultato atteso: **un test superato con tre casi**. Per controllare separatamente che la libreria compili dove `std` non è disponibile, installa il target ARM se manca, poi costruisci **solo la libreria**:

```sh
rustup target add thumbv7em-none-eabi
```

```sh
cargo build --release --lib --target thumbv7em-none-eabi
```

La build produce una `rlib`, non un firmware avviabile. Il test sull'host verifica ciò che il driver chiede alla HAL; non osserva il fronte di CS, la frequenza di clock o la presenza del sensore. Per verificare questi aspetti servono una scheda configurata e, per le temporizzazioni, una misura sul bus.

## Errori comuni e varianti

| Situazione | Come interpretarla |
| --- | --- |
| Il trait sembra corretto, ma Rust dice che non è implementato | Verifica il tipo concreto, `SpiBus` contro `SpiDevice` e le versioni nel grafo con `cargo tree -d`. I trait della serie 0.2 non sono quelli della 1.0. |
| Leggo sempre `0x00` o `0xFF`, ma la transazione restituisce `Ok` | SPI non ha una conferma di presenza equivalente all'ACK di I²C. Controlla selezione, alimentazione, linee e modalità: il valore da solo non identifica la causa. Anche `0x33` è un controllo di coerenza, non un'identità univoca della scheda. |
| Due driver devono condividere la periferica | Dai a ciascuno un dispositivo con il proprio CS e un meccanismo comune di esclusione; `embedded-hal-bus` offre adattatori. Un `&mut` su un singolo driver non coordina automaticamente gli altri utilizzatori del bus. |
| Il firmware deve svolgere altro lavoro durante l'I/O | Distingui i trait sincroni di questa nota dagli equivalenti di `embedded-hal-async` e dalle operazioni di `embedded-hal-nb` che possono restituire `WouldBlock`. Ripetere in ciclo una chiamata non bloccante non rende l'attesa asincrona. |

## Fonti ufficiali

- [embedded-hal 1.0: bus, device e contratto della transazione SPI](https://github.com/rust-embedded/embedded-hal/blob/embedded-hal-v1.0.0/embedded-hal/src/spi.rs)
- [embedded-hal 1.0: OutputPin](https://docs.rs/embedded-hal/1.0.0/embedded_hal/digital/trait.OutputPin.html) e [transazioni I²C](https://docs.rs/embedded-hal/1.0.0/embedded_hal/i2c/trait.I2c.html).
- [STMicroelectronics: datasheet LIS3DH](https://www.st.com/resource/en/datasheet/lis3dh.pdf), sezioni 6.2.1 (lettura SPI) e 8.5 (registro WHO_AM_I).

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/no_std|no_std]]
- [[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]]
- [[Programmazione/Rust/Pagine/cortex-m|cortex-m]]
- [[Programmazione/Rust/Pagine/Embassy|Embassy]]
- [[Programmazione/Rust/Pagine/RTIC|RTIC]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Generics|Generics]]
