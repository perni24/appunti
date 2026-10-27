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
  - functions
aliases:
  - Argomenti Flessibili
  - args e kwargs
  - "*args e **kwargs"
prerequisites: []
related: []
title: Argomenti Flessibili in Python
---

# Argomenti Flessibili in Python

## Sintesi

Nella definizione, `*args` raccoglie argomenti posizionali extra in una tupla e `**kwargs` quelli nominati in un dizionario. Nella chiamata, `*` e `**` espandono rispettivamente un iterabile e un mapping.

I nomi args e kwargs sono convenzioni; il significato viene dagli asterischi.

Baseline: **CPython 3.12.10**.

## Quando usarlo

Per wrapper e decoratori che inoltrano argomenti, oppure per un numero realmente variabile di valori. Una firma esplicita resta preferibile se le opzioni sono note: `**kwargs` non deve servire a ignorare errori di battitura.

## Come funziona

```python
def sum_all(*numbers):
    return sum(numbers)


def create_profile(name, **extra):
    return {"name": name, "metadata": extra}


print(sum_all(10, 20, 30))  # 60
print(create_profile("Ada", language="it"))
# {'name': 'Ada', 'metadata': {'language': 'it'}}
```

La firma raccoglie i valori ma non ne verifica significato o tipo. Metadata e un contenitore dimostrativo, non una sorgente di permessi. I riferimenti agli oggetti annidati rimangono condivisi: non sono copie profonde.

## API / Sintassi

### Ordine e ruolo dei parametri

```python
def describe(prefix, /, name, *labels, uppercase=False, **metadata):
    text = f"{prefix} {name}"
    return {
        "text": text.upper() if uppercase else text,
        "labels": labels,
        "metadata": metadata,
    }


description = describe(
    "Ciao", "Ada", "python", "appunti",
    uppercase=True, language="it",
)
print(description["text"])  # CIAO ADA
```

- prefix precede /: deve essere passato per posizione.
- name puo essere posizionale o nominato.
- labels raccoglie i posizionali rimanenti.
- uppercase segue \*labels: e keyword-only.
- metadata raccoglie le altre keyword.

Per imporre keyword-only senza accettare posizionali extra usa \* da solo:

```python
def create_user(name, *, active=True):
    return {"name": name, "active": active}


print(create_user("Ada", active=False))
```

E una costruzione di dati in memoria: non crea account, non salva nulla e non valida automaticamente il booleano.

### Unpacking in chiamata

```python
def multiply(a, b, c):
    return a * b * c


numbers = [2, 3, 4]
print(multiply(*numbers))  # 24


def format_address(host, port):
    return f"{host}:{port}"


options = {"host": "localhost", "port": 8000}
print(format_address(**options))  # localhost:8000
```

`format_address` costruisce testo, non apre una connessione. `*` accetta anche un generatore, consumandolo; `**` richiede un mapping con chiavi stringa. Il numero degli argomenti e i nomi devono rispettare la firma di destinazione.

Fornire due volte lo stesso argomento causa TypeError. Esempio intenzionalmente errato, da non unire al demo:

```text
format_address("localhost", host="other", port=8000)
```

Una fusione di dizionari e diversa: in `{**defaults, **overrides}` vince l'ultima chiave. In `f(**first, **second)`, una keyword duplicata genera errore, non un override.

## Esempio pratico

Wrapper per **normali funzioni sincrone**. Inoltra gli argomenti e conserva il risultato; non registra valori potenzialmente sensibili.

```python
from functools import wraps


def log_call(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        print(f"Calling {function.__name__}")
        return function(*args, **kwargs)

    return wrapper


@log_call
def add(a, b):
    """Somma i due valori ricevuti."""
    return a + b


print(add(2, b=3))
# Calling add
# 5
```

`wraps` conserva metadati utili e aggiunge `__wrapped__`; non trasforma il wrapper in una funzione con controlli di tipo o validazione aggiuntivi. Gli errori della chiamata interna si propagano.

La frase "funziona con qualunque firma" non significa "qualunque comportamento": un wrapper sincrono non attende una coroutine e, con un generatore, osserva la creazione dell'iteratore, non l'esecuzione dei suoi elementi. Decoratori async o per generatori richiedono una progettazione dedicata.

## Varianti

- Positional-only per parametri il cui nome non deve essere parte della chiamata pubblica.
- Keyword-only per opzioni leggibili e difficili da invertire.
- Un parametro positional-only puo avere lo stesso nome di una chiave raccolta in kwargs: sono canali diversi.
- Per wrapper tipizzati, ParamSpec puo preservare il rapporto tra parametri e risultato per il checker; non aggiunge controlli runtime.

## Errori comuni

- Nascondere opzioni sconosciute dentro kwargs senza segnalarle.
- Credere che `**` converta chiavi numeriche in stringhe.
- Duplicare argomenti tra posizione, keyword e mapping.
- Espandere un iteratore senza considerare che viene consumato.
- Perdere return, errori o semantica async nel wrapper.
- Confondere raccolta degli argomenti con validazione dei dati.

## Checklist

- Firma esplicita dove possibile.
- Positional-only e keyword-only intenzionali.
- Extra accettati, rifiutati o inoltrati secondo un contratto chiaro.
- Nessuna keyword duplicata.
- Risultato, errori e natura sync/async preservati.

## Collegamenti

- [[Programmazione/Python/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Python/Pagine/Decoratori|Decoratori]]
- [[Programmazione/Python/Pagine/Higher-order Functions|Higher-order Functions]]
- [[Programmazione/Python/Pagine/Type Hinting|Type Hinting]]
- [[Programmazione/Python/Pagine/Generatori|Generatori]]

## Fonti

- [Python 3.12: parametri speciali e unpacking](https://docs.python.org/3.12/tutorial/controlflow.html#more-on-defining-functions).
- [Python 3.12: regole delle chiamate](https://docs.python.org/3.12/reference/expressions.html#calls).
- [Python 3.12: functools.wraps](https://docs.python.org/3.12/library/functools.html#functools.wraps).

## Navigazione

- [[Programmazione/Python/Indice Python|Indice Python]]
