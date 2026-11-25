---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: operational-note
status: non revisionato
publish: true
tags:
  - programmazione
  - postgres
  - migrazioni
aliases: []
prerequisites: []
related: []
title: Migrazioni schema
---

# Migrazioni schema

## Sintesi

Una migrazione porta il database da uno stato noto a quello richiesto dalla prossima versione. Prima di distribuire DDL, chiediti separatamente **quanto dura il lavoro**, **quale lock richiede** e **quale versione dell'app può ancora scrivere**. Una modifica veloce su una tabella vuota può aspettare a lungo un lock in produzione.

## Laboratorio: introdurre un vincolo su dati esistenti

Database di prova, con `psql` in autocommit e come proprietario degli oggetti. Esegui i blocchi in ordine. Usiamo volutamente un dato storico non valido per distinguere l'installazione del vincolo dalla sua validazione.

```sql
CREATE TABLE lab_mig_orders (id integer PRIMARY KEY, amount integer NOT NULL);
INSERT INTO lab_mig_orders VALUES (1, 20), (2, -5);
```

```sql
BEGIN;
SET LOCAL lock_timeout = '2s';
ALTER TABLE lab_mig_orders ADD CONSTRAINT lab_amount_positive
  CHECK (amount > 0) NOT VALID;
COMMIT;
```

Il secondo blocco non scansiona lo storico, ma deve acquisire il lock del DDL. Da questo momento le **nuove** righe e quelle aggiornate devono rispettare il check. `INSERT` con un importo negativo fallisce; la riga storica con `id=2` è ancora presente. `NOT VALID` non significa «vincolo spento».

```sql
SELECT id, amount FROM lab_mig_orders WHERE amount <= 0;
```

Se provassi a validare adesso, PostgreSQL rifiuterebbe la validazione. Nel laboratorio sappiamo che l'importo corretto per l'ordine 2 è 5. Nella realtà occorre una regola di dominio, non una correzione numerica arbitraria.

```sql
UPDATE lab_mig_orders SET amount = 5 WHERE id = 2 AND amount = -5;
```

```sql
ALTER TABLE lab_mig_orders VALIDATE CONSTRAINT lab_amount_positive;
```

```sql
SELECT convalidated FROM pg_constraint
WHERE conrelid = 'lab_mig_orders'::regclass AND conname = 'lab_amount_positive';
```

Atteso `true`. Validare in una **transazione successiva** evita di trattenere il lock più forte della fase iniziale durante la scansione. La validazione di questo check prende `SHARE UPDATE EXCLUSIVE`: permette il normale DML, ma può contendere risorse e lock con altre manutenzioni. `lock_timeout` limita l'attesa di un lock, non il costo totale della scansione.

## Indici e modifiche di colonne

Solo nel database di prova, **fuori da un blocco di transazione**:

```sql
CREATE INDEX CONCURRENTLY lab_mig_amount_idx ON lab_mig_orders (amount);
```

```sql
SELECT indisready, indisvalid FROM pg_index
WHERE indexrelid = 'lab_mig_amount_idx'::regclass;
```

Attesi due `true`. La creazione concorrente permette scritture durante la costruzione, ma richiede più lavoro e può attendere altre transazioni. Se fallisce può restare un indice invalido: controlla il catalogo e pianifica la rimozione o ricostruzione, non un nuovo tentativo cieco con `IF NOT EXISTS`. Con un runner che racchiude ogni file in una transazione, pianifica questo passo separatamente.

Per aggiungere una colonna, un default non volatile può evitare di riscrivere ogni riga su PostgreSQL 18; questo **non** elimina il lock del DDL. Per dati derivati da altre colonne, introduci prima il campo compatibile, aggiorna a batch e applica i vincoli solo quando tutte le versioni che scrivono rispettano il nuovo contratto. Verifica sia l'upgrade da dati reali sia l'avvio su schema vuoto.

## Fonti

[PostgreSQL 18: ALTER TABLE e validazione](https://www.postgresql.org/docs/18/sql-altertable.html) · [Creazione concorrente degli indici](https://www.postgresql.org/docs/18/sql-createindex.html#SQL-CREATEINDEX-CONCURRENTLY) · [Modifiche alle tabelle](https://www.postgresql.org/docs/18/ddl-alter.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Strategie zero-downtime|Strategie zero-downtime]]
- [[Programmazione/PostgreSQL/Pagine/Versionamento database|Versionamento database]]
- [[Programmazione/PostgreSQL/Pagine/Lock monitoring|Lock monitoring]]
