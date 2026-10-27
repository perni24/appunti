---
date: 2026-07-30
area: Programmazione
topic: Promemoria Python
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - python
  - promemoria
  - eccezioni
  - logging
  - debug
aliases:
  - Cheatsheet errori Python
prerequisites: []
related:
  - "[[Programmazione/Python/Pagine/Error Handling]]"
  - "[[Programmazione/Python/Pagine/Logging]]"
title: Python - Eccezioni, log e debug
---

# Python - Eccezioni, log e debug

## Obiettivo

Gestire errori previsti, conservare le cause utili e osservare il programma senza nascondere guasti. Teoria: [[Programmazione/Python/Pagine/Error Handling|Error Handling]] e [[Programmazione/Python/Pagine/Logging|Logging]].

Baseline: **CPython 3.12.10**, solo standard library. I blocchi sono autonomi; le funzioni senza chiamata finale vanno invocate con i dati del chiamante. Il blocco debugger e intenzionalmente interattivo.

## Quando usarlo

- Devi distinguere assenza, input invalido e guasto inatteso.
- Un errore richiede un messaggio applicativo senza perdere la causa.
- Vuoi aggiungere log o ispezionare uno stato durante lo sviluppo.

## Procedura

1. Racchiudi nel `try` solo l'operazione pertinente e cattura tipi specifici.
2. Decidi se propagare, tradurre o restituire un fallback esplicito.
3. Assegna il cleanup a `with`/`finally` e configura i log all'ingresso dell'applicazione.

## Snippet

### Generare un errore

```python
def require_user(user):
    if user is None:
        raise ValueError("User is required")
    return user


print(require_user({"id": 1}))  # {'id': 1}
```

Controlla solo l'assenza `None`, non lo schema dell'utente. Usa `TypeError` per tipi incompatibili e `ValueError` per valori non ammessi secondo il contratto.

### Try, except, else e finally

```python
from io import StringIO


def parse_number(text):
    source = StringIO(text)
    try:
        number = int(source.read())
    except ValueError:
        return None
    else:
        return number * 2
    finally:
        source.close()


print(parse_number("21"))  # 42
print(parse_number("invalid"))  # None
```

Il demo sceglie `None` come fallback per testo non convertibile, distinto da `0`. `else` vale solo per il percorso riuscito; un errore al suo interno non viene catturato dagli `except` precedenti. `finally` chiude anche prima del ritorno: non inserirvi un `return` che copra risultati o errori.

### File opzionale assente

```python
from pathlib import Path


def read_optional(path):
    try:
        return Path(path).read_text(encoding="utf-8")
    except FileNotFoundError:
        return None
```

`None` indica assenza, `""` un file vuoto valido. Non nasconde permessi negati o decoding invalido. Per questi serve una decisione separata, non un `except Exception` indiscriminato.

### Conservare la causa

```python
from pathlib import Path


def read_required(path):
    try:
        return Path(path).read_text(encoding="utf-8")
    except OSError as error:
        raise RuntimeError("Required file could not be read") from error
```

`from error` conserva la causa in `__cause__`; `raise` senza argomenti rilancia l'errore attivo. `from None` nasconde il contesto nel traceback ordinario, **non cancella i dati sensibili** contenuti nell'eccezione. Qui gli errori di decoding restano distinti.

### Eccezione personalizzata

```python
class EntityNotFoundError(Exception):
    pass


def get_entity(entities, entity_id):
    try:
        return entities[entity_id]
    except KeyError as error:
        raise EntityNotFoundError(f"Entity {entity_id} not found") from error


print(get_entity({1: "demo"}, 1))  # demo
```

Il contratto qui e un dizionario con chiavi hashable. Una voce presente con valore `None` non e assente. Deriva normalmente da `Exception`, non da `BaseException`.

### Ignorare un errore specifico

```python
from contextlib import suppress
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory() as directory:
    path = Path(directory) / "optional.txt"
    with suppress(FileNotFoundError):
        path.unlink()
    print(path.exists())  # False
```

Ignora soltanto l'assenza. `unlink` cancellerebbe un file esistente: qui si opera solo nella directory temporanea. Non usare `suppress(Exception)` per nascondere bug o permessi errati.

### Logging

```python
import logging

logger = logging.getLogger(__name__)


def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(levelname)s %(name)s: %(message)s",
    )
    logger.debug("Details")
    logger.info("Processed %s items", 3)
    logger.warning("Optional configuration missing")
    logger.error("Example failure")


if __name__ == "__main__":
    main()
```

In un processo nuovo DEBUG resta filtrato e gli altri messaggi vanno normalmente su stderr. `basicConfig` non riconfigura il root se ha gia handler; non aggiungere automaticamente `force=True` in librerie o notebook. Parametri `%s` differiscono la formattazione, **non** il calcolo degli argomenti.

### Loggare lo stack trace

```python
import logging

logger = logging.getLogger(__name__)


def main():
    logging.basicConfig(level=logging.INFO)
    try:
        int("invalid")
    except ValueError:
        logger.exception("Could not parse demo value")
        return False
    return True


if __name__ == "__main__":
    print(main())  # False
```

`logger.exception` aggiunge il traceback dell'errore corrente a livello ERROR: usalo dentro `except`. Il demo segnala il fallimento con `False`; loggare da solo non gestisce un errore. Non loggare la stessa eccezione a ogni livello, token o payload sensibili: anche il traceback puo rivelarli.

## Adattamenti comuni

### Debug interattivo

In un file `debug_demo.py`, eseguito da terminale durante lo sviluppo:

```python
value = 3
breakpoint()
print(value * 2)
```

Con il debugger predefinito: `p value` ispeziona, `n` passa alla riga successiva, `c` continua, `q` termina la sessione. **Il programma si ferma in attesa di input**: non lasciare breakpoint attivi in servizi o CI.

Per avviare quello stesso script direttamente sotto pdb:

```text
python -m pdb debug_demo.py
```

`breakpoint()` usa `sys.breakpointhook`, configurabile anche con `PYTHONBREAKPOINT`; un IDE puo modificarne il comportamento. Nella configurazione standard il valore `0` disabilita l'hook, ma non e una politica di rilascio.

### Ispezionare valori

```python
from types import SimpleNamespace

value = "line\nnext"
record = SimpleNamespace(id=1, name="Ada")
print(repr(value))  # 'line\nnext'
print(type(value))  # <class 'str'>
print(vars(record))  # {'id': 1, 'name': 'Ada'}
```

`repr` rende visibili caratteri come newline, non anonimizza i dati. `vars(obj)` richiede un `__dict__`; non funziona su tutti i tipi e puo esporre stato mutabile interno.

### Asserzioni

```python
def half(value):
    assert value >= 0, "Internal value must be non-negative"
    return value / 2


print(half(4))  # 2.0
```

Per invarianti interne, non per validazione di input, autorizzazioni o altre regole indispensabili. Con `python -O` gli `assert` vengono rimossi: anche l'espressione non viene valutata. Usa controlli espliciti e `raise` dove il controllo deve sempre restare attivo.

## Debug rapido

- **Errore nascosto**: cerca `except:`, gestori troppo ampi e `return` in `finally`.
- **Log assenti o duplicati**: controlla livelli, handler e propagazione prima di riconfigurare tutto.
- **Log disabilitato ma lavoro costoso**: gli argomenti vengono valutati comunque; valuta una guardia `logger.isEnabledFor`.
- **Debugger non si apre**: controlla hook, ambiente, IDE e disponibilita di un terminale interattivo.
- **Controllo scompare in produzione**: verifica l'uso scorretto di `assert`.
- **Cancellazione async**: `CancelledError` non deriva da `Exception`; non sopprimerla durante il cleanup.

## Checklist finale

- Tipi di errore specifici e fallback distinguibili?
- Causa conservata quando serve e nessun messaggio sensibile?
- Risorse chiuse anche in caso di errore?
- Logging configurato dall'applicazione, senza duplicazioni?
- Nessun breakpoint o assert usato come controllo di produzione?

## Collegamenti

- [[Programmazione/Python/Pagine/Error Handling|Error Handling]]
- [[Programmazione/Python/Pagine/Logging|Logging]]
- [[Programmazione/Python/Pagine/Profiling|Profiling]]
- [[Programmazione/Python/Pagine/Testing|Testing]]
- [[Programmazione/Python/Promemoria/Pagine/Python - Asyncio e concorrenza|Asyncio e concorrenza]]
- [[Programmazione/Python/Promemoria/Indice Promemoria Python|Indice Promemoria Python]]

## Fonti

- [Python 3.12: errori ed eccezioni](https://docs.python.org/3.12/tutorial/errors.html).
- [Python 3.12: logging](https://docs.python.org/3.12/library/logging.html) e [Logging HOWTO](https://docs.python.org/3.12/howto/logging.html).
- [Python 3.12: pdb](https://docs.python.org/3.12/library/pdb.html) e [breakpoint](https://docs.python.org/3.12/library/functions.html#breakpoint).
- [Python 3.12: assert](https://docs.python.org/3.12/reference/simple_stmts.html#the-assert-statement).
