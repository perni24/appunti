---
date: 2026-03-06
tags:
  - database
  - postgres
  - sql
  - integrita
type: #permanent-note
status: evergreen
---

# Vincoli (Constraints) in PostgreSQL

## 💡 Concetto Chiave
I **Vincoli** sono regole applicate alle colonne o alle tabelle per limitare il tipo di dati che possono essere inseriti. Il loro scopo fondamentale è garantire l'**Integrità dei Dati** (Data Integrity) a livello di database, impedendo che errori applicativi o inserimenti manuali corrompano la coerenza delle informazioni.

---

## 🏗️ Tipologie di Vincoli

### 1. NOT NULL
Garantisce che una colonna non possa contenere valori `NULL`.
```sql
CREATE TABLE utenti (
    id serial PRIMARY KEY,
    username text NOT NULL
);
```

### 2. UNIQUE
Assicura che tutti i valori in una colonna (o combinazione di colonne) siano distinti tra loro.
- **Nota:** Postgres crea automaticamente un indice per supportare questo vincolo.

### 3. PRIMARY KEY
Unisce `NOT NULL` e `UNIQUE`. Identifica univocamente ogni riga della tabella. Ogni tabella può avere una sola chiave primaria.

### 4. FOREIGN KEY (Integrità Referenziale)
Garantisce che un valore in una colonna corrisponda a un valore esistente in un'altra tabella.

```sql
CREATE TABLE ordini (
    id serial PRIMARY KEY,
    utente_id int REFERENCES utenti(id) ON DELETE CASCADE
);
```
**Referential Actions:**
- `ON DELETE CASCADE`: Se elimini l'utente, vengono eliminati anche i suoi ordini.
- `ON DELETE SET NULL`: Se elimini l'utente, il campo `utente_id` negli ordini diventa NULL.
- `ON DELETE RESTRICT`: Impedisce l'eliminazione dell'utente se ha ordini associati.

### 5. CHECK
Consente di definire espressioni booleane personalizzate che i dati devono soddisfare.
```sql
CREATE TABLE prodotti (
    prezzo numeric CHECK (prezzo > 0),
    sconto numeric CHECK (sconto >= 0 AND sconto < prezzo)
);
```

### 6. EXCLUSION (Esclusione)
Un vincolo avanzato di PostgreSQL che garantisce che, se due righe vengono confrontate su colonne specifiche usando determinati operatori, non tutte le uguaglianze siano vere contemporaneamente.
- **Esempio tipico:** Impedire la sovrapposizione di prenotazioni (range temporali).

---

## ⚙️ Logic Layer: Integrità Dichiarativa

L'utilizzo dei vincoli implementa l'**Integrità Dichiarativa**. 

> [!INFO] Perché nel Database e non nell'App?
> Sebbene sia possibile validare i dati nel codice dell'applicazione, i vincoli nel database sono l'ultima linea di difesa. Essi garantiscono la coerenza indipendentemente da quale applicazione o script acceda ai dati, proteggendo il sistema da bug software o accessi diretti via SQL.

---

## ⚠️ Best Practices
- **Nomi ai vincoli:** Assegna sempre un nome esplicito ai vincoli complessi (specialmente `CHECK` e `FOREIGN KEY`) per facilitare il debugging degli errori:
  `CONSTRAINT prezzo_positivo CHECK (prezzo > 0)`
- **Validazione differita:** Se necessario, i vincoli possono essere impostati come `DEFERRABLE`, permettendo di violarli temporaneamente durante una transazione e controllandoli solo al `COMMIT`.
- **Indici su FK:** Postgres non crea automaticamente indici sulle Foreign Key. È quasi sempre consigliabile crearli manualmente per velocizzare le JOIN e le operazioni di eliminazione.

---
