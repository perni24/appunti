---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming, logging]
aliases: [Logging]
prerequisites: []
related: []
---

# Logging in Python

## Sintesi

Il logging registra eventi significativi durante l'esecuzione di un programma. A differenza di `print()`, supporta livelli, formati, handler, filtri e configurazioni diverse per sviluppo, test e produzione.

Il modulo standard e `logging`.

## Quando usarlo

Usa logging quando un messaggio serve a osservare o diagnosticare il comportamento del programma:

- avvio e arresto dell'applicazione;
- errori e warning;
- operazioni importanti;
- eventi di business rilevanti;
- retry, timeout, fallimenti di rete;
- diagnosi in produzione.

Usa `print()` solo per esperimenti rapidi o output intenzionale di una CLI.

## Come funziona

Il sistema ruota attorno a:

- **Logger**: emette eventi;
- **Handler**: decide dove scrivere;
- **Formatter**: definisce il formato;
- **Level**: filtra la severita.

Convenzione per modulo:

```python
import logging

logger = logging.getLogger(__name__)


def process_order(order_id):
    logger.info("Processing order %s", order_id)
```

Configurazione minima:

```python
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
```

## API / Sintassi

Livelli principali:

- `DEBUG`: dettagli per sviluppo e diagnosi;
- `INFO`: eventi normali e significativi;
- `WARNING`: situazione anomala ma non bloccante;
- `ERROR`: errore che impedisce una specifica operazione;
- `CRITICAL`: errore grave per l'applicazione.

Uso:

```python
logger.debug("Payload: %s", payload)
logger.info("Job completed")
logger.warning("Retrying request")
logger.error("Request failed")
logger.critical("Service unavailable")
```

Logging di eccezioni:

```python
try:
    1 / 0
except ZeroDivisionError:
    logger.exception("Calculation failed")
```

`logger.exception()` va usato dentro un blocco `except` e include automaticamente il traceback.

## Esempio pratico

Configurazione semplice per uno script:

```python
import logging

logger = logging.getLogger(__name__)


def configure_logging(verbose=False):
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )


def main():
    configure_logging(verbose=True)
    logger.info("Application started")
    logger.debug("Debug details enabled")


if __name__ == "__main__":
    main()
```

## Varianti

- **Console logging**: utile in sviluppo e CLI.
- **File logging**: utile per script e processi persistenti.
- **Structured logging**: messaggi in formato JSON o simile, frequente in produzione.
- **Logger per modulo**: `logging.getLogger(__name__)`.
- **Configurazione centralizzata**: un punto dell'applicazione configura handler e livelli.
- **Logging di eccezioni**: `logger.exception()` dentro `except`.

## Errori comuni

- Usare `print()` per messaggi applicativi permanenti.
- Loggare password, token o dati sensibili.
- Usare f-string nei log invece di parametri.
- Configurare logging in ogni modulo invece che all'avvio dell'applicazione.
- Usare sempre `ERROR` anche per eventi normali.
- Creare handler duplicati e ottenere log ripetuti.
- Loggare troppo rumore senza contesto utile.

## Checklist

- I logger usano `getLogger(__name__)`?
- La configurazione e centralizzata?
- I livelli sono coerenti con la severita reale?
- I messaggi includono contesto utile?
- I segreti sono esclusi dai log?
- Le eccezioni vengono loggate con traceback quando serve?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Error Handling]]
- [[Configurazione e Variabili d Ambiente]]
- [[Standard Library]]
- [[Testing]]
