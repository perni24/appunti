---
date: 2026-03-15
tags:
  - database
  - postgres
  - performance
  - architecture
  - partitioning
type: #permanent-note
status: evergreen
---

# Partitioning in PostgreSQL

Il **Table Partitioning** è una tecnica che permette di suddividere logicamente una tabella di grandi dimensioni (la tabella "parent") in pezzi fisici più piccoli (le "partizioni").

## 💡 Concetto Chiave
In PostgreSQL, il partizionamento moderno è chiamato **Declarative Partitioning**. L'obiettivo principale è migliorare le performance di query e manutenzione su dataset massivi (centinaia di GB o TB), permettendo al database di leggere solo le porzioni di dati strettamente necessarie.

---

## 🏗️ Metodi di Partizionamento

Postgres supporta tre strategie principali:

### 1. Range Partitioning
I dati sono divisi in intervalli basati su una colonna (tipicamente date o ID numerici).
```sql
CREATE TABLE ordini (
    id int,
    data_ordine date NOT NULL,
    totale decimal
) PARTITION BY RANGE (data_ordine);

-- Creazione di una partizione specifica
CREATE TABLE ordini_2023_01 PARTITION OF ordini
    FOR VALUES FROM ('2023-01-01') TO ('2023-02-01');
```

### 2. List Partitioning
I dati sono divisi in base a una lista esplicita di valori discreti.
```sql
CREATE TABLE utenti (
    id int,
    nazione text
) PARTITION BY LIST (nazione);

CREATE TABLE utenti_italia PARTITION OF utenti
    FOR VALUES IN ('Italia');
```

### 3. Hash Partitioning
I dati sono distribuiti uniformemente tra un numero fisso di partizioni tramite una funzione hash. Ideale per bilanciare il carico I/O.
```sql
CREATE TABLE log_accessi (
    id int,
    messaggio text
) PARTITION BY HASH (id);

CREATE TABLE log_p0 PARTITION OF log_accessi FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE log_p1 PARTITION OF log_accessi FOR VALUES WITH (MODULUS 4, REMAINDER 1);
```

---

## 🚀 Vantaggi: Partition Pruning

Il vantaggio principale in termini di performance è il **Partition Pruning**.

> [!INFO] Logic Layer: Pruning
> Il Query Planner analizza le clausole `WHERE` della query. Se la condizione riguarda la colonna di partizionamento (es. `WHERE data_ordine = '2023-01-15'`), il database **scarta a priori** tutte le partizioni che non contengono quei dati, riducendo drasticamente il numero di blocchi da leggere dal disco.

Per verificare se il pruning è attivo in un [[Programmazione/Postgres/Pagine/Analisi delle Query|EXPLAIN]], controlla se vengono scansionate solo le partizioni interessate.

---

## 🛠️ Gestione delle Partizioni (Maintenance)

Uno dei grandi vantaggi del partizionamento è la velocità di rimozione dei vecchi dati (es. log vecchi di 1 anno).

- **Eliminare dati:** Invece di una `DELETE` lenta (che genera molti WAL e [[Programmazione/Postgres/Pagine/MVCC|Vacuum overhead]]), puoi semplicemente staccare la partizione:
  ```sql
  ALTER TABLE ordini DETACH PARTITION ordini_2022_vecchi;
  DROP TABLE ordini_2022_vecchi; -- Istantaneo
  ```
- **Aggiungere dati:** Puoi preparare una tabella separata e poi "attaccarla" alla struttura partizionata.

---

## ⚠️ Limitazioni Importanti

> [!WARNING] Da considerare prima del design
> 1.  **Chiave Primaria:** La chiave primaria di una tabella partizionata deve obbligatoriamente includere la colonna di partizionamento.
> 2.  **Indici:** Gli indici creati sulla tabella parent vengono propagati alle partizioni, ma ogni partizione ha il suo indice fisico indipendente.
> 3.  **Vincoli:** Non è possibile creare un vincolo di integrità referenziale (Foreign Key) che punti a una tabella partizionata da un'altra tabella (fino alle versioni più recenti di Postgres, dove ci sono restrizioni specifiche).

---