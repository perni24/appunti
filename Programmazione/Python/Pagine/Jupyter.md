---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - programmazione
  - python
  - notebook
  - dati
aliases:
  - Jupyter
  - Notebook Jupyter
prerequisites: []
related: []
title: Jupyter
---

# Jupyter

## Sintesi

Jupyter permette di combinare testo, codice e risultati in notebook. Il documento `.ipynb`, l'interfaccia web, il server e il **kernel** sono componenti distinti: salvare il file non salva lo stato vivo dell'interprete.

Baseline: CPython 3.12.10, **JupyterLab 4.6.4**, **Notebook 7.6.3**, **ipykernel 7.4.0**, **nbconvert 7.17.2** e **nbformat 5.11.1**. Il demo usa anche pandas 3.1.0 e NumPy 2.5.4. Queste sono versioni di verifica, non requisiti universali per ogni notebook.

## Quando usarlo

- Analisi esplorativa, esperimenti, didattica e report con risultati intermedi.
- Confronto rapido tra ipotesi e ispezione di tabelle o grafici.
- Documentazione di un processo di analisi riproducibile.

La logica stabile va estratta in moduli testabili. Il notebook puo orchestrare l'analisi, ma non dovrebbe essere l'unico posto dove esistono validazione e regole applicative.

## Come funziona

### File, interfaccia e kernel

| Componente            | Ruolo                                                           |
| --------------------- | --------------------------------------------------------------- |
| `.ipynb`              | Documento JSON con celle, metadati e output salvati             |
| JupyterLab / Notebook | Interfaccia per modificare il documento e inviare codice        |
| Jupyter Server        | Gestisce accesso, file, sessioni e comunicazione coi kernel     |
| ipykernel             | Processo Python che esegue le celle e mantiene variabili/import |
| kernelspec            | Descrive come avviare un kernel, incluso l'interprete da usare  |

Jupyter supporta anche kernel per altri linguaggi. Notebook 7 e un'interfaccia moderna basata su componenti JupyterLab, non semplicemente il vecchio Notebook 6 con un nuovo numero.

Il kernel mantiene i risultati delle **esecuzioni**, non il significato attuale delle celle visualizzate. Modificare una cella senza rieseguirla lascia in memoria i valori precedenti; eliminare una cella non elimina le variabili che aveva creato.

Il contatore `In [n]` mostra l'ordine delle esecuzioni del kernel, non una prova di riproducibilita. Gli output salvati possono essere vecchi. Chiudere la scheda del notebook non arresta necessariamente il kernel: controlla il pannello dei processi in esecuzione e usa Shutdown quando hai finito.

## API / Sintassi

### Ambiente e kernel coerenti

Usa un ambiente virtuale dedicato come descritto nella nota collegata. Da un terminale che usa il suo Python:

```bash
python -m pip install "jupyterlab==4.6.4" "notebook==7.6.3" "ipykernel==7.4.0" "nbconvert==7.17.2" "nbformat==5.11.1" "pandas==3.1.0" "numpy==2.5.4"
```

Registra un kernelspec nel prefisso dell'ambiente corrente, non nella configurazione globale dell'utente:

```bash
python -m ipykernel install --sys-prefix --name python-appunti --display-name "Python (appunti)"
```

Il nome tecnico `python-appunti` serve alla CLI; `Python (appunti)` e l'etichetta nell'interfaccia. `--sys-prefix` e locale al virtualenv **solo se stai usando davvero il Python del virtualenv**. Un Jupyter avviato da un altro ambiente potrebbe non vedere quel kernelspec.

Controlla i kernel visibili:

```bash
python -m jupyter kernelspec list
```

Avvia **una** delle due interfacce dalla directory del laboratorio. Mantieni l'autenticazione predefinita e il binding sul solo loopback.

```bash
python -m jupyterlab --no-browser --ip=127.0.0.1
```

In alternativa:

```bash
python -m notebook --no-browser --ip=127.0.0.1
```

Apri l'URL locale stampato nel terminale; il token e una credenziale, non un dettaglio da pubblicare. Non configurare binding pubblico o token vuoto per comodita.

### Magic IPython

Queste istruzioni appartengono a **celle IPython**, non a normali script Python e non a tutti i kernel Jupyter.

Mostrare la directory corrente:

```ipython
%pwd
```

Misurare ripetutamente una piccola espressione:

```ipython
%timeit sum(range(1000))
```

Verificare pip nell'ambiente del kernel:

```ipython
%pip --version
```

`%pip` e preferibile a `!pip` per intervenire sull'ambiente del kernel, ma installazioni nel mezzo di un'analisi la rendono meno riproducibile: prepara e registra prima le dipendenze. Dopo aggiornamenti di librerie gia importate puo servire riavviare il kernel.

`%timeit` ripete il codice: non usarlo senza cautela su scritture, richieste HTTP o operazioni con effetti esterni. Il risultato non e automaticamente un benchmark dell'applicazione completa.

## Esempio pratico

### Preparare il laboratorio

In una directory nuova disponi:

```text
laboratorio/
  sales_report.py
  report.ipynb
```

`sales_report.py` e il file completo della nota [[Programmazione/Python/Pagine/pandas|pandas]]: contiene il CSV sintetico, `read_sales` e `summarize_sales`. Riutilizzarlo evita di mantenere due versioni della logica di validazione.

Crea `report.ipynb` dall'interfaccia con il kernel **Python (appunti)**. Inserisci le tre celle seguenti, nello stesso ordine. Non servono dataset esterni.

### Cella 1 - Ambiente e import

```python
import sys
from pathlib import Path
from io import StringIO
import pandas as pd
from sales_report import DEMO_CSV, read_sales, summarize_sales

print("Python:", sys.executable)
print("Directory:", Path.cwd())
print("pandas:", pd.__version__)
```

La directory corrente non e garantita dalla sola posizione visiva del file nella sidebar. Se l'import fallisce, verifica cartella di avvio, percorso del notebook e ambiente; non aggiungere path assoluti personali al codice come prima soluzione.

### Cella 2 - Dati e report

```python
sales = read_sales(StringIO(DEMO_CSV))
report = summarize_sales(sales)
report
```

L'ultima espressione produce la rappresentazione della tabella. Non cambia il contratto della funzione: importi mancanti e gruppi senza regione restano espliciti.

### Cella 3 - Verifica del risultato

```python
assert int(report["orders"].sum()) == len(sales) == 5
assert int(report["known_amount_cents"].sum()) == 1950
assert int(report["missing_amounts"].sum()) == 2
print("Report verificato")
```

Questi assert sono controlli del risultato del laboratorio; la validazione dell'input nel modulo usa eccezioni esplicite. Non sono un controllo di sicurezza.

### Eseguire da uno stato pulito

1. Salva il notebook.
2. Riavvia il kernel e riesegui tutte le celle dall'inizio.
3. Controlla risultati ed errori, senza ricreare manualmente variabili mancanti.
4. Per automatizzare, esegui anche da terminale con un nuovo kernel.

Dalla directory `laboratorio`:

```bash
python -m nbconvert --to notebook --execute report.ipynb --output report.executed.ipynb --ExecutePreprocessor.kernel_name=python-appunti --ExecutePreprocessor.timeout=60 --ExecutePreprocessor.force_raise_errors=True
```

Il comando legge il sorgente, esegue le celle in ordine e scrive una **copia** con output. Fallisce se una cella solleva un errore; `force_raise_errors` impedisce che tag di errori attesi lo facciano passare per un successo. Il timeout riguarda ciascuna cella, non la durata totale del processo o del notebook.

Non usare `--allow-errors` per far diventare verde una verifica fallita. Controlla anche tag che saltano celle, input dati, moduli importati e dipendenze: un exit code zero non certifica da solo la validita scientifica o la riproducibilita completa.

### Esportare e ripulire

Esporta in HTML i risultati **gia eseguiti**:

```bash
python -m nbconvert --to html report.executed.ipynb --output report.html
```

Questo comando senza `--execute` non ricalcola nulla. L'HTML e statico: non contiene un kernel utilizzabile e alcuni widget o asset esterni possono non funzionare offline.

Per una copia senza output e contatori delle celle:

```bash
python -m nbconvert --to notebook report.executed.ipynb --ClearOutputPreprocessor.enabled=True --output report.clean.ipynb
```

I comandi possono sovrascrivere un output omonimo: usa nomi dedicati e verifica il diff. ClearOutput non elimina codice, Markdown, allegati, tutti i metadati o segreti presenti nelle celle: rileggi il file prima di condividerlo.

Gli `.ipynb` del laboratorio non diventano automaticamente pagine del vault: qui la fonte pubblicabile resta Markdown. Eventuali risultati da conservare vanno sintetizzati nelle note, senza dati privati o output inutilmente grandi.

## Varianti

- **Notebook + moduli**: separa esplorazione e logica stabile; modificare un modulo importato non ricarica automaticamente ogni riferimento gia in memoria. Il riavvio del kernel resta la verifica piu semplice.
- **Esecuzione batch/CI**: usa dati controllati, ambiente identificato e timeout esterno del job oltre a quello per cella.
- **Kernel remoto**: il codice e i file sono sul server del kernel, non necessariamente sul computer del browser.
- **Export Python**: magic e funzioni di IPython possono restare dipendenze del codice esportato; non presumere che ogni export sia uno script autonomo.
- **Grafici**: richiedono librerie e backend appropriati. Questo demo verifica tabelle HTML, non grafici o widget interattivi.

## Errori comuni

| Sintomo                                  | Verifica                                                   |
| ---------------------------------------- | ---------------------------------------------------------- |
| ModuleNotFoundError dopo installazione   | Confronta sys.executable, %pip e kernelspec                |
| Risultato diverso dopo restart           | Cerca celle fuori ordine e variabili nascoste              |
| File non trovato                         | Controlla Path.cwd e percorsi degli input                  |
| Notebook chiuso ma calcolo ancora attivo | Controlla kernel/sessioni e arrestali esplicitamente       |
| Export HTML mostra numeri vecchi         | Esegui prima il notebook; esportare non ricalcola          |
| Notebook "trusted" ma codice sospetto    | Trust riguarda output; non rende sicuro eseguire il codice |

Eseguire un notebook equivale a eseguire un programma con i permessi del kernel: un file ricevuto da altri puo leggere dati, avviare processi o contattare la rete. Controlla codice e dipendenze prima di eseguirlo; trust e cancellazione degli output non sono sandbox.

## Checklist

- Esecuzione pulita completa senza interventi manuali?
- Interprete, pacchetti e dati identificati?
- Moduli importati presenti e testati separatamente?
- Output, metadati e segreti controllati prima di Git o pubblicazione?
- Kernel e server arrestati quando non servono?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/pandas|pandas]]
- [[Programmazione/Python/Pagine/NumPy|NumPy]]
- [[Programmazione/Python/Pagine/Ambienti Virtuali|Ambienti Virtuali]]
- [[Programmazione/Python/Pagine/Testing|Testing]]
- [[Programmazione/Python/Pagine/Profiling|Profiling]]

## Fonti

- [Formato del notebook](https://nbformat.readthedocs.io/en/latest/format_description.html).
- [Gestione dei kernel in JupyterLab](https://jupyterlab.readthedocs.io/en/stable/user/running.html).
- [Notebook 7 e JupyterLab](https://jupyter-notebook.readthedocs.io/en/stable/notebook_7_features.html).
- [Installazione dei kernel IPython](https://ipython.readthedocs.io/en/stable/install/kernel_install.html).
- [Magic IPython](https://ipython.readthedocs.io/en/stable/interactive/magics.html).
- [nbconvert: esecuzione dei notebook](https://nbconvert.readthedocs.io/en/latest/execute_api.html).
- [nbconvert: opzioni, timeout ed errori](https://nbconvert.readthedocs.io/en/latest/config_options.html).
- [Sicurezza di Jupyter Server](https://jupyter-server.readthedocs.io/en/latest/operators/security.html).
