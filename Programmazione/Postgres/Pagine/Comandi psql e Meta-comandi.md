---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Comandi psql e Meta-comandi]
prerequisites: []
related: []
---

# Comandi psql e Meta-comandi

## Sintesi

`psql` e il client CLI principale di PostgreSQL. Oltre a eseguire SQL, offre meta-comandi che iniziano con backslash per esplorare database, tabelle, ruoli, funzioni e configurazione.

## Quando usarlo

Usalo per ispezione rapida, debugging, restore SQL, amministrazione, test di query e controllo oggetti del database.

## Come funziona

I comandi SQL vengono inviati al server. I meta-comandi `psql` vengono interpretati dal client. Per esempio `\dt` non e SQL: mostra tabelle usando query interne.

## API / Sintassi

Connessione:

```bash
psql -h localhost -p 5432 -U app_user -d app_db
```

Meta-comandi utili:

```text
\l          -- database
\c dbname   -- cambia database
\dt         -- tabelle
\d table    -- descrivi tabella
\du         -- ruoli
\dn         -- schemi
\df         -- funzioni
\x          -- expanded display
\timing     -- tempi query
\q          -- esci
```

## Esempio pratico

Analisi rapida:

```text
\c app_db
\dt
\d orders
\timing on
SELECT count(*) FROM orders;
```

Output in CSV:

```bash
psql -d app_db -c "SELECT * FROM users" --csv
```

## Varianti

- `psql -c`: esegue un comando.
- `psql -f`: esegue uno script.
- `\copy`: copia dati lato client.
- `COPY`: copia dati lato server.
- `\watch`: riesegue una query periodicamente.
- `\gexec`: esegue output generato come SQL.

## Errori comuni

- Confondere `\copy` e `COPY`.
- Incollare comandi distruttivi senza transazione.
- Non usare `\timing` durante test.
- Dimenticare database o schema corrente.
- Esporre password nella shell history.

## Checklist

- Sei connesso al database giusto?
- L'utente corrente ha i privilegi attesi?
- Per comandi rischiosi hai aperto una transazione?
- Output e formato sono adatti allo scopo?
- La password non finisce in history o log?

## Collegamenti

- [[Programmazione/Postgres/Pagine/SELECT INSERT UPDATE e DELETE|SELECT, INSERT, UPDATE e DELETE]]
- [[Programmazione/Postgres/Pagine/Gestione Utenti e Ruoli|Gestione Utenti e Ruoli]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]
