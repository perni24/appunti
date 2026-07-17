---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [python, programming]
aliases: [Comandi Base e Toolchain Python]
prerequisites: []
related: []
---

# Comandi Base e Toolchain Python

## Sintesi

I comandi base servono a eseguire script, usare moduli, creare ambienti virtuali, installare pacchetti e verificare l'interprete attivo.

## Quando usarlo

Usali quando inizi un progetto, installi dipendenze, esegui script, lavori in REPL o devi capire quale Python/pip sta usando il terminale.

## Come funziona

Python esegue file `.py` tramite l'interprete. Con `python -m modulo` esegue un modulo usando l'interprete corrente. Gli ambienti virtuali isolano dipendenze per progetto e modificano i percorsi di import.

Usare `python -m pip` e piu affidabile di `pip` perche garantisce che pip appartenga all'interprete corrente.

## API / Sintassi

```bash
python --version
python script.py
python -m module_name
python -m pip install requests
python -m pip list
python -m pip freeze > requirements.txt
```

Ambiente virtuale:

```bash
python -m venv .venv
.venv\Scripts\activate
deactivate
```

Su Linux/macOS:

```bash
source .venv/bin/activate
```

## Esempio pratico

```bash
mkdir my_project
cd my_project
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install requests
python -m pip freeze > requirements.txt
python main.py
```

## Varianti

- REPL interattivo: `python`.
- Esecuzione modulo: `python -m package.module`.
- Script singolo: `python file.py`.
- Ambiente virtuale con `venv`.
- Gestione moderna con `uv`, Poetry o pip-tools.
- Dipendenze in `requirements.txt` o `pyproject.toml`.

## Errori comuni

- Installare pacchetti fuori dal virtualenv.
- Usare `pip` associato a un altro interprete.
- Committare `.venv` nel repository.
- Chiamare file come moduli standard, per esempio `random.py`.
- Non bloccare versioni quando serve riproducibilita.

## Checklist

- Il virtualenv e attivo?
- `python --version` e quello atteso?
- Usi `python -m pip`?
- `.venv` e escluso da Git?
- Le dipendenze sono tracciate?

## Collegamenti

- [[Programmazione/Python/Pagine/Ambienti Virtuali|Ambienti Virtuali]]
- [[Programmazione/Python/Pagine/Pip e PyPI|Pip e PyPI]]
- [[Programmazione/Python/Pagine/uv pipx e poetry|uv pipx e poetry]]
