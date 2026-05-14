---
date: 2026-05-14
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Replicazione Fisica]
prerequisites: []
related: []
---
# Replicazione Fisica in PostgreSQL

## Sintesi

Nota su Replicazione Fisica in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.

La **Replicazione Fisica** (spesso chiamata *Streaming Replication*) è una tecnica che permette di creare una copia esatta, byte per byte, di un intero cluster PostgreSQL su uno o più server secondari (**Standby**).

## Concetto chiave
La replicazione fisica si basa sul flusso dei log [[Programmazione/Postgres/Pagine/Write-Ahead Logging|WAL]]. Il server Primario invia i suoi record WAL al server Standby, che li applica fedelmente ai propri file dei dati. Poiché la replica è a livello di disco, lo Standby è una copia identica (incluso lo schema, gli utenti e le configurazioni).

---

##  Architettura e Componenti

1.  **Primary (Master):** Il server che accetta query in lettura e scrittura.
2.  **Standby (Slave/Replica):** Il server che riceve i dati. Di default è in modalità **Hot Standby**, ovvero permette query in sola lettura.
3.  **WAL Sender:** Un processo sul Primario che invia i record WAL.
4.  **WAL Receiver:** Un processo sullo Standby che riceve i record dal Primario.

---

##  Modalità di Sincronizzazione

PostgreSQL permette di scegliere quanto "vicini" debbano essere i server:

### 1. Replicazione Asincrona (Default)
Il Primario conferma il `COMMIT` al client non appena il WAL è scritto sul proprio disco locale.
- **Pro:** Massime performance; il Primario non rallenta se lo Standby è lento o disconnesso.
- **Contro:** Rischio minimo di perdita dati (Data Loss) se il Primario crasha prima che lo Standby riceva gli ultimi record.

### 2. Replicazione Sincrona
Il Primario aspetta che lo Standby confermi di aver ricevuto e scritto i dati prima di confermare il `COMMIT` al client.
- **Pro:** Zero Data Loss. Ideale per sistemi finanziari.
- **Contro:** Performance ridotte dalla latenza di rete; se lo Standby cade, il Primario blocca tutte le scritture.

---

##  Casi d'Uso

1.  **High Availability (HA):** Se il Primario fallisce, uno Standby può essere promosso a nuovo Primario (**Failover**).
2.  **Read Scalability:** Puoi distribuire il carico delle query `SELECT` pesanti (reportistica, analisi) sui server Standby, lasciando il Primario libero per le transazioni `INSERT/UPDATE`.
3.  **Disaster Recovery:** Tenere una replica in un data center geograficamente distante.

---

##  Configurazione Rapida

Lo Standby viene creato inizialmente tramite un backup fisico (`pg_basebackup`) e poi configurato per connettersi al primario tramite una stringa di connessione (`primary_conninfo`).

> [!INFO] Slot di Replicazione (Replication Slots)
> È caldamente consigliato usare gli **Slot di Replicazione** sul Primario. Questi impediscono al Primario di eliminare i vecchi file WAL finché non è sicuro che lo Standby li abbia ricevuti, evitando che la replica "si rompa" se rimane spenta per troppo tempo.

---

## Logic layer: Replicazione Fisica vs Logica

| Caratteristica | Replicazione Fisica | [[Programmazione/Postgres/Pagine/Replicazione Logica|Replicazione Logica]] |
| :--- | :--- | :--- |
| **Granularità** | Intero Cluster (tutti i DB). | Singole tabelle o database. |
| **Versioni** | Stessa versione major di Postgres. | Versioni diverse (utile per upgrade). |
| **Sola Lettura** | Sì (Hot Standby). | Sì, ma permette anche scritture locali. |

---
