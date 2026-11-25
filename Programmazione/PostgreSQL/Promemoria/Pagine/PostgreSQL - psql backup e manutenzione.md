---
date: 2026-07-30
area: Programmazione
topic: Promemoria PostgreSQL
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - postgresql
  - promemoria
  - psql
  - backup
  - manutenzione
aliases:
  - Cheatsheet psql PostgreSQL
prerequisites: []
related:
  - "[[Programmazione/PostgreSQL/Pagine/Comandi psql e Meta-comandi]]"
  - "[[Programmazione/PostgreSQL/Pagine/Backup e Ripristino]]"
  - "[[Programmazione/PostgreSQL/Pagine/Manutenzione]]"
title: PostgreSQL - psql, backup e manutenzione
---

# PostgreSQL - psql, backup e manutenzione

Il formato decide lo strumento: **archivio custom → `pg_restore`; script SQL → `psql`**. Usa i client PostgreSQL 18 in una directory privata vuota e un cluster di prova con host, porta e autenticazione già configurati. Il ruolo deve poter creare database. I tre nomi `memo_ops_src`, `memo_ops_custom` e `memo_ops_plain` devono essere liberi. Se un comando fallisce, fermati.

## Preparare la sorgente

Dal **terminale** (anche PowerShell), crea il database e poi apri psql:

```powershell
createdb --template=template0 memo_ops_src
```

```powershell
psql -X -v ON_ERROR_STOP=1 -d memo_ops_src
```

Se la connessione non è configurata, aggiungi `-h host -p porta -U ruolo` oppure usa una URI senza password. Nel **prompt di psql**, prepara queste due righe:

```sql
CREATE TABLE public.items (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sku text NOT NULL UNIQUE, qty integer NOT NULL CHECK (qty > 0)
);
INSERT INTO public.items (sku, qty) VALUES ('A', 3), ('B', 4);
```

| In psql, senza punto e virgola | Uso |
|---|---|
| `\conninfo`, `\l`, `\c nome_db` | Controlla la connessione, elenca i database, cambia database |
| `\dn`, `\dt public.*`, `\d public.items`, `\di public.*` | Schemi, tabelle, struttura, indici |
| `\du`, `\x`, `\timing` | Ruoli, visualizzazione estesa, durata dei comandi |
| `\i file.sql`, `\q` | Esegui uno script locale, esci |

Esporta dal **client**; il percorso relativo parte dalla directory di psql. Il CSV contiene intestazione e due righe, ma **non** vincoli, indici o sequenze:

```text
\copy (SELECT sku, qty FROM public.items ORDER BY sku) TO 'memo_items.csv' WITH (FORMAT csv, HEADER true)
```

## Custom: ispezionare e ripristinare

Esci da psql con `\q`. Dal **terminale**:

```powershell
pg_dump --format=custom --file=memo_items.dump --dbname=memo_ops_src
```

```powershell
pg_restore --list memo_items.dump
```

```powershell
createdb --template=template0 memo_ops_custom
```

```powershell
pg_restore --exit-on-error --single-transaction --dbname=memo_ops_custom memo_items.dump
```

`--list` elenca il contenuto, non dimostra che il ripristino riesca. Non serve `--clean` su un database vuoto: quell'opzione elimina oggetti nella destinazione. Qui si mantengono proprietari e permessi; per un altro cluster occorre predisporre i ruoli necessari.

## Plain: eseguire lo script

```powershell
pg_dump --format=plain --file=memo_items.sql --dbname=memo_ops_src
```

```powershell
createdb --template=template0 memo_ops_plain
```

```powershell
psql -X -v ON_ERROR_STOP=1 --single-transaction -d memo_ops_plain -f memo_items.sql
```

`-X` ignora il file di avvio personale; `ON_ERROR_STOP` interrompe lo script al primo errore. Ripristina solo dump fidati: il loro SQL viene eseguito.

## Verificare entrambe le copie

In psql, collegati **prima a `memo_ops_custom`, poi a `memo_ops_plain`**. Esegui lo stesso blocco una volta per copia, non sulla sorgente:

```sql
SELECT current_database(), count(*) AS items, sum(qty) AS total FROM public.items;
INSERT INTO public.items (sku, qty) VALUES ('C', 1) RETURNING id;
```

Attesi il nome della copia, **2 righe e totale 7**; l'inserimento restituisce **ID 3**. Verifichi così dati e sequenza. Per un'applicazione controlla anche vincoli, permessi e una query con il vero ruolo runtime.

## Globali e manutenzione

Un dump del singolo database non include i ruoli del cluster. Da terminale, per esportare i globali **senza** verificatori di password:

```powershell
pg_dumpall --globals-only --no-role-passwords --file=memo_globals.sql
```

Proteggi comunque il file. Non eseguirlo alla cieca sul cluster di partenza; credenziali e percorsi dei tablespace vanno predisposti separatamente. Dump e CSV possono sovrascrivere file omonimi.

Su **una copia**, in psql con autocommit attivo, usa questo comando per recuperare spazio riutilizzabile nella tabella e aggiornare le statistiche:

```sql
VACUUM (ANALYZE) public.items;
```

Se vuoi solo aggiornare le stime del planner:

```sql
ANALYZE public.items;
```

`VACUUM FULL public.items;` riscrive la tabella, richiede spazio aggiuntivo e un lock esclusivo: non è la manutenzione ordinaria. Per misurare, invece di supporre che il file si sia ridotto:

```sql
SELECT pg_size_pretty(pg_database_size(current_database())) AS database_size,
       pg_size_pretty(pg_total_relation_size('public.items')) AS table_with_indexes;
```

```sql
SELECT usename, state, count(*) FROM pg_stat_activity
WHERE datname = current_database() GROUP BY usename, state ORDER BY usename, state;
```

Le dimensioni e il numero delle connessioni dipendono dalla sessione e dall'istanza. Le tre basi e i file restano disponibili dopo la prova: rimuovi solo le copie di laboratorio quando non servono più.

## Approfondimento

- PostgreSQL 18: [psql](https://www.postgresql.org/docs/18/app-psql.html), [pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html), [pg_restore](https://www.postgresql.org/docs/18/app-pgrestore.html), [pg_dumpall](https://www.postgresql.org/docs/18/app-pg-dumpall.html) e [manutenzione ordinaria](https://www.postgresql.org/docs/18/routine-vacuuming.html).

- [[Programmazione/PostgreSQL/Pagine/Comandi psql e Meta-comandi|Comandi psql e Meta-comandi]]
- [[Programmazione/PostgreSQL/Pagine/Backup e Ripristino|Backup e Ripristino]]
- [[Programmazione/PostgreSQL/Pagine/Manutenzione|Manutenzione]]
- [[Programmazione/PostgreSQL/Pagine/Metriche e alerting|Metriche e alerting]]
- [[Programmazione/PostgreSQL/Pagine/Slow query log|Slow query log]]
- [[Programmazione/PostgreSQL/Pagine/Driver e connection string|Driver e connection string]]


## Navigazione

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Indice Promemoria PostgreSQL]]
