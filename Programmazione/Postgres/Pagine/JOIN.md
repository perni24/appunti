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

# JOIN

## Sintesi

Le `JOIN` combinano righe provenienti da piu tabelle in base a una relazione logica, spesso una chiave esterna.

## Tipi principali

- `INNER JOIN`: restituisce solo righe con corrispondenza.
- `LEFT JOIN`: mantiene tutte le righe della tabella sinistra.
- `RIGHT JOIN`: mantiene tutte le righe della tabella destra.
- `FULL JOIN`: mantiene righe di entrambi i lati.
- `CROSS JOIN`: prodotto cartesiano.

```sql
SELECT orders.id, users.email
FROM orders
JOIN users ON users.id = orders.user_id;
```

## Errori comuni

- Dimenticare la condizione `ON`.
- Confondere filtro in `WHERE` con filtro nella `JOIN`.
- Usare join non indicizzate su tabelle grandi.

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
- [[Programmazione/Postgres/Pagine/Chiavi primarie e foreign key|Chiavi primarie e foreign key]]
- [[Programmazione/Postgres/Pagine/LATERAL JOIN|LATERAL JOIN]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]


