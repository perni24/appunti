---
date: 2026-05-14
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Sintassi e Variabili]
prerequisites: []
related: []
---
# Sintassi e Variabili in Python

## Sintesi

Nota su Sintassi e Variabili in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.

## Concetto chiave
Python è progettato per la **leggibilità**. A differenza di molti altri linguaggi che usano parentesi graffe `{}` per definire blocchi di codice, Python usa l'**indentazione**. È un linguaggio a **tipizzazione dinamica** e **fortemente tipizzato**, il che significa che il tipo delle variabili viene determinato a runtime e non avvengono conversioni implicite pericolose tra tipi incompatibili.

---

## Sintassi fondamentale

### Indentazione
In Python, lo spazio bianco all'inizio di una riga è significativo. Definisce la gerarchia e i blocchi logici (funzioni, cicli, condizioni).
- **Best Practice (PEP 8):** Usare **4 spazi** per livello di indentazione. Non mischiare tab e spazi.

```python
if True:
    print("Questa riga è indentata e fa parte del blocco if")
print("Questa riga non è indentata ed è fuori dall'if")
```

### Commenti
I commenti sono essenziali per documentare il codice.
- **Commenti a riga singola:** Usano il carattere `#`.
- **Docstrings:** Usano tripli apici `"""` e sono usati per documentare moduli, classi e funzioni.

```python
# Sintassi e Variabili in Python

## Sintesi

Nota su Sintassi e Variabili in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
x = 5  # Commento inline

"""
Questo è un docstring.
Può estendersi su più righe.
"""
```

---

##  Variabili

In Python, le variabili sono **etichette** che puntano a oggetti in memoria. Non è necessario dichiarare il tipo o usare keyword (come `let` o `var`).

### Dichiarazione e Assegnazione
```python
nome = "Luca"      # Stringa
eta = 30           # Intero
altezza = 1.75     # Float
is_active = True   # Booleano

# Sintassi e Variabili in Python

## Sintesi

Nota su Sintassi e Variabili in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
a, b, c = 1, 2, 3
x = y = z = 0
```

### Naming Conventions (PEP 8)
- Usa lo **snake_case** (tutto minuscolo con underscore) per variabili e funzioni: `mia_variabile`, `calcola_prezzo()`.
- I nomi sono **case-sensitive**: `Valore` e `valore` sono due variabili diverse.
- Non possono iniziare con un numero.

---

##  Tipi di Dati Primitivi

> [!INFO] Definizione: Tipizzazione Dinamica
> Significa che una variabile può cambiare "tipo" durante l'esecuzione semplicemente assegnandole un nuovo valore di tipo diverso.

| Tipo | Descrizione | Esempio |
| :--- | :--- | :--- |
| `int` | Numeri interi (senza limite di dimensione in Python 3) | `10`, `-5` |
| `float` | Numeri decimali (virgola mobile) | `3.14`, `2.0` |
| `str` | Stringhe di caratteri (sequenze immutabili) | `"Ciao"`, `'Python'` |
| `bool` | Valori booleani | `True`, `False` |
| `NoneType` | Rappresenta l'assenza di valore | `None` |

---

##  Conversione di Tipo (Casting)
È possibile convertire esplicitamente un dato da un tipo all'altro utilizzando le funzioni costruttore:

```python
voto_str = "28"
voto_int = int(voto_str)     # Da stringa a intero
prezzo = float(10)           # Da intero a float (10.0)
messaggio = "Anni: " + str(30) # Da intero a stringa per concatenazione
```

---

## Logic layer: Come funziona la memoria?
In Python, **tutto è un oggetto**. Quando scrivi `x = 5`:
1. Viene creato un oggetto di tipo `int` con valore `5` in memoria.
2. La variabile `x` diventa un riferimento (puntatore) a quell'oggetto.
3. Se scrivi `y = x`, anche `y` punta allo stesso oggetto `5`.

Questo comportamento è fondamentale per capire come vengono passati i dati alle funzioni (pass-by-object-reference).

---
