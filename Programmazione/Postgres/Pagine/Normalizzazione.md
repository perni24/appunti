---
date: 2026-06-02
area: Programmazione
topic: Postgres
type: theory-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - modellazione
  - database
aliases: []
prerequisites: []
related: []
---

# Normalizzazione

## Sintesi

La **normalizzazione** organizza i dati per ridurre duplicazione, anomalie di aggiornamento e incoerenze.

## Quando usarlo

Usa la normalizzazione quando progetti o rivedi uno schema relazionale:

- dati duplicati compaiono in piu righe;
- aggiornare una informazione richiede modificare molte righe;
- una tabella contiene piu concetti mescolati;
- esistono colonne ripetute come `phone_1`, `phone_2`, `phone_3`;
- vuoi rendere esplicite entita e relazioni prima di ottimizzare.

## Come funziona

### Concetto chiave
Separare entita diverse in tabelle diverse rende il modello piu coerente. Le relazioni vengono espresse tramite chiavi.
### Forme normali essenziali
- 1NF: valori atomici, niente gruppi ripetuti.
- 2NF: dipendenza dalla chiave completa.
- 3NF: niente dipendenze transitive non necessarie.

## API / Sintassi

La normalizzazione non e una API, ma si traduce in scelte di schema:

```sql
CREATE TABLE customers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL
);

CREATE TABLE orders (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id bigint NOT NULL REFERENCES customers(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  order_id bigint NOT NULL REFERENCES orders(id),
  product_id bigint NOT NULL REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (order_id, product_id)
);
```

## Esempio pratico

Schema poco normalizzato:

```text
orders(id, customer_email, customer_name, product_1, product_2, product_3)
```

Problemi:

- il nome cliente viene duplicato in ogni ordine;
- il numero di prodotti e limitato dalle colonne disponibili;
- cambiare email o nome richiede aggiornare molte righe;
- interrogare i prodotti diventa difficile.

Schema normalizzato:

```text
customers(id, email, name)
orders(id, customer_id, created_at)
order_items(order_id, product_id, quantity)
products(id, sku, name)
```

Ogni tabella rappresenta un concetto. Le relazioni sono espresse con chiavi.

## Varianti

### Tradeoff
Un modello normalizzato e pulito, ma query molto complesse possono richiedere join numerose. In alcuni casi si denormalizza consapevolmente per performance o reporting.

## Errori comuni

- Denormalizzare troppo presto per paura delle join.
- Normalizzare senza considerare query reali e vincoli di performance.
- Usare colonne ripetute invece di una tabella figlia.
- Salvare liste separate da virgola in una colonna testuale.
- Non dichiarare foreign key dopo aver separato le tabelle.
- Confondere normalizzazione con eliminazione di ogni duplicazione possibile.

## Checklist

- Ogni tabella rappresenta un solo concetto?
- Ogni riga e identificabile da una chiave?
- I valori sono atomici, non liste mascherate da testo?
- Le dipendenze appartengono alla chiave corretta?
- Le relazioni sono espresse con foreign key?
- Le eventuali denormalizzazioni sono motivate e documentate?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Chiavi primarie e foreign key|Chiavi primarie e foreign key]]
- [[Programmazione/Postgres/Pagine/Relazioni 1 a 1 1 a N e N a N|Relazioni 1:1, 1:N e N:N]]
- [[Programmazione/Postgres/Pagine/Vincoli|Vincoli]]
