---
date: 2026-03-19
tags:
  - programmazione
  - python
  - teoria
type: #permanent-note
status: in_elaborazione
---

# Higher-order Functions (HOF) in Python

## 💡 Concetto Chiave
In Python, le funzioni sono **oggetti di prima classe** (*first-class citizens*). Questo significa che possono essere passate come argomenti ad altre funzioni, restituite da funzioni e assegnate a variabili. Una **Higher-order Function** è una funzione che soddisfa almeno una di queste condizioni:
1. Accetta una o più funzioni come parametri.
2. Restituisce una funzione come risultato.

---

## 📝 Sintassi ed Esempi Fondamentali

### 1. Funzioni come Argomenti
L'esempio più comune è l'uso di callback o trasformazioni.

```python
def applica_operazione(lista, funzione):
    return [funzione(x) for x in lista]

numeri = [1, 2, 3, 4]
raddoppia = lambda x: x * 2

print(applica_operazione(numeri, raddoppia)) # Output: [2, 4, 6, 8]
```

### 2. Restituire Funzioni (Factory Functions)
Utilizzato spesso per creare configurazioni o closure.

```python
def crea_moltiplicatore(n):
    def moltiplica(x):
        return x * n
    return moltiplica

triplica = crea_moltiplicatore(3)
print(triplica(10)) # Output: 30
```

---

## 💻 HOF Integrate nel Linguaggio

### Map, Filter e Reduce
Python offre diverse HOF integrate (anche se spesso sostituibili dalle *List Comprehensions*).

```python
from functools import reduce

nomi = ["anna", "luca", "marco"]
numeri = [1, 2, 3, 4, 5]

# map: trasforma ogni elemento
maiuscoli = list(map(str.upper, nomi))

# filter: tiene solo gli elementi che soddisfano una condizione
dispari = list(filter(lambda x: x % 2 != 0, numeri))

# reduce: aggrega gli elementi in un unico valore
somma_totale = reduce(lambda x, y: x + y, numeri) # 15
```

---

## ⚙️ Funzionamento Interno (Teoria)
- **Modularià:** Le HOF permettono di separare la *logica di iterazione* dalla *logica di elaborazione*.
- **Closures:** Quando una funzione restituisce un'altra funzione, quest'ultima "ricorda" lo scope in cui è stata creata (le variabili locali della funzione esterna).
- **Functools:** Il modulo `functools` contiene utility avanzate per HOF, come `partial` (per fissare alcuni argomenti di una funzione) e `lru_cache` (per la memoizzazione).

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Composizione:** Usa le HOF per scrivere codice più generico e riutilizzabile.
- ❌ **Eccesso di Astrazione:** Non creare HOF troppo nidificate; possono rendere il debugging e la lettura del codice molto difficili.
- 💡 **Preferenza Pythonica:** Per `map` e `filter` semplici, in Python è spesso considerata più leggibile una **List Comprehension**:
  - `[x**2 for x in lista]` è preferito a `list(map(lambda x: x**2, lista))`.

---