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
  - zero-downtime
aliases: []
prerequisites: []
related: []
title: Strategie zero-downtime
---

# Strategie zero-downtime

## Sintesi

Cambiare schema senza interrompere il servizio significa mantenere compatibili le versioni applicative che possono essere contemporaneamente attive. Il modello *expand and contract* separa aggiunta, trasferimento dei dati e rimozione. Non promette assenza di lock o latenza: serve un criterio per fermare ogni fase prima che il servizio ne risenta.

## Caso: cambiare nome a una colonna

Supponi che `email` e `notification_email` rappresentino **lo stesso valore**. Un `RENAME COLUMN` immediato romperebbe i client che usano ancora `email`. In questo esempio il vecchio campo resta autorevole fino al passaggio delle letture. Il laboratorio richiede un database di prova vuoto, con `psql` in autocommit.

**1. Espandi.** Le query vecchie devono usare i nomi delle colonne, non dipendere dalla posizione in `SELECT *` o dal formato di un'intera riga.

```sql
CREATE TABLE lab_contacts (id integer PRIMARY KEY, email text NOT NULL);
INSERT INTO lab_contacts (id, email) VALUES
  (1, 'uno@example.test'), (2, 'due@example.test'), (3, 'tre@example.test');
ALTER TABLE lab_contacts ADD COLUMN notification_email text;
```

**2. Rendi compatibili gli scrittori.** La versione intermedia legge ancora `email`, ma per ogni inserimento o modifica assegna lo stesso valore a entrambe le colonne nella stessa transazione. Esempio di aggiornamento:

```sql
UPDATE lab_contacts AS c
SET email = v.email, notification_email = v.email
FROM (VALUES (1, 'nuovo@example.test')) AS v(id, email)
WHERE c.id = v.id;
```

Prima di procedere, verifica che **tutti** gli scrittori (anche job e import) siano aggiornati o che esista una sincronizzazione equivalente provata. Un vecchio client può modificare solo `email` lasciando una `notification_email` **non nulla ma obsoleta**. Contare soltanto i nulli non rileva questo caso.

**3. Riallinea i dati in piccoli commit.** Ripeti lo statement seguente in transazioni separate. L'ordinamento per PK rende la scelta ripetibile; il predicato comprende anche i valori non nulli ma diversi. Il batch qui è minuscolo per mostrare il meccanismo.

```sql
WITH batch AS (
  SELECT id FROM lab_contacts
  WHERE notification_email IS DISTINCT FROM email
  ORDER BY id LIMIT 2 FOR UPDATE
)
UPDATE lab_contacts AS c SET notification_email = c.email
FROM batch WHERE c.id = batch.id
RETURNING c.id;
```

Con i primi due blocchi, il primo batch aggiorna gli ID 2 e 3 (l'ordine di `RETURNING` non è garantito); il successivo non restituisce righe. Su carichi reali stabilisci pause, dimensione dei batch e limiti di attesa osservando lock, WAL, replica e latenza. Un singolo commit per tutto il backfill vanifica il vantaggio dei batch.

**4. Cambia le letture solo quando i dati coincidono.**

```sql
SELECT count(*) AS differenze FROM lab_contacts
WHERE notification_email IS DISTINCT FROM email;
```

Atteso `0`. È un controllo in un preciso momento: vale come criterio di passaggio solo se gli scrittori mantengono l'invariante. Attiva le nuove letture gradualmente; durante la finestra di rollback continua ad aggiornare entrambi i campi. Se necessario, puoi tornare alle vecchie letture senza perdere gli aggiornamenti recenti.

**5. Trasferisci il vincolo.** Chiusa la finestra di rollback alle vecchie letture, tutti leggono il campo nuovo e tutti gli scrittori ancora attivi lo valorizzano. Mantieni il requisito originale di indirizzo obbligatorio sul nuovo campo. In autocommit, così la validazione non trattiene il lock del primo DDL:

```sql
ALTER TABLE lab_contacts ADD CONSTRAINT lab_notification_present
  CHECK (notification_email IS NOT NULL) NOT VALID;
ALTER TABLE lab_contacts VALIDATE CONSTRAINT lab_notification_present;
ALTER TABLE lab_contacts
  ALTER COLUMN notification_email SET NOT NULL,
  ALTER COLUMN email DROP NOT NULL;
```

Ora lo scrittore intermedio può ancora aggiornare entrambi i campi, mentre la nuova app può omettere quello vecchio. Da questo punto il controllo di uguaglianza non è più il criterio giusto: il campo autorevole è solo quello nuovo.

```sql
INSERT INTO lab_contacts (id, notification_email) VALUES (6, 'sei@example.test');
```

**6. Contrai in un rilascio successivo.** Aspetta che anche gli scrittori intermedi siano stati ritirati; verifica viste, report e code di job. Solo nel laboratorio, dopo questi controlli:

```sql
ALTER TABLE lab_contacts DROP COLUMN email, DROP CONSTRAINT lab_notification_present;
```

È un passo distruttivo: i valori della vecchia colonna vengono eliminati. Il nuovo `NOT NULL` rimane; il vecchio binario non è più compatibile. In produzione prevedi un limite all'attesa del lock, senza aggiungere `CASCADE` per ignorare dipendenze inattese.

## Cosa significa «senza downtime»

Un indice `CONCURRENTLY` e un check `NOT VALID` poi validato riducono alcune interferenze, ma non correggono un protocollo di scrittura incoerente. Prima del rollout prova la coesistenza delle versioni; durante il rollout controlla errori dei client e differenze dei dati; dopo verifica che nessuno usi ancora lo schema precedente. Un test funzionale dimostra compatibilità nel caso provato, non garantisce un SLA sotto carico.

## Fonti

[PostgreSQL 18: modifica delle tabelle](https://www.postgresql.org/docs/18/sql-altertable.html) · [SELECT e blocco delle righe](https://www.postgresql.org/docs/18/sql-select.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Migrazioni schema|Migrazioni schema]]
- [[Programmazione/PostgreSQL/Pagine/Versionamento database|Versionamento database]]
- [[Programmazione/PostgreSQL/Pagine/Lock monitoring|Lock monitoring]]
