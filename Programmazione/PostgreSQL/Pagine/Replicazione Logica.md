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
  - Replicazione Logica
prerequisites: []
related: []
title: Replicazione Logica in PostgreSQL
---

# Replicazione Logica in PostgreSQL

## Sintesi

Una *publication* descrive quali cambiamenti rendere disponibili in un database. Una *subscription* si collega al publisher, di norma copia le righe iniziali e poi applica le nuove modifiche. È utile per reporting selettivo o per una migrazione tra major compatibili. Non produce una copia promuovibile dell'intero cluster.

## Laboratorio: replicare una tabella

Prerequisiti: due database di prova, normalmente su cluster distinti; sul publisher `wal_level=logical`, capacità per slot e WAL sender; sul subscriber capacità per i worker di replica. Il ruolo di connessione sul publisher necessita dei permessi di replica e di lettura per la copia iniziale. Crea gli oggetti con ruoli autorizzati su ciascun lato.

**Su entrambi**, prima di attivare la subscription, crea una tabella con nome qualificato e colonne compatibili. Il subscriber deve partire vuoto in questo laboratorio.

```sql
CREATE TABLE public.lab_orders_sync (
  id bigint PRIMARY KEY,
  status text NOT NULL
);
```

**Solo sul publisher:**

```sql
INSERT INTO public.lab_orders_sync VALUES (1, 'aperto');
CREATE PUBLICATION lab_orders_pub FOR TABLE public.lab_orders_sync;
```

**Solo sul subscriber**, fuori da una transazione esplicita. `vault_publisher` è un servizio libpq predisposto sull'host del **server subscriber** con database, utente e credenziali protette; non è un alias del portatile da cui esegui `psql`.

```sql
CREATE SUBSCRIPTION lab_orders_sub
CONNECTION 'service=vault_publisher'
PUBLICATION lab_orders_pub WITH (copy_data = true);
```

**Sul subscriber**, verifica lo stato della singola tabella:

```sql
SELECT r.srrelid::regclass AS tabella, r.srsubstate AS stato
FROM pg_subscription_rel AS r
JOIN pg_subscription AS s ON s.oid = r.srsubid
WHERE s.subname = 'lab_orders_sub';
```

`r` indica che la tabella è pronta per la replica normale. Ora la riga iniziale deve essere presente. Sul publisher cambia `status` da `aperto` a `chiuso` per `id = 1`: la lettura sul subscriber deve infine restituire `chiuso`, non necessariamente al primo tentativo. Un worker connesso, da solo, non prova che una specifica modifica sia arrivata.

## Cosa non viene trasferito

- **Identità delle righe:** la PK consente di ritrovare la riga per `UPDATE` e `DELETE`. Con `REPLICA IDENTITY DEFAULT` e senza PK queste operazioni falliscono sul publisher se pubblicate; un indice idoneo o `FULL` sono alternative con costi diversi. Non serve una PK soltanto per pubblicare inserimenti.
- **Schema e sequenze:** il DDL non viene applicato automaticamente. Predisponi le migrazioni compatibili su entrambi i lati. I valori delle colonne identity viaggiano con le righe, non lo stato della sequenza: allinealo prima di aprire il subscriber alle scritture.
- **Conflitti e retention:** scrivere le stesse chiavi sul subscriber può fermare l'applicazione. Controlla errori del worker e slot anche se la subscription è disabilitata. `copy_data=false` salta la copia iniziale, non verifica che i dati siano già uguali.

Filtri di riga e liste di colonne restringono la publication; verifica che tutte le operazioni necessarie restino rappresentabili. Per una migrazione, ferma le scritture alla sorgente, attendi l'applicazione delle ultime modifiche e verifica schema, sequenze e conteggi prima di spostare il traffico. In laboratorio, rimuovere la subscription mentre il publisher è ancora raggiungibile facilita la rimozione dello slot associato.

## Fonti

[PostgreSQL 18: subscription](https://www.postgresql.org/docs/18/logical-replication-subscription.html) · [Publication e replica identity](https://www.postgresql.org/docs/18/logical-replication-publication.html) · [Restrizioni](https://www.postgresql.org/docs/18/logical-replication-restrictions.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Replicazione Fisica|Replicazione Fisica]]
- [[Programmazione/PostgreSQL/Pagine/Logical decoding|Logical decoding]]
- [[Programmazione/PostgreSQL/Pagine/Write-Ahead Logging|Write-Ahead Logging]]
