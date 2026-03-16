---
date: 2026-03-16
tags:
  - programmazione
  - python
  - oop
type: #permanent-note
status: evergreen
---

# Metodi Speciali (Dunder Methods)

## 💡 Concetto Chiave
I **Metodi Speciali** (anche chiamati **Magic Methods** o **Dunder Methods**, da *Double Underscore*) sono metodi predefiniti in Python che iniziano e finiscono con un doppio trattino basso, come `__init__`.

Permettono di implementare l'**Overloading degli Operatori** e di definire come gli oggetti della nostra classe devono comportarsi con le funzioni built-in di Python (es. `len()`, `print()`, `+`, `==`).

---

## 📝 Sintassi e Categorie Principali
Non vengono quasi mai chiamati direttamente (`obj.__init__()`), ma vengono invocati implicitamente da Python.

### 1. Inizializzazione e Rappresentazione
- `__init__(self, ...)`: Il costruttore (inizializzazione).
- `__str__(self)`: Ritorna una stringa "user-friendly" (usata da `print()` e `str()`).
- `__repr__(self)`: Ritorna una stringa "developer-friendly", utile per il debugging (rappresentazione ufficiale).

### 2. Operazioni Matematiche
- `__add__(self, other)`: Comportamento per l'operatore `+`.
- `__sub__(self, other)`: Comportamento per l'operatore `-`.
- `__mul__(self, other)`: Comportamento per l'operatore `*`.

### 3. Confronti
- `__eq__(self, other)`: Uguale a (`==`).
- `__lt__(self, other)`: Minore di (`<`).
- `__gt__(self, other)`: Maggiore di (`>`).

---

## 💻 Esempi Pratici

### Esempio Base: Rappresentazione e Lunghezza
```python
class Libro:
    def __init__(self, titolo, autore, pagine):
        self.titolo = titolo
        self.autore = autore
        self.pagine = pagine

    def __str__(self):
        return f"'{self.titolo}' di {self.autore}"

    def __len__(self):
        return self.pagine

libro = Libro("Il Signore degli Anelli", "J.R.R. Tolkien", 1200)
print(libro)        # Chiama __str__ -> 'Il Signore degli Anelli' di J.R.R. Tolkien
print(len(libro))   # Chiama __len__ -> 1200
```

### Esempio Avanzato: Overloading degli Operatori (Vettori)
```python
class Vettore:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __add__(self, altro):
        # Definisce cosa succede quando facciamo v1 + v2
        return Vettore(self.x + altro.x, self.y + altro.y)

    def __repr__(self):
        return f"Vettore({self.x}, {self.y})"

v1 = Vettore(2, 4)
v2 = Vettore(5, -2)
v3 = v1 + v2
print(v3) # Output: Vettore(7, 2)
```

---

## ⚙️ Funzionamento Interno (Teoria)
Python mappa le funzioni globali e gli operatori ai relativi metodi dunder:
- `len(x)` $\rightarrow$ `x.__len__()`
- `x + y` $\rightarrow$ `x.__add__(y)`
- `str(x)` $\rightarrow$ `x.__str__()` (se non presente, ripiega su `__repr__`)

**Fallback**: Se un metodo non è definito (es. `__add__`), Python solleverà un `TypeError` a meno che l'operazione non sia definita per i tipi coinvolti in altro modo.

---

## ⚠️ Best Practices & "Gotchas"

- ✅ **Da fare**: Implementa `__repr__` sempre; `__str__` è opzionale ma consigliato per classi rivolte all'utente finale.
- ✅ **Da fare**: In `__repr__`, cerca di restituire una stringa che sembri il codice necessario per ricreare l'oggetto.
- ❌ **Da evitare**: Non inventare dunder methods personalizzati (es. `__mio_metodo__`). Riservali solo a quelli definiti dal linguaggio.
- 💣 **Errore comune**: Dimenticare di ritornare un valore nei metodi `__str__` o `__repr__` (devono sempre ritornare una stringa).
- 💣 **Attenzione**: Quando implementi operatori matematici, assicurati di gestire il caso in cui `other` sia di un tipo diverso da quello aspettato.

```python
def __add__(self, other):
    if not isinstance(other, Vettore):
        return NotImplemented # Permette a Python di provare altre strade
    return Vettore(self.x + other.x, self.y + other.y)
```