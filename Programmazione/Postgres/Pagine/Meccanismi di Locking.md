---
date: 2026-03-15
tags:
  - database
  - postgres
  - concurrency
  - locking
type: #permanent-note
status: evergreen
---

# Meccanismi di Locking in PostgreSQL

Sebbene il sistema [[Programmazione/Postgres/Pagine/MVCC|MVCC]] permetta a lettori e scrittori di non bloccarsi a vicenda, esistono situazioni in cui PostgreSQL deve utilizzare dei **Lock** (blocchi) per garantire l'integrità dei dati, specialmente quando più transazioni tentano di modificare le stesse risorse contemporaneamente.

## 💡 Concetto Chiave
I lock sono meccanismi di sincronizzazione che impediscono a transazioni concorrenti di interferire tra loro in modi che violerebbero le [[Programmazione/Postgres/Pagine/Proprietà ACID|Proprietà ACID]]. PostgreSQL gestisce i lock in modo granulare, dal livello di singola riga fino all'intera tabella.

---

## 🏛️ Livelli di Locking

### 1. Table-Level Locks (Blocchi a livello di Tabella)
Questi lock controllano l'accesso a un'intera tabella. Non bloccano necessariamente tutte le operazioni, ma regolano la compatibilità tra comandi DDL (es. `ALTER TABLE`) e DML (es. `INSERT`).

| Modo | Innescato da | Compatibilità |
| :--- | :--- | :--- |
| **Access Share** | `SELECT` | Compatibile con tutto tranne `Access Exclusive`. |
| **Row Exclusive** | `INSERT`, `UPDATE`, `DELETE` | Permette letture e altre scritture concorrenti su righe diverse. |
| **Access Exclusive** | `ALTER TABLE`, `DROP TABLE`, `VACUUM FULL` | Blocca **qualsiasi** altro accesso alla tabella (anche letture). |

### 2. Row-Level Locks (Blocchi a livello di Riga)
PostgreSQL non memorizza i lock di riga in memoria (che saturerebbe la RAM), ma li scrive direttamente nella riga stessa (nel file dei dati).

- **FOR UPDATE:** Blocca la riga per una futura modifica. Altre transazioni che tentano di fare `UPDATE`, `DELETE` o `SELECT FOR UPDATE` sulla stessa riga dovranno attendere.
- **FOR SHARE:** Permette ad altre transazioni di leggere la riga, ma impedisce loro di modificarla finché il lock non viene rilasciato.

```sql
-- Esempio: Prenotazione di una riga per evitare race conditions
BEGIN;
SELECT * FROM conti WHERE id = 1 FOR UPDATE;
-- Esegui logica di business...
UPDATE conti SET bilancio = bilancio - 100 WHERE id = 1;
COMMIT;
```

---

## 🧩 Advisory Locks (Blocchi Consultivi)
Sono lock definiti dall'applicazione. Il database non li impone automaticamente; è lo sviluppatore che decide quando acquisirli.

- **Uso:** Sincronizzare operazioni che non riguardano direttamente una riga di tabella (es. impedire che due processi worker eseguano lo stesso report pesante contemporaneamente).
- **Funzioni:** `pg_advisory_lock(id)`, `pg_try_advisory_lock(id)`.

---

## ⚠️ Deadlocks (Stallo)
Un deadlock si verifica quando due transazioni si bloccano a vicenda aspettando un lock detenuto dall'altra.

> [!INFO] Rilevamento Automatico
> PostgreSQL ha un detector di deadlock interno. Se rileva uno stallo (dopo un timeout definito da `deadlock_timeout`), interrompe forzatamente una delle transazioni coinvolte per permettere all'altra di procedere.

---

## 🚀 Logic Layer: Best Practices

1.  **Ordine Costante:** Accedi sempre alle tabelle (e alle righe) nello stesso ordine logico per minimizzare il rischio di deadlock.
2.  **Transazioni Brevi:** Mantieni i lock per il minor tempo possibile. Non includere chiamate a API esterne o input utente all'interno di una transazione che detiene lock pesanti.
3.  **Usa `SKIP LOCKED`:** In sistemi di code (queues), usa `SELECT ... FOR UPDATE SKIP LOCKED` per permettere a più worker di processare righe diverse senza bloccarsi a vicenda.

---