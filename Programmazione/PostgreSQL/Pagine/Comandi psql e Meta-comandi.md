---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - postgresql
  - database
aliases:
  - Comandi psql e Meta-comandi
prerequisites: []
related: []
title: Comandi psql e Meta-comandi
---

# Comandi psql e Meta-comandi

## Sintesi

Distingui tre ambienti: il terminale avvia `psql`, il prompt di `psql` interpreta i **meta-comandi** che iniziano con `\`, il server esegue le istruzioni SQL. Un meta-comando termina a fine riga: non aggiungere `;` o commenti SQL in coda. In una normale console SQL di un altro client i meta-comandi potrebbero non funzionare.

## Collegarsi e orientarsi

Dal terminale, per il cluster descritto in [[Programmazione/PostgreSQL/Pagine/Installazione e Inizializzazione|Installazione e inizializzazione]]:

```sh
psql -X -h 127.0.0.1 -p 55432 -U lab_admin -d app_db
```

Dentro `psql` controlla l'endpoint effettivo:

```text
\conninfo
```

Per descrivere una relazione che esiste anche in un database appena creato:

```text
\d pg_catalog.pg_class
```

| Meta-comando | Effetto |
|---|---|
| `\l` / `\c app_db` | Elenca i database / apre una **nuova** connessione. Le impostazioni di sessione non si trasferiscono automaticamente. |
| `\dn` / `\dt` | Elenca schemi / tabelle visibili; `\dt schema.*` restringe la ricerca a uno schema. |
| `\du` / `\df` | Mostra ruoli / funzioni. |
| `\x auto` / `\timing on` | Adatta la visualizzazione ai risultati larghi / mostra il tempo misurato dal client, non un piano di esecuzione. |
| `\q` | Esce dal client. |

## CSV: file locale o file del server?

Al prompt di `psql`, questa prova scrive il CSV su **stdout**, senza creare file o richiedere tabelle:

```text
\copy (SELECT 1 AS id, 'Ada' AS nome) TO STDOUT WITH (FORMAT csv, HEADER)
```

Attesi l'intestazione `id,nome` e il record `1,Ada`. Con `\copy … TO 'file.csv'` il percorso e i permessi sono del client; con SQL `COPY … TO '/percorso/file.csv'` sono del server e servono privilegi aggiuntivi. Evita percorsi già esistenti quando esporti. Se basta un risultato CSV a terminale, puoi anche usare `psql --csv -c "SELECT …"` con i parametri di connessione appropriati.

## Script: fermarsi al primo errore

Esempio di contenuto per un file locale chiamato `controllo.sql`:

```sql
SELECT current_database() AS database, current_user AS ruolo;
```

Dal terminale, dalla cartella che contiene il file:

```sh
psql -X -h 127.0.0.1 -p 55432 -U lab_admin -d app_db -v ON_ERROR_STOP=1 -1 -f controllo.sql
```

`-X` ignora i file di avvio di `psql`; `-f` legge lo script; `ON_ERROR_STOP` interrompe al primo errore e in questo caso restituisce codice `3` per un errore nello script. `-1` avvolge l'esecuzione in un'unica transazione: omettilo per comandi non ammessi in transazione come `CREATE DATABASE`. Fermarsi al primo errore, **senza** transazione, non annulla i comandi già confermati.

Per osservazioni ripetute `\watch` riesegue la query: usalo con letture, non con modifiche. `\gexec` tratta il risultato di una query come SQL da eseguire: prima ispeziona l'output e non usarlo con dati non fidati.

**Fonte:** [manuale di psql: opzioni, meta-comandi e codici di uscita](https://www.postgresql.org/docs/18/app-psql.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/SELECT INSERT UPDATE e DELETE|SELECT, INSERT, UPDATE e DELETE]]
- [[Programmazione/PostgreSQL/Pagine/Gestione Utenti e Ruoli|Gestione Utenti e Ruoli]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]
