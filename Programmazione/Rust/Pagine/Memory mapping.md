---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags:
  - programmazione
  - rust
  - rust-di-sistema
aliases:
  - "Memory mapping"
  - "mmap"
prerequisites:
  - "[[Programmazione/Rust/Pagine/File descriptor]]"
  - "[[Programmazione/Rust/Pagine/Memory layout e alignment]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
related:
  - "[[Programmazione/Rust/Pagine/File I O]]"
  - "[[Programmazione/Rust/Pagine/libc e nix]]"
  - "[[Programmazione/Rust/Pagine/Performance e profiling]]"
---

# Memory mapping

## Sintesi

Il **memory mapping** permette di mappare file, device o memoria anonima nello spazio di indirizzi del processo. Invece di leggere dati con `read`, il programma accede a un intervallo di memoria e il sistema operativo carica o sincronizza le pagine quando necessario.

In Rust questa tecnica e potente ma delicata: una mappatura espone memoria gestita dal kernel, non da `Vec` o `Box`. Bisogna gestire lifetime, permessi, allineamento, aliasing, sincronizzazione e modifiche concorrenti del file sottostante.

## Quando usarlo

Usa memory mapping quando:

- devi leggere file grandi senza copiarli interamente in heap;
- vuoi accesso random a porzioni di file;
- devi condividere memoria tra processi;
- lavori con file-backed cache, database, indici o formati binari;
- devi mappare device o regioni speciali tramite API di sistema.

Non usarlo automaticamente per I/O semplice: una lettura sequenziale con buffer puo essere piu semplice, piu portabile e piu prevedibile.

## Come funziona

Una chiamata come `mmap` chiede al kernel di associare un range virtuale del processo a una sorgente:

- un file aperto tramite file descriptor;
- memoria anonima;
- una regione condivisa;
- un device.

Il risultato e un puntatore a memoria. L'accesso a quella memoria avviene a pagine: il kernel carica o scrive le pagine in base ai permessi e alla politica della mappatura.

Le decisioni principali sono:

- **read-only o writable**;
- **private o shared**;
- **file-backed o anonymous**;
- **sync esplicito o demandato al kernel**;
- **dimensione e offset**, spesso vincolati all'allineamento di pagina.

In Rust e preferibile usare crate che incapsulano `mmap` in tipi con `Drop`, per esempio una mappatura read-only che implementa `Deref<Target = [u8]>`.

## API / Sintassi

La standard library non fornisce una API portabile completa per `mmap`. Le strade comuni sono:

- crate come `memmap2`;
- wrapper Unix tramite `nix`;
- chiamate dirette a `libc::mmap`;
- API specifiche di piattaforma.

Esempio concettuale con `memmap2`:

```rust
use std::fs::File;

use memmap2::Mmap;

fn map_file(path: &str) -> std::io::Result<Mmap> {
    let file = File::open(path)?;

    // Safety: il file resta valido durante la creazione della mappa.
    // Gli accessi successivi devono considerare che il file sottostante puo cambiare.
    let map = unsafe { Mmap::map(&file)? };

    Ok(map)
}
```

Il blocco `unsafe` non significa che ogni accesso sia manuale, ma che il chiamante deve rispettare invarianti che il compilatore non puo verificare da solo.

## Esempio pratico

Lettura di un header binario da una mappatura:

```rust
use std::fs::File;

use memmap2::Mmap;

fn read_magic(path: &str) -> std::io::Result<Option<[u8; 4]>> {
    let file = File::open(path)?;
    let map = unsafe { Mmap::map(&file)? };

    let Some(bytes) = map.get(0..4) else {
        return Ok(None);
    };

    Ok(Some(bytes.try_into().expect("slice length is 4")))
}
```

L'esempio evita cast diretti a struct Rust perche layout, endianess e alignment devono essere gestiti esplicitamente.

## Varianti

- **Read-only mapping**: adatta a file immutabili o snapshot.
- **Writable mapping**: permette modifiche tramite memoria, ma richiede sincronizzazione.
- **Private mapping**: modifiche copy-on-write, non necessariamente persistite sul file.
- **Shared mapping**: modifiche visibili ad altri processi o al file.
- **Anonymous mapping**: memoria non associata a un file.
- **Device mapping**: usata per driver o hardware, spesso con vincoli severi.

## Errori comuni

- Mappare un file e poi assumere che non venga troncato da altri processi.
- Castare byte in struct senza verificare layout, alignment ed endianess.
- Usare mapping writable come se fosse una normale `Vec<u8>`.
- Dimenticare `flush` quando serve persistenza esplicita.
- Confondere memoria mappata shared con sincronizzazione thread-safe.
- Ignorare differenze tra Unix e Windows.
- Tenere riferimenti dentro la mappa oltre la vita della mappa stessa.

## Checklist

- La dimensione del file e stabile durante l'uso?
- La mappatura deve essere read-only, private o shared?
- L'offset e allineato ai vincoli della piattaforma?
- Serve chiamare `flush`?
- I dati binari sono validati prima del parsing?
- Eviti riferimenti con lifetime piu lungo della mappa?
- Hai valutato una lettura bufferizzata piu semplice?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/File descriptor]]
- [[Programmazione/Rust/Pagine/File I O]]
- [[Programmazione/Rust/Pagine/Memory layout e alignment]]
- [[Programmazione/Rust/Pagine/Unsafe Rust]]
- [[Programmazione/Rust/Pagine/libc e nix]]
- [[Programmazione/Rust/Pagine/Performance e profiling]]
