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
  - sicurezza
  - estensioni
aliases: []
prerequisites: []
related: []
---

# Sicurezza delle estensioni

## Sintesi

Le estensioni possono aggiungere codice potente al database. Vanno valutate per origine, privilegi, manutenzione, compatibilita e impatto sulla superficie di attacco.

## Quando usarlo

Serve prima di abilitare estensioni in produzione o quando si valuta una dipendenza database.

## Come funziona

Alcune estensioni sono trusted e installabili da utenti non superuser con privilegi adeguati; altre richiedono superuser o installazione lato sistema. Le estensioni possono creare funzioni, tipi, operatori e oggetti in schema.

## API / Sintassi

```sql
SELECT name, default_version, installed_version, trusted
FROM pg_available_extensions;
```

Estensioni installate:

```sql
SELECT extname, extversion
FROM pg_extension;
```

## Esempio pratico

Schema dedicato per estensioni:

```sql
CREATE SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
```

Poi usare nomi qualificati se necessario.

## Varianti

- Estensioni core.
- Estensioni trusted.
- Estensioni non trusted.
- Estensioni terze.
- Estensioni con librerie native.
- Estensioni in schema dedicato.

## Errori comuni

- Installare estensioni da sorgenti non verificate.
- Abilitare estensioni in `public` senza criterio.
- Non versionare estensioni richieste.
- Non testare upgrade di estensioni.
- Concedere superuser per installare estensioni senza controllo.

## Checklist

- L'estensione e necessaria?
- La fonte e affidabile?
- E disponibile in produzione?
- Lo schema di installazione e controllato?
- Versione e upgrade sono documentati?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Gestione delle Estensioni|Gestione delle Estensioni]]
- [[Programmazione/Postgres/Pagine/Schemi e Search Path|Schemi e Search Path]]
- [[Programmazione/Postgres/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
