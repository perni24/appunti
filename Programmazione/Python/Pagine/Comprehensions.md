---
date: 2026-03-05
tags:
  - programmazione
  - python
  - strutture-dati
  - sintassi-avanzata
type: #permanent-note
status: evergreen
---

# Comprehensions in Python

## 💡 Concetto Chiave
Le **Comprehensions** sono una sintassi elegante e concisa per creare nuove collezioni (liste, dizionari, set) a partire da iterabili esistenti. Permettono di sostituire cicli `for` multi-riga e chiamate a `filter()` o `map()` con un'unica espressione leggibile.

---

## 📝 Tipologie di Comprehensions

### 1. List Comprehensions
È la forma più comune. Crea una nuova **lista**.

```python
# Sintassi: [espressione for elemento in iterabile]
numeri = [1, 2, 3, 4, 5]

# Elevamento al quadrato
quadrati = [x**2 for x in numeri] # [1, 4, 9, 16, 25]
```

### 2. Dictionary Comprehensions
Crea un **dizionario** mappando chiavi e valori.

```python
# Sintassi: {chiave: valore for elemento in iterabile}
nomi = ["Luca", "Gianni", "Anna"]
lunghezze = {nome: len(nome) for nome in nomi}
# {'Luca': 4, 'Gianni': 6, 'Anna': 4}
```

### 3. Set Comprehensions
Crea un **set** (rimuovendo automaticamente i duplicati).
```python
# Estrarre estensioni uniche da una lista di file
files = ["documento.PDF", "immagine.png", "REPORT.PDF", "foto.JPG", "vacanze.png"]

estensioni_pulite = {f.split(".")[-1].lower() for f in files}
# {'pdf', 'png', 'jpg'} (i duplicati e il case-sensitive sono risolti)
```

---

## 🏗️ Logica Condizionale
Le comprehensions supportano filtri e trasformazioni condizionali.

### Filtrare (if alla fine)
```python
# Solo i numeri pari
pari = [x for x in range(10) if x % 2 == 0]
```

### Trasformare (if/else prima del for)
```python
# Se x > 0 lo prendo, altrimenti metto 0
dati = [1, -5, 10, -2]
puliti = [x if x > 0 else 0 for x in dati] # [1, 0, 10, 0]
```

---

## ⚙️ Logic Layer: Perché usarle?

### Performance
A livello di bytecode, le comprehensions sono generalmente **più veloci** di un ciclo `for` equivalente con `.append()`, poiché l'operazione avviene internamente a velocità C invece di richiedere ripetute chiamate al metodo di lista della Python Virtual Machine.

### Leggibilità (Pythonic)
Rendono il codice più dichiarativo: descrivi *cosa* vuoi ottenere invece di descrivere passo-passo *come* costruirlo.

> [!WARNING] Evitare l'eccessiva complessità
> Nonostante la potenza, evita le comprehensions troppo lunghe o nidificate (es. una comprehension dentro l'altra). Se la riga di codice diventa difficile da leggere in un secondo, è meglio tornare a un normale ciclo `for`. La leggibilità deve essere sempre la priorità.

---
