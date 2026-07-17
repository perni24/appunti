---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [clean-code, deploy, produzione]
aliases: [Codice pronto al deploy, Deploy-ready code]
prerequisites: [Configurazione applicativa, Logging e tracing]
related: [Messaggi di errore utili, Test di integrazione, Gestione esplicita degli errori]
---

# Codice pronto al deploy

## Sintesi

Il **codice pronto al deploy** non e solo codice che compila o passa i test. E codice che puo essere eseguito in un ambiente reale con configurazione, osservabilita, gestione errori e rollback ragionevoli.

Nel Clean Code la prontezza al deploy fa parte della qualita del codice.

## Quando usarlo

- Prima di rilasciare una feature.
- Quando aggiungi integrazioni esterne.
- Quando cambi configurazione, migrazioni o job.
- Quando un componente deve girare in produzione.
- Quando il comportamento dipende da ambiente o dati reali.

## Come funziona

Un codice deploy-ready rende espliciti:

- configurazione richiesta;
- dipendenze esterne;
- migrazioni;
- log e metriche;
- gestione errori;
- timeout e retry;
- compatibilita;
- piano di rollback.

## API / Sintassi

```text
code + config + migrations + observability + rollback path = deploy-ready
```

Se manca una di queste parti, il rischio operativo aumenta.

## Esempio pratico

Prima di rilasciare un nuovo worker:

```text
1. configurazione validata all'avvio
2. coda e permessi creati
3. job idempotente
4. log con jobId e correlationId
5. retry e dead letter queue definiti
6. metriche su successo, errore e backlog
```

Il codice non e valutato solo localmente, ma nel suo contesto operativo.

## Varianti

- Feature flag per rilascio graduale.
- Migrazioni backward-compatible.
- Canary release.
- Rollback applicativo.
- Runbook operativo.

## Errori comuni

- Hardcodare valori di ambiente.
- Non validare configurazione.
- Non avere log utili in caso di errore.
- Rilasciare migrazioni non reversibili senza piano.
- Non considerare retry, idempotenza e timeout.

## Checklist

- La configurazione obbligatoria e validata?
- Log e tracing permettono diagnosi?
- Gli errori sono gestiti e classificati?
- Le migrazioni sono compatibili con il deploy?
- Esiste un percorso di rollback o disattivazione?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Configurazione applicativa|Configurazione applicativa]]
- [[Logging e tracing]]
- [[Messaggi di errore utili]]
- [[Test di integrazione]]
- [[Idempotenza]]

## Fonti

- Michael Nygard, *Release It!*
- The Twelve-Factor App
- Martin Fowler, *FeatureToggle*
