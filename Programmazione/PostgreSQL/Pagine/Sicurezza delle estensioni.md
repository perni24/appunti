---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: non revisionato
publish: true
tags:
  - programmazione
  - postgres
  - sicurezza
  - estensioni
aliases: []
prerequisites: []
related: []
title: Sicurezza delle estensioni
---

# Sicurezza delle estensioni

## Sintesi

Per decidere se abilitare un'estensione distingui tre fatti: **il software è presente sul server**, **questa versione è installabile da questo ruolo**, **l'estensione è già attiva in questo database**. Una risposta positiva alla prima domanda non implica le altre due.

## Ispezionare prima di installare

Esempio per `pgcrypto` su PostgreSQL 18. Lettura del catalogo, senza modifiche:

```sql
SELECT a.name, a.default_version, a.installed_version, v.trusted, v.superuser
FROM pg_available_extensions AS a
JOIN pg_available_extension_versions AS v
  ON v.name = a.name AND v.version = a.default_version
WHERE a.name = 'pgcrypto';
```

`trusted` appartiene alla vista **delle versioni**. Nessuna riga indica che la versione predefinita non risulta disponibile; `installed_version IS NULL` con riga presente significa disponibile ma non installata qui. `trusted=true` consente l'installazione anche a un non-superuser con `CREATE` sul database, alle condizioni dell'estensione: non è una certificazione di sicurezza. La query mostra le proprietà della versione predefinita, che può differire da quella installata.

## Laboratorio: installazione circoscritta

Solo in un database di prova dove `pgcrypto` sia disponibile e non già installata, come amministratore. Il blocco apre una transazione e crea uno schema che non concede `CREATE` a ruoli applicativi. Non usare `IF NOT EXISTS` per validare schema o versione: non verifica che l'installazione preesistente corrisponda a quella richiesta.

```sql
BEGIN;
CREATE SCHEMA lab_extensions;
CREATE EXTENSION pgcrypto WITH SCHEMA lab_extensions;
```

```sql
SELECT e.extname, e.extversion, n.nspname AS schema_installazione
FROM pg_extension AS e JOIN pg_namespace AS n ON n.oid = e.extnamespace
WHERE e.extname = 'pgcrypto';
ROLLBACK;
```

Attesi `pgcrypto`, la versione disponibile e `lab_extensions`. Il rollback annulla sia l'installazione sia lo schema del laboratorio; non rimuove i file di sistema. Non tutte le estensioni accettano uno schema a scelta. Uno schema dedicato aiuta a governare i nomi, ma **non** isola codice nativo dal processo server.

## Checklist per un ambiente condiviso

- Verifica origine del pacchetto, manutenzione, dipendenze e compatibilità con la major del server e l'offerta del provider. Installa i file server solo tramite canali approvati.
- Controlla chi possiede database e schemi, chi ha `CREATE` e chi può eseguire le funzioni esposte. Durante installazione e aggiornamento usa solo schemi affidabili, compresi quelli delle dipendenze.
- Prova l'aggiornamento su una copia e verifica la versione nel catalogo di **ogni database** interessato. Un upgrade del pacchetto non equivale a un aggiornamento SQL dell'estensione.
- Verifica il ripristino su un server con le librerie necessarie. Non usare `DROP EXTENSION ... CASCADE` come procedura generica di rollback: può eliminare oggetti dipendenti.

## Fonti

[PostgreSQL 18: pg_available_extension_versions](https://www.postgresql.org/docs/18/view-pg-available-extension-versions.html) · [CREATE EXTENSION: privilegi e sicurezza](https://www.postgresql.org/docs/18/sql-createextension.html) · [Gestione delle estensioni](https://www.postgresql.org/docs/18/extend-extensions.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Gestione delle Estensioni|Gestione delle Estensioni]]
- [[Programmazione/PostgreSQL/Pagine/Schemi e Search Path|Schemi e Search Path]]
- [[Programmazione/PostgreSQL/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
