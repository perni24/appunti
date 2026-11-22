---
date: 2026-05-26
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
aliases:
  - libc
  - nix crate
prerequisites:
  - "[[Programmazione/Rust/Pagine/FFI]]"
related:
  - "[[Programmazione/Rust/Pagine/File descriptor]]"
  - "[[Programmazione/Rust/Pagine/Raw pointers]]"
  - "[[Programmazione/Rust/Pagine/Unsafe abstractions sicure]]"
  - "[[Programmazione/Rust/Pagine/Memory mapping]]"
title: libc e nix
---

# libc e nix

## Sintesi

Se devi leggere il PID corrente, usa `std::process::id()`: non occorre una dipendenza. Se invece devi interagire con un'API Unix, cerca prima il wrapper di `nix`. Scendi a `libc` quando quel wrapper manca o quando devi riprodurre esattamente un'interfaccia C.

La differenza non è quale kernel risponde: è **quale contratto vedi dal codice Rust**. Per esempio, sulla stessa pipe `libc::lseek` segnala l'errore con `-1` ed `errno`; `nix::unistd::lseek` lo restituisce come `Err(Errno::ESPIPE)`.

## Quando usarlo

| Hai bisogno di… | Parti da | Motivo |
| --- | --- | --- |
| PID, file, processi figli o socket TCP ordinari | `std` | Offre tipi Rust portabili; per la posizione di un file esiste già `Seek::stream_position`. |
| Funzionalità Unix come pipe, segnali o opzioni specifiche dei descriptor | `nix` | Molte chiamate espongono tipi e risultati Rust. Le funzioni disponibili dipendono da target, versione e feature. |
| Una funzione C di sistema non coperta dal wrapper | `libc` | Espone tipi, costanti e firme del target. Sta al wrapper verificare il contratto e tradurre gli errori. |

Non tutte le funzioni della libreria C corrispondono direttamente a una syscall. Non tutte le API di `nix` sono safe: verifica la **firma della singola funzione**, non soltanto il nome della crate.

## Come funziona

### Manifest e piattaforma

Gli esempi condividono una crate Cargo, in edition 2024. Questo `Cargo.toml` usa **nix 0.29.0**: `process` abilita `getpid`, `fs` abilita `lseek`. Le dipendenze Unix non vengono compilate per Windows nativo. Il codice che le importa deve essere protetto a sua volta da `#[cfg(unix)]`.

```toml
[package]
name = "unix_notes"
version = "0.1.0"
edition = "2024"

[target.'cfg(unix)'.dependencies]
libc = "0.2"
nix = { version = "=0.29.0", features = ["process", "fs"] }
```

### Il PID: tre firme, lo stesso processo

In `examples/pid.rs`, il percorso portabile stampa il PID. Su Unix il programma controlla anche i due risultati nativi: `libc` restituisce un `pid_t`, `nix` un `Pid` che espone il valore con `as_raw()`. A differenza di `lseek`, `getpid` non ha un caso d'errore da tradurre.

```rust
fn main() {
    let id = std::process::id();
    #[cfg(unix)]
    {
        // SAFETY: getpid non richiede argomenti né precondizioni al chiamante.
        let raw = unsafe { libc::getpid() };
        let pid = nix::unistd::getpid();
        assert_eq!(pid.as_raw(), raw);
        assert_eq!(u32::try_from(raw), Ok(id));
    }
    println!("{id}");
}
```

Con i file della crate al loro posto, esegui dalla radice:

```sh
cargo run --example pid
```

## API / Sintassi

### Dal prestito del descriptor al risultato

In `src/lib.rs` le due funzioni sotto chiedono la posizione corrente **senza spostarla**: offset zero rispetto a `SEEK_CUR`. Accettano `BorrowedFd<'_>`, quindi chi chiama conserva la risorsa. In nix **0.29.0** questa specifica funzione accetta ancora un `RawFd`: estrai il numero solo nel punto della chiamata.

```rust
#![cfg(unix)]

use std::io;
use std::os::fd::{AsRawFd, BorrowedFd};

pub fn position_raw(fd: BorrowedFd<'_>) -> io::Result<libc::off_t> {
    // SAFETY: fd è preso in prestito e resta aperto durante la chiamata.
    let offset = unsafe { libc::lseek(fd.as_raw_fd(), 0, libc::SEEK_CUR) };
    if offset == -1 {
        return Err(io::Error::last_os_error());
    }
    Ok(offset)
}

pub fn position_nix(fd: BorrowedFd<'_>) -> nix::Result<libc::off_t> {
    nix::unistd::lseek(fd.as_raw_fd(), 0, nix::unistd::Whence::SeekCur)
}
```

Nel primo wrapper leggi l'errore del sistema **solo dopo** il valore sentinella, prima di altre chiamate che potrebbero modificare `errno`. Non trattare lo zero come errore: è la posizione valida all'inizio del file. Nel secondo wrapper `nix` esegue la traduzione in `Result`; non serve un blocco `unsafe` nel chiamante. Qui il tipo `off_t` resta visibile per confrontare le firme; un'API portabile non è obbligata a esporlo.

## Esempio pratico

In `tests/position.rs`, confronta i due wrapper su risorse **entrambe valide**. Il file regolare permette il posizionamento. La pipe è aperta e leggibile dal suo estremo di lettura, ma non ha una posizione: `ESPIPE` indica l'operazione non supportata, non un descriptor chiuso. Nessuna prova legge dalla pipe o modifica il contenuto del file.

```rust
#![cfg(unix)]

use std::fs::File;
use std::io::{Seek, SeekFrom};
use std::os::fd::AsFd;
use unix_notes::{position_nix, position_raw};

#[test]
fn regular_file_keeps_its_offset() {
    let mut file = File::open("Cargo.toml").unwrap();
    for offset in [0_u64, 3] {
        file.seek(SeekFrom::Start(offset)).unwrap();
        assert_eq!(position_raw(file.as_fd()).unwrap(), offset as libc::off_t);
        assert_eq!(position_nix(file.as_fd()).unwrap(), offset as libc::off_t);
        assert_eq!(file.stream_position().unwrap(), offset);
    }
}

#[test]
fn pipe_is_open_but_not_seekable() {
    let (reader, _writer) = nix::unistd::pipe().unwrap();
    let err = position_raw(reader.as_fd()).unwrap_err();
    assert_eq!(err.raw_os_error(), Some(libc::ESPIPE));
    assert_eq!(position_nix(reader.as_fd()), Err(nix::errno::Errno::ESPIPE));
}
```

Su Linux, dalla radice della crate:

```sh
cargo test --test position
```

Il risultato atteso è **due test passati**. `File` e i due `OwnedFd` restituiti da `pipe()` chiudono ciascuno il proprio descriptor tramite `Drop`; `as_fd()` crea solo un prestito e `as_raw_fd()` non duplica né trasferisce nulla. Su Windows nativo questi due test sono esclusi: un riepilogo con zero test non dimostra che il codice Unix funzioni.

## Varianti e limiti

- **Altri sistemi Unix:** `cfg(unix)` indica una famiglia, non la disponibilità di ogni API su ogni membro. Per una funzione esclusiva di Linux usa una condizione più stretta, come `cfg(target_os = "linux")`.
- **Windows nativo:** usa la standard library oppure le API e i tipi Windows appropriati. Il fatto che `libc` esponga anche alcuni binding non Unix non rende `nix` o un descriptor POSIX portabili.
- **Libreria esterna diversa dall'API di sistema:** verifica se esistono binding dedicati. Una dichiarazione FFI o un binding generato non sostituiscono la documentazione del contratto.

## Errori comuni

- **Import non risolto:** se usi la versione della nota, controlla prima le feature nel manifest e poi il target. Aggiungere `unsafe` non rende disponibile una funzione esclusa dalla compilazione.
- **Chiamare `close` sul risultato di `as_raw_fd()`:** quel numero appartiene ancora al proprietario. Chiuderlo manualmente può far sì che il proprietario chiuda in seguito un descriptor riutilizzato per un'altra risorsa.
- **Applicare la regola di `lseek` a ogni funzione C:** il valore che indica il fallimento è specifico dell'API. Per `getpid` non c'è alcun motivo di leggere `errno`.

## Checklist

- La stessa operazione è già disponibile in `std`?
- Ho controllato versione, feature e target della funzione di `nix`?
- Quale oggetto possiede il descriptor e fino a quando dura il prestito?
- Ho provato sia un risultato valido uguale a zero sia un errore documentato dell'operazione?

## Collegamenti

- [[Programmazione/Rust/Pagine/FFI|FFI]]
- [[Programmazione/Rust/Pagine/File descriptor|File descriptor]]
- [[Programmazione/Rust/Pagine/Memory mapping|Memory mapping]]
- [[Programmazione/Rust/Pagine/Raw pointers|Raw pointers]]
- [[Programmazione/Rust/Pagine/Unsafe abstractions sicure|Unsafe abstractions sicure]]

## Fonti

- [nix 0.29.0: getpid](https://docs.rs/nix/0.29.0/nix/unistd/fn.getpid.html), [lseek](https://docs.rs/nix/0.29.0/nix/unistd/fn.lseek.html) e [pipe](https://docs.rs/nix/0.29.0/nix/unistd/fn.pipe.html).
- [Rust libc: binding di sistema](https://rust-lang.github.io/libc/) e [standard library: BorrowedFd](https://doc.rust-lang.org/std/os/fd/struct.BorrowedFd.html).
- [POSIX: lseek, valori di ritorno ed ESPIPE](https://pubs.opengroup.org/onlinepubs/9799919799/functions/lseek.html) e [getpid](https://pubs.opengroup.org/onlinepubs/9799919799/functions/getpid.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
