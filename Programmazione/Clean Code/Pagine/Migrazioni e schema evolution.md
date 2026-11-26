---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - clean-code
  - database
  - migrazioni
aliases:
  - Migrazioni e schema evolution
  - Schema evolution
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Query leggibili]]"
  - "[[Programmazione/Clean Code/Pagine/Codice pronto al deploy]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Repository pattern]]"
  - "[[Programmazione/Clean Code/Pagine/Configurazione applicativa]]"
  - "[[Programmazione/Clean Code/Pagine/Test di integrazione]]"
title: Migrazioni e schema evolution
---

# Migrazioni e schema evolution

## Sintesi

Una migrazione è compatibile solo se lo sono **sia i lettori sia gli scrittori ancora in servizio**, inclusi job e script. Aggiungere una colonna e copiarvi i dati non basta: una vecchia replica può aggiornare il dato originale dopo la copia e rendere obsoleto il nuovo valore.

## Caso: da name a display_name

Esempio SQLite su un database di prova. Il punto di partenza è `customers(id INTEGER PRIMARY KEY, name TEXT NOT NULL)`, senza indici aggiuntivi, trigger, viste o tabelle referenzianti. Il significato del campo non cambia. Lo schema reale potrebbe avere oggetti da ricostruire e dipendenze da verificare.

### 1. Espandere senza rompere la versione vecchia

Una migrazione DDL versionata viene applicata **una volta**:

```sql
ALTER TABLE customers ADD COLUMN display_name TEXT;
```

La versione vecchia continua a leggere e scrivere solo `name` (con liste di colonne esplicite). La versione di transizione **legge ancora `name`** e scrive entrambe le colonne nella stessa istruzione, sia sugli inserimenti sia sugli aggiornamenti. Per esempio, quando cambia un nome:

```sql
UPDATE customers SET name = :value, display_name = :value WHERE id = :id;
```

### 2. Ritirare i vecchi scrittori e riconciliare

Solo quando non rimane chi scrive esclusivamente `name`, questo campo può fare da sorgente per la riconciliazione finale. Un backfill anticipato non elimina quel passaggio. Qui `IS NOT` confronta anche i valori nulli; limitarsi a `WHERE display_name IS NULL` lascerebbe intatte le copie **non nulle ma obsolete**.

```sql
UPDATE customers SET display_name = name WHERE display_name IS NOT name;
```

```sql
SELECT count(*) AS mismatches FROM customers WHERE display_name IS NOT name;
```

Il backfill è ripetibile: senza altri cambiamenti il secondo passaggio non aggiorna righe. Su una tabella grande procedi per intervalli di chiavi e osserva blocchi e tempi. Con zero divergenze e soli scrittori compatibili puoi distribuire lettori di `display_name` mantenendo la doppia scrittura. In questa finestra il rollback ai lettori di `name` è possibile; ripristinare un vecchio **scrittore** richiede di ripetere la riconciliazione prima del successivo cambio di lettura.

### 3. Contrarre solo dopo la finestra di compatibilità

**Passaggio distruttivo, non da lanciare su dati reali come esercizio.** Questa variante sceglie una finestra di manutenzione: ferma accessi e job, ritira il codice che usa `name` e verifica copia di sicurezza ripristinabile e zero divergenze. Ricostruisci la tabella per conservare il vincolo `NOT NULL` anche sulla nuova colonna:

```sql
BEGIN IMMEDIATE;
CREATE TABLE customers_next (id INTEGER PRIMARY KEY, display_name TEXT NOT NULL);
INSERT INTO customers_next (id, display_name) SELECT id, display_name FROM customers;
DROP TABLE customers;
ALTER TABLE customers_next RENAME TO customers;
COMMIT;
```

Il runner deve fermarsi al primo errore ed eseguire il rollback se la transazione è ancora attiva. Riprendi il traffico solo con codice che legge **e scrive** il nuovo schema. Non passare agli inserimenti sulla sola `display_name` prima della contrazione: la vecchia `name NOT NULL` li rifiuterebbe.

## Cosa verificare

Prova una modifica effettuata dal vecchio codice **dopo** una prima doppia scrittura, poi verifica contenuti, ID e vincoli prima e dopo la contrazione. Una migrazione applicata su database vuoto non copre questa sequenza. Dopo la rimozione della colonna il solo rollback del binario non ripristina il vecchio contratto: serve una migrazione in avanti o un ripristino pianificato che tenga conto dei dati scritti nel frattempo.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Query leggibili|Query leggibili]]
- [[Programmazione/Clean Code/Pagine/Repository pattern|Repository pattern]]
- [[Programmazione/Clean Code/Pagine/Codice pronto al deploy|Codice pronto al deploy]]
- [[Programmazione/Clean Code/Pagine/Test di integrazione|Test di integrazione]]
- [[Programmazione/Clean Code/Pagine/Configurazione applicativa|Configurazione applicativa]]

## Fonti

- Martin Fowler, *Evolutionary Database Design*
- Pramod Sadalage, Scott Ambler, *Refactoring Databases*
- PostgreSQL Documentation, *Data Definition*
- [Martin Fowler e Pramod Sadalage: Evolutionary Database Design](https://martinfowler.com/articles/evodb.html)
- [SQLite: ALTER TABLE e procedura per modifiche generali dello schema](https://www.sqlite.org/lang_altertable.html#making_other_kinds_of_table_schema_changes)
