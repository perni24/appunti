---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [postgresql, database]
aliases: [Window Functions]
prerequisites: []
related: []
---

# Window Functions in PostgreSQL

## Sintesi

Le window function calcolano valori rispetto a gruppi ordinati di righe senza collassare il risultato come farebbe `GROUP BY`. Partizione, ordinamento e frame determinano quali righe partecipano al calcolo di ranking, aggregati progressivi, `lag`, `lead` e confronti temporali.

## Quando usarlo

Usa le window functions quando vuoi calcolare valori di contesto senza perdere il dettaglio delle righe:

- ranking di righe dentro un gruppo;
- totale cumulativo nel tempo;
- confronto con la riga precedente o successiva;
- percentuale rispetto al totale del gruppo;
- deduplicazione scegliendo la riga piu recente per ogni chiave;
- analisi temporali su serie ordinate.

Se vuoi una sola riga per gruppo, usa `GROUP BY`. Se vuoi mantenere tutte le righe, usa una window function.

## Come funziona

### Concetto chiave
Le **Window Functions** permettono di eseguire calcoli su un insieme di righe correlate alla riga corrente, senza però raggrupparle in un'unica riga di output (come fa il `GROUP BY`). Questo consente di mantenere i dettagli della singola riga pur avendo accesso a dati aggregati del contesto circostante (la "finestra").

---
### Funzioni Comuni
### 1. Funzioni di Ranking
- **`ROW_NUMBER()`**: Assegna un numero progressivo univoco alle righe.
- **`RANK()`**: Assegna un rango. In caso di parità, lascia dei "buchi" nella numerazione.
- **`DENSE_RANK()`**: Come `RANK`, ma senza buchi nella numerazione.

### 2. Funzioni di Valore (Navigazione)
- **`LAG(col, n)`**: Accede al valore della colonna `col` di `n` righe **precedenti**.
- **`LEAD(col, n)`**: Accede al valore di `n` righe **successive**.
- **`FIRST_VALUE()` / `LAST_VALUE()`**: Restituiscono il primo o l'ultimo valore della finestra.

### 3. Aggregazioni Windowed
Puoi usare le classiche funzioni di aggregazione (`SUM`, `AVG`, `COUNT`) come window functions.
- `SUM(vendite) OVER (ORDER BY data)` -> Crea una **somma cumulativa** (Running Total).

---
### Logic layer: Window Functions vs GROUP BY
| Caratteristica | GROUP BY | Window Function |
| :--- | :--- | :--- |
| **Effetto sulle righe** | Riduce il numero di righe (collassa i gruppi). | Mantiene tutte le righe originali. |
| **Dettagli** | Perdi i dettagli della singola riga. | Puoi mostrare dati atomici e aggregati insieme. |
| **Utilizzo** | Report di sintesi. | Analisi comparative, ranking, trend temporali. |

> [!INFO] ESECUZIONE
> Le window functions vengono eseguite **dopo** le clausole `WHERE`, `GROUP BY` e `HAVING`, ma **prima** dell' `ORDER BY` finale della query.

---

## API / Sintassi

### Sintassi Fondamentale
La caratteristica distintiva è la clausola **`OVER`**, che definisce la finestra di dati su cui operare.

```sql
SELECT colonna, 
       funzione_window() OVER (
           PARTITION BY colonna_gruppo 
           ORDER BY colonna_ordinamento
       )
FROM tabella;
```

### Componenti della Finestra:
- **`PARTITION BY`**: Divide le righe in gruppi logici (simile a un raggruppamento locale). Se omesso, la finestra è l'intero set di risultati.
- **`ORDER BY`**: Definisce l'ordine delle righe all'interno della partizione. È fondamentale per funzioni di ranking o calcoli cumulativi.
- **Frame Clause**: Definisce ulteriormente i confini della finestra (es. "le 3 righe precedenti e la corrente").

---

## Esempio pratico

Calcolare il contributo percentuale di ogni vendita rispetto al totale del reparto, senza perdere il dettaglio della singola vendita.

```sql
SELECT reparto, 
       prodotto, 
       prezzo,
       SUM(prezzo) OVER(PARTITION BY reparto) as totale_reparto,
       ROUND(prezzo * 100.0 / SUM(prezzo) OVER(PARTITION BY reparto), 2) as percentuale
FROM vendite;
```

---

## Varianti

- Ranking: `row_number()`, `rank()`, `dense_rank()`.
- Navigazione: `lag()`, `lead()`, `first_value()`, `last_value()`.
- Aggregazioni su finestra: `sum() over (...)`, `avg() over (...)`, `count() over (...)`.
- Frame temporali o posizionali: `ROWS BETWEEN ...` o `RANGE BETWEEN ...`.
- Finestra nominata con `WINDOW`.

Esempio di deduplicazione:

```sql
SELECT *
FROM (
  SELECT
    users.*,
    row_number() OVER (
      PARTITION BY email
      ORDER BY updated_at DESC
    ) AS row_rank
  FROM users
) AS ranked_users
WHERE row_rank = 1;
```

Esempio di totale cumulativo:

```sql
SELECT
  created_at::date AS day,
  total_amount,
  sum(total_amount) OVER (
    ORDER BY created_at::date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total
FROM orders;
```

## Errori comuni

- Confondere `PARTITION BY` con `GROUP BY`: la partizione non riduce le righe.
- Omettere `ORDER BY` quando l'ordine e necessario per ranking o funzioni come `lag`.
- Usare `last_value()` senza capire il frame predefinito.
- Applicare filtri su una window function nella stessa query senza subquery o CTE.
- Creare ordinamenti costosi senza indici coerenti su dataset grandi.

## Checklist

### Best Practices
- **Alias della Finestra**: Se usi la stessa finestra per più colonne, puoi definirla una sola volta alla fine della query per pulizia:
  `SELECT ... WINDOW w AS (PARTITION BY ... ORDER BY ...)`
- **Attenzione ai Frame**: Se usi solo `ORDER BY` senza specificare un frame, Postgres assume di default `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, il che può influire sulle performance.
- Verificare se serve mantenere tutte le righe o aggregarle.
- Esplicitare il frame quando il risultato dipende dai confini della finestra.
- Usare una subquery o CTE per filtrare il risultato di una window function.
- Controllare il piano query se ci sono grandi ordinamenti.

---

## Collegamenti

- [[Programmazione/Postgres/Pagine/Aggregazioni e GROUP BY|Aggregazioni e GROUP BY]]
- [[Programmazione/Postgres/Pagine/Common Table Expressions e Recursive Queries|Common Table Expressions e Recursive Queries]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]

## Fonti

- [PostgreSQL - Window Functions](https://www.postgresql.org/docs/current/tutorial-window.html)
- [PostgreSQL - Window Function Calls](https://www.postgresql.org/docs/current/sql-expressions.html#SYNTAX-WINDOW-FUNCTIONS)
