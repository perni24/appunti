---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Iteratori]
prerequisites: []
related: []
---

# Iteratori in Python

## Sintesi

Un iteratore e un oggetto che produce valori uno alla volta tramite il protocollo `__iter__()` e `__next__()`. E alla base di `for`, comprehension, generatori e molte API della standard library.

La distinzione importante e tra:

- **iterabile**: oggetto da cui si puo ottenere un iteratore, come `list`, `tuple`, `dict`, `str`;
- **iteratore**: oggetto che mantiene lo stato dell'iterazione e restituisce il prossimo valore con `next()`.

Tutti gli iteratori sono iterabili, ma non tutti gli iterabili sono iteratori.

## Quando usarlo

Usa gli iteratori quando vuoi attraversare una sequenza o un flusso senza caricare tutto in memoria.

Sono utili per:

- leggere dati riga per riga;
- costruire pipeline lazy;
- modellare sequenze calcolate al momento;
- evitare liste temporanee molto grandi;
- implementare oggetti personalizzati compatibili con `for`.

## Come funziona

Il ciclo `for` chiama internamente `iter()` sull'oggetto ricevuto e poi invoca `next()` finche l'iteratore solleva `StopIteration`.

```python
numbers = [10, 20, 30]
iterator = iter(numbers)

print(next(iterator))  # 10
print(next(iterator))  # 20
print(next(iterator))  # 30
```

Un iteratore mantiene uno stato interno. Dopo essere stato consumato, non riparte da capo.

```python
items = iter(["a", "b"])

for item in items:
    print(item)

for item in items:
    print(item)  # non stampa nulla: l'iteratore e gia esaurito
```

## API / Sintassi

Funzioni principali:

- `iter(obj)`: restituisce un iteratore dall'oggetto iterabile;
- `next(iterator)`: restituisce il prossimo valore;
- `StopIteration`: eccezione che segnala la fine dell'iterazione.

Una classe puo diventare un iteratore implementando `__iter__()` e `__next__()`.

```python
class CountTo:
    def __init__(self, limit):
        self.limit = limit
        self.current = 0

    def __iter__(self):
        return self

    def __next__(self):
        if self.current >= self.limit:
            raise StopIteration

        self.current += 1
        return self.current


for number in CountTo(3):
    print(number)
```

Output:

```text
1
2
3
```

## Esempio pratico

Un iteratore personalizzato puo essere utile quando vuoi rappresentare una sequenza che dipende da uno stato interno.

```python
class RetryDelays:
    def __init__(self, attempts, base_delay):
        self.attempts = attempts
        self.base_delay = base_delay
        self.current_attempt = 0

    def __iter__(self):
        return self

    def __next__(self):
        if self.current_attempt >= self.attempts:
            raise StopIteration

        delay = self.base_delay * (2 ** self.current_attempt)
        self.current_attempt += 1
        return delay


for delay in RetryDelays(attempts=4, base_delay=0.5):
    print(delay)
```

Questo produce ritardi progressivi senza creare prima una lista di tutti i valori.

## Varianti

- **Iterabile riutilizzabile**: ogni chiamata a `iter()` crea un nuovo iteratore. Una lista e un esempio tipico.
- **Iteratore monouso**: l'oggetto e anche il proprio iteratore e viene consumato progressivamente.
- **Generatori**: funzioni con `yield` che implementano automaticamente il protocollo iteratore.
- **`itertools`**: modulo della standard library con strumenti per comporre iteratori.
- **`iter(callable, sentinel)`**: forma speciale che richiama una funzione finche non restituisce un valore sentinella.

```python
with open("data.txt", encoding="utf-8") as file:
    for line in iter(file.readline, ""):
        print(line.strip())
```

## Errori comuni

- Riutilizzare un iteratore gia consumato aspettandosi che riparta dall'inizio.
- Convertire sempre tutto in `list()` perdendo il vantaggio della valutazione lazy.
- Confondere iterabile e iteratore durante la progettazione di classi custom.
- Sollevare eccezioni diverse da `StopIteration` per indicare la fine della sequenza.
- Modificare una collezione mentre la si sta iterando, ottenendo risultati difficili da prevedere.

## Checklist

- L'oggetto deve essere riutilizzabile o monouso?
- La sequenza potrebbe essere grande o infinita?
- Il comportamento dopo l'esaurimento e chiaro?
- `StopIteration` viene usato solo per terminare l'iterazione?
- Un generatore sarebbe piu semplice di una classe iteratore?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Generatori]]
- [[Cicli]]
- [[Comprehensions]]
- [[Data model]]
