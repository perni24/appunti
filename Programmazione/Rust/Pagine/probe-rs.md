---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - embedded
aliases:
  - "probe-rs"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cross-compilation]]"
  - "[[Programmazione/Rust/Pagine/cortex-m]]"
  - "[[Programmazione/Rust/Pagine/defmt]]"
related:
  - "[[Programmazione/Rust/Pagine/Embedded Rust]]"
  - "[[Programmazione/Rust/Pagine/no_std]]"
  - "[[Programmazione/Rust/Pagine/RTIC]]"
  - "[[Programmazione/Rust/Pagine/Embassy]]"
---

# probe-rs

## Sintesi

`probe-rs` e un toolkit per flashing, debug e interazione con target embedded. Permette di programmare microcontrollori tramite probe hardware, avviare firmware, leggere log via RTT/defmt, fare debug e integrare il flusso con Cargo.

Nel workflow Rust embedded, `probe-rs` riduce il salto tra `cargo build` e "il firmware gira sulla scheda".

## Quando usarlo

Usa `probe-rs` quando:

- devi flashare firmware su microcontrollore;
- vuoi usare `cargo run` per compilare e caricare il binario;
- vuoi leggere log `defmt` o RTT dalla console;
- devi fare debug con un probe supportato;
- vuoi evitare tool vendor-specific quando possibile;
- lavori con Cortex-M o altri target supportati dal toolkit.

Non sostituisce la conoscenza della scheda: chip, target, memoria e probe devono essere configurati correttamente.

## Come funziona

`probe-rs` comunica con un probe hardware collegato al target. Il probe parla con il microcontrollore tramite interfacce come SWD o JTAG.

Flusso tipico:

1. compili firmware per il target corretto;
2. colleghi la scheda al probe;
3. indichi il chip;
4. `probe-rs` flasha il binario;
5. opzionalmente avvia il firmware e legge log;
6. debug e diagnostica passano dallo stesso ecosistema.

Con `.cargo/config.toml` puoi configurare il runner per usare `cargo run`.

## API / Sintassi

Runner Cargo:

```toml
[target.thumbv7em-none-eabihf]
runner = "probe-rs run --chip STM32F407VGTx"
```

Comandi tipici:

```powershell
cargo run --release
probe-rs list
probe-rs run --chip STM32F407VGTx target/thumbv7em-none-eabihf/release/app
```

Il nome del chip deve corrispondere al target reale o a un alias riconosciuto.

## Esempio pratico

Configurazione minima per progetto embedded:

```toml
[build]
target = "thumbv7em-none-eabihf"

[target.thumbv7em-none-eabihf]
runner = "probe-rs run --chip STM32F407VGTx"
rustflags = [
  "-C", "link-arg=-Tlink.x",
]
```

Con questa configurazione:

```powershell
cargo run --release
```

compila, flasha e avvia il firmware usando il runner configurato.

## Varianti

- **probe-rs run**: flash e run del firmware.
- **probe-rs list**: rileva probe collegati.
- **RTT logging**: stream di log dal target.
- **defmt integration**: decoding di log compatti.
- **Debugging**: integrazione con strumenti di debug.
- **cargo runner**: flusso integrato con Cargo.

## Errori comuni

- Specificare chip sbagliato.
- Usare target triple incompatibile con la CPU.
- Dimenticare linker script.
- Confondere probe hardware e scheda target.
- Non avere permessi di accesso USB al probe.
- Aspettarsi log senza configurare RTT/defmt.
- Flashare build debug troppo grandi per la memoria disponibile.

## Checklist

- Il probe viene rilevato?
- Il chip configurato e quello reale?
- Il target Rust corrisponde alla CPU?
- Il linker script e corretto?
- Il runner Cargo e configurato?
- I log sono configurati con RTT o defmt?
- Il firmware release entra in flash e RAM?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Embedded Rust]]
- [[Programmazione/Rust/Pagine/cortex-m]]
- [[Programmazione/Rust/Pagine/defmt]]
- [[Programmazione/Rust/Pagine/Cross-compilation]]
- [[Programmazione/Rust/Pagine/no_std]]
- [[Programmazione/Rust/Pagine/RTIC]]
- [[Programmazione/Rust/Pagine/Embassy]]
