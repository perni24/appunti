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
  - scalabilita
aliases: []
prerequisites: []
related: []
title: Sharding
---

# Sharding

## Sintesi

Con lo sharding **nodi indipendenti possiedono righe diverse**. Con una replica più nodi conservano gli stessi dati; con il normale partizionamento locale più tabelle figlie restano gestite dallo stesso server. Lo sharding ha senso quando il limite è il volume, il carico di scrittura o un requisito di isolamento che un singolo nodo non soddisfa.

## Scegliere la chiave con una query concreta

In un servizio multi-tenant, una richiesta `(tenant_id, order_id)` può raggiungere un solo shard se tutti gli ordini del cliente risiedono insieme. Una richiesta che conosce soltanto `order_id` non sa dove andare: serve un indice di routing separato o una ricerca su più nodi. Un tenant che genera metà del traffico resta un punto caldo anche distribuendo bene tutti gli altri.

## Laboratorio: una mappa esplicita

Questa query non crea server né sposta dati: simula la decisione del router su un solo database. Le richieste sono separate dalla mappa affinché sia visibile anche il caso di un tenant non configurato.

```sql
WITH mappa(tenant_id, shard) AS (
  VALUES (10, 'eu_1'), (20, 'eu_2'), (30, 'eu_1')
), richieste(tenant_id) AS (
  VALUES (10), (20), (99)
)
SELECT r.tenant_id, m.shard
FROM richieste AS r LEFT JOIN mappa AS m USING (tenant_id)
ORDER BY r.tenant_id;
```

Risultati: `10 → eu_1`, `20 → eu_2`, `99 → NULL`. Un router deve rifiutare o accodare l'ultima richiesta finché non esiste un'assegnazione: scegliere un nodo di default rischia di creare una seconda copia autorevole. In produzione la mappa deve essere disponibile, versionata e coerente con eventuali migrazioni.

## Vincoli e operazioni tra nodi

- Una chiave univoca sullo shard non impedisce lo stesso valore su un altro. Per un vincolo globale servono una regola di collocazione che porti tutti i possibili duplicati sullo stesso nodo, oppure coordinamento esplicito.
- Per un report globale, somma i parziali disgiunti. Per una **media** combina somme e conteggi, non le medie locali: 1 ordine da 100 e 9 da 10 danno `190 / 10 = 19`, non `(100 + 10) / 2 = 55`.
- Con routing per intervallo, hash o directory cambiano i costi di ribilanciamento. Usare direttamente `hash(chiave) % numero_nodi` può rimappare molte chiavi quando aggiungi un nodo. Una mappa tra gruppi logici e nodi permette di spostarli separatamente.
- Per spostare un tenant: copia, recupera le modifiche concorrenti o sospendi le sue scritture, verifica i dati, quindi cambia il routing impedendo scritture sulla vecchia destinazione. Prevedi come ripristinare **sia mappa sia dati** a uno stato coerente.

PostgreSQL offre strumenti come `postgres_fdw` per accedere a tabelle remote, non un router generale che risolve automaticamente vincoli globali, ribilanciamento o failover. Prima di distribuire i dati, confronta l'alternativa locale su un carico rappresentativo.

## Fonti

[PostgreSQL 18: partizionamento](https://www.postgresql.org/docs/18/ddl-partitioning.html) · [postgres_fdw: operazioni e transazioni remote](https://www.postgresql.org/docs/18/postgres-fdw.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Partitioning|Partitioning]]
- [[Programmazione/PostgreSQL/Pagine/Read replicas|Read replicas]]
- [[Programmazione/PostgreSQL/Pagine/FDW|FDW]]
