---
date: 2026-03-17
tags:
  - programmazione
  - python
  - oop
type: #permanent-note
status: in_elaborazione
---

# Proprietà (@property) in Python

## 💡 Concetto Chiave
Le **Proprietà** in Python permettono di gestire l'accesso agli attributi di una classe in modo controllato tramite il decoratore `@property`. 
Invece di accedere direttamente a una variabile, si definisce un metodo che si comporta come un attributo. Questo consente di aggiungere logica di validazione o calcolo senza cambiare l'interfaccia pubblica della classe.

---

## 📝 Sintassi e Definizione

Si utilizzano i decoratori per definire getter, setter e deleter.

```python
class Esempio:
    def __init__(self, valore):
        self._valore = valore  # Convenzione: '_' per attributi protetti

    @property
    def valore(self):
        """Getter: Restituisce il valore."""
        return self._valore

    @valore.setter
    def valore(self, nuovo_valore):
        """Setter: Imposta il valore con validazione."""
        if nuovo_valore < 0:
            raise ValueError("Il valore non può essere negativo!")
        self._valore = nuovo_valore

    @valore.deleter
    def valore(self):
        """Deleter: Operazioni prima della cancellazione."""
        del self._valore
```

---

## 💻 Esempi Pratici

### Esempio Base: Validazione
```python
class Persona:
    def __init__(self, eta):
        self.eta = eta  # Attiva il setter!

    @property
    def eta(self):
        return self._eta

    @eta.setter
    def eta(self, valore):
        if not isinstance(valore, int) or valore < 0:
            raise ValueError("Età non valida!")
        self._eta = valore
```

### Esempio Avanzato: Proprietà Calcolate
```python
class Rettangolo:
    def __init__(self, base, altezza):
        self.base = base
        self.altezza = altezza

    @property
    def area(self):
        return self.base * self.altezza
```

---

## ⚙️ Logic Layer: Descrittori e Incapsulamento

In Python, le proprietà sono implementate tramite il **Protocollo Descrittore**.

> [!INFO] Definizione: Descrittore
> Un descrittore è un oggetto che definisce almeno uno dei metodi `__get__`, `__set__` o `__delete__`. Il decoratore `@property` trasforma un metodo in un descrittore di dati, intercettando ogni tentativo di accesso all'attributo.

### Vantaggi dell'approccio Pythonico
A differenza di linguaggi come Java (dove si usano `getValore()` e `setValore()`), Python incoraggia l'uso di attributi pubblici inizialmente. Se in futuro serve aggiungere logica, si trasforma l'attributo in `@property` senza rompere il codice esterno (che continuerà a usare `oggetto.attributo`).

---

## ⚠️ Best Practices & "Gotchas"

- ✅ **Da fare**: Usa `@property` per mantenere l'interfaccia pulita e "Pythonica".
- ✅ **Da fare**: Usa nomi con prefisso `_` per memorizzare i dati reali (es. `self._valore`).
- ❌ **Da evitare**: Non inserire operazioni pesanti (I/O, DB) dentro una proprietà; deve sembrare un accesso veloce.
- 💣 **Errore comune**: Causare una **ricorsione infinita** usando `self.attributo = x` dentro il setter della stessa proprietà (invece di `self._attributo = x`).
- 💣 **Attenzione**: Una proprietà definita solo con `@property` è automaticamente **Read-Only**.
