---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - clean-code
  - async
  - leggibilita
aliases:
  - Async code leggibile
  - Codice asincrono leggibile
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Code e worker]]"
  - "[[Programmazione/Clean Code/Pagine/Gestione esplicita degli errori]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Logging e tracing]]"
  - "[[Programmazione/Clean Code/Pagine/Side effects controllati]]"
  - "[[Programmazione/Clean Code/Pagine/Race condition e leggibilita]]"
title: Async code leggibile
---

# Async code leggibile

## Sintesi

Prima di scrivere `await`, disegna le dipendenze: ciò che richiede un risultato deve aspettare; ciò che è indipendente può partire insieme. **`Promise.all` coordina promesse, non crea thread e non annulla le altre operazioni quando una fallisce.** Decidi esplicitamente se un risultato parziale ha valore.

## Esempio: caricare un riepilogo completo

Le preferenze si leggono con l'ID richiesto; gli ordini, invece, richiedono l'ID canonico restituito dal profilo. Se manca uno dei tre dati il riepilogo è inutilizzabile. I tre metodi di `api` sono funzioni `async` che accettano un `AbortSignal` e devono rispettarlo per interrompere l'I/O. Esempio per Node 24.

```js
async function loadDashboard(id, api, callerSignal) {
  const stop = new AbortController();
  const signal = callerSignal ? AbortSignal.any([callerSignal, stop.signal]) : stop.signal;
  signal.throwIfAborted();

  async function loadAccount() {
    const user = await api.user(id, signal);
    signal.throwIfAborted();
    const orders = await api.orders(user.id, signal);
    return { user, orders };
  }

  try {
    const [account, settings] = await Promise.all([loadAccount(), api.settings(id, signal)]);
    signal.throwIfAborted();
    return { ...account, settings };
  } catch (error) {
    stop.abort(error);
    throw error;
  }
}
```

Profilo e preferenze partono senza attendersi. Gli ordini non partono fino all'arrivo del profilo. Se le preferenze falliscono, il chiamante riceve l'errore e l'altro ramo riceve un segnale. Se un caricatore ignora quel segnale, può restare attivo: `abort` **non** termina forzatamente una promessa. Il controllo dopo il profilo evita almeno di avviare gli ordini quando l'operazione è già stata annullata.

## Come scegliere

| Requisito | Forma utile |
| --- | --- |
| B dipende dall'esito di A | Attendi A, poi avvia B |
| Servono tutti i risultati indipendenti | Avvia le operazioni e attendi `Promise.all`; definisci la politica di annullamento |
| Ogni risultato ha valore anche se altri falliscono | `Promise.allSettled` e gestione esplicita di ciascun esito |
| Migliaia di elementi indipendenti | Limita le operazioni in volo; costruire tutte le promesse subito non impone un limite |

## Verifica

Con promesse controllate osserva quali metodi sono già partiti, non quanti millisecondi impiegano. Prova un segnale già annullato, un rifiuto mentre l'altro ramo attende e l'ordine dei dati restituiti. Al confine con un servizio esterno stabilisci anche una scadenza: una semplice gara con un timer limita l'attesa del chiamante, non ferma da sola il lavoro sottostante.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Code e worker|Code e worker]]
- [[Programmazione/Clean Code/Pagine/Gestione esplicita degli errori|Gestione esplicita degli errori]]
- [[Programmazione/Clean Code/Pagine/Race condition e leggibilita|Race condition e leggibilita]]
- [[Programmazione/Clean Code/Pagine/Side effects controllati|Side effects controllati]]
- [[Programmazione/Clean Code/Pagine/Logging e tracing|Logging e tracing]]

## Fonti

- Martin Kleppmann, *Designing Data-Intensive Applications*
- Michael Nygard, *Release It!*
- Brian Goetz, *Java Concurrency in Practice*
- [ECMAScript: Promise.all e Promise.allSettled](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise.all)
- [Node.js: AbortController e AbortSignal](https://nodejs.org/api/globals.html#class-abortsignal)
