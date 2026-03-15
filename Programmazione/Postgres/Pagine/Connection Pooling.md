---
date: 2026-03-15
tags:
  - database
  - postgres
  - scalabilita
  - performance
  - pooling
type: #permanent-note
status: evergreen
---

# Connection Pooling in PostgreSQL

Il **Connection Pooling** è una tecnica fondamentale per gestire le connessioni al database in modo efficiente, specialmente in applicazioni ad alto traffico.

## 💡 Concetto Chiave
Poiché PostgreSQL utilizza un modello [[Programmazione/Postgres/Pagine/Modello Client-Server|Process-per-Connection]], ogni nuova connessione crea un processo backend sul server. Questo processo è costoso in termini di memoria e tempo di CPU. Il Connection Pooling risolve il problema mantenendo un "pool" di connessioni aperte e riutilizzandole per diverse richieste client, evitando il costo di creazione/distruzione continua.

---

## 🏗️ Perché è necessario?

Senza un pooler, un'applicazione web con migliaia di utenti simultanei potrebbe saturare rapidamente le risorse del server:
- **Consumo RAM:** Ogni processo backend consuma circa 10-20MB di RAM.
- **Overhead Fork:** Creare un nuovo processo è un'operazione lenta a livello di Sistema Operativo.
- **Context Switching:** Troppi processi attivi costringono la CPU a cambiare continuamente contesto, riducendo il throughput globale.

---

## 🛠️ Strumenti Principali

### 1. PgBouncer
Il pooler più leggero e diffuso. Agisce come un proxy tra l'applicazione e Postgres.
- **Session Pooling:** La connessione è assegnata al client per tutta la durata della sessione.
- **Transaction Pooling:** (Il più comune) La connessione viene restituita al pool non appena finisce una transazione. Permette a migliaia di client di condividere poche decine di connessioni reali.

### 2. pgcat
Un pooler moderno scritto in Rust, progettato per gestire carichi massivi e offrire funzionalità avanzate come lo sharding e il bilanciamento del carico tra repliche.

### 3. Pooler Applicativi (es. HikariCP, Prisma, SQLAlchemy)
Molti framework includono un pooler interno. Tuttavia, in architetture a microservizi, un pooler lato server (come PgBouncer) è spesso preferibile per centralizzare la gestione dei limiti.

---

## ⚙️ Modalità di Pooling (PgBouncer)

| Modalità | Quando usarla | Note |
| :--- | :--- | :--- |
| **Session** | App legacy o connessioni lunghe. | Poco efficiente per alte concorrenze. |
| **Transaction** | **Best practice** per web app. | Non permette l'uso di `SET` o `LISTEN/NOTIFY` persistenti. |
| **Statement** | Casi estremi. | Non permette transazioni multi-statement. |

---

## 🚀 Logic Layer: Quando implementarlo?

> [!TIP] Regola del Pollice
> Se il numero di connessioni simultanee della tua applicazione supera regolarmente le 50-100, l'introduzione di **PgBouncer** porterà un miglioramento immediato delle performance e una riduzione del carico sulla CPU del server database.

---