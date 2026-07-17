---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, errori, resilienza]
aliases: [Errori recuperabili e non recuperabili, Recoverable and unrecoverable errors]
prerequisites: [Contratti impliciti ed espliciti]
related: [Messaggi di errore utili, Validazione ai confini, Logging leggibile]
---

# Errori recuperabili e non recuperabili

## Sintesi

Un **errore recuperabile** e un errore da cui il programma puo reagire in modo previsto.

Un **errore non recuperabile** indica una condizione che viola assunzioni fondamentali o rende insicuro continuare.

Distinguere i due casi rende il codice piu chiaro e affidabile.

## Problema che risolve

Trattare tutti gli errori allo stesso modo produce codice confuso:

- eccezioni ingoiate;
- retry su errori permanenti;
- crash per input utente correggibili;
- messaggi inutili;
- log rumorosi;
- flussi di errore non testati.

## Concetto chiave

Un errore recuperabile deve diventare parte del contratto del flusso.

Un errore non recuperabile deve fallire in modo visibile, con contesto sufficiente per diagnosi e senza corrompere stato.

## Esempio

Recuperabile:

```js
if (!isValidEmail(email)) {
  return { ok: false, reason: "invalid_email" };
}
```

Non recuperabile:

```js
if (!paymentProvider) {
  throw new Error("Payment provider is not configured");
}
```

Nel primo caso l'utente puo correggere l'input. Nel secondo manca una dipendenza essenziale.

## Dettagli importanti

- Input utente invalido e spesso recuperabile.
- Configurazione mancante e spesso non recuperabile.
- Timeout e rete possono essere recuperabili con retry o fallback.
- Errori di programmazione non dovrebbero essere nascosti.
- La scelta dipende dal contesto operativo.

## Limiti

- La distinzione non e sempre assoluta.
- Un errore recuperabile in un job batch puo essere bloccante in una transazione sincrona.
- Troppi tipi di errore possono complicare l'API.
- Retry e fallback devono evitare duplicazioni e side effects.

## Errori comuni

- Catturare ogni eccezione e continuare.
- Mostrare stack trace all'utente finale.
- Nascondere errori non recuperabili dietro valori di default.
- Usare messaggi generici senza causa.
- Fare retry senza idempotenza.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Contratti impliciti ed espliciti]]
- [[Validazione ai confini]]
- [[Messaggi di errore utili]]
- [[Logging leggibile]]
- [[Side effects controllati]]

## Fonti

- Robert C. Martin, *Clean Code*
- Michael Nygard, *Release It!*
- Martin Fowler, *Patterns of Enterprise Application Architecture*
