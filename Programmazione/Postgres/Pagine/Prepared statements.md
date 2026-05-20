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
  - sql
  - applicazioni
aliases: []
prerequisites: []
related: []
---

# Prepared statements

## Sintesi

I **prepared statements** separano struttura della query e valori parametrici. Possono migliorare sicurezza e riuso del piano.

## Concetto chiave

Una query parametrizzata evita concatenazione di stringhe e riduce il rischio di SQL injection.

```sql
PREPARE get_user(bigint) AS
SELECT id, email
FROM users
WHERE id = $1;

EXECUTE get_user(42);
```

## In applicazione

Molti driver usano prepared statement o query parametrizzate tramite placeholder.

## Attenzione

I prepared statement possono interagire con piani generici e specifici. Su query molto dipendenti dal valore dei parametri bisogna misurare.

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
- [[Programmazione/Postgres/Pagine/Driver e connection string|Driver e connection string]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/Postgres/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]


