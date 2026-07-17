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
  - "AsRef"
  - "AsMut"
  - "Borrow"
prerequisites:
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
  - "[[Programmazione/Rust/Pagine/Deref Trait]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Path e PathBuf]]"
  - "[[Programmazione/Rust/Pagine/HashMap e HashSet]]"
  - "[[Programmazione/Rust/Pagine/Stringhe String e &str]]"
---

# AsRef, AsMut e Borrow

## Sintesi

`AsRef`, `AsMut` e `Borrow` sono trait standard per ottenere riferimenti verso una rappresentazione interna o equivalente. Sembrano simili, ma hanno scopi diversi.

`AsRef` e `AsMut` sono conversioni leggere di riferimento. `Borrow` ha vincoli semantici piu forti ed e usato soprattutto nelle collection per lookup con tipi presi in prestito.

## Quando usarlo

- Usa `AsRef<T>` quando una funzione deve accettare tipi diversi convertibili a `&T`.
- Usa `AsMut<T>` quando serve una vista mutabile.
- Usa `Borrow<T>` quando il tipo posseduto e quello preso in prestito devono avere stessa semantica di `Eq`, `Ord` e `Hash`.
- Usa spesso `AsRef<Path>` per API su filesystem.

## Come funziona

`AsRef`:

```rust
fn print_len<S: AsRef<str>>(s: S) {
    println!("{}", s.as_ref().len());
}
```

Accetta `String`, `&String`, `&str` e altri wrapper compatibili.

`Borrow`:

```rust
use std::collections::HashMap;

let mut map: HashMap<String, i32> = HashMap::new();
map.insert(String::from("a"), 1);

assert_eq!(map.get("a"), Some(&1));
```

La mappa ha chiavi `String`, ma il lookup puo usare `&str`.

## API / Sintassi

```rust
fn read_path<P: AsRef<std::path::Path>>(path: P) -> std::io::Result<String> {
    std::fs::read_to_string(path)
}
```

`AsMut`:

```rust
fn clear_bytes<B: AsMut<[u8]>>(mut bytes: B) {
    bytes.as_mut().fill(0);
}
```

`Borrow`:

```rust
use std::borrow::Borrow;

fn borrowed_len<T>(value: T) -> usize
where
    T: Borrow<str>,
{
    value.borrow().len()
}
```

## Esempio pratico

```rust
use std::path::Path;

fn has_extension<P: AsRef<Path>>(path: P, ext: &str) -> bool {
    path.as_ref()
        .extension()
        .and_then(|e| e.to_str())
        == Some(ext)
}
```

La funzione accetta `&str`, `String`, `PathBuf` e `&Path` senza imporre un tipo specifico al chiamante.

## Varianti

- `AsRef<T>`: riferimento immutabile convertibile.
- `AsMut<T>`: riferimento mutabile convertibile.
- `Borrow<T>`: borrowing con equivalenza semantica.
- `Deref`: comportamento pointer-like e deref coercion.
- `Into<T>`: conversione per valore, non per riferimento.

## Errori comuni

- Usare `Borrow` quando basta `AsRef`.
- Usare `AsRef<str>` dove serve ownership del testo.
- Confondere `as_ref()` con clone o conversione costosa.
- Implementare `Borrow` violando coerenza di `Eq`/`Hash`.
- Rendere firme troppo generiche per API interne semplici.

## Checklist

- Serve una vista borrowed o ownership?
- La conversione e solo di riferimento?
- Serve equivalenza semantica per lookup?
- `AsRef<Path>` rende l'API piu ergonomica?
- Il tipo generico migliora davvero la chiamata?

## Collegamenti

- [[Programmazione/Rust/Pagine/Deref Trait|Deref Trait]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Path e PathBuf|Path e PathBuf]]
- [[Programmazione/Rust/Pagine/HashMap e HashSet|HashMap e HashSet]]
- [[Programmazione/Rust/Pagine/Stringhe String e &str|Stringhe String e &str]]
