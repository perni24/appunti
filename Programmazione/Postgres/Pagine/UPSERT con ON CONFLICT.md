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
  - sql
  - upsert
aliases: []
prerequisites: []
related: []
---

# UPSERT con ON CONFLICT

## Sintesi

`ON CONFLICT` implementa l'upsert: inserisce una riga oppure aggiorna quella esistente quando viola un vincolo unico.

## Esempio

```sql
INSERT INTO users (email, name)
VALUES ('a@example.com', 'Ada')
ON CONFLICT (email)
DO UPDATE SET name = EXCLUDED.name;
```

## Concetto chiave

Il conflitto deve essere definito da una primary key, unique constraint o unique index. `EXCLUDED` rappresenta la riga che si stava tentando di inserire.

## Varianti

```sql
ON CONFLICT (email) DO NOTHING;
```

## Errori comuni

- Non avere un vincolo unico su cui rilevare il conflitto.
- Aggiornare sempre anche quando i dati sono identici.
- Non considerare concorrenza e lock sulle righe coinvolte.

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

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/Postgres/Pagine/Vincoli|Vincoli]]
- [[Programmazione/Postgres/Pagine/Indici Parziali e Coprenti|Indici Parziali e Coprenti]]
- [[Programmazione/Postgres/Pagine/RETURNING|RETURNING]]


