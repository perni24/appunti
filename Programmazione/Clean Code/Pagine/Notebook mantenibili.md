---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - notebook
  - dati
aliases:
  - Notebook mantenibili
  - Maintainable notebooks
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Pipeline dati leggibili]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Script di automazione]]"
  - "[[Programmazione/Clean Code/Pagine/Pipeline dati leggibili]]"
  - "[[Programmazione/Clean Code/Pagine/Test come documentazione]]"
title: Notebook mantenibili
---

# Notebook mantenibili

## Sintesi

Un notebook è riproducibile se un lettore può **riavviare il kernel, eseguire dall'alto e ricostruire la conclusione**. Le celle visibili non sono tutta la storia: il kernel può ricordare una variabile da una cella eliminata e il file può ancora mostrare un output prodotto con dati precedenti.

## Esempio: misurare gli scarti di un import

Tre celle Python, nell'ordine di esecuzione. Richiedono i due moduli delle note [[Programmazione/Clean Code/Pagine/Pipeline dati leggibili|Pipeline dati leggibili]] e [[Programmazione/Clean Code/Pagine/Parsing di input esterni|Parsing di input esterni]] disponibili al kernel. Il CSV incorporato è una fixture sintetica, non una misura di produzione.

**Cella 1: sorgente e contratto.**

```python
from io import StringIO
from catalog_pipeline import read_catalog

snapshot = "sku,price\n007,1.20\nX,\nX,0\n"
```

**Cella 2: ricalcolare dalle sorgenti.** Creare uno stream nuovo ogni volta evita che una seconda esecuzione riparta dalla fine del file.

```python
products, issues = read_catalog(StringIO(snapshot, newline=""))
total = len(products) + len(issues)
rejected_share = len(issues) / total if total else None
```

**Cella 3: rendere esplicito il denominatore.**

```python
summary = {"accepted": len(products), "rejected": len(issues), "rejected_share": rejected_share}
print(summary)
```

Il risultato contiene **2 accettati e 1 scartato su 3 record**, non uno scarto su due SKU distinti. Con sola intestazione la quota è `None`: nessun record osservato non equivale a una quota di errore dello 0%.

## Prova di riproducibilità

1. Riavvia il kernel ed esegui tutte le celle in ordine, senza riusare output salvati. Poi riesegui la cella di calcolo due volte: il risultato non deve accumularsi.
2. Per dati reali annota versione o impronta dell'input, parametri, ambiente e versione dei moduli. Un seed controlla solo le operazioni casuali che lo usano; non fissa un dataset remoto.
3. Mantieni nel notebook la domanda, il risultato e i limiti; estrai il parsing riutilizzabile in un modulo con test. L'esecuzione non interattiva di un notebook può rilevare celle fuori ordine, ma non verifica che la conclusione statistica sia sensata.

Prima di condividere controlla **anche gli output salvati**, non soltanto il codice: tabelle, percorsi ed eccezioni possono contenere dati che non volevi pubblicare.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Pipeline dati leggibili|Pipeline dati leggibili]]
- [[Programmazione/Clean Code/Pagine/Script di automazione|Script di automazione]]
- [[Programmazione/Clean Code/Pagine/Test come documentazione|Test come documentazione]]
- [[Programmazione/Clean Code/Pagine/Parsing di input esterni|Parsing di input esterni]]

## Fonti

- Joel Grus, *I Don't Like Notebooks*
- Jupyter Documentation
- Wes McKinney, *Python for Data Analysis*
- [Jupyter nbformat: celle, output ed execution count](https://nbformat.readthedocs.io/en/latest/format_description.html)
- [Jupyter nbclient: esecuzione non interattiva di un notebook](https://nbclient.readthedocs.io/en/latest/client.html)
