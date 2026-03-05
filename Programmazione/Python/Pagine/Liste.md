---
date: 2026-03-05
tags:
  - programmazione
  - python
  - strutture-dati
type: #permanent-note
status: evergreen
---

# Liste in Python

## 💡 Concetto Chiave
Le **liste** sono collezioni di elementi **ordinate**, **mutabili** e indicizzate. Sono probabilmente la struttura dati più versatile e utilizzata in Python. Possono contenere elementi di tipi diversi (eterogenee), anche se solitamente vengono usate per collezionare oggetti omogenei.

---

## 📝 Sintassi e Operazioni Base

### Definizione e Accesso
```python
# Creazione
frutti = ["mela", "banana", "ciliegia"]
numeri_misti = [1, "test", 3.14, True]

# Accesso (0-indexed)
print(frutti[0])   # "mela"
print(frutti[-1])  # "ciliegia" (ultimo elemento)
```

### Modifica
Le liste sono mutabili, quindi puoi sovrascrivere i valori esistenti:
```python
frutti[1] = "pera"
```

---

## 🏗️ Metodi Principali

| Metodo | Descrizione | Esempio |
| :--- | :--- | :--- |
| `.append(x)` | Aggiunge un elemento alla **fine**. | `l.append("nuovo")` |
| `.insert(i, x)` | Inserisce un elemento in una **posizione specifica**. | `l.insert(0, "inizio")` |
| `.remove(x)` | Rimuove la **prima occorrenza** del valore x. | `l.remove("mela")` |
| `.pop(i)` | Rimuove e restituisce l'elemento all'indice i (default: l'ultimo). | `x = l.pop()` |
| `.sort()` | Ordina la lista in place. | `l.sort()` |
| `.reverse()` | Inverte l'ordine degli elementi in place. | `l.reverse()` |
| `.clear()` | Svuota completamente la lista. | `l.clear()` |

---

## ✂️ Slicing (Affettamento)
Una delle funzionalità più potenti di Python per estrarre sotto-sequenze.
**Sintassi:** `lista[inizio:fine:passo]`

```python
numeri = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

print(numeri[2:5])   # [2, 3, 4] (indice 5 escluso)
print(numeri[:3])    # [0, 1, 2] (dall'inizio)
print(numeri[7:])    # [7, 8, 9] (fino alla fine)
print(numeri[::2])   # [0, 2, 4, 6, 8] (ogni due elementi)
print(numeri[::-1])  # [9, 8, 7, 6, 5, 4, 3, 2, 1, 0] (inversione rapida)
```

---

## ⚙️ Logic Layer: Gestione della Memoria e Performance
In Python, le liste sono implementate come **array dinamici** di riferimenti ad oggetti.

> [!INFO] Complessità Computazionale (Big O)
> - **Accesso per indice:** $O(1)$ - Velocità costante.
> - **Aggiunta in fondo (`append`):** $O(1)$ - Ammortizzato.
> - **Inserimento/Rimozione all'inizio:** $O(n)$ - Python deve shiftare tutti gli altri elementi.
> - **Ricerca per valore (`in`):** $O(n)$ - Deve scansionare la lista.

### Copia delle Liste
Attenzione: `lista_b = lista_a` non crea una copia, ma un nuovo riferimento allo stesso oggetto. Per copiare davvero usa:
```python
copia = lista_a.copy()
# oppure
copia = lista_a[:]
```

---