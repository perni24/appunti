---
date: 2026-07-30
area: Programmazione
topic: Promemoria PostgreSQL
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - postgresql
  - promemoria
  - jsonb
  - array
aliases:
  - Cheatsheet JSONB PostgreSQL
prerequisites: []
related:
  - "[[Programmazione/PostgreSQL/Pagine/Tipi di Dato]]"
  - "[[Programmazione/PostgreSQL/Pagine/Tipi di Indici]]"
title: PostgreSQL - JSONB e array
---

# PostgreSQL - JSONB e array

Usa `jsonb` per un documento e `text[]` (o un altro tipo array) per una sequenza SQL omogenea. I blocchi sono indipendenti; quello sull'indice va eseguito in una sessione di prova senza transazione aperta.

## Costruire e aggregare

```sql
WITH users(id, name) AS (VALUES (2, 'Teo'), (1, 'Ada'))
SELECT jsonb_build_object('ids', jsonb_build_array(1, 2)) AS summary,
       jsonb_agg(to_jsonb(u) ORDER BY id) AS people FROM users u;
```

Risultati: un oggetto con la lista `[1,2]` e una lista di due oggetti, Ada prima di Teo.

## Estrarre: testo, valore JSON o chiave assente?

```sql
WITH doc(j) AS (VALUES ('{"city":null,"tags":["sql"],"address":{"zip":"00100"}}'::jsonb))
SELECT (j -> 'city') = 'null'::jsonb AS json_null, (j -> 'missing') IS NULL AS absent,
       (j ->> 'city') IS NULL AS text_null, j #>> '{address,zip}' AS zip,
       j #> '{tags,0}' AS first_tag FROM doc;
```

Risultati: vero, vero, vero, `00100` (testo), `"sql"` (JSON). `->` e `#>` conservano il tipo JSONB; `->>` e `#>>` estraggono testo. Con il testo non distingui più la chiave assente dal valore JSON `null`.

## Verificare contenimento e chiavi

```sql
WITH doc(j) AS (VALUES ('{"active":true,"contact":{"email":"a@example.org"}}'::jsonb))
SELECT j @> '{"active":true}', j ? 'email', (j -> 'contact') ? 'email',
       j ?| ARRAY['phone','active'], j ?& ARRAY['phone','active'] FROM doc;
```

`@>` verifica il contenimento; `?` cerca al livello corrente, `?|` almeno una chiave, `?&` tutte. Risultati: vero, falso, vero, vero, falso.

## Modificare ed espandere

```sql
WITH doc(j) AS (VALUES ('{"address":{"zip":"00100","old":1},"tmp":0}'::jsonb))
SELECT jsonb_set(j, '{address,city}', to_jsonb('Roma'::text), true) #- '{address,old}' AS edited,
       (j || '{"address":{"city":"Roma"}}'::jsonb) - 'tmp' AS merged,
       jsonb_set('{}'::jsonb, '{address,city}', to_jsonb('Roma'::text), true) AS no_parent
FROM doc;
```

`edited` conserva `zip`; `merged` sostituisce tutto `address`, non unisce ricorsivamente. `no_parent` resta `{}`: `true` permette di creare l'ultimo elemento, non i genitori. Sono espressioni: la SELECT non salva le modifiche.

```sql
SELECT pos, item FROM jsonb_array_elements('["sql","web"]'::jsonb)
    WITH ORDINALITY AS a(item, pos) ORDER BY pos;
```

```sql
SELECT key, value FROM jsonb_each('{"b":2,"a":1}'::jsonb) ORDER BY key;
```

Il primo produce due righe numerate da 1 (mentre l'indice JSON parte da 0); il secondo coppie chiave/valore: `a, 1` e `b, 2`.

## Array SQL: leggere, filtrare, espandere

```sql
WITH sample(tags) AS (VALUES (ARRAY['sql','web']::text[]))
SELECT tags[1], array_length(tags, 1), array_append(tags, 'api'), array_remove(tags, 'web'),
       'sql' = ANY(tags), tags @> ARRAY['sql'], tags && ARRAY['api','web'] FROM sample;
```

Risultati: `sql`, 2, `{sql,web,api}`, `{sql}` e tre veri. Qui il primo indice è 1; `@>` richiede tutti gli elementi indicati, `&&` ne richiede almeno uno.

```sql
SELECT cardinality(ARRAY[]::int[]) AS total, array_length(ARRAY[]::int[], 1) AS first_dim;
```

```sql
SELECT pos, tag FROM unnest(ARRAY['sql','web']) WITH ORDINALITY AS t(tag, pos) ORDER BY pos;
```

Per un array vuoto `cardinality` dà 0, `array_length` dà NULL. `unnest` restituisce una riga per elemento.

## Indicizzare ricerche sul documento

```sql
BEGIN;
CREATE TEMP TABLE lab_docs (metadata jsonb);
CREATE INDEX lab_docs_gin ON pg_temp.lab_docs USING gin (metadata);
ROLLBACK;
```

L'indice GIN predefinito su `metadata` supporta, per esempio, `metadata @> …` e `metadata ? …`. Non è lo stesso che indicizzare l'espressione `metadata -> 'contact'`; il planner decide se usare l'indice.

## Approfondimento

- [PostgreSQL 18: operatori e funzioni JSON](https://www.postgresql.org/docs/18/functions-json.html) e [funzioni per array](https://www.postgresql.org/docs/18/functions-array.html).

- [[Programmazione/PostgreSQL/Pagine/Tipi di Dato|Tipi di Dato]]
- [[Programmazione/PostgreSQL/Pagine/Tipi di Indici|Tipi di Indici]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/PostgreSQL/Pagine/Normalizzazione|Normalizzazione]]


## Navigazione

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Indice Promemoria PostgreSQL]]
