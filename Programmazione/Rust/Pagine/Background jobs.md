---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags:
  - programmazione
  - rust
  - backend-networking-e-database
aliases:
  - "Background jobs"
  - "Job in background"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]"
  - "[[Programmazione/Rust/Pagine/Channel async]]"
  - "[[Programmazione/Rust/Pagine/Graceful shutdown]]"
related:
  - "[[Programmazione/Rust/Pagine/Connection pooling]]"
  - "[[Programmazione/Rust/Pagine/Tracing con tracing]]"
  - "[[Programmazione/Rust/Pagine/Error reporting]]"
---

# Background jobs

## Sintesi

I **background jobs** sono lavori eseguiti fuori dal percorso immediato di una richiesta o comando: invio email, elaborazione file, sincronizzazioni, retry, generazione report, pulizia periodica o consumer di code.

In Rust async, i job possono essere task Tokio, worker separati, consumer di code esterne o processi dedicati. Il punto critico e progettare affidabilita: retry, idempotenza, shutdown, osservabilita e persistenza.

## Quando usarlo

Usa background jobs quando:

- un'operazione e lenta e non deve bloccare la risposta HTTP;
- un lavoro puo essere ritentato;
- devi processare eventi o messaggi;
- devi eseguire attivita periodiche;
- vuoi separare path interattivo e path batch;
- devi limitare concorrenza o carico su risorse esterne.

Non spostare in background un'operazione solo per nascondere lentezza: se il risultato e necessario all'utente, serve comunque una strategia di stato, polling o notifica.

## Come funziona

Esistono due famiglie principali:

- **in-process jobs**: task nello stesso processo dell'applicazione;
- **out-of-process jobs**: worker separati con coda o database condiviso.

Gli in-process job sono semplici ma meno affidabili: se il processo muore, il lavoro in memoria sparisce. I worker separati con coda persistente sono piu robusti, ma richiedono infrastruttura.

Aspetti essenziali:

- **idempotenza**: ripetere il job non deve corrompere dati;
- **retry con backoff**: evitare loop aggressivi;
- **dead letter**: isolare messaggi falliti;
- **concorrenza limitata**: non saturare DB o API esterne;
- **shutdown ordinato**: completare o rilasciare lavori in modo prevedibile;
- **tracing**: correlare job, tentativi ed errori.

## API / Sintassi

Task in-process con Tokio:

```rust
use tokio::sync::mpsc;

#[derive(Debug)]
enum Job {
    SendEmail { user_id: i64 },
}

async fn worker(mut rx: mpsc::Receiver<Job>) {
    while let Some(job) = rx.recv().await {
        match job {
            Job::SendEmail { user_id } => {
                tracing::info!(user_id, "sending email");
            }
        }
    }
}
```

Avvio:

```rust
let (tx, rx) = tokio::sync::mpsc::channel(100);
tokio::spawn(worker(rx));

tx.send(Job::SendEmail { user_id: 42 }).await?;
# Ok::<(), Box<dyn std::error::Error>>(())
```

Questo schema e utile per lavori effimeri. Per lavori critici serve persistenza.

## Esempio pratico

Worker con limite di concorrenza:

```rust
use std::sync::Arc;

use tokio::sync::{mpsc, Semaphore};

#[derive(Debug)]
struct Job {
    id: i64,
}

async fn run_workers(mut rx: mpsc::Receiver<Job>) {
    let limit = Arc::new(Semaphore::new(4));

    while let Some(job) = rx.recv().await {
        let permit = limit.clone().acquire_owned().await.expect("semaphore closed");

        tokio::spawn(async move {
            let _permit = permit;
            tracing::info!(job_id = job.id, "processing job");
            // Esegui lavoro qui.
        });
    }
}
```

Il semaforo evita di avviare troppi job contemporaneamente. In codice reale devi gestire errori, retry e shutdown.

## Varianti

- **Task Tokio in-process**: semplice, adatto a lavori non critici.
- **Worker separato**: processo dedicato per code persistenti.
- **Job periodici**: scheduler interno o servizio esterno.
- **Outbox pattern**: registra eventi nel database prima della pubblicazione.
- **Queue consumer**: legge da broker o coda.
- **Batch processor**: elabora grandi quantita di dati con concorrenza limitata.

## Errori comuni

- Usare solo `tokio::spawn` per lavori che non devono andare persi.
- Non rendere i job idempotenti.
- Fare retry immediati e infiniti.
- Non registrare tentativi e cause di fallimento.
- Tenere connessioni DB durante attese esterne lunghe.
- Spegnere il processo senza graceful shutdown.
- Non limitare concorrenza e saturare risorse esterne.

## Checklist

- Il job puo essere perso o deve essere persistente?
- Il job e idempotente?
- Esistono retry, backoff e limite tentativi?
- I fallimenti permanenti sono tracciati?
- La concorrenza e limitata?
- Lo shutdown e gestito?
- Il job ha tracing e metriche sufficienti?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]
- [[Programmazione/Rust/Pagine/Channel async]]
- [[Programmazione/Rust/Pagine/Graceful shutdown]]
- [[Programmazione/Rust/Pagine/Connection pooling]]
- [[Programmazione/Rust/Pagine/Tracing con tracing]]
- [[Programmazione/Rust/Pagine/Error reporting]]
