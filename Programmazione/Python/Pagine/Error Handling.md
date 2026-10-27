---
date: 2026-06-03
area: Programmazione
topic: Python
type: theory-note
status: non revisionato
publish: true
difficulty: base
tags:
  - python
  - programming
  - errors
aliases:
  - Error Handling
  - Gestione delle Eccezioni
prerequisites: []
related: []
title: Error Handling in Python
---

# Error Handling in Python

## Sintesi

Un'eccezione interrompe il percorso corrente finche non trova un gestore compatibile; se non viene gestita, si propaga al chiamante. Gestire un errore significa scegliere una risposta sensata, non far sparire il traceback a ogni costo.

Baseline degli esempi: **CPython 3.12.10**.

## Problema che risolve

Separare il percorso riuscito da input invalidi, risorse mancanti e guasti, preservando contesto e cleanup. Un risultato vuoto, un errore atteso e un bug non sono automaticamente la stessa cosa.

## Concetto chiave

Il blocco try deve contenere l'operazione che puo fallire. Except intercetta i tipi indicati e le loro sottoclassi; il primo gestore compatibile viene scelto, quindi i casi piu specifici precedono quelli generali.

```python
try:
    number = int("42")
except ValueError:
    print("Testo non convertibile")
else:
    print(number)  # 42
```

Else viene raggiunto dopo un completamento normale del try; un'eccezione sollevata nell'else non viene catturata dagli except dello stesso try. Finally serve al cleanup durante l'uscita dal costrutto, anche con return o eccezioni.

Non leggere "finally sempre" come garanzia contro arresto forzato del processo, crash o spegnimento della macchina. Un return nel finally puo inoltre sostituire un risultato o sopprimere un'eccezione: evitalo.

## Dettagli importanti

### Famiglie e propagazione

- TypeError: operazione o tipo non compatibile con il contratto.
- ValueError: tipo ammesso ma valore non accettabile.
- KeyError: chiave assente.
- FileNotFoundError, PermissionError e altri OSError: cause I/O diverse.
- Exception include la maggior parte degli errori applicativi, ma non KeyboardInterrupt e SystemExit.
- Except senza tipo cattura anche queste interruzioni: normalmente non e cio che vuoi.

Un errore di sintassi nello stesso file impedisce di avviare il suo try. SyntaxError puo essere intercettato quando un'operazione distinta, come compile() o un import, analizza altro codice.

### Raise e causa

`raise` senza argomento rilancia l'eccezione gestita. `raise NuovoErrore(...) from error` aggiunge una causa esplicita, accessibile tramite `__cause__`. `from None` nasconde il contesto nella visualizzazione ordinaria del traceback: non e una procedura di cancellazione dei dati sensibili.

Un tipo non valido non va accidentalmente convertito:

```python
def set_age(age):
    if type(age) is not int:
        raise TypeError("Age must be an integer")
    if age < 0:
        raise ValueError("Age must be non-negative")
    return age


print(set_age(30))  # 30
```

Qui bool viene rifiutato intenzionalmente. Il solo controllo age < 0 non avrebbe definito un contratto sufficiente.

## Esempio

### Configurazione con politica di parsing esplicita

Il demo accetta un dizionario ordinario con timeout espresso come **int built-in o stringa di 1-4 cifre ASCII dopo strip**, nell'intervallo 1-3600 secondi. Esclude bool, float, segni, underscore e cifre Unicode. Le altre chiavi del dizionario sono ignorate intenzionalmente.

```python
class InvalidConfigError(Exception):
    pass


def read_timeout(config):
    if not isinstance(config, dict):
        raise InvalidConfigError("Config must be a dictionary")

    try:
        raw = config["timeout"]
    except KeyError as error:
        raise InvalidConfigError("Missing timeout") from error

    if type(raw) is int:
        timeout = raw
    elif isinstance(raw, str):
        text = raw.strip()
        if not (
            1 <= len(text) <= 4
            and text.isascii()
            and text.isdecimal()
        ):
            raise InvalidConfigError("Timeout must contain ASCII digits")
        timeout = int(text)
    else:
        raise InvalidConfigError("Timeout must be integer text or an integer")

    if not 1 <= timeout <= 3600:
        raise InvalidConfigError("Timeout must be between 1 and 3600 seconds")

    return timeout


print(read_timeout({"timeout": " 30 "}))  # 30
```

La conversione int() non e da sola una validazione: int(True) vale 1 e int(1.9) vale 1; None causa TypeError. Il controllo precedente evita questi ingressi prima della conversione.

Solo l'assenza della chiave viene tradotta da KeyError con causa originale. Gli altri casi producono direttamente un errore applicativo, senza includere il valore grezzo nel messaggio. Un guasto inatteso non viene convertito in configurazione mancante.

### Else e finally osservabili

```python
def divide(a, b, events):
    try:
        result = a / b
    except ZeroDivisionError:
        events.append("zero")
        return None
    else:
        events.append("success")
        return result
    finally:
        events.append("cleanup")


events = []
print(divide(6, 2, events))  # 3.0
print(events)  # ['success', 'cleanup']
```

Un TypeError si propaga, ma cleanup viene comunque registrato. Events e una lista di osservazione, non una risorsa reale; se il cleanup stesso fallisce, anche l'eccezione risultante cambia.

### File opzionale, non ogni errore I/O

```python
def read_optional_text(path):
    try:
        with open(path, encoding="utf-8") as file:
            return file.read()
    except FileNotFoundError:
        return ""
```

La politica unifica file assente e file vuoto. Non nasconde PermissionError, IsADirectoryError o errori di decoding. Con with il file viene chiuso anche se la lettura fallisce; il demo non limita la dimensione del file.

## Limiti

EAFP significa tentare l'operazione e gestire un fallimento previsto; LBYL controlla prima. I due stili si possono combinare: il parser controlla formato e tipo, mentre l'accesso alla chiave usa un except ristretto.

Controllare che un file esista prima di aprirlo non elimina le corse con altri processi. Al contrario, tentare operazioni con effetti irreversibili richiede un progetto esplicito: catturare un errore non annulla cio che e gia avvenuto.

Per risorse preferisci with quando esiste un context manager. ExceptionGroup/except\* e cancellazione asincrona hanno regole ulteriori, trattate nel percorso avanzato; non dedurle dai soli esempi sincroni.

## Errori comuni

- Except Exception o except: usati per nascondere qualsiasi bug.
- Blocco try troppo ampio che attribuisce l'errore all'operazione sbagliata.
- Logging di payload o credenziali dentro messaggi pubblici.
- Return, break o continue in finally.
- Assert per validare input esterni: le assertion possono essere disabilitate con -O.
- Interpretare un fallback come prova di riuscita dell'operazione.

## Checklist

- Errori attesi distinti dai guasti inattesi.
- Messaggi utili senza riportare segreti.
- Causa originale preservata quando si traduce un errore.
- Test di successi, input invalidi e guasti delle dipendenze.
- Cleanup e side effect verificati separatamente.

## Collegamenti

- [[Programmazione/Python/Pagine/Context Managers|Context Managers]]
- [[Programmazione/Python/Pagine/Gestione File|Gestione File]]
- [[Programmazione/Python/Pagine/Logging|Logging]]
- [[Programmazione/Python/Pagine/Testing|Testing]]
- [[Programmazione/Python/Pagine/Asyncio|Asyncio]]
- [[Programmazione/Python/Pagine/Configurazione e Variabili d Ambiente|Configurazione e Variabili d Ambiente]]

## Fonti

- [Python 3.12: errori, chaining e cleanup](https://docs.python.org/3.12/tutorial/errors.html).
- [Python 3.12: gerarchia delle eccezioni e causa](https://docs.python.org/3.12/library/exceptions.html).
- [Python 3.12: semantica di try, else e finally](https://docs.python.org/3.12/reference/compound_stmts.html#the-try-statement).
- [Python 3.12: conversione int](https://docs.python.org/3.12/library/functions.html#int).
- [Python 3.12: assert e ottimizzazione](https://docs.python.org/3.12/reference/simple_stmts.html#the-assert-statement).

## Navigazione

- [[Programmazione/Python/Indice Python|Indice Python]]
