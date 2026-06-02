---
date: 2026-06-02
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - tipi-di-dato
aliases:
  - Tipi numerici
  - testuali e temporali
prerequisites: []
related: []
---

# Tipi numerici, testuali e temporali

## Sintesi

PostgreSQL offre tipi numerici, testuali e temporali con semantiche diverse. Scegliere il tipo corretto evita sprechi, bug e conversioni inutili.

## Quando usarlo

Usa questa distinzione quando scegli colonne per dati applicativi comuni:

- ID, contatori e quantita intere;
- importi, prezzi e misure che richiedono precisione;
- testo libero, codici e stringhe con limite di dominio;
- date di calendario, timestamp di eventi, durate e scadenze;
- filtri e ordinamenti basati su tempo.

## Come funziona

### Tipi numerici
- `integer`, `bigint`: interi.
- `numeric`: precisione arbitraria, utile per denaro e calcoli esatti.
- `real`, `double precision`: floating point.
### Tipi testuali
- `text`: scelta generale consigliata.
- `varchar(n)`: testo con limite.
- `char(n)`: lunghezza fissa, raramente utile.
### Tipi temporali
- `timestamp`: data e ora senza timezone.
- `timestamptz`: istante assoluto con gestione timezone.
- `date`, `time`, `interval`.

## API / Sintassi

```sql
CREATE TABLE invoices (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_number text NOT NULL UNIQUE,
  amount numeric(12, 2) NOT NULL,
  issued_on date NOT NULL,
  paid_at timestamptz,
  payment_deadline interval
);
```

Conversioni comuni:

```sql
SELECT now()::date;
SELECT created_at AT TIME ZONE 'Europe/Rome';
SELECT date_trunc('day', created_at);
```

## Esempio pratico

Query per fatture scadute:

```sql
SELECT id, invoice_number, amount, issued_on
FROM invoices
WHERE paid_at IS NULL
  AND issued_on + interval '30 days' < current_date
ORDER BY issued_on;
```

Importi aggregati:

```sql
SELECT
  date_trunc('month', issued_on)::date AS month,
  sum(amount) AS total_amount
FROM invoices
GROUP BY date_trunc('month', issued_on)::date
ORDER BY month;
```

## Varianti

- `smallint`, `integer`, `bigint`: interi con range crescente.
- `numeric(p, s)`: precisione e scala dichiarate.
- `real`, `double precision`: approssimati, utili per misure scientifiche ma non per denaro.
- `text`: scelta generale per stringhe.
- `varchar(n)`: utile quando il limite massimo e una regola del dominio.
- `timestamp`: data e ora senza timezone.
- `timestamptz`: istante assoluto, di solito migliore per eventi applicativi.
- `interval`: durata.

## Errori comuni

- Usare floating point per denaro.
- Confondere `timestamp` e `timestamptz`.
- Salvare date come testo.
- Usare `varchar(n)` solo per abitudine, senza una regola reale sul limite.
- Usare `now()` e timezone applicative senza una convenzione chiara.
- Ordinare valori numerici salvati come testo.

## Checklist

- Per importi usare `numeric`.
- Per eventi nel tempo preferire `timestamptz`.
- Per date senza orario usare `date`.
- Per testo libero usare `text`.
- Per limiti di dominio usare `CHECK` o `varchar(n)` se il limite e significativo.
- Verificare che confronti e ordinamenti usino tipi coerenti.

## Collegamenti

- [[Programmazione/Postgres/Pagine/Tipi di Dato|Tipi di Dato]]
- [[Programmazione/Postgres/Pagine/Vincoli|Vincoli]]
- [[Programmazione/Postgres/Pagine/Indici Parziali e Coprenti|Indici Parziali e Coprenti]]
