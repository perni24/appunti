---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - standard-library
aliases:
  - "Path"
  - "PathBuf"
  - "Percorsi Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Stringhe String e &str]]"
  - "[[Programmazione/Rust/Pagine/AsRef AsMut e Borrow]]"
  - "[[Programmazione/Rust/Pagine/OsStr e OsString]]"
related:
  - "[[Programmazione/Rust/Pagine/File I O]]"
  - "[[Programmazione/Rust/Pagine/Process e Command]]"
  - "[[Programmazione/Rust/Pagine/Configurazione applicativa]]"
---

# Path e PathBuf

## Sintesi

`Path` e `PathBuf` sono i tipi standard per rappresentare percorsi filesystem. `Path` e una vista borrowed, simile a `str`. `PathBuf` e il percorso posseduto e modificabile, simile a `String`.

Non conviene trattare i path come stringhe normali: su sistemi diversi possono avere rappresentazioni diverse e non sempre sono UTF-8 valido.

## Quando usarlo

- Usa `&Path` quando una funzione deve leggere un percorso senza possederlo.
- Usa `PathBuf` quando devi costruire, modificare o conservare un percorso.
- Usa `AsRef<Path>` nelle API per accettare `&str`, `String`, `Path` e `PathBuf`.
- Usa i metodi di `Path` per componenti, estensioni, file name e join.

## Come funziona

```rust
use std::path::{Path, PathBuf};

let path = Path::new("data/config.toml");
let mut owned = PathBuf::from("data");
owned.push("config.toml");
```

`Path` non possiede il dato. `PathBuf` possiede il buffer del percorso.

## API / Sintassi

```rust
let path = Path::new("/tmp/file.txt");

let file_name = path.file_name();
let extension = path.extension();
let parent = path.parent();
```

Funzione ergonomica:

```rust
fn load<P: AsRef<Path>>(path: P) -> std::io::Result<String> {
    std::fs::read_to_string(path)
}
```

Costruzione:

```rust
let path = PathBuf::from("logs").join("app.log");
```

## Esempio pratico

```rust
use std::path::{Path, PathBuf};

fn backup_path<P: AsRef<Path>>(path: P) -> PathBuf {
    let path = path.as_ref();
    let mut backup = path.to_path_buf();
    backup.set_extension("bak");
    backup
}
```

La funzione accetta qualsiasi tipo convertibile a `Path` e restituisce un `PathBuf` posseduto.

## Varianti

- `Path`: vista borrowed su un percorso.
- `PathBuf`: percorso posseduto.
- `OsStr` e `OsString`: rappresentazione sottostante per stringhe OS.
- `AsRef<Path>`: bound comune per API filesystem.
- `std::fs`: funzioni operative su file e directory.

## Errori comuni

- Usare `String` per manipolare percorsi.
- Convertire path in UTF-8 con `to_str().unwrap()`.
- Concatenare path con `/` come stringhe invece di usare `join`.
- Confondere `file_name`, `stem` ed `extension`.
- Dimenticare differenze tra path assoluti e relativi.

## Checklist

- La funzione deve possedere il percorso o solo leggerlo?
- `AsRef<Path>` rende l'API piu ergonomica?
- Il path potrebbe non essere UTF-8 valido?
- Stai usando `join` invece di concatenare stringhe?
- Hai gestito errori di filesystem con `Result`?

## Collegamenti

- [[Programmazione/Rust/Pagine/OsStr e OsString|OsStr e OsString]]
- [[Programmazione/Rust/Pagine/File I O|File I O]]
- [[Programmazione/Rust/Pagine/AsRef AsMut e Borrow|AsRef AsMut e Borrow]]
- [[Programmazione/Rust/Pagine/Process e Command|Process e Command]]
- [[Programmazione/Rust/Pagine/Stringhe String e &str|Stringhe String e &str]]
