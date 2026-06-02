---
date: 2026-06-02
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, subprocess, standard-library, cli]
aliases: [subprocess Python]
prerequisites: [Error Handling, Gestione File]
related: [CLI con argparse, Standard Library]
---

# Subprocess

## Sintesi

`subprocess` permette di eseguire programmi esterni da Python.

E utile per integrare comandi di sistema, tool CLI e script esistenti.

## Quando usarlo

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Come funziona

### `subprocess.run`
```python
import subprocess

result = subprocess.run(
    ["python", "--version"],
    capture_output=True,
    text=True,
    check=True,
)

print(result.stdout)
```

Usa una lista di argomenti invece di una stringa quando possibile.
### Sicurezza
Evita `shell=True` con input utente.

```python
subprocess.run(["grep", pattern, file_path], check=True)
```

Questo riduce il rischio di command injection.

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

### Errori
Con `check=True`, Python solleva `CalledProcessError` se il comando termina con exit code diverso da zero.

```python
try:
    subprocess.run(["false"], check=True)
except subprocess.CalledProcessError as error:
    print(error.returncode)
```

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/Python/Pagine/Error Handling|Error Handling]]
- [[Programmazione/Python/Pagine/CLI con argparse|CLI con argparse]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]
