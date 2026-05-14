---
date: 2026-05-14
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Ereditarietà]
prerequisites: []
related: []
---
# Ereditarietà in Python

## Sintesi

Nota su Ereditarietà in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.

## Concetto chiave
L'**Ereditarietà** permette a una classe (classe **figlia** o sottoclasse) di derivare attributi e metodi da un'altra classe (classe **padre** o superclasse).

Questo meccanismo favorisce il **riutilizzo del codice** e permette di creare gerarchie logiche tra gli oggetti, modellando relazioni del tipo "is-a" (un Gatto *è un* Animale).

---

##  Sintassi e Definizione
Per far ereditare una classe, basta inserire il nome della superclasse tra parentesi dopo il nome della sottoclasse.

```python
class SuperClasse:
    pass

class SottoClasse(SuperClasse):
    pass
```

### Funzione `super()`
La funzione `super()` viene utilizzata per accedere ai metodi della classe padre, specialmente all'interno del costruttore `__init__`, per assicurarsi che l'inizializzazione della classe base venga eseguita correttamente.

---

##  Esempi Pratici

### Esempio Base: Animali e Cani
```python
class Animale:
    def __init__(self, nome):
        self.nome = nome

    def mangia(self):
        print(f"{self.nome} sta mangiando...")

class Cane(Animale):
    def __init__(self, nome, razza):
        # Chiama il costruttore della classe padre (Animale)
        super().__init__(nome)
        self.razza = razza

    def abbaia(self):
        print("Bau bau!")

fido = Cane("Fido", "Pastore Tedesco")
fido.mangia()  # Metodo ereditato da Animale
fido.abbaia()  # Metodo specifico di Cane
```

### Overriding (Sovrascrittura) dei Metodi
Una sottoclasse può ridefinire un metodo della classe padre per adattarlo alle sue esigenze.

```python
class Uccello(Animale):
    def mangia(self):
        print(f"{self.nome} becca i semi.")

uccellino = Uccello("Cip")
uccellino.mangia() # Output: Cip becca i semi.
```

---

## Logic layer: Concetti Avanzati

### 1. Ereditarietà Multipla
Python supporta l'ereditarietà multipla, dove una classe può derivare da più classi base.
```python
class Terrestre:
    pass

class Acquatico:
    pass

class Anfibio(Terrestre, Acquatico):
    pass
```

### 2. MRO (Method Resolution Order)
Quando Python cerca un metodo o un attributo, segue un ordine preciso chiamato **MRO**. Puoi visualizzarlo usando l'attributo `__mro__` o la funzione `help()`. Python utilizza l'algoritmo **C3 Linearization** per risolvere i conflitti in caso di ereditarietà multipla (es. il "problema del diamante").

### 3. `isinstance()` e `issubclass()`
- `isinstance(obj, Class)`: Controlla se un oggetto è un'istanza di una classe o di una sua sottoclasse.
- `issubclass(ClassA, ClassB)`: Controlla se `ClassA` è una sottoclasse di `ClassB`.

---

##  Best Practices & "Gotchas"

-  **Da fare**: Usa sempre `super().__init__()` nelle sottoclassi per garantire una corretta inizializzazione.
-  **Da fare**: Favorisci la composizione rispetto all'ereditarietà se la relazione non è strettamente "is-a".
-  **Da evitare**: Evita gerarchie di ereditarietà troppo profonde (difficili da mantenere).
-  **Da evitare**: Usa l'ereditarietà multipla con estrema cautela; può rendere il flusso del codice molto complesso da seguire.
-  **Errore comune**: Dimenticare di chiamare il costruttore della superclasse, lasciando gli attributi base non inizializzati.
-  **Attenzione**: In Python 3, tutte le classi ereditano implicitamente da `object`.

```python
# Ereditarietà in Python

## Sintesi

Nota su Ereditarietà in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
print(Cane.mro())
```
