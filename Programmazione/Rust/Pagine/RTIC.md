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
  - RTIC
  - Real-Time Interrupt-driven Concurrency
prerequisites:
  - "[[Programmazione/Rust/Pagine/no_std|no_std]]"
  - "[[Programmazione/Rust/Pagine/cortex-m|cortex-m]]"
  - "[[Programmazione/Rust/Pagine/Shared state|Shared state]]"
related:
  - "[[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]]"
  - "[[Programmazione/Rust/Pagine/Embassy|Embassy]]"
  - "[[Programmazione/Rust/Pagine/defmt|defmt]]"
  - "[[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]"
title: RTIC
---

# RTIC

## Sintesi

RTIC (*Real-Time Interrupt-driven Concurrency*) organizza il firmware intorno a due domande: **quale evento avvia questo lavoro?** e **quale altro lavoro può interromperlo?** In RTIC 2 un task hardware è una funzione sincrona associata a un vettore; un task software è una funzione `async` resa pronta da `spawn`. Nessuno dei due è un thread del sistema operativo.

Su un singolo core non si eseguono due task nello stesso istante. Una priorità RTIC più alta può interrompere il lavoro a priorità più bassa (*preemption*). Tra task software della stessa priorità, invece, un lungo calcolo senza un effettivo punto di sospensione ritarda gli altri. Dichiarare una funzione `async` non rende il calcolo interrompibile dai suoi pari.

## Chi avvia cosa

| Contesto | Come parte | Cosa metterci |
| --- | --- | --- |
| `#[init]` | Una volta all'avvio, prima che i task applicativi possano intervenire | Configurazione delle periferiche e valori iniziali di `Shared` e `Local`. La macro genera l'entry point: non aggiungere `#[entry]`. |
| `#[task(binds = …)]` | Il vettore collegato diventa pendente | Gestire la sorgente e restituire il controllo rapidamente. Con una periferica reale occorre anche configurare la sorgente e trattarne i flag. |
| `#[task(priority = …)] async fn` | Qualcuno chiama `nome::spawn(argomenti)` | Elaborare un evento o attendere una future. Su Cortex-M i task software a una stessa priorità positiva condividono un interrupt libero detto *dispatcher*. |
| `#[idle]` (opzionale) | Quando non c'è lavoro più prioritario pronto | Lavoro di fondo. Non è un posto adatto per attendere attivamente un evento urgente. |

## Esempio: due eventi, un solo posto

Sul progetto **NUCLEO-F401RE** di [[Programmazione/Rust/Pagine/defmt|defmt]] aggiungiamo un secondo binario. Per provare le priorità senza cablare un pulsante, `init` rende pendente `EXTI0` **via software**. Questa è una richiesta al controller degli interrupt, non la simulazione elettrica di un pin. L'handler, a priorità 2, genera due identificatori. Un task a priorità 1 prova a registrarli tramite RTT.

### Configurare il progetto

Nella copia del progetto `reading-log`, aggiornare la tabella `[dependencies]` di `Cargo.toml` come sotto. Oltre alle due nuove crate, cambia il vincolo su `cortex-m`: RTIC 2.4.0 richiede almeno 0.7.9 della serie 0.7 e il pin originale `=0.7.7` impedirebbe a Cargo di risolvere le dipendenze. Conservare il resto del manifest, `DEFMT_LOG=info`, `memory.x`, `build.rs` e gli script del linker della nota precedente.

```toml
[dependencies]
cortex-m = { version = "=0.7.9", features = ["critical-section-single-core"] }
cortex-m-rt = "=0.7.5"
defmt = "=1.2.0"
defmt-rtt = "=1.3.1"
panic-probe = { version = "=1.0.0", features = ["print-defmt"] }
rtic = { version = "=2.4.0", features = ["thumbv7-backend"] }
stm32f4 = { version = "=0.16.0", features = ["stm32f401", "rt"] }
```

Il backend corrisponde al Cortex-M4; la PAC fornisce i nomi dei vettori dello specifico microcontrollore. Qui riserviamo `USART2` come dispatcher di priorità 1. **Non usiamo la UART** per i log: scegliere questo vettore significa che non può essere contemporaneamente l'handler della periferica seriale.

Per continuare a compilare anche il primo binario, aggiungere questo import in `src/main.rs` di **questa copia** di `reading-log`. La feature `rt` della PAC fa sì che il runtime si aspetti la tabella dei vettori del chip; il primo binario, a differenza di quello RTIC, altrimenti non collegherebbe la PAC.

```rust
use stm32f4 as _;
```

### Collegare i due task

Creare `src/bin/rtic-burst.rs`. È un binario separato: il `main` dell'esempio `reading-log` resta nel suo file.

```rust
#![no_std]
#![no_main]

use defmt_rtt as _;
use panic_probe as _;

#[rtic::app(device = stm32f4::stm32f401, dispatchers = [USART2])]
mod app {
    use stm32f4::stm32f401::Interrupt;

    #[shared]
    struct Shared { dropped: u32 }

    #[local]
    struct Local { sequence: u32 }

    #[init]
    fn init(_: init::Context) -> (Shared, Local) {
        rtic::pend(Interrupt::EXTI0);
        (Shared { dropped: 0 }, Local { sequence: 0 })
    }

    #[task(binds = EXTI0, priority = 2, local = [sequence], shared = [dropped])]
    fn burst(mut cx: burst::Context) {
        for _ in 0..2 {
            *cx.local.sequence = cx.local.sequence.wrapping_add(1);
            if report::spawn(*cx.local.sequence).is_err() {
                cx.shared.dropped.lock(|n| *n = n.saturating_add(1));
            }
        }
    }

    #[task(priority = 1, shared = [dropped])]
    async fn report(mut cx: report::Context, id: u32) {
        let dropped = cx.shared.dropped.lock(|n| *n);
        defmt::info!("id={=u32} dropped={=u32}", id, dropped);
    }
}
```

### Prevedere il risultato

1. `init` termina e RTIC consegna l'interrupt pendente a `burst`. Il primo `spawn(1)` rende pronto `report`, ma il dispatcher di priorità 1 non può interrompere `burst` a priorità 2.
2. `spawn(2)` trova la precedente istanza di `report` ancora occupata e restituisce `Err`. Il codice **sceglie** di scartare l'evento e incrementa `dropped`. `spawn` non è una coda illimitata; usare `unwrap()` qui manderebbe il firmware in panic.
3. Al ritorno da `burst`, il dispatcher fa avanzare `report`. Il task legge il contatore sotto lock e stampa **fuori dal lock**. La riga applicativa attesa è `INFO id=1 dropped=1`. Non è previsto un secondo messaggio: la sorgente è stata attivata una volta sola.

Se nessun evento può andare perso, usare un canale o una coda a capacità definita e decidere cosa fare quando è piena. Attendere che il consumatore di priorità 1 liberi spazio **dentro** l'handler di priorità 2 gli impedirebbe proprio di farlo.

### Compilare e osservare

Dalla radice di `reading-log`, con il target Rust installato, compilare **senza accedere alla scheda**:

```sh
cargo build --release --bin rtic-burst --target thumbv7em-none-eabi
```

Solo per provare sulla scheda corretta: il comando seguente **scrive la Flash e avvia il nuovo firmware**. Verificare prima modello, sonda e immagine come in [[Programmazione/Rust/Pagine/probe-rs|probe-rs]]. Il messaggio parte all'avvio: collegarsi in seguito con `attach` non ripete l'evento.

```sh
probe-rs run --chip STM32F401RETx target/thumbv7em-none-eabi/release/rtic-burst
```

## Risorse e latenza

- **`sequence` è locale a `burst`**: sopravvive fra invocazioni, ma nessun altro task la può dichiarare come propria. Non serve un lock.
- **`dropped` è condivisa**: il produttore la modifica, il consumatore la legge. Il *tetto di priorità* è la massima priorità dei task che possono accedervi, qui 2. Mentre `report` è nella closure di `lock`, `burst` non può interromperla. Sul backend usato questo non equivale a disabilitare tutti gli interrupt: un task a priorità superiore al tetto può ancora intervenire, se non ci sono altre maschere attive.
- **Un lock breve limita il ritardo che imponi agli altri task**. Copiare un contatore nel lock e fare I/O dopo, come sopra, è diverso dal trattenere la risorsa mentre il backend RTT aspetta spazio. Il modello protegge l'accesso ai dati dichiarati; non garantisce che una scadenza temporale venga rispettata. Quella richiede limiti sul lavoro per evento e misure sul target.

## Quando scegliere RTIC

RTIC è utile se il requisito nomina priorità precise: per esempio «l'acquisizione deve poter interrompere l'elaborazione, salvo durante l'aggiornamento del contatore». Se serve solo un evento periodico e un ciclo principale, [[Programmazione/Rust/Pagine/cortex-m|cortex-m]] può bastare. Per attività soprattutto in attesa di I/O, confrontare anche [[Programmazione/Rust/Pagine/Embassy|Embassy]]: la differenza non è «sincrono contro asincrono», perché anche RTIC 2 usa task software asincroni.

Un dispatcher non è un timer: `spawn` rende pronto un task, non lo programma fra 10 ms. Per ritardi o istanti futuri occorre una sorgente di tempo, per esempio un *monotonic* adatto alla scheda; non usare lo stesso timer indipendentemente in due componenti.

## Fonti

- [RTIC Book 2: applicazione e priorità](https://rtic.rs/2/book/en/by-example/app.html), [task hardware](https://rtic.rs/2/book/en/by-example/hardware_tasks.html) e [task software, spawn e dispatcher](https://rtic.rs/2/book/en/by-example/software_tasks.html).
- [RTIC Book 2: risorse locali, lock e tetto di priorità](https://rtic.rs/2/book/en/by-example/resources.html).
- [RTIC 2.4.0: API della crate](https://docs.rs/rtic/2.4.0/rtic/) e [PAC STM32F401 0.16.0](https://docs.rs/stm32f4/0.16.0/stm32f4/stm32f401/).

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/no_std|no_std]]
- [[Programmazione/Rust/Pagine/cortex-m|cortex-m]]
- [[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]]
- [[Programmazione/Rust/Pagine/Embassy|Embassy]]
- [[Programmazione/Rust/Pagine/defmt|defmt]]
- [[Programmazione/Rust/Pagine/Shared state|Shared state]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]
