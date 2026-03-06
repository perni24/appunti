---
date: 2026-03-06
tags:
  - database
  - postgres
  - sql
  - query-avanzate
type: #permanent-note
status: evergreen
---

# Common Table Expressions (CTE) e Recursive Queries

## 💡 Concetto Chiave
Le **Common Table Expressions (CTE)**, introdotte dallo statement `WITH`, permettono di creare dei set di risultati temporanei che esistono solo durante l'esecuzione di una singola query. Sono strumenti fondamentali per migliorare la leggibilità di query complesse (evitando subquery annidate) e per implementare la **ricorsione** su strutture dati gerarchiche.

---

## 📝 CTE Standard (Non-Ricorsive)

Una CTE funge da "tabella temporanea" leggibile solo all'interno della query principale.

```sql
WITH vendite_totali AS (
    SELECT id_prodotto, SUM(prezzo) as totale
    FROM vendite
    GROUP BY id_prodotto
)
SELECT p.nome, v.totale
FROM prodotti p
JOIN vendite_totali v ON p.id = v.id_prodotto
WHERE v.totale > 1000;
```

### Vantaggi:
- **Modularità:** Isola la logica complessa in blocchi separati.
- **Readability:** Rende la query simile a un programma procedurale ("prima prendi questo, poi quello").

---

## 🔄 Recursive Queries (WITH RECURSIVE)

Le query ricorsive sono utilizzate quando i dati hanno una struttura gerarchica (es. organigrammi, file system, grafi) e non si conosce a priori la profondità dei livelli.

### Struttura Sintattica:
1.  **Non-recursive term**: L'ancora di partenza (es. la radice dell'albero).
2.  **UNION [ALL]**: Unisce i risultati dei cicli successivi.
3.  **Recursive term**: La query che fa riferimento al nome della CTE stessa per "scendere" di livello.

```sql
# Esempio: Calcolare il percorso di una categoria padre-figlio
WITH RECURSIVE gerarchia AS (
    -- 1. Punto di partenza (Radice)
    SELECT id, nome, padre_id, 1 as livello
    FROM categorie 
    WHERE padre_id IS NULL
    
    UNION ALL
    
    -- 2. Passo ricorsivo (Figli)
    SELECT c.id, c.nome, c.padre_id, g.livello + 1
    FROM categorie c
    JOIN gerarchia g ON c.padre_id = g.id
)
SELECT * FROM gerarchia;
```

---

## ⚙️ Logic Layer: Come funziona la ricorsione in SQL?

PostgreSQL elabora la ricorsione nel seguente modo:
1.  Esegue il **termine non ricorsivo** e mette i risultati in una tabella temporanea di lavoro (*Working Table*).
2.  Esegue il **termine ricorsivo** usando il contenuto della *Working Table* finché non vengono più prodotte nuove righe.
3.  Ad ogni ciclo, i risultati vengono aggiunti al set finale e sostituiscono il contenuto della *Working Table*.

> [!CAUTION] Loop Infiniti
> Assicurati che la tua query ricorsiva abbia sempre una condizione di terminazione (es. una profondità massima o l'esaurimento dei nodi figli), altrimenti la query continuerà all'infinito consumando risorse del server.

---

## ⚠️ CTE e Performance (Materializzazione)
In passato, Postgres "materializzava" sempre le CTE (le scriveva in memoria temporanea rendendole opache all'ottimizzatore). 
- **Dalla versione 12+**: L'ottimizzatore può decidere di fare l'inline (unire la CTE alla query principale) per ottimizzare le performance, a meno di non forzare il comportamento con la keyword `MATERIALIZED` o `NOT MATERIALIZED`.

---