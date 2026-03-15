---
date: 2026-03-15
tags:
  - database
  - postgres
  - transazioni
  - acid
type: #permanent-note
status: evergreen
---

# Proprietà ACID in PostgreSQL

In informatica, le proprietà **ACID** (Atomicity, Consistency, Isolation, Durability) rappresentano un insieme di caratteristiche che garantiscono che le transazioni del database vengano elaborate in modo affidabile.

## 💡 Concetto Chiave
PostgreSQL è un database relazionale **ACID-compliant**. Ciò significa che, indipendentemente da crash del sistema, errori di rete o accessi concorrenti, i dati rimarranno sempre in uno stato integro e coerente.

---

## 🅰️ Atomicità (Atomicity)
L'atomicità garantisce che una transazione sia trattata come un'unica unità "tutto o niente". Se una parte della transazione fallisce, l'intera transazione viene annullata (**Rollback**).

- **In Postgres:** Viene gestita tramite i comandi `BEGIN`, `COMMIT` e `ROLLBACK`.
- **Meccanismo:** PostgreSQL utilizza il [[Programmazione/Postgres/Pagine/Write-Ahead Logging (WAL)|Write-Ahead Logging (WAL)]] per tenere traccia dei cambiamenti prima che avvengano, permettendo di annullarli se necessario.

---

## Ⓒ Consistenza (Consistency)
La consistenza garantisce che una transazione porti il database da uno stato valido a un altro stato valido, rispettando tutti i vincoli definiti (regole di integrità).

- **In Postgres:** Viene garantita dall'applicazione rigorosa di:
	- [[Programmazione/Postgres/Pagine/Vincoli|Vincoli (Constraints)]]: NOT NULL, UNIQUE, CHECK.
	- Integrità Referenziale: Foreign Keys.
	- Tipi di dato corretti.

---

## Ⓘ Isolamento (Isolation)
L'isolamento garantisce che l'esecuzione concorrente di transazioni lasci il database nello stesso stato in cui si troverebbe se le transazioni fossero eseguite sequenzialmente.

- **In Postgres:** Viene implementato tramite il sistema [[Programmazione/Postgres/Pagine/MVCC|MVCC (Multi-Version Concurrency Control)]].
- **Livelli di Isolamento:** Postgres permette di scegliere tra diversi livelli (Read Committed, Repeatable Read, Serializable) per bilanciare performance e rigore.

---

## Ⓓ Durabilità (Durability)
La durabilità garantisce che, una volta che una transazione è stata confermata (`COMMIT`), rimarrà memorizzata anche in caso di crash del server o interruzione di corrente.

- **In Postgres:** I dati vengono scritti in modo permanente sul disco (tramite `fsync`).
- **Logic Layer:** Anche se i dati non sono ancora stati scritti nei file delle tabelle, la loro presenza nel [[Programmazione/Postgres/Pagine/Write-Ahead Logging (WAL)|WAL]] permette al database di "ricostruire" le transazioni mancanti al riavvio dopo un crash.

---

## 🚀 Logic Layer: Perché ACID è fondamentale?

Senza le proprietà ACID, un database non potrebbe essere utilizzato per applicazioni critiche (es: sistemi bancari, e-commerce). Ad esempio, senza **Atomicità**, un trasferimento bancario potrebbe sottrarre soldi da un conto senza accreditarli sull'altro se il sistema crashasse a metà operazione.

---
