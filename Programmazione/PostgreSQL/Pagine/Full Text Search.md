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
  - Full Text Search
prerequisites: []
related: []
title: Full Text Search in PostgreSQL
---

# Full Text Search in PostgreSQL

## Sintesi

La ricerca full text confronta i **termini normalizzati** di un documento (`tsvector`) con quelli di una domanda (`tsquery`), tramite `@@`. È adatta a cercare parole nella documentazione o nei ticket; non è una ricerca per sottostringa e non corregge automaticamente gli errori di battitura. La configurazione linguistica decide, tra l'altro, quali parole ignorare e come ricondurre forme flesse allo stesso termine.

## Preparare i documenti

Esegui i due blocchi nella stessa sessione. La colonna generata conserva il vettore e si aggiorna quando cambia il testo. Il peso A dà più rilievo al titolo rispetto al peso D del corpo. `coalesce` impedisce che un corpo nullo faccia perdere anche le parole del titolo.

```sql
BEGIN;
CREATE TEMP TABLE lab_docs (
  id integer PRIMARY KEY, title text NOT NULL, body text,
  terms tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('italian', title), 'A') ||
    setweight(to_tsvector('italian', coalesce(body, '')), 'D')
  ) STORED
);
CREATE INDEX lab_docs_terms_idx ON lab_docs USING gin (terms);
INSERT INTO lab_docs (id, title, body) VALUES
  (1, 'Stampanti', NULL),
  (2, 'Manuale', 'Controllare la stampante'),
  (3, 'Ricambi', 'Controllare il filtro');
```

## Cercare, ordinare e mostrare un estratto

```sql
WITH search(q) AS (SELECT websearch_to_tsquery('italian', 'stampante'))
SELECT id, title,
       ts_headline('italian', coalesce(body, title), q,
                   'StartSel=[, StopSel=]') AS excerpt
FROM lab_docs CROSS JOIN search
WHERE terms @@ q
ORDER BY ts_rank(terms, q) DESC, id;
ROLLBACK;
```

Risultati, in ordine: **1** (titolo «Stampanti») e **2** (corpo «Controllare la stampante»). Singolare e plurale corrispondono; il titolo pesa di più. Il filtro `@@` decide chi entra; `ts_rank` decide come ordinare i risultati e l'ID scioglie i pareggi. L'indice GIN aiuta a individuare le corrispondenze, **non** restituisce già le righe ordinate per rilevanza. Su tre documenti una scansione sequenziale è normale.

## Quale funzione per la domanda?

- `plainto_tsquery` collega con AND i termini utili del testo libero. `websearch_to_tsquery` accetta anche frasi tra virgolette, `OR` e il segno meno per escludere parole; è indicata per una casella di ricerca. Il testo dell'utente va comunque passato come **parametro SQL**.
- `to_tsquery` è adatta a un'espressione con operatori espliciti, per esempio `'stampante & filtro'`: non è un parser di testo libero. Una query composta solo da stop word può non contenere termini ricercabili.
- `ts_rank_cd` considera anche la vicinanza dei termini. Valuta la pertinenza su testi reali; con più lingue, scegli una configurazione coerente per documento e domanda. Per cercare un frammento di codice prodotto o tollerare refusi serve una strategia diversa.
- `ts_headline` crea un estratto, **non** rende il testo sicuro da inserire come HTML. Per una pagina web tratta l'estratto come testo oppure sanificalo prima di renderizzarlo come markup.

**Fonti PostgreSQL 18:** [costruzione, ranking ed estratti](https://www.postgresql.org/docs/18/textsearch-controls.html), [tabelle e indici per la ricerca](https://www.postgresql.org/docs/18/textsearch-tables.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Tipi di Indici|Tipi di Indici]]
- [[Programmazione/PostgreSQL/Pagine/Tipi di Dato|Tipi di Dato]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]
