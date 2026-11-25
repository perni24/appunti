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
  - Tipi di Dato
prerequisites: []
related: []
title: Tipi di Dato in PostgreSQL
---

# Tipi di Dato in PostgreSQL

## Sintesi

Scegli il tipo in base all'operazione che vuoi rendere corretta. Un saldo richiede somme decimali esatte; un evento avvenuto in un istante deve essere confrontabile tra fusi orari; un documento JSON potrebbe dover conservare il testo originale oppure essere interrogato per chiave. Sono esigenze diverse.

## Tipi comuni

| Esigenza | Tipo e criterio |
|---|---|
| Conteggi e identificatori | `integer` o `bigint` in base all'intervallo. `GENERATED … AS IDENTITY` genera valori, non impone da solo unicità; per identificare la riga aggiungi `PRIMARY KEY`. `serial` è la scorciatoia storica basata su sequenza. |
| Prezzi e misure | `numeric(p,s)` per precisione decimale e scala dichiarata; il valore viene arrotondato alla scala. `real` e `double precision` sono approssimati, adatti a misure che tollerano errori di rappresentazione. |
| Testo e stati | `text` per lunghezza variabile; `varchar(n)` per imporre un limite in caratteri, non come ottimizzazione automatica. `char(n)` aggiunge padding. Per stati semplici valuta `boolean`, un enum per un insieme stabile o una tabella di riferimento per un elenco che cambia. |
| Tempi | `date` per il giorno, `time` per l'ora civile, `interval` per una durata, `timestamp` per data e ora senza fuso. `timestamptz` rappresenta un istante: l'output segue il fuso di sessione e non conserva il nome del fuso originale. |
| Altri domini | `uuid` è un tipo per identificatori, non una garanzia di unicità fra righe. Array per più valori dello stesso tipo, range per intervalli, `inet`/`cidr`/`macaddr` per indirizzi o reti, tipi geometrici per oggetti geometrici supportati. |

`NULL` rappresenta l'assenza di un valore, non zero, stringa vuota o `false`. Testalo con `IS NULL`. Se l'assenza non è ammessa, dichiaralo con `NOT NULL`.

## Esempio: importo e istante

Esegui il blocco in una sessione di prova senza transazione aperta. Il saldo si arrotonda a `12.35`; i due orari identificano lo stesso istante. Nessuna tabella resta dopo il rollback.

```sql
BEGIN;
CREATE TEMP TABLE lab_accounts (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id uuid NOT NULL UNIQUE,
    balance numeric(12,2) NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
INSERT INTO lab_accounts (public_id, balance)
VALUES ('00000000-0000-4000-8000-000000000001', 12.345)
RETURNING balance, active;
SELECT timestamptz '2026-06-01 10:00+02'
     = timestamptz '2026-06-01 08:00+00' AS stesso_istante;
ROLLBACK;
```

## JSON e JSONB

`json` valida e conserva il testo JSON in ingresso (spazi, ordine e chiavi duplicate). `jsonb` conserva una rappresentazione elaborata: non conserva gli spazi né l'ordine delle chiavi, e per chiavi duplicate mantiene l'ultimo valore. È adatto a ricerche per contenimento, anche con indici GIN appropriati. Per campi stabili che richiedono vincoli o join preferisci colonne tipizzate.

```sql
SELECT '{"tier":"base","tier":"pro"}'::jsonb ->> 'tier' AS piano,
       '{"tier":"pro","active":true}'::jsonb @> '{"active":true}'::jsonb AS incluso,
       ('{"x":null}'::jsonb -> 'x') IS NULL AS null_sql,
       ('{}'::jsonb -> 'x') IS NULL AS chiave_assente;
```

Risultato: `pro`, `true`, `false`, `true`. Con `->` il valore JSON `null` è ancora un valore JSON, mentre una chiave assente dà SQL `NULL`. `->>` estrae invece testo e non mantiene questa distinzione.

## Range: il confine conta

Per una prenotazione usa `tstzrange` fra istanti; per giorni di calendario usa `daterange`. Con `[)` l'inizio è incluso e la fine esclusa: due turni contigui non si sovrappongono. `@>` verifica il contenimento e `&&` la sovrapposizione.

```sql
SELECT daterange('2026-01-01', '2026-02-01', '[)') @> DATE '2026-01-31' AS incluso,
       tstzrange('2026-06-01 10:00+02', '2026-06-01 12:00+02', '[)')
       && tstzrange('2026-06-01 12:00+02', '2026-06-01 14:00+02', '[)') AS sovrapposti;
```

Risultato: `true`, `false`. Scegliere il tipo range non vieta da solo prenotazioni sovrapposte: per quello serve un [[Programmazione/PostgreSQL/Pagine/Vincoli|vincolo di esclusione]].

**Fonti:** [tipi PostgreSQL 18](https://www.postgresql.org/docs/18/datatype.html), [JSON e JSONB](https://www.postgresql.org/docs/18/datatype-json.html) e [range](https://www.postgresql.org/docs/18/rangetypes.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Tipi numerici testuali e temporali|Tipi numerici, testuali e temporali]]
- [[Programmazione/PostgreSQL/Pagine/Vincoli|Vincoli]]
- [[Programmazione/PostgreSQL/Pagine/Indici Parziali e Coprenti|Indici Parziali e Coprenti]]
