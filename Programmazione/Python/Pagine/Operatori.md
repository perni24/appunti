---
date: 2026-05-14
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Operatori]
prerequisites: []
related: []
---
# Operatori in Python

## Sintesi

Nota su Operatori in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.

## Concetto chiave
Gli operatori sono simboli speciali che eseguono operazioni su variabili e valori. Python offre una vasta gamma di operatori, dai classici aritmetici a quelli più specifici per il confronto di identità e l'appartenenza.

---

##  Tipologie di Operatori

### 1. Operatori Aritmetici
Usati per eseguire operazioni matematiche comuni.

| Operatore | Nome | Esempio | Risultato (con `a=10, b=3`) |
| :--- | :--- | :--- | :--- |
| `+` | Addizione | `a + b` | `13` |
| `-` | Sottrazione | `a - b` | `7` |
| `*` | Moltiplicazione | `a * b` | `30` |
| `/` | Divisione | `a / b` | `3.333...` (sempre float) |
| `%` | Modulo | `a % b` | `1` (resto della divisione) |
| `**` | Elevamento a potenza | `a ** b` | `1000` |
| `//` | Divisione intera | `a // b` | `3` (tronca il decimale) |

### 2. Operatori di Confronto
Restituiscono sempre un valore booleano (`True` o `False`).

| Operatore | Nome | Esempio |
| :--- | :--- | :--- |
| `==` | Uguale a | `x == y` |
| `!=` | Diverso da | `x != y` |
| `>` | Maggiore di | `x > y` |
| `<` | Minore di | `x < y` |
| `>=` | Maggiore o uguale | `x >= y` |
| `<=` | Minore o uguale | `x <= y` |

### 3. Operatori Logici
Usati per combinare istruzioni condizionali.

- `and`: Restituisce `True` se entrambe le istruzioni sono vere.
- `or`: Restituisce `True` se almeno una delle istruzioni è vera.
- `not`: Inverte il risultato booleano.

```python
x = 5
print(x > 3 and x < 10) # True
```

### 4. Operatori di Identità e Appartenenza (Pythonic)
Questi operatori sono molto comuni in Python per la loro leggibilità.

- **`is` / `is not`**: Controllano se due variabili puntano allo **stesso oggetto** in memoria (non solo se hanno lo stesso valore).
- **`in` / `not in`**: Controllano se una sequenza (stringa, lista, tupla) è presente in un oggetto.

```python
# Operatori in Python

## Sintesi

Nota su Operatori in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
frutta = ["mela", "banana"]
print("mela" in frutta) # True

# Operatori in Python

## Sintesi

Nota su Operatori in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
a = [1, 2]
b = [1, 2]
c = a
print(a == b) # True (valore uguale)
print(a is b) # False (oggetti diversi in memoria)
print(a is c) # True (stesso oggetto)
```

---

## Logic layer: Precedenza degli Operatori
Python segue l'ordine matematico standard (PEMDAS), ma è importante ricordare la gerarchia quando si mescolano tipi diversi:

1.  Parentesi `()`
2.  Elevamento a potenza `**`
3.  Moltiplicazione, Divisione, Modulo `* / // %`
4.  Addizione e Sottrazione `+ -`
5.  Operatori di confronto e appartenenza `== != > < in is`
6.  Operatori logici `not > and > or`

---

##  Best Practices
> [!TIP] Leggibilità
> Anche se la precedenza è chiara per l'interprete, usa le **parentesi** per rendere il codice più leggibile ai programmatori umani. 
> Esempio: `(a and b) or c` è meglio di `a and b or c`.

---
