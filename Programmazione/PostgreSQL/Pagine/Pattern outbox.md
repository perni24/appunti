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
  - pattern
  - integrazione
aliases: []
prerequisites: []
related: []
title: Pattern outbox
---

# Pattern outbox

## Sintesi

Con una *transactional outbox*, la modifica di dominio e l'intenzione di pubblicare un evento sono scritte nella **stessa transazione PostgreSQL**. Non c'è un commit condiviso con il broker: dopo il commit l'ordine può essere già pagato mentre il messaggio è ancora in attesa. Il vantaggio è che, se il relay si ferma, sa da quale evento ripartire.

## Laboratorio: un evento solo se l'ordine cambia stato

In un database di prova con nomi liberi, prepara un ordine pendente. `event_id` identifica il **medesimo evento** in tutti i tentativi di invio; `order_id` identifica invece l'entità, che può generare molti eventi nel corso della sua vita.

```sql
CREATE TABLE lab_orders (id bigint PRIMARY KEY, status text NOT NULL);
CREATE TABLE lab_outbox (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id bigint NOT NULL, kind text NOT NULL, payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz
);
CREATE INDEX lab_outbox_pending ON lab_outbox (created_at, event_id)
WHERE published_at IS NULL;
INSERT INTO lab_orders VALUES (42, 'pending');
```

```sql
WITH paid AS (
  UPDATE lab_orders SET status = 'paid'
  WHERE id = 42 AND status = 'pending' RETURNING id
)
INSERT INTO lab_outbox (order_id, kind, payload)
SELECT id, 'order.paid', jsonb_build_object('order_id', id) FROM paid
RETURNING order_id, kind;
```

La prima esecuzione restituisce `42, order.paid`; la seconda nessuna riga. Anche per un ordine inesistente non viene inserito niente. Lo statement è atomico: se l'inserimento nell'outbox fallisce o la transazione esterna viene annullata, non resta nemmeno il cambio di stato. Un `UPDATE` che modifica zero righe **non è un errore SQL**: è il collegamento tramite `RETURNING`, non il solo `BEGIN`, a evitare un evento senza transizione.

## Dal commit alla consegna

Un relay può interrogare gli eventi in attesa:

```sql
SELECT event_id, order_id, kind, payload FROM lab_outbox
WHERE published_at IS NULL ORDER BY created_at, event_id LIMIT 100;
```

Questa è una lettura, **non una prenotazione**. Con più relay, usa un protocollo di assegnazione come nella nota sulle job table; il solo `SELECT FOR UPDATE SKIP LOCKED` in autocommit non mantiene la prenotazione dopo lo statement. Invia al broker lo stesso `event_id` e registra `published_at` solo dopo la conferma prevista dal broker. Marca l'esatto evento e, se usi una prenotazione con scadenza, controlla anche il token del tentativo.

| Quando si ferma il relay? | Effetto al riavvio |
| --- | --- |
| Prima dell'invio | L'evento è ancora da pubblicare |
| Dopo l'accettazione del broker, prima di registrarla in PostgreSQL | Il relay può inviare di nuovo lo **stesso** evento |
| Se lo marcasse prima dell'invio | Un arresto potrebbe far perdere il messaggio: è l'ordine da evitare |

## Provare la deduplica sul destinatario

Esempio locale di consumer. In produzione il consumer riceve ID e payload dal messaggio; qui li leggiamo dall'outbox **solo per simulare due consegne uguali senza broker**. Il registro appartiene a questo consumer e l'effetto dimostrativo è una scrittura SQL.

```sql
CREATE TABLE lab_seen_payments (event_id uuid PRIMARY KEY);
CREATE TABLE lab_payment_receipts (order_id bigint NOT NULL);
```

```sql
WITH accepted AS (
  INSERT INTO lab_seen_payments (event_id)
  SELECT event_id FROM lab_outbox WHERE kind = 'order.paid' AND order_id = 42
  ON CONFLICT (event_id) DO NOTHING RETURNING event_id
)
INSERT INTO lab_payment_receipts (order_id)
SELECT e.order_id FROM lab_outbox AS e JOIN accepted AS a USING (event_id)
RETURNING order_id;
```

Esegui due volte: prima `42`, poi zero righe. Registro ed effetto fanno commit insieme. Se l'effetto è esterno (per esempio un addebito), questo vincolo locale non basta: serve un'identità idempotente accettata dal destinatario o una riconciliazione. Conserva le chiavi di deduplica per la finestra di riconsegna prevista.

## Limiti operativi

Monitora età dell'evento pendente più vecchio, tentativi e messaggi non pubblicabili. `ORDER BY created_at` non garantisce ordine di commit o consegna per entità con relay concorrenti; se l'ordine conta, gestisci versione dell'aggregato e instradamento. Il logical decoding è un'alternativa al polling per alimentare il relay, non elimina la necessità di gestire duplicati.

## Fonti

[Transactional outbox: garanzie e duplicati](https://microservices.io/patterns/data/transactional-outbox.html) · [PostgreSQL 18: istruzioni di modifica nelle CTE](https://www.postgresql.org/docs/18/queries-with.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Code e job table|Code e job table]]
- [[Programmazione/PostgreSQL/Pagine/Logical decoding|Logical decoding]]
- [[Programmazione/PostgreSQL/Pagine/Meccanismi di Locking|Meccanismi di Locking]]
