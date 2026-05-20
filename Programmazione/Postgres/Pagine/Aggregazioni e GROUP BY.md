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
  - aggregazioni
aliases: []
prerequisites: []
related: []
---

# Aggregazioni e GROUP BY

## Sintesi

Le aggregazioni riassumono gruppi di righe usando funzioni come `count`, `sum`, `avg`, `min` e `max`.

## Concetto chiave

`GROUP BY` definisce il livello di dettaglio del risultato.

```sql
SELECT customer_id, count(*) AS total_orders
FROM orders
GROUP BY customer_id;
```

## HAVING

`WHERE` filtra le righe prima dell'aggregazione. `HAVING` filtra i gruppi dopo l'aggregazione.

```sql
SELECT customer_id, count(*) AS total_orders
FROM orders
GROUP BY customer_id
HAVING count(*) > 5;
```

## Errori comuni

- Selezionare colonne non aggregate e non presenti nel `GROUP BY`.
- Usare `HAVING` quando basta `WHERE`.
- Aggregare dati duplicati a causa di join sbagliate.

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
- [[Programmazione/Postgres/Pagine/JOIN|JOIN]]
- [[Programmazione/Postgres/Pagine/Window Functions|Window Functions]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]


