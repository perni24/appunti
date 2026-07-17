---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [postgresql, database]
aliases: [Partitioning]
prerequisites: []
related: []
---

# Partitioning in PostgreSQL

## Sintesi

Il **partitioning** divide una tabella grande in partizioni fisiche piu piccole. Serve soprattutto per dataset molto grandi, retention temporale, manutenzione veloce e query che filtrano sulla chiave di partizionamento.

## Quando usarlo

Usalo quando:

- una tabella cresce fino a centinaia di GB o TB;
- i dati hanno una chiara dimensione temporale;
- devi eliminare velocemente dati vecchi;
- query frequenti filtrano per data, area o tenant;
- autovacuum e indici diventano difficili da gestire;
- vuoi caricare o staccare blocchi di dati in modo operativo.

## Come funziona

PostgreSQL usa declarative partitioning. La tabella parent definisce struttura e strategia. Le partizioni contengono fisicamente le righe.

Il planner puo fare partition pruning: se la query filtra sulla chiave di partizionamento, PostgreSQL scarta le partizioni non rilevanti.

Il partizionamento non e una scorciatoia universale per performance. Funziona bene quando le query e la manutenzione sono allineate alla chiave scelta.

## API / Sintassi

Range partitioning:

```sql
CREATE TABLE orders (
  id bigint NOT NULL,
  created_at date NOT NULL,
  total_amount numeric(12, 2) NOT NULL,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE orders_2026_01
PARTITION OF orders
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

List partitioning:

```sql
CREATE TABLE users_by_country (
  id bigint,
  country text NOT NULL
) PARTITION BY LIST (country);
```

Hash partitioning:

```sql
CREATE TABLE events (
  id bigint,
  payload jsonb
) PARTITION BY HASH (id);
```

## Esempio pratico

Retention mensile:

```sql
ALTER TABLE orders
DETACH PARTITION orders_2025_01;

DROP TABLE orders_2025_01;
```

Staccare e droppare una partizione vecchia e molto piu efficiente di un grande `DELETE`, perche evita enormi quantita di WAL e bloat.

Verifica del pruning:

```sql
EXPLAIN
SELECT *
FROM orders
WHERE created_at >= '2026-01-10'
  AND created_at < '2026-01-11';
```

Il piano dovrebbe mostrare solo le partizioni rilevanti.

## Varianti

- Range partitioning: date, ID crescenti, intervalli.
- List partitioning: regioni, stati, tenant.
- Hash partitioning: distribuzione uniforme.
- Subpartitioning: partizioni annidate.
- Partizioni default.
- Attach/detach partition per manutenzione.

## Errori comuni

- Partizionare tabelle troppo piccole.
- Scegliere una chiave non usata nei filtri.
- Creare troppe partizioni.
- Dimenticare che primary key e unique constraint devono includere la chiave di partizionamento.
- Aspettarsi pruning se la query usa espressioni non compatibili.
- Non automatizzare creazione delle nuove partizioni.

## Checklist

- La tabella e abbastanza grande da giustificare partizionamento?
- Le query filtrano sulla chiave di partizionamento?
- Esiste una procedura per creare nuove partizioni?
- Esiste una procedura di retention?
- Gli indici sulle partizioni sono coerenti?
- `EXPLAIN` mostra partition pruning?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/Postgres/Pagine/Manutenzione|Manutenzione]]
- [[Programmazione/Postgres/Pagine/Write-Ahead Logging|Write-Ahead Logging]]
