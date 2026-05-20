---
date: 2026-05-20
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - storage
  - performance
aliases: []
prerequisites: []
related: []
---

# Fillfactor

## Sintesi

`fillfactor` controlla quanto spazio PostgreSQL riempie nelle pagine di una tabella o di un indice.

## Concetto chiave

Un fillfactor piu basso lascia spazio libero per aggiornamenti futuri, riducendo page split e favorendo HOT updates in alcune tabelle molto aggiornate.

```sql
ALTER TABLE events SET (fillfactor = 80);
VACUUM FULL events;
```

## Quando considerarlo

- Tabelle con molti `UPDATE`.
- Indici soggetti a molte modifiche.
- Tabelle con bloat elevato.

## Tradeoff

Lasciare spazio libero migliora alcuni aggiornamenti, ma aumenta lo spazio occupato e puo peggiorare scansioni sequenziali.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Come funziona

Da completare: spiegare il meccanismo principale o il comportamento tecnico.

## API / Sintassi

```text
Da completare con API o sintassi principale.
```

## Esempio pratico

```text
Da completare con un esempio pratico.
```

## Varianti

- Da completare: varianti, alternative o differenze rispetto ad approcci simili.

## Errori comuni

Da completare durante revisione.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/Postgres/Pagine/Manutenzione|Manutenzione]]
- [[Programmazione/Postgres/Pagine/File System Layout e Data Directory|File System Layout e Data Directory]]
- [[Programmazione/Postgres/Pagine/Manutenzione|Bloat]]


