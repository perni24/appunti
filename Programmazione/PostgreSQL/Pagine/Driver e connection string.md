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
  - driver
  - applicazioni
aliases: []
prerequisites: []
related: []
title: Driver e connection string
---

# Driver e connection string

## Sintesi

Il driver apre la connessione, scambia messaggi con PostgreSQL e converte tipi e risultati. La *connection string* indica **quale servizio raggiungere e con quale identità**. Prima di diagnosticare una query, verifica che l'app sia davvero nel database atteso, con il ruolo runtime e attraverso l'endpoint previsto.

## Descrivere una connessione senza pubblicare credenziali

Questi due esempi **libpq** descrivono lo stesso endpoint TCP. La password non è parte dell'esempio: il client può riceverla da un passfile protetto o dal gestore di segreti. Per `verify-full` serve una CA attendibile e il certificato deve corrispondere al nome richiesto.

```text
postgresql://orders_app@db.example.test:5432/orders?sslmode=verify-full&connect_timeout=3&application_name=orders-api
```

```text
host=db.example.test port=5432 dbname=orders user=orders_app sslmode=verify-full connect_timeout=3 application_name=orders-api
```

In una URI i caratteri riservati nei componenti vanno codificati; il formato `keyword=value` ha regole di quoting diverse. Libpq non sostituisce da sola una stringa come `${DB_PASSWORD}`. Meglio passare parametri separati anziché costruire una URI con interpolazione. JDBC e altri driver possono usare nomi e sintassi propri.

## Laboratorio: verificare la sessione dal driver

Prerequisiti: Python con Psycopg 3, un database di prova `lab_app`, un login ordinario `lab_app_user` e un profilo libpq `lab_app` che punti a entrambi. Predisponi il profilo e la credenziale come in [[Programmazione/PostgreSQL/Pagine/Secret management|Secret management]]. Non servono tabelle o diritti di amministrazione.

```python
import psycopg

with psycopg.connect("service=lab_app", application_name="orders-api",
                     connect_timeout=3) as conn:
    row = conn.execute("""
        SELECT current_database(), session_user, current_setting('application_name')
    """).fetchone()
    print(*row, sep=" | ")
```

Atteso: `lab_app | lab_app_user | orders-api`. Il contesto della connessione Psycopg chiude la connessione in uscita e, se c'è una transazione, fa commit in caso di successo o rollback se esce un'eccezione. Con un pool, invece, normalmente prendi in prestito una connessione e la restituisci al gestore del pool.

## Distinguere i timeout

| Dove aspetta l'app? | Che cosa controllare |
| --- | --- |
| Prima di ottenere una connessione dal pool | Limite e tempo di attesa del pool applicativo |
| Durante l'apertura verso il server | `connect_timeout` di libpq, applicato per host; non è un limite di durata delle query |
| Dopo l'invio dello statement | `statement_timeout` sul server; `lock_timeout` riguarda l'attesa dei lock |

Su sistemi Unix un host omesso può selezionare un socket locale anziché TCP. Dietro PgBouncer, host e porta indicano il **pooler**: verifica TLS sui due tratti e non usare il PID del backend come identità dell'utente finale. Nei log annota servizio, database, nome dell'app e classe d'errore; non stampare una DSN completa che potrebbe contenere credenziali.

## Fonti

[PostgreSQL 18: parametri e formati libpq](https://www.postgresql.org/docs/18/libpq-connect.html) · [Psycopg 3: connessioni e transazioni](https://www.psycopg.org/psycopg3/docs/basic/transactions.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Connection Pooling|Connection Pooling]]
- [[Programmazione/PostgreSQL/Pagine/SSL e TLS|SSL/TLS]]
- [[Programmazione/PostgreSQL/Pagine/Secret management|Secret management]]
