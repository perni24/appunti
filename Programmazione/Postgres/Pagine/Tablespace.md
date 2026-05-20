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
  - storage
  - amministrazione
aliases: []
prerequisites: []
related: []
---

# Tablespace

## Sintesi

Un **tablespace** permette di posizionare fisicamente oggetti PostgreSQL in directory diverse dal data directory principale.

## Concetto chiave

I tablespace separano storage logico e fisico. Possono servire per distribuire I/O o isolare oggetti grandi.

```sql
CREATE TABLESPACE fastspace
LOCATION '/mnt/fast-postgres';

CREATE TABLE events (
  id bigint generated always as identity,
  payload jsonb
) TABLESPACE fastspace;
```

## Quando usarli

- Storage con caratteristiche diverse.
- Tabelle o indici molto grandi.
- Migrazioni controllate di oggetti.

## Errori comuni

- Usarli come sostituto di capacity planning.
- Dimenticare backup e restore del percorso fisico.
- Spostare oggetti senza misurare I/O reale.

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

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/Postgres/Pagine/File System Layout e Data Directory|File System Layout e Data Directory]]
- [[Programmazione/Postgres/Pagine/Backup e Ripristino|Backup e Ripristino]]
- [[Programmazione/Postgres/Pagine/Manutenzione|Manutenzione]]


