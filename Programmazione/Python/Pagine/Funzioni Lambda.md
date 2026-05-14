---
date: 2026-05-14
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Funzioni Lambda]
prerequisites: []
related: []
---
# Funzioni Lambda in Python

## Sintesi

Nota su Funzioni Lambda in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.

## Concetto chiave
Le **funzioni lambda** (o funzioni anonime) sono piccole funzioni ad una riga definite senza un nome. Sono ideali per operazioni brevi e "usa e getta", dove definire una funzione completa con `def` risulterebbe eccessivamente verboso.

---

##  Sintassi
In Python, una funzione lambda si definisce con la keyword `lambda`.

```python
lambda argomenti: espressione
```

- Possono accettare un numero qualsiasi di argomenti.
- Possono contenere **solo una singola espressione** (non statement come `if`, `for` o `return` espliciti).
- Restituiscono automaticamente il risultato dell'espressione.

---

##  Esempi Pratici

### Esempio Base
```python
# Funzioni Lambda in Python

## Sintesi

Nota su Funzioni Lambda in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
somma = lambda x, y: x + y

print(somma(5, 3)) # Output: 8
```

### Ordinamento Personalizzato (Uso tipico)
Le lambda sono estremamente utili come argomenti per funzioni come `sorted()`, `min()`, `max()`.

```python
coppie = [(1, 'uno'), (3, 'tre'), (2, 'due')]

# Funzioni Lambda in Python

## Sintesi

Nota su Funzioni Lambda in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
coppie_ordinate = sorted(coppie, key=lambda x: x[1])
# Funzioni Lambda in Python

## Sintesi

Nota su Funzioni Lambda in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
```

### Uso con Map e Filter
```python
numeri = [1, 2, 3, 4, 5, 6]

# Funzioni Lambda in Python

## Sintesi

Nota su Funzioni Lambda in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
pari = list(filter(lambda x: x % 2 == 0, numeri)) # [2, 4, 6]

# Funzioni Lambda in Python

## Sintesi

Nota su Funzioni Lambda in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
quadrati = list(map(lambda x: x**2, numeri)) # [1, 4, 9, 16, 25, 36]
```

---

##  Funzionamento Interno (Teoria)
- **Oggetti di prima classe:** Le lambda sono oggetti funzione a tutti gli effetti, proprio come quelle create con `def`.
- **Scope & Closures:** Le funzioni lambda hanno accesso alle variabili nel loro scope esterno (lexical scoping), permettendo la creazione di closure semplici.
- **Limitazioni:** A differenza di `def`, non possono avere annotazioni di tipo (type hints) o docstring, e sono limitate a una singola espressione logica.

---

##  Best Practices & "Gotchas"
-  **Da fare:** Usale quando la logica è così semplice da essere chiara in una sola riga (es. trasformazioni di dati, callback).
-  **Da evitare:** Non assegnare mai una lambda a una variabile (es. `f = lambda x: x`). In quel caso, il PEP 8 raccomanda l'uso di `def f(x): return x` per facilitare il debugging (miglior stack trace).
-  **Leggibilità:** Se la lambda diventa troppo complessa o difficile da leggere, spostala in una funzione regolare con un nome descrittivo.

---
