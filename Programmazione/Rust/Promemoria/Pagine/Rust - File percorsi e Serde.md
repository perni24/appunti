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
  - "[[Programmazione/Rust/Pagine/File I O|File I O]]"
  - "[[Programmazione/Rust/Pagine/Path e PathBuf|Path e PathBuf]]"
  - "[[Programmazione/Rust/Pagine/Serde e serializzazione|Serde e serializzazione]]"
title: Rust - File, percorsi e Serde
---

# Rust - File, percorsi e Serde

Scegli `read_to_string` per testo UTF-8, `read` per byte arbitrari e `BufReader` per scorrere un file senza caricarlo tutto. I due esempi sono programmi indipendenti: copia ciascuno in `src/main.rs` di un progetto binario ed esegui `cargo run` dalla radice del progetto.

## Scrivere, leggere e costruire percorsi

Lavora in una cartella di prova. Il programma crea `memo-io/` nella directory corrente: se esiste già, si ferma senza modificarla. Nei programmi reali `fs::write` e `File::create` **troncano un file esistente**; per rifiutare una sovrascrittura usa `File::create_new`.

```rust
use std::fs::{self, File, OpenOptions};
use std::io::{self, BufRead, BufReader, Write};
use std::path::{Path, PathBuf};

fn main() -> io::Result<()> {
    let root = Path::new("memo-io");
    fs::create_dir(root)?; // AlreadyExists anche alla seconda esecuzione
    let mut dir = PathBuf::from(root);
    dir.push("data");
    fs::create_dir_all(&dir)?;

    let path = dir.join("note.txt");
    fs::write(&path, "prima\n")?;
    writeln!(OpenOptions::new().append(true).open(&path)?, "seconda")?;
    let text = fs::read_to_string(&path)?;
    assert_eq!(text.lines().count(), 2);

    for line in BufReader::new(File::open(&path)?).lines() {
        println!("{}", line?); // anche una singola lettura può fallire
    }
    let binary = dir.join("raw.bin");
    File::create_new(&binary)?.write_all(&[0, 255])?;
    assert_eq!(fs::read(&binary)?, [0, 255]);
    for entry in fs::read_dir(&dir)? {
        println!("{}", entry?.path().display()); // ordine non garantito
    }
    Ok(())
}
```

`Path` è una vista, `PathBuf` possiede il percorso. `join`, `parent`, `file_name` ed `extension` non richiedono che il file esista; gli ultimi tre restituiscono `Option`. `exists` e `is_file` non garantiscono che l'apertura successiva riesca: gestisci l'errore di `open`.

## JSON con Serde

In `Cargo.toml` aggiungi queste voci alla sezione esistente, senza duplicare `[dependencies]`. La feature [derive di Serde](https://serde.rs/derive.html) genera le implementazioni dei trait; `serde_json` si occupa del formato.

```toml
[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

Questo programma crea `memo-user.json` e rifiuta di sovrascriverlo. `?` propaga sia gli errori di I/O sia quelli di deserializzazione.

```rust
use serde::{Deserialize, Serialize};
use std::{error::Error, fs, io::Write};

#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct User { id: u64, name: String }

fn main() -> Result<(), Box<dyn Error>> {
    let user = User { id: 7, name: "Ada".into() };
    let json = serde_json::to_string_pretty(&user)?;
    fs::File::create_new("memo-user.json")?.write_all(json.as_bytes())?;
    let text = fs::read_to_string("memo-user.json")?;
    assert_eq!(serde_json::from_str::<User>(&text)?, user);
    assert!(serde_json::from_str::<User>(r#"{"id":"sette","name":"Ada"}"#).is_err());
    Ok(())
}
```

## Collegamenti

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]
- [[Programmazione/Rust/Pagine/File I O|File I O]]
- [[Programmazione/Rust/Pagine/Path e PathBuf|Path e PathBuf]]
- [[Programmazione/Rust/Pagine/OsStr e OsString|OsStr e OsString]]
- [[Programmazione/Rust/Pagine/Serde e serializzazione|Serde e serializzazione]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]
