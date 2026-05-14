---
date: 2026-05-14
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Trigger e Event Trigger]
prerequisites: []
related: []
---
# Trigger e Event Trigger in PostgreSQL

## Sintesi

Nota su Trigger e Event Trigger in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.

## Concetto chiave
Un **Trigger** è una funzione speciale che viene invocata automaticamente dal database in risposta a determinati eventi legati ai dati (DML) o alla struttura (DDL). Sono strumenti potenti per far rispettare regole di business complesse, mantenere log di audit o sincronizzare tabelle correlate in modo trasparente all'applicazione.

---

##  Trigger Standard (DML)

I trigger standard agiscono su tabelle o viste e rispondono alle operazioni di `INSERT`, `UPDATE`, `DELETE` o `TRUNCATE`.

### 1. Fasi di Esecuzione
- **`BEFORE`**: Eseguito prima dell'operazione. Ideale per validare o modificare i dati prima che vengano scritti (es. calcolare un campo).
- **`AFTER`**: Eseguito dopo l'operazione. Usato per azioni che dipendono dal successo della scrittura (es. aggiornare una tabella di log).
- **`INSTEAD OF`**: Usato solitamente sulle **viste** per rendere scrivibile ciò che tecnicamente non lo sarebbe.

### 2. Granularità
- **`FOR EACH ROW`**: La funzione viene eseguita per ogni riga modificata (es. se aggiorni 100 righe, il trigger gira 100 volte).
- **`FOR EACH STATEMENT`**: La funzione viene eseguita una sola volta per l'intera operazione SQL.

---

##  Creazione di un Trigger

In Postgres, la creazione di un trigger richiede due passaggi: la definizione di una **Trigger Function** e il comando **CREATE TRIGGER**.

### Esempio: Audit Log dei Prezzi
Crea una funzione che usa le variabili speciali **`NEW`** (la riga in inserimento/aggiornamento) e **`OLD`** (la riga precedente).

```sql
# Trigger e Event Trigger in PostgreSQL

## Sintesi

Nota su Trigger e Event Trigger in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.
CREATE OR REPLACE FUNCTION log_cambio_prezzo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.prezzo <> OLD.prezzo THEN
        INSERT INTO audit_prezzi(prodotto_id, vecchio_prezzo, nuovo_prezzo)
        VALUES (OLD.id, OLD.prezzo, NEW.prezzo);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

# Trigger e Event Trigger in PostgreSQL

## Sintesi

Nota su Trigger e Event Trigger in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.
CREATE TRIGGER trg_audit_prezzi
AFTER UPDATE ON prodotti
FOR EACH ROW
EXECUTE FUNCTION log_cambio_prezzo();
```

---

##  Event Trigger (DDL)

A differenza dei trigger standard, gli **Event Trigger** sono globali a livello di database e rispondono a cambiamenti strutturali (DDL) come `CREATE TABLE`, `ALTER TYPE` o `DROP SCHEMA`.

- **Scope**: Database-wide.
- **Eventi principali**: `ddl_command_start`, `ddl_command_end`, `sql_drop`.
- **Utilizzo**: Implementare sistemi di controllo versioni degli schemi o impedire modifiche strutturali in ambienti di produzione critici.

---

## Logic layer: Automazione vs Logica Nascosta

> [!WARNING] Attenzione alla Complessità
> I trigger possono rendere difficile il debugging perché la loro esecuzione è "invisibile" per chi scrive la query. Un abuso di trigger può portare a:
> 1. **Calo di performance**: Specialmente con trigger `FOR EACH ROW` su grandi volumi di dati.
> 2. **Effetti collaterali**: Trigger che attivano altri trigger (concatenazione), creando logiche circolari o difficili da tracciare.

---

##  Best Practices
- **Preferisci i Vincoli**: Se puoi risolvere un problema con un vincolo (`CHECK`, `FOREIGN KEY`), non usare un trigger. È più veloce e chiaro.
- **Mantieni le funzioni snelle**: Le funzioni dei trigger devono essere il più rapide possibile per non rallentare le transazioni.
- **Gestisci i ritorni**: Una funzione `BEFORE` che ritorna `NULL` interrompe l'operazione per quella specifica riga.

---
