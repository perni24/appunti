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
  - Embassy
  - Embassy async
prerequisites:
  - "[[Programmazione/Rust/Pagine/no_std|no_std]]"
  - "[[Programmazione/Rust/Pagine/Async Await|Async Await]]"
  - "[[Programmazione/Rust/Pagine/Future Trait|Future Trait]]"
related:
  - "[[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]]"
  - "[[Programmazione/Rust/Pagine/embedded-hal|embedded-hal]]"
  - "[[Programmazione/Rust/Pagine/RTIC|RTIC]]"
  - "[[Programmazione/Rust/Pagine/defmt|defmt]]"
  - "[[Programmazione/Rust/Pagine/Channel async|Channel async]]"
title: Embassy
---

# Embassy

## Sintesi

Embassy permette di scrivere firmware Rust in cui un task può **aspettare senza tenere occupato il core**. Un task chiede, per esempio, di ripartire fra 250 ms. Se il timer non è scaduto, la sua future restituisce `Pending`; l'executor può eseguire un altro task o attendere un evento. Alla scadenza il driver risveglia il task, che riprende quando l'executor lo esamina di nuovo. Il codice dopo `.await` non viene eseguito direttamente dall'interrupt del timer.

Sullo stesso executor la concorrenza è **cooperativa**: un calcolo lungo, un'attesa attiva o una chiamata bloccante ritardano gli altri task. Scrivere `.await` non garantisce di cedere il controllo: una future già pronta può restituire subito `Ready`. Per il modello sottostante vedere [[Programmazione/Rust/Pagine/Future Trait|Future]].

## Esempio: dal timer al LED

Su una **NUCLEO-F401RE** facciamo lampeggiare il LED utente LD2, collegato a PA5 nella configurazione standard. Un solo task sarebbe sufficiente per un semplice lampeggio; qui ne usiamo due per osservare separatamente **chi attende il tempo** e **chi possiede il pin**.

| Componente | Responsabilità nell'esempio |
| --- | --- |
| `embassy-executor` | Esegue `main` e il produttore sullo stesso core, in modalità thread. Un task non è un thread del sistema operativo. |
| `embassy-time` + HAL STM32 | `Timer` esprime la scadenza; la HAL configura **TIM2** come driver del tempo. La sola dipendenza da `embassy-time` non basta a fornire un orologio. |
| `embassy-sync` | Un canale di capacità **uno** conserva il prossimo livello. Se è pieno, il produttore attende senza sovrascrivere il valore precedente. |
| `embassy-stm32::gpio` | Solo il consumatore in `main` possiede l'uscita PA5. Non occorre un mutex sul GPIO. |

### Configurare il target

Partire da un progetto binario indipendente. Questo è il `Cargo.toml`; le versioni fissate rendono esplicita la sintassi di spawn usata più sotto.

```toml
[package]
name = "embassy-levels"
version = "0.1.0"
edition = "2024"

[dependencies]
cortex-m = { version = "=0.7.9", features = ["critical-section-single-core"] }
cortex-m-rt = "=0.7.5"
embassy-executor = { version = "=0.10.0", features = ["platform-cortex-m", "executor-thread"] }
embassy-stm32 = { version = "=0.6.0", features = ["stm32f401re", "memory-x", "time-driver-tim2"] }
embassy-sync = "=0.8.0"
embassy-time = "=0.5.1"
panic-halt = "=1.0.0"
```

In `.cargo/config.toml`, passare al linker lo script del runtime Cortex-M:

```toml
[target.thumbv7em-none-eabi]
rustflags = ["-C", "link-arg=-Tlink.x"]
```

`memory-x` genera la mappa per il chip selezionato: per questo esempio **senza bootloader** non serve copiare un secondo `memory.x`. La feature `time-driver-tim2` riserva TIM2: non assegnarlo anche a un driver applicativo. La sezione critica scelta è adatta a questo Cortex-M single-core, non a un sistema multicore generico.

### Produrre un livello senza toccare il pin

In `src/levels.rs` il produttore non dipende dai GPIO. Il canale è statico perché vive quanto i due task; non richiede allocazioni dinamiche.

```rust
use embassy_sync::blocking_mutex::raw::CriticalSectionRawMutex;
use embassy_sync::channel::Channel;
use embassy_time::Timer;

pub static LEVELS: Channel<CriticalSectionRawMutex, bool, 1> = Channel::new();

#[embassy_executor::task]
pub async fn produce() {
    let mut high = true;
    loop {
        Timer::after_millis(250).await;
        LEVELS.send(high).await;
        high = !high;
    }
}
```

Il primo livello inviato è alto. Il timer successivo parte **dopo** l'invio: se il consumatore rallenta e il canale è pieno, anche il periodo si allunga. È la scelta giusta qui per conservare l'ordine dei comandi. Se serve una cadenza riferita a scadenze regolari, valutare `embassy_time::Ticker`; non garantisce comunque che il lavoro finisca puntuale. Se conta solo **l'ultimo stato**, un `Signal` può invece sostituire il valore ancora non letto.

### Avviare e consumare

In `src/main.rs`, inizializzare la HAL prima di usare il timer, impostare il LED spento e avviare il produttore **una volta sola**:

```rust
#![no_std]
#![no_main]

mod levels;

use embassy_executor::Spawner;
use embassy_stm32::gpio::{Level, Output, Speed};
use panic_halt as _;

#[embassy_executor::main]
async fn main(spawner: Spawner) {
    let p = embassy_stm32::init(Default::default());
    let mut led = Output::new(p.PA5, Level::Low, Speed::Low);

    let token = levels::produce().expect("producer already active");
    spawner.spawn(token);

    loop {
        let high = levels::LEVELS.receive().await;
        led.set_level(if high { Level::High } else { Level::Low });
    }
}
```

Con **embassy-executor 0.10.0** è la chiamata a `produce()` che prova a riservare un posto nel pool e restituisce il token o `SpawnError::Busy`; `Spawner::spawn(token)` restituisce `()`. Qui `expect` segnala un errore di programmazione: il produttore ha una sola istanza, parte da `main` e non termina. Se l'avvio dipende da eventi ripetuti, gestire `Busy` o inviare un messaggio al task esistente. Aumentare `pool_size` riserva RAM per altre istanze; **non** aumenta la capacità del canale.

### Verificare l'effetto

Con il target installato, dalla radice del progetto compilare **senza collegare né programmare una scheda**:

```sh
cargo build --release --target thumbv7em-none-eabi
```

Solo per la prova sulla scheda corretta: il comando seguente **scrive la Flash e avvia l'immagine**. Controllare modello e sonda come in [[Programmazione/Rust/Pagine/probe-rs|probe-rs]].

```sh
probe-rs run --chip STM32F401RETx target/thumbv7em-none-eabi/release/embassy-levels
```

Il risultato atteso è LD2 inizialmente spento, poi acceso dopo la prima attesa e spento dopo la seconda: **250 ms nominali tra cambi di livello, circa 500 ms per il ciclo completo**, se il consumatore tiene il passo. Il programma non stampa nulla: non include il logger [[Programmazione/Rust/Pagine/defmt|defmt]]. Per verificare il periodo reale occorre misurare PA5; una build riuscita non lo dimostra.

## Diagnosi e scelte

- **Non collega, con riferimenti mancanti a `_embassy_time_…`:** controllare prima la feature del driver del tempo e il target. Deve esserci un solo driver globale nel firmware.
- **Dopo l'avvio il LED non cambia:** distinguere il risveglio del produttore dal comando al GPIO. Controllare l'inizializzazione della HAL, la riserva di TIM2, il cablaggio di LD2 e l'eventuale presenza di codice che occupa lo stesso executor senza sospendersi.
- **Il produttore resta su `send().await`:** verificare che il consumatore legga. Un canale pieno è un'attesa prevista; `try_send` serve quando il chiamante deve reagire subito al pieno.
- **La RAM cresce aggiungendo task:** i valori conservati attraverso un `.await` fanno parte dello stato della future. Controllare buffer locali persistenti, capacità dei canali e numero di istanze, non soltanto lo stack.
- **Embassy o RTIC?** Qui timer e canale descrivono bene due attività quasi sempre in attesa. Quando il requisito centrale riguarda priorità, preemption e tetti sulle risorse, confrontare [[Programmazione/Rust/Pagine/RTIC|RTIC]]. Embassy supporta anche executor su interrupt: l'esempio usa deliberatamente solo l'executor in modalità thread. Networking e USB sono componenti opzionali, non prerequisiti per usare i task.

## Fonti

- [Embassy executor 0.10.0: Spawner](https://docs.rs/embassy-executor/0.10.0/embassy_executor/struct.Spawner.html) e [limite di istanze e SpawnError](https://docs.rs/embassy-executor/0.10.0/embassy_executor/enum.SpawnError.html).
- [Embassy time 0.5.1: driver globale, Timer e Ticker](https://docs.rs/embassy-time/0.5.1/embassy_time/) e [HAL STM32 0.6.0: selezione del chip e del timer](https://docs.rs/embassy-stm32/0.6.0/embassy_stm32/).
- [Embassy sync 0.8.0: semantica del canale](https://docs.rs/embassy-sync/0.8.0/embassy_sync/channel/struct.Channel.html) e [scheda NUCLEO-F401RE di ST](https://www.st.com/en/evaluation-tools/nucleo-f401re.html).

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/no_std|no_std]]
- [[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]]
- [[Programmazione/Rust/Pagine/embedded-hal|embedded-hal]]
- [[Programmazione/Rust/Pagine/RTIC|RTIC]]
- [[Programmazione/Rust/Pagine/defmt|defmt]]
- [[Programmazione/Rust/Pagine/Async Await|Async Await]]
- [[Programmazione/Rust/Pagine/Future Trait|Future Trait]]
- [[Programmazione/Rust/Pagine/Channel async|Channel async]]
