---
date: 2026-07-30
area: Programmazione
topic: Promemoria Python
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [python, promemoria, eccezioni, logging, debug]
aliases: [Cheatsheet errori Python]
prerequisites: []
related:
  - "[[Programmazione/Python/Pagine/Error Handling]]"
  - "[[Programmazione/Python/Pagine/Logging]]"
---

# Python - Eccezioni, log e debug

## Generare un errore

```python
if user is None:
    raise ValueError("User is required")
```

## Gestire

```python
try:
    result = load_data()
except FileNotFoundError:
    result = default_data()
except ValueError as error:
    print(error)
else:
    process(result)
finally:
    close_resources()
```

## Conservare la causa

```python
try:
    save_data()
except OSError as error:
    raise RuntimeError("Salvataggio fallito") from error
```

## Eccezione personalizzata

```python
class EntityNotFoundError(Exception):
    pass
```

```python
raise EntityNotFoundError(entity_id)
```

## Ignorare un errore specifico

```python
from contextlib import suppress

with suppress(FileNotFoundError):
    path.unlink()
```

## Logging

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.debug("Dettaglio")
logger.info("Operazione completata")
logger.warning("Configurazione mancante")
logger.error("Operazione fallita")
```

## Loggare lo stack trace

```python
try:
    operation()
except OSError:
    logger.exception("Errore durante l'operazione")
```

Usare `logger.exception()` dentro un blocco `except`.

## Debug

```python
breakpoint()
```

```python
print(repr(value))
print(type(value))
print(vars(object))
```

## Asserzioni

```python
assert value >= 0, "value must be non-negative"
```

Non usare `assert` per validare input esterni o regole necessarie in produzione.

## Approfondimento

- [[Programmazione/Python/Pagine/Error Handling]]
- [[Programmazione/Python/Pagine/Logging]]
- [[Programmazione/Python/Pagine/Profiling]]
- [[Programmazione/Python/Pagine/Testing]]
