---
date: 2026-05-14
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Comandi Base e Toolchain Python]
prerequisites: []
related: []
---
# Comandi Base e Toolchain Python

## Sintesi

Nota su Comandi Base e Toolchain Python in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.

## Concetto chiave
Python è un linguaggio **interpretato**: il codice sorgente (`.py`) viene letto ed eseguito direttamente da un interprete (CPython), senza una fase di compilazione esplicita in un eseguibile binario.
Una caratteristica fondamentale dell'ecosistema Python è la gestione delle dipendenze: poiché i pacchetti vengono installati di default a livello globale, è **essenziale** utilizzare gli **Ambienti Virtuali (`venv`)** per isolare le librerie di ogni singolo progetto, evitando conflitti di versione ("Dependency Hell").

---

##  Sintassi

### Esecuzione Script
```bash
# Comandi Base e Toolchain Python

## Sintesi

Nota su Comandi Base e Toolchain Python in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
python nome_file.py

# Comandi Base e Toolchain Python

## Sintesi

Nota su Comandi Base e Toolchain Python in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
python -m nome_modulo
```

### Gestione Pacchetti (`pip`)
```bash
# Comandi Base e Toolchain Python

## Sintesi

Nota su Comandi Base e Toolchain Python in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
pip install nome_libreria

# Comandi Base e Toolchain Python

## Sintesi

Nota su Comandi Base e Toolchain Python in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
pip install nome_libreria==1.0.4

# Comandi Base e Toolchain Python

## Sintesi

Nota su Comandi Base e Toolchain Python in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
pip list

# Comandi Base e Toolchain Python

## Sintesi

Nota su Comandi Base e Toolchain Python in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
pip freeze > requirements.txt
```

### Ambienti Virtuali (`venv`)
```bash
# Comandi Base e Toolchain Python

## Sintesi

Nota su Comandi Base e Toolchain Python in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
python -m venv .venv

# Comandi Base e Toolchain Python

## Sintesi

Nota su Comandi Base e Toolchain Python in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
.venv\Scripts\activate

# Comandi Base e Toolchain Python

## Sintesi

Nota su Comandi Base e Toolchain Python in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
source .venv/bin/activate

# Comandi Base e Toolchain Python

## Sintesi

Nota su Comandi Base e Toolchain Python in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
deactivate
```

---

##  Esempi Pratici

### 1. Workflow Completo: Nuovo Progetto
La procedura standard per iniziare un progetto pulito e isolato:

```bash
# Comandi Base e Toolchain Python

## Sintesi

Nota su Comandi Base e Toolchain Python in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
mkdir progetto_analisi
cd progetto_analisi

# Comandi Base e Toolchain Python

## Sintesi

Nota su Comandi Base e Toolchain Python in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
python -m venv .venv

# Comandi Base e Toolchain Python

## Sintesi

Nota su Comandi Base e Toolchain Python in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
.venv\Scripts\activate

# Comandi Base e Toolchain Python

## Sintesi

Nota su Comandi Base e Toolchain Python in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
python -m pip install --upgrade pip
pip install pandas matplotlib

# Comandi Base e Toolchain Python

## Sintesi

Nota su Comandi Base e Toolchain Python in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
pip freeze > requirements.txt
```

### 2. Esempio Base: "Hello World" Interattivo
Python offre una shell interattiva (REPL) ottima per test rapidi.

```bash
$ python
Python 3.10.x (tags/v3.10.x:...) [MSC v.1916 64 bit (AMD64)] on win32
Type "help", "copyright", "credits" or "license" for more information.
>>> nome = "Luca"
>>> print(f"Ciao {nome}")
Ciao Luca
>>> exit()
```

---

##  Funzionamento Interno (Teoria)

### Interprete e Bytecode (`.pyc`)
Nonostante sia "interpretato", Python compila il sorgente in **Bytecode** intermedio.
1.  Il sorgente `.py` viene letto.
2.  Viene compilato in bytecode (file `.pyc` dentro `__pycache__`).
3.  La **PVM (Python Virtual Machine)** esegue questo bytecode.
*Nota:* Questo avviene automaticamente a runtime. I file `.pyc` servono solo a velocizzare l'avvio nelle esecuzioni successive, non le prestazioni del codice.

### Risoluzione dei Moduli (`sys.path`)
Quando fai `import os`, dove guarda Python?
1.  Directory corrente dello script.
2.  Variabile d'ambiente `PYTHONPATH`.
3.  Percorsi standard della libreria (es. `site-packages` dentro `.venv` se attivo, o quelli globali se non lo è).
*Ecco perché attivare il venv è cruciale: modifica il `sys.path` per puntare alle librerie isolate.*

### GIL (Global Interpreter Lock)
Il **GIL** è un meccanismo del CPython che impedisce a più thread nativi di eseguire bytecode Python *contemporaneamente*.
- **Impatto:** Il multithreading in Python non sfrutta il multi-core per calcoli CPU-bound (es. elaborazione numeri).
- **Soluzione:** Per parallelismo su CPU, si usa il *Multiprocessing* (processi separati) invece del Multithreading.

---

##  Best Practices & "Gotchas"

-  **Usa SEMPRE `python -m pip`:** Su Windows, usare `pip install` direttamente potrebbe richiamare un pip associato a un'altra installazione di Python. Usare `python -m pip` garantisce di usare il pip dell'interprete corrente.
-  **Nomi dei file:** Non chiamare mai i tuoi file come moduli standard (es. `email.py`, `random.py`). Python importerà il tuo file invece della libreria standard, causando errori incomprensibili (Circular Import).
-  **Non committare `.venv`:** La cartella dell'ambiente virtuale non va mai su Git. Inseriscila nel `.gitignore`. Committa solo `requirements.txt`.
-  **Dipendenze Globali:** Evita `pip install` senza ambiente virtuale attivo. Alla lunga "sporcherai" il sistema operativo rendendo impossibile gestire progetti con versioni di librerie diverse.

---

##  Riferimenti
- [[Programmazione/Python/Pagine/Sintassi e Variabili|Variabili e Tipi di Dati]]
- [[Programmazione/Python/Pagine/Error Handling|Eccezioni e Errori]]
- [Documentazione Ufficiale venv](https://docs.python.org/3/library/venv.html)
