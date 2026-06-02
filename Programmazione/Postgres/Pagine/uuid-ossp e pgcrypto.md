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
  - estensioni
  - uuid
aliases: []
prerequisites: []
related: []
---

# uuid-ossp e pgcrypto

## Sintesi

`uuid-ossp` e `pgcrypto` sono estensioni usate per UUID e funzioni crittografiche. Oggi `pgcrypto` con `gen_random_uuid()` e spesso la scelta piu semplice per generare UUID.

## Quando usarlo

Usale per identificatori UUID, hash, funzioni random e alcune operazioni crittografiche di base.

## Come funziona

`uuid-ossp` espone funzioni storiche come `uuid_generate_v4()`. `pgcrypto` espone `gen_random_uuid()`, funzioni digest e funzioni di cifratura.

## API / Sintassi

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SELECT gen_random_uuid();
```

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SELECT uuid_generate_v4();
```

Hash:

```sql
SELECT encode(digest('test', 'sha256'), 'hex');
```

## Esempio pratico

UUID come default:

```sql
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE
);
```

## Varianti

- UUID v4 random.
- UUID generati applicativamente.
- UUID generati dal database.
- Hash con `digest`.
- Password hashing con funzioni dedicate, valutando bene requisiti di sicurezza.

## Errori comuni

- Usare UUID senza capire impatto su indici e locality.
- Salvare UUID come `text` invece di `uuid`.
- Confondere hashing e cifratura.
- Gestire password con funzioni non adatte.
- Abilitare entrambe le estensioni senza necessita.

## Checklist

- Serve UUID o basta identity/bigint?
- Il tipo colonna e `uuid`?
- L'estensione e abilitata in migrazione?
- La funzione scelta e disponibile in produzione?
- Per password usi un approccio dedicato e sicuro?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Gestione delle Estensioni|Gestione delle Estensioni]]
- [[Programmazione/Postgres/Pagine/Sicurezza delle estensioni|Sicurezza delle estensioni]]
- [[Programmazione/Postgres/Pagine/Tipi di Dato|Tipi di Dato]]
