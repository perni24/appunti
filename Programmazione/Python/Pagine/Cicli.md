---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - python
  - programming
aliases:
  - Cicli
prerequisites: []
related: []
title: Cicli in Python
---

# Cicli in Python

## Sintesi

For consuma un **iterabile**; while ripete finche una condizione e vera. Break, continue ed else permettono di distinguere interruzione anticipata e completamento normale.

Baseline: **CPython 3.12.10**. Zip con strict=True richiede Python 3.10 o successivo.

## Quando usarlo

Per attraversare collezioni, leggere flussi, cercare un elemento o ripetere un'operazione con una condizione d'uscita esplicita.

## Come funziona

For ottiene elementi tramite il protocollo di iterazione, non richiede una lista. Un iteratore puo esaurirsi; range rappresenta una sequenza di interi senza costruire in anticipo una lista con tutti gli elementi.

Break esce dal ciclo piu interno. Continue passa alla prossima iterazione, che in un while richiede una nuova valutazione della condizione.

Else viene eseguito quando il for esaurisce l'iterabile o la condizione del while diventa falsa, anche se ci sono state zero iterazioni. **Non si esegue dopo break, return o un'eccezione che esce dal ciclo**.

## API / Sintassi

### Elementi, indici e intervalli

```python
items = ["bozza", "pubblicato"]

for item in items:
    print(item)

for index, item in enumerate(items, start=1):
    print(index, item)

print(list(range(1, 6, 2)))  # [1, 3, 5]
print(list(range(3, 0, -1)))  # [3, 2, 1]
```

L'estremo finale di range e escluso; il passo non puo essere zero. Enumerate conta gli elementi osservati: non e necessariamente l'indice originale dopo un filtro.

### While con avanzamento

```python
attempts = 0

while attempts < 3:
    attempts += 1

print(attempts)  # 3
```

Questo dimostra solo il contatore, non implementa retry di rete. Se un continue salta l'avanzamento necessario, il ciclo puo non terminare.

### Iteratori e zip

```python
iterator = iter([1, 2])
print(list(iterator))  # [1, 2]
print(list(iterator))  # []

names = ["Ada", "Lin"]
scores = [10, 20]
print(list(zip(names, scores, strict=True)))
# [('Ada', 10), ('Lin', 20)]
```

Zip normale si ferma all'input piu corto; strict=True segnala lunghezze diverse con ValueError **durante il consumo**. Non e un controllo preventivo o una transazione: il codice potrebbe avere gia elaborato coppie precedenti.

## Esempio pratico

### Ricerca con break ed else

Il contratto e una sequenza finita di interi o None. Un risultato zero e valido e non deve essere confuso con assenza.

```python
def first_even(values):
    for value in values:
        if value is None:
            continue
        if value % 2 == 0:
            result = value
            break
    else:
        result = None

    return result


print(first_even([None, 3, 0, 8]))  # 0
print(first_even([1, 3]))          # None
print(first_even([]))             # None
```

### Raccolta senza modificare l'input

```python
def collect_titles(records):
    titles = []
    for record in records:
        if not isinstance(record, dict):
            continue
        title = record.get("title")
        if not isinstance(title, str):
            continue
        title = title.strip()
        if not title:
            continue
        titles.append(title)
    return titles


records = [
    {"title": "  Python  "},
    {"title": ""},
    {"title": 42},
    {"title": "Rust"},
]
print(collect_titles(records))  # ['Python', 'Rust']
```

La politica del demo scarta record non validi e mantiene ordine e duplicati. Per un'importazione che deve segnalare ogni errore, restituisci anche gli scarti invece di perderli silenziosamente.

Non chiamare valid_emails una lista ottenuta solo saltando stringhe vuote o usando lower(): nessuna di queste operazioni valida un indirizzo o verifica il possesso della casella.

## Varianti

- Per i dizionari, iterazione normale sulle chiavi; items() fornisce coppie chiave/valore.
- Per trasformazioni semplici, una comprehension puo essere piu leggibile.
- Per modificare una collezione, costruisci un risultato separato o itera una copia appropriata.
- Iterare un file e incrementale; il consumo totale dipende da cosa accumuli nel corpo.
- Un generatore infinito richiede un limite o un'interruzione esplicita.

## Errori comuni

- Aspettarsi un secondo passaggio completo sullo stesso iteratore esaurito.
- Credere che else significhi "il ciclo non e mai entrato".
- Usare zip normale quando lunghezze diverse indicano un errore.
- Rimuovere elementi da una lista durante l'iterazione, saltando elementi.
- Cambiare dimensione di un dizionario durante l'iterazione.
- Usare range(len(...)) senza una reale necessita dell'indice.

## Checklist

- L'input e finito oppure c'e un limite?
- Servono elementi, indici o coppie?
- Break interrompe il livello desiderato?
- Gli scarti sono intenzionali e osservabili?
- Input conservato e iteratore non riusato per errore?

## Collegamenti

- [[Programmazione/Python/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Python/Pagine/Comprehensions|Comprehensions]]
- [[Programmazione/Python/Pagine/Liste|Liste]]
- [[Programmazione/Python/Pagine/Dizionari|Dizionari]]
- [[Programmazione/Python/Pagine/Generatori|Generatori]]

## Fonti

- [Python 3.12: cicli, break, continue ed else](https://docs.python.org/3.12/tutorial/controlflow.html).
- [Python 3.12: for e while nel riferimento](https://docs.python.org/3.12/reference/compound_stmts.html).
- [Python 3.12: enumerate e zip](https://docs.python.org/3.12/library/functions.html#zip).
- [Python 3.12: protocollo degli iteratori](https://docs.python.org/3.12/library/stdtypes.html#iterator-types).

## Navigazione

- [[Programmazione/Python/Indice Python|Indice Python]]
