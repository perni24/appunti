---
tags:
  - programmazione
  - python
  - strumenti
argomento: Comandi Base e Toolchain
data: 2025-12-20
stato: 🟢 completato
---

# Comandi Base e Toolchain Python

## 💡 Concetto Chiave
Python è un linguaggio interpretato. Non esiste una fase di compilazione esplicita (come `cargo build`). Il codice sorgente viene compilato in bytecode (`.pyc`) automaticamente all'esecuzione.
La gestione delle dipendenze non è monolitica come in Rust; si usa una combinazione di `pip` (package installer) e `venv` (ambienti virtuali) per isolare i progetti.

---

## 📝 Sintassi

### Esecuzione
```bash
python nome_script.py
python -m nome_modulo
```

### Gestione Pacchetti (pip)
```bash
pip install nome_pacchetto
pip list
pip freeze > requirements.txt
```

### Ambienti Virtuali (venv)
```bash
# Creazione
python -m venv .venv

# Attivazione (Windows)
.venv\Scripts\activate

# Attivazione (Linux/Mac)
source .venv/bin/activate
```

---

## 💻 Esempi Pratici

### 1. Workflow Tipico
Quando inizi un nuovo progetto, la prassi standard è:

1.  Creare la cartella progetto.
2.  Creare un ambiente virtuale per non "inquinare" il Python di sistema.
3.  Attivarlo.
4.  Installare le librerie necessarie.

```bash
mkdir mio_progetto
cd mio_progetto
python -m venv venv
venv\Scripts\activate
pip install requests
```

### 2. Riprodurre un Ambiente
Se scarichi un progetto da GitHub, per installare tutte le dipendenze corrette:
```bash
pip install -r requirements.txt
```

### 3. Shell Interattiva (REPL)
Digitando solo `python` si apre la shell interattiva, utile per testare velocemente comandi.
```python
>>> 2 + 2
4
>>> exit()
```

---

## ⚙️ Funzionamento Interno

### Interprete e Bytecode
Quando esegui `python main.py`:
1.  Il CPython (interprete standard) legge il sorgente.
2.  Lo compila in **bytecode** (istruzioni di basso livello per la Python Virtual Machine).
3.  Salva il bytecode nella cartella `__pycache__` per velocizzare esecuzioni future.
4.  La PVM esegue il bytecode.

### GIL (Global Interpreter Lock)
In CPython, il GIL è un mutex che impedisce a più thread nativi di eseguire bytecode Python contemporaneamente. Questo semplifica la gestione della memoria (non thread-safe), ma limita il parallelismo su CPU multi-core (per task CPU-bound).

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Usa SEMPRE venv:** Mai installare pacchetti con `pip` nel Python globale di sistema (può rompere strumenti di sistema o creare conflitti di versione).
- ✅ **`python -m pip`:** Su Windows, preferisci `python -m pip install ...` invece di `pip install ...` per essere sicuro di usare il pip collegato a *quell*'interprete Python specifico.
- 💣 **Python 2 vs 3:** Python 2 è morto (EOL 2020). Assicurati di usare comandi `python3` o `pip3` su sistemi Linux dove `python` potrebbe ancora puntare alla versione 2.

## 📚 Riferimenti
- [Python Docs - Using Python](https://docs.python.org/3/using/index.html)
- [Packaging Python Projects](https://packaging.python.org/en/latest/tutorials/packaging-projects/)