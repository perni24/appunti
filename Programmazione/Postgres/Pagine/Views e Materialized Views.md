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
  - views
aliases: []
prerequisites: []
related: []
---

# Views e Materialized Views

## Sintesi

Una **view** salva una query come oggetto logico. Una **materialized view** salva fisicamente il risultato e va aggiornata esplicitamente.

## View

```sql
CREATE VIEW active_users AS
SELECT id, email
FROM users
WHERE active = true;
```

La view non materializza dati: viene risolta quando la interroghi.

## Materialized view

```sql
CREATE MATERIALIZED VIEW monthly_sales AS
SELECT date_trunc('month', created_at) AS month, sum(total) AS total
FROM orders
GROUP BY 1;
```

```sql
REFRESH MATERIALIZED VIEW monthly_sales;
```

## Errori comuni

- Pensare che una view migliori automaticamente le performance.
- Dimenticare refresh e concorrenza sulle materialized view.
- Nascondere query troppo complesse dietro molte view annidate.

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

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/Postgres/Pagine/Aggregazioni e GROUP BY|Aggregazioni e GROUP BY]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/Postgres/Pagine/Indici Parziali e Coprenti|Indici Parziali e Coprenti]]


