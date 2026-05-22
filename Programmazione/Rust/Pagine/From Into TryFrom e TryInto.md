---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - standard-library
aliases:
  - "From"
  - "Into"
  - "TryFrom"
  - "TryInto"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Result]]"
  - "[[Programmazione/Rust/Pagine/Operatore]]"
related:
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
  - "[[Programmazione/Rust/Pagine/thiserror e anyhow]]"
  - "[[Programmazione/Rust/Pagine/Blanket implementations]]"
---

# From, Into, TryFrom e TryInto

## Sintesi

`From`, `Into`, `TryFrom` e `TryInto` sono trait standard per conversioni tra tipi. `From` e `Into` rappresentano conversioni infallibili. `TryFrom` e `TryInto` rappresentano conversioni che possono fallire e restituiscono `Result`.

Sono fondamentali per API ergonomiche e per propagare errori con `?`.

## Quando usarlo

- Usa `From` per conversioni infallibili e senza perdita semantica.
- Usa `TryFrom` per conversioni validate o potenzialmente fallibili.
- Accetta `impl Into<T>` nei costruttori quando vuoi ergonomia.
- Usa conversioni di errore con `From` per rendere naturale l'operatore `?`.

## Come funziona

Implementando `From<A> for B`, Rust fornisce automaticamente `Into<B> for A`.

```rust
struct UserId(u64);

impl From<u64> for UserId {
    fn from(value: u64) -> Self {
        Self(value)
    }
}
```

Uso:

```rust
let id = UserId::from(10);
let id: UserId = 10u64.into();
```

Conversione fallibile:

```rust
impl TryFrom<i64> for UserId {
    type Error = String;

    fn try_from(value: i64) -> Result<Self, Self::Error> {
        u64::try_from(value).map(UserId).map_err(|_| String::from("id negativo"))
    }
}
```

## API / Sintassi

Costruttore ergonomico:

```rust
struct User {
    name: String,
}

impl User {
    fn new(name: impl Into<String>) -> Self {
        Self { name: name.into() }
    }
}
```

Conversione con `?`:

```rust
fn parse_id(input: &str) -> Result<u64, std::num::ParseIntError> {
    let id = input.parse::<u64>()?;
    Ok(id)
}
```

## Esempio pratico

```rust
#[derive(Debug)]
struct Port(u16);

impl TryFrom<&str> for Port {
    type Error = std::num::ParseIntError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        let port = value.parse::<u16>()?;
        Ok(Self(port))
    }
}

fn main() -> Result<(), std::num::ParseIntError> {
    let port = Port::try_from("5432")?;
    println!("{port:?}");
    Ok(())
}
```

`TryFrom` rende esplicito che la costruzione puo fallire.

## Varianti

- `From<T>`: conversione infallibile verso `Self`.
- `Into<T>`: conversione infallibile verso `T`, derivata da `From`.
- `TryFrom<T>`: conversione fallibile verso `Self`.
- `TryInto<T>`: conversione fallibile verso `T`.
- `FromStr`: parsing da stringa, usato da `.parse()`.

## Errori comuni

- Implementare `From` per conversioni che possono fallire.
- Usare `Into` come implementazione manuale invece di implementare `From`.
- Accettare `Into<String>` ovunque e rendere firme meno chiare.
- Perdere contesto negli errori di conversione.
- Confondere conversione con parsing di input utente.

## Checklist

- La conversione puo fallire?
- La conversione e senza perdita semantica?
- Conviene implementare `From` invece di `Into`?
- Il tipo di errore di `TryFrom` e utile?
- Un costruttore nominato sarebbe piu chiaro?

## Collegamenti

- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Operatore|Operatore ?]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/Blanket implementations|Blanket implementations]]
