---
date: 2026-05-14
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Testing]
prerequisites: []
related: []
---
# Testing in Python

## Sintesi

Nota su Testing in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.

## Concetto chiave
Il **testing** e la pratica di verificare in modo automatico che il codice si comporti come previsto. In Python, i test servono a ridurre regressioni, documentare il comportamento atteso e rendere piu sicuri refactoring, bugfix e nuove feature.

Un buon test non dimostra che il codice e "perfetto": dimostra che, per certi input e certe condizioni, il comportamento osservato corrisponde al contratto del sistema.

> [!INFO] Obiettivo reale
> I test non servono a "decorare" il progetto. Servono a ridurre il costo del cambiamento. Se modificare il codice rompe tutto e nessuno se ne accorge subito, manca una rete di sicurezza.

---

##  Tipi di test

### Unit Test
Verificano unita piccole e isolate di codice:
- funzioni;
- metodi;
- classi;
- moduli con responsabilita limitata.

### Integration Test
Verificano la collaborazione tra componenti:
- database + repository;
- API + servizi;
- filesystem + parser;
- moduli diversi che lavorano insieme.

### End-to-End Test
Verificano flussi completi dal punto di vista dell'utente o del sistema.

Per la maggior parte dei progetti Python, i primi due livelli sono quelli piu frequenti nel lavoro quotidiano.

---

##  Esempi Pratici

### Test semplice con `assert`

```python
def add(a: int, b: int) -> int:
    return a + b

def test_add() -> None:
    assert add(2, 3) == 5
```

Questo e il cuore di molti test con `pytest`: chiami una funzione e verifichi il risultato atteso.

### Struttura Arrange / Act / Assert

```python
def test_is_adult() -> None:
    # Arrange
    age = 20

    # Act
    result = age >= 18

    # Assert
    assert result is True
```

Questa struttura mantiene il test leggibile e facile da diagnosticare.

### Test di eccezioni

```python
import pytest

def divide(a: float, b: float) -> float:
    if b == 0:
        raise ValueError("b non puo essere zero")
    return a / b

def test_divide_raises_on_zero() -> None:
    with pytest.raises(ValueError):
        divide(10, 0)
```

Questo si collega direttamente a [[Programmazione/Python/Pagine/Error Handling]].

---

##  Framework comuni

### `unittest`
Fa parte della Standard Library ed e il framework storico incluso in Python.

```python
import unittest

def add(a: int, b: int) -> int:
    return a + b

class TestMath(unittest.TestCase):
    def test_add(self) -> None:
        self.assertEqual(add(2, 3), 5)

if __name__ == "__main__":
    unittest.main()
```

Vantaggi:
- zero dipendenze esterne;
- disponibile ovunque con Python;
- sufficiente per molti casi.

### `pytest`
E il framework piu diffuso in molti progetti moderni.

```python
def add(a: int, b: int) -> int:
    return a + b

def test_add() -> None:
    assert add(2, 3) == 5
```

Vantaggi:
- sintassi piu compatta;
- fixture molto potenti;
- ottima ergonomia;
- ecosistema esteso.

---

##  Fixture, setup e isolamento

I test devono essere ripetibili e indipendenti. Per questo serve separare bene:
- preparazione dati;
- esecuzione;
- pulizia.

### Fixture con `pytest`

```python
import pytest

@pytest.fixture
def sample_user() -> dict[str, str]:
    return {"name": "Luca", "role": "admin"}

def test_user_role(sample_user: dict[str, str]) -> None:
    assert sample_user["role"] == "admin"
```

Le fixture evitano duplicazione e rendono i test piu modulari.

### Setup e teardown
Con `unittest` si usano spesso:
- `setUp()`
- `tearDown()`

Con `pytest`, molte volte questo pattern viene sostituito da fixture.

---

##  Mocking e dipendenze esterne

Un buon test unitario non dovrebbe dipendere realmente da:
- rete;
- database esterni;
- filesystem reale, se non necessario;
- clock di sistema;
- API di terze parti.

Per questo si usano mock e stub.

### Esempio con `unittest.mock`

```python
from unittest.mock import Mock

def send_notification(client, message: str) -> None:
    client.send(message)

def test_send_notification() -> None:
    client = Mock()

    send_notification(client, "hello")

    client.send.assert_called_once_with("hello")
```

Il mocking e utile, ma va usato con criterio: se un test mocka tutto, rischia di verificare solo l'implementazione e non il comportamento reale.

---

##  Dove mettere i test

Una struttura comune e:

```text
project/
├── src/
│   └── my_package/
└── tests/
    ├── test_core.py
    └── test_api.py
```

Convenzioni diffuse:
- cartella `tests/` al root;
- file che iniziano con `test_`;
- nomi dei test descrittivi e stabili.

Questa organizzazione si integra bene con [[Programmazione/Python/Pagine/Creazione di Package]].

---

##  Cosa rende un test buono

Un buon test e:
- veloce;
- deterministico;
- leggibile;
- focalizzato su un solo comportamento;
- facile da rompere quando il comportamento corretto cambia davvero.

Un cattivo test e:
- fragile;
- dipendente dall'ordine di esecuzione;
- troppo accoppiato all'implementazione interna;
- difficile da capire quando fallisce.

> [!TIP] Regola pratica
> Testa il comportamento osservabile, non ogni dettaglio interno. Se refactoring innocui rompono tutti i test, probabilmente i test sono troppo legati all'implementazione.

---

##  Best Practices & "Gotchas"

-  **Testa prima il codice più critico:** logica di dominio, parsing, validazione, flussi con rischio di regressione.
-  **Mantieni i test piccoli e leggibili:** un test deve spiegare rapidamente cosa sta verificando.
-  **Usa nomi descrittivi:** il nome del test deve chiarire il comportamento atteso.
-  **Copri anche i casi di errore:** non solo il percorso felice.
-  **Integra i test nel workflow quotidiano:** eseguirli spesso e meglio che accumulare rotture.
-  **Non testare dettagli banali senza valore:** aggiunge rumore e costo di manutenzione.
-  **Non creare test dipendenti dal tempo, dalla rete o dall'ordine globale se puoi evitarlo:** diventano flaky.
-  **Attenzione ai mock eccessivi:** possono produrre test verdi su codice che in realta non funziona.
-  **Attenzione alla coverage come metrica assoluta:** alta coverage non garantisce test di qualità.

---
