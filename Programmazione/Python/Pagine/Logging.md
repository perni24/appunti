---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - python
  - programming
  - logging
aliases:
  - Logging
prerequisites: []
related: []
title: Logging in Python
---

# Logging in Python

## Sintesi

Il modulo standard `logging` registra eventi con livelli, destinazioni e formati configurabili. Serve a diagnosticare e osservare il programma; non sostituisce gestione degli errori, metriche o transazioni.

Riferimento: Python 3.12; esempi verificati con CPython 3.12.10 in processi separati. La configurazione dei log e stato globale del processo: non copiare indiscriminatamente piu configurazioni nello stesso programma.

## Quando usarlo

Per avvio, arresto, guasti, retry e operazioni significative. Usa `print` per output che costituisce il risultato intenzionale di una CLI; i log diagnostici possono andare su stderr, senza mescolarsi a JSON o altri dati su stdout.

Un log non e automaticamente un registro di audit affidabile. Consegna, integrita, conservazione e controllo degli accessi richiedono una progettazione propria.

## Come funziona

Il percorso ordinario e:

1. Il logger valuta se il livello della chiamata e abilitato.
2. Crea un LogRecord e applica i propri filtri.
3. Gli handler locali e, se previsto, quelli degli antenati valutano livello e filtri.
4. Ogni handler formatta il record e lo invia alla destinazione.

Logger, handler e formatter hanno compiti diversi. `getLogger(__name__)` costruisce una gerarchia basata sul nome del modulo; chiamate con lo stesso nome restituiscono lo stesso logger.

Un logger con livello `NOTSET` eredita normalmente il livello effettivo dal primo antenato con un livello esplicito. Il root parte da `WARNING`. `propagate=True` inoltra i record agli handler degli antenati, non li sottopone di nuovo ai livelli o ai filtri dei logger antenati. I livelli e filtri degli **handler** continuano invece ad applicarsi.

## API / Sintassi

| Livello  | Uso abituale                                                 |
| -------- | ------------------------------------------------------------ |
| DEBUG    | Dettagli diagnostici selezionabili.                          |
| INFO     | Eventi normali significativi.                                |
| WARNING  | Situazione inattesa che non ha ancora impedito l'operazione. |
| ERROR    | Un'operazione non e riuscita.                                |
| CRITICAL | Guasto particolarmente grave per il servizio.                |

Questi livelli sono convenzioni: decidi la severita in base all'effetto reale, non al desiderio di far risaltare un messaggio.

### Configurazione per uno script

Blocco completo per un file `app.py`. La configurazione avviene all'avvio, non all'import di ogni modulo.

```python
import logging

logger = logging.getLogger(__name__)


def configure_logging(verbose: bool = False) -> None:
    logging.basicConfig(
        level=logging.DEBUG if verbose else logging.INFO,
        format="%(levelname)s [%(name)s] %(message)s",
    )


def process_order(order_id: int) -> None:
    logger.info("Processing order %s", order_id)


def main() -> None:
    configure_logging(verbose=True)
    logger.info("Application started")
    logger.debug("Debug details enabled")
    process_order(42)


if __name__ == "__main__":
    main()
```

`basicConfig` usa normalmente stderr. Se il root ha gia handler, la chiamata di norma non modifica la configurazione: puo capitare in test, notebook o framework. `force=True` rimuove e chiude gli handler del root prima di riconfigurarlo; e una scelta invasiva riservata a chi controlla l'applicazione, non una soluzione da imporre in una libreria.

Le funzioni di comodo `logging.warning(...)` e simili possono configurare automaticamente il root quando non ha handler. Un logger nominato non chiama da solo basicConfig; in assenza di handler puo intervenire il fallback `lastResort` per warning ed errori.

### Parametri e lavoro differito

```python
import io
import logging

output = io.StringIO()
logger = logging.getLogger("demo.lazy")
logger.setLevel(logging.INFO)
logger.propagate = False
handler = logging.StreamHandler(output)
logger.addHandler(handler)
calls = []


def expensive_detail():
    calls.append("computed")
    return "detail"


try:
    logger.debug("Details: %s", expensive_detail())
    if logger.isEnabledFor(logging.DEBUG):
        logger.debug("Details: %s", expensive_detail())
    logger.info("Processed %s items", 3)
finally:
    logger.removeHandler(handler)
    handler.close()

print(calls)                     # ['computed']
print(output.getvalue().strip())  # Processed 3 items
```

La combinazione del messaggio con `%s` viene differita finche un handler la formatta, ma **gli argomenti della chiamata vengono valutati subito**. La guardia evita qui un calcolo inutile. Anche `isEnabledFor` considera il logger, non tutte le soglie degli handler.

Le f-string sono valide, ma costruiscono il testo prima della chiamata. Non sono un errore di sintassi o sempre un bug: usa i parametri quando la costruzione differita e utile. L'opzione `style` del Formatter riguarda il formato del record, non cambia la sintassi dei parametri passati a `logger.info`.

## Esempio pratico

### Propagazione e doppia emissione

```python
import io
import logging

output = io.StringIO()
parent = logging.getLogger("demo.routing")
parent.setLevel(logging.ERROR)
parent.propagate = False
handler = logging.StreamHandler(output)
handler.setLevel(logging.DEBUG)
handler.setFormatter(logging.Formatter("%(levelname)s %(message)s"))
parent.addHandler(handler)
child = logging.getLogger("demo.routing.worker")
child.setLevel(logging.DEBUG)
child.propagate = True

try:
    child.debug("ready")
finally:
    parent.removeHandler(handler)
    handler.close()

print(output.getvalue().strip())  # DEBUG ready
```

Il DEBUG supera il logger figlio e arriva all'handler del padre, il cui livello e DEBUG. Il livello ERROR del logger padre non lo filtra nuovamente. Per una soglia comune alle emissioni propagate configura l'handler.

Se lo stesso record incontra un handler sul figlio e uno sul padre puo essere scritto due volte. Non aggiungere handler a ogni chiamata di una funzione; scegli chi possiede la configurazione e, solo quando appropriato, disabilita la propagazione sul logger che ha una destinazione autonoma.

## Varianti

### Eccezioni

```python
import io
import logging

output = io.StringIO()
logger = logging.getLogger("demo.errors")
logger.setLevel(logging.ERROR)
logger.propagate = False
handler = logging.StreamHandler(output)
logger.addHandler(handler)

try:
    try:
        int("not-a-number")
    except ValueError:
        logger.exception("Could not parse configured value")
finally:
    logger.removeHandler(handler)
    handler.close()

logged = output.getvalue()
print("Traceback" in logged, "ValueError" in logged)  # True True
```

`logger.exception` emette a livello ERROR con informazioni sull'eccezione corrente; usalo nel contesto di un except. `exc_info=True` permette la stessa inclusione in altre chiamate. Fuori da un'eccezione attiva non ottieni automaticamente il traceback di un errore passato.

Loggare non equivale a gestire: decidi se rilanciare, restituire un risultato o interrompere. Evita di registrare la stessa eccezione a ogni livello dello stack. Traceback e messaggi delle eccezioni possono contenere dati sensibili anche se la stringa di log sembra innocua.

### Configurazione centralizzata e JSON

La configurazione seguente usa solo oggetti locali e trusted; una configurazione arbitraria puo importare/costruire oggetti e non va trattata come dati innocui.

```python
import json
import logging
import logging.config


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        data = {
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            data["exception"] = self.formatException(record.exc_info)
        return json.dumps(data, ensure_ascii=False)


logging.config.dictConfig({
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"json": {"()": JsonFormatter}},
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stderr",
            "formatter": "json",
            "level": "INFO",
        }
    },
    "root": {"level": "INFO", "handlers": ["console"]},
})
logging.getLogger("demo.app").info("Loaded %s records", 3)
```

`disable_existing_loggers=False` rende esplicito che non vuoi disabilitare i logger nominati gia esistenti. Non significa preservare in ogni dettaglio handler e configurazioni precedenti: dictConfig va gestito centralmente.

Il formatter produce JSON tramite un serializzatore, non concatenazione di stringhe. Il demo non include timestamp o ID di correlazione; puoi aggiungerli con una convenzione dichiarata. `extra`, LoggerAdapter e filtri possono portare contesto, ma un campo richiesto dal formato e assente puo causare errori di formattazione. Evita collisioni con campi riservati del LogRecord.

### File e rotazione

Esempio autonomo che scrive soltanto in una directory temporanea:

```python
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory(prefix="appunti-log-") as directory:
    path = Path(directory) / "app.log"
    logger = logging.getLogger("demo.rotation")
    logger.setLevel(logging.INFO)
    logger.propagate = False
    handler = RotatingFileHandler(
        path, maxBytes=80, backupCount=2, encoding="utf-8"
    )
    logger.addHandler(handler)
    try:
        for index in range(10):
            logger.info("Completed batch number %s", index)
    finally:
        logger.removeHandler(handler)
        handler.close()
    generated = sorted(item.name for item in path.parent.iterdir())
    print(generated)  # app.log e backup numerati
```

Una FileHandler normale usa append per default; la modalita w tronca il file. Rotazione, retention, permessi e spazio disponibile vanno scelti per l'ambiente. Non usare il demo come strategia per piu processi che ruotano lo stesso file.

La standard library protegge molte operazioni logging tra thread, ma non fornisce una soluzione generale per processi indipendenti che scrivono nello stesso file. Per centralizzare o spostare I/O fuori dal percorso chiamante esistono QueueHandler/QueueListener; code piene, arresto e drain richiedono una politica esplicita.

### Librerie e dati sensibili

Una libreria usa logger per modulo e puo installare un NullHandler sul proprio logger principale; lascia configurazione e destinazioni all'applicazione. Non disabilita la propagazione indiscriminatamente e non chiama basicConfig durante l'import.

Non registrare password, token, corpi completi delle richieste o dati personali non necessari. Parametrizzare i messaggi non li anonimizza e non neutralizza newline controllati dall'esterno. Un filtro deve essere applicato alle destinazioni rilevanti e valutato anche sui messaggi di eccezione. Logging e best effort in molti setup: errori dell'handler possono perdere eventi o, per handler personalizzati, propagarsi.

## Errori comuni

- Presumere che basicConfig riconfiguri sempre il processo.
- Credere che il livello del padre filtri ogni record propagato.
- Confondere messaggio differito con argomenti non valutati.
- Duplicare handler o registrare piu volte lo stesso errore.
- Usare logging come gestione dell'eccezione o prova di successo.
- Considerare JSON, extra o parametri una protezione automatica dei segreti.

## Checklist

- Chi configura e chi chiude gli handler?
- I livelli dei logger e degli handler sono coerenti?
- La propagazione causa duplicati?
- Il lavoro costoso viene evitato quando il log e disabilitato?
- Output della CLI e diagnostica restano separati?
- Sono gestiti retention, segreti e possibili errori di consegna?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Error Handling|Error Handling]]
- [[Programmazione/Python/Pagine/Configurazione e Variabili d Ambiente|Configurazione e variabili d'ambiente]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]
- [[Programmazione/Python/Pagine/Testing|Testing]]
- [[Programmazione/Python/Pagine/Threading|Threading]]
- [[Programmazione/Python/Pagine/Multiprocessing|Multiprocessing]]

## Fonti

- [Python 3.12: logging, livelli e propagazione](https://docs.python.org/3.12/library/logging.html).
- [Logging HOWTO](https://docs.python.org/3.12/howto/logging.html).
- [Logging Cookbook: librerie, code e processi](https://docs.python.org/3.12/howto/logging-cookbook.html).
- [dictConfig e considerazioni di sicurezza](https://docs.python.org/3.12/library/logging.config.html).
- [Handler e rotazione](https://docs.python.org/3.12/library/logging.handlers.html).
