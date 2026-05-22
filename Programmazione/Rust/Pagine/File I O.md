---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags:
  - programmazione
  - rust
  - standard-library
aliases:
  - "File I/O"
  - "std::fs"
  - "std::io"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Result]]"
  - "[[Programmazione/Rust/Pagine/Path e PathBuf]]"
  - "[[Programmazione/Rust/Pagine/Operatore]]"
related:
  - "[[Programmazione/Rust/Pagine/OsStr e OsString]]"
  - "[[Programmazione/Rust/Pagine/File descriptor]]"
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
---

# File I/O

## Sintesi

La standard library offre `std::fs` per operazioni filesystem e `std::io` per lettura/scrittura tramite trait come `Read`, `Write` e `BufRead`. Quasi tutte le operazioni I/O restituiscono `Result`, perche file e filesystem possono fallire.

Il codice idiomatico accetta path flessibili con `AsRef<Path>` e propaga errori con `?`.

## Quando usarlo

- Quando devi leggere o scrivere file.
- Quando devi creare directory, controllare metadata o iterare directory.
- Quando devi gestire input/output sincrono.
- Quando vuoi usare buffer per leggere file grandi.

## Come funziona

Lettura semplice:

```rust
let text = std::fs::read_to_string("config.toml")?;
```

Scrittura semplice:

```rust
std::fs::write("out.txt", "hello")?;
```

Per file grandi o streaming si usano `File` e buffer.

## API / Sintassi

```rust
use std::fs::File;
use std::io::{self, BufRead, BufReader, Write};
use std::path::Path;

fn read_lines<P: AsRef<Path>>(path: P) -> io::Result<Vec<String>> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    reader.lines().collect()
}
```

Scrittura:

```rust
let mut file = File::create("out.txt")?;
writeln!(file, "linea")?;
```

## Esempio pratico

```rust
use std::io;
use std::path::Path;

fn copy_text<P: AsRef<Path>, Q: AsRef<Path>>(from: P, to: Q) -> io::Result<()> {
    let text = std::fs::read_to_string(from)?;
    std::fs::write(to, text)?;
    Ok(())
}
```

La funzione e semplice, ma mantiene path generici ed errori espliciti.

## Varianti

- `std::fs::read`, `read_to_string`, `write`: helper semplici.
- `File::open`, `File::create`: controllo esplicito.
- `BufReader`, `BufWriter`: buffering.
- `Read`, `Write`, `BufRead`: trait I/O.
- `OpenOptions`: apertura con flag specifici.

## Errori comuni

- Usare `unwrap()` su operazioni filesystem.
- Leggere file enormi interamente in memoria.
- Convertire path in stringa inutilmente.
- Ignorare buffering quando si leggono molte righe.
- Perdere contesto sull'errore, per esempio quale path ha fallito.

## Checklist

- Il file puo essere grande?
- Serve leggere tutto o streammare?
- Il path e gestito come `Path`/`PathBuf`?
- L'errore contiene abbastanza contesto?
- Serve creazione atomica o gestione di file esistenti?

## Collegamenti

- [[Programmazione/Rust/Pagine/Path e PathBuf|Path e PathBuf]]
- [[Programmazione/Rust/Pagine/OsStr e OsString|OsStr e OsString]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/File descriptor|File descriptor]]
