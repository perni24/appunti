---
date: 2026-03-27
tags:
  - programmazione
  - python
  - internals
  - risorse
type: #permanent-note
status: budding
---

# Context Managers in Python

## 💡 Concetto Chiave
I **Context Managers** sono il meccanismo Pythonic per gestire risorse che devono essere inizializzate e poi rilasciate in modo sicuro, come file, lock, connessioni o transazioni.

Si usano tramite l'istruzione `with`, che garantisce l'esecuzione della fase di pulizia anche in presenza di errori.

```python
with open("dati.txt", "r", encoding="utf-8") as file:
    content = file.read()
```

In questo esempio il file viene chiuso automaticamente al termine del blocco, anche se durante la lettura si verifica un'eccezione.

> [!INFO] Perche sono importanti
> I context manager non servono solo alla comodita sintattica: rendono il codice piu sicuro, piu leggibile e riducono il rischio di lasciare aperte risorse esterne o di affidarsi troppo al [[Memory Management]] automatico.

---

## 📝 Sintassi

La forma piu comune e:

```python
with resource_expression as variable:
    # blocco protetto
    ...
```

### Esempio classico: gestione file

```python
with open("log.txt", "w", encoding="utf-8") as file:
    file.write("Operazione completata")
```

Equivale concettualmente a:

```python
file = open("log.txt", "w", encoding="utf-8")
try:
    file.write("Operazione completata")
finally:
    file.close()
```

Il vantaggio del `with` e che incapsula in modo pulito il pattern `try/finally`, molto legato alla gestione delle risorse e a [[Error Handling]].

---

## 💻 Esempi Pratici

### Gestione di un lock

```python
from threading import Lock

lock = Lock()

with lock:
    print("Sezione critica protetta")
```

Qui il lock viene acquisito all'ingresso del blocco e rilasciato in uscita.

### Context manager personalizzato con una classe

```python
class DatabaseConnection:
    def __enter__(self):
        print("Apro la connessione")
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        print("Chiudo la connessione")

with DatabaseConnection() as db:
    print("Uso la connessione")
```

### Context manager con `contextlib.contextmanager`

```python
from contextlib import contextmanager

@contextmanager
def managed_resource():
    print("Acquisizione risorsa")
    try:
        yield "resource"
    finally:
        print("Rilascio risorsa")

with managed_resource() as resource:
    print(resource)
```

Questo approccio e molto utile quando vuoi creare context manager leggeri senza definire una classe completa.

---

## ⚙️ Funzionamento Interno (Teoria)

### Il protocollo dei context manager
Un oggetto puo essere usato con `with` se implementa il protocollo:
- `__enter__()`
- `__exit__(exc_type, exc_value, traceback)`

#### `__enter__`
Viene chiamato all'inizio del blocco `with`.
- inizializza o acquisisce la risorsa;
- restituisce l'oggetto assegnato alla variabile dopo `as`.

#### `__exit__`
Viene chiamato sempre all'uscita dal blocco:
- se il blocco termina normalmente;
- se il blocco solleva un'eccezione.

Riceve informazioni sull'eventuale eccezione:
- `exc_type`
- `exc_value`
- `traceback`

### Gestione delle eccezioni
`__exit__` puo decidere se propagare o sopprimere un errore:

- se restituisce `False` o `None`, l'eccezione continua a propagarsi;
- se restituisce `True`, l'eccezione viene considerata gestita.

```python
class IgnoreError:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return True
```

Questo comportamento va usato con molta attenzione, perche può nascondere bug importanti.

---

## 🧠 Perche usare `with` invece di affidarsi al garbage collector

Affidarsi solo alla distruzione automatica degli oggetti non e sufficiente per gestire correttamente risorse esterne.

Esempi di risorse che vanno rilasciate esplicitamente:
- file;
- socket;
- connessioni a database;
- lock;
- transazioni;
- stream di rete.

Il rilascio della memoria e un problema diverso dal rilascio delle risorse. Per questo i context manager sono strettamente collegati a [[Memory Management]], ma non coincidono con esso.

> [!TIP] Regola pratica
> Se una risorsa ha una fase chiara di apertura e chiusura, `with` e spesso la soluzione piu sicura e leggibile.

---

## ⚠️ Best Practices & "Gotchas"

- ✅ **Usa `with` ogni volta che puoi:** soprattutto con file, lock, transazioni e connessioni.
- ✅ **Preferisci context manager espliciti al cleanup implicito:** il codice diventa piu prevedibile.
- ✅ **Usa `contextlib` per casi semplici:** il decorator `@contextmanager` riduce boilerplate.
- ✅ **Mantieni piccolo il blocco `with`:** piu il blocco e grande, piu e difficile capire quale risorsa e protetta.
- ❌ **Non sopprimere eccezioni senza motivo:** restituire `True` in `__exit__` puo mascherare errori seri.
- ❌ **Non confondere il context manager con l'oggetto restituito:** `__enter__` puo restituire anche un oggetto diverso da `self`.
- 💣 **Attenzione alle risorse annidate:** se gestisci molte risorse insieme, valuta strutture come `ExitStack` per mantenere il controllo ordinato.

---
