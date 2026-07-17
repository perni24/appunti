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
  - "Display"
  - "Debug"
  - "Formatting Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Derive traits]]"
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
related:
  - "[[Programmazione/Rust/Pagine/thiserror e anyhow]]"
  - "[[Programmazione/Rust/Pagine/Result]]"
  - "[[Programmazione/Rust/Pagine/rustfmt]]"
---

# Display e Debug

## Sintesi

`Debug` e `Display` sono trait di formattazione. `Debug` serve per output diagnostico e sviluppo, con `{:?}`. `Display` serve per rappresentazione leggibile dall'utente, con `{}`.

`Debug` si deriva spesso. `Display` si implementa manualmente quando il tipo ha un formato pubblico o utente.

## Quando usarlo

- Usa `Debug` per log, test, diagnostica e sviluppo.
- Usa `Display` per messaggi utente, errori e output stabile.
- Deriva `Debug` quasi sempre sui tipi applicativi.
- Implementa `Display` quando il formato fa parte del comportamento del tipo.

## Come funziona

Derive Debug:

```rust
#[derive(Debug)]
struct User {
    id: u64,
    name: String,
}
```

Uso:

```rust
println!("{user:?}");
println!("{user:#?}");
```

Implementazione Display:

```rust
impl std::fmt::Display for User {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{} ({})", self.name, self.id)
    }
}
```

## API / Sintassi

```rust
println!("{:?}", value);  // Debug
println!("{:#?}", value); // Debug pretty
println!("{}", value);    // Display
```

Bound:

```rust
fn print_user<T: std::fmt::Display>(value: T) {
    println!("{value}");
}
```

Errori custom:

```rust
impl std::error::Error for MyError {}
```

Un errore idiomatico implementa spesso `Debug`, `Display` e `Error`.

## Esempio pratico

```rust
#[derive(Debug)]
struct Port(u16);

impl std::fmt::Display for Port {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

fn main() {
    let port = Port(5432);
    println!("debug: {port:?}");
    println!("display: {port}");
}
```

`Debug` mostra la struttura del tipo, `Display` mostra il valore nel formato scelto.

## Varianti

- `Debug`: `{:?}` e `{:#?}`.
- `Display`: `{}`.
- Altri formatter: `LowerHex`, `UpperHex`, `Binary`, `Pointer`.
- `write!`: scrive su formatter o buffer.
- `format!`: produce una `String`.

## Errori comuni

- Usare `Debug` come formato stabile per utenti o API.
- Implementare `Display` includendo dettagli diagnostici rumorosi.
- Dimenticare `Debug` su tipi usati in test con `assert_eq!`.
- Fare allocazioni inutili in `fmt` invece di usare `write!`.
- Confondere formattazione di errore utente e log tecnico.

## Checklist

- Il formato e per sviluppatori o utenti?
- `Debug` derivato basta?
- `Display` deve essere stabile?
- Il tipo errore implementa `Debug`, `Display` e `Error`?
- Il formatter evita allocazioni non necessarie?

## Collegamenti

- [[Programmazione/Rust/Pagine/Derive traits|Derive traits]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/thiserror e anyhow|thiserror e anyhow]]
- [[Programmazione/Rust/Pagine/rustfmt|rustfmt]]
