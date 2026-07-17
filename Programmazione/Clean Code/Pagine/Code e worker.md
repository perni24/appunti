---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [clean-code, code, worker, asincronia]
aliases: [Code e worker, Queues and workers]
prerequisites: [Idempotenza, Side effects controllati]
related: [Async code leggibile, Logging e tracing, Errori recuperabili e non recuperabili]
---

# Code e worker

## Sintesi

Le **code** e i **worker** permettono di spostare lavoro fuori dal flusso sincrono principale.

Sono utili per job lenti, retry, integrazioni esterne, elaborazioni batch e attivita che non devono bloccare l'utente.

## Quando usarlo

- Quando un'operazione e lenta o variabile.
- Quando serve retry controllato.
- Quando vuoi assorbire picchi di carico.
- Quando un servizio esterno puo fallire temporaneamente.
- Quando il lavoro puo essere eseguito in background.

## Come funziona

Il produttore pubblica un messaggio in coda. Uno o piu worker lo leggono, eseguono il lavoro e confermano l'elaborazione.

Il design pulito deve chiarire:

- formato del messaggio;
- idempotenza del job;
- gestione retry;
- dead letter queue;
- logging e tracing;
- timeout e limiti.

## API / Sintassi

```text
producer -> queue -> worker -> ack / retry / dead letter
```

Ogni passaggio deve avere responsabilita chiara.

## Esempio pratico

```js
async function handleSendReceiptJob(job, emailService) {
  const { orderId, email, idempotencyKey } = job;

  await emailService.sendReceipt(email, orderId, { idempotencyKey });
}
```

Il job contiene dati essenziali e una chiave utile a evitare duplicazioni.

## Varianti

- Queue semplice: un messaggio viene elaborato da un worker.
- Pub/sub: piu consumer ricevono eventi.
- Scheduled jobs: lavoro pianificato.
- Dead letter queue: messaggi falliti isolati.
- Worker pool: piu worker elaborano in parallelo.

## Errori comuni

- Creare job non idempotenti.
- Non distinguere errori temporanei e permanenti.
- Perdere contesto di tracing.
- Mettere troppa logica nel consumer senza test.
- Non monitorare backlog e fallimenti.

## Checklist

- Il messaggio contiene dati sufficienti e stabili?
- Il worker e idempotente?
- Esiste una strategia di retry?
- Gli errori permanenti finiscono in una dead letter queue?
- Log e tracing permettono di seguire il job?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Idempotenza]]
- [[Side effects controllati]]
- [[Async code leggibile]]
- [[Logging e tracing]]
- [[Errori recuperabili e non recuperabili]]

## Fonti

- Martin Kleppmann, *Designing Data-Intensive Applications*
- Michael Nygard, *Release It!*
- Enterprise Integration Patterns, *Message Queue*
