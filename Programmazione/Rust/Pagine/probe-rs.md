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
  - probe-rs
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cross-compilation|Cross-compilation]]"
  - "[[Programmazione/Rust/Pagine/cortex-m|cortex-m]]"
related:
  - "[[Programmazione/Rust/Pagine/defmt|defmt]]"
  - "[[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]]"
  - "[[Programmazione/Rust/Pagine/no_std|no_std]]"
  - "[[Programmazione/Rust/Pagine/RTIC|RTIC]]"
  - "[[Programmazione/Rust/Pagine/Embassy|Embassy]]"
title: probe-rs
---

# probe-rs

## Sintesi

`probe-rs` è il programma **sul computer** che usa una sonda di debug per interagire con un microcontrollore. Cargo compila il firmware; la sonda (per esempio uno ST-LINK integrato nella scheda) lo trasferisce al chip tramite SWD o JTAG. Per compilare basta il toolchain Rust; per programmare servono anche una sonda, un dispositivo compatibile e l'immagine corretta.

Questa nota usa **probe-rs 0.32.0**, la **NUCLEO-F401RE** e l'esempio `blink` di [[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]]. Con un'altra scheda non basta cambiare `--chip`: vanno controllati anche target Rust, mappa di memoria e pin dell'esempio.

## Quale operazione scegliere

| Voglio… | Comando | Effetto |
| --- | --- | --- |
| Sapere se la CLI conosce il modello | `probe-rs chip info` | Legge il catalogo sul PC. Funziona anche senza scheda; **non identifica** il chip collegato. |
| Sapere se il PC vede la sonda | `probe-rs list` | Elenca le sonde rilevate, non i microcontrollori collegati a ciascuna. Non programma la Flash. |
| Preparare il firmware | `cargo build` | Produce un ELF sul PC. Non usa il runner, neppure se è configurato. |
| Sostituire il firmware e avviarlo | `probe-rs run` | Programma la Flash e avvia l'immagine. Il firmware precedente nelle regioni interessate non viene conservato. |
| Leggere i log del firmware già in esecuzione | `probe-rs attach` | Con le opzioni di base non riprogramma la Flash né richiede un reset all'aggancio. Non aggiunge un canale di log a un firmware che non lo ha. |

Per fermarsi su una riga, ispezionare variabili o avanzare passo passo serve invece una **sessione di debug**, per esempio con il [debugger ufficiale tramite DAP](https://probe.rs/docs/tools/debugger/). Un breakpoint arresta il core: non equivale a osservare passivamente i log, soprattutto se il firmware controlla periferiche con vincoli temporali.

## Esempio: dal file ELF alla NUCLEO-F401RE

### 1. Verificare CLI, modello e sonda

Installare gli strumenti sul **PC**, seguendo la [guida ufficiale per il proprio sistema](https://probe.rs/docs/getting-started/installation/). Il pacchetto che fornisce l'eseguibile si chiama `probe-rs-tools`: non occorre aggiungerlo alle dipendenze del firmware. Verificare la versione:

```sh
probe-rs --version
```

Verificare il nome esatto che la CLI accetta per il microcontrollore:

```sh
probe-rs chip info STM32F401RETx
```

Il catalogo 0.32.0 riporta un core `Armv7em`, la Flash principale a `0x08000000..0x08080000` (512 KiB) e la RAM a `0x20000000..0x20018000` (96 KiB). Gli estremi superiori sono esclusi. Sono i valori con cui confrontare `memory.x` per l'esempio senza bootloader, non una lettura dalla scheda.

Collegare la porta USB dello ST-LINK con un cavo dati. Questo comando controlla **la sonda**, non il risultato della build:

```sh
probe-rs list
```

Gli esempi successivi assumono una sola sonda. Se ne sono elencate diverse, identificare fisicamente la scheda e usare il selettore `--probe` indicato dall'help di `run`, oppure scollegare le altre prima di scrivere. Non scegliere solo in base all'ordine dell'elenco.

### 2. Compilare senza scrivere sulla scheda

Dalla radice del progetto `led_notes` descritto in [[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]], con il target `thumbv7em-none-eabi` installato e i file di linking già presenti:

```sh
cargo build --release --example blink --target thumbv7em-none-eabi
```

Con la directory di build predefinita, l'ELF è `target/thumbv7em-none-eabi/release/examples/blink`. I tre nomi hanno ruoli diversi: `thumbv7em-none-eabi` seleziona architettura e ABI del compilatore; `STM32F401RETx` seleziona la descrizione del chip per la sonda; `blink` seleziona l'esempio Cargo. Nessuno dei tre si deduce con certezza dagli altri.

### 3. Programmare: scegliere **una** delle due vie

**Effetto di entrambe:** viene scritto e avviato il nuovo firmware. Prima di procedere, confermare il modello sulla scheda, la sonda, l'immagine e l'eventuale presenza di un bootloader o dati da preservare. Una build riuscita non fa queste verifiche.

**Via diretta**, usando l'ELF già compilato:

```sh
probe-rs run --chip STM32F401RETx target/thumbv7em-none-eabi/release/examples/blink
```

**In alternativa, tramite Cargo.** In `.cargo/config.toml`, aggiungere `runner` alla tabella del target già presente, conservando `rustflags`. La tabella risultante è questa (non duplicarne l'intestazione):

```toml
[target.thumbv7em-none-eabi]
rustflags = ["-C", "link-arg=-Tlink.x"]
runner = ["probe-rs", "run", "--chip", "STM32F401RETx"]
```

Cargo compila e passa al runner il percorso dell'eseguibile come ultimo argomento. Non impostiamo un target globale: i test della libreria possono ancora girare sul PC. Selezionare esplicitamente esempio e target:

```sh
cargo run --release --example blink --target thumbv7em-none-eabi
```

Il segnale atteso è il **lampeggio del LED utente su PA5**. L'esempio non inizializza RTT e non emette messaggi `defmt`: un terminale senza log applicativi è normale.

## Leggere i log senza rifare il flash

Per un firmware **già dotato di logging RTT**, conservare sul PC l'ELF della build effettivamente programmata. RTT è il trasporto tramite buffer in RAM; [[Programmazione/Rust/Pagine/defmt|defmt]] è un formato compatto decodificato usando i metadati del relativo ELF. Un canale RTT può anche trasportare semplice testo, senza `defmt`.

Se il file di quella build è stato conservato come `firmware-con-log.elf` nella directory corrente, collegarsi così:

```sh
probe-rs attach --chip STM32F401RETx firmware-con-log.elf
```

Il percorso è un esempio, **non** un secondo file prodotto da `blink`. Una ricompilazione dello stesso sorgente non garantisce un ELF identico. Se i log mancano, verificare prima che il firmware raggiunga l'inizializzazione del logger, che usi RTT e che l'ELF corrisponda. Ripetere il flash non è il primo passo per diagnosticare un canale silenzioso.

## Diagnosi rapida

- **Nessuna sonda nell'elenco:** verificare porta USB, cavo dati, driver o permessi del sistema operativo. Cambiare il nome del chip non rende visibile un dispositivo USB.
- **Sonda visibile, ma nessuna connessione al chip:** controllare alimentazione del target e interfaccia corretta; con una sonda esterna verificare anche massa comune e cablaggio. Chiudere altre sessioni che stanno usando la stessa sonda.
- **Cargo cerca di eseguire il programma sul computer:** verificare che `--target` coincida esattamente con la tabella `[target.…]` e che Cargo sia stato lanciato dalla radice del progetto.
- **ELF non trovato o fuori dalla memoria prevista:** controllare esempio, profilo, percorso di output e `memory.x`. Se il chip è protetto o la memoria non coincide, fermarsi: una cancellazione completa non è una verifica diagnostica.

## Fonti

- [probe-rs 0.32.0: release verificata](https://github.com/probe-rs/probe-rs/releases/tag/v0.32.0) e [documentazione di run e attach](https://probe.rs/docs/tools/probe-rs/).
- [Cargo Book: configurazione del runner per target](https://doc.rust-lang.org/cargo/reference/config.html#targettriplerunner).
- [STMicroelectronics: NUCLEO-F401RE e ST-LINK integrato](https://www.st.com/en/evaluation-tools/nucleo-f401re.html).

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]]
- [[Programmazione/Rust/Pagine/cortex-m|cortex-m]]
- [[Programmazione/Rust/Pagine/defmt|defmt]]
- [[Programmazione/Rust/Pagine/Cross-compilation|Cross-compilation]]
- [[Programmazione/Rust/Pagine/no_std|no_std]]
- [[Programmazione/Rust/Pagine/RTIC|RTIC]]
- [[Programmazione/Rust/Pagine/Embassy|Embassy]]
