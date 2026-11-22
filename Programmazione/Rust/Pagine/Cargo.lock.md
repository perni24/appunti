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
  - Lockfile Cargo
  - Cargo lockfile
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo]]"
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
related:
  - "[[Programmazione/Rust/Pagine/Semantic Versioning]]"
  - "[[Programmazione/Rust/Pagine/Crates.io]]"
  - "[[Programmazione/Rust/Pagine/cargo audit]]"
title: Cargo.lock
---

# Cargo.lock

## Sintesi

`Cargo.lock` registra la **risoluzione concreta delle dipendenze** di un progetto Rust: versioni scelte e, secondo il tipo di sorgente, identificatori e checksum. Cargo lo genera e lo aggiorna.

Serve a riutilizzare una risoluzione nota, ma **non e una fotografia completa della build**: non fissa compilatore, linker, sistema operativo, feature del comando o contenuto delle dipendenze locali `path`.

Come regola predefinita, conserva il lockfile in Git, anche per lo sviluppo di una libreria. Il lockfile della libreria non impone pero le sue scelte ai progetti che la usano. [FAQ Cargo](https://doc.rust-lang.org/cargo/faq.html#why-have-cargolock-in-version-control).

## Quando usarlo

- Per mantenere sviluppo, CI e rilascio su una risoluzione delle dipendenze controllata.
- Per verificare cosa cambia durante un aggiornamento, incluse le dipendenze transitive.
- Per ricostruire una versione precedente insieme a sorgenti, toolchain e configurazione.
- Per preparare una build senza accesso alla rete, procurando anche i sorgenti necessari.

Il lockfile non sostituisce test, revisione delle dipendenze o controlli di sicurezza.

## Come funziona

### Requisiti e risoluzione

`Cargo.toml` dichiara quali versioni sono ammesse; `Cargo.lock` registra quelle selezionate. Per esempio, `serde = "1"` e un requisito, non una versione esatta.

Se una versione registrata soddisfa ancora i requisiti, un normale build tende a conservarla anche se ne esiste una piu recente. Se cambi il manifest rendendola incompatibile, Cargo deve risolvere nuovamente la parte interessata; `--locked` trasforma la necessita di cambiare lockfile in un errore. [Dependency resolution](https://doc.rust-lang.org/cargo/reference/resolver.html#lock-file).

Il lockfile **non contiene il codice delle dipendenze**. Avere il file senza avere sorgenti locali, cache o accesso alle sorgenti remote non basta per compilare.

### Cosa leggere nel file

| Elemento | Significato |
| --- | --- |
| `version` al livello principale | Versione del formato del lockfile, non di Rust o della tua app |
| `[[package]]` | Un package nel grafo risolto; lo stesso nome puo apparire con versioni diverse |
| `name` e `version` nel package | Identita e versione del package |
| `source` | Sorgente, per esempio registry o Git; per Git include la revisione risolta |
| `checksum` | Controllo di integrita dell'archivio di un package registry |
| `dependencies` | Collegamenti verso altri package nel grafo |

Non tutte le voci hanno tutti i campi. Nel progetto locale piu sotto non ci sono `source` e `checksum`: Cargo legge la dipendenza `path` dalla directory indicata nel manifest, senza congelarne il contenuto. Il percorso relativo parte dalla directory del manifest che dichiara la dipendenza, non dalla directory da cui esegui il comando.

Leggi il lockfile per capire il diff, ma **lascia a Cargo la modifica del contenuto**. Non copiare a mano versioni o checksum da un altro progetto. [Manifest e lockfile](https://doc.rust-lang.org/cargo/guide/cargo-toml-vs-cargo-lock.html).

### Riproducibilita: il limite da ricordare

Lo stesso lockfile non garantisce un binario identico byte per byte. Restano da controllare:

- sorgenti dell'app e dipendenze locali;
- toolchain, target di compilazione, linker e librerie native;
- feature, profili e variabili d'ambiente;
- build script e input esterni alla risoluzione Cargo.

Il grafo del lockfile puo comprendere dipendenze per altre piattaforme o feature non attivate nella build corrente. Non equivale all'elenco esatto del codice incluso nel binario. Per ispezionare il grafo usa `cargo tree`, tenendo conto delle sue opzioni. [Resolver](https://doc.rust-lang.org/cargo/reference/resolver.html), [cargo tree](https://doc.rust-lang.org/cargo/commands/cargo-tree.html).

## API / Sintassi

Tutti i comandi seguenti si eseguono dalla directory del progetto o del workspace. Possono creare output sotto `target/`; quelli senza vincoli sul lockfile possono anche generarlo o aggiornarlo.

### locked, offline e frozen

| Opzione | Modifica del lockfile | Rete Cargo |
| --- | --- | --- |
| `--locked` | Rifiutata; errore anche se il file manca | Consentita |
| `--offline` | Consentita con cio che e disponibile localmente | Disabilitata |
| `--frozen` | Rifiutata | Disabilitata |

Compila senza accettare cambiamenti al lockfile:

```bash
cargo build --locked
```

Esegui i test con lo stesso vincolo:

```bash
cargo test --locked
```

Compila usando soltanto le sorgenti gia disponibili a Cargo. Questa modalita puo ancora creare o aggiornare `Cargo.lock`:

```bash
cargo build --offline
```

Combina i due vincoli:

```bash
cargo build --frozen
```

`--frozen` equivale a `--locked --offline`. La risoluzione offline puo differire da quella online se i pacchetti disponibili non sono gli stessi. Queste opzioni **non isolano build script o programmi eseguiti** dal sistema o dalla rete. [Opzioni Cargo](https://doc.rust-lang.org/cargo/commands/cargo-update.html#manifest-options).

### Preparare le dipendenze prima di andare offline

Con un lockfile gia presente e coerente, scarica i sorgenti delle dipendenze senza cambiarne la risoluzione:

```bash
cargo fetch --locked
```

Poi puoi usare il comando frozen. `fetch` non installa compilatori o librerie di sistema e non prepara automaticamente tutti gli input di un build script. Senza `--target` recupera le dipendenze per tutte le piattaforme presenti nel lockfile. [cargo fetch](https://doc.rust-lang.org/cargo/commands/cargo-fetch.html).

### Aggiornamenti: generali, mirati e precisi

Mostra gli aggiornamenti possibili senza scrivere il lockfile. Puo comunque consultare la rete e aggiornare cache:

```bash
cargo update --dry-run
```

Aggiorna la risoluzione di tutte le dipendenze entro i requisiti ammessi. **Modifica il lockfile e non esegue i test**:

```bash
cargo update
```

In un progetto che usa Serde, limita l'aggiornamento al package indicato:

```bash
cargo update -p serde
```

Lo stesso vale per Tokio, se e presente nel progetto:

```bash
cargo update -p tokio
```

L'aggiornamento mirato e conservativo, non significa "cambia sempre una sola riga": le dipendenze transitive possono cambiare se necessario. `--recursive` estende intenzionalmente l'aggiornamento anche alle sue dipendenze.

`--precise` permette di scegliere una versione specifica compatibile con i requisiti, oppure una revisione per una sorgente Git. Non aggira vincoli incompatibili del manifest. Le forme ordinarie mostrate qui non allargano da sole un requisito `"1"` a `"2"`. [cargo update](https://doc.rust-lang.org/cargo/commands/cargo-update.html#update-options).

Questi esempi Serde/Tokio sono procedure per progetti che gia li usano, non dipendenze richieste dall'esercizio locale.

### Ispezionare il risultato

Visualizza il grafo senza consentire modifiche alla risoluzione:

```bash
cargo tree --locked
```

In un progetto con Tokio, cerca chi lo usa:

```bash
cargo tree -i tokio --locked
```

Se piu versioni rendono il nome ambiguo, usa una specifica `nome@versione` corrispondente al grafo. L'albero inverso aiuta a trovare i dipendenti, non dimostra che una dipendenza sia sicura o indispensabile. [cargo tree](https://doc.rust-lang.org/cargo/commands/cargo-tree.html).

In un repository Git dove il lockfile e gia tracciato, controlla il diff prima di preparare il commit:

```bash
git diff -- Cargo.toml Cargo.lock
```

Un file nuovo non tracciato non compare nel normale diff: controlla anche lo stato Git. Dopo l'aggiornamento, esegui i test e la matrice di configurazioni realmente supportate.

## Esempio pratico

Crea i cinque file seguenti in una **nuova directory di prova esterna al vault**. Non creare manualmente `Cargo.lock`: verra generato da Cargo.

Il progetto ha un eseguibile e una libreria locale; non richiede crate remote. Verificato con Rust/Cargo **1.99.1**, edition **2024**, Windows GNU: non e una verifica della MSRV o di altre piattaforme.

### Cargo.toml

```toml
[package]
name = "lock-demo"
version = "0.1.0"
edition = "2024"
publish = false

[dependencies]
label-core = { path = "label-core", version = "0.1" }
```

### src/main.rs

```rust
fn main() {
    println!("{}", label_core::label("Rust"));
}
```

### label-core/Cargo.toml

```toml
[package]
name = "label-core"
version = "0.1.0"
edition = "2024"
publish = false
```

### label-core/src/lib.rs

```rust
pub fn label(title: &str) -> String {
    format!("Note: {title}")
}
```

### tests/label.rs

```rust
#[test]
fn formats_label() {
    assert_eq!(label_core::label("Rust"), "Note: Rust");
}
```

Il test d'integrazione appartiene al progetto principale e usa la dipendenza normale. Non stiamo eseguendo implicitamente i test interni di tutte le dipendenze.

### Generare il lockfile

Dalla directory principale:

```bash
cargo generate-lockfile --offline
```

Nel progetto appena creato genera il file senza compilare. **Se un lockfile esiste gia, generate-lockfile lo ricostruisce scegliendo nuove versioni disponibili compatibili**: non usarlo come controllo innocuo di un file esistente. [cargo generate-lockfile](https://doc.rust-lang.org/cargo/commands/cargo-generate-lockfile.html).

### Cargo.lock generato

Con la toolchain verificata, il risultato e:

```toml
# This file is automatically @generated by Cargo.
# It is not intended for manual editing.
version = 4

[[package]]
name = "label-core"
version = "0.1.0"

[[package]]
name = "lock-demo"
version = "0.1.0"
dependencies = [
 "label-core",
]
```

`version = 4` riguarda il **formato**. Non cambiarla a mano per adattare il progetto a una toolchain piu vecchia: usa una versione di Cargo compatibile con la policy del progetto.

### Eseguire e verificare

Esegui il programma; stampa `Note: Rust`:

```bash
cargo run --locked
```

Esegui il test senza rete Cargo e senza modificare il lockfile:

```bash
cargo test --frozen
```

Ora cambia **solo** la versione in `label-core/Cargo.toml` da `0.1.0` a `0.1.1`. Il requisito `"0.1"` resta compatibile, ma il lockfile non descrive piu la versione locale: ripetere `cargo build --locked` deve fallire.

Accetta intenzionalmente il cambiamento:

```bash
cargo update -p label-core --offline
```

Il lockfile ora registra `0.1.1`. Ripeti il test frozen e controlla il diff.

**Controesempio importante:** se cambi soltanto il corpo di `label`, senza cambiare manifest o versione, il lockfile puo restare identico e un build locked puo riuscire. Il codice locale compilato e comunque diverso: ecco perche servono anche sorgenti versionati e test.

## Varianti

### Applicazione, libreria e workspace

- **Applicazione/binario:** conserva normalmente il lockfile insieme ai sorgenti.
- **Libreria:** conservarlo stabilizza sviluppo e CI, ma i consumer risolvono le dipendenze nel proprio progetto. Affianca prove con dipendenze aggiornate alla build fissata.
- **Workspace:** i membri condividono il lockfile della radice; non mantenerne uno indipendente per ogni membro.

La scelta di non versionarlo puo essere intenzionale, ma non deriva automaticamente dal fatto che il package sia una libreria. [FAQ Cargo](https://doc.rust-lang.org/cargo/faq.html#why-have-cargolock-in-version-control), [workspace](https://doc.rust-lang.org/cargo/reference/workspaces.html).

### Lockfile non significa dipendenze sicure

Un checksum controlla l'integrita rispetto al valore atteso, non l'assenza di vulnerabilita. Una versione rimossa dalle nuove risoluzioni tramite **yank** puo restare utilizzabile se gia registrata nel lockfile: non considerare questo file un controllo di sicurezza. Vedi [[Programmazione/Rust/Pagine/cargo audit|cargo audit]] e il [resolver Cargo](https://doc.rust-lang.org/cargo/reference/resolver.html#yanked-versions).

### Conflitti e cambiamenti inattesi

In un conflitto Git, risolvi prima i requisiti dei manifest e conserva una base coerente del lockfile; lascia a Cargo riconciliare il grafo, poi rivedi il diff e i test. Non fondere a mano entry e checksum.

Cancellare il lockfile o rigenerarlo da zero puo aggiornare molte dipendenze non correlate al problema originale. Un cambiamento del formato puo dipendere dalla versione di Cargo: coordinare la toolchain evita modifiche involontarie da parte dei collaboratori.

## Errori comuni

- Trattare il lockfile come garanzia di build identica o sicura.
- Credere che `--locked` impedisca i download o che `--offline` impedisca ogni modifica al lockfile.
- Usare `--frozen` senza aver procurato sorgenti, toolchain e prerequisiti.
- Rigenerare il file dopo ogni errore, perdendo la risoluzione precedente.
- Aspettarsi che `cargo update` compili, esegua test o superi requisiti incompatibili.
- Pensare che il lockfile di una libreria vincoli i consumer.
- Considerare un aggiornamento mirato privo di effetti sulle dipendenze transitive.
- Copiare o modificare manualmente versioni, checksum o formato del file.

## Checklist

- [ ] La policy Git del lockfile e esplicita?
- [ ] Il lockfile e coerente con i manifest?
- [ ] La CI usa locked o frozen secondo la disponibilita dei sorgenti?
- [ ] Sono controllati anche toolchain, feature, piattaforma e input esterni?
- [ ] Il diff comprende soltanto aggiornamenti compresi e accettati?
- [ ] I test sono stati rieseguiti dopo la modifica?
- [ ] Una libreria viene provata anche con aggiornamenti compatibili delle dipendenze?
- [ ] Le dipendenze vengono controllate separatamente per vulnerabilita e manutenzione?

## Collegamenti

- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Workspace dependencies|Workspace dependencies]]
- [[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]
- [[Programmazione/Rust/Pagine/Crates.io|Crates.io]]
- [[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version|MSRV]]
- [[Programmazione/Rust/Pagine/cargo audit|cargo audit]]

## Fonti

- [Cargo Book: manifest e lockfile](https://doc.rust-lang.org/cargo/guide/cargo-toml-vs-cargo-lock.html).
- [Cargo FAQ: lockfile in Git](https://doc.rust-lang.org/cargo/faq.html#why-have-cargolock-in-version-control).
- [Cargo: aggiornamenti](https://doc.rust-lang.org/cargo/commands/cargo-update.html).
- [Cargo: generazione del lockfile](https://doc.rust-lang.org/cargo/commands/cargo-generate-lockfile.html).
- [Cargo: download preventivo](https://doc.rust-lang.org/cargo/commands/cargo-fetch.html).
- [Cargo: risoluzione delle dipendenze](https://doc.rust-lang.org/cargo/reference/resolver.html).
- [Cargo: lettura del grafo](https://doc.rust-lang.org/cargo/commands/cargo-tree.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
