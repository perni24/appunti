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
  - date
  - timestamp
  - interval
aliases:
  - Cheatsheet date PostgreSQL
prerequisites: []
related:
  - "[[Programmazione/PostgreSQL/Pagine/Tipi numerici testuali e temporali]]"
title: PostgreSQL - Date, ore e intervalli
---

# PostgreSQL - Date, ore e intervalli

Usa `date` per un giorno, `timestamp` per un orario civile e `timestamptz` per un istante. I blocchi sono indipendenti; le ricette con risultati fissi indicano il fuso, senza cambiare quello della sessione.

## Quale orologio?

```sql
SELECT CURRENT_DATE, CURRENT_TIME, CURRENT_TIMESTAMP, statement_timestamp(), clock_timestamp();
```

I primi tre si riferiscono all'inizio della transazione; `statement_timestamp()` all'inizio del comando ricevuto; `clock_timestamp()` legge l'orologio al momento della chiamata. Per conoscere il fuso di visualizzazione usa `SHOW TimeZone;`.

## Interpretare o mostrare un orario

```sql
SELECT (timestamp '2026-07-30 12:30' AT TIME ZONE 'Europe/Rome')
           = timestamptz '2026-07-30 10:30+00' AS same_instant,
       timestamptz '2026-07-30 10:30+00' AT TIME ZONE 'Europe/Rome' AS local_time;
```

Risultati: vero, `2026-07-30 12:30:00`. Nel primo caso assegni un fuso all'ora civile; nel secondo mostri un istante come ora civile. `timestamptz` non conserva il nome del fuso originario.

## Sottrarre, troncare ed estrarre

```sql
SELECT date '2026-07-30' + 7 AS next_week,
       timestamp '2026-07-30 12:30' - interval '30 minutes' AS earlier,
       extract(epoch FROM (timestamp '2026-07-30 12:30' - timestamp '2026-07-30 11:00')) AS seconds,
       age(date '2026-04-01', date '2026-03-01') AS calendar_age;
```

Risultati: 6 agosto, mezzogiorno del 30 luglio, 5400 secondi, un mese di calendario. `age` non misura un numero fisso di secondi.

```sql
WITH sample(t) AS (VALUES (timestamp '2026-07-30 12:34:56'))
SELECT date_trunc('hour', t), date_trunc('day', t)::date, date_trunc('month', t)::date,
       extract(year FROM t), extract(month FROM t) FROM sample;
```

Ottieni le 12:00, il 30 luglio, il 1° luglio, 2026 e 7. Se parti da un istante, scegli il fuso del report *prima* di ricavarne il giorno civile.

## Filtrare un giorno anche al cambio d'ora

```sql
WITH bounds AS (
    SELECT timestamp '2026-03-29 00:00' AT TIME ZONE 'Europe/Rome' AS lo,
           timestamp '2026-03-30 00:00' AT TIME ZONE 'Europe/Rome' AS hi
), events(id, ts) AS (
    VALUES (1, timestamptz '2026-03-28 23:00+00'), (2, timestamptz '2026-03-29 21:59+00'),
           (3, timestamptz '2026-03-29 22:00+00')
)
SELECT id, hi - lo AS duration FROM events CROSS JOIN bounds
WHERE ts >= lo AND ts < hi ORDER BY id;
```

Passano 1 e 2; il 3 è già alla mezzanotte successiva. Quel giorno a Roma dura **23 ore**: costruisci entrambi i limiti dalle mezzanotti locali, non sommando 24 ore. In un'app lega i due istanti come parametri.

## Formattare, leggere e generare date

```sql
SELECT to_char(timestamp '2026-07-30 12:30', 'DD/MM/YYYY HH24:MI') AS label,
       to_date('30/07/2026', 'DD/MM/YYYY') AS day,
       to_timestamp('30/07/2026 12:30 +02:00', 'DD/MM/YYYY HH24:MI TZH:TZM')
           AT TIME ZONE 'UTC' AS utc_time;
```

Risultati: `30/07/2026 12:30`, 30 luglio, `10:30` UTC.

```sql
SELECT date '2026-07-30' + n AS day FROM generate_series(0, 2) AS s(n) ORDER BY n;
```

Tre giorni: 30 e 31 luglio, 1° agosto. La serie di interi sommata alla data produce direttamente `date`, senza conversioni di fuso.

## Approfondimento

- [PostgreSQL 18: funzioni temporali e fusi orari](https://www.postgresql.org/docs/18/functions-datetime.html).

- [[Programmazione/PostgreSQL/Pagine/Tipi numerici testuali e temporali|Tipi numerici testuali e temporali]]
- [[Programmazione/PostgreSQL/Pagine/Tipi di Dato|Tipi di Dato]]
- [[Programmazione/PostgreSQL/Pagine/TimescaleDB|TimescaleDB]]


## Navigazione

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Indice Promemoria PostgreSQL]]
