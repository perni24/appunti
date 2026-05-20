---
date: 2026-05-20
area: Programmazione
topic: Postgres
type: theory-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - modellazione
  - database
aliases: []
prerequisites: []
related: []
---

# Normalizzazione

## Sintesi

La **normalizzazione** organizza i dati per ridurre duplicazione, anomalie di aggiornamento e incoerenze.

## Concetto chiave

Separare entita diverse in tabelle diverse rende il modello piu coerente. Le relazioni vengono espresse tramite chiavi.

## Forme normali essenziali

- 1NF: valori atomici, niente gruppi ripetuti.
- 2NF: dipendenza dalla chiave completa.
- 3NF: niente dipendenze transitive non necessarie.

## Tradeoff

Un modello normalizzato e pulito, ma query molto complesse possono richiedere join numerose. In alcuni casi si denormalizza consapevolmente per performance o reporting.

## Problema che risolve

Da completare: descrivere il problema concettuale o tecnico che questa nota chiarisce.

## Dettagli importanti

- Da completare: aggiungere dettagli, casi limite e differenze da concetti simili.

## Esempio

```text
Da completare con un esempio minimo.
```

## Limiti

- Da completare: indicare limiti, ambiguita e casi in cui il concetto non basta.

## Errori comuni

Da completare durante revisione.

## Collegamenti
- [[Programmazione/Postgres/Pagine/Chiavi primarie e foreign key|Chiavi primarie e foreign key]]
- [[Programmazione/Postgres/Pagine/Relazioni 1 a 1 1 a N e N a N|Relazioni 1:1, 1:N e N:N]]
- [[Programmazione/Postgres/Pagine/Vincoli|Vincoli]]


