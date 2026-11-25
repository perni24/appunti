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
  - Installazione e Inizializzazione
prerequisites: []
related: []
title: Installazione e Inizializzazione
---

# Installazione e Inizializzazione

## Sintesi

Installare i **binari**, inizializzare un **cluster** e creare un **database** sono tre operazioni diverse. `psql` è un client: può funzionare anche su una macchina senza server locale. `initdb` crea i cataloghi condivisi, i database iniziali (`postgres`, `template0` e `template1`) e i file che servono all'avvio dell'istanza.

## Prima di iniziare

Se un pacchetto di sistema o un installer ha già configurato un servizio, collegati a quello: non eseguire nuovamente `initdb` sulla sua directory. Un container con volume persistente normalmente inizializza i dati solo al primo avvio; su un servizio gestito l'operazione spetta al provider. Per scegliere il pacchetto del sistema vedi i [download ufficiali](https://www.postgresql.org/download/).

La procedura seguente crea invece **un laboratorio locale separato**. Servono i binari PostgreSQL 18 nel `PATH`, una cartella di lavoro scrivibile e la porta `55432` libera. Esegui ogni comando dalla stessa cartella, come utente proprietario dei dati (non `root` su Unix). Non usare una directory di produzione. Se la porta è occupata, cambiala in **tutti** i comandi.

## Creare e avviare il cluster di prova

Controlla la versione del client installato; non è ancora una verifica del server:

```sh
psql --version
```

Inizializza una directory nuova o vuota. `-W` chiede la password iniziale di `lab_admin` senza inserirla nel comando. Il laboratorio usa UTF-8 e locale `C` per risultati riproducibili; in produzione scegli locale e regole di ordinamento adatti ai dati **prima** dell'inizializzazione.

```sh
initdb -D pg-lab-data -U lab_admin --locale=C --encoding=UTF8 --auth=scram-sha-256 -W
```

Avvia il server sull'indirizzo TCP di loopback. `-l` salva il log e `-w` aspetta l'avvio. Questo comando non registra un servizio di sistema.

```sh
pg_ctl -D pg-lab-data -l pg-lab.log -o "-h 127.0.0.1 -p 55432" -w start
```

## Creare il database e verificare la connessione

Una volta sola, crea `app_db` nel cluster appena avviato. `createdb` è un client che richiede il privilegio `CREATEDB` o equivalente. Qui il proprietario è `lab_admin`; **non** usare il superutente iniziale come identità runtime di un'applicazione.

```sh
createdb -h 127.0.0.1 -p 55432 -U lab_admin app_db
```

Apri una sessione sul database esplicito:

```sh
psql -X -h 127.0.0.1 -p 55432 -U lab_admin -d app_db
```

Nel prompt SQL verifica database, ruolo e versione del **server**. Se la connessione fallisce, controlla prima porta, log e regole di autenticazione, senza reinizializzare il cluster.

```sql
SELECT current_database() AS database, current_user AS ruolo,
       current_setting('server_version') AS versione_server;
```

Esci da `psql` con `\q`. Quando hai finito tutti gli esercizi, ferma **solo il laboratorio**: `fast` disconnette eventuali sessioni e annulla le relative transazioni aperte; i dati già confermati restano su disco.

```sh
pg_ctl -D pg-lab-data -m fast -w stop
```

Al prossimo uso ripeti solo l'avvio e la connessione: non servono né `initdb` né `createdb`. Prima di destinare un cluster a dati reali, configura ruoli, accessi e backup con prova di ripristino.

**Fonti:** [initdb](https://www.postgresql.org/docs/18/app-initdb.html) e [pg_ctl](https://www.postgresql.org/docs/18/app-pg-ctl.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/File System Layout e Data Directory|File System Layout e Data Directory]]
- [[Programmazione/PostgreSQL/Pagine/Configurazione|Configurazione]]
- [[Programmazione/PostgreSQL/Pagine/Gestione Utenti e Ruoli|Gestione Utenti e Ruoli]]
