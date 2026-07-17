---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [postgresql, database]
aliases: [Replicazione Logica]
prerequisites: []
related: []
---

# Replicazione Logica in PostgreSQL

## Sintesi

La **replicazione logica** replica cambiamenti di riga tramite un modello publication/subscription. A differenza della replica fisica, puo replicare solo alcune tabelle e puo funzionare tra versioni major diverse.

## Quando usarlo

Usala per:

- upgrade major con downtime ridotto;
- replica selettiva di tabelle;
- consolidamento dati da piu database;
- integrazione con sistemi esterni;
- migrazioni tra cluster;
- data warehouse o reporting separato.

## Come funziona

Il publisher definisce una publication. Il subscriber crea una subscription che si collega al publisher, copia i dati iniziali e poi riceve modifiche.

La replicazione logica non replica automaticamente DDL, sequenze e tutte le configurazioni. Le tabelle replicate devono avere una replica identity adeguata per `UPDATE` e `DELETE`, di solito una primary key.

## API / Sintassi

Sul publisher:

```sql
CREATE PUBLICATION app_publication
FOR TABLE users, orders;
```

Sul subscriber:

```sql
CREATE SUBSCRIPTION app_subscription
CONNECTION 'host=publisher dbname=app_db user=rep_user password=secret'
PUBLICATION app_publication;
```

Replica identity:

```sql
ALTER TABLE orders REPLICA IDENTITY DEFAULT;
ALTER TABLE audit_events REPLICA IDENTITY FULL;
```

## Esempio pratico

Replicare solo tabelle operative:

```sql
CREATE PUBLICATION reporting_pub
FOR TABLE orders, order_items, customers;
```

Sul database di reporting:

```sql
CREATE SUBSCRIPTION reporting_sub
CONNECTION 'host=prod-db dbname=app_db user=rep_user password=secret'
PUBLICATION reporting_pub
WITH (copy_data = true);
```

Prima di creare la subscription, lo schema delle tabelle deve esistere sul subscriber.

## Varianti

- Publication per tutte le tabelle.
- Publication per tabelle specifiche.
- Filtri di righe e colonne nelle versioni moderne di PostgreSQL.
- Subscription con o senza copia iniziale.
- Replica identity `DEFAULT`, `USING INDEX` o `FULL`.
- Logical decoding verso consumer esterni.

## Errori comuni

- Dimenticare che DDL e sequenze non sono replicate automaticamente.
- Replicare tabelle senza primary key e poi avere problemi su update/delete.
- Non monitorare slot logici e lag.
- Scrivere sugli stessi dati sia su publisher sia su subscriber.
- Non pianificare cutover e rollback.
- Lasciare subscription disattive che trattengono WAL.

## Checklist

- Le tabelle hanno primary key o replica identity adeguata?
- Lo schema e gia presente sul subscriber?
- Le sequenze sono gestite separatamente?
- Gli slot logici sono monitorati?
- Il cutover e stato provato?
- Sono chiari i dati replicati e quelli esclusi?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Replicazione Fisica|Replicazione Fisica]]
- [[Programmazione/Postgres/Pagine/Logical decoding|Logical decoding]]
- [[Programmazione/Postgres/Pagine/Write-Ahead Logging|Write-Ahead Logging]]
