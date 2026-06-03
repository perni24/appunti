---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [programmazione, python, notebook, dati]
aliases: [Jupyter, Notebook Jupyter]
prerequisites: []
related: []
---

# Jupyter

## Sintesi

Jupyter permette di lavorare con notebook interattivi che combinano codice, output, testo, grafici e visualizzazioni. E molto usato per analisi esplorativa, data science, prototipi e didattica.

Il punto forte e l'interattivita. Il rischio principale e perdere riproducibilita se celle, stato e ordine di esecuzione non sono controllati.

## Quando usarlo

Usa Jupyter per:

- analisi esplorativa;
- prototipi rapidi;
- report tecnici;
- data science;
- visualizzazioni;
- didattica;
- esperimenti con dataset.

Per codice applicativo stabile, sposta la logica riusabile in moduli `.py`.

## Come funziona

Un notebook contiene celle:

- Markdown per testo e spiegazioni;
- codice Python;
- output;
- grafici;
- metadati.

Il kernel esegue il codice e mantiene stato in memoria. Questo significa che l'ordine reale di esecuzione conta piu della posizione visiva delle celle.

## API / Sintassi

Comandi comuni:

```bash
jupyter notebook
jupyter lab
```

In una cella:

```python
import pandas as pd

df = pd.read_csv("data.csv")
df.head()
```

Magic commands utili:

```python
%timeit sum(range(1000))
%pwd
```

## Esempio pratico

Workflow riproducibile:

1. crea un ambiente virtuale dedicato;
2. installa dipendenze;
3. apri Jupyter;
4. carica dati da path documentati;
5. esegui il notebook dall'inizio alla fine;
6. sposta funzioni riusabili in moduli `.py`;
7. salva output solo se utile.

Esempio:

```python
from pathlib import Path
import pandas as pd

data_path = Path("data") / "sales.csv"
df = pd.read_csv(data_path)
summary = df.groupby("region")["amount"].sum()
summary
```

## Varianti

- **Jupyter Notebook**: interfaccia classica.
- **JupyterLab**: ambiente piu completo.
- **Notebook locali**: eseguiti sul proprio ambiente.
- **Notebook remoti**: eseguiti su server o piattaforme cloud.
- **Notebook per report**: testo e codice nello stesso documento.
- **Script `.py` + notebook**: notebook per esplorazione, moduli Python per logica stabile.

## Errori comuni

- Eseguire celle fuori ordine e ottenere risultati non riproducibili.
- Lasciare output enormi nel repository.
- Tenere logica di produzione nel notebook.
- Non documentare da dove arrivano i dati.
- Usare ambienti diversi tra notebook e progetto.
- Confondere esplorazione e pipeline stabile.

## Checklist

- Il notebook gira dall'inizio alla fine?
- L'ambiente Python e documentato?
- I dati di input sono tracciati o descritti?
- Output pesanti sono rimossi se non servono?
- La logica riusabile e in file `.py`?
- I risultati dipendono da stato nascosto?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[pandas]]
- [[NumPy]]
- [[Ambienti Virtuali]]
- [[Profiling]]
