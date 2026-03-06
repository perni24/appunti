---
date: 2026-03-06
tags:
  - database
  - postgres
  - sql
  - ricerca
type: #permanent-note
status: evergreen
---

# Full Text Search in PostgreSQL

## 💡 Concetto Chiave
Il **Full Text Search (FTS)** permette di eseguire ricerche testuali complesse all'interno di documenti, articoli o grandi moli di testo. A differenza dell'operatore `LIKE` (che esegue una ricerca per pattern testuale semplice), il sistema FTS di Postgres comprende il linguaggio: gestisce parole simili (stemming), ignora parole comuni (stop words) e supporta la pesatura dei risultati per pertinenza.

---

## 🏗️ I Due Pilastri: tsvector e tsquery

Perché la ricerca sia efficiente, Postgres converte il testo in tipi di dato specializzati:

1.  **`tsvector` (Text Search Vector)**: Rappresenta un documento preprocessato. È una lista di lessemi (radici delle parole) ordinati e ottimizzati per la ricerca.
2.  **`tsquery` (Text Search Query)**: Rappresenta i termini cercati, supportando operatori logici come AND (`&`), OR (`|`), e NOT (`!`).

```sql
# Esempio di conversione
SELECT to_tsvector('italian', 'I database sono strumenti potenti') @@ to_tsquery('italian', 'strumenti & potente');
# Risultato: True (grazie allo stemming di 'potente/potenti')
```

---

## ⚙️ Logic Layer: Processing del Testo

Quando si utilizza `to_tsvector`, Postgres esegue diversi passaggi:
- **Parser**: Divide il testo in token (parole, numeri, email).
- **Dictionary**: 
    - Esegue lo **Stemming**: riduce le parole alla radice (es. "correndo" -> "corr").
    - Rimuove le **Stop Words**: parole troppo comuni che non aiutano la ricerca (es. "il", "la", "e").

---

## 🚀 Indicizzazione e Performance (GIN Index)

Eseguire `to_tsvector` su ogni riga durante una ricerca `SELECT` è lento. Per performance elevate su milioni di righe, si utilizzano gli indici **GIN (Generalized Inverted Index)**.

```sql
# 1. Aggiungere una colonna generata per la ricerca
ALTER TABLE articoli ADD COLUMN search_idx tsvector 
GENERATED ALWAYS AS (to_tsvector('italian', titolo || ' ' || contenuto)) STORED;

# 2. Creare l'indice GIN
CREATE INDEX idx_fts_articoli ON articoli USING GIN(search_idx);
```

---

## 🔝 Ranking e Risultati

Postgres può ordinare i risultati in base alla loro pertinenza utilizzando la funzione `ts_rank`.

```sql
SELECT titolo, ts_rank(search_idx, query) AS rank
FROM articoli, to_tsquery('italian', 'postgres & performance') query
WHERE search_idx @@ query
ORDER BY rank DESC;
```

> [!TIP] Evidenziazione (Highlighting)
> Puoi usare la funzione `ts_headline` per generare uno snippet del testo che evidenzia i termini cercati, utile per le interfacce web.

---

## ⚠️ Considerazioni
- **Lingua**: È fondamentale specificare la lingua corretta (es. `'italian'`, `'english'`) perché i dizionari di stemming e le stop words cambiano drasticamente.
- **Peso (Weighting)**: Puoi assegnare pesi diversi a parti del documento (es. il titolo vale più del corpo) usando la funzione `setweight`.

---
