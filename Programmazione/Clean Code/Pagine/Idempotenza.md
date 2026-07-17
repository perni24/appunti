---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [clean-code, idempotenza, resilienza]
aliases: [Idempotenza, Idempotency]
prerequisites: [Gestione esplicita degli errori, Side effects controllati]
related: [Race condition e leggibilita, Code e worker, Operazioni atomiche]
---

# Idempotenza

## Sintesi

Un'operazione e **idempotente** quando eseguirla una o piu volte produce lo stesso risultato finale.

Nel Clean Code e fondamentale in sistemi con retry, messaggi duplicati, API, code e operazioni distribuite.

## Problema che risolve

In un sistema reale non sempre sai se un'operazione e fallita prima o dopo aver prodotto un effetto.

Esempi:

- richiesta HTTP ritentata dal client;
- worker che riprende dopo crash;
- messaggio consegnato due volte;
- timeout dopo scrittura riuscita;
- job schedulato rilanciato manualmente.

Senza idempotenza, ogni retry puo duplicare effetti.

## Concetto chiave

L'idempotenza sposta la domanda da:

```text
questa operazione e gia partita?
```

a:

```text
questo effetto finale e gia stato applicato?
```

Spesso serve una chiave idempotente, un vincolo unico o uno stato persistente che registri l'operazione.

## Dettagli importanti

- `set status = paid` e piu idempotente di `increment paid_count`.
- Le API possono accettare un `Idempotency-Key`.
- I worker dovrebbero tollerare messaggi duplicati.
- L'idempotenza richiede storage o vincoli quando produce effetti persistenti.
- Non tutte le operazioni sono naturalmente idempotenti.

## Esempio

Fragile:

```js
async function chargeOrder(order) {
  await paymentProvider.charge(order.card, order.total);
  await repository.markPaid(order.id);
}
```

Se il processo cade dopo il pagamento ma prima di `markPaid`, un retry puo addebitare due volte.

Piu sicuro:

```js
async function chargeOrder(order, idempotencyKey) {
  return paymentProvider.charge(order.card, order.total, { idempotencyKey });
}
```

La chiave permette al provider di riconoscere tentativi duplicati.

## Limiti

- Idempotenza non significa assenza di side effects.
- Alcune operazioni richiedono compensazioni invece di idempotenza pura.
- Le chiavi idempotenti devono avere durata e scope chiari.
- Sistemi esterni potrebbero non supportarla.

## Errori comuni

- Fare retry su pagamenti, email o creazioni senza chiave.
- Confondere idempotenza con atomicita.
- Usare chiavi non univoche.
- Non proteggere la scrittura dello stato idempotente.
- Ignorare concorrenza tra due richieste con la stessa chiave.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Gestione esplicita degli errori]]
- [[Side effects controllati]]
- [[Race condition e leggibilita]]
- [[Code e worker]]
- [[Operazioni atomiche]]

## Fonti

- Martin Kleppmann, *Designing Data-Intensive Applications*
- Michael Nygard, *Release It!*
- Stripe Documentation, *Idempotent requests*
