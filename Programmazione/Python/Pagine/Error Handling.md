---
date: 2026-06-03
area: Programmazione
topic: Python
type: theory-note
status: "non revisionato"
difficulty: beginner
tags: [python, programming, errors]
aliases: [Error Handling, Gestione delle Eccezioni]
prerequisites: []
related: []
---

# Error Handling in Python

## Sintesi

L'error handling e il modo in cui Python rappresenta, propaga e gestisce condizioni anomale durante l'esecuzione. Le eccezioni permettono di separare il flusso principale del programma dai casi di errore, mantenendo il codice leggibile.

Python incoraggia spesso lo stile **EAFP**: prova a fare l'operazione e gestisci l'eccezione se fallisce.

## Quando usarlo

Usa la gestione delle eccezioni quando:

- un errore e possibile ma non rappresenta necessariamente un bug;
- devi validare input esterni;
- lavori con file, rete, database o API;
- devi aggiungere contesto prima di propagare un errore;
- devi garantire cleanup di risorse.

## Come funziona

La struttura base e `try`/`except`.

```python
try:
    number = int("42")
except ValueError:
    print("Valore non valido")
```

Puoi aggiungere:

- `else`: eseguito solo se non ci sono eccezioni;
- `finally`: eseguito sempre, utile per cleanup;
- `raise`: solleva o rilancia un'eccezione.

```python
try:
    result = 10 / 2
except ZeroDivisionError:
    print("Divisione per zero")
else:
    print(f"Risultato: {result}")
finally:
    print("Fine operazione")
```

## API / Sintassi

Catturare eccezioni specifiche:

```python
try:
    value = int(user_input)
except ValueError as error:
    print(f"Input non valido: {error}")
```

Sollevare un'eccezione:

```python
def set_age(age):
    if age < 0:
        raise ValueError("age must be greater than or equal to zero")
    return age
```

Creare un'eccezione custom:

```python
class ConfigurationError(Exception):
    pass
```

Concatenare eccezioni:

```python
try:
    port = int(config["port"])
except KeyError as error:
    raise ConfigurationError("Missing port configuration") from error
```

## Esempio pratico

Validazione di configurazione letta da un dizionario.

```python
class InvalidConfigError(Exception):
    pass


def read_timeout(config):
    try:
        timeout = int(config["timeout"])
    except KeyError as error:
        raise InvalidConfigError("Missing timeout") from error
    except ValueError as error:
        raise InvalidConfigError("Timeout must be an integer") from error

    if timeout <= 0:
        raise InvalidConfigError("Timeout must be positive")

    return timeout
```

Il chiamante vede un errore di dominio (`InvalidConfigError`), ma la causa originale resta disponibile tramite exception chaining.

## Varianti

- **EAFP**: tenta l'operazione e gestisci l'eccezione.
- **LBYL**: controlla prima se l'operazione e possibile.
- **Eccezioni custom**: rendono espliciti gli errori del dominio applicativo.
- **Exception chaining**: preserva la causa originale con `raise ... from error`.
- **`finally`**: garantisce cleanup, anche se spesso `with` e piu adatto.

```python
try:
    with open("data.txt", encoding="utf-8") as file:
        content = file.read()
except FileNotFoundError:
    content = ""
```

## Errori comuni

- Usare `except:` senza specificare il tipo di errore.
- Catturare `Exception` troppo in alto e nascondere bug.
- Ignorare l'eccezione con `pass` senza log o gestione reale.
- Usare eccezioni per controllare flussi normali e frequenti.
- Perdere la causa originale quando si rilancia un errore.
- Mescolare troppi casi diversi nello stesso blocco `try`.

## Checklist

- Sto catturando l'eccezione piu specifica possibile?
- L'errore viene gestito davvero o solo nascosto?
- Il messaggio contiene contesto utile?
- Serve una eccezione custom di dominio?
- Le risorse vengono chiuse con `with` o `finally`?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Context Managers]]
- [[Gestione File]]
- [[Logging]]
- [[Testing]]
