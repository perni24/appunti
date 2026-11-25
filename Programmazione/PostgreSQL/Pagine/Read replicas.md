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
  - replica
  - scalabilita
aliases: []
prerequisites: []
related: []
title: Read replicas
---

# Read replicas

## Sintesi

Uno standby fisico in *hot standby* può rispondere a query in sola lettura usando il WAL **già applicato**. Spostare un report sullo standby alleggerisce il primario, ma non garantisce che il report veda l'ultima scrittura né che possa terminare senza interruzioni.

## Decidere dove leggere

| Operazione | Destinazione ragionevole | Perché |
| --- | --- | --- |
| Conferma di un ordine appena salvato | Primario, in una nuova transazione dopo il commit | L'utente deve ritrovare la propria scrittura |
| Dashboard con tolleranza al ritardo | Replica monitorata | Una versione precedente è accettabile entro il limite del servizio |
| Report lungo | Replica dedicata se necessario | Le query possono confliggere con il replay; separala dal candidato HA se gli obiettivi divergono |

## Distinguere ricezione, replay e inattività

Esegui sullo **standby fisico**, non sul subscriber di una publication:

```sql
SELECT pg_is_in_recovery() AS standby,
       pg_wal_lsn_diff(pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn())
         AS byte_ricevuti_non_applicati,
       pg_last_xact_replay_timestamp() AS ultimo_commit_o_abort_applicato;
```

La differenza misura due posizioni **locali** in condizioni di streaming normali: non misura il WAL ancora sul primario. Zero può significare che tutto il WAL *ricevuto* è stato applicato, anche se la connessione è caduta. Il timestamp descrive l'ultima transazione riprodotta: se il primario è inattivo può invecchiare su una replica perfettamente allineata. `NULL` significa misura non disponibile.

## Esempio: garantire una lettura dopo scrittura

1. Scrivi e conferma sul primario. Nella stessa connessione, **dopo** il commit, acquisisci una posizione obiettivo:

```sql
SELECT pg_current_wal_lsn() AS obiettivo;
```

2. Sulla replica scelta, nella stessa storia WAL, confronta la posizione applicata con l'obiettivo. Qui `psql` chiede il valore del passo precedente; in applicazione passalo come parametro di tipo `pg_lsn`.

```psql
\prompt 'LSN del primario: ' obiettivo
SELECT pg_last_wal_replay_lsn() >= :'obiettivo'::pg_lsn AS pronto;
```

3. Se il risultato è `true`, apri **una nuova lettura** sulla stessa replica: uno snapshot precedente può ancora vedere dati vecchi. Se è `false` o `NULL`, attesa limitata oppure lettura sul writer corrente. La posizione può comprendere lavoro di altre sessioni: è una soglia sufficiente, non l'identificativo esatto dell'ordine.

Il laboratorio presume commit locale durevole (`synchronous_commit=on`) e nessun cambio di timeline tra i passi. Non riutilizzare alla cieca un token dopo un failover. `remote_apply` può attendere il replay sugli standby sincroni richiesti, non su qualunque replica raggiungibile dal bilanciatore.

## Errori operativi

Una query lunga può trattenere uno snapshot incompatibile con la pulizia già registrata nel WAL. Lo standby può cancellarla per proseguire il recovery: controlla `pg_stat_database_conflicts`. Aumentare l'attesa favorisce il report a scapito della freschezza; `hot_standby_feedback` può ridurre i conflitti da pulizia ma favorire righe morte sul primario. Un nodo aggiornato non sostituisce un backup indipendente.

## Fonti

[PostgreSQL 18: hot standby e conflitti](https://www.postgresql.org/docs/18/hot-standby.html) · [Funzioni di recovery e posizioni WAL](https://www.postgresql.org/docs/18/functions-admin.html) · [Replica sincrona](https://www.postgresql.org/docs/18/warm-standby.html#SYNCHRONOUS-REPLICATION)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Replicazione Fisica|Replicazione Fisica]]
- [[Programmazione/PostgreSQL/Pagine/Replicazione Logica|Replicazione Logica]]
- [[Programmazione/PostgreSQL/Pagine/Failover e Load Balancing|Failover e Load Balancing]]
