---
date: 2026-03-19
tags:
  - programmazione
  - python
  - teoria
type: #permanent-note
status: in_elaborazione
---

# Generatori in Python

## 💡 Concetto Chiave
I **generatori** sono un modo semplice e potente per creare iteratori. A differenza delle funzioni normali che restituiscono un valore e terminano, i generatori utilizzano la keyword `yield` per sospendere la loro esecuzione, "producendo" un valore alla volta e mantenendo il proprio stato interno per la chiamata successiva.

Questo approccio è alla base della **Lazy Evaluation** (valutazione pigra): i dati vengono generati solo quando sono effettivamente necessari, risparmiando memoria.

---

## 📝 Sintassi

### Funzione Generatore
Una funzione che contiene almeno una istruzione `yield` diventa automaticamente un generatore.

```python
def conta_fino_a(n):
    count = 1
    while count <= n:
        yield count
        count += 1

gen = conta_fino_a(3)
print(next(gen)) # 1
print(next(gen)) # 2
print(next(gen)) # 3
```

### Espressioni Generatrici (Generator Expressions)
Simili alle List Comprehension, ma utilizzano le parentesi tonde `()`.

```python
# List Comprehension (carica tutto in memoria)
quadrati_lista = [x**2 for x in range(1000000)]

# Generator Expression (genera i valori on-demand)
quadrati_gen = (x**2 for x in range(1000000))
```

---

## 💻 Esempi Pratici

### Elaborazione di Grandi File
Leggere un file enorme riga per riga senza caricarlo interamente in RAM.

```python
def leggi_file_enorme(percorso):
    with open(percorso, 'r') as f:
        for riga in f:
            yield riga.strip()

for riga in leggi_file_enorme("dati_pesanti.txt"):
    # Elabora la riga
    pass
```

### Sequenze Infinite
I generatori possono rappresentare flussi di dati potenzialmente infiniti.

```python
def numeri_naturali():
    n = 1
    while True:
        yield n
        n += 1

gen = numeri_naturali()
# Posso chiamare next(gen) all'infinito senza bloccare il computer
```

---

## ⚙️ Funzionamento Interno (Teoria)
- **Stato locale:** Quando un generatore incontra `yield`, lo stato locale della funzione (variabili, puntatore di istruzione) viene congelato. Alla chiamata successiva di `next()`, riprende esattamente da quel punto.
- **Protocollo Iteratore:** I generatori implementano automaticamente i metodi `__iter__()` e `__next__()`.
- **StopIteration:** Quando il generatore esaurisce i valori (o incontra un `return`), solleva automaticamente l'eccezione `StopIteration`, che i cicli `for` gestiscono silenziosamente.

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Efficienza di Memoria:** Usa i generatori per lavorare con dataset che superano la capacità della RAM o per flussi di dati continui.
- ❌ **Accesso Casuale:** Un generatore può essere scorso solo **una volta**. Se hai bisogno di accedere agli elementi per indice o scorrere la sequenza più volte, devi convertirlo in una lista (es. `list(mio_gen)`), ma perderai il risparmio di memoria.
- 💣 **Composizione:** Puoi concatenare i generatori per creare delle "pipeline" di elaborazione dati molto eleganti e performanti.

---