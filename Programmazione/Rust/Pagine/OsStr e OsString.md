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
  - "OsStr"
  - "OsString"
  - "Stringhe OS"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Stringhe String e &str]]"
  - "[[Programmazione/Rust/Pagine/Path e PathBuf]]"
related:
  - "[[Programmazione/Rust/Pagine/Process e Command]]"
  - "[[Programmazione/Rust/Pagine/File I O]]"
  - "[[Programmazione/Rust/Pagine/FFI]]"
---

# OsStr e OsString

## Sintesi

`OsStr` e `OsString` rappresentano stringhe nel formato nativo del sistema operativo. Sono usati per path, argomenti di processo, variabili d'ambiente e interazioni con API di sistema.

Non sempre una stringa OS e UTF-8 valida. Per questo non va trattata automaticamente come `String` o `&str`.

## Quando usarlo

- Quando lavori con path o nomi file.
- Quando leggi argomenti CLI dal sistema operativo.
- Quando usi variabili d'ambiente o processi.
- Quando interagisci con FFI o API OS.
- Quando vuoi evitare conversioni UTF-8 non sicure.

## Come funziona

`OsStr` e borrowed. `OsString` e owned.

```rust
use std::ffi::{OsStr, OsString};

let borrowed = OsStr::new("file.txt");
let owned = OsString::from("file.txt");
```

Conversione fallibile a UTF-8:

```rust
if let Some(s) = borrowed.to_str() {
    println!("{s}");
}
```

Conversione lossy:

```rust
let printable = borrowed.to_string_lossy();
```

## API / Sintassi

Argomenti processo:

```rust
let args: Vec<std::ffi::OsString> = std::env::args_os().collect();
```

Path:

```rust
let path = std::path::Path::new("file.txt");
let file_name = path.file_name();
```

Variabili d'ambiente:

```rust
let home = std::env::var_os("HOME");
```

## Esempio pratico

```rust
use std::ffi::OsStr;
use std::path::Path;

fn is_rust_file(path: &Path) -> bool {
    path.extension() == Some(OsStr::new("rs"))
}
```

Il confronto evita conversioni inutili a `&str`.

## Varianti

- `OsStr`: vista borrowed.
- `OsString`: valore posseduto.
- `str` e `String`: testo UTF-8.
- `Path` e `PathBuf`: percorsi basati su stringhe OS.
- `CString` e `CStr`: stringhe C per FFI.

## Errori comuni

- Fare `to_str().unwrap()` su path provenienti dal sistema operativo.
- Usare `std::env::args()` quando servono argomenti non UTF-8.
- Convertire a `String` troppo presto.
- Confondere stringhe OS e stringhe C.
- Perdere dati con conversioni lossy usate in logica, non solo in output.

## Checklist

- Il dato proviene dal sistema operativo?
- Puo non essere UTF-8 valido?
- Serve solo stamparlo o anche confrontarlo?
- `to_string_lossy` e accettabile in questo punto?
- Puoi restare su `OsStr`/`Path` piu a lungo?

## Collegamenti

- [[Programmazione/Rust/Pagine/Path e PathBuf|Path e PathBuf]]
- [[Programmazione/Rust/Pagine/Stringhe String e &str|Stringhe String e &str]]
- [[Programmazione/Rust/Pagine/Process e Command|Process e Command]]
- [[Programmazione/Rust/Pagine/File I O|File I O]]
- [[Programmazione/Rust/Pagine/FFI|FFI]]
