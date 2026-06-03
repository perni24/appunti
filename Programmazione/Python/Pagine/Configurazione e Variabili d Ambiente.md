---
date: 2026-06-03
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

La configurazione separa il codice dai valori che cambiano tra ambienti: porte, path, URL, flag, credenziali e parametri di runtime.

In Python le variabili d'ambiente si leggono con `os.environ`. Sono sempre stringhe, quindi vanno convertite esplicitamente quando rappresentano numeri, booleani o liste.

## Quando usarlo

Usa configurazione esterna quando:

- lo stesso codice gira in sviluppo, test e produzione;
- devi gestire segreti senza metterli nel codice;
- vuoi cambiare comportamento senza modificare sorgenti;
- una CLI deve accettare opzioni ma anche default da ambiente;
- deploy e container devono passare parametri al processo.

## Come funziona

Leggere una variabile obbligatoria:

```python
import os

database_url = os.environ["DATABASE_URL"]
```

Leggere una variabile opzionale:

```python
debug = os.environ.get("DEBUG", "false")
```

Convertire tipi:

```python
port = int(os.environ.get("PORT", "8000"))
debug = os.environ.get("DEBUG", "false").lower() == "true"
```

Le variabili d'ambiente non sono un sistema di typing: la validazione resta responsabilita del programma.

## API / Sintassi

Accesso a `os.environ`:

```python
import os

value = os.environ.get("NAME")
required = os.environ["REQUIRED_NAME"]
```

Impostare una variabile per il processo corrente:

```python
import os

os.environ["APP_ENV"] = "development"
```

Parsing centralizzato:

```python
from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    database_url: str
    debug: bool
    port: int


def load_settings() -> Settings:
    return Settings(
        database_url=os.environ["DATABASE_URL"],
        debug=os.environ.get("DEBUG", "false").lower() == "true",
        port=int(os.environ.get("PORT", "8000")),
    )
```

## Esempio pratico

Configurazione per un'applicazione web:

```python
settings = load_settings()

if settings.debug:
    print("Debug mode enabled")

print(f"Listening on port {settings.port}")
```

Con PowerShell:

```powershell
$env:DATABASE_URL = "postgresql://localhost/app"
$env:PORT = "8000"
$env:DEBUG = "true"
python app.py
```

## Varianti

- **Variabili d'ambiente**: adatte a configurazione di deploy e segreti.
- **Argomenti CLI**: adatti a script e tool invocati manualmente.
- **File `.env`**: comodi in sviluppo, ma da non committare se contengono segreti.
- **File di configurazione**: utili per impostazioni complesse e non segrete.
- **Secret manager**: preferibile in produzione per credenziali sensibili.
- **Pydantic Settings**: scelta frequente in progetti FastAPI o applicazioni strutturate.

## Errori comuni

- Assumere che una variabile esista sempre.
- Dimenticare che i valori sono stringhe.
- Loggare segreti o stamparli in debug.
- Mescolare configurazione di sviluppo e produzione.
- Spargere letture di `os.environ` in tutto il codice.
- Salvare credenziali in file versionati.

## Checklist

- Le variabili obbligatorie falliscono presto se mancano?
- I tipi vengono convertiti e validati?
- I segreti non sono nel codice o nel repository?
- La configurazione e caricata in un punto centrale?
- CLI, ambiente e default hanno priorita chiare?
- I log non espongono valori sensibili?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Ambienti Virtuali]]
- [[CLI con argparse]]
- [[Pydantic]]
- [[Comandi base]]
