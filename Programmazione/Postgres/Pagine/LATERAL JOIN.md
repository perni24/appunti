---
date: 2026-06-02
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

## Quando usarlo

### Quando usarla
- Ultima riga correlata per ogni entita.
- Espansione di JSON o array per riga.
- Top-N per gruppo.

## Come funziona

### Concetto chiave
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

## API / Sintassi

```sql
SELECT ...
FROM left_table AS l
JOIN LATERAL (
  SELECT ...
  FROM right_table AS r
  WHERE r.left_id = l.id
  ORDER BY ...
  LIMIT ...
) AS derived ON true;
```

Con `LEFT JOIN LATERAL`, la riga a sinistra rimane nel risultato anche se la subquery laterale non restituisce righe.

## Esempio pratico

Ultimo ordine per ogni utente:

```sql
SELECT
  u.id,
  u.email,
  last_order.id AS last_order_id,
  last_order.created_at AS last_order_at
FROM users AS u
LEFT JOIN LATERAL (
  SELECT id, created_at
  FROM orders AS o
  WHERE o.user_id = u.id
  ORDER BY created_at DESC
  LIMIT 1
) AS last_order ON true;
```

Espansione di un array per riga:

```sql
SELECT p.id, tag.value AS tag
FROM products AS p
CROSS JOIN LATERAL unnest(p.tags) AS tag(value);
```

## Varianti

- `JOIN LATERAL`: richiede che la subquery restituisca almeno una riga per mantenere la riga esterna.
- `LEFT JOIN LATERAL`: mantiene la riga esterna anche senza risultati.
- `CROSS JOIN LATERAL`: utile per espandere set-returning functions.
- Funzioni come `jsonb_array_elements`, `unnest` o query con `LIMIT` per ogni riga.
- Top-N per gruppo senza dover usare una window function.

## Errori comuni

- Usare `JOIN LATERAL` quando serve mantenere anche righe senza risultati: in quel caso serve `LEFT JOIN LATERAL`.
- Dimenticare `ON true` con `LEFT JOIN LATERAL`.
- Usarlo per sostituire join normali piu semplici.
- Non indicizzare le colonne usate nella subquery laterale.
- Fare subquery laterali costose per ogni riga esterna senza controllare `EXPLAIN`.

## Checklist

- Verificare se la subquery deve dipendere dalla riga a sinistra.
- Scegliere `LEFT JOIN LATERAL` se i risultati laterali sono opzionali.
- Limitare il risultato laterale quando serve solo il primo o i primi N record.
- Controllare gli indici su chiavi e ordinamenti usati nella subquery.
- Usare alias chiari per evitare ambiguita.
- Confrontare con window functions se il problema e un ranking per gruppo.

## Collegamenti

- [[Programmazione/Postgres/Pagine/JOIN|JOIN]]
- [[Programmazione/Postgres/Pagine/Subquery|Subquery]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]
