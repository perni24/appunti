---
date: 2026-03-06
tags:
  - database
  - postgres
  - performance
  - indici
type: #permanent-note
status: evergreen
---

# Indici Parziali e Coprenti in PostgreSQL

## 💡 Concetto Chiave
Oltre ai tipi di struttura fisica (B-Tree, GIN, ecc.), PostgreSQL permette di ottimizzare ulteriormente le performance e l'occupazione di disco attraverso tecniche di indicizzazione logica: gli **Indici Parziali** (che indicizzano solo un sottoinsieme di righe) e gli **Indici Coprenti** (che includono dati extra per evitare l'accesso alla tabella).

---

## 🏗️ Indici Parziali (Partial Indexes)

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

## 🏗️ Indici Coprenti (Covering Indexes)

Un indice è "coprente" quando contiene tutte le informazioni richieste da una query, permettendo al database di restituire i risultati leggendo solo l'indice (**Index Only Scan**) ed evitando di dover andare a leggere i dati fisici nella tabella (Heap).

### La clausola `INCLUDE` (Postgres 11+)
Permette di aggiungere colonne all'indice che **non** fanno parte della chiave di ricerca (non sono ordinate), ma vengono memorizzate nei nodi foglia per essere restituite velocemente.

### Esempio d'uso:
```sql
CREATE INDEX idx_utenti_email_coprente 
ON utenti (email) 
INCLUDE (username, data_iscrizione);

# Query ottimizzata (Index Only Scan)
SELECT email, username, data_iscrizione 
FROM utenti 
WHERE email = 'test@example.com';
```

---

## ⚙️ Logic Layer: Quando usare cosa?

> [!IMPORTANT] Scelte di Design
> - **Usa gli Indici Parziali** se la tua query filtra costantemente per uno stato specifico (es. `is_active = true`, `status = 'PENDING'`) che rappresenta una piccola frazione del database.
> - **Usa gli Indici Coprenti** per evitare costosi accessi casuali al disco su tabelle molto grandi, specialmente se le query coinvolgono spesso 2-3 colonne specifiche.

---

## ⚠️ Considerazioni Tecniche

### 1. Index Only Scan e Visibility Map
Affinché un **Index Only Scan** funzioni, Postgres deve sapere se i dati nell'indice sono aggiornati rispetto alla tabella. Questo dipende dalla **Visibility Map**, che viene mantenuta dal processo di VACUUM. 
> [!TIP]
> Se noti che un indice coprente non viene usato, potrebbe essere necessario eseguire un `VACUUM ANALYZE` sulla tabella.

### 2. Overhead degli indici coprenti
Aggiungere troppe colonne in `INCLUDE` aumenta la dimensione dell'indice e rallenta gli `INSERT`. Inserisci in `INCLUDE` solo le colonne strettamente necessarie per le query più critiche.

---
