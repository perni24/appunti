---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [postgresql, database]
aliases: [Tipi di Dato]
prerequisites: []
related: []
---

# Tipi di Dato in PostgreSQL

## Sintesi

PostgreSQL ha un sistema di tipi molto ricco: numeri, testo, date, booleani, UUID, JSONB, array, range, enum e tipi geometrici. Scegliere bene il tipo riduce conversioni, ambiguita, bug applicativi e sprechi di spazio.

## Quando usarlo

Questa nota serve quando devi progettare colonne, vincoli e indici:

- scegliere tra `integer`, `bigint`, `numeric` e floating point;
- decidere tra `text`, `varchar(n)` e `char(n)`;
- gestire date e orari con `timestamp` o `timestamptz`;
- modellare dati semi-strutturati con `jsonb`;
- usare `uuid` per identificatori non sequenziali;
- rappresentare intervalli con range types;
- evitare colonne troppo generiche che spostano tutta la validazione nell'applicazione.

## Come funziona

Il tipo di dato definisce cosa puo essere memorizzato, come viene confrontato, come puo essere indicizzato e quali operatori sono disponibili.

---
### Tipi comuni

- `integer`, `bigint`: interi.
- `numeric`, `decimal`: numeri esatti, adatti a denaro e calcoli contabili.
- `real`, `double precision`: floating point approssimati.
- `text`: testo libero.
- `varchar(n)`: testo con limite massimo.
- `boolean`: vero/falso.
- `date`, `time`, `timestamp`, `timestamptz`, `interval`: valori temporali.
- `uuid`: identificatori univoci.

### Tipi avanzati

- `jsonb`: documenti JSON in formato binario, indicizzabili.
- `array`: liste di valori dello stesso tipo.
- `daterange`, `tsrange`, `tstzrange`: intervalli.
- `enum`: insieme finito di valori.
- `inet`, `cidr`, `macaddr`: indirizzi di rete.

`jsonb` e potente, ma non deve sostituire automaticamente la modellazione relazionale. Se un campo e stabile, interrogato spesso o vincolabile, una colonna normale e spesso migliore.

## API / Sintassi

```sql
CREATE TABLE accounts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  balance numeric(12, 2) NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Range type:

```sql
SELECT daterange('2026-01-01', '2026-01-31') @> '2026-01-15'::date;
```

## Esempio pratico

Tabella per prenotazioni con intervallo temporale:

```sql
CREATE TABLE bookings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id bigint NOT NULL,
  period tstzrange NOT NULL,
  guest_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Il range permette di usare operatori specifici, per esempio sovrapposizione:

```sql
SELECT *
FROM bookings
WHERE period && tstzrange('2026-06-01 10:00+02', '2026-06-01 12:00+02');
```

## Varianti

- `serial`/`bigserial`: scorciatoie storiche basate su sequence.
- `GENERATED ... AS IDENTITY`: scelta moderna per colonne autoincrementali.
- `json` vs `jsonb`: `json` conserva il testo, `jsonb` e piu adatto a query e indici.
- `timestamp` vs `timestamptz`: il secondo rappresenta un istante assoluto.
- `text` vs `varchar(n)`: `varchar(n)` serve quando il limite e una regola del dominio.
- `enum` vs tabella di lookup: la tabella e piu flessibile se i valori cambiano spesso.

## Errori comuni

- Usare `double precision` per importi monetari.
- Usare `timestamp` senza timezone per eventi applicativi globali.
- Modellare tutto come `text` e perdere vincoli utili.
- Usare `jsonb` per dati che dovrebbero essere colonne relazionali.
- Usare `char(n)` per testo normale, ottenendo padding e confronti meno intuitivi.
- Scegliere `integer` per ID destinati a crescere molto.

## Checklist

- Scegliere il tipo piu specifico che descrive il dominio.
- Usare `numeric` per valori esatti.
- Preferire `timestamptz` per eventi nel tempo.
- Aggiungere vincoli coerenti con il tipo.
- Valutare indici compatibili con operatori e query previste.
- Non usare `jsonb` per evitare la progettazione dello schema.

## Collegamenti

- [[Programmazione/Postgres/Pagine/Tipi numerici testuali e temporali|Tipi numerici, testuali e temporali]]
- [[Programmazione/Postgres/Pagine/Vincoli|Vincoli]]
- [[Programmazione/Postgres/Pagine/Indici Parziali e Coprenti|Indici Parziali e Coprenti]]
