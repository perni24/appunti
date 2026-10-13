---
date: 2026-07-30
area: Programmazione
topic: Promemoria Rust
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - rust
  - promemoria
  - file
  - path
  - serde
aliases:
  - Cheatsheet file Rust
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/File I O]]"
  - "[[Programmazione/Rust/Pagine/Path e PathBuf]]"
  - "[[Programmazione/Rust/Pagine/Serde e serializzazione]]"
title: Rust - File, percorsi e Serde
---

# Rust - File, percorsi e Serde

## Leggere e scrivere testo

```rust
use std::fs;

let content = fs::read_to_string("data.txt")?;
fs::write("output.txt", content)?;
```

## Leggere byte

```rust
let bytes = fs::read("image.bin")?;
fs::write("copy.bin", &bytes)?;
```

## File

```rust
use std::fs::{File, OpenOptions};
use std::io::Write;

let mut file = File::create("output.txt")?;
file.write_all(b"hello")?;
```

```rust
let mut file = OpenOptions::new()
    .create(true)
    .append(true)
    .open("app.log")?;
```

## Leggere per righe

```rust
use std::fs::File;
use std::io::{BufRead, BufReader};

let file = File::open("data.txt")?;

for line in BufReader::new(file).lines() {
    let line = line?;
    println!("{line}");
}
```

## Percorsi

```rust
use std::path::{Path, PathBuf};

let path = Path::new("data").join("users.json");
let mut output = PathBuf::from("output");
output.push("result.json");
```

```rust
path.exists()
path.is_file()
path.file_name()
path.extension()
path.parent()
```

## Directory

```rust
fs::create_dir_all("output/data")?;

for entry in fs::read_dir("output")? {
    let path = entry?.path();
    println!("{}", path.display());
}
```

## Serde

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: u64,
    name: String,
}
```

```rust
let user: User = serde_json::from_str(&json)?;
let json = serde_json::to_string_pretty(&user)?;
```

```rust
let content = fs::read_to_string("user.json")?;
let user: User = serde_json::from_str(&content)?;
```

Serde e `serde_json` sono dipendenze esterne da dichiarare in `Cargo.toml`.

## Approfondimento

- [[Programmazione/Rust/Pagine/File I O|File I O]]
- [[Programmazione/Rust/Pagine/Path e PathBuf|Path e PathBuf]]
- [[Programmazione/Rust/Pagine/OsStr e OsString|OsStr e OsString]]
- [[Programmazione/Rust/Pagine/Serde e serializzazione|Serde e serializzazione]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]


## Navigazione

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]
