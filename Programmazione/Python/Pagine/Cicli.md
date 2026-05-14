---
date: 2026-05-14
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Cicli]
prerequisites: []
related: []
---
# Cicli in Python

## Sintesi

Nota su Cicli in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.

## Concetto chiave
I cicli permettono di eseguire ripetutamente un blocco di codice. Python offre due strutture principali: `for` (iterazione su collezioni o sequenze) e `while` (ripetizione basata su una condizione). Una caratteristica peculiare di Python è la clausola `else` applicabile ai cicli.

---

##  Tipologie di Cicli

### 1. Ciclo `for`
Utilizzato per iterare su una sequenza (lista, tupla, stringa) o altri oggetti iterabili.

```python
# Cicli in Python

## Sintesi

Nota su Cicli in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
frutti = ["mela", "banana", "ciliegia"]
for frutto in frutti:
    print(frutto)

# Cicli in Python

## Sintesi

Nota su Cicli in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
for i in range(5): # Da 0 a 4
    print(f"Iterazione {i}")
```

### 2. Ciclo `while`
Esegue il blocco di codice finché la condizione specificata rimane `True`.

```python
contatore = 0
while contatore < 5:
    print(contatore)
    contatore += 1 # Fondamentale aggiornare la condizione
```

---

##  Controllo del Flusso (`break`, `continue`, `pass`)

| Comando | Descrizione |
| :--- | :--- |
| `break` | Interrompe immediatamente il ciclo corrente. |
| `continue` | Salta il resto dell'iterazione corrente e passa alla successiva. |
| `pass` | Operazione nulla, usata come segnaposto sintattico. |

---

## Logic layer: Ciclo `else` ed Enumerazione

### La clausola `else` nei cicli
In Python, un ciclo può avere un blocco `else`. Questo blocco viene eseguito **solo se il ciclo termina naturalmente** (ovvero non viene interrotto da un `break`).

```python
for n in range(2, 10):
    for x in range(2, n):
        if n % x == 0:
            print(f"{n} non è primo")
            break
    else:
        # Eseguito solo se il ciclo interno non ha trovato divisori
        print(f"{n} è un numero primo")
```

### Funzioni Utili: `enumerate()` e `zip()`
- **`enumerate()`**: Restituisce sia l'indice che il valore durante l'iterazione.
- **`zip()`**: Permette di iterare su più collezioni contemporaneamente.

```python
# Cicli in Python

## Sintesi

Nota su Cicli in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
for i, valore in enumerate(["a", "b", "c"]):
    print(f"Indice: {i}, Valore: {valore}")

# Cicli in Python

## Sintesi

Nota su Cicli in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
nomi = ["Alice", "Bob"]
punti = [85, 92]
for nome, punteggio in zip(nomi, punti):
    print(f"{nome}: {punteggio}")
```

---

##  Best Practices
> [!TIP] Pythonic Loops
> Evita di usare `range(len(lista))` per iterare sui valori. Usa direttamente `for elemento in lista:`. Se ti serve l'indice, usa `enumerate()`.

---
