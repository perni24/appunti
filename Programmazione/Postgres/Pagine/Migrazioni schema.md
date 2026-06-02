---
date: 2026-06-02
area: Programmazione
topic: Postgres
type: operational-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - migrazioni
aliases: []
prerequisites: []
related: []
---

# Migrazioni schema

## Sintesi

Le migrazioni schema modificano struttura, vincoli, indici e dati tecnici del database in modo versionato e ripetibile.

## Quando usarlo

Serve per evolvere schema applicativo, aggiungere colonne, creare indici, cambiare vincoli, modificare funzioni o preparare deploy.

## Come funziona

Una migrazione e uno script ordinato. Gli strumenti di migrazione registrano quali migrazioni sono state applicate. In produzione bisogna considerare lock, durata, compatibilita con versione precedente dell'app e rollback.

## API / Sintassi

Esempi:

```sql
ALTER TABLE users ADD COLUMN last_login_at timestamptz;
CREATE INDEX CONCURRENTLY users_last_login_at_idx ON users (last_login_at);
```

Vincolo non validato:

```sql
ALTER TABLE orders
ADD CONSTRAINT orders_total_positive CHECK (total_amount > 0) NOT VALID;

ALTER TABLE orders VALIDATE CONSTRAINT orders_total_positive;
```

## Esempio pratico

Aggiunta colonna compatibile:

1. Aggiungi colonna nullable.
2. Deploy app che scrive nuova colonna.
3. Backfill a batch.
4. Aggiungi vincolo `NOT NULL` quando i dati sono pronti.

## Varianti

- Migrazioni DDL.
- Migrazioni dati.
- Backfill.
- Indici concorrenti.
- Vincoli `NOT VALID`.
- Migrazioni reversibili e irreversibili.

## Errori comuni

- Eseguire DDL bloccante in orario di picco.
- Aggiungere colonna `NOT NULL DEFAULT` senza valutare lock/versione.
- Creare indici senza `CONCURRENTLY` su tabelle grandi.
- Non testare migrazioni su dati realistici.
- Mescolare deploy app e schema senza compatibilita.

## Checklist

- La migrazione e compatibile con la versione app precedente?
- I lock sono noti?
- Gli indici su tabelle grandi usano `CONCURRENTLY`?
- Esiste piano di rollback?
- Il backfill e a batch?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Strategie zero-downtime|Strategie zero-downtime]]
- [[Programmazione/Postgres/Pagine/Versionamento database|Versionamento database]]
- [[Programmazione/Postgres/Pagine/Lock monitoring|Lock monitoring]]
