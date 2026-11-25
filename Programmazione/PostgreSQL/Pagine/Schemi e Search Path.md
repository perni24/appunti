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
  - Schemi e Search Path
prerequisites: []
related: []
title: Schemi e Search Path
---

# Schemi e Search Path

## Sintesi

La connessione sceglie **un database**; dentro quel database gli schemi distinguono nomi come `vendite.ordini` e `archivio.ordini`. Un nome qualificato indica l'oggetto voluto. Per un nome non qualificato PostgreSQL consulta il `search_path`: cambiare l'ordine può cambiare il risultato senza modificare la query.

## Leggere il percorso effettivo

```sql
SELECT current_database(), current_setting('search_path') AS configurato,
       current_schema() AS schema_corrente, current_schemas(true) AS effettivo;
```

Il valore configurato può contenere `"$user"`: è un segnaposto per lo schema con il nome dell'utente corrente, non la garanzia che quello schema esista. Gli schemi inesistenti o senza `USAGE` vengono ignorati. `current_schemas(true)` include anche quelli impliciti, ad esempio `pg_catalog`. Il primo schema effettivo di creazione è visibile con `current_schema()`: senza `CREATE` su di esso la creazione fallisce, non ripiega sul successivo.

## Esempio: stesso nome, due risultati

Esegui questo blocco nel database di prova, con il diritto di crearvi schemi e con i due nomi liberi. Nessuna modifica resta dopo `ROLLBACK`.

```sql
BEGIN;
CREATE SCHEMA lab_vendite;
CREATE SCHEMA lab_archivio;
CREATE TABLE lab_vendite.ordini (id integer);
CREATE TABLE lab_archivio.ordini (id integer);
INSERT INTO lab_vendite.ordini VALUES (10);
INSERT INTO lab_archivio.ordini VALUES (20);
SET LOCAL search_path = lab_vendite, lab_archivio;
SELECT id FROM ordini;
SET LOCAL search_path = lab_archivio, lab_vendite;
SELECT id FROM ordini;
SELECT id FROM lab_vendite.ordini;
ROLLBACK;
```

Attesi, nell'ordine: `10`, `20`, `10`. Non ci sono stati né spostamenti né copie di tabelle. Qualificare i nomi rende esplicita la dipendenza nelle migrazioni e nelle query che devono puntare sempre allo stesso oggetto.

## Schemi e permessi

- `USAGE` permette di risolvere nomi nello schema; per accedere ai dati serve anche il privilegio sull'oggetto. Dividere per schema moduli, estensioni o tenant non li isola automaticamente.
- Includi nel percorso solo schemi i cui creatori siano fidati. `public` è uno schema; `PUBLIC` è l'insieme dei ruoli. Nei nuovi database con i default di PostgreSQL 15 e successivi `PUBLIC` non ha `CREATE` su `public`; database aggiornati o personalizzati possono avere ACL diverse. Ispezionale prima di revocare un privilegio usato dalle applicazioni.
- Una funzione `SECURITY DEFINER` usa i privilegi del proprietario. Preferisci il normale `SECURITY INVOKER` quando basta. Se la delega è necessaria, fissa un percorso composto da schemi fidati e `pg_temp` esplicito per ultimo, qualifica gli oggetti e limita `EXECUTE` ai ruoli previsti. Il solo nome «safe» o la presenza di `SET search_path` non rende sicura una funzione.

**Fonti:** [schemi e risoluzione dei nomi](https://www.postgresql.org/docs/18/ddl-schemas.html) e [precauzioni per SECURITY DEFINER](https://www.postgresql.org/docs/18/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Gestione Utenti e Ruoli|Gestione Utenti e Ruoli]]
- [[Programmazione/PostgreSQL/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
- [[Programmazione/PostgreSQL/Pagine/Sicurezza delle estensioni|Sicurezza delle estensioni]]
