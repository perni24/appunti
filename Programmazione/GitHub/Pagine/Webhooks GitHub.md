---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - github
  - webhooks
  - automazione
  - integrazioni
aliases:
  - Webhooks GitHub
  - GitHub webhooks
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub]]"
  - "[[Programmazione/GitHub/Pagine/GitHub REST API]]"
related:
  - "[[Programmazione/GitHub/Pagine/GitHub Apps]]"
  - "[[Programmazione/GitHub/Pagine/Automazioni issue e pull request]]"
  - "[[Programmazione/GitHub/Pagine/GitHub REST API]]"
title: Webhooks GitHub
---

# Webhooks GitHub

## Sintesi

Un webhook avvisa il tuo servizio che qualcosa è accaduto; **non** gli concede il diritto di modificare GitHub. Per esempio, ricevere `issues.opened` e aggiungere l’etichetta `triage` sono due operazioni: la prima arriva con una consegna HTTP, la seconda richiede una credenziale API autorizzata.

## Ricevere una consegna senza perderla

1. Configura un endpoint HTTPS, un secret dedicato e soltanto gli eventi necessari, per il repository, l’organizzazione o l’App. Conserva i byte **originali** del corpo prima di decodificare il JSON.
2. Verifica `X-Hub-Signature-256`, poi leggi `X-GitHub-Event` e `action`. Ad esempio, il tipo `issues` contiene sia `opened` sia `closed`: iscriversi al tipo non seleziona l’azione.
3. Registra `X-GitHub-Delivery` e il lavoro da svolgere in modo durevole, idealmente nella stessa transazione. Un vincolo univoco sull’ID evita il doppio inserimento. Segnare «ricevuto» e poi perdere il lavoro prima di accodarlo non basta.
4. Rispondi con `2xx` entro dieci secondi per una consegna accettata. Il worker fa le chiamate lente e registra l’esito. Se l’accodamento fallisce non confermare un successo inesistente.

## Esempio: verifica della firma in Node.js

Funzione per un modulo ESM. `body` deve essere un `Buffer`, `secret` il segreto configurato e `header` il valore di `X-Hub-Signature-256`. Non è un server completo. La firma copre il corpo, non tutti gli header: autenticarla non sostituisce i controlli su repository, installazione e tipo di evento.

```js
import { createHmac, timingSafeEqual } from 'node:crypto';

export function firmaValida(body, secret, header) {
  if (!Buffer.isBuffer(body) || typeof secret !== 'string' || !secret) return false;
  if (typeof header !== 'string' || !/^sha256=[0-9a-f]{64}$/.test(header)) return false;
  const attesa = createHmac('sha256', secret).update(body).digest();
  const ricevuta = Buffer.from(header.slice(7), 'hex');
  return ricevuta.length === attesa.length && timingSafeEqual(ricevuta, attesa);
}
```

Non passare `JSON.stringify(payload)` dopo il parsing: spazi e codifica fanno parte dei byte firmati. Una firma valida prova che il corpo corrisponde al secret, non che l’evento sia nuovo o che il lavoro sia già terminato. Non stampare secret o corpi sensibili nei log.

## Consegna fallita o duplicata?

GitHub **non ritenta automaticamente** le consegne fallite. Consulta le consegne recenti e richiedi una *redelivery* quando il servizio è tornato disponibile. Una redelivery mantiene il medesimo `X-GitHub-Delivery`: se il lavoro è già stato accettato, confermalo senza accodarlo di nuovo. Se è fallito il worker **dopo** il `2xx`, invece, gestisci il retry dalla tua coda. Limita dimensione e volume delle richieste e monitora separatamente errori di ricezione ed errori di elaborazione.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub REST API|GitHub REST API]]
- [[Programmazione/GitHub/Pagine/GitHub Apps|GitHub Apps]]
- [[Programmazione/GitHub/Pagine/Automazioni issue e pull request|Automazioni issue e pull request]]
- [[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub|Sicurezza dei token GitHub]]

## Fonti

- [GitHub Docs - Validazione della firma e vettore di test](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)
- [GitHub Docs - Buone pratiche di ricezione](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks)
- [GitHub Docs - Gestire le consegne fallite](https://docs.github.com/en/webhooks/using-webhooks/handling-failed-webhook-deliveries)
