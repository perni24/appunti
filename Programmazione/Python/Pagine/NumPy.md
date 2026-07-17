---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [programmazione, python, dati, numpy]
aliases: [NumPy, ndarray]
prerequisites: []
related: []
---

# NumPy

## Sintesi

NumPy fornisce array multidimensionali efficienti e operazioni numeriche vettoriali. E la base di molte librerie scientifiche, data science e machine learning in Python.

Il vantaggio principale e spostare operazioni numeriche da loop Python lenti a operazioni ottimizzate su array.

## Quando usarlo

Usa NumPy per:

- calcolo numerico;
- algebra lineare;
- elaborazione segnali;
- simulazioni;
- array multidimensionali;
- base per pandas, scikit-learn e librerie scientifiche;
- ottimizzare operazioni ripetitive su dati numerici.

Per dati tabellari eterogenei, spesso pandas e piu comodo.

## Come funziona

Array base:

```python
import numpy as np

values = np.array([1, 2, 3])
print(values * 2)
```

L'operazione `values * 2` viene applicata elemento per elemento senza un loop Python esplicito.

Array multidimensionale:

```python
matrix = np.array([
    [1, 2],
    [3, 4],
])

print(matrix.shape)
```

## API / Sintassi

Creazione array:

```python
np.array([1, 2, 3])
np.zeros((2, 3))
np.ones((2, 3))
np.arange(0, 10, 2)
np.linspace(0, 1, 5)
```

Operazioni:

```python
values.mean()
values.sum()
values.reshape((3, 1))
```

Broadcasting:

```python
matrix = np.array([[1, 2, 3], [4, 5, 6]])
offset = np.array([10, 20, 30])

print(matrix + offset)
```

## Esempio pratico

Normalizzare valori numerici:

```python
import numpy as np

values = np.array([10, 20, 30, 40])

normalized = (values - values.mean()) / values.std()
print(normalized)
```

Questo evita loop manuali e rende esplicita l'operazione matematica.

## Varianti

- **`ndarray`**: struttura dati principale.
- **Broadcasting**: combina array con forme compatibili.
- **Vectorization**: operazioni su array invece di loop Python.
- **Boolean indexing**: filtra array con maschere booleane.
- **Linear algebra**: `np.linalg`.
- **Random**: generatori numerici in `np.random`.

## Errori comuni

- Confondere liste Python e array NumPy.
- Ignorare `shape` e dimensioni.
- Non capire il broadcasting.
- Copiare array inutilmente.
- Usare loop Python quando basta una operazione vettoriale.
- Mischiare tipi incompatibili nello stesso array.
- Non considerare memoria per array grandi.

## Checklist

- I dati sono numerici e omogenei?
- La shape e quella attesa?
- Posso usare vectorization invece di loop?
- Il broadcasting e intenzionale?
- Sto copiando o creando una view?
- La memoria richiesta e accettabile?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[pandas]]
- [[Cython]]
- [[Profiling]]
- [[Memory Management]]
