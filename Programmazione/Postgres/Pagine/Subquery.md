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
  - subquery
aliases: []
prerequisites: []
related: []
---

# Subquery

## Sintesi

Una **subquery** e una query annidata dentro un'altra query. Puo comparire in `SELECT`, `FROM`, `WHERE` o `HAVING`.

## Quando usarlo

Usa una subquery quando un risultato intermedio serve direttamente a una query esterna:

- filtrare righe in base a un insieme di valori calcolato;
- confrontare un valore con una metrica aggregata;
- costruire una tabella derivata temporanea nella clausola `FROM`;
- esprimere una condizione di esistenza con `EXISTS`;
- isolare un passaggio logico senza creare una vista permanente.

Una subquery e utile se rende la query piu chiara. Se diventa lunga o viene riusata piu volte, valuta una [[Programmazione/Postgres/Pagine/Common Table Expressions e Recursive Queries|CTE]] o una vista.

## Come funziona

### Forme comuni
- Subquery scalare: restituisce un singolo valore.
- Subquery tabellare: usata come tabella derivata.
- Subquery correlata: dipende dalla riga esterna.

## API / Sintassi

Subquery in `WHERE`:

```sql
SELECT *
FROM users
WHERE id IN (
  SELECT user_id
  FROM orders
);
```

Subquery scalare:

```sql
SELECT *
FROM orders
WHERE total_amount > (
  SELECT avg(total_amount)
  FROM orders
);
```

Subquery in `FROM`:

```sql
SELECT customer_id, total_revenue
FROM (
  SELECT customer_id, sum(total_amount) AS total_revenue
  FROM orders
  GROUP BY customer_id
) AS customer_totals
WHERE total_revenue > 1000;
```

Subquery correlata con `EXISTS`:

```sql
SELECT u.id, u.email
FROM users AS u
WHERE EXISTS (
  SELECT 1
  FROM orders AS o
  WHERE o.user_id = u.id
);
```

## Esempio pratico

### Esempio
```sql
SELECT email
FROM users
WHERE id IN (
  SELECT user_id
  FROM orders
  WHERE total > 100
);
```

## Varianti

- `IN`: confronta un valore con un insieme di risultati.
- `EXISTS`: verifica se la subquery produce almeno una riga.
- `NOT EXISTS`: utile per trovare righe senza corrispondenze.
- Subquery scalare: deve restituire una sola riga e una sola colonna.
- Subquery correlata: usa valori della query esterna.
- Tabella derivata: subquery nella clausola `FROM`.

In molti casi `EXISTS` comunica meglio l'intenzione rispetto a `IN`, soprattutto quando interessa solo sapere se una riga correlata esiste.

## Errori comuni

- Usare subquery correlate costose senza controllare il piano.
- Usare `IN` con risultati molto grandi senza verificare performance.
- Scrivere subquery dove una `JOIN` sarebbe piu leggibile.

## Checklist

- Controllare che le subquery scalari restituiscano al massimo una riga.
- Preferire `EXISTS` quando serve solo verificare la presenza di righe correlate.
- Controllare il piano con `EXPLAIN` se la subquery e correlata.
- Evitare subquery troppo annidate: oltre un certo punto una CTE e piu leggibile.
- Verificare il comportamento con `NULL`, soprattutto con `NOT IN`.
- Usare alias chiari per distinguere query interna ed esterna.

## Collegamenti

- [[Programmazione/Postgres/Pagine/Common Table Expressions e Recursive Queries|CTE]]
- [[Programmazione/Postgres/Pagine/JOIN|JOIN]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]
