---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - testing-qualita-e-sicurezza
aliases:
  - Clippy
  - cargo clippy
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo|Cargo]]"
  - "[[Programmazione/Rust/Pagine/rustfmt|rustfmt]]"
related:
  - "[[Programmazione/Rust/Pagine/cargo-nextest|cargo-nextest]]"
  - "[[Programmazione/Rust/Pagine/cargo deny|cargo deny]]"
  - "[[Programmazione/Rust/Pagine/Public API design|Public API design]]"
title: Clippy
---

# Clippy

## Sintesi

Clippy è il linter di Rust: analizza il codice durante la compilazione e segnala, per esempio, operazioni sospette, lavoro superfluo o un modo più diretto di esprimere la stessa intenzione. Non conosce il contratto della tua applicazione: può riconoscere un limite scritto a mano, ma non sapere se il massimo di una percentuale debba essere 99 oppure 100.

## Quando usarlo

| Domanda | Controllo | Cosa significa un esito positivo |
| --- | --- | --- |
| Il codice è formattato secondo le regole del progetto? | `cargo fmt --check` | Il formatter non cambierebbe i file controllati. |
| Ci sono costrutti segnalati dai lint attivi? | `cargo clippy` | Il controllo è terminato senza **errori**; potrebbero esserci avvisi. |
| Il programma si comporta come previsto nei casi scelti? | `cargo test` | Le asserzioni eseguite sono passate. Clippy non le esegue. |

Con una toolchain gestita da rustup, controlla che il componente sia disponibile:

```sh
cargo clippy --version
```

Se manca, installalo per la toolchain attiva:

```sh
rustup component add clippy
```

## Esempio pratico: stessi test, esiti diversi

Parti dalla libreria `percentage_notes` della nota [[Programmazione/Rust/Pagine/Unit test|Unit test]]: servono il parser e i suoi cinque test, senza dipendenze esterne. In `src/lib.rs` sostituisci **solo** la funzione privata `clamp_percentage` con questa variante:

```rust
fn clamp_percentage(value: i32) -> u8 {
    value.max(0).min(100) as u8
}
```

Dalla directory con `Cargo.toml`, verifica il comportamento:

```sh
cargo test --lib
```

I cinque test passano. Ora analizza lo stesso codice:

```sh
cargo clippy --lib
```

Con le impostazioni predefinite, `clippy::manual_clamp` è un **avviso**: il comando segnala la catena `max`/`min` ma termina con successo. Per rendere bloccante *solo questo lint*:

```sh
cargo clippy --lib -- -D clippy::manual_clamp
```

Lo stesso codice ora dà un errore. Prima di `--` ci sono le opzioni che scelgono cosa analizzare; dopo `--` passi al compilatore i livelli dei lint. Risolvi la segnalazione ripristinando la funzione originale:

```rust
fn clamp_percentage(value: i32) -> u8 {
    value.clamp(0, 100) as u8
}
```

Il limite viene applicato quando il valore è ancora un intero con segno; dopo, la conversione in `u8` è esatta. **Controprova:** cambia soltanto `100` in `99` nel corpo della funzione corretta. Il lint non protesta più, ma i test sui limiti e sul parsing di `"120"` falliscono. Ripristina `100`: un suggerimento idiomatico non sostituisce un requisito verificato dai test.

## Dal controllo locale alla CI

Per un workspace le cui feature possono essere attivate insieme:

```sh
cargo clippy --workspace --all-targets --all-features -- -D warnings
```

- `--workspace` include i pacchetti del workspace. `--all-targets` comprende anche il codice di test, esempi e benchmark disponibili; non significa «per tutti i sistemi operativi» e non esegue quei programmi.
- `--all-features` attiva tutte le feature **insieme**, non tutte le combinazioni. Se supporti anche una build senza feature predefinite, controllala separatamente con `--no-default-features`; per feature incompatibili usa controlli separati sulle combinazioni supportate.
- `-D warnings` promuove a errori anche gli avvisi di `rustc`, non solo quelli di Clippy. Non attiva i lint normalmente disabilitati. Con Cargo dalla 1.97 puoi anche configurare `build.warnings = "deny"` per la CI. Registra la versione della toolchain: un nuovo lint può rendere rossa la build senza che il codice sia cambiato.

Esegui formattazione e test come passi distinti. Il primo non scrive nei file; il secondo esegue la suite:

```sh
cargo fmt --all --check
```

```sh
cargo test --workspace --all-features
```

## Selezionare i lint e motivare le eccezioni

`clippy::all` è il gruppo ordinario, non il catalogo completo. `clippy::pedantic` aggiunge suggerimenti più esigenti; `clippy::nursery` contiene lint ancora in maturazione; `clippy::cargo` riguarda il manifest e il packaging. Per valutare un gruppo puoi abilitarlo con `-W clippy::pedantic` dopo `--`, senza farne subito un vincolo per tutto il progetto.

Un'eccezione ha senso se **spiega perché mantenere il codice**. Per esempio, questa funzione pubblica prende otto segmenti IPv6 separati perché i chiamanti esistenti usano quella firma. Senza l'attributo, otto parametri superano la soglia predefinita di sette di `clippy::too_many_arguments`:

```rust
#[expect(
    clippy::too_many_arguments,
    reason = "firma pubblica mantenuta per i chiamanti esistenti"
)]
pub fn ipv6_segments(
    a: u16, b: u16, c: u16, d: u16,
    e: u16, f: u16, g: u16, h: u16,
) -> [u16; 8] {
    [a, b, c, d, e, f, g, h]
}
```

`#[allow(...)]` silenzia il lint anche se non serve più. `#[expect(...)]` silenzia la segnalazione attesa, ma Clippy avvisa con `unfulfilled_lint_expectations` se la ragione per l'eccezione viene meno. Per esempio, se in una nuova versione l'API riceve un unico `[u16; 8]`, togli anche l'attributo. Lascialo sulla singola funzione: spostarlo a livello di crate nasconderebbe problemi non collegati.

## Errori comuni

- Interpretare «exit code zero» come «nessun avviso»: per una politica di CI conta il livello assegnato al lint.
- Aggiungere un `allow` su tutto il modulo per far passare la build, senza leggere il nome del lint, il punto segnalato e il suggerimento.
- Applicare `cargo clippy --fix` come se fosse un controllo: può **modificare i sorgenti**. Parti da modifiche salvate in Git, esamina il diff e riesegui i test.

## Checklist

- La CI analizza i pacchetti, i target e le configurazioni di feature effettivamente supportati?
- Per ogni eccezione si capisce quale requisito impedisce di seguire il suggerimento?
- Dopo la correzione del lint, un test controlla ancora il comportamento che conta?

## Fonti

- [Clippy Book: comandi, livelli e uso in CI](https://doc.rust-lang.org/clippy/usage.html)
- [Clippy: soglia del numero di parametri](https://doc.rust-lang.org/clippy/lint_configuration.html#too-many-arguments-threshold)
- [Rust Reference: differenza tra allow, expect, warn e deny](https://doc.rust-lang.org/reference/attributes/diagnostics.html#lint-check-attributes)
- [Cargo Book: selezione delle feature](https://doc.rust-lang.org/cargo/reference/features.html#command-line-feature-options)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Unit test|Unit test]]
- [[Programmazione/Rust/Pagine/rustfmt|rustfmt]]
- [[Programmazione/Rust/Pagine/cargo-nextest|cargo-nextest]]
- [[Programmazione/Rust/Pagine/cargo deny|cargo deny]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
