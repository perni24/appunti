---
date: 2026-05-14
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [python, configuration, environment-variables, standard-library]
aliases: [Variabili d Ambiente Python, Configurazione Python]
prerequisites: [Comandi base]
related: [Ambienti Virtuali, CLI con argparse]
---

# Configurazione e Variabili d Ambiente

## Sintesi

La configurazione permette di separare codice e valori che cambiano tra ambienti, come porte, path, flag e credenziali.

In Python le variabili d'ambiente si leggono con `os.environ`.

## Leggere variabili

```python
import os

debug = os.environ.get("DEBUG", "false")
database_url = os.environ["DATABASE_URL"]
```

`os.environ["NAME"]` solleva `KeyError` se la variabile manca.

`os.environ.get("NAME")` restituisce `None` o un default.

## Conversioni

Le variabili d'ambiente sono stringhe.

```python
port = int(os.environ.get("PORT", "8000"))
debug = os.environ.get("DEBUG", "false").lower() == "true"
```

Converti esplicitamente numeri e booleani.

## Segreti

Non salvare password, token o chiavi API nel codice sorgente.

Usa variabili d'ambiente, secret manager o configurazione esterna non versionata.

## Errori comuni

- Assumere che una variabile esista sempre.
- Dimenticare conversioni di tipo.
- Loggare segreti.
- Mescolare configurazione di sviluppo e produzione.

## Collegamenti

- [[Programmazione/Python/Pagine/Ambienti Virtuali|Ambienti Virtuali]]
- [[Programmazione/Python/Pagine/CLI con argparse|CLI con argparse]]
- [[Programmazione/Python/Pagine/Comandi base|Comandi base]]
