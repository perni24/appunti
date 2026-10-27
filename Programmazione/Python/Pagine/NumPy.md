---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - python
  - dati
  - numpy
aliases:
  - NumPy
  - ndarray
prerequisites: []
related: []
title: NumPy
---

# NumPy

## Sintesi

NumPy fornisce `ndarray` multidimensionali e operazioni numeriche su array. Le ufunc e molte routine lavorano in codice compilato: il vantaggio non e una generica "magia di Python", ma la riduzione dell'overhead per elemento e l'uso di rappresentazioni adatte al calcolo.

Baseline: CPython 3.12.10 e **NumPy 2.5.4**, Windows. Gli esempi non sono benchmark e non garantiscono identici risultati bit per bit su ogni versione, BLAS o piattaforma.

## Quando usarlo

- Array numerici, statistiche, simulazioni, segnali e algebra lineare.
- Operazioni ripetitive su molti valori con tipi e dimensioni noti.
- Scambio di buffer con librerie scientifiche o codice compilato.

Per dati eterogenei con etichette e join usa spesso pandas. Per pochi elementi il costo di costruzione degli array puo superare il risparmio del calcolo: misura il carico reale.

## Come funziona

### Shape, dtype e memoria

Un array ha un `dtype` per elemento, una `shape` e degli stride che descrivono come raggiungere i dati. Un array non deve essere contiguo: una trasposta puo condividere il buffer con un diverso layout.

| Attributo | Significato                                                          |
| --------- | -------------------------------------------------------------------- |
| `shape`   | Lunghezza lungo ciascun asse                                         |
| `ndim`    | Numero di assi                                                       |
| `size`    | Numero totale di elementi                                            |
| `dtype`   | Rappresentazione degli elementi                                      |
| `nbytes`  | Byte degli elementi, non tutto l'overhead o gli oggetti referenziati |

`object` contiene riferimenti Python e non offre gli stessi vantaggi di un array numerico omogeneo. Gli interi a larghezza fissa possono traboccare; i float non rappresentano esattamente tutti i numeri reali o tutti gli interi grandi.

### shapes_demo.py

```python
import numpy as np

values = np.array([1, 2, 3], dtype=np.int64)
assert (values * 2).tolist() == [2, 4, 6]
assert ([1, 2, 3] * 2) == [1, 2, 3, 1, 2, 3]

matrix = np.arange(6, dtype=np.float64).reshape(2, 3)
assert matrix.shape == (2, 3)
assert matrix.size == 6
assert matrix.nbytes == 6 * 8
np.testing.assert_array_equal(matrix.sum(axis=0), [3, 5, 7])
np.testing.assert_array_equal(matrix.sum(axis=1), [3, 12])
assert matrix.mean(axis=0, keepdims=True).shape == (1, 3)
assert np.zeros((2, 3)).shape == np.ones((2, 3)).shape
np.testing.assert_allclose(np.linspace(0, 1, 5), [0, .25, .5, .75, 1])
print(matrix)
```

`axis=0` riduce l'asse delle righe e produce un valore per colonna; `axis=1` riduce le colonne. `keepdims=True` conserva assi di lunghezza uno, utili per operazioni successive.

`arange` usa un passo ed esclude normalmente il limite finale; con passi floating-point non affidarti a un numero esatto di elementi. `linspace` parte dal numero di campioni desiderato. `reshape` deve conservare il numero di elementi; puo produrre una vista o una copia secondo il layout.

## API / Sintassi

Installazione nell'ambiente virtuale:

```bash
python -m pip install "numpy==2.5.4"
```

### broadcasting_demo.py

Le forme si confrontano **da destra**: due dimensioni sono compatibili se uguali oppure una vale uno. Le dimensioni iniziali mancanti si comportano come uno.

```python
import numpy as np

matrix = np.array([[1, 2, 3], [4, 5, 6]])
offset = np.array([10, 20, 30])
np.testing.assert_array_equal(
    matrix + offset, [[11, 22, 33], [14, 25, 36]]
)

row_offset = np.array([100, 200])[:, None]
assert row_offset.shape == (2, 1)
np.testing.assert_array_equal(
    matrix + row_offset, [[101, 102, 103], [204, 205, 206]]
)

try:
    matrix + np.array([10, 20])
except ValueError:
    pass
else:
    raise AssertionError("Shape incompatibili accettate")
print(matrix + row_offset)
```

Il broadcasting evita di materializzare copie ripetute degli operandi, ma **il risultato puo essere enorme**: `(n, 1)` con `(1, m)` puo generare `n*m` elementi. Non basta che le forme siano compatibili: devono rappresentare l'operazione voluta.

### indexing_demo.py

```python
import numpy as np

source = np.array([10, 20, 30, 40])
view = source[1:3]
view[0] = 99
assert source.tolist() == [10, 99, 30, 40]
assert np.shares_memory(source, view)

picked = source[[0, 2]]
picked[0] = -1
assert source[0] == 10
assert not np.shares_memory(source, picked)

mask = (source >= 30) & (source < 100)
source[mask] = 0
assert source.tolist() == [10, 0, 0, 0]

independent = source.copy()
independent[0] = 5
assert source[0] == 10
print(source)
```

Slicing semplice produce normalmente viste; indicizzazione avanzata con indici interi/booleani restituisce copie **in lettura**. Un'assegnazione come `source[mask] = 0` scrive comunque nell'array originale. Non confondere le due operazioni.

Per confrontare o filtrare, usa maschere elemento per elemento; un array con piu elementi non ha un unico valore di verita. `np.any` e `np.all` effettuano riduzioni esplicite.

## Esempio pratico

### normalization.py

Standardizzazione per colonna: righe = osservazioni, colonne = variabili. Il contratto rifiuta forme vuote, tipi non numerici reali, NaN e infinito; converte i dati a float64 senza mutare l'input.

Per colonne costanti scegliamo output zero. E una **policy applicativa**, perche la formula ordinaria dividerebbe per zero.

```python
import numpy as np


def standardize_columns(values) -> np.ndarray:
    raw = np.asarray(values)
    if raw.ndim != 2 or 0 in raw.shape:
        raise ValueError("Attesa matrice 2D non vuota")
    if raw.dtype.kind not in "iuf":
        raise TypeError("Attesi interi o float reali, non bool/object/complessi")
    data = raw.astype(np.float64, copy=True)
    if not np.isfinite(data).all():
        raise ValueError("NaN o infinito non ammessi")

    with np.errstate(over="raise", invalid="raise", divide="raise"):
        mean = data.mean(axis=0, keepdims=True)
        scale = data.std(axis=0, ddof=0, keepdims=True)
        centered = data - mean
        normalized = np.divide(
            centered, scale, out=np.zeros_like(data), where=scale != 0
        )
    if not np.isfinite(normalized).all():
        raise ValueError("Risultato non finito")
    return normalized


def main():
    source = np.array([[10, 5], [20, 5], [30, 5]], dtype=np.int64)
    before = source.copy()
    result = standardize_columns(source)
    np.testing.assert_array_equal(source, before)
    np.testing.assert_allclose(
        result[:, 0], [-np.sqrt(1.5), 0, np.sqrt(1.5)]
    )
    np.testing.assert_array_equal(result[:, 1], [0, 0, 0])
    np.testing.assert_allclose(result[:, 0].mean(), 0, atol=1e-12)
    np.testing.assert_allclose(result[:, 0].std(ddof=0), 1)
    print(result)


if __name__ == "__main__":
    main()
```

```bash
python normalization.py
```

`std(ddof=0)` usa un divisore N; `ddof=1` usa N-1 e richiede abbastanza osservazioni. pandas usa spesso ddof=1 per default: confrontare i risultati richiede la stessa convenzione.

Questa funzione non e una procedura di training: per normalizzare dati di test con statistiche di training devi conservare media/scala del training e riutilizzarle, senza ricalcolarle sul test.

Il cast a float64 puo perdere precisione per interi oltre `2**53`. Valori estremi possono causare `FloatingPointError` nelle riduzioni; il demo segnala il problema, non implementa un algoritmo robusto per ogni scala numerica. Per colonne quasi costanti scegli una soglia motivata dal dominio, non un epsilon arbitrario.

Il controllo riguarda il dtype ottenuto da `asarray`: una lista mista di booleani e interi puo essere gia stata convertita in un array intero. Per preservare e validare i tipi originali di un payload, controllali prima della conversione a NumPy.

## Varianti

### numerical_demo.py

```python
import numpy as np

matrix = np.array([[3.0, 1.0], [1.0, 2.0]])
target = np.array([9.0, 8.0])
solution = np.linalg.solve(matrix, target)
np.testing.assert_allclose(solution, [2.0, 3.0])
np.testing.assert_allclose(matrix @ solution, target)
assert not np.array_equal(matrix * matrix, matrix @ matrix)

wrapped = np.array([120], dtype=np.int8) + np.array([120], dtype=np.int8)
assert wrapped.item() == -16

first = np.random.default_rng(42).integers(0, 10, size=5)
second = np.random.default_rng(42).integers(0, 10, size=5)
np.testing.assert_array_equal(first, second)
print(solution)
```

```bash
python numerical_demo.py
```

- `*` moltiplica elemento per elemento; `@` esegue il prodotto matriciale secondo le forme.
- Per risolvere un sistema quadrato usa `solve`, non costruire inutilmente l'inversa. Una matrice singolare genera un errore; una quasi singolare puo produrre risultati numericamente instabili anche senza eccezioni.
- `allclose` dipende da tolleranza assoluta e relativa e ammette broadcasting: controlla anche le shape. Vicino a zero, il default assoluto puo essere troppo permissivo.
- `default_rng` evita di dipendere dal generatore globale; stesso seed e sequenza di chiamate riproducono il risultato nella stessa configurazione. Non e un generatore crittografico ne una promessa di compatibilita bit per bit fra tutte le versioni.
- `np.vectorize` facilita la sintassi ma esegue sostanzialmente un loop Python: non equivale a una ufunc compilata.
- Funzioni `nanmean/nanstd` ignorano NaN secondo il loro contratto; non decidono se ignorarli sia corretto per il problema.
- Il formato `.npy` conserva shape e dtype. Non caricare array object da fonti non fidate abilitando pickle.

## Errori comuni

- Risultato numerico corretto come forma ma sbagliato come significato: controlla gli assi.
- Modificare uno slice senza accorgersi che condivide memoria.
- Confondere casting con validazione o supporre assenza di overflow.
- Dividere per una deviazione standard nulla o nascondere NaN con zero.
- Assumere che ogni array contiguo sia indipendente o che ogni reshape copi.
- Allocare intermedi giganteschi nel tentativo di evitare ogni loop Python.

## Checklist

- Dtype, shape e assi sono espliciti?
- Mancanti, infinito e casi degeneri hanno una policy?
- Copia/view e mutazioni dell'input sono verificate?
- Tolleranze e ddof corrispondono al dominio?
- Risultati e memoria degli intermedi sono misurati?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/pandas|pandas]]
- [[Programmazione/Python/Pagine/Jupyter|Jupyter]]
- [[Programmazione/Python/Pagine/Cython|Cython]]
- [[Programmazione/Python/Pagine/Profiling|Profiling]]
- [[Programmazione/Python/Pagine/Memory Management|Memory Management]]

## Fonti

- [NumPy: tipi e overflow](https://numpy.org/doc/stable/user/basics.types.html).
- [Broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html).
- [Copie e viste](https://numpy.org/doc/stable/user/basics.copies.html).
- [Deviazione standard e ddof](https://numpy.org/doc/stable/reference/generated/numpy.std.html).
- [Sistemi lineari](https://numpy.org/doc/stable/reference/generated/numpy.linalg.solve.html).
- [allclose e tolleranze](https://numpy.org/doc/stable/reference/generated/numpy.allclose.html).
- [Generator e riproducibilita](https://numpy.org/doc/stable/reference/random/generator.html).
- [Limiti di vectorize](https://numpy.org/doc/stable/reference/generated/numpy.vectorize.html).
