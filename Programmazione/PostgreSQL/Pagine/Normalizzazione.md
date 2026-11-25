---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: theory-note
status: non revisionato
publish: true
tags:
  - programmazione
  - postgres
  - modellazione
  - database
aliases: []
prerequisites: []
related: []
title: Normalizzazione
---

# Normalizzazione

## Sintesi

Normalizzare significa stabilire **da quale chiave dipende ciascun fatto** e conservarlo dove quella chiave lo identifica. In un ordine, il nome attuale del cliente dipende dal cliente; la quantità acquistata dipende dalla singola riga. Ripetere il nome su ogni riga rende possibile aggiornarne solo una copia e lasciare le altre incoerenti.

## Dal problema alle forme normali

Immagina un foglio con `order_id`, `customer_id`, `current_name`, `product_1`, `product_2`. Un terzo prodotto richiede una nuova colonna. Senza ordini non sai dove inserire un cliente; cancellando il suo unico ordine perdi anche il nome. Sono anomalie di inserimento e cancellazione, oltre a quella di aggiornamento.

1. **Prima forma normale (1NF).** Niente gruppi ripetuti: rappresenta ogni voce dell'ordine con una riga e ogni valore come un elemento del dominio scelto. Se devi cercare, contare e vincolare i prodotti separatamente, una lista di codici separati da virgole non è un buon valore di colonna. Nel foglio trasformato, la chiave della riga è `(order_id, line_no)`.
2. **Seconda forma normale (2NF).** Oltre alla 1NF, un attributo che non fa parte di alcuna chiave candidata non deve dipendere solo da un pezzo di una chiave candidata. Qui `order_id` da solo determina `customer_id`: il cliente va nella testata dell'ordine. La quantità resta sulla riga, perché il solo numero d'ordine non la determina.
3. **Terza forma normale (3NF).** Nella testata, `order_id` determina `customer_id`, che determina `current_name`. Sposta il nome nella tabella dei clienti: il cambio di nome ora interessa una riga. Più precisamente, per ogni dipendenza non banale `X → A`, o `X` identifica univocamente la riga (superchiave), o `A` fa parte di una chiave candidata. Una chiave candidata è una superchiave a cui non si può togliere nessun attributo.

Le dipendenze vengono **dalle regole del dominio**, non dalle coincidenze nei dati di oggi. Due righe possono avere la stessa quantità senza che il prodotto determini la quantità ordinata. Aggiungere un ID artificiale non elimina le altre dipendenze.

## Esempio: listino e prezzo pattuito

Esegui i due blocchi nella stessa sessione PostgreSQL. Il primo prepara quattro tabelle temporanee; il secondo ricostruisce le righe dell'ordine e annulla l'esempio.

```sql
BEGIN;
CREATE TEMP TABLE lab_customers (
  customer_id integer PRIMARY KEY, current_name text NOT NULL
);
CREATE TEMP TABLE lab_products (
  sku text PRIMARY KEY, list_price numeric(8,2) NOT NULL CHECK (list_price >= 0)
);
CREATE TEMP TABLE lab_orders (
  order_id integer PRIMARY KEY,
  customer_id integer NOT NULL REFERENCES lab_customers
);
CREATE TEMP TABLE lab_order_lines (
  order_id integer REFERENCES lab_orders, line_no integer CHECK (line_no > 0),
  sku text NOT NULL REFERENCES lab_products,
  qty integer NOT NULL CHECK (qty > 0),
  unit_price numeric(8,2) NOT NULL CHECK (unit_price >= 0),
  PRIMARY KEY (order_id, line_no)
);
INSERT INTO lab_customers VALUES (1, 'Ada');
INSERT INTO lab_products VALUES ('A', 10);
INSERT INTO lab_orders VALUES (42, 1);
INSERT INTO lab_order_lines VALUES (42, 1, 'A', 2, 10), (42, 2, 'A', 1, 8);
```

```sql
UPDATE lab_products SET list_price = 12 WHERE sku = 'A';
SELECT l.line_no, c.current_name, l.sku, l.qty * l.unit_price AS line_total,
       p.list_price AS current_list_price
FROM lab_order_lines AS l
JOIN lab_orders AS o USING (order_id)
JOIN lab_customers AS c USING (customer_id)
JOIN lab_products AS p USING (sku)
ORDER BY l.order_id, l.line_no;
ROLLBACK;
```

Per Ada ottieni due righe: totali `20.00` e `8.00`, listino corrente `12.00` per entrambe. Il prodotto può comparire due volte perché la chiave è ordine **e numero di riga**, non ordine e prodotto. I join verso chiavi uniche ricompongono i fatti senza moltiplicare le righe. Il prezzo pattuito non è una copia ridondante del listino attuale: sono fatti diversi, validi in momenti diversi.

## Quando denormalizzare

Se un report lento ripete gli stessi join, misura il costo prima di duplicare i dati. Una vista normale può semplificare la query senza introdurre copie; una vista materializzata può accelerare la lettura, ma occorre decidere quando aggiornarla. Per ogni duplicazione intenzionale indica il dato autorevole, chi aggiorna la copia e quanto può restare indietro.

**Fonte:** [Database System Concepts, capitolo 7: Relational Database Design](https://www.db-book.com/slides-dir/index.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Chiavi primarie e foreign key|Chiavi primarie e foreign key]]
- [[Programmazione/PostgreSQL/Pagine/Relazioni 1 a 1 1 a N e N a N|Relazioni 1:1, 1:N e N:N]]
- [[Programmazione/PostgreSQL/Pagine/Vincoli|Vincoli]]
