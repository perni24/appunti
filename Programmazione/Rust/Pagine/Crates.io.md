---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - cargo-editions-e-compatibilita
aliases:
  - crates.io
  - Registry Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo]]"
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
related:
  - "[[Programmazione/Rust/Pagine/Semantic Versioning]]"
  - "[[Programmazione/Rust/Pagine/Cargo.lock]]"
  - "[[Programmazione/Rust/Pagine/cargo audit]]"
  - "[[Programmazione/Rust/Pagine/cargo deny]]"
title: Crates.io
---

# Crates.io

## Sintesi

**crates.io** e il registry pubblico di package Rust. Cargo lo usa normalmente per risolvere, scaricare e pubblicare dipendenze; **docs.rs** e il servizio distinto che costruisce e ospita la documentazione delle crate pubblicate.

Una release contiene sorgenti e metadati in un archivio `.crate`, non il tuo repository Git completo ne necessariamente un eseguibile gia compilato. Pubblicare richiede una decisione esplicita: **non usare il registry pubblico per provare gli esempi di questa nota**.

Una versione gia pubblicata non si sovrascrive con `cargo publish`. Yank e cancellazione sono operazioni diverse, spiegate piu sotto. [Architettura di crates.io](https://github.com/rust-lang/crates.io/blob/main/docs/ARCHITECTURE.md).

## Quando usarlo

- Per trovare e valutare dipendenze riusabili.
- Per distribuire una libreria o un package che contiene binari installabili.
- Per controllare versioni, feature, licenza, MSRV e manutenzione di una dipendenza.
- Per preparare un rilascio con metadati e contenuti del pacchetto verificati.

Essere presenti sul registry non certifica qualita o sicurezza. Controlla identita del progetto, repository, documentazione, manutenzione, dipendenze e avvisi pertinenti, non soltanto il numero di download.

## Come funziona

### Registry, Cargo, repository e documentazione

| Elemento | Ruolo |
| --- | --- |
| crates.io | Conserva release e metadati e rende disponibile l'indice delle versioni |
| Cargo | Risolve dipendenze, scarica sorgenti, compila e prepara il pacchetto |
| Repository Git | Conserva la storia di sviluppo; un push non pubblica una crate da solo |
| docs.rs | Costruisce la documentazione separatamente dal caricamento della release |

L'indice del registry descrive le versioni disponibili; il lockfile del tuo progetto registra la risoluzione scelta. Vedi [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]].

Per usare una libreria nel codice si aggiunge una dipendenza al manifest. `cargo install` serve invece a installare eseguibili da package con target binari: non aggiunge una libreria al progetto.

### Cercare e aggiungere una dipendenza

Questi comandi possono accedere alla rete. Non sono necessari per l'esercizio locale.

Cerca Serde nel registry pubblico:

```bash
cargo search serde --registry crates-io
```

Leggi i metadati del package; l'operazione puo scaricarne i sorgenti nella cache:

```bash
cargo info serde --registry crates-io
```

Dal progetto in cui vuoi davvero usarlo, aggiungi Serde con le derive. **Modifica il manifest e puo aggiornare il lockfile**:

```bash
cargo add serde --features derive
```

La dichiarazione risultante usa un requisito di versione, per esempio `serde = { version = "1", features = ["derive"] }`, non implementa automaticamente la serializzazione dei tuoi tipi. Usa solo le feature necessarie. [cargo info](https://doc.rust-lang.org/cargo/commands/cargo-info.html), [derive di Serde](https://serde.rs/derive.html).

## API / Sintassi

### Metadati prima di distribuire

Il manifest deve descrivere **quel progetto reale**, senza URL inventati o licenze copiate per far sparire un avviso.

- `name`: nome del package, soggetto alle regole e alla disponibilita del registry.
- `version`: versione della release; la scelta deve rispettare il contratto di compatibilita.
- `description` e `readme`: cosa fa il package e come usarlo.
- `license` oppure `license-file`: licenza effettivamente applicabile e relativo testo.
- `repository`, ed eventualmente `homepage` e `documentation`: indirizzi reali.
- `rust-version`, se dichiarata: MSRV da verificare, non soltanto un'etichetta.

Per esempio, `license = "MIT OR Apache-2.0"` esprime una scelta fra due licenze: ha senso soltanto se il progetto e realmente distribuito cosi e include i testi richiesti. Non tutti i campi consigliati sono obbligatori per il server: **warning locali e rifiuti del registry non sono la stessa cosa**. [Metadati del manifest](https://doc.rust-lang.org/cargo/reference/manifest.html), [preparare una pubblicazione](https://doc.rust-lang.org/cargo/reference/publishing.html#before-publishing-a-new-crate).

### Quali file finiscono nell'archivio

Nel manifest, `include` e `exclude` sono campi di **`[package]`**, non tabelle autonome. Se specifichi entrambi, `include` prevale.

Un'alternativa a una lista di inclusione e aggiungere alla tabella `[package]` esistente:

```toml
exclude = ["tests/fixtures/*", "notes/*"]
```

Non incollare questa riga dopo `[dependencies]`: diventerebbe una dichiarazione nel contesto sbagliato. Escludere fixture richieste dai test puo inoltre rendere incompleto il pacchetto: verifica cio che distribuisci.

Il file `Cargo.toml` distribuito viene normalizzato; Cargo conserva anche `Cargo.toml.orig`. Nella versione qui verificata, include inoltre `Cargo.lock`, anche se la lista `include` non lo nomina. Il lockfile incluso non vincola i consumer di una libreria. [cargo package](https://doc.rust-lang.org/cargo/commands/cargo-package.html).

Controlla l'elenco effettivo, non dedurlo soltanto da `.gitignore`. Credenziali, `.env`, dati privati e file generati non devono finire accidentalmente nella release.

### Preparare, simulare e pubblicare sono tre operazioni diverse

- **`cargo package`** crea l'archivio locale e normalmente lo estrae e lo compila. Non lo carica sul registry e non esegue automaticamente tutti i test.
- **`cargo publish --dry-run`** prova il percorso di pubblicazione senza upload. Puo consultare il registry, crea artefatti e non garantisce che il server accettera il caricamento successivo.
- **`cargo publish`** carica realmente il package sul registry selezionato.

`--no-verify` salta la compilazione di verifica: non corregge un pacchetto incompleto. `--allow-dirty` permette di impacchettare modifiche non committate: non le salva in Git. Per una release preferisci una revisione identificabile e una directory di lavoro coerente. [cargo package](https://doc.rust-lang.org/cargo/commands/cargo-package.html), [cargo publish](https://doc.rust-lang.org/cargo/commands/cargo-publish.html).

## Esempio pratico

Crea questi **quattro file** in una nuova directory di prova esterna al vault. E un package didattico per controllare contenuto e compilazione dell'archivio, **non una crate pronta da pubblicare**.

Non richiede dipendenze esterne. Le verifiche usano Rust/Cargo **1.99.1**, edition **2024**, Windows GNU; per fmt e Clippy servono i rispettivi componenti. Per ispezionare l'archivio viene usato `tar`.

### Cargo.toml

```toml
[package]
name = "registry-demo"
version = "0.1.0"
edition = "2024"
description = "Esempio locale di packaging di una libreria Rust"
readme = "README.md"
publish = false
include = ["src/**", "tests/**", "README.md"]

[dependencies]
```

`publish = false` impedisce la pubblicazione tramite Cargo, non rende privati i file o l'archivio. Licenza e repository sono intenzionalmente assenti: prima di distribuire un progetto vero vanno scelti e dichiarati correttamente. Gli avvisi sui metadati non sono un invito a inventarli.

### src/lib.rs

```rust
/// Conta le righe che contengono almeno un carattere non whitespace.
///
/// ```
/// assert_eq!(registry_demo::count_nonempty_lines("uno\n\n due\n"), 2);
/// ```
pub fn count_nonempty_lines(input: &str) -> usize {
    input.lines().filter(|line| !line.trim().is_empty()).count()
}
```

La funzione usa le regole di `str::lines` e `str::trim`: non e un parser CSV o Markdown e non modifica il testo originale.

### tests/lines.rs

```rust
#[test]
fn empty_and_blank_input() {
    assert_eq!(registry_demo::count_nonempty_lines(""), 0);
    assert_eq!(registry_demo::count_nonempty_lines(" \n\t\n"), 0);
}

#[test]
fn mixed_lines() {
    assert_eq!(registry_demo::count_nonempty_lines("uno\r\n\r\ndue\n"), 2);
}
```

### README.md

```markdown
# registry-demo

Dimostrazione locale del packaging Cargo, non destinata alla pubblicazione.

La funzione count_nonempty_lines conta le righe non vuote dopo trim.
```

### Controllare codice e documentazione

Esegui i comandi dalla directory contenente il manifest. Creano output sotto `target/` e possono generare `Cargo.lock`.

Controlla la formattazione senza riscrivere i sorgenti:

```bash
cargo fmt --all -- --check
```

Controlla i lint, considerando anche i target di test:

```bash
cargo clippy --all-targets --all-features -- -D warnings
```

Esegui integration test e doctest:

```bash
cargo test --all-features
```

Genera la documentazione locale senza aprire il browser:

```bash
cargo doc --no-deps
```

L'esempio non dichiara feature. In un progetto reale `--all-features` **non prova tutte le combinazioni**: testa anche la configurazione predefinita, quella minima e le combinazioni supportate. Non attivare insieme feature che il progetto documenta come incompatibili.

### Controllare il pacchetto effettivo

Elenca i file senza creare l'archivio:

```bash
cargo package --list --offline
```

Controlla che i quattro file dell'esercizio siano presenti insieme ai file gestiti da Cargo. Un elenco corretto non dimostra che il codice compili.

Crea l'archivio e verifica la compilazione dei sorgenti estratti:

```bash
cargo package --offline
```

Gli avvisi su licenza o altri metadati mancanti sono previsti per questo esercizio non pubblicabile. L'archivio si trova normalmente in `target/package/registry-demo-0.1.0.crate`; un `CARGO_TARGET_DIR` o una configurazione diversa cambiano la destinazione.

Ispeziona l'archivio prodotto:

```bash
tar -tf target/package/registry-demo-0.1.0.crate
```

Cargo verifica la copia estratta, non soltanto il progetto originale: un file necessario ma escluso puo far riuscire la build ordinaria e fallire il packaging.

Anche il contrario e importante: un package che compila puo avere test falliti. Per questo i controlli precedenti restano separati. La verifica puo eseguire build script: non e un ambiente isolato per codice non fidato.

## Varianti

### Procedura per un rilascio reale

Questa sezione **non va eseguita sul package didattico**. Parti da un tuo progetto pronto, con nome disponibile o gia di tua proprieta, versione nuova, metadati reali, licenza e contenuti verificati.

Per limitare la destinazione al registry pubblico puoi sostituire il campo di blocco con `publish = ["crates-io"]` nella tabella `[package]`. Questa lista **autorizza** la destinazione, non la rende una simulazione.

1. Esegui test, lint, documentazione e controllo del pacchetto con le configurazioni supportate.
2. Controlla changelog e corrispondenza fra revisione Git e sorgenti distribuiti.
3. Esegui il dry-run, senza upload:

```bash
cargo publish --dry-run --registry crates-io
```

Un dry-run non prenota il nome o la versione e non e una certificazione di accettazione da parte del server. Puo fallire offline con una cache vuota anche senza dipendenze esterne, perche necessita di metadati del registry. Nel progetto di prova, `publish = false` blocca anche il dry-run nella toolchain verificata.

4. Prepara autenticazione e autorizzazioni per il registry. Per il flusso manuale serve un account crates.io, con i requisiti di verifica richiesti dal servizio, e un token con permessi adeguati. Non scriverlo negli appunti o in un comando salvato nella cronologia.
5. Solo quando vuoi realmente caricare la release, esegui il comando di pubblicazione riportato sotto.

Salva il token tramite il provider configurato; con il provider predefinito viene conservato in `$CARGO_HOME/credentials.toml`:

```bash
cargo login --registry crates-io
```

Il token viene letto dall'input interattivo. Proteggi quel file e revoca subito un token esposto; rimuoverlo dal computer non equivale a revocarlo sul servizio. [cargo login](https://doc.rust-lang.org/cargo/commands/cargo-login.html).

**Upload reale:** dalla directory del package scelto, non dall'esercizio:

```bash
cargo publish --registry crates-io
```

Controlla l'esito sul registry: un timeout mentre Cargo attende la comparsa nell'indice puo avvenire **dopo** un upload riuscito. Non tentare automaticamente un'altra versione senza verificare lo stato. [cargo publish](https://doc.rust-lang.org/cargo/commands/cargo-publish.html).

### Yank, nuove release e cancellazione

Per correggere una release normalmente pubblichi una nuova versione compatibile e, se necessario, fai yank di quella problematica. Uno yank impedisce la normale selezione nelle nuove risoluzioni, **non cancella il download** e non aggiorna i lockfile gia esistenti. Anche un requisito esatto non lo aggira automaticamente; un'eccezione esplicita e `cargo update --precise`. [Resolver Cargo](https://doc.rust-lang.org/cargo/reference/resolver.html#yanked-versions).

**Operazioni remote**, soltanto per una versione del tuo package pubblicato: i comandi seguenti ricavano il nome dal manifest nella directory corrente e usano `0.1.0` come esempio.

```bash
cargo yank --version 0.1.0 --registry crates-io
```

Annulla lo yank, ripristinando la selezionabilita:

```bash
cargo yank --version 0.1.0 --undo --registry crates-io
```

Verifica prima nome, versione e impatto sui dipendenti. Yank non e una soluzione per segreti pubblicati: revocali subito e segui la procedura del registry. [cargo yank](https://doc.rust-lang.org/cargo/commands/cargo-yank.html).

Non e corretto dire che **nessuna cancellazione e mai possibile**: crates.io ha introdotto cancellazioni condizionate per gli owner. Non sono una normale riscrittura di una release o un modo sicuro di fare prove; verifica le condizioni correnti nelle policy e nell'interfaccia, senza assumere che una tua crate sia eliminabile. [Annuncio ufficiale](https://blog.rust-lang.org/2025/02/05/crates-io-development-update/), [policy del servizio](https://crates.io/policies).

### Dipendenze locali, Git e registry alternativi

Una dipendenza normale usata solo via `path` non diventa automaticamente disponibile ai consumer. Per la pubblicazione occorre una versione risolvibile nel registry; una dichiarazione `path` piu `version` usa il percorso in sviluppo, mentre il manifest distribuito non mantiene quel percorso locale. [cargo package](https://doc.rust-lang.org/cargo/commands/cargo-package.html).

Le dev-dependencies senza `version` vengono escluse dal manifest pubblicato. Il package puo quindi compilare, ma i test distribuiti che importano quelle dipendenze non funzionare: controlla anche questa eventualita. [Dev-dependencies](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html#development-dependencies).

I package pubblicati su crates.io non possono dipendere normalmente da sorgenti Git o da altri registry. Anche `git` piu `version`, come `path` piu `version`, permette di usare una sorgente in sviluppo e la versione del registry dopo la pubblicazione. Prima del rilascio controlla il manifest normalizzato e la risoluzione effettiva. [Sorgenti delle dipendenze](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html#multiple-locations).

I registry privati si configurano separatamente e possono avere policy diverse. Non confondere `--registry`, che seleziona un registry configurato, con un URL di repository Git.

### CI, permessi e documentazione pubblicata

Per automatizzare i rilasci esiste **Trusted Publishing**: la CI dimostra la propria identita tramite OIDC e ottiene credenziali temporanee, invece di conservare necessariamente un token statico. Richiede configurazione sul registry e sul workflow; non basta aggiungere `cargo publish` a un job. [Architettura ufficiale](https://github.com/rust-lang/crates.io/blob/main/docs/ARCHITECTURE.md), [guida Trusted Publishing](https://crates.io/docs/trusted-publishing).

Limitare permessi e destinatari resta importante. Aggiungere un owner a una crate e una concessione di accesso, non un semplice credito nel README.

Dopo una pubblicazione, controlla anche la build di docs.rs: un upload riuscito non garantisce documentazione costruita correttamente sulla sua piattaforma e con le sue impostazioni. [docs.rs: build](https://docs.rs/about/builds).

## Errori comuni

- Eseguire publish come parte di una checklist di sola verifica locale.
- Copiare token, URL fittizi o licenze non applicabili nel manifest.
- Credere che package o dry-run eseguano tutti i test o garantiscano l'accettazione remota.
- Distribuire file privati o escludere file necessari alla compilazione.
- Usare no-verify o allow-dirty per nascondere un problema non compreso.
- Pensare che all-features equivalga a tutte le combinazioni supportate.
- Confondere yank, cancellazione, nuova versione e revoca di credenziali.
- Confondere una release crates.io con un push Git o una documentazione docs.rs riuscita.

## Checklist

- [ ] Identita del package, versione e destinatario sono quelli voluti?
- [ ] Metadati, licenza, README e repository corrispondono al progetto reale?
- [ ] Sono stati controllati elenco dei file e archivio prodotto?
- [ ] Nessun segreto o allegato privato entra nel pacchetto?
- [ ] Il package estratto compila e i test separati passano?
- [ ] Le dipendenze saranno risolvibili anche fuori dal repository?
- [ ] Toolchain, MSRV, target e feature supportati sono stati verificati?
- [ ] Autenticazione e permessi sono limitati al necessario?
- [ ] Upload e gestione remota sono azioni intenzionali e distinte dalle prove?

## Collegamenti

- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]]
- [[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]
- [[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version|MSRV]]
- [[Programmazione/Rust/Pagine/cargo audit|cargo audit]]
- [[Programmazione/Rust/Pagine/cargo deny|cargo deny]]

## Fonti

- [Cargo: preparazione della pubblicazione](https://doc.rust-lang.org/cargo/reference/publishing.html).
- [Cargo: package](https://doc.rust-lang.org/cargo/commands/cargo-package.html).
- [Cargo: publish](https://doc.rust-lang.org/cargo/commands/cargo-publish.html).
- [Cargo: login](https://doc.rust-lang.org/cargo/commands/cargo-login.html).
- [Cargo: yank](https://doc.rust-lang.org/cargo/commands/cargo-yank.html).
- [crates.io: architettura e autorizzazioni](https://github.com/rust-lang/crates.io/blob/main/docs/ARCHITECTURE.md).
- [crates.io: introduzione delle cancellazioni condizionate](https://blog.rust-lang.org/2025/02/05/crates-io-development-update/).
- [docs.rs: ambiente di build](https://docs.rs/about/builds).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
