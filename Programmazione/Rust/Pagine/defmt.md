---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - embedded
aliases:
  - defmt
prerequisites:
  - "[[Programmazione/Rust/Pagine/no_std|no_std]]"
  - "[[Programmazione/Rust/Pagine/probe-rs|probe-rs]]"
  - "[[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]]"
related:
  - "[[Programmazione/Rust/Pagine/Logging con log|Logging con log]]"
  - "[[Programmazione/Rust/Pagine/Tracing con tracing|Tracing con tracing]]"
  - "[[Programmazione/Rust/Pagine/RTIC|RTIC]]"
  - "[[Programmazione/Rust/Pagine/Embassy|Embassy]]"
title: defmt
---

# defmt

## Sintesi

Con `defmt` il microcontrollore non costruisce la riga di testo che si vede sul PC. Per un messaggio come `supply=2980 mV` invia un identificatore e il valore numerico; il computer ricostruisce la frase usando la tabella dei formati nell'**ELF della stessa build**. Questo riduce il lavoro di formattazione sul dispositivo e i byte da trasferire per messaggi ripetuti.

**RTT è il trasporto, non il formato.** In questo esempio `defmt-rtt` scrive i frame in un buffer in RAM; la sonda li legge e `probe-rs` li decodifica sul PC. Un terminale seriale non può leggere quel buffer e interpretare i byte come testo. Per un'applicazione con `std` che scrive su console o raccoglie eventi strutturati, vedere invece [[Programmazione/Rust/Pagine/Logging con log|log]] e [[Programmazione/Rust/Pagine/Tracing con tracing|tracing]].

## Esempio: leggere una misura sul PC

Il firmware per **NUCLEO-F401RE** emette una misura di esempio all'avvio, segnala se è sotto soglia e poi resta in attesa. Il valore è fisso: non servono sensori, pin o un ADC per provare la catena di logging. L'esempio è un progetto distinto da `blink`.

### 1. Configurare firmware e linker

In una directory di progetto, inserire questo `Cargo.toml`. Riutilizzare `memory.x` e `build.rs` dalla sezione «Collegare il firmware per NUCLEO-F401RE» di [[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]]: quella mappa presume un'applicazione all'inizio della Flash senza bootloader.

```toml
[package]
name = "reading-log"
version = "0.1.0"
edition = "2024"

[dependencies]
cortex-m = { version = "=0.7.7", features = ["critical-section-single-core"] }
cortex-m-rt = "=0.7.5"
defmt = "=1.2.0"
defmt-rtt = "=1.3.1"
panic-probe = { version = "=1.0.0", features = ["print-defmt"] }

[profile.release]
debug = 1
```

Il binario deve collegare **un solo logger globale**. Qui lo fornisce `defmt-rtt`; una libreria che chiama le macro lascia invece la scelta del logger al binario. Il backend RTT usa una sezione critica per serializzare le scritture: la feature di `cortex-m` scelta qui è per questo Cortex-M **single-core** in modalità privilegiata, non una configurazione da copiare su qualsiasi chip.

In `.cargo/config.toml` tenere entrambi gli script: `link.x` per l'avvio Cortex-M e `defmt.x` per i metadati dei log. La variabile di build rende visibili i messaggi dal livello `info` in su, salvo un valore di `DEFMT_LOG` già esportato nella shell.

```toml
[target.thumbv7em-none-eabi]
rustflags = ["-C", "link-arg=-Tlink.x", "-C", "link-arg=-Tdefmt.x"]

[env]
DEFMT_LOG = "info"
```

### 2. Emettere dati tipizzati

In `src/main.rs`, l'importazione di `defmt_rtt` collega il logger anche se non lo si chiama direttamente. `panic_probe` ha un ruolo diverso: è il panic handler; la feature `print-defmt` gli permette di inviare il messaggio di panic tramite il logger scelto. Non aggiungere un secondo panic handler come `panic-halt`.

```rust
#![no_std]
#![no_main]

use cortex_m_rt::entry;
use defmt_rtt as _;
use panic_probe as _;

#[derive(defmt::Format)]
struct Reading {
    sample_id: u8,
    supply_mv: u16,
}

#[entry]
fn main() -> ! {
    let reading = Reading { sample_id: 7, supply_mv: 2_980 };
    defmt::info!("supply={=u16} mV", reading.supply_mv);
    defmt::debug!("sample={}", reading);
    if reading.supply_mv < 3_000 {
        defmt::warn!("supply below threshold");
    }
    loop { cortex_m::asm::wfi(); }
}
```

`{=u16}` dichiara il tipo del valore trasmesso; l'unità `mV` resta nel formato. Per `sample={}` si passa l'intera struttura: `#[derive(defmt::Format)]` descrive i campi al decoder. Derivare soltanto `core::fmt::Debug` non implementa `defmt::Format`.

### 3. Compilare e leggere

Con il target Rust `thumbv7em-none-eabi` installato, questo comando **compila senza accedere alla scheda**:

```sh
cargo build --release --target thumbv7em-none-eabi
```

Per provarlo su hardware, verificare prima modello, mappa di memoria e sonda come in [[Programmazione/Rust/Pagine/probe-rs|probe-rs]]. Il comando seguente **scrive la Flash e avvia il firmware**, sostituendo l'applicazione nelle regioni interessate; è riportato per la CLI probe-rs 0.32.0:

```sh
probe-rs run --chip STM32F401RETx target/thumbv7em-none-eabi/release/reading-log
```

Con il filtro `info`, sono attesi questi due messaggi applicativi (prefissi e posizione del sorgente possono variare):

```text
INFO supply=2980 mV
WARN supply below threshold
```

Per vedere anche la struttura, cambiare `DEFMT_LOG` in `debug`, **ricompilare e programmare la nuova build**. Il filtro decide quali chiamate includere **alla compilazione**: cambiare soltanto il livello sul PC non recupera un messaggio escluso. Senza alcun filtro esplicito, tra le cinque macro di livello (`trace!`, `debug!`, `info!`, `warn!`, `error!`) è abilitata solo `error!`.

Se il firmware è già programmato, si può ascoltare il canale senza un nuovo flash o reset:

```sh
probe-rs attach --chip STM32F401RETx target/thumbv7em-none-eabi/release/reading-log
```

Passare l'**ELF esatto** della build sulla scheda, non un `.bin` o l'ultima ricompilazione. L'esempio emette i messaggi una volta sola: collegarsi dopo non li fa ripartire e non garantisce che siano ancora nel buffer.

## Diagnosi rapida

| Sintomo | Cosa distinguere |
| --- | --- |
| Il firmware non arriva al link | Verificare che ci siano `defmt.x`, un solo logger e un'implementazione di `critical-section` adatta al target. Il panic handler non sostituisce nessuno dei tre. |
| Si vede l'avviso ma non la struttura | Il canale funziona. Controllare il filtro usato per **costruire la build programmata**, non il cavo USB. |
| Il decoder segnala metadati mancanti o messaggi incoerenti | Controllare prima la corrispondenza tra ELF e firmware, poi che il decoder supporti la versione del formato. Conservare l'ELF con i simboli insieme alla release. |
| Il firmware sembra fermarsi quando il lettore si scollega | In modalità RTT bloccante, se il buffer si riempie il produttore può restare in attesa. Una modalità non bloccante può invece perdere dati: scegliere consapevolmente e limitare i log nei percorsi sensibili alla latenza. |

Un timestamp o l'istante in cui il PC mostra una riga non misura da solo la durata di un interrupt: buffering, lettura della sonda e decodifica introducono ritardo. Per misure temporali vedere [[Programmazione/Rust/Pagine/cortex-m|timer del core e SysTick]].

## Fonti

- [defmt book: configurazione del binario e del linker](https://defmt.ferrous-systems.com/setup), [filtri di compilazione](https://defmt.ferrous-systems.com/filtering) e [tipi che implementano Format](https://defmt.ferrous-systems.com/format).
- [defmt 1.2.0: compatibilità del decoder](https://docs.rs/defmt/1.2.0/defmt/), [defmt-rtt 1.3.1: buffering e sezioni critiche](https://docs.rs/defmt-rtt/1.3.1/defmt_rtt/) e [panic-probe 1.0.0: opzione print-defmt](https://docs.rs/panic-probe/1.0.0/panic_probe/).
- [probe-rs: differenza tra run e attach](https://probe.rs/docs/tools/probe-rs/).

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/no_std|no_std]]
- [[Programmazione/Rust/Pagine/probe-rs|probe-rs]]
- [[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]]
- [[Programmazione/Rust/Pagine/Logging con log|Logging con log]]
- [[Programmazione/Rust/Pagine/Tracing con tracing|Tracing con tracing]]
- [[Programmazione/Rust/Pagine/RTIC|RTIC]]
- [[Programmazione/Rust/Pagine/Embassy|Embassy]]
