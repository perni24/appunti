---
date: 2026-03-05
tags:
  - programmazione
  - python
  - strutture-dati
type: #permanent-note
status: evergreen
---

# Set in Python

## 💡 Concetto Chiave
I **Set** (Insiemi) sono collezioni **non ordinate** di elementi **unici**. Sono fondamentali quando è necessario eliminare duplicati o eseguire operazioni matematiche sugli insiemi (unione, intersezione, ecc.). In Python, gli elementi di un set devono essere **hashable** (immutabili).

---

## 📝 Sintassi e Creazione

I set si definiscono utilizzando le parentesi graffe `{}` oppure la funzione `set()`.

```python
# Creazione di un set con elementi
colori = {"rosso", "verde", "blu"}

# Aggiunta automatica di duplicati (vengono ignorati)
numeri = {1, 2, 2, 3, 4, 4, 4}
print(numeri) # {1, 2, 3, 4}

# ATTENZIONE: per creare un set vuoto devi usare set()
vuoto = set() 
# {} creerebbe un dizionario vuoto
```

### Caratteristiche principali
- **Unicità:** Ogni elemento può apparire una sola volta.
- **Non ordinati:** Non puoi accedere agli elementi tramite indice (es. `set[0]` darà errore).
- **Mutabili:** Puoi aggiungere o rimuovere elementi.

---

## 🏗️ Operazioni comuni

| Metodo | Descrizione |
| :--- | :--- |
| `.add(x)` | Aggiunge l'elemento x al set. |
| `.remove(x)` | Rimuove x. Solleva un errore (`KeyError`) se x non esiste. |
| `.discard(x)` | Rimuove x. **Non** solleva errore se x non esiste. |
| `.pop()` | Rimuove e restituisce un elemento casuale. |
| `.clear()` | Svuota completamente il set. |

---

## 📐 Operazioni Matematiche sugli Insiemi
Python offre operatori (concisi) per la logica degli insiemi:

```python
a = {1, 2, 3}
b = {3, 4, 5}

# Unione (Tutti gli elementi di entrambi)
print(a | b) # {1, 2, 3, 4, 5}

# Intersezione (Solo elementi comuni)
print(a & b) # {3}

# Differenza (Elementi in 'a' ma non in 'b')
print(a - b) # {1, 2}

# Differenza Simmetrica (Elementi in uno o nell'altro, ma non in entrambi)
print(a ^ b) # {1, 2, 4, 5}
```

---

## ⚙️ Logic Layer: Performance e Hash Table
I set in Python sono implementati internamente tramite una **Hash Table** (simile ai dizionari).

> [!INFO] Complessità Computazionale (Big O)
> - **Ricerca element (`in`):** $O(1)$ - Velocità costante, indipendentemente dalla dimensione.
> - **Aggiunta/Rimozione:** $O(1)$.

Questo rende i set incredibilmente più efficienti delle liste ($O(n)$) per verificare l'appartenenza di un elemento.

### Frozenset
Se hai bisogno di un set che sia a sua volta immutabile (e quindi utilizzabile come chiave di un dizionario), Python offre il `frozenset`.

```python
fs = frozenset([1, 2, 3])
# fs.add(4) # Darà AttributeError
```

---
