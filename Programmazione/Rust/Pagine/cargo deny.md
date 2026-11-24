---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - testing-qualita-e-sicurezza
aliases:
  - cargo deny
  - cargo-deny
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]]"
  - "[[Programmazione/Rust/Pagine/cargo audit|cargo audit]]"
  - "[[Programmazione/Rust/Pagine/Workspace|Workspace]]"
related:
  - "[[Programmazione/Rust/Pagine/Crates.io|Crates.io]]"
  - "[[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]"
  - "[[Programmazione/Rust/Pagine/Packaging e release|Packaging e release]]"
title: cargo deny
---

# cargo deny

## Sintesi

Una dipendenza può non avere vulnerabilità note ed essere comunque vietata nel progetto: magari arriva da un repository non approvato, oppure la sua licenza non è tra quelle accettate. `cargo-deny` confronta il **grafo delle dipendenze selezionato da Cargo** con le regole del progetto, scritte in `deny.toml`. Segnala le violazioni; non aggiorna le crate e non riscrive le loro licenze.

Se ti basta confrontare un lockfile con gli avvisi RustSec, vedi [[Programmazione/Rust/Pagine/cargo audit|cargo audit]]. Usa `cargo deny` quando vuoi controllare anche quali dipendenze ammetti e a quali condizioni.

## I quattro controlli

| Controllo | Domanda | Come leggere una segnalazione |
| --- | --- | --- |
| `advisories` | Ci sono avvisi noti per le versioni nel grafo? | Leggi ID, intervallo interessato e aggiornamento suggerito. Un database non disponibile non equivale a «nessun avviso». |
| `licenses` | L'espressione di licenza della crate soddisfa la lista ammessa? | Distingui una licenza non ammessa da una che lo strumento non riesce a identificare. Una verifica verde non attesta da sola il rispetto degli obblighi di distribuzione. |
| `bans` | È presente una crate vietata o ci sono più versioni della stessa crate? | Segui la catena fino alla dipendenza che la introduce. Un duplicato può essere legittimo: non è una vulnerabilità per definizione. |
| `sources` | Registri e repository Git sono tra le origini autorizzate? | Una dipendenza locale `path` non è un repository Git da autorizzare. Questo controllo non certifica il contenuto di una directory locale. |

## Esempio riproducibile

### 1. Preparare il progetto

Gli esempi usano **cargo-deny 0.22.0**. È un sottocomando esterno; non va aggiunto alle dipendenze dell'app:

```sh
cargo install cargo-deny --version 0.22.0 --locked
```

In una directory libera, fuori da altri workspace, crea due librerie **affiancate**, non una dentro l'altra:

```sh
cargo new --lib --vcs none policy-notes
```

```sh
cargo new --lib --vcs none notes-legacy
```

Lascia invariati i sorgenti generati. Nel `Cargo.toml` di `notes-legacy` aggiungi sotto `[package]` la riga `license = "MIT OR Apache-2.0"`. Il manifest completo di **`policy-notes`** è invece:

```toml
[package]
name = "policy-notes"
version = "0.1.0"
edition = "2024"
license = "MIT"

[features]
legacy = ["dep:notes-legacy"]

[dependencies]
notes-legacy = { path = "../notes-legacy", optional = true }
```

Entra in `policy-notes` ed esegui da qui i comandi successivi. Genera il lockfile per questo progetto di prova:

```sh
cargo generate-lockfile
```

### 2. Scrivere la policy

Crea **`policy-notes/deny.toml`**, accanto al manifest. La policy consente MIT, segnala le versioni multiple senza bloccare e vieta di usare il vecchio componente:

```toml
[licenses]
allow = ["MIT"]

[bans]
multiple-versions = "warn"
deny = [{ crate = "notes-legacy", reason = "Il vecchio formato non è più supportato" }]

[sources]
unknown-registry = "deny"
unknown-git = "deny"
```

In un progetto reale puoi partire dal modello commentato creato da `cargo deny init`; non serve eseguirlo sopra il file dell'esempio. Versiona `deny.toml` insieme al lockfile, così una modifica alle regole è visibile in revisione.

### 3. Confrontare gli esiti

**Licenze.** Includi la dipendenza opzionale:

```sh
cargo deny --locked --all-features check licenses
```

Il controllo passa: per l'espressione SPDX `MIT OR Apache-2.0` basta un'alternativa ammessa. Nella **sola crate di prova** cambia `OR` in `AND` e ripeti: ora sono richieste entrambe e manca `Apache-2.0` nella lista. Ripristina `OR`. In una dipendenza reale non si risolve una violazione modificando la sua dichiarazione: si verificano i termini e, se appropriato, si sostituisce la crate o si approva un'eccezione circoscritta.

**Crate vietata.** Senza la feature `legacy` il pacchetto vietato non è nel grafo selezionato; questo controllo non blocca:

```sh
cargo deny --locked check bans
```

Non cambiare né il lockfile né la policy. Attiva la feature:

```sh
cargo deny --locked --all-features check bans
```

Il comando ora fallisce: `policy-notes` introduce `notes-legacy`. Il motivo è la regola sul **nome della crate**, non la licenza. La scelta corretta dipende dal prodotto: rimuovi o sostituisci la dipendenza se quel formato non deve più essere distribuito. Per capire un diagnostico sui duplicati in un altro progetto, esamina `cargo tree --duplicates` con le stesse feature; `multiple-versions = "deny"` rende quel diagnostico bloccante.

**Provenienza.** Con la stessa feature attiva, isola il quarto controllo:

```sh
cargo deny --locked --all-features check sources
```

Qui non c'è una sorgente Git sconosciuta: `notes-legacy` proviene da `path`. Per una dipendenza dichiarata con `git = "..."`, invece, `unknown-git = "deny"` blocca un repository non autorizzato. Approva in `allow-git` solo l'origine effettivamente esaminata. L'esito di `sources` non annulla quello di `bans`.

## Uso in CI

Per eseguire tutti e quattro i controlli sul workspace, con il lockfile esistente e tutte le feature abilitate insieme:

```sh
cargo deny --workspace --locked --all-features check
```

Se il prodotto supporta configurazioni alternative, controlla quelle effettivamente distribuite: `--all-features` non prova ogni combinazione. Le opzioni di selezione del grafo precedono `check`. Senza indicare una categoria, vengono eseguite tutte, anche se una sezione non compare in `deny.toml`: ometterla non disabilita il controllo.

Per gli advisory serve un database disponibile e aggiornato. Un esito offline riflette la copia locale, non gli avvisi pubblicati dopo il suo ultimo aggiornamento. Mantieni separati `rustfmt`, Clippy e i test: una dipendenza ammessa può comunque introdurre una regressione.

## Checklist

- Il controllo fallisce per un avviso di sicurezza, una licenza, una dipendenza vietata o una sorgente? Ripeti la singola categoria con lo stesso grafo della CI.
- È davvero necessario ampliare la policy per tutte le crate? Per una deroga di licenza preferisci un'eccezione limitata al pacchetto e alla versione interessati, con motivo e data di riesame.
- Il risultato verde riguarda le feature e i target della release, oppure solo la configurazione predefinita?

## Fonti

- [cargo-deny 0.22.0: release ufficiale](https://github.com/EmbarkStudios/cargo-deny/releases/tag/0.22.0) e [comando check](https://embarkstudios.github.io/cargo-deny/cli/check.html)
- [Configurazione del grafo](https://embarkstudios.github.io/cargo-deny/checks/cfg.html), [regole per le licenze](https://embarkstudios.github.io/cargo-deny/checks/licenses/cfg.html), [divieti e duplicati](https://embarkstudios.github.io/cargo-deny/checks/bans/cfg.html) e [sorgenti ammesse](https://embarkstudios.github.io/cargo-deny/checks/sources/cfg.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/cargo audit|cargo audit]]
- [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]]
- [[Programmazione/Rust/Pagine/Crates.io|Crates.io]]
- [[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]
- [[Programmazione/Rust/Pagine/Packaging e release|Packaging e release]]
- [[Programmazione/Rust/Pagine/Workspace|Workspace]]
