---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - database
  - query
aliases:
  - Query leggibili
  - Readable queries
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Repository pattern]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Migrazioni e schema evolution]]"
  - "[[Programmazione/Clean Code/Pagine/Performance e leggibilita]]"
  - "[[Programmazione/Clean Code/Pagine/Messaggi di errore utili]]"
title: Query leggibili
---

# Query leggibili

## Sintesi

Una query è leggibile se dal testo si possono ricostruire **cosa rappresenta una riga**, perché entra nel risultato e come si ordina rispetto alle altre. L'indentazione aiuta, ma non corregge un join che moltiplica le righe o una paginazione che salta gli ordini a pari data.

## Esempio: leggere una pagina di ordini in attesa

Una riga deve rappresentare **un ordine**. Si assumono `orders(id INTEGER PRIMARY KEY, customer_id, created_ms, status)` con chiave cliente e data non nulle, e `customers(id INTEGER PRIMARY KEY, email)`. Il riferimento al cliente è valido e univoco: l'`INNER JOIN` trova esattamente un cliente per ordine. L'email è parte di questo report interno, non una proprietà da includere per default in qualunque API.

```sql
SELECT
  o.id         AS order_id,
  o.created_ms AS created_ms,
  c.email      AS customer_email
FROM orders AS o
JOIN customers AS c ON c.id = o.customer_id
WHERE o.status = 'pending'
  AND (:before_ms IS NULL OR (o.created_ms, o.id) < (:before_ms, :before_id))
ORDER BY o.created_ms DESC, o.id DESC
LIMIT :page_size;
```

Alla prima pagina passa `NULL` per entrambi i valori `before`; alla successiva passa **data e ID dell'ultima riga ricevuta**. Il chiamante valida che i due valori del cursore siano entrambi presenti o entrambi assenti e che la dimensione della pagina sia un intero, ad esempio fra 1 e 100. I valori vengono associati ai parametri, non concatenati al testo SQL.

Con tre ordini pendenti `(1000, 12)`, `(1000, 11)`, `(999, 15)` e pagina di una riga, dopo l'ordine 12 deve arrivare **11**. Un filtro sulla sola data lo salterebbe. La coppia nel confronto corrisponde alle due colonne dell'ordinamento; l'ID univoco risolve il pareggio.

## Errori comuni e verifica

- `SELECT *` non stabilisce la proiezione pubblicata: una nuova colonna può cambiare il risultato; qui i tre alias hanno un significato preciso.
- Un join aggiunto sulle righe di dettaglio può produrre più righe per ordine. Verifica la cardinalità prima di applicare `LIMIT`; `DISTINCT` non sostituisce la scelta dell'unità di risultato.
- Il cursore non congela il database. Se lo stato o le chiavi d'ordine cambiano tra pagine, il risultato complessivo non equivale necessariamente a uno snapshot. Per un export coerente occorre una strategia apposita.
- Un indice su stato, data e ID può essere candidato, non una garanzia: valuta il piano e i volumi effettivi. Per la correttezza prova parità di data, ordini esclusi e pagina finale vuota.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Repository pattern|Repository pattern]]
- [[Programmazione/Clean Code/Pagine/Performance e leggibilita|Performance e leggibilita]]
- [[Programmazione/Clean Code/Pagine/Profiling prima del refactoring|Profiling prima del refactoring]]
- [[Programmazione/Clean Code/Pagine/Migrazioni e schema evolution|Migrazioni e schema evolution]]

## Fonti

- Martin Fowler, *Patterns of Enterprise Application Architecture*
- Markus Winand, *SQL Performance Explained*
- PostgreSQL Documentation, *Queries*
- [SQLite: confronti su valori di riga e paginazione](https://www.sqlite.org/rowvalue.html)
- [SQLite: ORDER BY e LIMIT](https://www.sqlite.org/lang_select.html#orderby)
