---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [programmazione, python, dati, pandas]
aliases: [pandas, DataFrame]
prerequisites: []
related: []
---

# pandas

## Sintesi

pandas e una libreria Python per analisi e manipolazione di dati tabellari. Le strutture principali sono `Series` e `DataFrame`.

E molto usata per pulizia dati, analisi esplorativa, import/export e trasformazioni prima di report, modelli o pipeline.

## Quando usarlo

Usa pandas per:

- leggere CSV, Excel, Parquet o JSON tabellari;
- pulire dati;
- gestire valori mancanti;
- filtrare e aggregare;
- fare analisi esplorativa;
- preparare dataset;
- lavorare in notebook Jupyter.

Per array numerici omogenei e calcolo intensivo, NumPy puo essere piu diretto.

## Come funziona

Lettura CSV:

```python
import pandas as pd

df = pd.read_csv("sales.csv")
```

Aggregazione:

```python
summary = df.groupby("region")["amount"].sum()
```

Un `DataFrame` rappresenta una tabella con righe, colonne, indici e tipi.

## API / Sintassi

Operazioni comuni:

```python
df.head()
df.info()
df.describe()
df["amount"]
df[["region", "amount"]]
```

Filtri:

```python
high_value = df[df["amount"] > 1000]
```

Valori mancanti:

```python
df = df.dropna(subset=["email"])
df["amount"] = df["amount"].fillna(0)
```

Export:

```python
df.to_csv("output.csv", index=False)
```

## Esempio pratico

Report vendite per regione:

```python
import pandas as pd

df = pd.read_csv("sales.csv")

df["amount"] = df["amount"].fillna(0)

summary = (
    df.groupby("region", as_index=False)["amount"]
    .sum()
    .sort_values("amount", ascending=False)
)

summary.to_csv("sales_by_region.csv", index=False)
```

## Varianti

- **Series**: colonna o sequenza monodimensionale.
- **DataFrame**: tabella bidimensionale.
- **GroupBy**: aggregazioni per gruppo.
- **Merge/join**: combinazione di tabelle.
- **Pivot**: ristrutturazione dati.
- **Resampling**: dati temporali.
- **pandas + NumPy**: pandas usa molte strutture numeriche sottostanti.

## Errori comuni

- Caricare dataset troppo grandi in memoria.
- Usare loop Python invece di operazioni vettoriali.
- Ignorare tipi e valori mancanti.
- Modificare view pensando di modificare copie.
- Non controllare `df.info()` dopo import.
- Usare pandas per pipeline di produzione senza test e validazione.
- Salvare indici nel CSV per errore.

## Checklist

- I dati entrano ragionevolmente in memoria?
- Tipi e colonne sono corretti dopo l'import?
- I valori mancanti sono gestiti?
- Le trasformazioni sono riproducibili?
- Gli output hanno formato e colonne attese?
- La logica critica e testata fuori dal notebook?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[NumPy]]
- [[Jupyter]]
- [[Gestione File]]
- [[Profiling]]
