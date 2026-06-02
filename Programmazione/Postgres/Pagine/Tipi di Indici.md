---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Tipi di Indici]
prerequisites: []
related: []
---

# Tipi di Indici in PostgreSQL

## Sintesi

Nota su Tipi di Indici in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.

## Quando usarlo

Usa gli indici quando una query deve trovare poche righe, ordinare risultati o verificare vincoli senza scansionare tutta la tabella:

- filtri frequenti in `WHERE`;
- colonne usate in `JOIN`;
- ordinamenti ricorrenti con `ORDER BY`;
- vincoli `UNIQUE`;
- ricerche in `jsonb`, array o full text search;
- tabelle grandi con dati temporalmente ordinati.

Un indice non e sempre un miglioramento: ogni indice aumenta spazio su disco e costo di scrittura.

## Come funziona

### Concetto chiave
Gli **Indici** sono strutture di dati ausiliarie progettate per velocizzare il recupero delle righe filtrando i dati senza dover scansionare l'intera tabella (*Sequential Scan*). PostgreSQL offre una vasta gamma di tipi di indici, ognuno ottimizzato per specifici tipi di dati e operatori di confronto.

---
### Panoramica dei Tipi di Indici
### 1. B-Tree (Balanced Tree)
È il tipo di indice predefinito. È estremamente versatile e gestisce la maggior parte dei tipi di dati comuni.
- **Utilizzo**: Operatori di confronto standard (`<`, `<=`, `=`, `>=`, `>`).
- **Ottimale per**: Ricerche puntuali e ordinamenti (range queries).

### 2. Hash
Memorizza un hash a 32 bit del valore della colonna indicizzata.
- **Utilizzo**: Solo per operatori di uguaglianza (`=`).
- **Nota**: In passato erano sconsigliati, ma dalla versione 10+ sono robusti e performanti. Non supportano l'ordinamento.

### 3. GIN (Generalized Inverted Index)
Fondamentale per dati "multivalore" dove una singola colonna contiene più elementi ricercabili.
- **Utilizzo**: [[Programmazione/Postgres/Pagine/Tipi di Dato|Array]], [[Programmazione/Postgres/Pagine/Full Text Search|Full Text Search]], `JSONB`.
- **Punto di forza**: Ideale quando si ha bisogno di indicizzare le chiavi o i valori all'interno di un documento JSON.

### 4. GiST (Generalized Search Tree)
Una struttura ad albero bilanciata che permette di implementare schemi di indicizzazione personalizzati.
- **Utilizzo**: Dati geometrici (punti, poligoni), range types, Full Text Search.
- **Operatori**: "contiene", "all'interno di", "distanza minima".

### 5. BRIN (Block Range Index)
Invece di indicizzare ogni riga, BRIN memorizza i valori minimi e massimi di ogni blocco di pagine.
- **Utilizzo**: Tabelle gigantesche (miliardi di righe) dove i dati hanno una correlazione naturale con l'inserimento fisico (es. log cronologici, sensori).
- **Vantaggio**: Occupano uno spazio infinitesimale rispetto a un B-Tree.

### 6. SP-GiST (Space-Partitioned GiST)
Ottimizzato per partizionare spazi non bilanciati.
- **Utilizzo**: Strutture a prefisso (Trie), alberi quadrati, dati con distribuzioni molto irregolari.

---
### Logic layer: Quale indice scegliere?
> [!IMPORTANT] Criteri di Selezione
> 1. **Dati standard (Stringhe, Numeri)**: Sempre **B-Tree**.
> 2. **Dati JSONB**: Quasi sempre **GIN** per permettere ricerche veloci sulle chiavi interne.
> 3. **Dati Geografici (PostGIS)**: Sempre **GiST**.
> 4. **Tabelle di Log enormi (Time Series)**: Considera **BRIN** per risparmiare spazio su disco pur mantenendo prestazioni di scansione accettabili.

---

## API / Sintassi

```sql
CREATE INDEX index_name ON table_name (column_name);

CREATE UNIQUE INDEX index_name ON table_name (column_name);

CREATE INDEX CONCURRENTLY index_name ON table_name (column_name);

DROP INDEX CONCURRENTLY index_name;
```

Tipi principali:

```sql
CREATE INDEX users_email_btree_idx ON users USING btree (email);
CREATE INDEX events_payload_gin_idx ON events USING gin (payload);
CREATE INDEX bookings_period_gist_idx ON bookings USING gist (period);
CREATE INDEX logs_created_at_brin_idx ON logs USING brin (created_at);
```

## Esempio pratico

Query lenta:

```sql
SELECT id, email
FROM users
WHERE email = 'ada@example.com';
```

Indice adatto:

```sql
CREATE UNIQUE INDEX users_email_idx ON users (email);
```

Query su JSONB:

```sql
SELECT id
FROM events
WHERE payload @> '{"type": "checkout"}';
```

Indice adatto:

```sql
CREATE INDEX events_payload_gin_idx ON events USING gin (payload);
```

## Varianti

- B-tree: default, adatto a uguaglianza, range e ordinamento.
- Hash: uguaglianza pura, uso piu specialistico.
- GIN: valori composti come array, `jsonb` e full text search.
- GiST: range, geometrie, esclusione e operatori specializzati.
- BRIN: tabelle molto grandi con dati fisicamente correlati.
- SP-GiST: dati partizionabili nello spazio o per prefisso.
- Indici parziali: indicizzano solo righe che soddisfano una condizione.
- Indici coprenti: includono colonne extra con `INCLUDE`.

## Errori comuni

- Indicizzare ogni colonna senza una query reale da ottimizzare.
- Creare indici ridondanti che hanno lo stesso prefisso di altri indici.
- Ignorare il costo degli indici su scritture frequenti.
- Aspettarsi che un indice venga usato anche quando la query restituisce molte righe.
- Usare funzioni nella `WHERE` senza un expression index coerente.
- Creare indici in produzione senza `CONCURRENTLY` quando la tabella deve restare scrivibile.

## Checklist

### Best Practices
- **Non indicizzare tutto**: Ogni indice rallenta le operazioni di scrittura (`INSERT`, `UPDATE`, `DELETE`) perché Postgres deve aggiornare anche l'indice.
- **Indici su Foreign Keys**: Postgres non crea automaticamente indici sulle chiavi esterne; ricordati di crearli se prevedi frequenti `JOIN`.
- **Monitoraggio**: Usa `pg_stat_user_indexes` per identificare indici mai utilizzati che consumano spazio e risorse inutilmente.
- **CREATE INDEX CONCURRENTLY**: In ambienti di produzione, usa questa keyword per creare un indice senza bloccare le scritture sulla tabella.
- Collegare ogni indice a una query o a un vincolo concreto.
- Controllare `EXPLAIN` prima e dopo la creazione.
- Monitorare indici inutilizzati con `pg_stat_user_indexes`.
- Rimuovere indici duplicati o non usati dopo verifica.

---

## Collegamenti

- [[Programmazione/Postgres/Pagine/Indici Parziali e Coprenti|Indici Parziali e Coprenti]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/Postgres/Pagine/Statistiche e Query Planner|Statistiche e Query Planner]]
