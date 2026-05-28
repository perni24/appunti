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
  - "Extension traits"
  - "Trait di estensione"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Blanket implementations]]"
  - "[[Programmazione/Rust/Pagine/Public API design]]"
related:
  - "[[Programmazione/Rust/Pagine/Object safety]]"
  - "[[Programmazione/Rust/Pagine/Trait bounds]]"
  - "[[Programmazione/Rust/Pagine/Compatibility e breaking changes]]"
---

# Extension traits

## Sintesi

Gli **extension traits** sono trait usati per aggiungere metodi a tipi esistenti senza modificarli direttamente. In Rust sono comuni per estendere tipi della standard library, tipi di crate esterne o trait gia esistenti.

Il pattern sfrutta trait e blanket implementation: definisci un trait con metodi aggiuntivi e lo implementi per tutti i tipi che soddisfano un certo bound.

## Quando usarlo

Usa extension traits quando:

- vuoi aggiungere metodi a tipi che non possiedi;
- vuoi offrire API ergonomiche sopra trait esistenti;
- vuoi evitare funzioni utility sparse;
- vuoi estendere `Iterator`, `Result`, `str`, `Path` o tipi esterni;
- vuoi mantenere compatibilita senza introdurre wrapper;
- vuoi rendere disponibili metodi solo quando un trait e importato.

Non usarli per nascondere logica importante dietro metodi magici o per creare API difficili da scoprire.

## Come funziona

Un extension trait e un trait normale:

1. definisci metodi aggiuntivi;
2. implementi il trait per uno o piu tipi;
3. l'utente importa il trait;
4. i metodi diventano disponibili tramite method syntax.

Il pattern piu comune usa una blanket implementation:

```rust
pub trait StringExt {
    fn is_blank(&self) -> bool;
}

impl<T> StringExt for T
where
    T: AsRef<str>,
{
    fn is_blank(&self) -> bool {
        self.as_ref().trim().is_empty()
    }
}
```

Qualsiasi tipo che implementa `AsRef<str>` riceve il metodo.

## API / Sintassi

Extension trait su iteratori:

```rust
pub trait IteratorExt: Iterator {
    fn count_where<P>(self, predicate: P) -> usize
    where
        Self: Sized,
        P: FnMut(Self::Item) -> bool;
}

impl<I> IteratorExt for I
where
    I: Iterator,
{
    fn count_where<P>(self, predicate: P) -> usize
    where
        Self: Sized,
        P: FnMut(Self::Item) -> bool,
    {
        self.filter(predicate).count()
    }
}
```

Uso:

```rust
use my_crate::IteratorExt;

let count = [1, 2, 3, 4]
    .into_iter()
    .count_where(|value| value % 2 == 0);
```

## Esempio pratico

Estendere `Result` con contesto applicativo:

```rust
pub trait ResultExt<T, E> {
    fn map_message(self, message: &'static str) -> Result<T, AppError>;
}

impl<T, E> ResultExt<T, E> for Result<T, E>
where
    E: std::error::Error + Send + Sync + 'static,
{
    fn map_message(self, message: &'static str) -> Result<T, AppError> {
        self.map_err(|source| AppError::new(message, source))
    }
}

pub struct AppError {
    message: &'static str,
    source: Box<dyn std::error::Error + Send + Sync>,
}

impl AppError {
    pub fn new(
        message: &'static str,
        source: impl std::error::Error + Send + Sync + 'static,
    ) -> Self {
        Self {
            message,
            source: Box::new(source),
        }
    }
}
```

Questo tipo di trait va usato con attenzione: una crate pubblica non dovrebbe sorprendere utenti con metodi troppo generici o conflitti di nomi.

## Varianti

- **Trait sealed**: impedisce implementazioni esterne quando vuoi controllo.
- **Blanket extension trait**: implementato per tutti i tipi con un bound.
- **Extension trait per `Iterator`**: aggiunge combinatori.
- **Extension trait per errori**: aggiunge contesto o conversioni.
- **Prelude**: modulo che re-esporta extension traits comuni.
- **Trait privato**: helper interno non parte dell'API.

## Errori comuni

- Usare nomi di metodi troppo generici e creare conflitti.
- Mettere extension traits in scope automaticamente senza criterio.
- Aggiungere metodi che dovrebbero essere funzioni libere.
- Creare blanket impl troppo ampie e bloccare implementazioni future.
- Non documentare che il trait va importato.
- Rompere compatibilita aggiungendo metodi a trait pubblici implementabili da utenti.
- Rendere difficile capire da dove arriva un metodo.

## Checklist

- Il metodo aggiunto e davvero ergonomico?
- Il nome evita conflitti probabili?
- Il trait deve essere pubblico o interno?
- Serve un trait sealed?
- La blanket implementation e troppo ampia?
- L'utente sa quale trait importare?
- Aggiungere metodi futuri sara compatibile?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Traits]]
- [[Programmazione/Rust/Pagine/Blanket implementations]]
- [[Programmazione/Rust/Pagine/Trait bounds]]
- [[Programmazione/Rust/Pagine/Object safety]]
- [[Programmazione/Rust/Pagine/Public API design]]
- [[Programmazione/Rust/Pagine/Compatibility e breaking changes]]
