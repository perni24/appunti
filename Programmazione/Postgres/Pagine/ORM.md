---
date: 2026-06-02
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - orm
aliases: []
prerequisites: []
related: []
---

# ORM

## Sintesi

Un ORM mappa oggetti applicativi a tabelle PostgreSQL. Riduce codice ripetitivo, ma puo nascondere query inefficienti, transazioni sbagliate e problemi di caricamento.

## Quando usarlo

Usalo per CRUD applicativo, modelli di dominio semplici, migrazioni integrate e produttivita del team.

## Come funziona

L'ORM genera SQL a partire da modelli e operazioni. Alcuni usano active record, altri data mapper. Il punto critico e sapere leggere l'SQL prodotto.

## API / Sintassi

Esempio concettuale:

```text
User.findMany({ where: { active: true } })
-- genera SELECT ... FROM users WHERE active = true
```

## Esempio pratico

Problema N+1:

```text
carica 100 utenti
per ogni utente carica ordini
```

Soluzione: eager loading, join o query esplicita.

## Varianti

- Active Record.
- Data Mapper.
- Query builder.
- Migrazioni ORM.
- Raw SQL.
- Unit of work.

## Errori comuni

- Non controllare SQL generato.
- N+1 query.
- Transazioni troppo ampie o assenti.
- Migrazioni ORM bloccanti.
- Usare ORM per query analitiche complesse.

## Checklist

- Il logging SQL e abilitabile?
- Le query critiche sono analizzate con `EXPLAIN`?
- Le transazioni sono esplicite?
- Le migrazioni sono controllate?
- Sai quando usare raw SQL?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/Postgres/Pagine/Migrazioni schema|Migrazioni schema]]
- [[Programmazione/Postgres/Pagine/Driver e connection string|Driver e connection string]]
