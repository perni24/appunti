---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Full Text Search]
prerequisites: []
related: []
---

# Full Text Search in PostgreSQL

## Sintesi

Il **Full Text Search** permette ricerche testuali avanzate usando dizionari, stemming, stop words, ranking e indici GIN. E piu espressivo di `LIKE` per testi lunghi e ricerche per parole.

## Quando usarlo

Usalo quando devi cercare dentro:

- articoli;
- documentazione;
- descrizioni prodotto;
- ticket e commenti;
- log testuali;
- contenuti multilingua.

Non sostituisce sempre motori dedicati come Elasticsearch/OpenSearch, ma e spesso sufficiente per ricerca integrata in applicazioni PostgreSQL.

## Come funziona

PostgreSQL converte il testo in `tsvector`, cioe una rappresentazione normalizzata dei termini. La query viene convertita in `tsquery`. L'operatore `@@` verifica se il documento corrisponde alla query.

La lingua scelta influenza stemming e stop words. Per performance, il `tsvector` viene spesso salvato in una colonna generata e indicizzato con GIN.

## API / Sintassi

Ricerca base:

```sql
SELECT to_tsvector('italian', 'I database sono strumenti potenti')
       @@ to_tsquery('italian', 'strumenti & potente');
```

Colonna generata:

```sql
ALTER TABLE articles
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('italian', coalesce(title, '') || ' ' || coalesce(body, ''))
) STORED;
```

Indice:

```sql
CREATE INDEX articles_search_vector_idx
ON articles
USING gin (search_vector);
```

## Esempio pratico

Ricerca con ranking:

```sql
SELECT
  title,
  ts_rank(search_vector, query) AS rank
FROM articles,
     plainto_tsquery('italian', 'postgres performance') AS query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 20;
```

Snippet evidenziato:

```sql
SELECT ts_headline('italian', body, plainto_tsquery('italian', 'postgres performance'))
FROM articles
WHERE search_vector @@ plainto_tsquery('italian', 'postgres performance');
```

## Varianti

- `to_tsquery`: query esplicita con operatori.
- `plainto_tsquery`: converte testo naturale in query.
- `websearch_to_tsquery`: sintassi simile a motori web.
- `ts_rank` e `ts_rank_cd`: ranking.
- `setweight`: peso diverso per titolo e corpo.
- GIN index su `tsvector`.

## Errori comuni

- Usare la lingua sbagliata.
- Calcolare `to_tsvector` al volo su ogni query senza indice.
- Confondere ricerca full text con substring search.
- Non gestire `NULL` con `coalesce`.
- Non pesare titolo e corpo quando hanno importanza diversa.
- Aspettarsi fuzzy search automatica per errori di battitura.

## Checklist

- La lingua del dizionario e corretta?
- Esiste un indice GIN sul `tsvector`?
- Il `tsvector` combina i campi giusti?
- Il ranking produce risultati sensati?
- Serve evidenziazione con `ts_headline`?
- Serve un motore esterno per fuzzy search, sinonimi complessi o scala maggiore?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Tipi di Indici|Tipi di Indici]]
- [[Programmazione/Postgres/Pagine/Tipi di Dato|Tipi di Dato]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]
