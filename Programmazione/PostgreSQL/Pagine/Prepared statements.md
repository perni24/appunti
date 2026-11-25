---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: non revisionato
publish: true
tags:
  - programmazione
  - postgres
  - performance
  - sql
aliases: []
prerequisites: []
related: []
title: Prepared statements
---

# Prepared statements

## Sintesi

**Passare valori separati dal testo SQL** e **riutilizzare uno statement preparato sul server** sono due scelte diverse. La prima evita di costruire SQL concatenando dati; la seconda può ridurre il lavoro ripetuto di analisi e pianificazione. Non occorre conservare un piano tra chiamate per poter passare un parametro in modo corretto.

## Laboratorio SQL: nome, esecuzioni e durata

Su PostgreSQL 18, esegui i blocchi in ordine nella **stessa sessione** di prova:

```sql
PREPARE lab_price(integer, numeric) AS
SELECT round($1 * $2, 2) AS totale;
```

```sql
EXECUTE lab_price(2, 4.50);
EXECUTE lab_price(3, 4.50);
```

```sql
SELECT name, from_sql, generic_plans + custom_plans AS esecuzioni
FROM pg_prepared_statements WHERE name = 'lab_price';
DEALLOCATE lab_price;
```

Attesi `9.00`, `13.50` e `lab_price, true, 2`. Un'altra connessione non eredita il nome, e dopo `DEALLOCATE` non puoi più eseguirlo. Con `plan_cache_mode=auto` PostgreSQL può confrontare piani *custom*, scelti in base ai valori, e un piano *generic* riutilizzabile. Non dedurre da due esecuzioni che il piano sarà sempre lo stesso; su dati sbilanciati confronta parametri rappresentativi con `EXPLAIN EXECUTE`.

## Laboratorio Python: parametri senza statement persistente

Con Psycopg 3 e il profilo `lab_app` della nota sul driver:

```python
import psycopg

with psycopg.connect("service=lab_app") as conn:
    row = conn.execute("SELECT %s::text", ("D'Amico",), prepare=False).fetchone()
    print(row[0])
```

Atteso: `D'Amico`, apostrofo compreso. `%s` è il segnaposto del driver, **non** la formattazione di stringhe Python; la virgola rende l'argomento una tupla di un elemento. `prepare=False` evita la preparazione persistente per questa chiamata, non il binding. I parametri rappresentano **valori**, non nomi di colonne, direzioni di ordinamento o altre parti della grammatica SQL. Per identificatori dinamici usa un insieme ammesso e gli strumenti di composizione del driver.

## Riuso e pooler

Il `PREPARE` SQL esplicito è legato alla sessione backend. Psycopg può anche preparare automaticamente uno statement con il protocollo dopo più esecuzioni sulla stessa connessione. In modalità *transaction pooling*, la transazione successiva può finire su un altro backend: la compatibilità degli statement **di protocollo** dipende da driver, versione e configurazione di PgBouncer. Non estendere quella garanzia a `PREPARE`/`EXECUTE` SQL. Misura il beneficio prima di aumentare la cache di statement.

## Fonti

[PostgreSQL 18: PREPARE](https://www.postgresql.org/docs/18/sql-prepare.html) · [Psycopg: parametri](https://www.psycopg.org/psycopg3/docs/basic/params.html) · [Preparazione automatica](https://www.psycopg.org/psycopg3/docs/advanced/prepare.html) · [PgBouncer: compatibilità per modalità](https://www.pgbouncer.org/features.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Driver e connection string|Driver e connection string]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/PostgreSQL/Pagine/Connection Pooling|Connection Pooling]]
