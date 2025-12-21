---
tags:
  - programmazione
  - postgres
  - teoria
argomento: "Comandi Base (CRUD)"
data: "2025-12-21"
stato: 📝 in_elaborazione
---

# Comandi Base (CRUD)

## 💡 Concetto Chiave
Le operazioni fondamentali per interagire con i dati in un database sono riassunte nell'acronimo **CRUD**: **C**reate (Inserimento), **R**ead (Lettura), **U**pdate (Aggiornamento), **D**elete (Cancellazione). In SQL, questi corrispondono rispettivamente a `INSERT`, `SELECT`, `UPDATE` e `DELETE`.

---

## 📝 Sintassi

### INSERT (Create)
```sql
INSERT INTO nome_tabella (colonna1, colonna2) VALUES (valore1, valore2);
```

### SELECT (Read)
```sql
SELECT colonna1, colonna2 FROM nome_tabella WHERE condizione;
```

### UPDATE (Update)
```sql
UPDATE nome_tabella SET colonna1 = nuovo_valore WHERE condizione;
```

### DELETE (Delete)
```sql
DELETE FROM nome_tabella WHERE condizione;
```

---

## 💻 Esempi Pratici

Utilizzando la tabella `utenti` creata in precedenza.

### Inserimento Dati
```sql
-- Inserimento singolo
INSERT INTO utenti (username, email) VALUES ('mario_rossi', 'mario@example.com');

-- Inserimento multiplo
INSERT INTO utenti (username, email) VALUES 
('luigi_verdi', 'luigi@example.com'),
('anna_bianchi', 'anna@example.com');

-- Inserimento con ritorno dell'ID generato
INSERT INTO utenti (username, email) VALUES ('new_user', 'new@test.com') RETURNING id;
```

### Lettura Dati
```sql
-- Seleziona tutto
SELECT * FROM utenti;

-- Filtro specifico
SELECT username FROM utenti WHERE is_active = true;

-- Ordinamento e Limite
SELECT * FROM utenti ORDER BY created_at DESC LIMIT 5;
```

### Aggiornamento Dati
```sql
-- Cambia email per un utente specifico
UPDATE utenti 
SET email = 'mario.new@example.com' 
WHERE username = 'mario_rossi';
```

### Cancellazione Dati
```sql
-- Cancella un utente specifico
DELETE FROM utenti WHERE id = 1;

-- Cancella tutti gli utenti inattivi (Attenzione!)
DELETE FROM utenti WHERE is_active = false;
```

---

## ⚙️ Funzionamento Interno (Teoria)
- **Query Planner:** Quando esegui una query, Postgres analizza le statistiche della tabella per decidere la strategia migliore (es. usare un indice o scansionare tutta la tabella "Sequential Scan").
- **ACID:** Ogni comando singolo in Postgres è implicitamente avvolto in una transazione. O tutto ha successo o tutto fallisce (Atomicità).
- **RETURNING:** Postgres supporta la clausola `RETURNING` per `INSERT`, `UPDATE` e `DELETE`, permettendo di ottenere i dati appena modificati senza fare una successiva `SELECT`.

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Da fare:** Usa sempre la clausola `WHERE` con `UPDATE` e `DELETE` per evitare di modificare/cancellare l'intera tabella accidentalmente.
- ✅ **Da fare:** Usa `RETURNING id` dopo un insert se ti serve subito la chiave primaria generata.
- ❌ **Da evitare:** `SELECT *` in produzione se non ti servono tutte le colonne. Seleziona solo ciò che serve per risparmiare banda e memoria.
- 💣 **Errori comuni:** Dimenticare il `WHERE` in un `DELETE` distrugge tutti i dati della tabella. Fai sempre prima una `SELECT` con la stessa `WHERE` per verificare cosa stai per cancellare.

---

## 📚 Riferimenti
- [Documentazione Ufficiale SQL Syntax](https://www.postgresql.org/docs/current/sql-commands.html)
- [[Tipi di Dati e Tabelle]]
- [[Query Avanzate]]
