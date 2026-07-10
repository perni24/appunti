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

Le proprietà ACID descrivono le garanzie attese da una transazione: applicazione atomica delle modifiche, rispetto delle invarianti, isolamento dagli accessi concorrenti e persistenza dei commit secondo il livello di durabilità configurato.

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
PostgreSQL fornisce i meccanismi necessari per transazioni ACID, ma la correttezza finale dipende anche da schema, vincoli, livello di isolamento, codice applicativo e configurazione della durabilità. Un errore di rete può inoltre lasciare al client un esito di commit ambiguo, anche quando il server ha completato correttamente la transazione.

---
### Atomicità (Atomicity)
L'atomicità garantisce che una transazione sia trattata come un'unica unità "tutto o niente". Se una parte della transazione fallisce, l'intera transazione viene annullata (**Rollback**).

- **In Postgres:** Viene gestita tramite i comandi `BEGIN`, `COMMIT` e `ROLLBACK`.
- **Meccanismo:** PostgreSQL registra lo stato della transazione e usa MVCC per rendere invisibili le versioni create da una transazione abortita. Il **Write-Ahead Log (WAL)** serve principalmente al redo e al recupero dopo un crash, non come log di undo per eseguire il rollback.

---
### Consistenza (Consistency)
La consistenza richiede che una transazione porti il database da uno stato valido a un altro stato valido. PostgreSQL applica tipi e vincoli dichiarati, mentre le invarianti non espresse nello schema restano responsabilità della logica applicativa e del livello di isolamento scelto.

- **In Postgres:** Viene garantita dall'applicazione rigorosa di:
	- [[Programmazione/Postgres/Pagine/Vincoli|Vincoli (Constraints)]]: NOT NULL, UNIQUE, CHECK.
	- Integrità Referenziale: Foreign Keys.
	- Tipi di dato corretti.

---
### Isolamento (Isolation)
L'isolamento controlla quanto gli effetti delle transazioni concorrenti possono interferire tra loro. Solo `SERIALIZABLE` mira a un risultato equivalente a una possibile esecuzione seriale; livelli più deboli ammettono alcune anomalie in cambio di minore contesa.

- **In Postgres:** Viene implementato tramite [[Programmazione/Postgres/Pagine/MVCC|MVCC]], lock e, per `SERIALIZABLE`, Serializable Snapshot Isolation.
- **Livelli di Isolamento:** Postgres permette di scegliere tra diversi livelli (Read Committed, Repeatable Read, Serializable) per bilanciare performance e rigore.

---
### Durabilità (Durability)
Con le impostazioni durevoli predefinite, un `COMMIT` confermato sopravvive a un crash perché il relativo record WAL viene reso persistente prima della risposta al client. Impostazioni come `synchronous_commit = off`, `fsync = off` o storage che dichiara flush non realmente completati riducono questa garanzia.

- **In Postgres:** Il WAL viene sincronizzato sullo storage secondo le impostazioni di durabilità; le pagine dati possono essere scritte successivamente.
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

## Fonti

- [PostgreSQL - Write-Ahead Logging](https://www.postgresql.org/docs/current/wal-intro.html)
- [PostgreSQL - Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [PostgreSQL - Asynchronous Commit](https://www.postgresql.org/docs/current/wal-async-commit.html)
