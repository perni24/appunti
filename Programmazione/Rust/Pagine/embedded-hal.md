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
  - "embedded-hal"
  - "Embedded HAL"
prerequisites:
  - "[[Programmazione/Rust/Pagine/no_std]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Generics]]"
related:
  - "[[Programmazione/Rust/Pagine/Embedded Rust]]"
  - "[[Programmazione/Rust/Pagine/cortex-m]]"
  - "[[Programmazione/Rust/Pagine/Embassy]]"
  - "[[Programmazione/Rust/Pagine/RTIC]]"
---

# embedded-hal

## Sintesi

`embedded-hal` e una crate che definisce trait comuni per periferiche embedded, per esempio GPIO, SPI, I2C, delay e digital I/O. Non implementa driver per una scheda specifica: fornisce interfacce condivise che le HAL delle varie famiglie di microcontrollori possono implementare.

Il valore principale e la portabilita: un driver scritto contro i trait di `embedded-hal` puo funzionare con microcontrollori diversi, a patto che la loro HAL implementi gli stessi trait.

## Quando usarlo

Usa `embedded-hal` quando:

- scrivi driver portabili per sensori, display o periferiche;
- vuoi separare logica applicativa e hardware concreto;
- devi supportare piu microcontrollori;
- vuoi testare codice embedded con mock o implementazioni fittizie;
- una HAL della scheda espone periferiche tramite trait standard;
- vuoi evitare dipendenze dirette da una PAC o HAL specifica nel driver.

Non serve quando stai scrivendo codice totalmente specifico per una periferica interna della MCU e non hai bisogno di portabilita.

## Come funziona

L'architettura embedded Rust tipica ha piu livelli:

- **PAC**: accesso ai registri della MCU;
- **HAL concreta**: wrapper sicuro attorno alla PAC;
- **embedded-hal**: trait comuni;
- **driver portabile**: dipende dai trait, non dalla scheda;
- **applicazione**: combina driver e periferiche reali.

Un driver non dovrebbe sapere se l'I2C arriva da STM32, nRF, RP2040 o ESP. Dovrebbe sapere solo che ha un tipo che implementa il trait richiesto.

I trait usano associated types per rappresentare errori e permettere a ogni implementazione di esporre il proprio tipo di errore.

## API / Sintassi

Esempio di funzione generica su un pin di output:

```rust
use embedded_hal::digital::OutputPin;

fn pulse<P>(pin: &mut P) -> Result<(), P::Error>
where
    P: OutputPin,
{
    pin.set_high()?;
    pin.set_low()?;
    Ok(())
}
```

Esempio di driver generico:

```rust
use embedded_hal::digital::OutputPin;

pub struct Led<P> {
    pin: P,
}

impl<P> Led<P>
where
    P: OutputPin,
{
    pub fn new(pin: P) -> Self {
        Self { pin }
    }

    pub fn on(&mut self) -> Result<(), P::Error> {
        self.pin.set_high()
    }
}
```

Il driver possiede il pin: questo impedisce di usarlo contemporaneamente in un altro punto del firmware.

## Esempio pratico

Driver per una periferica che usa un pin `chip select`:

```rust
use embedded_hal::digital::OutputPin;

pub struct Device<CS> {
    cs: CS,
}

impl<CS> Device<CS>
where
    CS: OutputPin,
{
    pub fn new(mut cs: CS) -> Result<Self, CS::Error> {
        cs.set_high()?;
        Ok(Self { cs })
    }

    pub fn transaction(&mut self) -> Result<(), CS::Error> {
        self.cs.set_low()?;
        // Qui avverrebbe lo scambio SPI.
        self.cs.set_high()?;
        Ok(())
    }
}
```

Il driver non conosce la board. L'applicazione passa un pin concreto configurato dalla HAL della scheda.

## Varianti

- **embedded-hal blocking**: trait sincroni per operazioni che terminano prima di restituire.
- **embedded-hal-async**: trait async per driver e HAL che usano `async/await`.
- **embedded-hal-nb**: supporto non-blocking con modello basato su `nb`.
- **embedded-hal-bus**: helper per bus condivisi come SPI e I2C.
- **HAL vendor-specific**: implementazioni concrete per famiglie hardware.
- **driver crate**: crate portabili che dipendono solo dai trait.

## Errori comuni

- Scrivere un driver legato a una HAL specifica senza necessita.
- Nascondere errori hardware convertendoli subito in `()`.
- Condividere bus o pin senza una strategia di ownership.
- Confondere PAC, HAL e driver.
- Usare trait async in un progetto senza executor adatto.
- Fare busy wait in driver che dovrebbero essere non-blocking.
- Esporre nel driver dettagli della board invece del dispositivo.

## Checklist

- Il driver dipende da trait e non da una board specifica?
- Gli errori della periferica sono propagati?
- Ownership di pin e bus e chiara?
- Serve blocking, non-blocking o async?
- Il bus condiviso e gestito da un wrapper appropriato?
- Il driver puo essere testato con una implementazione mock?
- Le dipendenze supportano `no_std`?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/no_std]]
- [[Programmazione/Rust/Pagine/Embedded Rust]]
- [[Programmazione/Rust/Pagine/cortex-m]]
- [[Programmazione/Rust/Pagine/Embassy]]
- [[Programmazione/Rust/Pagine/RTIC]]
- [[Programmazione/Rust/Pagine/Traits]]
- [[Programmazione/Rust/Pagine/Generics]]
