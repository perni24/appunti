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
  - rust-di-sistema
  - embedded
aliases:
  - no_std
  - "#![no_std]"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo features]]"
  - "[[Programmazione/Rust/Pagine/Allocator]]"
related:
  - "[[Programmazione/Rust/Pagine/Embedded Rust]]"
  - "[[Programmazione/Rust/Pagine/Feature flags ben progettate]]"
  - "[[Programmazione/Rust/Pagine/embedded-hal]]"
  - "[[Programmazione/Rust/Pagine/cortex-m]]"
title: no_std
---

# no_std

## Sintesi

`#![no_std]` cambia **questa crate**: il compilatore non importa automaticamente `std` e usa il prelude di `core`. Non è un interruttore che elimina il sistema operativo, vieta l'heap o rende tutte le dipendenze compatibili con un microcontrollore. Una libreria `no_std` può anche essere chiamata da un normale programma desktop.

Per decidere dove mettere una funzione, chiediti di quali servizi ha bisogno. Sommare i byte di una slice non richiede né heap né sistema operativo. Restituire un `Vec<u8>` che cresce richiede un allocatore. Aprire un file per nome richiede anche un ambiente che offra quel servizio.

## Quando usarlo

| Se devi… | Livello adatto | Un esempio |
| --- | --- | --- |
| Elaborare dati già in memoria senza richiedere allocazioni | `core` | Slice, iteratori, `Option`, `Result`, `core::fmt::Write` su una destinazione fornita dal chiamante. |
| Restituire dati di dimensione variabile di cui il chiamante sarà proprietario | `core` + `alloc` | `Vec`, `String` e `Box`; spetta al programma finale fornire l'allocatore quando necessario. |
| Accedere a file, thread o rete con le API della standard library | `std` su un target che offre il servizio | Un adattatore desktop legge un file e passa i byte alla stessa funzione che gira nel firmware. |

È un'organizzazione utile per firmware, bootloader, kernel e librerie condivise tra desktop e bare metal. Ownership, trait, generics ed enum funzionano anche con il solo `core`. Un driver specifico può fornire I/O senza `std`: manca l'API standard, non la possibilità di comunicare con l'hardware.

## Come funziona

### Una sola libreria, tre configurazioni

La crate di esempio contiene `Cargo.toml`, `src/lib.rs` e `tests/checksum.rs`. Non ha dipendenze da crates.io. Nel manifest le feature sono **definite dal progetto**: qui `std` abilita anche `alloc`, mentre `alloc` non abilita `std`.

```toml
[package]
name = "checksum_notes"
version = "0.1.0"
edition = "2024"

[features]
default = ["std"]
alloc = []
std = ["alloc"]
```

In `src/lib.rs`, l'attributo di crate deve stare in testa al file. `extern crate alloc` rende disponibile la crate distribuita con la toolchain per i target che la supportano: non installa un heap. Le funzioni opzionali sono escluse dalla compilazione quando manca la rispettiva feature.

```rust
#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(feature = "alloc")]
extern crate alloc;

pub fn checksum(bytes: &[u8]) -> u8 {
    bytes.iter().copied().fold(0, u8::wrapping_add)
}

#[cfg(feature = "alloc")]
pub fn with_checksum(bytes: &[u8]) -> alloc::vec::Vec<u8> {
    let mut result = alloc::vec::Vec::from(bytes);
    result.push(checksum(bytes));
    result
}

#[cfg(feature = "std")]
pub fn checksum_file(path: &std::path::Path) -> std::io::Result<u8> {
    let bytes = std::fs::read(path)?;
    Ok(checksum(&bytes))
}
```

`checksum` calcola la somma modulo 256, anche su input vuoto; non è una verifica crittografica. `with_checksum` restituisce una nuova sequenza con la somma in coda e lascia intatta la slice originale. `checksum_file` propaga l'errore di I/O e legge il file intero: è un esempio per file piccoli, non un lettore a memoria costante.

## API / Sintassi

### Cosa cambia per chi usa la libreria

| Selezione Cargo | API disponibili |
| --- | --- |
| `--no-default-features` | `checksum`; niente `std` o `alloc` nella libreria di esempio. |
| `--no-default-features --features alloc` | `checksum` e `with_checksum`; nessuna dipendenza da `std` nella libreria. |
| Configurazione predefinita | Tutte e tre, compresa `checksum_file`. |

`--features alloc` **da solo non disabilita** la feature predefinita `std`. Inoltre `--no-default-features` non disattiva automaticamente i default delle dipendenze transitive. Per una dipendenza controlla il suo manifest, imposta `default-features = false` sul relativo arco quando serve e verifica se altre dipendenze riabilitano la feature. Cargo combina le feature richieste; vedi [[Programmazione/Rust/Pagine/Cargo features|Cargo features]].

### Cosa deve fornire il binario

La libreria non definisce un punto di ingresso, un `#[panic_handler]` o un allocatore globale. Può produrre una `rlib` anche se il programma che la userà non è ancora stato scritto. Per un eseguibile bare-metal, invece, occorre verificare:

- **Avvio e linking:** chi prepara memoria e stack e trasferisce il controllo al programma? Il runtime del target o della scheda può fornire l'entry point e richiedere un linker script. `#![no_main]` non sostituisce lo startup.
- **Panic:** nel programma finale senza `std` deve esserci un'unica implementazione di `#[panic_handler]`, propria o fornita da una dipendenza. `panic = "abort"` seleziona una strategia, non definisce il gestore.
- **Heap, solo se serve:** se il programma usa allocazioni dinamiche deve disporre di memoria utilizzabile e di un allocatore globale adeguato. Il semplice calcolo su una slice non richiede nessuno dei due.

## Esempio pratico

### Provare il comportamento sull'host

In `tests/checksum.rs` i test usano la stessa selezione di feature della libreria. Il caso `255 + 2 = 1` verifica il riporto modulo 256; quello sul file confronta la lettura dal filesystem con i byte noti del manifest.

```rust
use checksum_notes::checksum;

#[test]
fn core_checksum() {
    assert_eq!(checksum(&[]), 0);
    assert_eq!(checksum(&[255, 2]), 1);
}

#[cfg(feature = "alloc")]
#[test]
fn owned_output() {
    assert_eq!(checksum_notes::with_checksum(&[]), [0]);
    assert_eq!(checksum_notes::with_checksum(&[255, 2]), [255, 2, 1]);
}

#[cfg(feature = "std")]
#[test]
fn reads_manifest() {
    let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("Cargo.toml");
    let expected = checksum(include_bytes!("../Cargo.toml"));
    assert_eq!(checksum_notes::checksum_file(&path).unwrap(), expected);
}
```

Dalla radice di questa crate, esegui ciascuna configurazione separatamente:

```sh
cargo test --test checksum --no-default-features
```

```sh
cargo test --test checksum --no-default-features --features alloc
```

```sh
cargo test --test checksum
```

Sono attesi rispettivamente **1, 2 e 3 test passati**. Il test runner e il binario di test usano `std` sull'host: questo prova il comportamento, non la compatibilità del firmware.

### Compilare dove std non esiste

Un controllo complementare usa il target bare-metal `thumbv7em-none-eabi`. Se utilizzi rustup e il target non è presente, questo comando ne installa le librerie nella toolchain selezionata:

```sh
rustup target add thumbv7em-none-eabi
```

Compila la libreria con il solo `core`:

```sh
cargo build --lib --target thumbv7em-none-eabi --no-default-features
```

Compilala anche con il supporto ad `alloc`:

```sh
cargo build --lib --target thumbv7em-none-eabi --no-default-features --features alloc
```

Entrambi i comandi producono una libreria, **non un firmware avviabile**. Sullo stesso target, lasciare attiva la configurazione predefinita richiederebbe `std`, che non è disponibile. Per startup, scheda ed esecuzione prosegui con [[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]].

## Errori comuni

- **«La crate ha `no_std`, quindi anche le dipendenze ne sono prive».** L'attributo rimuove l'importazione automatica; non impedisce un collegamento esplicito o indiretto a `std`. Controlla il grafo delle feature e compila per il target previsto.
- **«Con `alloc` posso usare `println!`».** Un buffer dinamico non è un dispositivo di output. Per formattare senza heap puoi usare `core::fmt` e una destinazione che implementi `Write`.
- **Definire il panic handler nella libreria di calcolo.** Rende difficile usarla insieme a un runtime che ne fornisce già uno. Lascia questa scelta al programma finale.
- **Scambiare build riuscita per collaudo hardware.** Una `rlib` non esercita il linker del firmware, inizializzazione della RAM, periferiche o comportamento in caso di panic.

## Checklist

- Il percorso base accetta slice o buffer del chiamante, senza richiedere allocazioni nascoste?
- Le feature usate in `#[cfg]` sono dichiarate nel manifest e la loro relazione è esplicita?
- Oltre ai test sull'host, compilo le configurazioni supportate su un target privo di `std`?
- È chiaro quali servizi deve ancora fornire il runtime prima dell'esecuzione sulla scheda?

## Collegamenti

- [[Programmazione/Rust/Pagine/Allocator|Allocator]]
- [[Programmazione/Rust/Pagine/Cargo features|Cargo features]]
- [[Programmazione/Rust/Pagine/Feature flags ben progettate|Feature flags ben progettate]]
- [[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]]
- [[Programmazione/Rust/Pagine/embedded-hal|embedded-hal]]
- [[Programmazione/Rust/Pagine/cortex-m|cortex-m]]

## Fonti

- [Rust Reference: effetto preciso di no_std sul prelude](https://doc.rust-lang.org/reference/names/preludes.html#the-no_std-attribute) e [gestore dei panic](https://doc.rust-lang.org/reference/panic.html#the-panic_handler-attribute).
- [Documentazione di core](https://doc.rust-lang.org/core/) e [di alloc](https://doc.rust-lang.org/alloc/).
- [Cargo Book: feature predefinite e unificazione](https://doc.rust-lang.org/cargo/reference/features.html).
- [The Embedded Rust Book: ambiente bare-metal](https://docs.rust-embedded.org/book/intro/no-std.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
