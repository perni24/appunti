---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - testing-qualita-e-sicurezza
aliases:
  - Snapshot testing
  - Insta
prerequisites:
  - "[[Programmazione/Rust/Pagine/Unit test|Unit test]]"
  - "[[Programmazione/Rust/Pagine/Serde e serializzazione|Serde e serializzazione]]"
related:
  - "[[Programmazione/Rust/Pagine/CLI con clap|CLI con clap]]"
  - "[[Programmazione/Rust/Pagine/Doc test|Doc test]]"
  - "[[Programmazione/Rust/Pagine/Integration test|Integration test]]"
title: Snapshot testing
---

# Snapshot testing

## Sintesi

Uno **snapshot test** confronta l'output corrente con un riferimento che hai letto e approvato. Se una CLI passa da `failed: 1` a `failed: 0`, il test segnala la differenza; non sa se sia un miglioramento o un errore. Il criterio per decidere viene dal requisito, non dall'ultimo output prodotto.

## Quando usarlo

Scegli uno snapshot per un report multilinea, un messaggio diagnostico o una struttura serializzata quando leggere la differenza è più utile di molte asserzioni separate. Per un numero, un codice di uscita o un valore booleano usa di norma `assert_eq!`: rende esplicito ciò che ti aspetti.

| Forma | Che cosa rimane sotto controllo | Esempio |
| --- | --- | --- |
| Testo su file | Il testo leggibile prodotto dal programma. | Intestazione e righe del report stampato su stdout. |
| JSON strutturato | Nomi, tipi e valori dei campi serializzati, salvo quelli mascherati esplicitamente. | Un contatore resta un numero e non diventa una stringa. |
| Inline | Un valore breve, accanto all'asserzione nel sorgente. | Il messaggio su stderr per un argomento sconosciuto. |

## Esempio pratico

### 1. Preparare una CLI con un output osservabile

Crea il progetto e lavora poi dalla cartella `report_notes`. Per la prima installazione servono l'accesso a crates.io oppure le dipendenze già in cache.

```sh
cargo new --lib --vcs none report_notes
```

In `Cargo.toml` integra queste sezioni, senza duplicare l'intestazione `[dependencies]` creata da Cargo. Il modello usa Serde anche fuori dai test; solo la suite dipende da Insta. La feature `json` abilita lo snapshot strutturato, `redactions` la sostituzione mirata di un campo.

```toml
[dependencies]
serde = { version = "1", features = ["derive"] }

[dev-dependencies]
insta = { version = "=1.49.0", features = ["json", "redactions"] }
```

Sostituisci `src/lib.rs` con il modello del report:

```rust
#[derive(serde::Serialize)]
pub struct Report<'a> {
    run_id: &'a str,
    passed: usize,
    failed: usize,
}

impl<'a> Report<'a> {
    pub fn from_checks(run_id: &'a str, checks: &[bool]) -> Self {
        let passed = checks.iter().filter(|&&ok| ok).count();
        Self { run_id, passed, failed: checks.len() - passed }
    }

    pub fn render(&self) -> String {
        format!("Checks\npassed: {}\nfailed: {}", self.passed, self.failed)
    }
}
```

Crea `src/main.rs`. Il comando riceve gli esiti da riepilogare: `fail` è un **dato valido** del report, non un errore della CLI. Un argomento diverso da `ok` e `fail` dà invece un errore d'uso.

```rust
use report_notes::Report;
use std::process::ExitCode;

fn main() -> ExitCode {
    let mut checks = Vec::new();
    for arg in std::env::args().skip(1) {
        match arg.as_str() {
            "ok" => checks.push(true),
            "fail" => checks.push(false),
            _ => {
                eprintln!("expected ok or fail");
                return ExitCode::from(2);
            }
        }
    }
    println!("{}", Report::from_checks("local", &checks).render());
    ExitCode::SUCCESS
}
```

### 2. Fotografare il risultato, non la fixture

Crea `tests/report.rs`. Il [[Programmazione/Rust/Pagine/Integration test|test di integrazione]] usa il percorso del binario fornito da Cargo: se cambia ciò che la CLI stampa, cambia ciò che il test legge. Il test JSON usa invece direttamente il modello; controlla la serializzazione, non i byte emessi dal processo.

```rust
use report_notes::Report;
use std::process::Command;

#[test]
fn report_on_stdout() {
    let out = Command::new(env!("CARGO_BIN_EXE_report_notes"))
        .args(["ok", "fail", "ok"]).output().unwrap();
    assert_eq!(out.status.code(), Some(0));
    assert!(out.stderr.is_empty());
    let text = String::from_utf8(out.stdout).unwrap();
    insta::assert_snapshot!("cli_report", text);
}

#[test]
fn serialized_report() {
    let report = Report::from_checks("run-17", &[true, false, true]);
    insta::assert_json_snapshot!("report_json", report, {
        ".run_id" => "[run]"
    });
}

#[test]
fn invalid_argument() {
    let out = Command::new(env!("CARGO_BIN_EXE_report_notes"))
        .arg("other").output().unwrap();
    assert_eq!(out.status.code(), Some(2));
    assert!(out.stdout.is_empty());
    let text = String::from_utf8(out.stderr).unwrap();
    insta::assert_snapshot!(text.trim_end(), @"expected ok or fail");
}
```

Solo `run_id` è mascherato: cambiarne il valore non invalida lo snapshot, ma cambiare `failed` deve rimanere visibile. Non mascherare un campo di cui interessa il valore o il formato; in quel caso inietta un identificativo fisso oppure aggiungi un'asserzione separata.

### 3. Creare e approvare il riferimento

Esegui dalla radice del progetto, in locale e con le impostazioni predefinite:

```sh
cargo test --test report
```

**Il primo esito atteso è un test passato e due falliti.** Il messaggio inline ha già il suo riferimento. Per CLI e JSON non c'è ancora un riferimento approvato: Insta propone due file `.snap.new` in `tests/snapshots/`. Questo primo fallimento serve a chiederti cosa meriti di diventare il risultato atteso.

Per la revisione interattiva installa la CLI abbinata alla versione della libreria (il sottocomando non serve per il semplice confronto in CI):

```sh
cargo install cargo-insta --version 1.49.0 --locked
```

Per elencare le proposte pendenti:

```sh
cargo insta pending-snapshots
```

Per esaminare ogni differenza e decidere se accettarla, rifiutarla o lasciarla in sospeso:

```sh
cargo insta review
```

Verifica il contenuto prima di accettare: due `ok` e un `fail` devono produrre esattamente questi conteggi nel **corpo** dello snapshot testuale:

```text
Checks
passed: 2
failed: 1
```

Nel corpo dello snapshot JSON controlla `"run_id": "[run]"`, `"passed": 2` e `"failed": 1`. L'intestazione YAML dei file è un metadato di Insta, non fa parte dell'output della CLI. Dopo aver accettato entrambe le proposte, ripeti `cargo test --test report`: ora devono passare tutti e tre i test. Nel repository del progetto si versionano i file **`.snap` approvati**, non le proposte `.snap.new`; per lo snapshot inline il riferimento è già nel sorgente Rust.

## Leggere una differenza

- **Regressione:** in `render` sostituisci per prova il secondo argomento `self.failed` con `self.passed`. Fallisce solo lo snapshot della CLI: compare `failed: 2` al posto di `failed: 1`. Il JSON resta corretto; il difetto è nella presentazione. Rifiuta la proposta e ripristina `self.failed`: rifiutare il file non corregge il codice.
- **Cambiamento voluto:** se il requisito rinomina l'intestazione da `Checks` a `Check summary`, solo quella riga deve cambiare. Dopo aver letto la differenza puoi accettare il nuovo snapshot e versionarlo insieme alla modifica. Accettare tutti i file solo per far tornare verde la suite può nascondere la regressione precedente.
- **CI:** imposta `INSTA_UPDATE=no` nell'ambiente del passo di test ed esegui lo stesso comando Cargo. Un riferimento mancante o differente deve far fallire il job; non deve diventare automaticamente la nuova verità. Riserva la revisione al lavoro locale o alla pull request.

## Varianti e limiti

- Per una struttura Serde puoi scegliere anche YAML, abilitando la feature `yaml`. Uno snapshot della struttura non sostituisce il confronto dell'esatto testo o dei byte di un protocollo, se anche la formattazione fa parte del contratto.
- Rendi ripetibili ordine degli elementi, locale, orario e percorsi **solo dove non fanno parte del requisito**. Ordinare sempre l'output nel test nasconderebbe un ordinamento sbagliato in una CLI che promette un determinato ordine.
- Usa dati sintetici: file approvati, proposte locali e diff dei test possono contenere ciò che il programma stampa. Suddividi gli snapshot troppo lunghi per poterli revisionare riga per riga.
- [[Programmazione/Rust/Pagine/Property testing|Il property testing]] esplora molti input; uno snapshot protegge l'output dei soli casi scelti. Per il conteggio di un report vuoto, ad esempio, un test unitario esplicito può essere più chiaro.

## Checklist

- Il test legge l'output del codice di produzione oppure ripete una costante scritta nel test?
- Saprei spiegare ogni riga cambiata in base al requisito?
- Sto controllando separatamente stato del processo, stdout e stderr quando conta?
- I riferimenti approvati sono in Git e la CI li verifica senza riscriverli?

## Fonti

- [Insta 1.49.0: macro, feature e modalità di aggiornamento](https://docs.rs/insta/1.49.0/insta/)
- [Insta: formato dei file snapshot](https://insta.rs/docs/snapshot-files/)
- [cargo-insta: revisione e gestione delle proposte](https://insta.rs/docs/cli/)
- [Insta: selettori e redazioni](https://insta.rs/docs/redactions/)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Unit test|Unit test]]
- [[Programmazione/Rust/Pagine/Integration test|Integration test]]
- [[Programmazione/Rust/Pagine/Doc test|Doc test]]
- [[Programmazione/Rust/Pagine/Serde e serializzazione|Serde e serializzazione]]
- [[Programmazione/Rust/Pagine/CLI con clap|CLI con clap]]
