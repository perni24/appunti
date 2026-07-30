---
date: 2026-07-30
area: Programmazione
topic: Promemoria PostgreSQL
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [postgresql, promemoria, date, timestamp, interval]
aliases: [Cheatsheet date PostgreSQL]
prerequisites: []
related:
  - "[[Programmazione/Postgres/Pagine/Tipi numerici testuali e temporali]]"
---

# PostgreSQL - Date, ore e intervalli

## Valori correnti

```sql
SELECT CURRENT_DATE;
SELECT CURRENT_TIME;
SELECT CURRENT_TIMESTAMP;
SELECT statement_timestamp();
SELECT clock_timestamp();
```

`CURRENT_TIMESTAMP` rimane stabile nella transazione.

## Letterali

```sql
SELECT DATE '2026-07-30';
SELECT TIMESTAMP '2026-07-30 12:30:00';
SELECT TIMESTAMPTZ '2026-07-30 12:30:00+02';
SELECT INTERVAL '2 days 3 hours';
```

## Calcoli

```sql
SELECT CURRENT_DATE + INTERVAL '7 days';
SELECT CURRENT_TIMESTAMP - INTERVAL '30 minutes';
SELECT end_at - start_at AS duration;
SELECT age(end_at, start_at);
```

## Troncare

```sql
SELECT date_trunc('hour', created_at);
SELECT date_trunc('day', created_at);
SELECT date_trunc('month', created_at);
```

## Estrarre parti

```sql
SELECT EXTRACT(YEAR FROM created_at);
SELECT EXTRACT(MONTH FROM created_at);
SELECT EXTRACT(EPOCH FROM duration);
```

## Fuso orario

```sql
SHOW TIMEZONE;
```

```sql
SELECT created_at AT TIME ZONE 'Europe/Rome'
FROM events;
```

Preferire `timestamptz` per istanti reali e conservare un fuso esplicito in input.

## Formattare e analizzare

```sql
SELECT to_char(created_at, 'DD/MM/YYYY HH24:MI');
SELECT to_date('30/07/2026', 'DD/MM/YYYY');
SELECT to_timestamp('30/07/2026 12:30', 'DD/MM/YYYY HH24:MI');
```

## Serie temporale

```sql
SELECT day::date
FROM generate_series(
    DATE '2026-07-01',
    DATE '2026-07-31',
    INTERVAL '1 day'
) AS series(day);
```

## Filtro per intervallo

```sql
WHERE created_at >= $1
  AND created_at < $2
```

Usare un intervallo semiaperto evita problemi sul limite finale.

## Approfondimento

- [[Programmazione/Postgres/Pagine/Tipi numerici testuali e temporali]]
- [[Programmazione/Postgres/Pagine/Tipi di Dato]]
- [[Programmazione/Postgres/Pagine/TimescaleDB]]
