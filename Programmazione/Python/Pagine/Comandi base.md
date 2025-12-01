# Guida Rapida ai Comandi Base di Python

Questa guida contiene una panoramica dei comandi e dei concetti fondamentali di Python.

## 1. Variabili e Tipi di Dati

### Dichiarazione di una Variabile

In Python, non è necessario dichiarare il tipo di una variabile. Il tipo viene assegnato dinamicamente in base al valore.

```python
# Python capisce automaticamente il tipo di dato
nome_variabile = "Ciao"   # Questa è una stringa (str)
nome_variabile = 100      # Ora è un intero (int)
nome_variabile = 10.5     # Ora è un numero in virgola mobile (float)
```

### Conversione di Tipo (Casting)

Se hai bisogno di specificare un tipo di dato, puoi usare le funzioni di "casting".

```python
x = int(10)      # x sarà 10 (intero)
y = str("ciao")  # y sarà "ciao" (stringa)
z = float(2.5)   # z sarà 2.5 (float)
w = bool(True)   # w sarà True (booleano)

# Esempio di conversione
numero_come_stringa = "123"
numero_reale = int(numero_come_stringa) # Converte la stringa in un intero
```

### Tipi di Dati Principali

-   **Testo**: `str` (es. `"Ciao"`)
-   **Numeri**: `int` (interi), `float` (decimali), `complex` (es. `1j`)
-   **Sequenze**:
    -   `list`: Una collezione ordinata e *modificabile* di elementi. Si crea con `[]`.
        ```python
        mia_lista = ["mela", "banana", "ciliegia"]
        ```
    -   `tuple`: Una collezione ordinata e *immutabile* di elementi. Una volta creata, non può essere cambiata. Si crea con `()`.
        ```python
        mia_tupla = ("mela", "banana", "ciliegia")
        ```
    -   `range`: Una sequenza immutabile di numeri (es. `range(0, 6)`).
-   **Mapping**: `dict` (dizionario). Una collezione di coppie `chiave:valore`.
    ```python
    persona = {"nome": "John", "eta": 36}
    ```
-   **Set**:
    -   `set`: Una collezione non ordinata e non indicizzata di elementi *unici*. È *modificabile*. Si crea con `{}`.
        ```python
        mio_set = {"mela", "banana", "ciliegia"}
        ```
    -   `frozenset`: Un `set` immutabile.
-   **Booleani**: `bool` (solo `True` o `False`).
-   **Binari**: `bytes`, `bytearray`, `memoryview`. Usati per gestire dati "grezzi", come il contenuto di un file.
-   **Nessun Valore**: `NoneType` (il cui unico valore è `None`).

### Assegnazione Multipla

Puoi assegnare un valore a più variabili o più valori a più variabili sulla stessa riga.

```python
# Assegna lo stesso valore a tre variabili
x = y = z = "Arancione"

# Assegna valori diversi a variabili diverse
x, y, z = "Arancione", "Banana", "Ciliegia"
```

### Variabili Globali

Una variabile creata all'interno di una funzione è locale. Per modificarla al di fuori, devi usare la keyword `global`.

```python
x = 10 # Variabile globale

def mia_funzione():
  global x
  x = 20 # Questa modifica la variabile globale

mia_funzione()
print(x) # Stamperà 20
```

---

## 2. Input e Output

### Stampare a Video

La funzione `print()` mostra un output sulla console.

```python
print("Ciao mondo")          # Stampa una stringa
mia_var = "mondo"
print("Ciao", mia_var)     # Stampa più elementi separati da uno spazio
print("Ciao " + mia_var)     # Concatena e stampa le stringhe

# Informazioni utili per il debug
print(type(mia_var))       # Stampa il tipo della variabile: <class 'str'>
```

---

## 3. Stringhe

Le stringhe sono sequenze di caratteri e possono essere trattate come array.

```python
testo = "Ciao Mondo"

# Accedere a un carattere (l'indice parte da 0)
print(testo[0])  # Stampa 'C'

# Lunghezza della stringa
print(len(testo)) # Stampa 10

# Ciclare su una stringa
for carattere in testo:
  print(carattere)

# Controllare la presenza di una sottostringa
print("Mondo" in testo)     # Stampa True
print("Pianeta" not in testo) # Stampa True

# Tagliare una stringa (slicing)
print(testo[0:4])  # Stampa "Ciao" (dal carattere 0 al 3)
print(testo[:4])   # Stampa "Ciao" (dall'inizio fino al 3)
print(testo[5:])   # Stampa "Mondo" (dal carattere 5 fino alla fine)

# Metodi utili
print(testo.upper()) # Stampa "CIAO MONDO"
print(testo.lower()) # Stampa "ciao mondo"
```

---

## 4. Strutture di Controllo

### `if`, `elif`, `else`

Permettono di eseguire blocchi di codice solo se certe condizioni sono verificate.

```python
a = 10
b = 20

if b > a:
  print("b è maggiore di a")
elif a == b:
  print("a e b sono uguali")
else:
  print("a è maggiore di b")
```

### `match` (dalla versione 3.10 di Python)

Utile per confrontare un valore con diversi casi possibili, simile a `switch`.

```python
scelta = 2

match scelta:
    case 1:
        print("Hai scelto 1.")
    case 2:
        print("Hai scelto 2.")
    case _: # Caso di default
        print("Scelta non valida.")
```

### Cicli `for` e `while`

-   **`for`**: itera su una sequenza (lista, tupla, stringa, etc.).
    ```python
    # Stampa i numeri da 0 a 4
    for i in range(5):
        print(i)
    ```
-   **`while`**: esegue il codice finché una condizione è vera.
    ```python
    i = 0
    while i < 5:
        print(i)
        i += 1 # Importante: incrementare il contatore per evitare un loop infinito
    ```
---

## 5. Funzioni

Le funzioni sono blocchi di codice riutilizzabili. Si definiscono con `def`.

```python
# Definizione della funzione
def mia_funzione(nome):
  """Questa è una docstring. Spiega cosa fa la funzione."""
  print("Ciao, " + nome)

# Chiamata della funzione
mia_funzione("Mondo") # Stampa "Ciao, Mondo"
```

**Nota sull'indentazione**: In Python, l'indentazione (lo spazio all'inizio di una riga) è fondamentale. Il codice che appartiene a una funzione, a un `if`, o a un ciclo deve essere indentato.

---

## 6. Moduli Utili

Per usare funzionalità extra, devi importare dei "moduli".

### Numeri Casuali (`random`)

```python
import random

# Stampa un numero intero casuale tra 1 e 9 (inclusi)
numero_casuale = random.randrange(1, 10)
print(numero_casuale)
```
