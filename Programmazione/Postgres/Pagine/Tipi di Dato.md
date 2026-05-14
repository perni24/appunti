---
date: 2026-05-14
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Tipi di Dato]
prerequisites: []
related: []
---
# Tipi di Dato in PostgreSQL

## Sintesi

Nota su Tipi di Dato in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.

## Concetto chiave
PostgreSQL offre uno dei sistemi di tipi più ricchi e flessibili nel mondo dei database relazionali. Oltre ai tipi standard SQL, include supporto nativo per strutture complesse come array, documenti JSON binari e intervalli, permettendo di modellare i dati in modo preciso ed efficiente senza dover ricorrere a database NoSQL esterni.

---

##  Tipi Primitivi e Comuni

### 1. Numerici
- **`integer` / `int`**: Intero a 4 byte (range ±2 miliardi).
- **`bigint`**: Intero a 8 byte, usato per ID di grandi dimensioni.
- **`numeric` / `decimal`**: Precisione arbitraria, essenziale per dati finanziari (es. `numeric(10, 2)`).
- **`real` / `double precision`**: Numeri a virgola mobile (approssimati).
- **`serial` / `bigserial`**: Non è un vero tipo, ma un'abbreviazione per creare una colonna autoincrementante legata a una **Sequence**.

### 2. Caratteri (Stringhe)
- **`text`**: Lunghezza illimitata (consigliato per la maggior parte dei casi). In Postgres, non c'è differenza di performance tra `text` e `varchar`.
- **`varchar(n)`**: Stringa a lunghezza variabile con un limite massimo `n`.
- **`char(n)`**: Stringa a lunghezza fissa, riempita con spazi bianchi.

### 3. Data e Ora
- **`timestamp`**: Data e ora senza timezone.
- **`timestamptz`**: Data e ora **con** fuso orario (Best Practice per applicazioni globali).
- **`date`**: Solo data.
- **`interval`**: Rappresenta un lasso di tempo (es. `'1 day 2 hours'`).

---

##  Tipi di Dato Avanzati

### 1. Array
Postgres permette a una colonna di contenere una lista di valori dello stesso tipo.
```sql
CREATE TABLE ricette (
    id serial PRIMARY KEY,
    ingredienti text[] -- Array di stringhe
);

INSERT INTO ricette (ingredienti) VALUES (ARRAY['uova', 'farina', 'zucchero']);
```

### 2. JSON e JSONB (NoSQL in SQL)
- **`json`**: Memorizza il testo esatto del JSON. Utile per log o audit dove l'ordine delle chiavi conta.
- **`jsonb`**: Formato binario decomposto. È più veloce da processare, supporta l'indicizzazione (**GIN index**) ed è la scelta standard per la maggior parte delle applicazioni.

### 3. Range Types (Intervalli)
Permettono di memorizzare un intervallo di valori in una singola colonna, garantendo l'integrità logica.
- **`int4range`**: Intervallo di interi.
- **`daterange`**: Intervallo di date.
- **`tstzrange`**: Intervallo di timestamp con timezone (es. per prenotazioni hotel).

```sql
# Tipi di Dato in PostgreSQL

## Sintesi

Nota su Tipi di Dato in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.
SELECT daterange('2026-01-01', '2026-01-31') @> '2026-01-15'::date; -- Risultato: True
```

---

## Logic layer: Perché usare `JSONB` e `TIMESTAMPTZ`?

> [!IMPORTANT] Scelte Architetturali
> 1. **`jsonb` vs `json`**: `jsonb` esegue il parsing all'inserimento, rendendo le query su singoli campi estremamente rapide grazie agli indici **GIN**. Scegli `json` solo se devi conservare la formattazione originale esatta.
> 2. **`timestamptz`**: Memorizza internamente tutto in UTC e converte automaticamente nel fuso orario richiesto dal client. Questo previene bug critici legati al cambio dell'ora legale o alla gestione di utenti in fusi orari diversi.

---
