---
date: 2026-06-02
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
publish: true
difficulty: 
tags:
  - programmazione
  - postgres
  - storage
aliases: []
prerequisites: []
related: []
---

# Tablespace

## Sintesi

Un tablespace permette di collocare oggetti PostgreSQL su percorsi filesystem diversi dalla data directory principale.

## Quando usarlo

Usalo per separare storage, spostare indici o tabelle grandi, gestire dischi diversi o requisiti operativi specifici.

## Come funziona

PostgreSQL crea link nella data directory verso il percorso del tablespace. Tabelle, indici e database possono essere creati o spostati in un tablespace.

## API / Sintassi

```sql
CREATE TABLESPACE fast_storage LOCATION '/mnt/fast/postgres';
```

Usare tablespace:

```sql
CREATE INDEX orders_created_at_idx
ON orders (created_at)
TABLESPACE fast_storage;
```

Spostare:

```sql
ALTER TABLE orders SET TABLESPACE fast_storage;
```

## Esempio pratico

Mettere indici grandi su storage dedicato puo ridurre contesa I/O, ma va misurato e documentato.

## Varianti

- Tablespace per tabelle.
- Tablespace per indici.
- Default tablespace per database.
- Storage veloce per indici.
- Storage capiente per archivi.

## Errori comuni

- Usare tablespace per correggere problemi di tuning non diagnosticati.
- Non includere tablespace nel piano backup.
- Percorsi con permessi errati.
- Spostare oggetti senza finestra operativa.
- Dimenticare monitoraggio disco separato.

## Checklist

- Il percorso e affidabile e monitorato?
- I backup includono tablespace?
- I permessi filesystem sono corretti?
- Il vantaggio I/O e misurato?
- La scelta e documentata?

## Collegamenti

- [[Programmazione/Postgres/Pagine/File System Layout e Data Directory|File System Layout e Data Directory]]
- [[Programmazione/Postgres/Pagine/Backup e Ripristino|Backup e Ripristino]]
- [[Programmazione/Postgres/Pagine/Tipi di Indici|Tipi di Indici]]
