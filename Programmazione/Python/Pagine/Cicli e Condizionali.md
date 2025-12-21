---
tags:
  - programmazione
  - python
  - teoria
argomento: Cicli e Condizionali
data: 2025-12-20
stato: 🟢 completato
---

# Cicli e Condizionali in Python

## 💡 Concetto Chiave
In Python, la struttura del codice è definita dall'**indentazione** (spazi bianchi), non da parentesi graffe.
I cicli sono progettati per operare direttamente su sequenze (iterabili), rendendo il codice molto più leggibile rispetto all'approccio stile C (indice `i`).

---

## 📝 Sintassi

### Condizionali
```python
if condizione:
    # blocco eseguito se True
elif altra_condizione:
    # blocco alternativo
else:
    # blocco di fallback
```

### Cicli
```python
# Ciclo For (su iterabili)
for elemento in sequenza:
    pass

# Ciclo While
while condizione:
    pass
```

---

## 💻 Esempi Pratici

### Esempio 1: If/Elif/Else
In Python non esiste lo `switch` (fino a Python 3.10 con `match`).
```python
x = 10
if x > 10:
    print("Maggiore")
elif x == 10:
    print("Uguale")
else:
    print("Minore")
```

### Esempio 2: For Loop (Iterazione idiomatica)
Non usare `range(len(lista))` se non strettamente necessario.

```python
nomi = ["Anna", "Marco", "Luca"]

# ✅ Pythonic Way
for nome in nomi:
    print(nome)

# Se serve anche l'indice: enumerate()
for i, nome in enumerate(nomi):
    print(f"{i}: {nome}")
```

### Esempio 3: List Comprehension
Un modo conciso e potente per creare nuove liste da iterabili esistenti.

```python
numeri = [1, 2, 3, 4, 5]
quadrati = [n**2 for n in numeri if n % 2 == 0]
# Risultato: [4, 16] (quadrati dei soli numeri pari)
```

---

## ⚙️ Funzionamento Interno

### Protocollo Iteratore
Il ciclo `for` in Python funziona su qualsiasi oggetto che implementi il metodo `__iter__` (o `__getitem__`).
1.  Python chiama `iter(oggetto)` per ottenere un iteratore.
2.  Chiama ripetutamente `next(iteratore)` per avere il valore successivo.
3.  Quando l'iteratore solleva l'eccezione `StopIteration`, il ciclo termina.

### Truthy & Falsy
In Python, ogni oggetto ha un valore booleano intrinseco nei contesti condizionali.
*   **False:** `False`, `None`, `0`, `0.0`, `""` (stringa vuota), `[]`, `{}`, `set()`.
*   **True:** Tutto il resto.

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Usa `enumerate` e `zip`:** Per ciclare con indici o su più liste contemporaneamente.
- ✅ **Comprehensions:** Preferiscile a `map` e `filter` per leggibilità, ma non annidarle troppo (diventano illeggibili).
- 💣 **Modificare liste mentre iteri:** Non rimuovere o aggiungere elementi a una lista *mentre* la stai ciclando con un `for`. Risultati imprevedibili. Crea invece una nuova lista o itera su una copia (`lista[:]`).

## 📚 Riferimenti
- [Python Docs - Control Flow](https://docs.python.org/3/tutorial/controlflow.html)
