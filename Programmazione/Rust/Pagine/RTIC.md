---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - embedded
aliases:
  - "RTIC"
  - "Real-Time Interrupt-driven Concurrency"
prerequisites:
  - "[[Programmazione/Rust/Pagine/no_std]]"
  - "[[Programmazione/Rust/Pagine/cortex-m]]"
  - "[[Programmazione/Rust/Pagine/Shared state]]"
related:
  - "[[Programmazione/Rust/Pagine/Embedded Rust]]"
  - "[[Programmazione/Rust/Pagine/Embassy]]"
  - "[[Programmazione/Rust/Pagine/defmt]]"
  - "[[Programmazione/Rust/Pagine/Send e Sync Traits]]"
---

# RTIC

## Sintesi

RTIC, **Real-Time Interrupt-driven Concurrency**, e un framework Rust embedded per scrivere firmware concorrente basato su interrupt, task, priorita e risorse condivise gestite in modo sicuro.

Il suo obiettivo e rendere piu disciplinato il modello classico embedded "main loop + interrupt", riducendo l'uso manuale di `static mut`, sezioni critiche sparse e sincronizzazione fragile.

## Quando usarlo

Usa RTIC quando:

- lavori su microcontrollori senza sistema operativo;
- il firmware e guidato da interrupt;
- devi gestire priorita e latenza real-time;
- hai risorse condivise tra task;
- vuoi concorrenza statica e prevedibile;
- Embassy/async non e necessario o non e il modello migliore.

RTIC e adatto a firmware dove il flusso e fortemente legato a eventi hardware e priorita. Per applicazioni con molte operazioni asincrone di I/O embedded, Embassy puo essere piu naturale.

## Come funziona

RTIC organizza il firmware in un'app dichiarata con una macro. I concetti principali sono:

- **init**: inizializzazione del sistema;
- **idle**: lavoro a bassa priorita;
- **task hardware**: task associati a interrupt;
- **task software**: task schedulabili dal codice;
- **shared resources**: stato condiviso protetto dal framework;
- **local resources**: stato locale a un task;
- **priority**: ordine e preemption tra task.

Il framework usa informazioni statiche per calcolare protezioni e priorita. Questo riduce overhead runtime e rende piu visibile chi accede a quale risorsa.

## API / Sintassi

Esempio schematico:

```rust
#[rtic::app(device = pac, peripherals = true)]
mod app {
    #[shared]
    struct Shared {
        counter: u32,
    }

    #[local]
    struct Local {}

    #[init]
    fn init(_ctx: init::Context) -> (Shared, Local) {
        (Shared { counter: 0 }, Local {})
    }

    #[idle]
    fn idle(_ctx: idle::Context) -> ! {
        loop {
            cortex_m::asm::wfi();
        }
    }
}
```

`pac` e un nome schematico: nel codice reale punti alla PAC del microcontrollore.

## Esempio pratico

Task che aggiorna una risorsa condivisa:

```rust
#[rtic::app(device = pac, peripherals = true)]
mod app {
    #[shared]
    struct Shared {
        ticks: u32,
    }

    #[local]
    struct Local {}

    #[init]
    fn init(_ctx: init::Context) -> (Shared, Local) {
        (Shared { ticks: 0 }, Local {})
    }

    #[task(shared = [ticks])]
    fn tick(mut ctx: tick::Context) {
        ctx.shared.ticks.lock(|ticks| {
            *ticks += 1;
        });
    }
}
```

L'accesso a `ticks` passa da `lock`, invece di usare `static mut` manuale.

## Varianti

- **Task hardware**: legati a interrupt della periferica.
- **Task software**: schedulati dall'applicazione.
- **Risorse shared**: protette dal framework.
- **Risorse local**: possedute da un solo task.
- **Monotonic timer**: base temporale per scheduling.
- **Embassy**: alternativa async embedded, con modello diverso.

## Errori comuni

- Usare RTIC senza capire priorita e preemption.
- Mettere lavoro lungo in task ad alta priorita.
- Condividere stato fuori dal modello `shared`.
- Usare `static mut` per aggirare il framework.
- Confondere task RTIC con thread OS.
- Non misurare latenza degli interrupt.
- Scegliere RTIC quando un semplice loop o Embassy sarebbe piu chiaro.

## Checklist

- Le priorita dei task sono documentate?
- Le risorse condivise sono dichiarate in `shared`?
- Gli handler ad alta priorita sono brevi?
- La latenza massima e accettabile?
- Lo scheduling temporale e basato su un monotonic adatto?
- Il firmware evita `static mut` non necessario?
- RTIC e il modello giusto rispetto a Embassy?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/no_std]]
- [[Programmazione/Rust/Pagine/cortex-m]]
- [[Programmazione/Rust/Pagine/Embedded Rust]]
- [[Programmazione/Rust/Pagine/Embassy]]
- [[Programmazione/Rust/Pagine/defmt]]
- [[Programmazione/Rust/Pagine/Shared state]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits]]
