---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - backend-networking-e-database
aliases:
  - Background jobs
  - Job in background
prerequisites:
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async Tokio e async-std]]"
  - "[[Programmazione/Rust/Pagine/Channel async|Channel async]]"
  - "[[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]]"
related:
  - "[[Programmazione/Rust/Pagine/Connection pooling|Connection pooling]]"
  - "[[Programmazione/Rust/Pagine/Tracing con tracing|Tracing con tracing]]"
  - "[[Programmazione/Rust/Pagine/Error reporting|Error reporting]]"
title: Background jobs
---

# Background jobs

## Sintesi

**Accettato, eseguito e confermato sono tre stati diversi.** Se un handler mette un job in un canale Tokio e risponde `202 Accepted`, il lavoro non è necessariamente iniziato né salvato su disco. Se invece il worker ha già registrato il risultato ma si ferma prima di confermare il messaggio alla coda, il lavoro può essere consegnato una seconda volta.

Usa un job per un'operazione che può terminare dopo la richiesta: generare un report, elaborare un file o sincronizzare dati. Prima di scegliere la libreria, chiediti: *posso perdere questo lavoro al riavvio? Posso ripeterlo senza duplicare l'effetto?* Se l'utente deve conoscere l'esito, restituisci un ID consultabile e conserva lo stato necessario: la sola risposta HTTP non basta.

## Scegliere la garanzia

| Meccanismo | Che cosa garantisce | Che cosa non garantisce |
| --- | --- | --- |
| `tokio::spawn` | Il runtime può eseguire il task; attendendo il `JoinHandle` ne osservi la conclusione. | Scartare l'handle **non** aspetta il task e non lo cancella: lo sgancia. Il lavoro non sopravvive alla terminazione del processo. |
| `mpsc` limitato + worker | Il buffer ha capacità finita. `send().await` attende spazio; `try_send` distingue coda piena da ricevitore chiuso. | Un invio riuscito non equivale né a persistenza né a completamento. La capacità del buffer non è il limite dei job già attivi. |
| Coda persistente con riconsegna | Con persistenza e conferme configurate, un lavoro non confermato può essere ripreso da un worker. | Un'altra consegna può ripetere un lavoro già eseguito. Separare il worker in un processo diverso non rende durevole una coda in RAM. |

In una coda con conferme, l'**ack** è il segnale con cui il consumer dichiara gestito il messaggio. Confermare *prima* dell'effetto rischia di perderlo; confermare *dopo* lascia una finestra fra commit e ack. Un ID stabile per l'operazione, riusato su tutti i tentativi, permette di riconoscere quella finestra. Non usare come chiave un nuovo ID generato a ogni consegna.

## Esempio: contare un'elaborazione una sola volta

Ogni job segnala che un documento è stato elaborato. Due **eventi diversi** per lo stesso documento devono contare due volte; due **consegne dello stesso evento** devono contarne una. Il canale dell'esempio è volatile: SQLite conserva **le elaborazioni concluse**, non i job ancora in attesa. Non servono broker, rete o credenziali; servono Rust/Cargo con edition 2024, compilatore C e linker per SQLite.

```sh
cargo new --lib --edition 2024 job-documenti
```

```sh
cd job-documenti
```

Sostituisci la sezione vuota `[dependencies]` in `Cargo.toml`:

```toml
[dependencies]
sqlx = { version = "~0.8.6", default-features = false, features = ["runtime-tokio", "sqlite"] }
tokio = { version = "1", features = ["macros", "rt", "sync"] }

[dev-dependencies]
tempfile = "3"
```

I tre blocchi Rust seguenti formano un unico `src/lib.rs`, nell'ordine indicato.

### 1. Registrare chiave ed effetto nella stessa transazione

`open_store` crea il file SQLite indicato se manca. Nel test sarà sempre un file temporaneo. La chiave primaria è l'ID dell'**evento**, non del documento. Non facciamo un SELECT per decidere se inserire: è il vincolo univoco a stabilire quale tentativo può applicare l'effetto.

```rust
use sqlx::{
    SqlitePool,
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
};
use std::{future::Future, num::NonZeroUsize, path::Path};
use tokio::{sync::mpsc, task::JoinSet};

#[derive(Clone, Copy, Debug)]
pub struct Job {
    pub event_id: i64,
    pub document_id: i64,
}

#[derive(Debug, PartialEq, Eq)]
pub enum Outcome {
    Applied,
    Duplicate,
    KeyConflict,
}

pub async fn open_store(path: &Path) -> Result<SqlitePool, sqlx::Error> {
    let opts = SqliteConnectOptions::new()
        .filename(path)
        .create_if_missing(true);
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(opts)
        .await?;
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS receipts (
        event_id INTEGER PRIMARY KEY, document_id INTEGER NOT NULL
    )",
    )
    .execute(&pool)
    .await?;
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS totals (
        document_id INTEGER PRIMARY KEY, processed INTEGER NOT NULL
    )",
    )
    .execute(&pool)
    .await?;
    Ok(pool)
}

pub async fn apply(pool: &SqlitePool, job: Job) -> Result<Outcome, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let inserted = sqlx::query(
        "INSERT INTO receipts(event_id, document_id) VALUES (?, ?)
         ON CONFLICT(event_id) DO NOTHING",
    )
    .bind(job.event_id)
    .bind(job.document_id)
    .execute(&mut *tx)
    .await?;

    if inserted.rows_affected() == 0 {
        let original: i64 =
            sqlx::query_scalar("SELECT document_id FROM receipts WHERE event_id = ?")
                .bind(job.event_id)
                .fetch_one(&mut *tx)
                .await?;
        tx.rollback().await?;
        return Ok(if original == job.document_id {
            Outcome::Duplicate
        } else {
            Outcome::KeyConflict
        });
    }

    sqlx::query(
        "INSERT INTO totals(document_id, processed) VALUES (?, 1)
         ON CONFLICT(document_id) DO UPDATE SET processed = processed + 1",
    )
    .bind(job.document_id)
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    Ok(Outcome::Applied)
}
```

Se l'aggiornamento del totale fallisce, non viene confermata neppure la ricevuta: un tentativo successivo può ancora eseguire il lavoro. Se invece il commit riesce ma il worker perde l'ack, la riconsegna ottiene `Duplicate`. Una chiave già associata a un **altro** documento produce `KeyConflict`: va segnalata, non trattata come completamento. La garanzia vale per questi effetti nello **stesso database** e finché si conservano le ricevute.

### 2. Limitare il lavoro e attendere anche gli ultimi task

Il worker prende dal canale solo se ha un posto libero nel `JoinSet`. I task terminati vengono raccolti anche quando non arrivano altri job. Dopo la chiusura dell'ultimo sender vengono consumati i messaggi già accodati e si attendono i task rimasti; il report non è uno stato persistente.

```rust
#[derive(Default, Debug)]
pub struct Report {
    pub applied: usize,
    pub duplicates: usize,
    pub rejected: usize,
    pub failed: usize,
    pub join_errors: usize,
}

pub async fn drain<F, Fut>(mut rx: mpsc::Receiver<Job>, limit: NonZeroUsize, run: F) -> Report
where
    F: Fn(Job) -> Fut,
    Fut: Future<Output = Result<Outcome, sqlx::Error>> + Send + 'static,
{
    let mut tasks = JoinSet::new();
    let mut accepting = true;
    let mut report = Report::default();
    while accepting || !tasks.is_empty() {
        tokio::select! {
            job = rx.recv(), if accepting && tasks.len() < limit.get() => match job {
                Some(job) => {
                    let work = run(job);
                    tasks.spawn(async move { (job.event_id, work.await) });
                }
                None => accepting = false,
            },
            Some(result) = tasks.join_next(), if !tasks.is_empty() => match result {
                Ok((_, Ok(Outcome::Applied))) => report.applied += 1,
                Ok((_, Ok(Outcome::Duplicate))) => report.duplicates += 1,
                Ok((id, Ok(Outcome::KeyConflict))) => {
                    report.rejected += 1;
                    eprintln!("job {id}: chiave riutilizzata per dati diversi");
                }
                Ok((id, Err(_))) => {
                    report.failed += 1;
                    eprintln!("job {id}: errore del database");
                }
                Err(err) => {
                    report.join_errors += 1;
                    eprintln!("task {} non concluso normalmente", err.id());
                }
            },
        }
    }
    report
}
```

Sono due livelli di errore: l'operazione può restituire un errore SQL, oppure il task può non restituire alcun esito, per esempio per un panic. Il demo **osserva** entrambi ma non li rimette automaticamente in coda. Il database usa una sola connessione per rendere la prova semplice: aumentare il limite dei task non aumenta i posti nel [[Programmazione/Rust/Pagine/Connection pooling|pool]].

### 3. Ripetere la consegna dopo la riapertura

Il test invia un job, chiude il sender, attende il report e chiude il database. Poi riapre il file e ripresenta lo stesso evento, come farebbe un broker che non ha ricevuto conferma. La verifica importante è il **totale riletto**, non soltanto il valore restituito dal worker.

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn riconsegna_dopo_commit() -> Result<(), Box<dyn std::error::Error>> {
        let dir = tempfile::tempdir()?;
        let path = dir.path().join("jobs.sqlite");
        let db = open_store(&path).await?;
        let job = Job {
            event_id: 41,
            document_id: 7,
        };
        let (tx, rx) = mpsc::channel(8);
        let worker_db = db.clone();
        let worker = tokio::spawn(drain(rx, NonZeroUsize::new(2).unwrap(), move |job| {
            let db = worker_db.clone();
            async move { apply(&db, job).await }
        }));
        tx.send(job).await?;
        drop(tx);
        assert_eq!(worker.await?.applied, 1);
        db.close().await;

        let db = open_store(&path).await?;
        assert_eq!(apply(&db, job).await?, Outcome::Duplicate);
        let total: i64 = sqlx::query_scalar("SELECT processed FROM totals WHERE document_id = ?")
            .bind(job.document_id)
            .fetch_one(&db)
            .await?;
        assert_eq!(total, 1);
        db.close().await;
        Ok(())
    }
}
```

```sh
cargo test --lib
```

## Dal demo a un servizio

| Situazione | Decisione operativa |
| --- | --- |
| Coda piena | Decidi se aspettare entro una scadenza o rifiutare esplicitamente il nuovo lavoro. Non creare task illimitati che aspettano un posto. Per i casi `Full` e `Closed` vedi [[Programmazione/Rust/Pagine/Channel async\|Channel async]]. |
| Errore temporaneo o permanente | Mantieni la stessa chiave. Per un errore temporaneo applica backoff con un tetto e jitter; dopo un numero massimo di tentativi manda il job in una coda dei fallimenti (*dead letter*) con causa e tentativo. Un payload invalido o un conflitto di chiave non diventa valido riprovando. |
| Effetto fuori dal database | Il commit locale non copre un'email o una chiamata HTTP. Se il provider supporta una chiave di idempotenza, riusala; altrimenti prevedi riconciliazione o possibili duplicati. Non tenere una transazione aperta mentre aspetti la rete o il backoff. |
| Scrittura applicativa e pubblicazione di un evento | Con una *transactional outbox* scrivi modifica di dominio ed evento da pubblicare **nella stessa transazione**. Un dispatcher invia poi l'evento e lo segna come pubblicato: può inviarlo due volte se cade tra i due passi. L'outbox non sostituisce la deduplicazione del consumer. |
| Deploy, riavvio o lavoro periodico | Ferma l'ammissione, drena entro una scadenza e attendi i worker. Se il tempo scade, un job durevole non completato deve poter essere riconsegnato; uno in RAM può andare perso. Per uno scheduler con più repliche usa una chiave per l'occorrenza prevista, non una nuova per ogni replica. |
| Diagnosi | Misura età del job più vecchio, profondità della coda, job attivi, durata e tentativi. Nei log correla ID dell'operazione e numero del tentativo: senza questa distinzione una riconsegna può sembrare un nuovo job. |

## Fonti ufficiali

- [Tokio: canali mpsc, capacità e chiusura](https://docs.rs/tokio/1/tokio/sync/mpsc/index.html)
- [Tokio: JoinSet e raccolta dei task](https://docs.rs/tokio/1/tokio/task/struct.JoinSet.html)
- [RabbitMQ: differenza fra publisher confirms e acknowledgement dei consumer](https://www.rabbitmq.com/docs/confirms)
- [SQLite: UPSERT e vincoli di unicità](https://www.sqlite.org/lang_upsert.html)
- [AWS Prescriptive Guidance: transactional outbox e messaggi duplicati](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async Tokio e async-std]]
- [[Programmazione/Rust/Pagine/Channel async|Channel async]]
- [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]]
- [[Programmazione/Rust/Pagine/Connection pooling|Connection pooling]]
- [[Programmazione/Rust/Pagine/Tracing con tracing|Tracing con tracing]]
- [[Programmazione/Rust/Pagine/Error reporting|Error reporting]]
