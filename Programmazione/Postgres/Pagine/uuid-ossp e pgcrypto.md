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
  - estensioni
  - uuid
  - sicurezza
aliases: []
prerequisites: []
related: []
---

# uuid-ossp e pgcrypto

## Sintesi

`uuid-ossp` e `pgcrypto` sono estensioni spesso usate per UUID e funzioni crittografiche.

## uuid-ossp

Fornisce funzioni per generare UUID.

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SELECT uuid_generate_v4();
```

## pgcrypto

Fornisce funzioni crittografiche, hashing e generazione casuale.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SELECT gen_random_uuid();
```

## Nota pratica

In molti casi moderni `gen_random_uuid()` da `pgcrypto` e sufficiente per generare UUID v4.

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
- [[Programmazione/Postgres/Pagine/Sicurezza delle estensioni|Sicurezza delle estensioni]]
- [[Programmazione/Postgres/Pagine/Tipi di Dato|Tipi di Dato]]


