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
  - Backup e Ripristino
prerequisites: []
related: []
title: Backup e Ripristino in PostgreSQL
---

# Backup e Ripristino in PostgreSQL

## Sintesi

Scegli il backup a partire dalla domanda di ripristino: «mi serve un database su un'altra istanza» non è la stessa cosa di «devo riportare l'intero cluster a prima di una cancellazione». L'**RPO** dice quanti dati recenti puoi perdere; l'**RTO** quanto tempo hai per rendere il servizio nuovamente utilizzabile. Misura entrambi con una prova di ripristino, non con la sola durata del job di backup.

| Obiettivo | Strumento | Limite da ricordare |
| --- | --- | --- |
| Esportare schema e dati di un database | `pg_dump` | Snapshot logico coerente del singolo database; non include ruoli e tablespace del cluster |
| Conservare oggetti globali | `pg_dumpall --globals-only` | Non contiene i dati delle tabelle; proteggi il file, specialmente se include verificatori di password |
| Ripristinare il cluster a un punto precedente | Backup fisico compatibile più WAL continuo | Non si applica un archivio WAL a un dump SQL; si recupera il cluster, non una sola tabella |

## pg_dump e pg_restore

Laboratorio PostgreSQL 18, da una directory privata vuota. Usa solo un'istanza di prova, con connessione e autenticazione già configurate e un ruolo autorizzato a creare database. I due nomi devono essere liberi. I comandi esterni si eseguono nel terminale; i blocchi SQL nel database indicato. Il ripristino **non** usa `--clean` e non sovrascrive la sorgente.

Crea il database di partenza:

```bash
createdb --template=template0 lab_backup_src
```

Solo su **lab_backup_src**, prepara una tabella e due righe confermate:

```sql
CREATE TABLE public.orders (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  amount integer NOT NULL CHECK (amount > 0)
);
INSERT INTO public.orders (amount) VALUES (15), (25);
```

Produci l'archivio custom, poi ispezionane l'indice:

```bash
pg_dump --format=custom --file=orders.dump --dbname=lab_backup_src
```

```bash
pg_restore --list orders.dump
```

Cerca le voci relative a tabella, dati, sequenza e chiave primaria. Un indice leggibile non prova che il restore termini. Crea una destinazione vuota e importa in un'unica transazione:

```bash
createdb --template=template0 lab_backup_dst
```

```bash
pg_restore --single-transaction --exit-on-error --dbname=lab_backup_dst orders.dump
```

Solo su **lab_backup_dst**, verifica il contenuto e la generazione del prossimo ID:

```sql
SELECT count(*) AS ordini, sum(amount) AS totale FROM public.orders;
INSERT INTO public.orders (amount) VALUES (30) RETURNING id;
```

Attesi `2, 40` e poi `3`. L'inserimento modifica solo la copia. In un restore applicativo prova anche vincoli, estensioni, proprietari, grant e una richiesta con il vero ruolo runtime. Per preservare ownership e ACL su un altro cluster, predisponi prima i ruoli richiamati dal dump e le librerie necessarie. `--no-owner` e `--no-acl` cambiano il risultato: non usarli solo per far scomparire gli errori.

## Formati e oggetti globali

Un dump **plain** è uno script: crealo con `pg_dump --format=plain --file=app.sql app_db` e ripristinalo su un database vuoto con `psql -X -v ON_ERROR_STOP=1 -d restored_db -f app.sql`, non con `pg_restore`. Usa nomi liberi e percorsi espliciti: `--file` può sovrascrivere un file. Il formato **directory** consente un dump parallelo (`-Fd -j 4`); il restore parallelo con `pg_restore -j` è possibile da directory o custom, ma non insieme a `--single-transaction`. Dimensiona la concorrenza sullo storage e prova il comportamento in caso di errore.

Per inventariare i globali senza esportare i verificatori delle password:

```bash
pg_dumpall --globals-only --no-role-passwords --file=globals.sql
```

Il file è comunque sensibile. Esaminalo prima dell'uso su un altro cluster: i ruoli possono già esistere, i percorsi dei tablespace possono non corrispondere e le credenziali vanno predisposte separatamente. Ripristina soltanto backup di origine fidata: un dump può contenere codice SQL che verrà eseguito.

## Prova di recupero

Conserva copie e chiavi con accessi separati dal primario, monitora l'età dell'ultimo backup riuscito e definisci la retention. Per un backup fisico, `pg_verifybackup` verifica il manifest e altri aspetti della copia, non sostituisce l'avvio di un cluster ripristinato. Per recuperare fino a un istante successivo al backup, segui [[Programmazione/PostgreSQL/Pagine/Write-Ahead Logging#Point-in-Time Recovery|la prova di Point-in-Time Recovery]]. Barman o pgBackRest possono gestire copie, archiviazione e retention: il criterio di successo resta recuperare i dati richiesti entro gli obiettivi.

## Fonti

[PostgreSQL 18: pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html) · [pg_restore](https://www.postgresql.org/docs/18/app-pgrestore.html) · [pg_dumpall](https://www.postgresql.org/docs/18/app-pg-dumpall.html) · [pg_verifybackup](https://www.postgresql.org/docs/18/app-pgverifybackup.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Write-Ahead Logging|Write-Ahead Logging]]
- [[Programmazione/PostgreSQL/Pagine/Replicazione Fisica|Replicazione Fisica]]
- [[Programmazione/PostgreSQL/Pagine/Manutenzione|Manutenzione]]
