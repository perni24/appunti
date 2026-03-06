---
date: 2026-03-06
tags:
  - database
  - postgres
  - sql
  - analytics
type: #permanent-note
status: evergreen
---

# Window Functions in PostgreSQL

## 💡 Concetto Chiave
Le **Window Functions** permettono di eseguire calcoli su un insieme di righe correlate alla riga corrente, senza però raggrupparle in un'unica riga di output (come fa il `GROUP BY`). Questo consente di mantenere i dettagli della singola riga pur avendo accesso a dati aggregati del contesto circostante (la "finestra").

---

## 📝 Sintassi Fondamentale

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

## 🏗️ Funzioni Comuni

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

## 💻 Esempio Pratico
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

## ⚙️ Logic Layer: Window Functions vs GROUP BY

| Caratteristica | GROUP BY | Window Function |
| :--- | :--- | :--- |
| **Effetto sulle righe** | Riduce il numero di righe (collassa i gruppi). | Mantiene tutte le righe originali. |
| **Dettagli** | Perdi i dettagli della singola riga. | Puoi mostrare dati atomici e aggregati insieme. |
| **Utilizzo** | Report di sintesi. | Analisi comparative, ranking, trend temporali. |

> [!INFO] ESECUZIONE
> Le window functions vengono eseguite **dopo** le clausole `WHERE`, `GROUP BY` e `HAVING`, ma **prima** dell' `ORDER BY` finale della query.

---

## ⚠️ Best Practices
- **Alias della Finestra**: Se usi la stessa finestra per più colonne, puoi definirla una sola volta alla fine della query per pulizia:
  `SELECT ... WINDOW w AS (PARTITION BY ... ORDER BY ...)`
- **Attenzione ai Frame**: Se usi solo `ORDER BY` senza specificare un frame, Postgres assume di default `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, il che può influire sulle performance.

---
