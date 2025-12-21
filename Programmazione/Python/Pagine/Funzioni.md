---
tags:
  - programmazione
  - python
  - teoria
argomento: Funzioni
data: 2025-12-20
stato: 🟢 completato
---

# Funzioni in Python

## 💡 Concetto Chiave
Le funzioni in Python sono **First-Class Citizens**: sono oggetti come interi o stringhe. Possono essere assegnate a variabili, passate come argomenti ad altre funzioni e restituite da altre funzioni (Higher-Order Functions).

---

## 📝 Sintassi

```python
def nome_funzione(param1, param2=default):
    """Docstring: Spiegazione della funzione."""
    # Corpo della funzione
    return valore
```

### Argomenti Variabili
*   `*args`: Raccoglie argomenti posizionali extra in una tupla.
*   `**kwargs`: Raccoglie argomenti keyword extra in un dizionario.

---

## 💻 Esempi Pratici

### Esempio Base
```python
def saluta(nome: str, urla=False) -> str:
    messaggio = f"Ciao {nome}"
    if urla:
        return messaggio.upper()
    return messaggio

print(saluta("Mario"))
print(saluta("Luigi", urla=True))
```

### Esempio Avanzato: *args e **kwargs
Utile per creare wrapper o funzioni flessibili.

```python
def stampa_tutto(titolo, *args, **kwargs):
    print(f"--- {titolo} ---")
    print("Posizionali:", args)
    print("Keyword:", kwargs)

stampa_tutto("Test", 1, 2, colore="rosso", size=10)
# Output:
# --- Test ---
# Posizionali: (1, 2)
# Keyword: {'colore': 'rosso', 'size': 10}
```

---

## ⚙️ Funzionamento Interno

### Scope LEGB
Quando Python cerca una variabile, segue questo ordine di risoluzione:
1.  **L**ocal: Dentro la funzione corrente.
2.  **E**nclosing: Nelle funzioni che racchiudono quella corrente (closure).
3.  **G**lobal: Al livello del modulo (file).
4.  **B**uilt-in: Funzioni predefinite (`len`, `print`, etc.).

### Passaggio per "Assegnamento" (Object Reference)
Python non è né "pass-by-value" né "pass-by-reference" nel senso classico del C++. Gli argomenti vengono passati per **assegnamento**.
*   Se passi un oggetto **mutabile** (lista) e lo modifichi dentro la funzione, la modifica si riflette fuori.
*   Se riassegni il parametro (`x = 5`), cambi solo il riferimento locale, non la variabile esterna.

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Docstrings:** Usa le triple virgolette `"""..."""` subito dopo `def` per documentare.
- ✅ **Type Hints:** Usa annotazioni di tipo per chiarire l'interfaccia (`def func(a: int) -> bool:`).
- 💣 **Mutable Default Arguments:** Trappola classica.
    ```python
    def appendi(val, lista=[]): # ❌ La lista è creata una volta sola!
        lista.append(val)
        return lista
    # appendi(1) -> [1]
    # appendi(2) -> [1, 2] !!!
    ```
    Usa `None` come default sentinel.

## 📚 Riferimenti
- [Python Docs - Defining Functions](https://docs.python.org/3/tutorial/controlflow.html#defining-functions)
