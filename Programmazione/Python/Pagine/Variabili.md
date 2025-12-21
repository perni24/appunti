---
tags:
  - programmazione
  - python
  - teoria
argomento: Variabili e Tipi di Dati
data: 2025-12-20
stato: 🟢 completato
---

# Variabili e Tipi di Dati in Python

## 💡 Concetto Chiave
Python è un linguaggio a **tipizzazione dinamica e forte**.
*   **Dinamica:** Non devi dichiarare il tipo della variabile; viene inferito a runtime.
*   **Forte:** Non fa conversioni implicite rischiose (es. `1 + "2"` da errore).
In Python, le variabili sono **etichette** (riferimenti) che puntano a oggetti in memoria. **Tutto è un oggetto**.

---

## 📝 Sintassi

```python
# Assegnazione semplice
x = 5
nome = "Mario"

# Type Hints (Python 3.5+)
# Non forzano il tipo a runtime, ma aiutano editor e linter (es. mypy)
eta: int = 25
attivo: bool = True

# Assegnazione multipla
x, y, z = 1, 2, 3
```

---

## 💻 Esempi Pratici

### Esempio Base
```python
x = 10
print(type(x)) # <class 'int'>

x = "ciao"     # È lecito cambiare tipo alla stessa variabile
print(type(x)) # <class 'str'>
```

### Esempio Avanzato: Mutabilità
Capire la differenza tra tipi mutabili e immutabili è vitale.

```python
# Le LISTE sono Mutabili
lista_a = [1, 2, 3]
lista_b = lista_a  # lista_b punta allo STESSO oggetto di lista_a
lista_b.append(4)
print(lista_a)     # Output: [1, 2, 3, 4] (Anche lista_a è cambiata!)

# Gli INTERI sono Immutabili
a = 5
b = a
b = 6              # Crea un NUOVO oggetto intero 6, a resta 5
print(a)           # Output: 5
```

---

## ⚙️ Funzionamento Interno

### Riferimenti e Oggetti (PyObject)
In C (o Rust) una variabile è una scatola che contiene un valore. In Python, una variabile è un **nome** che punta a un oggetto (PyObject) allocato nell'Heap.
Quando scrivi `x = x + 1`, Python non modifica il numero dentro `x`; crea un *nuovo* oggetto con il nuovo valore e sposta l'etichetta `x` su di esso.

### Garbage Collection
Python usa principalmente il **Reference Counting**: ogni oggetto tiene il conto di quante variabili puntano a lui. Quando il contatore arriva a zero, l'oggetto viene deallocato immediatamente. Esiste anche un Garbage Collector ciclico per ripulire riferimenti circolari.

---

## 🧩 Tipi di Dati Principali

### Tipi Immutabili
Una volta creati, il loro contenuto non può cambiare.
*   **int:** Interi a precisione arbitraria (non vanno in overflow).
*   **float:** Numeri decimali (standard IEEE 754).
*   **bool:** `True` / `False`.
*   **str:** Stringhe Unicode.
*   **tuple:** Sequenze ordinate immutabili `(1, 2, 3)`.

### Tipi Mutabili
Il contenuto può essere modificato *in-place*.
*   **list:** Sequenze ordinate dinamiche `[1, 2, "a"]`.
*   **dict:** Mappe chiave-valore (Hash Map) `{"k": "v"}`. Ordinate per inserimento (da Py 3.7+).
*   **set:** Insieme di elementi unici non ordinati `{1, 2, 3}`.

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Usa Type Hints:** Anche se opzionali, rendono il codice moderno leggibile. `def fn(a: int) -> str:`
- ✅ **Snake Case:** Convenzione standard per le variabili (`nome_variabile`).
- 💣 **Mutable Default Arguments:** Mai usare una lista o dizionario vuoto come default in una funzione.
    ```python
    # ❌ SBAGLIATO: la lista è creata una volta sola alla definizione!
    def add(item, lista=[]): ... 
    
    # ✅ GIUSTO
    def add(item, lista=None):
        if lista is None: lista = []
    ```

## 📚 Riferimenti
- [Python Documentation - Data Model](https://docs.python.org/3/reference/datamodel.html)
- [PEP 484 - Type Hints](https://peps.python.org/pep-0484/)
