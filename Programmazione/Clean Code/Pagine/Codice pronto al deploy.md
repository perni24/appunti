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
  - deploy
  - produzione
aliases:
  - Codice pronto al deploy
  - Deploy-ready code
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Configurazione applicativa]]"
  - "[[Programmazione/Clean Code/Pagine/Logging e tracing]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Messaggi di errore utili]]"
  - "[[Programmazione/Clean Code/Pagine/Test di integrazione]]"
  - "[[Programmazione/Clean Code/Pagine/Gestione esplicita degli errori]]"
title: Codice pronto al deploy
---

# Codice pronto al deploy

## Sintesi

«Il processo è partito», «può ricevere richieste» e «questa versione funziona per gli utenti» sono tre affermazioni diverse. Una build verde è necessaria ma non basta: servono segnali distinti per instradare il traffico, osservare il rilascio e fermarlo se peggiora il servizio.

## Esempio: vivo non significa pronto

Questa parte di un servizio HTTP decide gli stati delle sonde. La configurazione viene validata all'avvio come in [[Programmazione/Clean Code/Pagine/Configurazione applicativa|Configurazione applicativa]]. Il monitor della dipendenza obbligatoria chiama `setDependencyAvailable` dopo un controllo recente, con timeout; il gestore della sonda non apre una nuova connessione ad ogni richiesta.

```js
function serviceHealth() {
  let initialized = false;
  let dependencyAvailable = false;
  let draining = false;

  function canAcceptWork() {
    return initialized && dependencyAvailable && !draining;
  }

  return {
    initialized() { initialized = true; },
    setDependencyAvailable(available) { dependencyAvailable = available === true; },
    beginDrain() { draining = true; },
    canAcceptWork,
    probeStatus(path) {
      if (path === "/live") return 200;
      if (path === "/ready") return canAcceptWork() ? 200 : 503;
      return 404;
    },
  };
}
```

Se il database diventa indisponibile, `/ready` passa a 503 ma `/live` resta a 200 **se il processo riesce a rispondere**: riavviare tutte le repliche non ripara un database esterno. Quando inizia lo spegnimento, la readiness non deve tornare positiva per un controllo tardivo riuscito. Rifiuta nuovo lavoro anche all'ingresso del servizio e lascia terminare quello in corso entro un limite: il bilanciatore può impiegare tempo ad aggiornarsi. Se il monitor si blocca, il chiamante deve far scadere un esito positivo troppo vecchio; il frammento non implementa questo timer.

## Checklist di rilascio

| Fase | Controllo operativo | Se non passa |
| --- | --- | --- |
| Avvio | Configurazione e segreti presenti; dipendenze obbligatorie e schema utilizzabili | Non dichiarare readiness. Per un avvio lento distingui startup probe e liveness |
| Distribuzione graduale | Confronta canary e versione stabile per errori, latenza e volume omogeneo; per un worker anche backlog e riconsegne | Ferma la promozione; senza campioni sufficienti non dichiarare il canary sano |
| Migrazione | Vecchia e nuova versione leggono lo schema durante la convivenza | Prima **aggiungi** il nuovo formato, migra i dati e i lettori, poi rimuovi il vecchio |
| Arresto | Togli readiness, interrompi l'acquisizione di nuovi job, attendi quelli in corso, chiudi le risorse | Allo scadere del limite applica la politica documentata di riconsegna e deduplicazione |

Per un worker controlla coda, permessi, limite dei retry e destinazione degli scarti. Registra versione e identificativo del job senza segreti, e indica nel runbook chi decide di sospendere il rollout. Un feature flag può disattivare una funzione, ma né il flag né il rollback del binario annullano un'email già inviata o ricreano una colonna eliminata.

## Verifica

Prova in ordine avvio incompleto, readiness positiva, perdita e recupero della dipendenza, poi drain e risposta tardiva del monitor. Questi passaggi verificano la **decisione del codice**. Instradamento reale, segnali del sistema operativo, migrazione e rollback richiedono prove nell'ambiente di rilascio.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Configurazione applicativa|Configurazione applicativa]]
- [[Programmazione/Clean Code/Pagine/Logging e tracing|Logging e tracing]]
- [[Programmazione/Clean Code/Pagine/Messaggi di errore utili|Messaggi di errore utili]]
- [[Programmazione/Clean Code/Pagine/Test di integrazione|Test di integrazione]]
- [[Programmazione/Clean Code/Pagine/Idempotenza|Idempotenza]]

## Fonti

- Michael Nygard, *Release It!*
- The Twelve-Factor App
- Martin Fowler, *FeatureToggle*
- [Kubernetes: startup, liveness e readiness probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/)
- [Google SRE Workbook: valutare un canary prima della promozione](https://sre.google/workbook/canarying-releases/)
