---
date: 2026-07-30
area: Programmazione
topic: Promemoria PostgreSQL
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [postgresql, promemoria, stringhe, regex]
aliases: [Cheatsheet stringhe PostgreSQL]
prerequisites: []
related:
  - "[[Programmazione/Postgres/Pagine/Tipi numerici testuali e temporali]]"
---

# PostgreSQL - Stringhe e regex

## Concatenare

```sql
SELECT first_name || ' ' || last_name AS full_name
FROM users;
```

`||` restituisce `NULL` se uno degli operandi e `NULL`.

```sql
SELECT concat(first_name, ' ', last_name);
SELECT concat_ws(' ', first_name, middle_name, last_name);
```

## Formattare

```sql
SELECT format('User %s (%s)', name, id)
FROM users;
```

## Metodi principali

```sql
SELECT lower(value);
SELECT upper(value);
SELECT initcap(value);
SELECT trim(value);
SELECT ltrim(value);
SELECT rtrim(value);
SELECT length(value);
SELECT char_length(value);
SELECT left(value, 5);
SELECT right(value, 5);
SELECT substring(value FROM 2 FOR 4);
SELECT replace(value, 'old', 'new');
SELECT reverse(value);
```

## Dividere e unire

```sql
SELECT split_part('a,b,c', ',', 2);
SELECT string_to_array('a,b,c', ',');
SELECT array_to_string(ARRAY['a', 'b', 'c'], ',');
```

## LIKE

```sql
WHERE name LIKE 'Ada%'
WHERE name ILIKE '%ada%'
```

`%` indica qualsiasi sequenza; `_` un singolo carattere.

## Regex

```sql
WHERE value ~ '^[0-9]+$'
WHERE value ~* '^[a-z]+$'
WHERE value !~ 'pattern'
```

| Operatore | Effetto |
|---|---|
| `~` | Corrisponde, case-sensitive |
| `~*` | Corrisponde, case-insensitive |
| `!~` | Non corrisponde |
| `!~*` | Non corrisponde, case-insensitive |

## Estrarre e sostituire

```sql
SELECT regexp_match(value, '([0-9]+)');
SELECT regexp_matches(value, '([0-9]+)', 'g');
SELECT regexp_replace(value, '\s+', ' ', 'g');
SELECT regexp_split_to_table(value, '\s*,\s*');
```

## Approfondimento

- [[Programmazione/Postgres/Pagine/Tipi numerici testuali e temporali]]
- [[Programmazione/Postgres/Pagine/Full Text Search]]
- [[Programmazione/Postgres/Pagine/Tipi di Indici]]
