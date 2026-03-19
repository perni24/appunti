---
date: 2026-03-19
tags:
  - programmazione
  - python
  - teoria
type: #permanent-note
status: in_elaborazione
---

# Iteratori in Python

## 💡 Concetto Chiave
Un **iteratore** è un oggetto che permette di scorrere una collezione di dati un elemento alla volta. In Python, l'iterazione si basa su due concetti distinti:
- **Iterabile (Iterable):** Un oggetto che può restituire un iteratore (es. liste, tuple, stringhe, dizionari). Ha il metodo `__iter__()`.
- **Iteratore (Iterator):** L'oggetto che tiene traccia della posizione durante l'iterazione. Ha il metodo `__next__()`.

Tutti gli iteratori sono iterabili, ma non tutti gli iterabili sono iteratori.

---

## 📝 Sintassi ed Utilizzo

### Funzioni `iter()` e `next()`
```python
numeri = [1, 2, 3]
it = iter(numeri) # Otteniamo l'iteratore dalla lista

print(next(it)) # 1
print(next(it)) # 2
print(next(it)) # 3
# print(next(it)) # Solleva StopIteration
```

### Protocollo Iteratore (Classe Personalizzata)
Per creare un iteratore personalizzato, una classe deve implementare:
1. `__iter__(self)`: Deve restituire l'oggetto iteratore stesso (solitamente `self`).
2. `__next__(self)`: Deve restituire l'elemento successivo o sollevare `StopIteration`.

```python
class Contatore:
    def __init__(self, limite):
        self.limite = limite
        self.attuale = 0

    def __iter__(self):
        return self

    def __next__(self):
        if self.attuale < self.limite:
            self.attuale += 1
            return self.attuale
        else:
            raise StopIteration

for n in Contatore(5):
    print(n) # Stampa da 1 a 5
```

---

## 💻 Esempi Pratici

### Iteratori Infiniti
Un iteratore può non avere mai fine, a differenza di una lista.

```python
class SempreDue:
    def __iter__(self):
        return self
    def __next__(self):
        return 2

it = SempreDue()
# next(it) restituirà sempre 2
```

---

## ⚙️ Funzionamento Interno (Teoria)
- **Lazy Evaluation:** Gli iteratori non calcolano tutti i valori subito, ma solo quando richiesti tramite `next()`. Questo permette di gestire sequenze enormi con un consumo di memoria minimo (costante, O(1)).
- **Stato:** L'iteratore "consuma" se stesso. Una volta arrivato alla fine, non può essere riavviato (bisogna creare un nuovo iteratore dall'iterabile).
- **Relazione con i Generatori:** I [Generatori](Generatori.md) sono un modo sintatticamente più semplice per creare iteratori senza definire una classe completa.

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Utilizzo:** Usa gli iteratori per processare dati che non entrano in memoria o per flussi di dati in tempo reale.
- ❌ **Riutilizzo:** Ricorda che un iteratore è "monouso". Se provi a iterare due volte sullo stesso oggetto iteratore, la seconda volta risulterà vuoto.
- 💣 **Ciclo For:** Il ciclo `for` in Python gestisce automaticamente la chiamata a `iter()`, le chiamate a `next()` e l'eccezione `StopIteration`. È il modo più sicuro di consumare un iteratore.

---