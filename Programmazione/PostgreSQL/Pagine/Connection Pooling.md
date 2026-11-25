---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - postgresql
  - database
aliases:
  - Connection Pooling
prerequisites: []
related: []
title: Connection Pooling in PostgreSQL
---

# Connection Pooling in PostgreSQL

## Sintesi

Un pool mette in coda chi aspetta un backend disponibile e riutilizza le connessioni verso PostgreSQL. È utile quando molte richieste brevi alternano lavoro e inattività. Non rende più veloce una query lenta: una transazione aperta continua a occupare il backend.

## Scegliere la modalità di PgBouncer

| Modalità | Quando viene rilasciata la connessione server | Conseguenza |
| --- | --- | --- |
| `session` | Alla disconnessione del client | Lo stato di sessione rimane disponibile; un client inattivo può trattenere il backend |
| `transaction` | Alla fine della transazione | Le query di una transazione restano insieme; la successiva può finire su un backend diverso |
| `statement` | Alla fine dello statement | Non adatta ad applicazioni che aprono transazioni di più statement |

Nel transaction pooling non affidarti a `SET` persistenti, `LISTEN`, tabelle temporanee che devono sopravvivere al commit o lock advisory di sessione. I prepared statement **di protocollo** possono essere supportati con versione e `max_prepared_statements` adeguati; i comandi SQL `PREPARE`/`EXECUTE` non diventano portabili tra backend.

## Esempio: limitare una singola operazione

Laboratorio SQL, in una sola sessione. Esegui i tre blocchi in ordine, direttamente su PostgreSQL o attraverso il pool in modalità `transaction`.

```sql
SHOW statement_timeout;
```

```sql
BEGIN;
SET LOCAL statement_timeout = '5s';
SELECT current_setting('statement_timeout') AS limite_locale;
COMMIT;
```

```sql
SHOW statement_timeout;
```

Dentro la transazione il risultato è `5s`. Dopo il commit l'override locale è terminato; in un pool omogeneo si osserva di nuovo il limite di base. Non serve che il PID sia cambiato per dimostrare la regola.

## Dimensionamento e diagnosi

Un pool applicativo limita la concorrenza di **una istanza** dell'app; un PgBouncer condiviso limita le connessioni verso il database. In PgBouncer `default_pool_size` è per coppia utente/database, non per l'intera installazione. Per esempio, due utenti su tre database potrebbero avere sei pool: con limite 10, fino a 60 connessioni server ordinarie per processo PgBouncer, prima di eventuali limiti aggregati o riserve. `max_client_conn` limita invece i client del pooler.

Per osservare le code, collegati al database amministrativo `pgbouncer` con un utente autorizzato; **non** è un comando SQL del server PostgreSQL:

```text
SHOW POOLS;
```

Se `cl_waiting` resta alto e i backend sono tutti occupati, controlla durata delle transazioni, lock e capacità del database prima di allargare il pool. Coordina i budget tra repliche dell'app e istanze PgBouncer; lascia connessioni libere per amministrazione e manutenzione. Un endpoint di pooling non sostituisce la scelta del primario durante un failover.

## Fonti

[PgBouncer: compatibilità per modalità](https://www.pgbouncer.org/features.html) · [PgBouncer: parametri dei pool](https://www.pgbouncer.org/config.html) · [Console amministrativa](https://www.pgbouncer.org/usage.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Modello Client-Server|Modello Client-Server]]
- [[Programmazione/PostgreSQL/Pagine/Driver e connection string|Driver e connection string]]
- [[Programmazione/PostgreSQL/Pagine/Configurazione|Configurazione]]
