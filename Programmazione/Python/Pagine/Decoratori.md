---
date: 2026-05-14
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Decoratori]
prerequisites: []
related: []
---
# Decoratori in Python

## Sintesi

Nota su Decoratori in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.

## Concetto chiave
I **decoratori** sono funzioni che "avvolgono" (*wrap*) altre funzioni per modificarne o estenderne il comportamento, senza alterarne direttamente il codice sorgente. Sono un'applicazione pratica delle Higher-order Functions.

---

##  Sintassi
Si utilizza il simbolo `@` seguito dal nome della funzione decoratore sopra la definizione della funzione da decorare (zucchero sintattico).

```python
def mio_decoratore(funzione):
    def wrapper():
        print("Qualcosa prima della funzione.")
        funzione()
        print("Qualcosa dopo la funzione.")
    return wrapper

@mio_decoratore
def saluta():
    print("Ciao!")

saluta()
```

---

##  Esempi Pratici

### Decoratore Universale (`*args`, `**kwargs`)
Per decorare funzioni con un numero variabile di argomenti e preservarne il valore di ritorno.

```python
import functools

def log_chiamata(funzione):
    @functools.wraps(funzione) # Importante per non perdere i metadati (nome, docstring)
    def wrapper(*args, **kwargs):
        print(f"Chiamata a {funzione.__name__} con {args} {kwargs}")
        risultato = funzione(*args, **kwargs)
        return risultato
    return wrapper

@log_chiamata
def somma(a, b):
    return a + b

print(somma(10, 5))
```

### Decoratore con Argomenti (Decorator Factory)
Per passare parametri direttamente al decoratore stesso.

```python
def ripeti(volte):
    def decoratore(funzione):
        @functools.wraps(funzione)
        def wrapper(*args, **kwargs):
            for _ in range(volte):
                risultato = funzione(*args, **kwargs)
            return risultato
        return wrapper
    return decoratore

@ripeti(volte=3)
def bussa():
    print("Knock knock")

bussa()
```

---

##  Funzionamento Interno (Teoria)
- **Closures:** Il decoratore restituisce una funzione interna (`wrapper`) che cattura e mantiene il riferimento alla funzione originale (`funzione`) tramite una closure.
- **`functools.wraps`:** Senza questo decoratore integrato, la funzione decorata perderebbe i suoi metadati originali (es. `__name__` diventerebbe "wrapper").
- **Stacking:** È possibile applicare più decoratori a una singola funzione. L'ordine di applicazione è dall'alto verso il basso (quello più vicino alla funzione viene applicato per primo).

---

##  Best Practices & "Gotchas"
-  **Usa sempre `functools.wraps`:** Fondamentale per il debugging e l'introspezione.
-  **Effetti Collaterali:** Evita di eseguire logica pesante nel corpo del decoratore (fuori dal wrapper) perché viene eseguita al momento dell'importazione del modulo.
-  **Prestazioni:** I decoratori aggiungono un piccolo overhead dovuto alla chiamata della funzione wrapper. In sezioni di codice critiche, valuta se è strettamente necessario.

---
