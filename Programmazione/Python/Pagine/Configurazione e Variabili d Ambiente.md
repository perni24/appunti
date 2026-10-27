---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - python
  - configuration
  - environment-variables
  - standard-library
aliases:
  - Variabili d Ambiente Python
  - Configurazione Python
prerequisites:
  - "[[Programmazione/Python/Pagine/Comandi base]]"
related:
  - "[[Programmazione/Python/Pagine/Ambienti Virtuali]]"
  - "[[Programmazione/Python/Pagine/CLI con argparse]]"
title: Configurazione e Variabili d Ambiente
---

# Configurazione e Variabili d Ambiente

## Sintesi

La configurazione separa il codice dai valori che cambiano fra ambienti: porte, path, URL, flag e credenziali. In Python `os.environ` espone valori stringa: conversione, validazione e priorita delle fonti spettano all'applicazione.

Baseline: Python 3.12, esempi verificati con CPython 3.12.10 su Windows, non indicazione dell'ultima patch disponibile. Nessuna dipendenza esterna richiesta dal demo.

## Quando usarlo

- Stesso programma in sviluppo, test e produzione con impostazioni diverse.
- Deploy che fornisce valori al processo senza modificare il sorgente.
- CLI con override espliciti e default documentati.

Le variabili d'ambiente evitano di inserire segreti nel sorgente, ma non sono un vault cifrato: possono essere ereditate dai processi figli e finire in diagnostica. In produzione valuta un secret manager e limita la propagazione dei segreti.

## Come funziona

### Assente, vuoto e falso sono casi diversi

```python
import os

optional = os.environ.get("APP_LABEL")  # None se assente
fallback = os.environ.get("APP_LABEL", "development")
print(bool("false"))  # True: non e un parser di booleani

example = {"DEBUG": "", "PORT": "8000"}
print(example.get("DEBUG", "false") == "")  # True: il default non sostituisce il vuoto
```

`os.environ["DATABASE_URL"]` solleva `KeyError` se manca; `get` puo fornire un default, ma una stringa vuota resta presente. Non usare `value or default` se il valore vuoto deve essere segnalato come errore.

L'ambiente e locale al processo. Modificarlo in Python influenza il processo corrente e i figli avviati successivamente, non la shell genitore o processi gia in esecuzione. In Python 3.12 `os.environ` e acquisito all'importazione di `os`; modifiche esterne non vengono rilette automaticamente. Usa `os.environ` per modificarlo, non chiamate dirette a `putenv`.

## API / Sintassi

### Una politica di precedenza esplicita

Per il demo:

1. opzione CLI fornita;
2. variabile d'ambiente presente;
3. default applicativo.

Non e una regola universale di Python. Un file TOML puo essere un ulteriore livello, per esempio sotto l'ambiente, ma devi dichiarare come risolvere conflitti e chiavi sconosciute. `tomllib` legge TOML, non valida lo schema applicativo.

Il parsing avviene una volta all'avvio e produce un oggetto immutabile. Passare un mapping aiuta a testare senza modificare l'ambiente reale.

## Esempio pratico

Script completo `app.py`: legge e valida la configurazione, poi stampa soltanto porta e debug. **Non avvia un server e non apre un database**; `DATABASE_URL` e controllato solo come stringa non vuota, non come URL valido o raggiungibile.

```python
import argparse
from collections.abc import Mapping
from dataclasses import dataclass, field
import os
import sys

@dataclass(frozen=True)
class Settings:
    database_url: str = field(repr=False)
    debug: bool = False
    port: int = 8000

def parse_bool(value: str) -> bool:
    normalized = value.strip().lower()
    if normalized in {"true", "1", "yes", "on"}:
        return True
    if normalized in {"false", "0", "no", "off"}:
        return False
    raise ValueError("DEBUG: atteso un booleano riconosciuto")

def parse_port(value: str) -> int:
    if not value or not value.isascii() or not value.isdecimal():
        raise ValueError("PORT: attese cifre ASCII")
    number = int(value)
    if not 1 <= number <= 65535:
        raise ValueError("PORT: intervallo ammesso 1-65535")
    return number

def load_settings(
    env: Mapping[str, str],
    *,
    cli_port: str | None = None,
    cli_debug: bool | None = None,
) -> Settings:
    database_url = env.get("DATABASE_URL")
    if database_url is None or not database_url.strip():
        raise ValueError("DATABASE_URL: valore obbligatorio non vuoto")
    port = parse_port(cli_port if cli_port is not None else env.get("PORT", "8000"))
    debug = (
        cli_debug if cli_debug is not None
        else parse_bool(env.get("DEBUG", "false"))
    )
    return Settings(database_url=database_url, debug=debug, port=port)

def main(argv: list[str] | None = None,
         env: Mapping[str, str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Verifica la configurazione dell'app",
        allow_abbrev=False,
    )
    parser.add_argument("--port", help="porta TCP da 1 a 65535")
    parser.add_argument("--debug", action=argparse.BooleanOptionalAction, default=None)
    args = parser.parse_args(argv)
    try:
        settings = load_settings(
            os.environ if env is None else env,
            cli_port=args.port,
            cli_debug=args.debug,
        )
    except ValueError as error:
        print(f"Configurazione non valida: {error}", file=sys.stderr)
        return 2
    print(f"port={settings.port} debug={settings.debug}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
```

`default=None` permette di distinguere l'assenza di `--debug` da `--no-debug`, che deve poter prevalere su `DEBUG=true`. Nel demo viene validato il valore vincente: un ambiente non valido ma sovrascritto dalla CLI non causa un errore per quella chiave.

`repr=False` nasconde l'URL dalla rappresentazione automatica, **non** da accesso diretto o serializzazione. `frozen=True` impedisce assegnazioni ordinarie ai campi, non cifra i dati.

### Impostare valori in PowerShell

Ogni comando e indipendente e va eseguito nella stessa sessione, dopo aver predisposto `app.py`. I valori seguenti sono di esempio, senza password.

```powershell
$env:DATABASE_URL = "postgresql://localhost/app"
```

```powershell
$env:PORT = "8000"
```

```powershell
$env:DEBUG = "true"
```

La CLI sovrascrive il flag d'ambiente:

```powershell
python app.py --port 9000 --no-debug
```

Output: `port=9000 debug=False`. Non e un messaggio di server in ascolto.

Le assegnazioni sostituiscono eventuali valori della sessione. Per rimuovere soltanto una variabile dimostrativa quando non serve piu, usa il comando seguente; se esisteva prima, ripristina il valore precedente anziche eliminarla.

```powershell
Remove-Item Env:DEBUG -ErrorAction SilentlyContinue
```

## Varianti

### File .env, TOML e secret manager

- Un file `.env` non viene caricato automaticamente da Python o da un virtualenv.
- `python-dotenv` e una dipendenza esterna: `load_dotenv` puo caricarlo nell'ambiente e, di default, non sovrascrive variabili gia presenti. Scegli esplicitamente il file e la politica di override; non serve al demo.
- TOML e adatto a configurazioni strutturate non segrete; `tomllib` e nella standard library da Python 3.11.
- Pydantic Settings e un pacchetto separato da Pydantic core: puo centralizzare fonti e validazione, ma richiede una configurazione propria.
- Un secret manager gestisce distribuzione e rotazione delle credenziali; non elimina la responsabilita di proteggerle una volta lette.

Per un progetto che usa `.env`, esempio di regole `.gitignore`:

```gitignore
.env
.env.*
!.env.example
```

`.env.example` deve contenere solo nomi e valori fittizi. Gitignore non rimuove segreti gia versionati dalla cronologia: una credenziale esposta va revocata o ruotata, poi va gestita la cronologia del repository.

## Errori comuni

- Interpretare `bool("false")` come `False`.
- Trasformare qualsiasi valore sconosciuto in `False`, nascondendo errori di battitura.
- Validare `int` senza controllare l'intervallo della porta.
- Leggere l'ambiente ovunque o al momento dell'import, rendendo i test dipendenti dall'ordine.
- Stampare `os.environ`, un URL con password o l'intera configurazione.
- Credere che una variabile impostata nella shell diventi permanente nel sistema.

## Checklist

- Distinti valore assente, vuoto, falso e zero?
- Priorita e default documentati?
- Conversione rigorosa e fallimento precoce?
- Configurazione iniettata nei test, senza dipendenze dall'ambiente della macchina?
- Nessun segreto nei file pubblicati, log o messaggi d'errore?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Ambienti Virtuali|Ambienti Virtuali]]
- [[Programmazione/Python/Pagine/CLI con argparse|CLI con argparse]]
- [[Programmazione/Python/Pagine/Pydantic|Pydantic]]
- [[Programmazione/Python/Pagine/Comandi base|Comandi base]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]
- [[Programmazione/Python/Pagine/Subprocess|Subprocess]]

## Fonti

- [Python 3.12: os.environ](https://docs.python.org/3.12/library/os.html#os.environ).
- [Python 3.12: argparse e BooleanOptionalAction](https://docs.python.org/3.12/library/argparse.html#argparse.BooleanOptionalAction).
- [Python 3.12: tomllib](https://docs.python.org/3.12/library/tomllib.html).
- [python-dotenv: caricamento, override e uso](https://bbc2.github.io/python-dotenv/).
- [Pydantic Settings: pacchetto e fonti di configurazione](https://docs.pydantic.dev/latest/concepts/pydantic_settings/).
- [Git: gitignore, pattern e file gia tracciati](https://git-scm.com/docs/gitignore).
