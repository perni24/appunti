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
  - tipi-di-dato
aliases:
  - Tipi numerici
  - testuali e temporali
prerequisites: []
related: []
title: Tipi numerici, testuali e temporali
---

# Tipi numerici, testuali e temporali

## Sintesi

Scegli il tipo in base alla domanda che farai al dato: una fattura scade in un **giorno di calendario**, un pagamento avviene in un **istante**, il saldo si calcola su **importi decimali**. Una stringa può contenere tutti e tre, ma non ne garantisce l'ordinamento, la validità o l'aritmetica.

## Numeri e testo

| Caso | Tipo utile | Limite da conoscere |
| --- | --- | --- |
| Conteggio o quantità indivisibile | `integer`; `bigint` se serve più intervallo | Numeri negativi ammessi: per vietarli serve un vincolo |
| Importo in una valuta nota | `numeric(p,s)` | Con `numeric(5,2)` PostgreSQL arrotonda ai centesimi e poi controlla che restino al massimo tre cifre intere: `999.995` va fuori intervallo |
| Misura approssimata | `real` o `double precision` | Non usare l'uguaglianza tra risultati arrotondati come garanzia contabile |
| Nome o identificatore alfanumerico | `text`; `varchar(n)` per un vero massimo di `n` caratteri | `varchar(n)` non è un'accelerazione. Un cast esplicito può troncare un valore lungo invece di rifiutarlo; `char(n)` aggiunge spazi di riempimento |

## Giorno, ora locale o istante?

- `date` conserva un giorno, senza fuso. `time` conserva un orario senza data; da solo non identifica un evento.
- `timestamp without time zone` conserva data e ora civile, non il fuso. `timestamptz` conserva un istante: la visualizzazione dipende dal fuso della sessione e non conserva il nome del fuso originario. Se quel nome è un dato del dominio, salvalo a parte.
- `interval` può esprimere mesi, giorni e tempo. Aggiungere un mese non equivale a sommare un numero fisso di secondi; in un fuso con ora legale un giorno di calendario può durare più o meno di 24 ore.

`AT TIME ZONE` cambia significato in base al tipo di partenza. Questo blocco è indipendente dal laboratorio sulle fatture:

```sql
SELECT (timestamp '2026-07-01 10:00' AT TIME ZONE 'Europe/Rome')
         = timestamptz '2026-07-01 08:00+00' AS same_instant,
       timestamptz '2026-07-01 08:00+00' AT TIME ZONE 'Europe/Rome' AS wall_time;
```

Risultato: vero e `2026-07-01 10:00:00`. Da sinistra a destra, la prima espressione **interpreta** le dieci come ora di Roma; la seconda **mostra** quell'istante sull'orologio di Roma.

## Esempio: fatture scadute e totale emesso

Esegui i due blocchi seguenti nella stessa sessione. Importi in euro; `due_on` è l'ultimo giorno utile per pagare. Fissare la data di osservazione rende ripetibile il risultato.

```sql
BEGIN;
CREATE TEMP TABLE lab_invoices (
  number text PRIMARY KEY,
  amount numeric(8,2) NOT NULL CHECK (amount >= 0),
  issued_on date NOT NULL,
  due_on date NOT NULL CHECK (due_on >= issued_on),
  paid_at timestamptz
);
INSERT INTO lab_invoices VALUES
  ('A', 19.995, DATE '2026-05-02', DATE '2026-06-01', NULL),
  ('B', 30,     DATE '2026-05-08', DATE '2026-06-02', NULL),
  ('C', 10,     DATE '2026-06-01', DATE '2026-06-01', timestamptz '2026-06-01 09:00+00');
```

```sql
SELECT number, amount FROM lab_invoices
WHERE paid_at IS NULL AND due_on < DATE '2026-06-02'
ORDER BY number;

SELECT date_trunc('month', issued_on::timestamp)::date AS month, sum(amount) AS issued
FROM lab_invoices
GROUP BY 1 ORDER BY 1;
ROLLBACK;
```

Nello stato del campione, la sola fattura **ancora insoluta** già scaduta il 2 giugno è A (`20.00` dopo l'arrotondamento); B è pagabile anche quel giorno, C risulta pagata. Il totale **emesso**, non incassato, è `50.00` a maggio e `10.00` a giugno. Se devi ricostruire lo stato *storico* a fine giornata, `paid_at IS NULL` da solo non basta: includi anche i pagamenti successivi al limite e traduci quel limite in un istante nel fuso contabile.

**Fonti PostgreSQL 18:** [tipi numerici](https://www.postgresql.org/docs/18/datatype-numeric.html), [tipi testuali](https://www.postgresql.org/docs/18/datatype-character.html), [funzioni temporali e AT TIME ZONE](https://www.postgresql.org/docs/18/functions-datetime.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Tipi di Dato|Tipi di Dato]]
- [[Programmazione/PostgreSQL/Pagine/Vincoli|Vincoli]]
- [[Programmazione/PostgreSQL/Pagine/Indici Parziali e Coprenti|Indici Parziali e Coprenti]]
