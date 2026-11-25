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
  - vincoli
  - modellazione
aliases: []
prerequisites: []
related: []
title: Chiavi primarie e foreign key
---

# Chiavi primarie e foreign key

## Sintesi

Una **primary key** (`PRIMARY KEY`) risponde a «quale riga è questa?»: i suoi valori sono unici e nessuna colonna della chiave può essere nulla. Una **foreign key** (`REFERENCES`) risponde a «esiste la riga a cui sto facendo riferimento?». Non rende unici i riferimenti nel figlio e non impone che ogni padre abbia un figlio.

## Scegliere le chiavi

Un ID tecnico generato con `GENERATED ALWAYS AS IDENTITY` fornisce valori, ma è la PK a garantirne l'unicità. Se esiste anche un codice del dominio che identifica sempre la riga, proteggilo con `UNIQUE NOT NULL`. Una chiave naturale o composta è adatta quando è stabile: se lo SKU è unico **solo nel singolo negozio**, la coppia `(shop_id, sku)` identifica l'articolo, lo SKU da solo no.

## Esempio: riferirsi alla coppia giusta

Esegui i due blocchi in ordine nella stessa sessione. Ogni riga d'ordine deve riferirsi a una coppia negozio/articolo presente in catalogo.

```sql
BEGIN;
CREATE TEMP TABLE lab_catalog (
  shop_id integer, sku text, description text NOT NULL,
  PRIMARY KEY (shop_id, sku)
);
CREATE TEMP TABLE lab_sales (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  shop_id integer NOT NULL, sku text NOT NULL,
  CONSTRAINT lab_sales_catalog_fk FOREIGN KEY (shop_id, sku)
    REFERENCES lab_catalog (shop_id, sku) ON DELETE RESTRICT
);
CREATE INDEX lab_sales_catalog_idx ON lab_sales (shop_id, sku);
INSERT INTO lab_catalog VALUES (1, 'A', 'Lampada'), (2, 'A', 'Cavo');
INSERT INTO lab_sales (shop_id, sku) VALUES (1, 'A'), (1, 'A');
```

```sql
SELECT c.shop_id, c.sku, c.description, count(s.id) AS sales
FROM lab_catalog AS c LEFT JOIN lab_sales AS s USING (shop_id, sku)
GROUP BY c.shop_id, c.sku, c.description
ORDER BY c.shop_id, c.sku;
ROLLBACK;
```

Il risultato è `1 | A | Lampada | 2` e `2 | A | Cavo | 0`. Il database ammette due vendite dello stesso articolo e un articolo invenduto; rifiuterebbe una vendita nel negozio 3 per lo SKU A. Il join deve usare **entrambe** le colonne per lo stesso motivo della FK.

## Riferimenti facoltativi e cancellazioni

- **Relazione facoltativa:** per una FK semplice nullable, `NULL` significa nessun riferimento. In una FK composta, il predefinito `MATCH SIMPLE` non controlla la coppia se anche solo una colonna è nulla. Con `MATCH FULL` sono ammessi tutti nulli oppure tutti valorizzati con una corrispondenza; una coppia parziale viene rifiutata. Per una relazione obbligatoria, usa `NOT NULL` su entrambi i campi come nell'esempio.
- **Proteggere il padre:** `ON DELETE RESTRICT` impedisce di cancellarlo finché è referenziato. `NO ACTION` è il default; il suo controllo può essere rimandato a fine transazione se il vincolo è differibile e viene differito. `RESTRICT` non concede quel rinvio.
- **Eliminare o scollegare i figli:** `CASCADE` li elimina; usalo quando non hanno vita indipendente. `SET NULL` li mantiene ma richiede che le colonne azzerate ammettano `NULL`. Per uno storico di vendite, cancellare automaticamente tutte le righe di un articolo è in genere la politica sbagliata.

## Indici: due lati diversi

PostgreSQL crea un indice univoco per la PK del padre, **non** crea automaticamente l'indice sul figlio per la FK. Nell'esempio, l'indice su `lab_sales` aiuta a cercare le vendite di un articolo e a individuare i riferimenti quando cambia il padre. Non duplicarlo se un indice esistente copre già quella ricerca; valuta frequenza delle letture e costo delle scritture.

**Fonte:** [PostgreSQL 18: primary key e foreign key](https://www.postgresql.org/docs/18/ddl-constraints.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Vincoli|Vincoli]]
- [[Programmazione/PostgreSQL/Pagine/Normalizzazione|Normalizzazione]]
- [[Programmazione/PostgreSQL/Pagine/JOIN|JOIN]]
