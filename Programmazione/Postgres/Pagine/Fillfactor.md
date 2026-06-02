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
  - storage
  - performance
aliases: []
prerequisites: []
related: []
---

# Fillfactor

## Sintesi

`fillfactor` controlla quanto spazio lasciare libero nelle pagine di una tabella o indice. Un valore piu basso puo favorire update HOT e ridurre page split, al costo di piu spazio usato.

## Quando usarlo

Usalo su tabelle o indici molto aggiornati, dove bloat e update frequenti degradano performance.

## Come funziona

Con fillfactor 100, PostgreSQL riempie molto le pagine. Con valori minori, lascia spazio per future modifiche. Questo puo evitare di spostare tuple aggiornate in altre pagine.

## API / Sintassi

```sql
CREATE TABLE users (
  id bigint PRIMARY KEY,
  name text
) WITH (fillfactor = 80);
```

Modifica:

```sql
ALTER TABLE users SET (fillfactor = 80);
VACUUM FULL users;
```

Indice:

```sql
CREATE INDEX users_name_idx ON users (name) WITH (fillfactor = 90);
```

## Esempio pratico

Una tabella `accounts` aggiornata spesso sul campo `last_seen_at` puo beneficiare di fillfactor piu basso, ma va verificato con metriche di bloat e performance.

## Varianti

- Fillfactor tabella.
- Fillfactor indice.
- HOT updates.
- Tuning per tabelle append-only.
- Tuning per tabelle update-heavy.

## Errori comuni

- Applicare fillfactor senza misurare.
- Ridurlo troppo e sprecare disco.
- Aspettarsi effetti immediati senza riscrivere/vacuum adeguato.
- Ignorare indici coinvolti negli update.
- Usarlo al posto di una buona modellazione.

## Checklist

- La tabella e update-heavy?
- C'e bloat misurabile?
- Gli update possono essere HOT?
- Lo spazio extra e accettabile?
- Hai confrontato prima e dopo?

## Collegamenti

- [[Programmazione/Postgres/Pagine/MVCC|MVCC]]
- [[Programmazione/Postgres/Pagine/Manutenzione|Manutenzione]]
- [[Programmazione/Postgres/Pagine/Tipi di Indici|Tipi di Indici]]
