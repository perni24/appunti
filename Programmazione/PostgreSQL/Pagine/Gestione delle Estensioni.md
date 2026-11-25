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
  - Gestione delle Estensioni
prerequisites: []
related: []
title: Gestione delle Estensioni
---

# Gestione delle Estensioni

## Sintesi

Un'estensione raggruppa oggetti SQL, per esempio tipi, operatori o funzioni, in un pacchetto con un nome e una versione. **Disponibile sul server** significa che PostgreSQL trova i file necessari; **installata nel database corrente** significa che `CREATE EXTENSION` ne ha creato gli oggetti in quel database. Un altro database dello stesso cluster può avere un insieme di estensioni diverso.

## Verificare prima di installare

Il primo blocco è di sola lettura. Confronta la versione predefinita fra quelle disponibili e la versione realmente installata.

```sql
SELECT name, default_version, installed_version
FROM pg_available_extensions WHERE name IN ('pgcrypto', 'uuid-ossp') ORDER BY name;
```

Una riga con `installed_version IS NULL` indica «disponibile ma non installata qui». Nessuna riga per un nome significa che non è tra le estensioni disponibili segnalate dal server: controlla pacchetti, versione del server e restrizioni del provider. `pg_extension` è invece il catalogo delle estensioni **già installate**. Non usare `CREATE EXTENSION IF NOT EXISTS` come prova che versione e schema corrispondano alla tua migrazione.

## Laboratorio: una funzione nativa e una dell'estensione

Su PostgreSQL 18 puoi generare un UUID casuale v4 senza installare né `uuid-ossp` né `pgcrypto`. Il blocco seguente è indipendente e non scrive dati:

```sql
SELECT pg_typeof(pg_catalog.gen_random_uuid()) AS result_type;
```

Risultato: `uuid`. Questo **non** dimostra che `pgcrypto` sia installata. Per provarne una funzione specifica, usa il laboratorio seguente solo in un database di prova dove `pgcrypto` è disponibile ma **non ancora installata**, con privilegi di creazione adeguati e nome schema libero. Non rimuovere un'installazione esistente per riprodurre la prova.

```sql
BEGIN;
CREATE SCHEMA lab_ext_demo;
CREATE EXTENSION pgcrypto WITH SCHEMA lab_ext_demo;
SELECT e.extname, n.nspname FROM pg_extension AS e
JOIN pg_namespace AS n ON n.oid = e.extnamespace WHERE e.extname = 'pgcrypto';
SELECT octet_length(lab_ext_demo.digest('appunti', 'sha256')) AS digest_bytes;
ROLLBACK;
```

Il catalogo indica `pgcrypto` nello schema `lab_ext_demo`; `digest` produce **32 byte**, non una stringa di 32 caratteri. Il rollback annulla schema e installazione. Gli oggetti vengono creati in uno schema, ma il nome di un'estensione è unico nel database: non puoi installarne due copie in due schemi dello stesso database.

## Aggiornamenti, rimozione e ambienti

1. Prima della migrazione controlla disponibilità, versione richiesta, privilegi e dipendenze in sviluppo e produzione. Un'estensione inclusa nei pacchetti contrib non diventa per questo una funzione nativa. Moduli di monitoraggio possono richiedere anche configurazione o precaricamento sul server.
2. Per un aggiornamento servono i file e un percorso di upgrade fornito dall'estensione. `ALTER EXTENSION nome UPDATE` aggiorna gli oggetti **nel database corrente**; aggiornare solo i binari del server non basta. Verifica `extversion` in `pg_extension` dopo la migrazione.
3. `DROP EXTENSION` è distruttivo: elimina gli oggetti membri; normalmente fallisce se ci sono oggetti esterni che ne dipendono. `CASCADE` può eliminare anche questi ultimi. Controlla dipendenze e ripristino prima di procedere, non trattare la rimozione come un innocuo inverso dell'installazione.

**Fonti PostgreSQL 18:** [CREATE EXTENSION](https://www.postgresql.org/docs/18/sql-createextension.html), [ALTER EXTENSION](https://www.postgresql.org/docs/18/sql-alterextension.html), [funzioni UUID native](https://www.postgresql.org/docs/18/functions-uuid.html), [pgcrypto](https://www.postgresql.org/docs/18/pgcrypto.html).

## PostGIS

PostGIS aggiunge tipi e operazioni spaziali. Prima di chiedere «quali punti sono entro un chilometro?», scegli il sistema di riferimento e l'unità: con `geometry` la distanza usa l'unità delle coordinate, con `geography` la soglia di `ST_DWithin` è in metri. Con longitudine e latitudine WGS 84 non trattare un grado come un metro.

Prerequisito: estensione `postgis` attiva nel database di prova, con tipi e funzioni nello `search_path`. Nell'esempio il primo numero del punto è la **longitudine**, il secondo la latitudine; entrambe le coordinate sono già in WGS 84.

```sql
WITH luoghi(nome, posizione) AS (
  VALUES ('vicino', 'SRID=4326;POINT(12.005 45)'::geography),
         ('lontano', 'SRID=4326;POINT(12.100 45)'::geography)
)
SELECT nome FROM luoghi
WHERE ST_DWithin(posizione, 'SRID=4326;POINT(12 45)'::geography, 1000);
```

Atteso: solo `vicino`. Su una tabella grande, `ST_DWithin` può sfruttare un indice spaziale GiST compatibile sulla colonna; verificarlo con `EXPLAIN`. `ST_SetSRID` **etichetta** le coordinate, non le converte: per riproiettare una geometria con riferimento sorgente noto si usa `ST_Transform`. [PostGIS: ST_DWithin](https://postgis.net/docs/ST_DWithin.html) · [ST_SetSRID](https://postgis.net/docs/ST_SetSRID.html).

## pgvector

Il progetto si chiama **pgvector**, ma l'estensione da abilitare nel database si chiama **`vector`**. Memorizza vettori e confronta le loro distanze: non genera gli embedding. Confronta vettori della stessa dimensione prodotti con modelli e preprocessing compatibili.

Esempio di ricerca **esatta**, con `vector` attiva e visibile nello `search_path`. La domanda è «quali due punti hanno la distanza euclidea minima dal vettore di ricerca?».

```sql
WITH esempi(id, embedding) AS (
  VALUES (1, '[1,0,0]'::vector(3)), (2, '[2,0,0]'::vector(3)),
         (3, '[0,1,0]'::vector(3))
)
SELECT id, embedding <-> '[1,0,0]'::vector(3) AS distanza
FROM esempi ORDER BY distanza, id LIMIT 2;
```

Attesi `1, 0` e `2, 1`. Con la distanza coseno (`<=>`) i primi due vettori avrebbero invece distanza zero dal target: hanno la stessa direzione, ma diversa lunghezza. Scegli la metrica prima dell'indice. HNSW e IVFFlat accelerano ricerche **approssimate**: per la distanza L2 usa la classe `vector_l2_ops`, per il coseno `vector_cosine_ops`. Su dati reali confronta gli ID trovati con il risultato esatto, non solo la latenza. Per un indice di vicinanza usa un ordinamento crescente direttamente sull'operatore di distanza con `LIMIT`. [pgvector 0.8.2: distanze, ricerca esatta e indici](https://github.com/pgvector/pgvector/tree/v0.8.2).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/uuid-ossp e pgcrypto|uuid-ossp e pgcrypto]]
- [[Programmazione/PostgreSQL/Pagine/Sicurezza delle estensioni|Sicurezza delle estensioni]]
- [[Programmazione/PostgreSQL/Pagine/Full Text Search|Full Text Search]]
