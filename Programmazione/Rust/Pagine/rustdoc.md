---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - testing-qualita-e-sicurezza
aliases:
  - "rustdoc"
  - "cargo doc"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Doc test]]"
  - "[[Programmazione/Rust/Pagine/Public API design]]"
related:
  - "[[Programmazione/Rust/Pagine/Documentazione delle crate]]"
  - "[[Programmazione/Rust/Pagine/rustfmt]]"
  - "[[Programmazione/Rust/Pagine/Clippy]]"
---

# rustdoc

## Sintesi

`rustdoc` e lo strumento ufficiale che genera documentazione HTML per crate Rust a partire da commenti di documentazione, firme pubbliche, moduli, trait, struct, enum e esempi.

E anche parte del sistema di test: i blocchi di codice nella documentazione possono diventare doc test eseguiti da `cargo test`.

## Quando usarlo

Usa `rustdoc` quando:

- stai pubblicando una libreria;
- vuoi documentare API pubbliche;
- vuoi controllare esempi e doc test;
- vuoi generare documentazione locale;
- vuoi verificare link e item documentati;
- vuoi migliorare usabilita della crate.

Per applicazioni private, documentare moduli chiave resta utile, ma la priorita e diversa rispetto a una crate pubblica.

## Come funziona

Commenti doc:

- `///` documenta l'item successivo;
- `//!` documenta il modulo o crate corrente;
- Markdown e supportato;
- link intra-doc possono puntare a item Rust;
- esempi Rust possono essere testati.

Comandi:

```powershell
cargo doc
cargo doc --open
cargo test --doc
```

Per crate pubbliche, conviene trattare documentazione incompleta o link rotti come problemi di qualita.

## API / Sintassi

Documentare una funzione:

```rust
/// Calcola la percentuale.
///
/// # Errors
///
/// Restituisce errore se `total` e zero.
pub fn percentage(part: u64, total: u64) -> Result<u64, String> {
    if total == 0 {
        return Err("total is zero".to_string());
    }

    Ok(part * 100 / total)
}
```

Documentazione di crate:

```rust
//! Libreria per normalizzare input testuale.
//!
//! Usa [`normalize`] per applicare la normalizzazione standard.
```

## Esempio pratico

API con esempio:

```rust
/// Normalizza un nome.
///
/// # Examples
///
/// ```
/// let value = my_crate::normalize(" Luca ");
/// assert_eq!(value, "luca");
/// ```
pub fn normalize(input: &str) -> String {
    input.trim().to_lowercase()
}
```

Questo esempio e leggibile per l'utente e testabile da `cargo test`.

## Varianti

- **Documentazione HTML locale**: `cargo doc --open`.
- **Doc test**: esempi compilati/eseguiti.
- **Intra-doc links**: link a item Rust.
- **Crate-level docs**: `//!` in `lib.rs`.
- **Documentazione privata**: generabile con opzioni dedicate.
- **docs.rs**: documentazione generata per crate pubblicate.

## Errori comuni

- Documentare il "come" interno invece del contratto pubblico.
- Scrivere esempi che non compilano.
- Dimenticare sezioni `Errors`, `Panics` o `Safety` quando rilevanti.
- Esporre API pubbliche senza descrivere invarianti.
- Usare link testuali invece di link a item quando possibile.
- Lasciare documentazione obsoleta dopo refactor.
- Usare doc comment come commenti interni di implementazione.

## Checklist

- Le API pubbliche principali sono documentate?
- Gli esempi compilano?
- Errori e panic sono descritti?
- Le funzioni unsafe hanno sezione `Safety`?
- I link intra-doc funzionano?
- La documentazione mostra casi reali?
- `cargo doc` e `cargo test --doc` passano?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Doc test]]
- [[Programmazione/Rust/Pagine/Documentazione delle crate]]
- [[Programmazione/Rust/Pagine/Public API design]]
- [[Programmazione/Rust/Pagine/rustfmt]]
- [[Programmazione/Rust/Pagine/Clippy]]
