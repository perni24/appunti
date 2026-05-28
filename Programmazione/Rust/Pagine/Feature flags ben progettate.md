---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags:
  - programmazione
  - rust
  - api-design-idiomatico
aliases:
  - "Feature flags ben progettate"
  - "Feature Cargo"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo features]]"
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
  - "[[Programmazione/Rust/Pagine/Public API design]]"
related:
  - "[[Programmazione/Rust/Pagine/no_std]]"
  - "[[Programmazione/Rust/Pagine/Compatibility e breaking changes]]"
  - "[[Programmazione/Rust/Pagine/Semantic Versioning]]"
---

# Feature flags ben progettate

## Sintesi

Le **feature flags** Cargo sono parte dell'API di una crate. Permettono di abilitare dipendenze opzionali, backend, integrazioni, supporto `std`, formati di serializzazione o comportamenti additivi.

Una feature ben progettata e additiva, documentata e combinabile. Una feature progettata male crea build fragili, combinazioni impossibili e breaking changes nascosti.

## Quando usarlo

Progetta feature flags quando:

- una dipendenza deve essere opzionale;
- vuoi supportare `no_std` e `std`;
- offri integrazioni con crate esterne;
- vuoi ridurre dipendenze transitive;
- supporti piu backend;
- vuoi rendere opzionali funzionalita pesanti.

Non usare feature come configurazione runtime: le feature sono scelte compile-time e influenzano tutto il grafo Cargo.

## Come funziona

Le feature Cargo sono unificate: se una dipendenza abilita una feature, quella feature e attiva per tutti gli usi della stessa crate nella build. Per questo devono essere additive: abilitare una feature non dovrebbe disabilitare comportamento esistente.

Pattern comuni:

- `default = ["std"]`;
- `std = []`;
- `serde = ["dep:serde"]`;
- `postgres = ["dep:sqlx"]`;
- feature per integrazioni opzionali.

Le feature negative come `no_std` o `disable-x` sono problematiche perche l'unificazione puo produrre risultati inattesi.

## API / Sintassi

Esempio in `Cargo.toml`:

```toml
[features]
default = ["std"]
std = []
serde = ["dep:serde"]

[dependencies]
serde = { version = "1", optional = true, features = ["derive"] }
```

Nel codice:

```rust
#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub struct UserId(u64);
```

## Esempio pratico

API opzionale per integrazione JSON:

```rust
#[derive(Debug, Copy, Clone, PartialEq, Eq)]
pub struct UserId(u64);

#[cfg(feature = "serde")]
impl serde::Serialize for UserId {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_u64(self.0)
    }
}
```

Chi non usa `serde` non paga la dipendenza. Chi abilita la feature ottiene integrazione aggiuntiva.

## Varianti

- **Feature `std`**: abilita standard library.
- **Feature `alloc`**: abilita tipi heap in `no_std`.
- **Feature integrazione**: `serde`, `tracing`, `rayon`.
- **Feature backend**: seleziona supporto per database o runtime.
- **Feature default**: abilitate automaticamente.
- **Feature internal**: da evitare o documentare se visibili.

## Errori comuni

- Usare feature non additive.
- Creare feature negative come `no-default`.
- Mettere troppe cose in `default`.
- Non testare `--no-default-features`.
- Non testare combinazioni importanti di feature.
- Cambiare significato di una feature senza considerare SemVer.
- Esporre feature interne non documentate.

## Checklist

- Ogni feature e additiva?
- Le feature pubbliche sono documentate?
- `default` e minimale?
- La build senza default passa?
- Le combinazioni importanti sono testate?
- Le dipendenze opzionali usano `dep:` quando serve?
- Cambiare la feature sarebbe breaking?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Cargo features]]
- [[Programmazione/Rust/Pagine/Cargo.toml]]
- [[Programmazione/Rust/Pagine/no_std]]
- [[Programmazione/Rust/Pagine/Public API design]]
- [[Programmazione/Rust/Pagine/Compatibility e breaking changes]]
- [[Programmazione/Rust/Pagine/Semantic Versioning]]
