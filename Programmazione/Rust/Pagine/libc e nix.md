---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - rust-di-sistema
aliases:
  - "libc"
  - "nix crate"
prerequisites:
  - "[[Programmazione/Rust/Pagine/FFI]]"
  - "[[Programmazione/Rust/Pagine/File descriptor]]"
related:
  - "[[Programmazione/Rust/Pagine/Raw pointers]]"
  - "[[Programmazione/Rust/Pagine/Unsafe abstractions sicure]]"
  - "[[Programmazione/Rust/Pagine/Memory mapping]]"
---

# libc e nix

## Sintesi

`libc` e una crate che espone binding di basso livello alle API C di sistema. `nix` fornisce wrapper Rust piu sicuri e idiomatici per molte API Unix/POSIX.

La scelta pratica: usa `nix` quando copre l'API che ti serve; usa `libc` quando devi scendere al livello raw o accedere a funzioni non incapsulate.

## Quando usarlo

- Quando interagisci con syscall o API POSIX.
- Quando lavori con file descriptor, segnali, processi, socket o memory mapping.
- Quando devi integrare codice Unix esistente.
- Quando la standard library non espone l'operazione necessaria.

## Come funziona

`libc` espone funzioni e tipi C:

```rust
let pid = unsafe { libc::getpid() };
```

`nix` incapsula molte chiamate con tipi Rust e `Result`:

```rust
let pid = nix::unistd::getpid();
```

I wrapper safe riducono errori, ma non eliminano la necessita di capire il contratto OS.

## API / Sintassi

Dipendenze:

```toml
[dependencies]
libc = "0.2"
nix = "0.29"
```

Uso file descriptor:

```rust
use std::os::fd::AsRawFd;

let file = std::fs::File::open("data.txt")?;
let fd = file.as_raw_fd();
```

## Esempio pratico

```rust
use nix::unistd::Pid;

fn current_pid() -> Pid {
    nix::unistd::getpid()
}
```

La funzione restituisce un tipo Rust invece di un intero C grezzo.

## Varianti

- `libc`: binding raw C.
- `nix`: wrapper Unix idiomatici.
- Standard library: preferibile quando espone gia l'operazione.
- Crate platform-specific: Windows, Linux o embedded.
- FFI diretta a librerie native specifiche.

## Errori comuni

- Usare `libc` quando la standard library basta.
- Non controllare codici di errore C.
- Confondere ownership di file descriptor.
- Scrivere codice Unix-only senza segnalarlo.
- Esporre tipi `libc` nella API pubblica senza necessita.

## Checklist

- La standard library copre gia il caso?
- `nix` offre un wrapper safe?
- Il codice e portabile o Unix-specific?
- Ownership e chiusura dei file descriptor sono chiare?
- Gli errori OS sono convertiti in `Result` utile?

## Collegamenti

- [[Programmazione/Rust/Pagine/FFI|FFI]]
- [[Programmazione/Rust/Pagine/File descriptor|File descriptor]]
- [[Programmazione/Rust/Pagine/Memory mapping|Memory mapping]]
- [[Programmazione/Rust/Pagine/Raw pointers|Raw pointers]]
- [[Programmazione/Rust/Pagine/Unsafe abstractions sicure|Unsafe abstractions sicure]]
