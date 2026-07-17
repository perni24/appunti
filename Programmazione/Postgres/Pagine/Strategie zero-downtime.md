---
date: 2026-06-02
area: Programmazione
topic: Postgres
type: operational-note
status: "non revisionato"
publish: true
difficulty: 
tags:
  - programmazione
  - postgres
  - migrazioni
  - zero-downtime
aliases: []
prerequisites: []
related: []
---

# Strategie zero-downtime

## Sintesi

Le strategie zero-downtime permettono di cambiare schema e applicazione senza fermare il servizio, mantenendo compatibilita tra vecchia e nuova versione.

## Quando usarlo

Serve per deploy continui, sistemi in produzione, tabelle grandi e applicazioni con SLA.

## Come funziona

Il principio e expand-and-contract:

1. Espandi schema in modo compatibile.
2. Deploy app che supporta vecchio e nuovo schema.
3. Backfill dati.
4. Sposta letture/scritture.
5. Rimuovi vecchio schema quando non serve piu.

## API / Sintassi

Indice non bloccante:

```sql
CREATE INDEX CONCURRENTLY orders_status_idx ON orders (status);
```

Vincolo validato dopo:

```sql
ALTER TABLE orders ADD CONSTRAINT orders_total_positive
CHECK (total_amount > 0) NOT VALID;

ALTER TABLE orders VALIDATE CONSTRAINT orders_total_positive;
```

## Esempio pratico

Rinominare una colonna senza downtime:

1. Aggiungi nuova colonna.
2. Scrivi su entrambe.
3. Backfill vecchi dati.
4. Leggi dalla nuova colonna.
5. Rimuovi vecchia colonna dopo verifica.

## Varianti

- Expand-and-contract.
- Backfill a batch.
- Feature flag.
- Dual write temporaneo.
- Indici `CONCURRENTLY`.
- Vincoli `NOT VALID`.

## Errori comuni

- Fare rename/drop immediato usato ancora dall'app.
- Creare indici bloccanti su tabelle grandi.
- Backfill in una sola transazione enorme.
- Non monitorare lock.
- Non prevedere rollback applicativo.

## Checklist

- Vecchia e nuova app sono compatibili con lo schema?
- I backfill sono a batch?
- Gli indici sono concorrenti?
- I vincoli sono validati in fase separata?
- Esiste rollback o fix forward?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Migrazioni schema|Migrazioni schema]]
- [[Programmazione/Postgres/Pagine/Versionamento database|Versionamento database]]
- [[Programmazione/Postgres/Pagine/Lock monitoring|Lock monitoring]]
