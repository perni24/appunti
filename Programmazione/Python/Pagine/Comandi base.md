---
tags:
  - programmazione
  - python
  - strumenti
argomento: Comandi Base e Toolchain
data: 2026-01-19
stato: 🟢 completato
---

# Comandi Base e Toolchain Python

## 💡 Concetto Chiave
Python è un linguaggio **interpretato**: il codice sorgente (`.py`) viene letto ed eseguito direttamente da un interprete (CPython), senza una fase di compilazione esplicita in un eseguibile binario.
Una caratteristica fondamentale dell'ecosistema Python è la gestione delle dipendenze: poiché i pacchetti vengono installati di default a livello globale, è **essenziale** utilizzare gli **Ambienti Virtuali (`venv`)** per isolare le librerie di ogni singolo progetto, evitando conflitti di versione ("Dependency Hell").

---

## 📝 Sintassi

### Esecuzione Script
```bash
# Esecuzione semplice di un file
python nome_file.py

# Esecuzione di un modulo (Best Practice per script installati)
python -m nome_modulo
```

### Gestione Pacchetti (`pip`)
```bash
# Installazione pacchetto
pip install nome_libreria

# Installazione specifica versione
pip install nome_libreria==1.0.4

# Lista pacchetti installati
pip list

# Esportazione dipendenze correnti
pip freeze > requirements.txt
```

### Ambienti Virtuali (`venv`)
```bash
# 1. Creazione ambiente (nella cartella .venv)
python -m venv .venv

# 2. Attivazione (Windows)
.venv\Scripts\activate

# 2. Attivazione (Linux/macOS)
source .venv/bin/activate

# 3. Disattivazione
deactivate
```

---

## 💻 Esempi Pratici

### 1. Workflow Completo: Nuovo Progetto
La procedura standard per iniziare un progetto pulito e isolato:

```bash
# 1. Crea la cartella del progetto
mkdir progetto_analisi
cd progetto_analisi

# 2. Crea l'ambiente virtuale (crea una cartella .venv nascosta)
python -m venv .venv

# 3. Attiva l'ambiente (il prompt cambierà mostrando "(.venv)")
.venv\Scripts\activate

# 4. Aggiorna pip (opzionale ma consigliato) e installa librerie
python -m pip install --upgrade pip
pip install pandas matplotlib

# 5. Salva le dipendenze per replicare l'ambiente in futuro
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

## ⚙️ Funzionamento Interno (Teoria)

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

## ⚠️ Best Practices & "Gotchas"

- ✅ **Usa SEMPRE `python -m pip`:** Su Windows, usare `pip install` direttamente potrebbe richiamare un pip associato a un'altra installazione di Python. Usare `python -m pip` garantisce di usare il pip dell'interprete corrente.
- ✅ **Nomi dei file:** Non chiamare mai i tuoi file come moduli standard (es. `email.py`, `random.py`). Python importerà il tuo file invece della libreria standard, causando errori incomprensibili (Circular Import).
- ❌ **Non committare `.venv`:** La cartella dell'ambiente virtuale non va mai su Git. Inseriscila nel `.gitignore`. Committa solo `requirements.txt`.
- 💣 **Dipendenze Globali:** Evita `pip install` senza ambiente virtuale attivo. Alla lunga "sporcherai" il sistema operativo rendendo impossibile gestire progetti con versioni di librerie diverse.

---

## 📚 Riferimenti
- [[Programmazione/Python/Pagine/Variabili|Variabili e Tipi di Dati]]
- [[Programmazione/Python/Pagine/Gestione degli Errori|Eccezioni e Errori]]
- [Documentazione Ufficiale venv](https://docs.python.org/3/library/venv.html)
