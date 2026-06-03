---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Funzioni]
prerequisites: []
related: []
---

# Funzioni in Python

## Sintesi

Le funzioni incapsulano logica riutilizzabile. Ricevono argomenti, possono restituire valori e rendono il codice piu leggibile e testabile.

## Quando usarlo

Usale quando una logica viene ripetuta, quando vuoi dare un nome a un'operazione o quando devi isolare codice per test e manutenzione.

## Come funziona

Una funzione viene definita con `def`. I parametri ricevono valori al momento della chiamata. `return` restituisce un valore e termina la funzione. Se manca `return`, il risultato e `None`.

Python passa riferimenti a oggetti: se una funzione modifica un oggetto mutabile ricevuto, la modifica e visibile anche fuori.

## API / Sintassi

```python
def add(a, b):
    return a + b

result = add(2, 3)
```

Argomenti default:

```python
def greet(name, prefix="Ciao"):
    return f"{prefix} {name}"
```

Keyword arguments:

```python
greet(name="Luca", prefix="Buongiorno")
```

## Esempio pratico

```python
def normalize_email(email):
    if not email:
        return None
    return email.strip().lower()


emails = [" A@Example.com ", "", "b@example.com"]
cleaned = [normalize_email(email) for email in emails]
```

## Varianti

- Funzioni con argomenti posizionali.
- Keyword arguments.
- Valori di default.
- `*args` e `**kwargs`.
- Parametri keyword-only.
- Funzioni lambda.
- Funzioni annidate.

## Errori comuni

- Usare liste o dizionari come default mutabili.
- Fare funzioni troppo lunghe.
- Restituire tipi incoerenti senza motivo.
- Modificare argomenti mutabili in modo inatteso.
- Usare `global` invece di restituire valori.

## Checklist

- La funzione ha una responsabilita chiara?
- Il nome descrive il risultato o l'azione?
- I parametri sono pochi e leggibili?
- I default sono immutabili?
- Il valore di ritorno e coerente?

## Collegamenti

- [[Programmazione/Python/Pagine/Argomenti Flessibili|Argomenti Flessibili]]
- [[Programmazione/Python/Pagine/Funzioni Lambda|Funzioni Lambda]]
- [[Programmazione/Python/Pagine/Decoratori|Decoratori]]
