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
  - estensioni
aliases: []
prerequisites: []
related: []
---

# Sicurezza delle estensioni

## Sintesi

Le estensioni PostgreSQL aggiungono funzionalita al database, ma introducono anche codice, privilegi e superfici di attacco da valutare.

## Concetto chiave

Non tutte le estensioni hanno lo stesso profilo di rischio. Alcune espongono funzioni potenti, accesso a file, codice nativo o integrazioni esterne.

## Checklist

- Installare solo estensioni necessarie.
- Verificare origine e manutenzione.
- Limitare chi puo eseguire `CREATE EXTENSION`.
- Controllare privilegi delle funzioni.
- Aggiornare estensioni insieme al database.

## Errori comuni

- Installare estensioni in produzione senza review.
- Dare privilegi ampi a ruoli applicativi.
- Dimenticare estensioni nel processo di restore.

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

## Collegamenti
- [[Programmazione/Postgres/Pagine/Gestione delle Estensioni|Gestione delle Estensioni]]
- [[Programmazione/Postgres/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
- [[Programmazione/Postgres/Pagine/Audit logging|Audit logging]]


