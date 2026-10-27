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
  - testing
aliases:
  - Testing
  - Test Python
prerequisites: []
related: []
title: Testing in Python
---

# Testing in Python

## Sintesi

I test verificano comportamenti osservabili per input e condizioni scelti. Riducono regressioni e rendono espliciti i contratti, ma non dimostrano che ogni percorso del programma sia corretto.

Riferimento: CPython 3.12.10, pytest 9.1.1 e Coverage.py 7.17.0. I comandi seguenti vengono eseguiti nella radice del piccolo progetto mostrato, non nel vault.

## Quando usarlo

Per logica condivisa, validazione, trasformazioni, gestione degli errori e bugfix. Un caso di regressione utile fallisce prima della correzione e passa dopo, senza dipendere dall'implementazione interna.

Distinzione di scopo:

- Unit test: controlla una piccola unita e i suoi contratti.
- Integration test: controlla componenti che collaborano realmente, per esempio codice e database.
- End-to-end: attraversa un flusso completo dell'applicazione.
- Regression test: protegge un comportamento che in passato si era rotto; puo essere di ciascuno dei livelli precedenti.

## Come funziona

Prepara input e dipendenze (**Arrange**), esegui il codice applicativo (**Act**), osserva risultato, errore o effetto (**Assert**). Un test che ricalcola da solo la regola senza chiamare il codice reale non protegge quella funzione.

I test devono essere raccolti da un runner. Definire una funzione test in uno script e poi eseguire lo script non significa che il test sia partito. Con pytest i nomi convenzionali sono file `test_*.py` o `*_test.py` e funzioni `test_*`.

## API / Sintassi

### Un progetto minimo completo

Layout flat didattico; per un package installabile con layout src vedi Creazione di Package.

```text
quality-demo/
  ports.py
  pyproject.toml
  tests/
    test_ports.py
    test_ports_unittest.py
    test_environment.py
    test_notification.py
```

`ports.py`:

```python
import os


def parse_port(value: str) -> int:
    if not isinstance(value, str):
        raise TypeError("port must be a string")
    if not 1 <= len(value) <= 5 or not value.isascii() or not value.isdecimal():
        raise ValueError("port must contain 1 to 5 ASCII digits")
    port = int(value)
    if not 1 <= port <= 65535:
        raise ValueError("port must be between 1 and 65535")
    return port


def load_port() -> int:
    return parse_port(os.getenv("APP_PORT", "8000"))
```

Il contratto e una porta di configurazione compresa tra 1 e 65535, scritta con una-cinque cifre ASCII. Spazi, segni, decimali e cifre Unicode vengono rifiutati; zeri iniziali ammessi entro cinque caratteri. La porta zero puo avere altri significati nelle API di rete, ma qui e esclusa intenzionalmente. Il parser non controlla che la porta sia libera o raggiungibile.

`tests/test_ports.py`:

```python
import pytest

from ports import parse_port


@pytest.mark.parametrize(
    ("text", "expected"),
    [("1", 1), ("8000", 8000), ("65535", 65535), ("00080", 80)],
)
def test_parse_port_accepts_valid_input(text, expected):
    assert parse_port(text) == expected


@pytest.mark.parametrize(
    "text",
    ["", "0", "65536", "-1", "+80", " 80", "80 ", "1.5", "123456", "\u0668\u0660"],
)
def test_parse_port_rejects_invalid_values(text):
    with pytest.raises(ValueError):
        parse_port(text)


@pytest.mark.parametrize("value", [None, 80, True, b"80"])
def test_parse_port_rejects_non_strings(value):
    with pytest.raises(TypeError):
        parse_port(value)
```

Ogni combinazione e un caso distinto, con diagnosi piu precisa di un unico ciclo opaco. `pytest.raises` accetta anche sottoclassi dell'eccezione indicata; se il tipo esatto fa parte del contratto, controlla anche `type(info.value)`. Non pretendere testi degli errori identici se non sono API pubblica.

### unittest

`unittest` e nella standard library e usa metodi di asserzione. Questa alternativa esercita la stessa funzione, senza copiarla nel test.

`tests/test_ports_unittest.py`:

```python
import unittest

from ports import parse_port


class PortTests(unittest.TestCase):
    def test_boundaries(self):
        for text, expected in [("1", 1), ("65535", 65535)]:
            with self.subTest(text=text):
                self.assertEqual(parse_port(text), expected)

    def test_rejects_above_range(self):
        with self.assertRaises(ValueError):
            parse_port("65536")


if __name__ == "__main__":
    unittest.main()
```

Dalla radice del progetto:

```powershell
python -m unittest discover -s tests -p "test_*unittest.py" -v
```

pytest puo raccogliere anche TestCase, ma la normale iniezione delle fixture pytest come parametri dei metodi TestCase non funziona come nei test a funzione.

## Esempio pratico

### Fixture, file temporanei e ambiente

`tests/test_environment.py`:

```python
from pathlib import Path

import pytest

from ports import load_port, parse_port


@pytest.fixture
def port_file(tmp_path: Path) -> Path:
    path = tmp_path / "port.txt"
    path.write_text("8000", encoding="utf-8")
    return path


def test_port_from_file(port_file: Path):
    assert parse_port(port_file.read_text(encoding="utf-8")) == 8000


def test_load_port_uses_default(monkeypatch):
    monkeypatch.delenv("APP_PORT", raising=False)
    assert load_port() == 8000


def test_load_port_reads_environment(monkeypatch):
    monkeypatch.setenv("APP_PORT", "9000")
    assert load_port() == 9000


def test_load_port_rejects_invalid_environment(monkeypatch):
    monkeypatch.setenv("APP_PORT", "65536")
    with pytest.raises(ValueError):
        load_port()
```

`tmp_path` fornisce una directory dedicata al test, distinta dai file dell'utente. pytest puo conservare directory di esecuzioni recenti: non presumere che ogni file sparisca immediatamente. `monkeypatch` ripristina le modifiche registrate all'uscita del test, anche se fallisce.

Il default delle fixture e lo scope function; scope module/session condividono risorse tra piu test e richiedono attenzione allo stato. Per setup/teardown usa una fixture con `yield` e cleanup in `finally`. Se il setup fallisce prima del yield, il codice sequenziale dopo il yield non parte: le risorse gia acquisite vanno protette subito da un `try/finally` o da un context manager.

### Configurazione e comandi

Prerequisiti: ambiente virtuale con pytest e coverage installati, dipendenze del progetto disponibili. Fissa le versioni nel workflow del progetto; non installare i tool nelle dipendenze runtime per comodita.

`pyproject.toml`:

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "--strict-markers"
markers = [
  "integration: richiede componenti reali esterni al test unitario",
]
```

```powershell
python -m pytest -q
```

Raccogli soltanto, per controllare che i test siano davvero scoperti:

```powershell
python -m pytest --collect-only -q
```

Esegui una selezione precisa:

```powershell
python -m pytest tests/test_ports.py -q
```

La forma `python -m pytest` usa l'interprete scelto e aggiunge la directory corrente al percorso degli import. Per un progetto src installa prima il package nel suo ambiente, non aggiungere percorsi casuali nei test.

Exit code 0 significa test riusciti; 1 indica fallimenti; 5 significa nessun test raccolto. Altri codici indicano interruzioni o errori di uso/esecuzione: controllali in CI. Non eseguire i test con `python -O`: puo rimuovere assert ordinari e alterare il comportamento del codice sotto test.

## Varianti

### Mock e contratti

`tests/test_notification.py`:

```python
from unittest.mock import create_autospec

import pytest


class Transport:
    def send(self, message: str) -> None:
        raise NotImplementedError


def send_notification(client: Transport, message: str) -> None:
    client.send(message)


def test_send_notification_uses_transport():
    client = create_autospec(Transport, instance=True, spec_set=True)
    send_notification(client, "hello")
    client.send.assert_called_once_with("hello")


def test_send_notification_propagates_error():
    client = create_autospec(Transport, instance=True, spec_set=True)
    error = OSError("transport unavailable")
    client.send.side_effect = error
    with pytest.raises(OSError) as caught:
        send_notification(client, "hello")
    assert caught.value is error
```

`autospec` limita la firma; `spec_set` limita gli attributi disponibili. Non controllano semanticamente i dati e non dimostrano che un servizio remoto accetti la richiesta. Qui non viene inviata alcuna notifica.

Se usi `patch`, sostituisci il nome **dove viene cercato**, non necessariamente nel modulo che lo ha definito. Dopo `from provider import send` in `service`, il bersaglio usuale e `service.send`. Ripristina sempre patch e stato globale; per codice asincrono usa un runner appropriato e mock awaitable come `AsyncMock`.

### Coverage

Misura quali righe e diramazioni sono state attraversate, non quanto siano significative le asserzioni. Un test senza verifiche puo far crescere la coverage.

Nel progetto mostrato, limita la misura al modulo applicativo `ports`:

```powershell
python -m coverage run --branch --source=ports -m pytest -q
```

```powershell
python -m coverage report -m
```

Una soglia di progetto puo rendere il controllo vincolante:

```powershell
python -m coverage report --fail-under=100
```

Qui 100 e raggiungibile sul piccolo parser e viene provato, non proposto come soglia universale. `--branch` aggiunge la copertura dei rami alla misura delle istruzioni; anche il 100% non prova tutti i valori, combinazioni o eccezioni.

`coverage run` crea/aggiorna il file di dati della coverage. L'HTML e un artefatto generato:

```powershell
python -m coverage html
```

Non committare automaticamente `.coverage`, cache o `htmlcov/`. `pytest-cov` e un plugin alternativo per l'integrazione: `--cov` non e un'opzione del pytest di base e non viene usata in questi comandi.

## Errori comuni

- Test che ridefiniscono la funzione invece di importarla.
- Un solo percorso felice, senza limiti o input invalidi.
- Nessun test raccolto interpretato come successo.
- Mock troppo permissivi o patch nel namespace sbagliato.
- Dipendenze non dichiarate da ambiente, ordine, rete o tempo reale.
- Coverage alta presentata come prova di correttezza.

## Checklist

- Il runner raccoglie i casi previsti?
- Si esercita il codice applicativo effettivo?
- Sono coperti valori limite, errori e stato dopo un fallimento?
- Fixture e patch vengono ripulite?
- I test distinguono comportamento reale e simulato?
- Exit code e soglie vengono rispettati in CI?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Error Handling|Error Handling]]
- [[Programmazione/Python/Pagine/Creazione di Package|Creazione di Package]]
- [[Programmazione/Python/Pagine/Logging|Logging]]
- [[Programmazione/Python/Pagine/Type Hinting|Type Hinting]]
- [[Programmazione/Python/Pagine/tox e nox|tox e nox]]
- [[Programmazione/Python/Pagine/pre-commit|pre-commit]]

## Fonti

- [Python 3.12: unittest](https://docs.python.org/3.12/library/unittest.html).
- [pytest: invocazione e raccolta](https://docs.pytest.org/en/stable/how-to/usage.html).
- [pytest: fixture e teardown](https://docs.pytest.org/en/stable/how-to/fixtures.html).
- [pytest: monkeypatch](https://docs.pytest.org/en/stable/how-to/monkeypatch.html).
- [pytest: codici di uscita](https://docs.pytest.org/en/stable/reference/exit-codes.html).
- [unittest.mock: patch nel namespace corretto](https://docs.python.org/3.12/library/unittest.mock.html#where-to-patch).
- [Coverage.py: copertura dei rami](https://coverage.readthedocs.io/en/latest/branch.html).
