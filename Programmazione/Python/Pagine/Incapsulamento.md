---
date: 2026-05-14
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Incapsulamento]
prerequisites: []
related: []
---
# Incapsulamento in Python

## Sintesi

Nota su Incapsulamento in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.

## Concetto chiave
L'**Incapsulamento** è uno dei pilastri della Programmazione Orientata agli Oggetti (OOP). Consiste nel raggruppare i dati (attributi) e i metodi che operano su di essi all'interno di una singola unità (la classe), limitando l'accesso diretto dall'esterno per proteggere l'integrità dell'oggetto.

A differenza di linguaggi come Java o C++, Python non ha modificatori di accesso rigidi (`public`, `private`, `protected`). Si basa invece su **convenzioni di denominazione**.

---

##  Livelli di Accesso e Sintassi

### 1. Pubblico (Standard)
Tutti gli attributi e i metodi sono pubblici per impostazione predefinita. Sono accessibili ovunque.
```python
self.nome = "Mario"
```

### 2. Protetto (Convenzione: `_`)
Si usa un singolo trattino basso come prefisso. Indica agli altri programmatori che l'attributo è destinato ad uso interno o per sottoclassi, ma Python **non ne impedisce** l'accesso.
```python
self._saldo = 1000
```

### 3. Privato (Convenzione: `__`)
Si usa un doppio trattino basso come prefisso. Python attiva un meccanismo chiamato **Name Mangling** per rendere l'accesso più difficile dall'esterno.
```python
self.__password = "12345"
```

---

##  Esempi Pratici

### Esempio Base: Accesso agli attributi
```python
class Account:
    def __init__(self, titolare, saldo):
        self.titolare = titolare      # Pubblico
        self._tipo = "Risparmio"       # Protetto
        self.__saldo = saldo          # Privato

acc = Account("Luca", 500)
print(acc.titolare)   # Funziona
print(acc._tipo)      # Funziona (ma sconsigliato)
# Incapsulamento in Python

## Sintesi

Nota su Incapsulamento in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
```

### Esempio Avanzato: Metodi Getter e Setter
Per gestire l'accesso agli attributi privati in modo controllato, si usano spesso i metodi getter e setter (o meglio, le `@property` in Python).

```python
class Banca:
    def __init__(self, saldo):
        self.__saldo = saldo

    def get_saldo(self):
        # Logica di controllo opzionale
        return self.__saldo

    def set_saldo(self, valore):
        if valore >= 0:
            self.__saldo = valore
        else:
            print("Errore: saldo non può essere negativo.")

conto = Banca(1000)
conto.set_saldo(1500)
print(conto.get_saldo())
```

---

## Logic layer: Name Mangling
Quando usi `__attributo`, Python rinomina internamente la variabile in `_NomeClasse__attributo`. 

Questo non serve a rendere il dato "segreto" in modo assoluto (puoi comunque accedervi conoscendo il nuovo nome), ma previene conflitti accidentali di nomi nelle gerarchie di ereditarietà.

```python
# Incapsulamento in Python

## Sintesi

Nota su Incapsulamento in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
print(acc._Account__saldo) # Funziona, ma è una pessima pratica
```

---

##  Best Practices & "Gotchas"

-  **Da fare**: Segui la convenzione `_` per segnalare che un attributo è "interno".
-  **Da fare**: Usa `@property` per un modo più "Pythonico" di gestire getter e setter.
-  **Da evitare**: Non abusare del doppio trattino basso `__` a meno che non sia strettamente necessario per evitare conflitti di nomi.
-  **Da evitare**: Non cercare di accedere ad attributi protetti o privati dall'esterno della classe; rispetta l'interfaccia pubblica.
-  **Errore comune**: Pensare che `__` garantisca una sicurezza reale. In Python, l'incapsulamento è basato sul consenso tra "adulti consenzienti" (*we are all consenting adults here*).
-  **Attenzione**: Gli attributi `__doppio_trattino__` (dunder) non sono privati, sono metodi speciali di Python. Non usarli per i tuoi attributi.
