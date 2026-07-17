---
date: 2026-05-21
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - astrazione-e-generici
aliases:
  - "Blanket impl"
  - "Blanket implementation"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Trait bounds]]"
related:
  - "[[Programmazione/Rust/Pagine/Extension traits]]"
  - "[[Programmazione/Rust/Pagine/From Into TryFrom e TryInto]]"
  - "[[Programmazione/Rust/Pagine/Public API design]]"
---

# Blanket implementations

## Sintesi

Una blanket implementation implementa un trait per tutti i tipi che soddisfano un certo bound. La forma tipica e `impl<T: SomeTrait> OtherTrait for T`.

Permette di dare automaticamente comportamento a intere famiglie di tipi, ma va usata con attenzione perche influenza la coerenza delle implementazioni nel crate.

## Quando usarlo

- Quando tutti i tipi che implementano un trait possono ricevere un comportamento derivato.
- Quando vuoi costruire extension trait ergonomici.
- Quando vuoi evitare implementazioni ripetitive per molti tipi.
- Quando stai progettando una API interna o pubblica con regole chiare.

## Come funziona

```rust
trait Summary {
    fn summary(&self) -> String;
}

trait Loggable {
    fn log(&self);
}

impl<T> Loggable for T
where
    T: Summary,
{
    fn log(&self) {
        println!("{}", self.summary());
    }
}
```

Qualsiasi tipo che implementa `Summary` ottiene automaticamente `Loggable`.

## API / Sintassi

Forma generale:

```rust
impl<T> TraitDestinazione for T
where
    T: TraitSorgente,
{
    // metodi
}
```

Esempio con extension trait:

```rust
trait StringExt {
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

Ora `String`, `&str` e altri tipi compatibili con `AsRef<str>` possono usare `is_blank`.

## Esempio pratico

```rust
trait Validate {
    fn validate(&self) -> Result<(), String>;
}

trait Save {
    fn save(&self) -> Result<(), String>;
}

impl<T> Save for T
where
    T: Validate,
{
    fn save(&self) -> Result<(), String> {
        self.validate()?;
        Ok(())
    }
}
```

Ogni tipo validabile ottiene una implementazione base di `Save`.

## Varianti

- Blanket impl su un trait locale per molti tipi.
- Blanket impl per extension trait.
- Implementazioni standard simili, per esempio conversioni tra `From` e `Into`.
- Blanket impl con piu bound.
- Blanket impl limitate da lifetime o marker trait.

## Errori comuni

- Creare conflitti con implementazioni specifiche future.
- Implementare blanket impl troppo ampie in API pubbliche.
- Dimenticare la orphan rule.
- Rendere impossibile a un utente fornire una implementazione personalizzata.
- Usare blanket impl quando una funzione generica sarebbe piu semplice.

## Checklist

- Il comportamento e corretto per tutti i tipi che soddisfano il bound?
- Potrebbero servire implementazioni specifiche in futuro?
- Il trait e locale al crate?
- La blanket impl e parte della API pubblica?
- Una funzione generica o un metodo default sul trait sarebbe piu chiaro?

## Collegamenti

- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Trait bounds|Trait bounds]]
- [[Programmazione/Rust/Pagine/Extension traits|Extension traits]]
- [[Programmazione/Rust/Pagine/From Into TryFrom e TryInto|From Into TryFrom e TryInto]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
