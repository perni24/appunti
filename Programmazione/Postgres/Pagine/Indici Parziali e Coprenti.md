---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [postgresql, database]
aliases: [Indici Parziali e Coprenti]
prerequisites: []
related: []
---

# Indici Parziali e Coprenti in PostgreSQL

## Sintesi

Gli **indici parziali** indicizzano solo un sottoinsieme di righe. Gli **indici coprenti** includono colonne extra per permettere a PostgreSQL di rispondere leggendo solo l'indice, quando la visibility map lo consente.

## Quando usarlo

Usali quando un indice normale sarebbe troppo grande o non abbastanza mirato:

- query che filtrano sempre per uno stato, per esempio `status = 'pending'`;
- righe attive molto meno numerose delle righe storiche;
- code applicative con pochi job da processare;
- query molto frequenti che leggono sempre poche colonne;
- tabelle grandi dove evitare accessi alla heap riduce molto I/O.

## Come funziona

### Concetto chiave
Oltre ai tipi di struttura fisica (B-Tree, GIN, ecc.), PostgreSQL permette di ottimizzare ulteriormente le performance e l'occupazione di disco attraverso tecniche di indicizzazione logica: gli **Indici Parziali** (che indicizzano solo un sottoinsieme di righe) e gli **Indici Coprenti** (che includono dati extra per evitare l'accesso alla tabella).

---
### Indici Parziali (Partial Indexes)
Un indice parziale viene creato aggiungendo una clausola `WHERE`. Contiene voci solo per le righe che soddisfano tale condizione.

### Vantaggi:
1.  **Risparmio di spazio**: L'indice è molto più piccolo di uno normale.
2.  **Velocità di aggiornamento**: Le operazioni di scrittura sulle righe non indicizzate sono più rapide.

### Esempio d'uso:
Indicizzare solo gli utenti attivi o le fatture non pagate.
```sql
CREATE INDEX idx_ordini_non_pagati 
ON ordini (data_ordine) 
WHERE pagato = false;
```

---
### Indici Coprenti (Covering Indexes)
Un indice è "coprente" quando contiene tutte le informazioni richieste da una query, permettendo al database di restituire i risultati leggendo solo l'indice (**Index Only Scan**) ed evitando di dover andare a leggere i dati fisici nella tabella (Heap).

### La clausola `INCLUDE` (Postgres 11+)
Permette di aggiungere colonne all'indice che **non** fanno parte della chiave di ricerca (non sono ordinate), ma vengono memorizzate nei nodi foglia per essere restituite velocemente.

### Esempio d'uso:
```sql
CREATE INDEX idx_utenti_email_coprente 
ON utenti (email) 
INCLUDE (username, data_iscrizione);
```

Query coperta:

```sql
SELECT email, username, data_iscrizione
FROM utenti
WHERE email = 'test@example.com';
```

### Logic layer: quando usare cosa

- Usa gli indici parziali se la query filtra costantemente per uno stato specifico che rappresenta una piccola frazione della tabella.
- Usa gli indici coprenti per evitare accessi casuali alla tabella quando le query leggono sempre poche colonne specifiche.

---
### Considerazioni Tecniche
### 1. Index Only Scan e Visibility Map
Affinché un **Index Only Scan** funzioni, Postgres deve sapere se i dati nell'indice sono aggiornati rispetto alla tabella. Questo dipende dalla **Visibility Map**, che viene mantenuta dal processo di VACUUM. 
> [!TIP]
> Se noti che un indice coprente non viene usato, potrebbe essere necessario eseguire un `VACUUM ANALYZE` sulla tabella.

### 2. Overhead degli indici coprenti
Aggiungere troppe colonne in `INCLUDE` aumenta la dimensione dell'indice e rallenta gli `INSERT`. Inserisci in `INCLUDE` solo le colonne strettamente necessarie per le query più critiche.

---

## API / Sintassi

Indice parziale:

```sql
CREATE INDEX index_name
ON table_name (indexed_column)
WHERE predicate;
```

Indice coprente:

```sql
CREATE INDEX index_name
ON table_name (search_column)
INCLUDE (returned_column_1, returned_column_2);
```

Combinazione:

```sql
CREATE INDEX orders_pending_customer_idx
ON orders (customer_id, created_at)
INCLUDE (total_amount)
WHERE status = 'pending';
```

## Esempio pratico

Job queue con pochi job disponibili:

```sql
CREATE INDEX jobs_available_idx
ON jobs (priority DESC, created_at)
WHERE status = 'available';
```

Query:

```sql
SELECT id, payload
FROM jobs
WHERE status = 'available'
ORDER BY priority DESC, created_at
LIMIT 10;
```

Indice coprente per lista utenti:

```sql
CREATE INDEX users_email_include_idx
ON users (email)
INCLUDE (id, display_name);
```

## Varianti

- Indice parziale con `WHERE deleted_at IS NULL`.
- Indice parziale per stati rari come `status = 'failed'`.
- Indice unico parziale per vincoli condizionati.
- Indice coprente con `INCLUDE`.
- Expression index parziale, per esempio su `lower(email)`.

Esempio di vincolo unico condizionato:

```sql
CREATE UNIQUE INDEX users_active_email_unique_idx
ON users (email)
WHERE deleted_at IS NULL;
```

## Errori comuni

- Creare un indice parziale con predicato diverso dalla query reale.
- Aspettarsi che PostgreSQL usi un indice parziale se non puo dimostrare che il filtro della query implica il predicato.
- Mettere troppe colonne in `INCLUDE`.
- Confondere indice coprente con garanzia di `Index Only Scan`: serve anche una visibility map favorevole.
- Creare indici parziali su condizioni che cambiano continuamente, aumentando il costo di manutenzione.

## Checklist

- La condizione dell'indice parziale corrisponde alle query reali?
- La porzione indicizzata e molto piu piccola della tabella?
- Le colonne in `INCLUDE` sono davvero restituite spesso?
- `EXPLAIN` mostra l'uso dell'indice?
- Dopo grandi modifiche e stato eseguito `VACUUM ANALYZE` se serve?
- L'indice non duplica un altro indice esistente?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Tipi di Indici|Tipi di Indici]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/Postgres/Pagine/Statistiche e Query Planner|Statistiche e Query Planner]]
