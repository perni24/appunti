---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming, testing]
aliases: [Testing, Test Python]
prerequisites: []
related: []
---

# Testing in Python

## Sintesi

Il testing verifica automaticamente che il codice si comporti come previsto. In Python i test riducono regressioni, documentano contratti e rendono piu sicuri refactoring, bugfix e nuove feature.

Un buon test non dimostra che il programma e perfetto: controlla un comportamento rilevante in modo ripetibile.

## Quando usarlo

Scrivi test soprattutto per:

- logica di dominio;
- parsing e validazione;
- funzioni con casi limite;
- bugfix che non vuoi far ricomparire;
- interazioni con file, database o API;
- componenti condivisi o difficili da verificare manualmente.

## Come funziona

Un test prepara dati, esegue il comportamento e verifica il risultato.

```python
def add(a, b):
    return a + b


def test_add():
    assert add(2, 3) == 5
```

Struttura mentale utile:

- **Arrange**: prepara input e dipendenze;
- **Act**: esegui il comportamento;
- **Assert**: verifica il risultato.

```python
def test_is_adult():
    age = 20

    result = age >= 18

    assert result is True
```

## API / Sintassi

Con `unittest`, incluso nella standard library:

```python
import unittest


def add(a, b):
    return a + b


class TestMath(unittest.TestCase):
    def test_add(self):
        self.assertEqual(add(2, 3), 5)


if __name__ == "__main__":
    unittest.main()
```

Con `pytest`, molto comune nei progetti moderni:

```python
def test_add():
    assert add(2, 3) == 5
```

Test di eccezioni con `pytest`:

```python
import pytest


def divide(a, b):
    if b == 0:
        raise ValueError("b cannot be zero")
    return a / b


def test_divide_rejects_zero():
    with pytest.raises(ValueError):
        divide(10, 0)
```

## Esempio pratico

Test di una funzione che legge configurazione:

```python
import pytest


def parse_port(value):
    port = int(value)
    if port <= 0:
        raise ValueError("port must be positive")
    return port


def test_parse_port_accepts_positive_number():
    assert parse_port("8000") == 8000


def test_parse_port_rejects_zero():
    with pytest.raises(ValueError):
        parse_port("0")
```

Questo copre sia percorso valido sia caso di errore.

## Varianti

- **Unit test**: verifica funzioni, classi o moduli isolati.
- **Integration test**: verifica collaborazione tra componenti.
- **End-to-end test**: verifica un flusso completo.
- **Fixture**: prepara dati o risorse condivise tra test.
- **Mock**: sostituisce dipendenze esterne o lente.
- **Regression test**: blocca il ritorno di un bug gia corretto.

Esempio con mock:

```python
from unittest.mock import Mock


def send_notification(client, message):
    client.send(message)


def test_send_notification():
    client = Mock()

    send_notification(client, "hello")

    client.send.assert_called_once_with("hello")
```

## Errori comuni

- Testare dettagli interni invece del comportamento osservabile.
- Scrivere test dipendenti dall'ordine di esecuzione.
- Usare troppi mock e verificare solo l'implementazione.
- Ignorare casi di errore e boundary case.
- Rendere i test lenti perche dipendono da rete, tempo reale o servizi esterni.
- Confondere coverage alta con qualita reale dei test.
- Scrivere nomi di test generici, come `test_function`.

## Checklist

- Il test verifica un comportamento chiaro?
- Il nome del test descrive il caso?
- Il test e deterministico?
- Copre sia percorso felice sia casi limite rilevanti?
- Evita dipendenze esterne non necessarie?
- Il fallimento del test sarebbe facile da capire?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Programmazione/Python/Pagine/Error Handling|Error Handling]]
- [[Creazione di Package]]
- [[Logging]]
- [[tox e nox]]
- [[pre-commit]]
