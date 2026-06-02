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

# JOIN

## Sintesi

Le `JOIN` combinano righe provenienti da piu tabelle in base a una relazione logica, spesso una chiave esterna.

## Quando usarlo

Usa una `JOIN` quando i dati necessari sono distribuiti su piu tabelle:

- leggere ordini insieme ai dati del cliente;
- mostrare righe figlie insieme alla riga padre;
- applicare filtri basati su tabelle correlate;
- costruire report combinando tabelle normalizzate;
- trovare righe mancanti o non associate con `LEFT JOIN`.

Le `JOIN` sono centrali nel modello relazionale: permettono di mantenere dati normalizzati senza duplicare informazioni in ogni tabella.

## Come funziona

### Tipi principali
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

## API / Sintassi

```sql
SELECT columns
FROM left_table AS l
JOIN right_table AS r
  ON r.id = l.right_table_id
WHERE condition;
```

Tipi principali:

```sql
-- Solo corrispondenze
INNER JOIN

-- Tutte le righe a sinistra, anche senza corrispondenza
LEFT JOIN

-- Tutte le righe a destra, anche senza corrispondenza
RIGHT JOIN

-- Tutte le righe di entrambi i lati
FULL JOIN

-- Prodotto cartesiano
CROSS JOIN
```

In pratica `RIGHT JOIN` e spesso evitabile riscrivendo la query con le tabelle invertite e usando `LEFT JOIN`.

## Esempio pratico

Ordini con email del cliente:

```sql
SELECT
  o.id AS order_id,
  o.total_amount,
  u.email
FROM orders AS o
JOIN users AS u
  ON u.id = o.user_id
WHERE o.status = 'paid';
```

Utenti senza ordini:

```sql
SELECT u.id, u.email
FROM users AS u
LEFT JOIN orders AS o
  ON o.user_id = u.id
WHERE o.id IS NULL;
```

Il secondo esempio usa `LEFT JOIN` per mantenere gli utenti anche quando non esiste una riga corrispondente in `orders`.

## Varianti

- `INNER JOIN`: restituisce solo righe con match.
- `LEFT JOIN`: mantiene tutte le righe della tabella sinistra.
- `FULL JOIN`: utile per confrontare due insiemi e vedere righe presenti solo da un lato.
- `CROSS JOIN`: genera tutte le combinazioni tra due insiemi.
- `LATERAL JOIN`: permette alla tabella a destra di usare valori della riga a sinistra.
- Self join: la stessa tabella viene usata due volte con alias diversi.

Esempio di self join:

```sql
SELECT e.name AS employee, m.name AS manager
FROM employees AS e
LEFT JOIN employees AS m
  ON m.id = e.manager_id;
```

## Errori comuni

- Dimenticare la condizione `ON`.
- Confondere filtro in `WHERE` con filtro nella `JOIN`.
- Usare join non indicizzate su tabelle grandi.

## Checklist

- Scrivere sempre condizioni `ON` esplicite.
- Usare alias leggibili quando la query coinvolge piu tabelle.
- Verificare se una `LEFT JOIN` viene trasformata di fatto in `INNER JOIN` da condizioni nel `WHERE`.
- Controllare che le colonne di join siano indicizzate sulle tabelle grandi.
- Controllare la cardinalita: una join 1:N puo moltiplicare le righe.
- Usare `EXPLAIN` quando una join diventa lenta o cambia piano.

## Collegamenti

- [[Programmazione/Postgres/Pagine/Chiavi primarie e foreign key|Chiavi primarie e foreign key]]
- [[Programmazione/Postgres/Pagine/LATERAL JOIN|LATERAL JOIN]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]
