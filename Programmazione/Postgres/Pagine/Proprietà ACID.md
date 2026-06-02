---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Proprietà ACID]
prerequisites: []
related: []
---

# Proprietà ACID in PostgreSQL

## Sintesi

Nota su Proprietà ACID in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.

In informatica, le proprietà **ACID** (Atomicity, Consistency, Isolation, Durability) rappresentano un insieme di caratteristiche che garantiscono che le transazioni del database vengano elaborate in modo affidabile.

## Quando usarlo

Usa il modello ACID quando progetti operazioni che devono restare corrette anche con errori, crash o concorrenza:

- pagamenti e trasferimenti;
- ordini e scorte;
- prenotazioni;
- migrazioni dati;
- job che aggiornano piu tabelle;
- flussi in cui un cambiamento parziale sarebbe dannoso.

## Come funziona

### Concetto chiave
PostgreSQL è un database relazionale **ACID-compliant**. Ciò significa che, indipendentemente da crash del sistema, errori di rete o accessi concorrenti, i dati rimarranno sempre in uno stato integro e coerente.

---
### Atomicità (Atomicity)
L'atomicità garantisce che una transazione sia trattata come un'unica unità "tutto o niente". Se una parte della transazione fallisce, l'intera transazione viene annullata (**Rollback**).

- **In Postgres:** Viene gestita tramite i comandi `BEGIN`, `COMMIT` e `ROLLBACK`.
- **Meccanismo:** PostgreSQL utilizza il **Write-Ahead Logging (WAL)** per tenere traccia dei cambiamenti prima che avvengano, permettendo di annullarli se necessario.

---
### Consistenza (Consistency)
La consistenza garantisce che una transazione porti il database da uno stato valido a un altro stato valido, rispettando tutti i vincoli definiti (regole di integrità).

- **In Postgres:** Viene garantita dall'applicazione rigorosa di:
	- [[Programmazione/Postgres/Pagine/Vincoli|Vincoli (Constraints)]]: NOT NULL, UNIQUE, CHECK.
	- Integrità Referenziale: Foreign Keys.
	- Tipi di dato corretti.

---
### Isolamento (Isolation)
L'isolamento garantisce che l'esecuzione concorrente di transazioni lasci il database nello stesso stato in cui si troverebbe se le transazioni fossero eseguite sequenzialmente.

- **In Postgres:** Viene implementato tramite il sistema [[Programmazione/Postgres/Pagine/MVCC|MVCC (Multi-Version Concurrency Control)]].
- **Livelli di Isolamento:** Postgres permette di scegliere tra diversi livelli (Read Committed, Repeatable Read, Serializable) per bilanciare performance e rigore.

---
### Durabilità (Durability)
La durabilità garantisce che, una volta che una transazione è stata confermata (`COMMIT`), rimarrà memorizzata anche in caso di crash del server o interruzione di corrente.

- **In Postgres:** I dati vengono scritti in modo permanente sul disco (tramite `fsync`).
- **Logic Layer:** Anche se i dati non sono ancora stati scritti nei file delle tabelle, la loro presenza nel **WAL** permette al database di "ricostruire" le transazioni mancanti al riavvio dopo un crash.

---
### Logic layer: Perché ACID è fondamentale?
Senza le proprietà ACID, un database non potrebbe essere utilizzato per applicazioni critiche (es: sistemi bancari, e-commerce). Ad esempio, senza **Atomicità**, un trasferimento bancario potrebbe sottrarre soldi da un conto senza accreditarli sull'altro se il sistema crashasse a metà operazione.

---

## API / Sintassi

```sql
BEGIN;

-- Operazioni correlate

COMMIT;
```

Annullamento:

```sql
BEGIN;

-- Operazioni da annullare

ROLLBACK;
```

Savepoint:

```sql
BEGIN;

SAVEPOINT before_optional_step;

-- Operazione opzionale

ROLLBACK TO SAVEPOINT before_optional_step;

COMMIT;
```

## Esempio pratico

Trasferimento atomico:

```sql
BEGIN;

UPDATE accounts
SET balance = balance - 100
WHERE id = 1
  AND balance >= 100;

UPDATE accounts
SET balance = balance + 100
WHERE id = 2;

COMMIT;
```

Se una parte fallisce, l'intera transazione deve essere annullata con `ROLLBACK`. In applicazione va controllato anche quante righe sono state aggiornate nel primo `UPDATE`.

## Varianti

- Transazioni esplicite con `BEGIN`/`COMMIT`.
- Transazioni implicite per singola istruzione.
- Savepoint per annullare solo una parte del lavoro.
- Transazioni read only.
- Diversi livelli di isolamento.
- Durabilita influenzata da impostazioni come `synchronous_commit`.

## Errori comuni

- Fare operazioni correlate fuori da una transazione.
- Tenere una transazione aperta durante chiamate API esterne.
- Non controllare il numero di righe modificate.
- Assumere che tutti gli errori causino automaticamente rollback del flusso applicativo.
- Ignorare isolation level e race condition.
- Usare vincoli solo nel codice applicativo e non nel database.

## Checklist

- Le operazioni che devono riuscire insieme sono nella stessa transazione?
- Esistono vincoli per proteggere la consistenza?
- Il livello di isolamento e adeguato?
- Gli errori portano a `ROLLBACK`?
- Le transazioni sono brevi?
- I retry sono gestiti per deadlock e serialization failure?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Livelli di Isolamento delle Transazioni|Livelli di Isolamento delle Transazioni]]
- [[Programmazione/Postgres/Pagine/MVCC|MVCC]]
- [[Programmazione/Postgres/Pagine/Write-Ahead Logging|Write-Ahead Logging]]
