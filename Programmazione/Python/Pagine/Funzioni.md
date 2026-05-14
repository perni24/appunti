---
date: 2026-05-14
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

Nota su Funzioni in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.

## Concetto chiave
Le funzioni sono blocchi di codice riutilizzabili che eseguono una specifica operazione. Permettono di ridurre la duplicazione del codice e migliorano la leggibilità e la manutenibilità del progetto seguendo il principio **DRY** (Don't Repeat Yourself).

---

##  Definizione e Sintassi
In Python, una funzione si definisce con la keyword `def`.

```python
def saluta(nome):
    """Questa funzione saluta la persona passata come argomento."""
    print(f"Ciao, {nome}!")

saluta("Luca")
```

### Docstrings
La prima stringa dopo l'intestazione della funzione è il **Docstring**. Descrive cosa fa la funzione ed è accessibile tramite `help(nome_funzione)` o l'attributo `__doc__`.

---

##  Argomenti e Parametri

Python offre una grande flessibilità nel modo in cui vengono passati i dati alle funzioni.

### 1. Argomenti Posizionali e Keyword
- **Posizionali**: L'ordine è fondamentale.
- **Keyword**: È possibile specificare il nome del parametro per ignorare l'ordine.

```python
def descrivi_pet(tipo, nome):
    print(f"Ho un {tipo} di nome {nome}")

descrivi_pet("gatto", "Whiskers") # Posizionale
descrivi_pet(nome="Fido", tipo="cane") # Keyword
```

### 2. Valori di Default
È possibile assegnare un valore predefinito a un parametro. Se non viene passato nulla durante la chiamata, verrà usato quello.

```python
def saluta_utente(nome, saluto="Buongiorno"):
    print(f"{saluto}, {nome}")

saluta_utente("Marco") # Output: Buongiorno, Marco
```

> [!CAUTION] Attenzione agli oggetti mutabili
> Non usare mai oggetti mutabili (come liste o dizionari) come valori di default. Python li crea una sola volta alla definizione della funzione, il che può portare a comportamenti inattesi. Usa `None` e un controllo interno.

---

## ↩ Valori di Ritorno
La keyword `return` interrompe l'esecuzione della funzione e restituisce un valore al chiamante. Se omessa, la funzione restituisce implicitamente `None`.

```python
def somma(a, b):
    return a + b

risultato = somma(5, 3) # risultato = 8
```

---

## Logic layer: Passaggio dei Parametri
In Python, il passaggio dei parametri avviene per **assegnazione di riferimento** (Pass-by-object-assignment).
- Se passi un oggetto **immutabile** (come una stringa o un intero), la funzione non può modificarlo esternamente.
- Se passi un oggetto **mutabile** (come una lista), la funzione può modificarne il contenuto direttamente, influenzando l'originale in memoria.

---

##  Scope (Ambito delle Variabili)
- **Local Scope**: Variabili definite all'interno della funzione. Esistono solo lì.
- **Global Scope**: Variabili definite all'esterno, accessibili ma non modificabili direttamente (a meno di usare la keyword `global`, solitamente sconsigliata).

---
