---
date: 2026-03-17
tags:
  - programmazione
  - python
  - oop
type: #permanent-note
status: in_elaborazione
---

# Metodi di Classe e Metodi Statici in Python

## 💡 Concetto Chiave
In Python, oltre ai classici **metodi di istanza**, esistono decoratori per definire metodi legati alla classe o funzioni slegate dallo stato dell'oggetto:
1.  **@classmethod**: Opera sulla **classe** (riceve `cls`). Utile per costruttori alternativi.
2.  **@staticmethod**: Non ha accesso né a `self` né a `cls`. Funziona come una utility raggruppata logicamente nella classe.

---

## 📝 Sintassi

```python
class MiaClasse:
    def metodo_istanza(self):
        return "Accesso a self"

    @classmethod
    def metodo_classe(cls):
        return "Accesso a cls"

    @staticmethod
    def metodo_statico():
        return "Nessun accesso a stato"
```

---

## 🏗️ Metodi Principali e Differenze

| Tipo Metodo | Decoratore | Argomento | Scopo |
| :--- | :--- | :--- | :--- |
| **Istanza** | nessuno | `self` | Modificare lo stato di un singolo oggetto. |
| **Classe** | `@classmethod` | `cls` | Factory Methods o modifiche a variabili di classe. |
| **Statico** | `@staticmethod` | nessuno | Utility correlate alla classe senza dipendenze di stato. |

---

## 💻 Esempi Pratici

### Factory Method (@classmethod)
Permette di creare oggetti in modi differenti.
```python
class Data:
    def __init__(self, g, m, a):
        self.g, self.m, self.a = g, m, a

    @classmethod
    def da_stringa(cls, data_str):
        g, m, a = map(int, data_str.split("-"))
        return cls(g, m, a)

d = Data.da_stringa("17-03-2026")
```

### Utility (@staticmethod)
```python
class Calcolatrice:
    @staticmethod
    def somma(a, b):
        return a + b
```

---

## ⚙️ Logic Layer: Binding Dinamico e Polimorfismo

> [!INFO] Definizione: Binding di cls
> Nei `@classmethod`, `cls` non è fisso sulla classe genitrice. Se una sottoclasse eredita il metodo e lo chiama, `cls` punterà alla **sottoclasse**. Questo garantisce che il Factory Method crei un'istanza del tipo corretto anche in caso di ereditarietà.

I metodi statici, invece, non partecipano a questo meccanismo di binding; sono semplicemente funzioni "parcheggiate" nel namespace della classe per pulizia del codice.

---

## ⚠️ Best Practices & "Gotchas"

- ✅ **Da fare**: Usa `@classmethod` per fornire costruttori alternativi (standard molto comune in Python).
- ✅ **Da fare**: Usa nomi chiari per i metodi statici che indichino la loro natura di utility.
- ❌ **Da evitare**: Non usare `@staticmethod` se prevedi di dover accedere ad altri metodi della classe (usa `@classmethod`).
- 💣 **Errore comune**: Dimenticare il parametro `cls` nella definizione del metodo di classe.
- 💣 **Curiosità**: Puoi chiamare questi metodi sia dalla classe (`Classe.metodo()`) che dall'oggetto (`obj.metodo()`), ma la chiamata dalla classe è preferibile per chiarezza.
