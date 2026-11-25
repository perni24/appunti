---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: non revisionato
publish: true
tags:
  - programmazione
  - postgres
  - sql
  - join
aliases: []
prerequisites: []
related: []
title: JOIN
---

# JOIN

## Sintesi

Una join produce una riga **per ogni coppia** che soddisfa la condizione. Non occorre una foreign key per eseguirla; il vincolo garantisce l'integrità dei dati, mentre `ON` stabilisce come abbinarli. Decidi prima se il risultato deve avere una riga per cliente, per ordine o per cliente senza ordini.

## Quali righe rimangono?

| Forma | Risultato |
|---|---|
| `INNER JOIN` (anche `JOIN`) | Solo le coppie con condizione vera. |
| `LEFT JOIN` | Le coppie trovate e, per ogni riga sinistra senza match, una riga con le colonne destre a `NULL`. |
| `RIGHT JOIN` / `FULL JOIN` | Conserva anche le righe senza match a destra / da entrambe le parti. Una right join si può leggere come left join scambiando i lati. |
| `CROSS JOIN` | Tutte le combinazioni: con M e N righe produce M × N righe. Non richiede `ON`. |

## Esempio: clienti e ordini pagati

Esegui i blocchi in ordine nella stessa sessione di prova. Ada ha due ordini pagati, Teo un ordine aperto, Lia nessun ordine: **avere zero ordini pagati non significa non avere ordini**.

```sql
BEGIN;
CREATE TEMP TABLE lab_clients (id integer PRIMARY KEY, name text NOT NULL);
CREATE TEMP TABLE lab_orders (
    id integer PRIMARY KEY, client_id integer NOT NULL REFERENCES lab_clients, status text NOT NULL
);
INSERT INTO lab_clients VALUES (1,'Ada'), (2,'Teo'), (3,'Lia');
INSERT INTO lab_orders VALUES (11,1,'paid'), (12,1,'paid'), (13,2,'open');
```

```sql
SELECT c.name, o.id
FROM lab_clients AS c
LEFT JOIN lab_orders AS o ON o.client_id = c.id AND o.status = 'paid'
ORDER BY c.id, o.id;
```

La query restituisce **quattro righe**: Ada/11, Ada/12, Teo/`NULL` e Lia/`NULL`. Il filtro in `ON` decide quali ordini possono abbinarsi. Se lo sposti in `WHERE o.status = 'paid'`, le righe senza un ordine pagato vengono scartate: rimangono solo le due righe di Ada.

Per trovare chi non ha **nessun** ordine, non filtrare sullo stato: controlla l'assenza di un valore che in un ordine reale non può essere nullo.

```sql
SELECT c.name
FROM lab_clients AS c
LEFT JOIN lab_orders AS o ON o.client_id = c.id
WHERE o.id IS NULL
ORDER BY c.id;
ROLLBACK;
```

Risultato: solo Lia. `WHERE o.note IS NULL`, se `note` fosse facoltativa, non distinguerebbe un ordine assente da un ordine esistente con nota mancante.

## Varianti e diagnosi

- Una *self join* usa due alias per la stessa tabella. Ad esempio `employees AS e LEFT JOIN employees AS m ON m.id = e.manager_id` conserva anche chi non ha responsabile.
- Una [[Programmazione/PostgreSQL/Pagine/LATERAL JOIN|LATERAL JOIN]] consente alla sorgente di destra di usare valori della riga di sinistra. Se interessa solo sapere se esiste un ordine, usa invece [[Programmazione/PostgreSQL/Pagine/Subquery|EXISTS]]: non moltiplica i clienti.
- Un totale gonfiato dopo una join è spesso un problema di cardinalità: collega un cliente a ordini **e** contatti e potresti ottenere tutte le combinazioni fra i due insiemi. Aggrega ciascun lato al livello necessario prima di combinarli; un indice non corregge il risultato. Per le prestazioni controlla il piano prima di aggiungere indici.

**Fonte:** [PostgreSQL 18: tabelle unite e differenza fra ON e WHERE](https://www.postgresql.org/docs/18/queries-table-expressions.html#QUERIES-JOIN).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Chiavi primarie e foreign key|Chiavi primarie e foreign key]]
- [[Programmazione/PostgreSQL/Pagine/LATERAL JOIN|LATERAL JOIN]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]
