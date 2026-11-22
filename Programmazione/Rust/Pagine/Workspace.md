---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - cargo
  - workspace
aliases: []
prerequisites: []
related: []
title: Workspace
---

# Workspace

## Sintesi

Un **workspace** Cargo raggruppa piu package Rust sotto una configurazione comune. Serve a gestire monorepo, crate correlate, librerie interne e binari che condividono dipendenze.

Non unisce i package in una singola crate e non crea import o dipendenze implicite. Il demo ha due membri e nessuna dipendenza esterna; baseline **Rust/Cargo 1.99.1, edition 2024**.

## Quando usarlo

- Quando hai piu crate nello stesso repository.
- Quando vuoi condividere un unico `Cargo.lock`.
- Quando separi librerie interne, CLI, server e test utility.
- Quando vuoi compilare o testare piu package insieme.

## Come funziona

Il file `Cargo.toml` alla radice dichiara i membri del workspace. I package membri mantengono il proprio `Cargo.toml`, ma Cargo puo risolvere dipendenze e lockfile a livello comune.

I membri condividono il `Cargo.lock` alla radice e, salvo configurazioni diverse, la directory `target/`. Questo non garantisce una sola versione di ogni dipendenza o la compilazione di ogni crate una sola volta per qualsiasi target e feature.

Una root con `[workspace]` ma senza `[package]` e un **workspace virtuale**. In questo caso specifica il resolver: non viene dedotto dalle edition dei membri. Per la baseline edition 2024 qui usiamo `resolver = "3"`; introduce il comportamento di risoluzione attento alla versione Rust richiesta. `resolver = "2"` resta una configurazione valida per progetti che la scelgono: non e semplicemente sbagliata o deprecata.

## API / Sintassi

Le sezioni hanno ruoli diversi:

- `[workspace]`: membri, selezione predefinita e resolver.
- `[workspace.package]`: valori ereditabili come edition e versione; i membri devono richiederli con `campo.workspace = true`.
- `[workspace.dependencies]`: definizioni condivise; ogni membro dichiara comunque le dipendenze che usa.
- `[profile.*]`: profili da configurare nel manifest root, non nei manifest dei membri.

I percorsi `path` dentro `[workspace.dependencies]` sono relativi alla root del workspace. Una normale dipendenza `path` nel manifest di un membro e invece relativa alla directory di quel manifest.

## Esempio pratico

In una directory nuova `note-workspace` prepara questi cinque file:

```text
note-workspace/
  Cargo.toml
  crates/
    note-core/
      Cargo.toml
      src/lib.rs
  tools/
    note-cli/
      Cargo.toml
      src/main.rs
```

`Cargo.lock` e `target/` vengono generati da Cargo; non crearli copiando contenuti di altri progetti.

### Cargo.toml

```toml
[workspace]
members = ["crates/note-core", "tools/note-cli"]
default-members = ["tools/note-cli"]
resolver = "3"

[workspace.package]
version = "0.1.0"
edition = "2024"
publish = false

[workspace.dependencies]
note-core = { path = "crates/note-core" }
```

### crates/note-core/Cargo.toml

```toml
[package]
name = "note-core"
version.workspace = true
edition.workspace = true
publish.workspace = true
```

### crates/note-core/src/lib.rs

```rust
pub fn double(value: i32) -> Option<i32> {
    value.checked_mul(2)
}

#[cfg(test)]
mod tests {
    use super::double;

    #[test]
    fn doubles_values_without_wrapping() {
        assert_eq!(double(21), Some(42));
        assert_eq!(double(0), Some(0));
        assert_eq!(double(i32::MAX), None);
    }
}
```

### tools/note-cli/Cargo.toml

```toml
[package]
name = "note-cli"
version.workspace = true
edition.workspace = true
publish.workspace = true

[dependencies]
note-core.workspace = true
```

### tools/note-cli/src/main.rs

```rust
fn main() {
    let value = note_core::double(21);
    assert_eq!(value, Some(42));
    println!("{value:?}");
}
```

`note-core.workspace = true` e indispensabile: la sola presenza in `members` o in `[workspace.dependencies]` non rende `note_core` utilizzabile nel binario. La libreria viene consumata con underscore nel percorso Rust.

### Comandi dalla root

Controlla tutti i membri e i relativi target:

```powershell
cargo check --workspace --all-targets
```

Esegui i test di tutti i membri:

```powershell
cargo test --workspace
```

Seleziona un package per nome, non per percorso della directory:

```powershell
cargo check -p note-core
```

Avvia esplicitamente il CLI; output `Some(42)`:

```powershell
cargo run -p note-cli --quiet
```

Ispeziona membri e percorsi in formato JSON:

```powershell
cargo metadata --no-deps --format-version 1
```

Da questa root, un semplice `cargo test` seleziona solo `note-cli` per via di `default-members`: compila la libreria necessaria, ma non ne esegue automaticamente gli unit test. Usa `--workspace` quando vuoi coprire tutti i membri.

## Varianti

- Workspace con sole librerie.
- Workspace con binari e librerie.
- Workspace con dipendenze centralizzate in `[workspace.dependencies]`.
- Workspace virtuale senza package radice.
- Root che e anche un package: puo contenere sia `[package]` sia `[workspace]`.
- Workspace virtuale senza `default-members`: dalla root, la selezione predefinita comprende tutti i membri. Eseguendo Cargo dalla directory di un membro, la selezione ordinaria riguarda quel package; usa flag espliciti in CI.

## Errori comuni

- Creare workspace troppo presto per un progetto piccolo.
- Dimenticare un package nei `members`.
- Confondere dipendenze del workspace e dipendenze del singolo package.
- Omettere il resolver in un workspace virtuale e aspettarsi che l'edition di un membro lo imposti.
- Credere che i metadata condivisi siano ereditati senza `workspace = true` nei membri.
- Mettere `default-members` ristretto e poi scambiare `cargo test` per una verifica dell'intero workspace.
- Chiamare una crate interna semplicemente `core`, creando confusione con la libreria standard omonima.

## Checklist

- I membri sono elencati correttamente.
- Il lockfile e condiviso alla radice.
- Le dipendenze comuni sono centralizzate solo quando ha senso.
- I comandi CI usano `--workspace` se devono coprire tutto.
- Ogni dipendenza fra membri e dichiarata nel manifest del consumatore.
- Hai distinto root, membro selezionato e directory condivisa degli artefatti.

## Collegamenti

- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Workspace dependencies|Workspace dependencies]]
- [[Programmazione/Rust/Pagine/Moduli crate e package|Moduli, crate e package]]
- [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]]
- [[Programmazione/Rust/Pagine/Rust 2018 2021 e 2024|Rust 2018, 2021 e 2024]]

## Fonti

- [Cargo Book: Workspaces](https://doc.rust-lang.org/cargo/reference/workspaces.html).
- [Cargo Book: Dependency Resolution](https://doc.rust-lang.org/cargo/reference/resolver.html).
- [Edition Guide: Cargo resolver 3](https://doc.rust-lang.org/edition-guide/rust-2024/cargo-resolver.html).
- [Cargo Book: dipendenze ereditate dal workspace](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html#inheriting-a-dependency-from-a-workspace).
- [Cargo: metadata](https://doc.rust-lang.org/cargo/commands/cargo-metadata.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
