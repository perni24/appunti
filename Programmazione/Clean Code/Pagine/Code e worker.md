---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - clean-code
  - code
  - worker
  - asincronia
aliases:
  - Code e worker
  - Queues and workers
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Idempotenza]]"
  - "[[Programmazione/Clean Code/Pagine/Side effects controllati]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Async code leggibile]]"
  - "[[Programmazione/Clean Code/Pagine/Logging e tracing]]"
  - "[[Programmazione/Clean Code/Pagine/Errori recuperabili e non recuperabili]]"
title: Code e worker
---

# Code e worker

## Sintesi

Una coda separa il momento in cui un produttore chiede un lavoro da quello in cui un worker lo esegue. Con consegna *almeno una volta*, un messaggio già elaborato può tornare. **L'ack conferma la consegna al broker, non dimostra da solo che l'effetto applicativo sia avvenuto una sola volta.**

## Esempio: registrare una ricevuta prima dell'ack

Il messaggio contiene versione, tenant, chiave stabile e ordine. `save` usa il contratto di [[Programmazione/Clean Code/Pagine/Idempotenza|Idempotenza]] e termina solo quando la ricevuta è registrata. `delivery` è un adattatore applicativo: `ack()` conferma la consegna; `deadLetter(reason)` deve gestirla definitivamente secondo la configurazione del broker. **Non** sono firme di un client RabbitMQ.

```js
async function consumeReceipt(delivery, save) {
  const job = delivery.body;
  const valid = job?.version === 1 &&
    [job.tenant, job.key, job.orderId].every(v => typeof v === "string" && v.trim() !== "");
  if (!valid) return delivery.deadLetter("invalid_job");

  const result = await save({ tenant: job.tenant, key: job.key, orderId: job.orderId });
  if (result.kind === "key_conflict") return delivery.deadLetter("key_conflict");
  if (result.kind !== "created" && result.kind !== "replayed") {
    throw new Error("Esito del registro sconosciuto");
  }
  return delivery.ack();
}
```

## Cosa succede se si ferma il worker?

| Momento | Stato possibile | Decisione |
| --- | --- | --- |
| Prima della registrazione | Ricevuta assente e messaggio non confermato | Ritentare la consegna |
| Dopo la registrazione ma prima che l'ack raggiunga il broker | Ricevuta presente, possibile riconsegna | Stessa chiave, nessuna seconda ricevuta, nuovo ack |
| Messaggio malformato o chiave incompatibile | Ripetere lo stesso input non lo corregge | Isolare il messaggio; non confermarlo due volte |

## Limiti operativi

Il chiamante deve gestire il rifiuto di `consumeReceipt`. Un errore transitorio richiede retry limitati con attese crescenti; un errore ignoto va reso visibile. Non lasciare il messaggio sospeso indefinitamente e non rimandarlo immediatamente in coda senza un limite. Se il trasferimento alla coda degli scarti può fallire, non confermare prima l'originale rischiando di perderlo.

Limita i messaggi in volo alla capacità del destinatario. Più worker aumentano la concorrenza, non garantiscono ordine globale. Per capire se la coda sta assorbendo un picco o sta accumulando ritardo, osserva l'età del messaggio più vecchio, le riconsegne e gli scarti, non soltanto quante elaborazioni terminano.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Idempotenza|Idempotenza]]
- [[Programmazione/Clean Code/Pagine/Side effects controllati|Side effects controllati]]
- [[Programmazione/Clean Code/Pagine/Async code leggibile|Async code leggibile]]
- [[Programmazione/Clean Code/Pagine/Logging e tracing|Logging e tracing]]
- [[Programmazione/Clean Code/Pagine/Errori recuperabili e non recuperabili|Errori recuperabili e non recuperabili]]

## Fonti

- Martin Kleppmann, *Designing Data-Intensive Applications*
- Michael Nygard, *Release It!*
- Enterprise Integration Patterns, *Message Queue*
- [RabbitMQ: consumer acknowledgements, riconsegna e publisher confirms](https://www.rabbitmq.com/docs/confirms)
