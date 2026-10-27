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
aliases:
  - Funzioni
prerequisites: []
related: []
title: Funzioni in Python
---

# Funzioni in Python

## Sintesi

Una funzione associa un nome a un'operazione con parametri, risultato ed eventuali effetti. **Return restituisce un valore; print produce output.** Non sono intercambiabili.

Baseline degli esempi: **CPython 3.12.10**.

## Quando usarlo

Per rendere una trasformazione riconoscibile, riutilizzabile e verificabile. Una funzione dovrebbe dichiarare cosa accetta, cosa restituisce, cosa modifica e quali errori puo sollevare.

## Come funziona

Def crea un oggetto funzione; il corpo viene eseguito alla chiamata. I parametri diventano nomi locali associati agli oggetti passati. Non viene fatta una copia automatica: mutare una lista e visibile al chiamante, riassegnare il parametro non cambia il suo binding.

Una funzione che termina senza return, o usa return senza valore, restituisce None. Restituire a, b produce una tupla, non due canali di ritorno.

## API / Sintassi

```python
def add(a, b):
    return a + b


def greet(name, prefix="Ciao"):
    """Costruisce un saluto, senza stamparlo."""
    return f"{prefix} {name}"


result = add(2, 3)
message = greet(name="Ada", prefix="Buongiorno")
print(result, message)  # 5 Buongiorno Ada
```

Parametri e argomenti non sono sinonimi: i primi compaiono nella definizione, i secondi nella chiamata. Un parametro puo essere fornito per posizione o per nome, salvo vincoli / e \* descritti in Argomenti Flessibili.

### Default valutati alla definizione

Controesempio intenzionale:

```python
def append_bad(value, bucket=[]):
    bucket.append(value)
    return bucket


first_result = append_bad("a")
second_result = append_bad("b")
print(first_result)                 # ['a', 'b']
print(first_result is second_result)  # True
```

Il default e lo stesso oggetto tra chiamate. Il problema riguarda anche dizionari, set e istanze mutabili; una chiamata come datetime.now() nel default fissa il valore al momento della definizione.

Quando None significa "nessuna lista fornita":

```python
def append_item(value, bucket=None):
    if bucket is None:
        bucket = []
    bucket.append(value)
    return bucket


print(append_item("a"))  # ['a']
print(append_item("b"))  # ['b']
```

Questa funzione **muta una lista esplicitamente passata**. Se non vuoi modificare l'input devi copiare secondo il contratto; non usare bucket or [], che sostituirebbe anche una lista vuota fornita dal chiamante.

## Esempio pratico

### Normalizzazione con contratto limitato

```python
def normalize_label(value: str | None) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise TypeError("Label must be text or None")

    cleaned = value.strip()
    return cleaned if cleaned else None


labels = ["  Python  ", "", "   ", None, "Rust"]
normalized = [normalize_label(value) for value in labels]
print(normalized)  # ['Python', None, None, None, 'Rust']
```

Le annotazioni non eseguono il controllo: e isinstance a rifiutare numeri e altri input. Strip rimuove whitespace ai bordi; non normalizza tutta la rappresentazione Unicode, non limita la lunghezza e non rende HTML attendibile.

L'esempio usa etichette, non indirizzi email: trasformare tutta un'email in minuscolo non e una regola universale di validazione. Decidi separatamente formato, equivalenza e verifica della casella.

### Mutazione e riassegnazione del parametro

```python
def touch_then_rebind(values):
    values.append("condiviso")
    values = ["solo locale"]
    return values


original = ["iniziale"]
returned = touch_then_rebind(original)
print(original)  # ['iniziale', 'condiviso']
print(returned)  # ['solo locale']
```

La prima istruzione modifica l'oggetto del chiamante; la seconda cambia solo il nome locale.

## Varianti

- `/` e `*` per parametri positional-only o keyword-only; `*args` e `**kwargs` per raccolta e inoltro.
- Funzioni annidate per racchiudere collaborazioni o stato locale.
- Lambda per una singola espressione semplice, non per comprimere logica complessa.
- Global/nonlocal per riassegnare nomi esterni: non sono necessari per ogni lettura o mutazione di un oggetto esterno.

Esempio di stato racchiuso, distinto per ogni chiamata alla factory:

```python
def make_counter():
    count = 0

    def next_count():
        nonlocal count
        count += 1
        return count

    return next_count


counter = make_counter()
print(counter(), counter())  # 1 2
```

Non e un contatore persistente o una soluzione di sincronizzazione tra thread.

## Errori comuni

- Usare print dove il chiamante si aspetta un valore.
- Mutare un argomento senza documentarlo.
- Condividere involontariamente un default mutabile.
- Pensare che un type hint converta l'input.
- Restituire None in un ramo senza prevederlo nel contratto.
- Aggiungere global per aggirare un'interfaccia poco chiara.

## Checklist

- Input, risultato, errori ed effetti espliciti.
- Default valutati nel momento desiderato.
- Assenza distinta da contenitore vuoto.
- Test con chiamate ripetute e oggetti condivisi.
- Annotazioni coerenti, senza usarle come validazione runtime.

## Collegamenti

- [[Programmazione/Python/Pagine/Argomenti Flessibili|Argomenti Flessibili]]
- [[Programmazione/Python/Pagine/Funzioni Lambda|Funzioni Lambda]]
- [[Programmazione/Python/Pagine/Decoratori|Decoratori]]
- [[Programmazione/Python/Pagine/Type Hinting|Type Hinting]]
- [[Programmazione/Python/Pagine/Error Handling|Error Handling]]

## Fonti

- [Python 3.12: definizione di funzioni e default](https://docs.python.org/3.12/tutorial/controlflow.html#defining-functions).
- [Python 3.12: return e nonlocal](https://docs.python.org/3.12/reference/simple_stmts.html).
- [Python 3.12: modello di esecuzione e scope](https://docs.python.org/3.12/reference/executionmodel.html).
- [Python 3.12: annotazioni non imposte dal runtime](https://docs.python.org/3.12/library/typing.html).

## Navigazione

- [[Programmazione/Python/Indice Python|Indice Python]]
