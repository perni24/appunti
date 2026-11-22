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
  - File descriptor
  - fd
prerequisites:
  - "[[Programmazione/Rust/Pagine/File I O]]"
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/libc e nix]]"
related:
  - "[[Programmazione/Rust/Pagine/FFI]]"
  - "[[Programmazione/Rust/Pagine/Process e Command]]"
  - "[[Programmazione/Rust/Pagine/Memory mapping]]"
title: File descriptor
---

# File descriptor

## Sintesi

Su Unix, un **file descriptor** (fd) è un numero nella tabella dei descriptor del processo. Può identificare un file, un estremo di una pipe, un socket o un dispositivo. Il numero **non dice chi deve chiuderlo**: lo decide il contratto dell'API. In Rust `BorrowedFd<'_>` esprime un prestito, `OwnedFd` la responsabilità della chiusura e `RawFd` soltanto il numero.

Distinzione pratica: **duplicare** crea un secondo descriptor da chiudere, ma **non** un cursore indipendente. **Trasferire** cambia il proprietario senza creare un secondo descriptor.

## Quando usarlo

Per leggere un file o avviare un processo resta su `File`, `Read`, `Write` e `Command`. Scendi al livello dei descriptor quando lo richiede l'interfaccia: una chiamata POSIX o FFI, un event loop che monitora socket o pipe, un mapping oppure la configurazione dell'eredità dopo `exec`.

## Come funziona

### Il numero e lo stato del file non sono la stessa cosa

Su un file regolare, `open` crea una *open file description*: lo stato nel kernel che include la posizione corrente e i *file status flags*. La voce numerata del processo punta a quella descrizione. Due aperture separate dello stesso percorso hanno normalmente **due cursori distinti**; `dup` produce invece due voci che puntano alla **stessa descrizione**. Entrambe raggiungono lo stesso contenuto del file.

| Operazione | Nuovo descriptor? | Chi chiude? | Posizione del file |
| --- | --- | --- | --- |
| `file.as_fd()` | No | Resta responsabile `file`. | È un prestito dello stesso descriptor. |
| `file.try_clone()?` | Sì, su Unix | Ogni `File` chiude il proprio descriptor. | Condivisa: una lettura o un seek sono visibili dall'altro. |
| `let owned: OwnedFd = file.into();` | No | Il nuovo proprietario, `owned`. | Invariata. Il vecchio `file` è stato consumato. |
| Secondo `File::open(path)?` | Sì | Il `File` ottenuto dalla seconda apertura. | Indipendente, anche se il percorso identifica lo stesso file. |

Non tutto è condiviso tra duplicati. Per esempio, `O_NONBLOCK` è un flag della descrizione aperta; modificarlo può influire sull'altro descriptor. `FD_CLOEXEC` è invece un flag **del singolo descriptor**: su un `exec` riuscito chiude quella voce, non tutte le copie. Non confondere `exec` con `fork` e non presumere che ogni API di duplicazione imposti gli stessi flag. Se il descriptor deve nascere non ereditabile, preferisci un'API che imposti il flag contestualmente alla creazione.

## API / Sintassi

| Se l'API deve… | Firma o conversione | Effetto |
| --- | --- | --- |
| Usare la risorsa soltanto durante la chiamata | `BorrowedFd<'_>`, ottenuto con `as_fd()` | Il lifetime la lega al proprietario; il chiamato non la chiude. |
| Conservare accesso dopo la fine del prestito | `fd.try_clone_to_owned()?` | Da un prestito crea un `OwnedFd` distinto. La duplicazione può fallire. |
| Prendere la responsabilità della chiusura | Ricevere un `OwnedFd` per valore | Se il mittente ha un `File`, basta `file.into()`: nessun `unsafe`, nessuna duplicazione. |
| Passare un intero a C **senza** cedere la risorsa | `fd.as_raw_fd()` | Il numero va usato solo entro il prestito; il codice C non deve chiuderlo né conservarlo oltre la durata concordata. |
| Consegnare il descriptor a un'API che prende ownership | `into_raw_fd()` | Consuma il proprietario senza chiudere. Occorre sapere chi chiude anche se la chiamata fallisce. |
| Adottare un numero di cui si è ricevuta l'ownership | `unsafe { OwnedFd::from_raw_fd(raw) }` | Richiede un descriptor aperto, di cui si ha il diritto esclusivo di chiudere **quella voce**. Un altro descriptor duplicato può legittimamente esistere. |

`from_raw_fd` **non** controlla il contratto e non duplica il numero. Non basta che «nessun altro oggetto Rust lo possieda»: potrebbe appartenere ancora a una libreria C. Per una vera chiamata a un'API di sistema che prende solo un prestito, vedi i wrapper di `lseek` in [[Programmazione/Rust/Pagine/libc e nix|libc e nix]].

## Esempio pratico

I due file di test seguenti possono stare in una normale crate Cargo, senza dipendenze esterne. L'esempio con `std::io::pipe` richiede Rust 1.87 o successivo. Esegui i comandi dalla radice della crate.

### Osservare il cursore condiviso

In `tests/offset.rs` apriamo il manifest **in sola lettura**. Non serve conoscerne il contenuto: spostiamo il cursore senza scrivere. Il duplicato segue il primo `File`, la seconda apertura no.

```rust
use std::fs::File;
use std::io::{self, Seek, SeekFrom};

#[test]
fn cloned_file_shares_offset() -> io::Result<()> {
    let mut first = File::open("Cargo.toml")?;
    let mut duplicate = first.try_clone()?;
    let mut separate = File::open("Cargo.toml")?;

    first.seek(SeekFrom::Start(3))?;
    assert_eq!(duplicate.stream_position()?, 3);
    assert_eq!(separate.stream_position()?, 0);

    duplicate.rewind()?;
    assert_eq!(first.stream_position()?, 0);
    drop(first);
    assert_eq!(duplicate.seek(SeekFrom::Start(2))?, 2);
    Ok(())
}
```

```sh
cargo test --test offset
```

Il test usa l'API portabile di `File`; si può eseguire anche su Windows. Non richiede che un handle Windows sia un fd POSIX.

### Su Unix: un proprietario in più oppure un semplice passaggio di mano?

In `tests/ownership.rs`, il primo test tiene un duplicato dell'estremo di scrittura di una pipe: chiudere l'originale **non** interrompe il flusso. Dopo aver chiuso anche il duplicato, il lettore consuma i dati rimasti e raggiunge EOF. Il secondo test fa il contrario: cambia il proprietario di un descriptor senza duplicarlo.

```rust
#![cfg(unix)]

use std::fs::File;
use std::io::{self, Read, Write};
use std::os::fd::{AsFd, AsRawFd, BorrowedFd, FromRawFd, IntoRawFd, OwnedFd};

fn keep_for_later(fd: BorrowedFd<'_>) -> io::Result<OwnedFd> {
    fd.try_clone_to_owned()
}

#[test]
fn duplicate_outlives_original() -> io::Result<()> {
    let (mut reader, writer) = io::pipe()?;
    let copy = keep_for_later(writer.as_fd())?;
    assert_ne!(writer.as_raw_fd(), copy.as_raw_fd());
    drop(writer);

    let mut last_writer = File::from(copy);
    last_writer.write_all(b"ok")?;
    drop(last_writer);

    let mut bytes = Vec::new();
    reader.read_to_end(&mut bytes)?;
    assert_eq!(bytes, b"ok");
    Ok(())
}

#[test]
fn transfer_keeps_number() -> io::Result<()> {
    let (mut reader, writer) = io::pipe()?;
    let number = writer.as_raw_fd(); // osservazione, non un nuovo proprietario
    let owned: OwnedFd = writer.into();
    assert_eq!(owned.as_raw_fd(), number);

    let raw = owned.into_raw_fd();
    // SAFETY: raw proviene dal trasferimento sopra, è ancora aperto
    // e nessun altro ha acquisito il diritto di chiudere questo descriptor.
    let adopted = unsafe { OwnedFd::from_raw_fd(raw) };
    assert_eq!(adopted.as_raw_fd(), number);
    drop(adopted);

    let mut byte = [0; 1];
    assert_eq!(reader.read(&mut byte)?, 0); // nessun dato e nessun writer
    Ok(())
}
```

```sh
cargo test --test ownership
```

Su Unix sono attesi **due test passati**. Su Windows nativo `cfg(unix)` li esclude: zero test non è un collaudo delle API Unix. Il passaggio attraverso il numero nel secondo test serve soltanto a mostrare il contratto di una FFI; fra componenti Rust passa direttamente l'`OwnedFd`.

## Varianti e limiti

- **Descrittori standard:** su Unix 0, 1 e 2 sono convenzionalmente stdin, stdout e stderr, ma possono essere reindirizzati o chiusi. `std::io::stdin()` dà accesso allo stream condiviso del processo: rilasciare quel valore **non** chiude il descriptor 0. Non costruirne un `OwnedFd` per convenienza.
- **Pipe e socket:** non tutti i descriptor hanno una posizione. Una pipe vuota con almeno un writer aperto non indica EOF: in modalità bloccante una lettura può attendere altri dati. Chiudi le copie superflue prima di attendere la fine del flusso.
- **Windows nativo:** usa le API appropriate in `std::os::windows::io`, come `OwnedHandle` o `OwnedSocket`. Non convertire numericamente una di queste risorse in un fd Unix.

## Errori comuni

- **Conservare il risultato di `as_raw_fd()` dopo il drop:** copiare l'intero non mantiene aperto nulla; quel numero può essere riassegnato a un'altra risorsa.
- **Chiudere un fd preso in prestito o creare due proprietari dello stesso numero:** il proprietario originario non viene informato. Se serve una seconda chiusura indipendente, duplica il descriptor con un'API fallibile.
- **Clonare per leggere in parallelo da offset indipendenti:** i due cursori si spostano insieme. Riapri il file oppure usa I/O posizionale, come `FileExt::read_at` su Unix, se non vuoi modificare l'offset condiviso.
- **Aspettare la persistenza dei dati da `Drop`:** la chiusura automatica non restituisce un `Result` al chiamante. Gestisci gli errori delle scritture e, quando serve la persistenza, valuta `File::sync_all` esplicitamente.

## Checklist

- L'API usa il descriptor soltanto durante la chiamata, lo conserva o ne assume la chiusura?
- Se lo duplica, è corretto che offset e file status flags restino condivisi?
- Tutti gli estremi di scrittura che potrebbero impedire EOF sono chiusi quando necessario?
- Se passa a un altro eseguibile, ho verificato quali descriptor devono sopravvivere a `exec`?

## Collegamenti

- [[Programmazione/Rust/Pagine/File I O|File I/O]]
- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/libc e nix|libc e nix]]
- [[Programmazione/Rust/Pagine/FFI|FFI]]
- [[Programmazione/Rust/Pagine/Process e Command|Process e Command]]
- [[Programmazione/Rust/Pagine/Memory mapping|Memory mapping]]

## Fonti

- [Rust: sicurezza I/O e tipi fd](https://doc.rust-lang.org/std/os/fd/index.html), [BorrowedFd::try_clone_to_owned](https://doc.rust-lang.org/std/os/fd/struct.BorrowedFd.html#method.try_clone_to_owned) e [FromRawFd](https://doc.rust-lang.org/std/os/fd/trait.FromRawFd.html).
- [Rust: File::try_clone](https://doc.rust-lang.org/std/fs/struct.File.html#method.try_clone), [pipe anonima](https://doc.rust-lang.org/std/io/fn.pipe.html) e [stdin condiviso](https://doc.rust-lang.org/std/io/fn.stdin.html).
- [Linux man-pages: open file description](https://man7.org/linux/man-pages/man2/open.2.html), [stato condiviso da dup](https://man7.org/linux/man-pages/man2/dup.2.html) e [condizioni di EOF su pipe](https://man7.org/linux/man-pages/man7/pipe.7.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
