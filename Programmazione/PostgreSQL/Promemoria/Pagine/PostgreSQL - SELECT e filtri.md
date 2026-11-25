---
date: 2026-07-30
area: Programmazione
topic: Promemoria PostgreSQL
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - postgresql
  - promemoria
  - select
  - query
aliases:
  - Cheatsheet SELECT PostgreSQL
prerequisites: []
related:
  - "[[Programmazione/PostgreSQL/Pagine/SELECT INSERT UPDATE e DELETE]]"
  - "[[Programmazione/PostgreSQL/Pagine/Prepared statements]]"
title: PostgreSQL - SELECT e filtri
---

# PostgreSQL - SELECT e filtri

Come scegliere righe, ordine e pagina. Per provare i blocchi, prepara questi dati una volta nella stessa sessione:

```sql
CREATE TEMP TABLE lab_scores (id int PRIMARY KEY, name text, team text, score int);
INSERT INTO lab_scores VALUES
    (1, 'Ada', 'A', 90), (2, 'Ida', 'A', 90),
    (3, 'Teo', 'B', NULL), (4, 'Lia', 'B', 60);
```

## Selezionare e filtrare

```sql
SELECT s.id, s.name AS player
FROM lab_scores AS s
WHERE s.team IN ('A', 'B') AND s.score BETWEEN 60 AND 100
ORDER BY s.score DESC, s.id;
```

Risultato: Ada, Ida, Lia. `BETWEEN` include entrambi gli estremi; il punteggio sconosciuto non soddisfa il filtro.

| Cerchi | Predicato da usare in `WHERE` |
|---|---|
| Uguaglianza o differenza | `id = 1` oppure `id <> 1` |
| Prefisso o sottostringa senza distinzione di maiuscole | `name LIKE 'Ad%'` oppure `name ILIKE '%ad%'` |
| Valore assente o presente | `score IS NULL` oppure `score IS NOT NULL` |
| Due condizioni alternative oltre a un filtro comune | `team = 'A' AND (score >= 90 OR score IS NULL)` |

## Ordinare e paginare

```sql
SELECT id, score FROM lab_scores ORDER BY score DESC NULLS LAST, id;
```

Pagina per posizione (salta due righe):

```sql
SELECT id, name FROM lab_scores ORDER BY id LIMIT 2 OFFSET 2;
```

Pagina per cursore (riparti dall'ultimo ID letto, qui 2):

```sql
SELECT id, name FROM lab_scores WHERE id > 2 ORDER BY id LIMIT 2;
```

Entrambe danno 3 e 4 sui dati iniziali. Il cursore deve corrispondere **all'intero ordinamento**: se ordini per punteggio e ID, il solo ID non basta. Nell'app passa il cursore come parametro del driver; `$1` non è un valore disponibile in una SELECT isolata in psql.

## Valori distinti o una riga per gruppo

```sql
SELECT DISTINCT team FROM lab_scores ORDER BY team;
```

```sql
SELECT DISTINCT ON (team) team, name, score
FROM lab_scores
ORDER BY team, score DESC NULLS LAST, id;
```

La seconda query sceglie Ada e Lia: il gruppo viene prima nell'ordinamento, poi il punteggio migliore e infine l'ID minore per risolvere il pareggio.

## Classificare con CASE

```sql
SELECT id, CASE WHEN score IS NULL THEN 'unknown'
                WHEN score >= 90 THEN 'high'
                WHEN score >= 60 THEN 'medium' ELSE 'low' END AS level
FROM lab_scores ORDER BY id;
```

Ordine di scrittura: `SELECT → FROM / JOIN → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT → OFFSET`.

## Approfondimento

- [PostgreSQL 18: SELECT, DISTINCT ON e ordinamento](https://www.postgresql.org/docs/18/sql-select.html)
- [[Programmazione/PostgreSQL/Pagine/SELECT INSERT UPDATE e DELETE|SELECT INSERT UPDATE e DELETE]]
- [[Programmazione/PostgreSQL/Pagine/Prepared statements|Prepared statements]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/PostgreSQL/Pagine/Tipi di Dato|Tipi di Dato]]


## Navigazione

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Indice Promemoria PostgreSQL]]
