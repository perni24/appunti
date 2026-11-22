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
  - Memory mapping
  - mmap
prerequisites:
  - "[[Programmazione/Rust/Pagine/File descriptor]]"
  - "[[Programmazione/Rust/Pagine/Memory layout e alignment]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
related:
  - "[[Programmazione/Rust/Pagine/File I O]]"
  - "[[Programmazione/Rust/Pagine/libc e nix]]"
  - "[[Programmazione/Rust/Pagine/Performance e profiling]]"
title: Memory mapping
---

# Memory mapping

## Sintesi

Una mappa associa un intervallo di **indirizzi virtuali** a una sorgente, per esempio una parte di un file. Con `memmap2` puoi leggere quei byte come una slice senza caricare prima tutto il file in un `Vec<u8>`. Non significa che i dati siano già in RAM: accedere a una pagina non residente può richiedere I/O.

La domanda decisiva non è solo «quanto è grande il file?», ma **«chi può modificarlo mentre leggo la mappa?»**. Un `File` aperto in sola lettura limita quel particolare handle; non rende immutabile il contenuto per gli altri.

## Quando usarlo

| Scenario | Prima scelta | Perché |
| --- | --- | --- |
| Leggere una sola intestazione o scorrere righe in ordine | `Read` o `BufReader` | Il codice è semplice e può riportare errori di lettura tramite `Result`. Per quattro byte non occorre una mappa. |
| Consultare ripetutamente posizioni diverse di un indice stabile | Mappa in sola lettura | Gli offset diventano intervalli di una slice. Valuta i page fault sul carico reale, non soltanto il tempo di creazione della mappa. |
| Elaborare un file che altri possono riscrivere o troncare | Lettura in memoria posseduta oppure uno snapshot realmente immutabile | Un buffer già letto non cambia per scritture successive. La lettura non è comunque uno snapshot atomico se il produttore modifica il file mentre lo copi. |
| Provare trasformazioni senza aggiornare il file sorgente | Mappa privata copy-on-write | I byte modificati tramite quella mappa restano privati. Non è una garanzia di snapshot rispetto a modifiche *esterne*. |

## Come funziona

**File, mappa e slice hanno durate diverse.** Il file serve per costruire la mappa. Una `Mmap` riuscita rimane utilizzabile dopo il rilascio del `File` originale; la slice ottenuta dalla mappa, invece, non può sopravvivere alla mappa. `Drop` rilascia la vista. Conservare aperto il `File` non protegge da un altro handle che modifica il contenuto.

I costruttori di mappe su file di `memmap2` sono `unsafe`: Rust controlla i prestiti nel programma, non tutti gli accessi al file da thread, handle o processi esterni. Negli esempi il file viene creato per la prova, non è condiviso e nessuno scrive o ridimensiona il file mentre una vista è viva, se non **tramite la vista mutabile stessa**. Un controllo iniziale con `metadata().len()` o un commento `SAFETY` non fanno valere questo contratto per un percorso arbitrario. I lock sono utili solo nei limiti delle garanzie della piattaforma e del protocollo rispettato dagli altri partecipanti.

### Scegliere la vista

| API di `memmap2` | Scritture tramite la vista | Rapporto con il file |
| --- | --- | --- |
| `MmapOptions::map` | No; espone `&[u8]`. | Legge l'intervallo mappato. Non lo rende immutabile agli altri. |
| `MmapOptions::map_mut` | Sì, con una vista mutabile. | Le modifiche riguardano il file. `flush()` permette di attendere la sincronizzazione dei dati e ricevere un eventuale errore. |
| `MmapOptions::map_copy` | Sì, copy-on-write. | Le modifiche tramite la vista **non** vengono riportate nel file. |
| `MmapMut::map_anon` | Sì. | Non è associata a un file da aggiornare; non serve il contratto di stabilità di un file esterno. |

`offset` è uno spostamento in **byte dall'inizio del file**, non dalla posizione corrente del cursore di `File`. `len` è l'estensione della vista, non una richiesta di aumentare la dimensione del file. Con le API native l'offset deve rispettare la granularità della piattaforma (pagina su Unix, granularità di allocazione su Windows); `memmap2` gestisce internamente l'allineamento della vista. Questo non rende ogni offset adatto a un riferimento Rust di tipo `&u32`.

## API / Sintassi

Gli esempi seguenti sono test di una crate Cargo (edition 2024). Aggiungi al suo `Cargo.toml` queste dipendenze di test; non occorre preparare né sovrascrivere alcun file di dati:

```toml
[dev-dependencies]
memmap2 = "=0.9.9"
tempfile = "=3.23.0"
```

In `tests/header.rs`, il formato di esempio è `NOTE`, seguito da una lunghezza `u32` little-endian e dal payload. Il parser prende una normale slice: la validazione del formato non dipende dall'origine dei byte. Restituisce `None` se la firma è errata, l'header è incompleto o il numero di byte successivi non corrisponde alla lunghezza.

```rust
use memmap2::MmapOptions;
use std::io::{self, Write};

fn payload(bytes: &[u8]) -> Option<&[u8]> {
    let (header, rest) = bytes.split_at_checked(8)?;
    if &header[..4] != b"NOTE" {
        return None;
    }
    let len = u32::from_le_bytes(header[4..8].try_into().ok()?);
    (rest.len() == usize::try_from(len).ok()?).then_some(rest)
}

#[test]
fn read_after_file_drop() -> io::Result<()> {
    let map = {
        let mut file = tempfile::tempfile()?;
        file.write_all(b"NOTE\x03\x00\x00\x00abc")?;
        // SAFETY: file privato appena creato, nessun altro writer;
        // contenuto e dimensione restano invariati per tutta la vista.
        unsafe { MmapOptions::new().map(&file)? }
    };
    assert_eq!(payload(&map), Some(&b"abc"[..]));
    Ok(())
}

#[test]
fn rejects_incomplete_or_inconsistent_records() {
    assert_eq!(payload(b""), None);
    assert_eq!(payload(b"NO"), None);
    assert_eq!(payload(b"FAIL\0\0\0\0"), None);
    assert_eq!(payload(b"NOTE\x02\0\0\0x"), None);
    assert_eq!(payload(b"NOTE\0\0\0\0x"), None);
    assert_eq!(payload(b"NOTE\0\0\0\0"), Some(&b""[..]));
}
```

La slice restituita punta dentro `map`: se i dati devono uscire da quello scope, copia il payload in un `Vec` oppure conserva la mappa e ricava la slice quando serve. Per un percorso non controllato puoi usare lo stesso parser sui byte di `std::fs::read`, senza costruire una mappa file-backed.

## Esempio pratico

In `tests/writeback.rs` la stessa sequenza iniziale passa attraverso due viste **non sovrapposte nel tempo**. Dopo la vista condivisa il file contiene `DATA`; dopo quella privata la vista mostra `EDIT`, ma il file contiene ancora `DATA`.

```rust
use memmap2::MmapOptions;
use std::fs::File;
use std::io::{self, Read, Seek, Write};

fn read_word(file: &mut File) -> io::Result<[u8; 4]> {
    file.rewind()?;
    let mut word = [0; 4];
    file.read_exact(&mut word)?;
    Ok(word)
}

#[test]
fn shared_and_private_writes() -> io::Result<()> {
    let mut file = tempfile::tempfile()?;
    file.write_all(b"INIT")?;

    {
        // SAFETY: quattro byte già presenti; il file privato non viene
        // ridimensionato né usato da altri lettori o writer durante la vista.
        let mut shared = unsafe { MmapOptions::new().len(4).map_mut(&file)? };
        shared.copy_from_slice(b"DATA");
        shared.flush()?;
    }
    assert_eq!(&read_word(&mut file)?, b"DATA");

    {
        // SAFETY: nessuna vista precedente è viva; il file resta invariato.
        let mut private = unsafe { MmapOptions::new().len(4).map_copy(&file)? };
        private.copy_from_slice(b"EDIT");
        assert_eq!(&private[..], b"EDIT");
    }
    assert_eq!(&read_word(&mut file)?, b"DATA");
    Ok(())
}
```

Esegui dalla radice della crate:

```sh
cargo test --test header --test writeback
```

Sono attesi **tre test passati**. La rilettura controlla quali byte vede il file nello stesso processo; **non simula una perdita di alimentazione**.

## Varianti e limiti

- **Visibilità e persistenza non sono la stessa cosa.** Su una vista file-backed condivisa, `MmapMut::flush()` riuscito garantisce, secondo il contratto della crate, la scrittura durevole delle modifiche pendenti ai dati mappati; non promette l'aggiornamento di tutti i metadati. `flush_async()` può tornare prima del completamento. `Drop` non è un punto in cui il chiamante possa gestire un errore di flush.
- **Persistenza e atomicità sono distinte.** Un flush non rende transazionale un aggiornamento in più passi e non è un lock tra processi. Per pubblicare un indice completo ai lettori serve un protocollo separato. Una mappa privata non si trasforma in condivisa chiamando `flush`.
- **Regioni speciali.** La memoria anonima, la memoria condivisa tra processi e le mappature di device non sono intercambiabili. Per i device valgono anche le regole del driver e dell'hardware: non applicare automaticamente il modello di un file regolare.
- **Portabilità.** `libc::mmap` o un wrapper Unix di `nix` espongono dettagli POSIX. Windows ha API diverse; scegliere una crate multipiattaforma non elimina i vincoli del filesystem o la necessità di misurare il carico reale.

## Errori comuni

- **Controllare solo l'indice nella slice.** `get` verifica i limiti della vista, non che il file sia ancora stabile. In particolare una troncatura può rendere inaccessibili pagine già mappate; l'accesso non diventa per questo un normale `io::Error` del parser.
- **Confondere la vista con un `Vec<u8>`.** Scrivere in una mappa mutabile non permette di fare `push` o di estenderla. Definisci intervallo e dimensione prima di mapparla.
- **Reinterpretare i byte come una struct.** Controlla firma, lunghezze, valori e ordine dei byte; `repr(C)` non definisce il formato su disco. Vedi [[Programmazione/Rust/Pagine/Memory layout e alignment|Memory layout e alignment]].

## Checklist

- Chi garantisce che la regione del file resti valida per tutta la vita della mappa?
- Voglio modificare il file o solo una copia privata delle pagine?
- Ho distinto gli errori di apertura e mapping dagli errori di formato?
- Per i dati da conservare ho un punto esplicito per gestire errori di sincronizzazione, senza confonderlo con un commit atomico?

## Collegamenti

- [[Programmazione/Rust/Pagine/File descriptor|File descriptor]]
- [[Programmazione/Rust/Pagine/File I O|File I/O]]
- [[Programmazione/Rust/Pagine/Memory layout e alignment|Memory layout e alignment]]
- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/libc e nix|libc e nix]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]

## Fonti

- [memmap2 0.9.9: sicurezza dei costruttori e opzioni](https://docs.rs/memmap2/0.9.9/memmap2/struct.MmapOptions.html) e [contratto di flush](https://docs.rs/memmap2/0.9.9/memmap2/struct.MmapMut.html#method.flush).
- [tempfile 3.23.0: file temporaneo senza percorso da gestire](https://docs.rs/tempfile/3.23.0/tempfile/fn.tempfile.html).
- [Linux man-pages: mmap](https://man7.org/linux/man-pages/man2/mmap.2.html) e [Microsoft: MapViewOfFile](https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-mapviewoffile).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
