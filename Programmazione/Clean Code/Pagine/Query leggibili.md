---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, database, query]
aliases: [Query leggibili, Readable queries]
prerequisites: [Repository pattern]
related: [Migrazioni e schema evolution, Performance e leggibilita, Messaggi di errore utili]
---

# Query leggibili

## Sintesi

Le **query leggibili** rendono chiaro quali dati vengono richiesti, come vengono filtrati, quali relazioni sono coinvolte e quale forma ha il risultato.

Una query e codice: va scritta per essere capita, modificata e verificata.

## Quando usarlo

- In repository e data access layer.
- In reportistica e dashboard.
- In migrazioni o script dati.
- Quando una query contiene join, filtri o aggregazioni non banali.
- Quando performance e correttezza dipendono dal database.

## Come funziona

Una query leggibile usa:

- nomi coerenti;
- alias chiari;
- condizioni ordinate;
- join espliciti;
- formattazione stabile;
- separazione tra query di lettura e logica applicativa.

## API / Sintassi

```sql
SELECT
  orders.id,
  orders.status,
  customers.email
FROM orders
JOIN customers ON customers.id = orders.customer_id
WHERE orders.status = 'pending'
ORDER BY orders.created_at DESC;
```

La formattazione aiuta a vedere campi, join e filtri.

## Esempio pratico

Query fragile:

```sql
SELECT * FROM orders o, customers c WHERE c.id=o.customer_id AND o.status='pending';
```

Query piu leggibile:

```sql
SELECT
  orders.id,
  orders.created_at,
  customers.email
FROM orders
JOIN customers ON customers.id = orders.customer_id
WHERE orders.status = 'pending';
```

La seconda evita `SELECT *`, usa join esplicito e mostra i campi necessari.

## Varianti

- SQL scritto a mano.
- Query builder.
- ORM.
- View o materialized view.
- Query object dedicati per letture complesse.

## Errori comuni

- Usare `SELECT *` in codice applicativo.
- Nascondere query costose dietro metodi innocui.
- Mescolare filtri applicativi e filtri database senza criterio.
- Non testare query importanti.
- Ignorare indici e piano di esecuzione quando la query e critica.

## Checklist

- La query seleziona solo i campi necessari?
- I join sono espliciti?
- Alias e nomi sono comprensibili?
- La query e coperta da test o esempi?
- Performance e indici sono stati verificati se il percorso e critico?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Repository pattern]]
- [[Performance e leggibilita]]
- [[Profiling prima del refactoring]]
- [[Migrazioni e schema evolution]]

## Fonti

- Martin Fowler, *Patterns of Enterprise Application Architecture*
- Markus Winand, *SQL Performance Explained*
- PostgreSQL Documentation, *Queries*
