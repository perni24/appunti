---
date: 2026-06-03
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

`subprocess` permette di eseguire programmi esterni da Python. E utile per integrare tool CLI, comandi di sistema e script esistenti senza riscriverli.

Va usato con attenzione: processi esterni hanno exit code, output, errori, quoting e rischi di sicurezza propri.

## Quando usarlo

Usa `subprocess` quando:

- devi chiamare un comando esterno;
- vuoi integrare tool gia esistenti;
- devi automatizzare script di sistema;
- devi catturare output e exit code;
- un programma separato e la soluzione piu semplice o gia disponibile.

Evitalo quando esiste una API Python stabile e piu sicura per lo stesso compito.

## Come funziona

Uso base:

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

Passare una lista di argomenti e preferibile a passare una stringa, perche evita molti problemi di quoting e riduce il rischio di command injection.

## API / Sintassi

Parametri comuni di `subprocess.run()`:

- `args`: comando e argomenti;
- `check=True`: solleva errore se exit code e diverso da zero;
- `capture_output=True`: cattura `stdout` e `stderr`;
- `text=True`: restituisce testo invece di byte;
- `cwd=...`: directory di lavoro del processo;
- `env=...`: variabili d'ambiente per il processo;
- `timeout=...`: limite massimo di esecuzione.

Gestione errori:

```python
try:
    subprocess.run(["git", "status"], check=True)
except subprocess.CalledProcessError as error:
    print(error.returncode)
```

Timeout:

```python
subprocess.run(["long-command"], timeout=30, check=True)
```

## Esempio pratico

Eseguire un comando e usare l'output:

```python
import subprocess


def current_branch():
    result = subprocess.run(
        ["git", "branch", "--show-current"],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


print(current_branch())
```

## Varianti

- **`subprocess.run()`**: scelta principale per comandi semplici.
- **`capture_output=True`**: quando serve leggere output.
- **`check=True`**: quando exit code non zero deve essere errore.
- **`Popen`**: controllo avanzato su processi lunghi o streaming.
- **`shell=True`**: da evitare con input utente; utile solo per casi specifici e controllati.
- **API Python native**: spesso preferibili per file, path, JSON, HTTP o database.

## Errori comuni

- Usare `shell=True` con input utente.
- Passare comandi come stringhe quando una lista sarebbe piu sicura.
- Ignorare exit code.
- Non catturare `stderr` quando serve diagnosi.
- Non impostare timeout su processi che possono bloccarsi.
- Usare subprocess per operazioni che la standard library gestisce meglio.
- Dipendere da comandi non disponibili su tutti i sistemi operativi.

## Checklist

- Esiste una API Python migliore del comando esterno?
- Gli argomenti sono passati come lista?
- `check=True` e impostato quando serve?
- Output ed errori vengono gestiti?
- Serve un timeout?
- Il comando e disponibile sull'ambiente target?
- `shell=True` e davvero necessario?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Error Handling]]
- [[CLI con argparse]]
- [[Standard Library]]
- [[Automazione file e script]]
