---
date: 2026-05-20
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - fdw
  - integrazione
aliases: []
prerequisites: []
related: []
---

# FDW

## Sintesi

Gli **Foreign Data Wrapper** (FDW) permettono a PostgreSQL di interrogare dati esterni come se fossero tabelle locali.

## Concetto chiave

Un FDW definisce server esterno, mapping utente e foreign table.

```sql
CREATE EXTENSION postgres_fdw;

CREATE SERVER remote_pg
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (host 'db.example.com', dbname 'app');
```

## Casi d'uso

- Query tra database PostgreSQL.
- Integrazione con sistemi esterni.
- Migrazioni graduali.
- Reporting federato.

## Limiti

- Performance dipendente dalla rete.
- Pushdown non sempre completo.
- Transazioni distribuite complesse.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Come funziona

Da completare: spiegare il meccanismo principale o il comportamento tecnico.

## API / Sintassi

```text
Da completare con API o sintassi principale.
```

## Esempio pratico

```text
Da completare con un esempio pratico.
```

## Varianti

- Da completare: varianti, alternative o differenze rispetto ad approcci simili.

## Errori comuni

Da completare durante revisione.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/Postgres/Pagine/Gestione delle Estensioni|Gestione delle Estensioni]]
- [[Programmazione/Postgres/Pagine/Driver e connection string|Driver e connection string]]
- [[Programmazione/Postgres/Pagine/Sicurezza delle estensioni|Sicurezza delle estensioni]]


