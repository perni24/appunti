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
  - join
aliases: []
prerequisites: []
related: []
---

# LATERAL JOIN

## Sintesi

`LATERAL JOIN` permette a una subquery nel `FROM` di riferirsi alle colonne delle righe gia disponibili a sinistra.

## Concetto chiave

E utile quando per ogni riga esterna vuoi calcolare un piccolo risultato dipendente da quella riga.

```sql
SELECT u.id, o.id AS last_order_id
FROM users u
LEFT JOIN LATERAL (
  SELECT id
  FROM orders o
  WHERE o.user_id = u.id
  ORDER BY created_at DESC
  LIMIT 1
) o ON true;
```

## Quando usarla

- Ultima riga correlata per ogni entita.
- Espansione di JSON o array per riga.
- Top-N per gruppo.

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
- [[Programmazione/Postgres/Pagine/JOIN|JOIN]]
- [[Programmazione/Postgres/Pagine/Subquery|Subquery]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]


