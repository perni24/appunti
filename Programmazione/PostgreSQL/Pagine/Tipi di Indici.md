---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - postgresql
  - database
aliases:
  - Tipi di Indici
prerequisites: []
related: []
title: Tipi di Indici in PostgreSQL
---

# Tipi di Indici in PostgreSQL

## Sintesi

Scegli l'indice partendo dalla **query**: quali operatori usa il filtro, quante righe restituisce, in quale ordine e con quale limite? Un indice utile per cercare un valore dentro un documento non è necessariamente utile per ordinare i documenti. Anche un indice compatibile può essere ignorato se leggere direttamente la tabella costa meno.

## Scegliere il metodo di accesso

| Metodo | Quando valutarlo | Limite da ricordare |
| --- | --- | --- |
| B-tree (predefinito) | Uguaglianza, intervalli, ordinamento e primi N risultati in ordine | Ordine delle colonne e direzione contano; può anche imporre unicità |
| Hash | Uguaglianza su un valore | Non serve a intervalli o ordinamento; confrontalo con un B-tree, che supporta già l'uguaglianza |
| GIN | Appartenenza o contenimento in array, `jsonb`, ricerca su `tsvector` | La *operator class* decide quali operatori sono supportati; non ordina i risultati per rilevanza |
| GiST | Intersezioni tra intervalli o vicini più prossimi con tipi e operatori adatti | È un'infrastruttura per strategie diverse, non un indice universale per qualsiasi confronto |
| SP-GiST | Ricerca su valori che possono essere partizionati nello spazio o per prefisso, secondo la classe disponibile | Un tipo geometrico o testuale non rende automaticamente indicizzabile qualsiasi espressione |
| BRIN | Intervalli su tabelle grandi in cui i valori vicini sono anche fisicamente vicini, per esempio log cronologici | Riassume **gruppi di pagine**, non singole righe; min/max è una strategia, non l'unica. I candidati vanno ricontrollati |

## Laboratorio: due domande sulla stessa tabella

Esegui i blocchi nella stessa sessione di prova. Su 12.000 eventi, solo uno su mille è un checkout. Un B-tree ordina gli eventi per cliente e ID; per il contenimento nel documento creiamo invece un GIN.

```sql
BEGIN;
CREATE TEMP TABLE lab_events (id integer, customer_id integer, payload jsonb);
INSERT INTO lab_events
SELECT i, i % 10, jsonb_build_object('kind',
       CASE WHEN i % 1000 = 0 THEN 'checkout' ELSE 'view' END)
FROM generate_series(1, 12000) AS g(i);
CREATE INDEX lab_customer_latest ON lab_events (customer_id, id DESC);
CREATE INDEX lab_payload_kind ON lab_events USING gin (payload jsonb_path_ops);
ANALYZE lab_events;
```

```sql
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF)
SELECT id FROM lab_events WHERE customer_id = 3 ORDER BY id DESC LIMIT 3;
```

Per il cliente 3 i primi ID sono **11993, 11983, 11973**. Il B-tree può raggiungere il primo valore del cliente e fermarsi dopo tre righe senza un ordinamento separato. `EXPLAIN ANALYZE` restituisce il piano, non la lista degli ID: togli il prefisso per leggere i risultati.

```sql
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF)
SELECT id FROM lab_events WHERE payload @> '{"kind":"checkout"}';
ROLLBACK;
```

Il filtro trova **12 eventi**. Cerca il nome `lab_payload_kind` nel piano e distingui la ricerca nell'indice dal recupero delle righe. `jsonb_path_ops` supporta il contenimento `@>`, non il controllo di esistenza `?`; per quest'ultimo valuta `jsonb_ops`. Se filtri sempre uno specifico valore estratto, per esempio `payload->>'kind'`, anche un B-tree sull'espressione può essere appropriato.

## Prima di aggiungere o togliere un indice

- Un indice `UNIQUE` cambia anche le scritture ammesse: non usarlo solo per accelerare un filtro se i duplicati sono validi. Una PK ha già un indice; una foreign key non crea automaticamente un indice **sul lato che fa riferimento**.
- Ogni indice occupa spazio e può aumentare il costo delle modifiche. Indici con lo stesso prefisso non sono necessariamente duplicati: confronta unicità, ordine, predicato e colonne incluse. `idx_scan = 0` in `pg_stat_user_indexes` va interpretato rispetto al periodo osservato e ai vincoli tutelati.
- Su una tabella ordinaria in uso, `CREATE INDEX CONCURRENTLY` consente di proseguire le normali scritture, ma richiede più lavoro, può attendere transazioni e non può stare in un blocco `BEGIN`. Un fallimento può lasciare un indice non valido. Anche `DROP INDEX CONCURRENTLY` ha restrizioni: verifica le dipendenze prima di rimuovere un indice reale.

**Fonti PostgreSQL 18:** [metodi di indice](https://www.postgresql.org/docs/18/indexes-types.html), [classi di operatori](https://www.postgresql.org/docs/18/indexes-opclass.html), [BRIN](https://www.postgresql.org/docs/18/brin.html), [CREATE INDEX](https://www.postgresql.org/docs/18/sql-createindex.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Indici Parziali e Coprenti|Indici Parziali e Coprenti]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/PostgreSQL/Pagine/Statistiche e Query Planner|Statistiche e Query Planner]]
- [[Programmazione/PostgreSQL/Pagine/Full Text Search|Full text search]]
- [[Programmazione/PostgreSQL/Pagine/Tipi di Dato|Tipi di dato]]
