---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - standard-library
aliases:
  - "std::process::Command"
  - "Processi Rust"
  - "Command Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Result]]"
  - "[[Programmazione/Rust/Pagine/OsStr e OsString]]"
  - "[[Programmazione/Rust/Pagine/Path e PathBuf]]"
related:
  - "[[Programmazione/Rust/Pagine/CLI con clap]]"
  - "[[Programmazione/Rust/Pagine/File I O]]"
  - "[[Programmazione/Rust/Pagine/OsStr e OsString]]"
---

# Process e Command

## Sintesi

`std::process::Command` permette di avviare processi esterni, passare argomenti, impostare ambiente, gestire working directory e catturare output. E l'API standard per interagire con programmi di sistema.

Gli argomenti vanno passati come argomenti separati, non concatenati in una stringa shell.

## Quando usarlo

- Quando devi invocare un comando esterno.
- Quando vuoi catturare stdout, stderr e exit status.
- Quando devi impostare variabili d'ambiente o directory di lavoro.
- Quando scrivi tool CLI che orchestrano altri programmi.

## Come funziona

```rust
use std::process::Command;

let status = Command::new("git")
    .arg("--version")
    .status()?;
```

`status()` esegue e restituisce exit status. `output()` cattura stdout e stderr. `spawn()` avvia il processo e restituisce un handle.

## API / Sintassi

Catturare output:

```rust
let output = Command::new("rustc")
    .arg("--version")
    .output()?;

if output.status.success() {
    println!("{}", String::from_utf8_lossy(&output.stdout));
}
```

Ambiente e working directory:

```rust
Command::new("cargo")
    .arg("test")
    .current_dir("my-crate")
    .env("RUST_BACKTRACE", "1")
    .status()?;
```

## Esempio pratico

```rust
use std::io;
use std::process::Command;

fn git_commit_hash() -> io::Result<Option<String>> {
    let output = Command::new("git")
        .args(["rev-parse", "HEAD"])
        .output()?;

    if !output.status.success() {
        return Ok(None);
    }

    Ok(Some(String::from_utf8_lossy(&output.stdout).trim().to_owned()))
}
```

La funzione distingue errore I/O da comando eseguito ma fallito.

## Varianti

- `status()`: esegue e restituisce exit status.
- `output()`: esegue e cattura output.
- `spawn()`: avvia e permette controllo del processo figlio.
- `Stdio`: configura stdin, stdout, stderr.
- `args([...])`: passa argomenti multipli in modo sicuro.

## Errori comuni

- Costruire una stringa shell unica invece di usare `.arg()` o `.args()`.
- Ignorare `status.success()`.
- Assumere che stdout sia UTF-8 valido.
- Confondere fallimento del comando con errore di avvio del processo.
- Esporre input utente a una shell senza sanitizzazione.

## Checklist

- Gli argomenti sono passati separatamente?
- Devi catturare output o basta lo status?
- Hai controllato exit status?
- stdout/stderr possono non essere UTF-8?
- Serve impostare working directory o ambiente?

## Collegamenti

- [[Programmazione/Rust/Pagine/OsStr e OsString|OsStr e OsString]]
- [[Programmazione/Rust/Pagine/Path e PathBuf|Path e PathBuf]]
- [[Programmazione/Rust/Pagine/File I O|File I O]]
- [[Programmazione/Rust/Pagine/CLI con clap|CLI con clap]]
- [[Programmazione/Rust/Pagine/Result|Result]]
