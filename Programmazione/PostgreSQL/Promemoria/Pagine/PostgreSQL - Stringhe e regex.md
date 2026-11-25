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
  - stringhe
  - regex
aliases:
  - Cheatsheet stringhe PostgreSQL
prerequisites: []
related:
  - "[[Programmazione/PostgreSQL/Pagine/Tipi numerici testuali e temporali]]"
title: PostgreSQL - Stringhe e regex
---

# PostgreSQL - Stringhe e regex

Blocchi indipendenti, senza tabelle. Scegli `LIKE` per i caratteri jolly, una regex per cercare un pattern o catturare gruppi.

## Comporre un testo con parti facoltative

```sql
SELECT 'Ada' || NULL::text AS missing, concat('Ada', NULL, 'L.') AS joined,
       concat_ws(' ', 'Ada', NULL, 'L.') AS label, format('User %s (%s)', 'Ada', 7) AS display;
```

Risultati: NULL, `AdaL.`, `Ada L.`, `User Ada (7)`. `concat_ws` salta gli argomenti NULL, non le stringhe vuote.

## Modificare e dividere

| Operazione | Espressione da inserire in una SELECT | Risultato |
|---|---|---|
| Maiuscole e minuscole | `upper('Sql')`, `lower('Sql')`, `initcap('due parole')` | `SQL`, `sql`, `Due Parole` |
| Spazi alle estremità | `trim('  Ada  ')` | `Ada`; `ltrim` o `rtrim` per un solo lato |
| Lunghezza in caratteri | `char_length('casa')` o `length('casa')` | 4 |
| Estrarre | `left('abcd', 2)`, `right('abcd', 2)`, `substring('abcd' FROM 2 FOR 2)` | `ab`, `cd`, `bc` |
| Sostituire o invertire | `replace('2026/07', '/', '-')`, `reverse('abc')` | `2026-07`, `cba` |

```sql
SELECT split_part('a,b,c', ',', 2), string_to_array('a,b,c', ','),
       array_to_string(ARRAY['a','b','c'], '/');
```

Risultati: `b`, `{a,b,c}`, `a/b/c`.

## Filtrare con LIKE o regex

```sql
SELECT 'Ada' LIKE 'Ad%' AS prefix, 'Ada' ILIKE '%ADA%' AS anywhere,
       'a_b' LIKE 'a!_b' ESCAPE '!' AS literal_underscore,
       'item-42' ~ '^[0-9]+$' AS digits_only, 'AbC' ~* '^[a-z]+$' AS letters;
```

Risultati: vero, vero, vero, falso, vero. `LIKE` confronta la stringa intera: `%` vale zero o più caratteri, `_` uno. Una regex cerca anche all'interno: usa `^` e `$` per ancorarla. `~*` ignora le maiuscole; `!~` e `!~*` negano il confronto.

## Estrarre il primo risultato o tutti

```sql
SELECT regexp_match('A12 B34', '([0-9]+)') AS first_match,
       regexp_match('nessuno', '([0-9]+)') AS no_match;
```

Una riga: `{12}` e NULL. Per ricevere **una riga per corrispondenza**, usa il plurale con `g`:

```sql
SELECT m.parts[1] AS number FROM regexp_matches('A12 B34', '([0-9]+)', 'g')
    WITH ORDINALITY AS m(parts, pos) ORDER BY pos;
```

Due righe, `12` e `34`; se non c'è corrispondenza, **zero righe**.

## Sostituire o separare con una regex

```sql
SELECT regexp_replace('uno  due   tre', '[[:space:]]+', ' ', 'g') AS normalized;
```

```sql
SELECT token FROM regexp_split_to_table('rosso, verde , blu', '[[:space:]]*,[[:space:]]*')
    WITH ORDINALITY AS s(token, pos) ORDER BY pos;
```

Il primo blocco dà `uno due tre` (senza `g` sostituisce solo la prima occorrenza); il secondo dà tre righe senza spazi intorno alla virgola.

## Approfondimento

- [PostgreSQL 18: funzioni per il testo](https://www.postgresql.org/docs/18/functions-string.html) e [pattern matching](https://www.postgresql.org/docs/18/functions-matching.html).

- [[Programmazione/PostgreSQL/Pagine/Tipi numerici testuali e temporali|Tipi numerici testuali e temporali]]
- [[Programmazione/PostgreSQL/Pagine/Full Text Search|Full Text Search]]
- [[Programmazione/PostgreSQL/Pagine/Tipi di Indici|Tipi di Indici]]


## Navigazione

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Indice Promemoria PostgreSQL]]
