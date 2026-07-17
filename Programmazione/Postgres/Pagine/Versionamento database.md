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
  - versionamento
aliases: []
prerequisites: []
related: []
---

# Versionamento database

## Sintesi

Il versionamento database registra l'evoluzione dello schema con migrazioni ordinate, tracciabili e ripetibili.

## Quando usarlo

Serve in ogni progetto applicativo dove schema e codice evolvono insieme.

## Come funziona

Uno strumento di migrazione mantiene una tabella con le versioni applicate. Ogni modifica al database viene rappresentata da uno script o da una migration file nel repository.

## API / Sintassi

Tabella concettuale:

```sql
CREATE TABLE schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
```

Migrazione:

```sql
ALTER TABLE users ADD COLUMN timezone text;
```

## Esempio pratico

Flusso consigliato:

1. Scrivi migrazione in repository.
2. Testala su database locale.
3. Testala su staging con dati realistici.
4. Applica in produzione con monitoring.
5. Registra esito e durata.

## Varianti

- Migrazioni up/down.
- Migrazioni solo forward.
- Strumenti come Flyway, Liquibase, Alembic, Prisma o Diesel.
- Migrazioni SQL manuali.
- Schema dump.

## Errori comuni

- Modificare schema manualmente senza migrazione.
- Cambiare una migration gia applicata.
- Non versionare funzioni, trigger e view.
- Non separare migrazioni lente da deploy applicativo.
- Non testare rollback o fix forward.

## Checklist

- Ogni cambio schema ha una migrazione?
- Le migrazioni sono immutabili dopo applicazione?
- Staging replica dati realistici?
- Funzioni/view/trigger sono versionati?
- Esiste procedura per fallimenti?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Migrazioni schema|Migrazioni schema]]
- [[Programmazione/Postgres/Pagine/Strategie zero-downtime|Strategie zero-downtime]]
- [[Programmazione/Postgres/Pagine/Backup e Ripristino|Backup e Ripristino]]
