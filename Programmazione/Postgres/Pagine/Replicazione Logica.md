---
date: 2026-03-15
tags:
  - database
  - postgres
  - scalabilita
  - replication
  - logical
type: #permanent-note
status: evergreen
---

# Replicazione Logica in PostgreSQL

La **Replicazione Logica** è un metodo di replica basato sulla decodifica dei cambiamenti dei dati (INSERT, UPDATE, DELETE) a livello di singola riga, anziché a livello di blocchi fisici del disco come nella [[Programmazione/Postgres/Pagine/Replicazione Fisica|Replicazione Fisica]].

## 💡 Concetto Chiave
Introdotta in PostgreSQL 10, utilizza un modello **Publish-Subscribe**. Un server (Publisher) definisce quali dati rendere disponibili, e uno o più server (Subscriber) si connettono per ricevere quei dati. Questo permette una granularità estrema e la possibilità di replicare dati tra versioni diverse di Postgres.

---

## 🏗️ Architettura: Publication e Subscription

1.  **Publication:** Creata sul server sorgente. Può includere tutte le tabelle o solo una selezione specifica.
    ```sql
    CREATE PUBLICATION mia_pubblicazione FOR TABLE utenti, ordini;
    ```
2.  **Subscription:** Creata sul server destinazione. Si connette al Publisher e scarica i dati iniziali, per poi ricevere i cambiamenti in tempo reale.
    ```sql
    CREATE SUBSCRIPTION mia_sottoscrizione 
    CONNECTION 'host=sorgente_ip dbname=db_prod user=rep_user' 
    PUBLICATION mia_pubblicazione;
    ```

---

## 🚀 Vantaggi e Casi d'Uso

### 1. Upgrade Zero-Downtime
Poiché la replicazione logica può avvenire tra versioni major diverse (es. da Postgres 12 a 16), è lo strumento ideale per migrare dati su un nuovo server con un'interruzione minima del servizio.

### 2. Consolidamento Dati
È possibile replicare tabelle da più database sorgente in un unico database centrale per scopi di data warehousing o reportistica aggregata.

### 3. Replicazione Selettiva
A differenza della fisica, puoi decidere di replicare solo alcune tabelle "sensibili" o critiche, risparmiando banda e risorse sul Subscriber.

---

## ⚠️ Limitazioni e Requisiti

- **Replica Identity:** Ogni tabella replicata deve avere una **Primary Key** (o un indice univoco) affinché il Subscriber possa identificare correttamente quali righe aggiornare o eliminare.
- **Schema:** Lo schema delle tabelle (CREATE TABLE) deve essere creato manualmente sul Subscriber prima di attivare la sottoscrizione. La replicazione logica non replica i comandi DDL (cambiamenti di struttura).
- **Sequenze:** I valori delle sequenze (es. ID auto-incrementali) non vengono replicati automaticamente.

---

## 🚀 Logic Layer: Quando preferirla alla Fisica?

> [!TIP] Scegli la Replicazione Logica se:
> - Devi replicare solo un sottoinsieme di tabelle.
> - Devi unire dati da più server in uno solo.
> - Devi migrare i dati tra diverse versioni di PostgreSQL.
> - Vuoi che il Subscriber possa avere i propri indici locali o trigger diversi dal Publisher.

---