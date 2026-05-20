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
  - architettura
  - eventi
aliases: []
prerequisites: []
related: []
---

# Pattern outbox

## Sintesi

Il **pattern outbox** salva eventi applicativi in una tabella nello stesso commit dei dati di business, poi un worker li pubblica verso sistemi esterni.

## Problema risolto

Evita inconsistenza tra database e message broker quando una scrittura DB riesce ma la pubblicazione evento fallisce, o viceversa.

## Schema tipico

```sql
CREATE TABLE outbox_events (
  id bigserial PRIMARY KEY,
  topic text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
```

## Aspetti importanti

- Idempotenza lato consumer.
- Retry.
- Ordinamento quando necessario.
- Cleanup degli eventi processati.

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
- [[Programmazione/Postgres/Pagine/Code e job table|Code e job table]]
- [[Programmazione/Postgres/Pagine/Logical decoding|Logical decoding]]
- [[Programmazione/Postgres/Pagine/Proprietà ACID|Proprietà ACID]]


