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
  - sicurezza
  - ruoli
aliases: []
prerequisites: []
related: []
---

# Ruoli e privilegi avanzati

## Sintesi

I ruoli PostgreSQL possono rappresentare utenti, gruppi o identita applicative. I privilegi controllano accesso a database, schema, tabelle, sequenze e funzioni.

## Concetto chiave

Separare ownership, ruoli applicativi e ruoli umani riduce privilegi eccessivi.

```sql
CREATE ROLE app_readonly;
GRANT USAGE ON SCHEMA public TO app_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;
```

## Aspetti avanzati

- Default privileges.
- Role membership.
- `SECURITY DEFINER`.
- Separazione tra owner e runtime user.
- Revoca di privilegi da `public`.

## Errori comuni

- Usare l'owner dello schema come utente applicativo.
- Concedere `SUPERUSER` senza necessita.
- Dimenticare privilegi sulle sequenze.

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
- [[Programmazione/Postgres/Pagine/Gestione Utenti e Ruoli|Gestione Utenti e Ruoli]]
- [[Programmazione/Postgres/Pagine/Row Level Security|Row Level Security]]
- [[Programmazione/Postgres/Pagine/Audit logging|Audit logging]]


