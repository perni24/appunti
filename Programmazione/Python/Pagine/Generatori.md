---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [python, programming]
aliases: [Generatori]
prerequisites: []
related: []
---

# Generatori in Python

## Sintesi

Un generatore e un modo compatto per creare un iteratore. Una funzione diventa generatore quando contiene `yield`: invece di calcolare e restituire tutto subito, produce un valore alla volta e conserva il proprio stato tra una chiamata e la successiva.

I generatori sono uno degli strumenti principali per scrivere codice lazy, efficiente in memoria e componibile.

## Quando usarlo

Usa un generatore quando:

- devi processare molti dati senza caricarli tutti in RAM;
- vuoi rappresentare una sequenza potenzialmente infinita;
- vuoi costruire pipeline di trasformazione;
- non ti serve accesso casuale per indice;
- vuoi evitare una classe iteratore esplicita.

## Come funziona

Una funzione normale termina con `return`. Una funzione generatore sospende l'esecuzione con `yield` e riprende da quel punto alla chiamata successiva di `next()`.

```python
def count_to(limit):
    current = 1
    while current <= limit:
        yield current
        current += 1


counter = count_to(3)

print(next(counter))  # 1
print(next(counter))  # 2
print(next(counter))  # 3
```

Quando non ci sono piu valori, Python solleva `StopIteration`. Nei cicli `for` questa eccezione viene gestita automaticamente.

```python
for number in count_to(3):
    print(number)
```

## API / Sintassi

Funzione generatore:

```python
def squares(numbers):
    for number in numbers:
        yield number * number
```

Generator expression:

```python
squares = (number * number for number in range(1_000_000))
```

`yield from` delega la produzione di valori a un altro iterabile.

```python
def chain(first, second):
    yield from first
    yield from second


for item in chain([1, 2], [3, 4]):
    print(item)
```

## Esempio pratico

Un caso tipico e leggere un file riga per riga e restituire solo righe significative.

```python
def non_empty_lines(path):
    with open(path, encoding="utf-8") as file:
        for line in file:
            cleaned = line.strip()
            if cleaned:
                yield cleaned


for line in non_empty_lines("input.txt"):
    print(line.upper())
```

Il file viene attraversato progressivamente. Non viene creata una lista con tutte le righe.

## Varianti

- **Funzione generatore**: usa `yield` dentro una funzione.
- **Generator expression**: forma compatta simile a una comprehension.
- **Pipeline di generatori**: piu generatori collegati in sequenza.
- **Generatore infinito**: produce valori finche il chiamante decide di interrompere.
- **`yield from`**: semplifica la delega a un altro iterabile.

```python
def natural_numbers():
    number = 1
    while True:
        yield number
        number += 1
```

## Errori comuni

- Iterare due volte sullo stesso generatore aspettandosi gli stessi valori.
- Convertire un generatore enorme in lista con `list(generator)`.
- Usare un generatore quando servono lunghezza, ordinamento o accesso per indice.
- Nascondere troppa logica dentro pipeline lazy difficili da debuggare.
- Dimenticare che il codice dentro il generatore non parte finche il generatore non viene consumato.

## Checklist

- La sequenza deve essere consumata una sola volta?
- Serve davvero una lista o basta un flusso di valori?
- Il generatore chiude correttamente eventuali risorse?
- La pipeline resta leggibile?
- I punti in cui il generatore viene consumato sono chiari?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Programmazione/Python/Pagine/Iteratori|Iteratori]]
- [[Comprehensions]]
- [[Gestione File]]
- [[Context Managers]]
