---
date: 2026-05-14
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Classi e Istanze]
prerequisites: []
related: []
---
# Classi e Istanze in Python

## Sintesi

Nota su Classi e Istanze in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.

## Concetto chiave
In Python, la Programmazione Orientata agli Oggetti (OOP) si basa su **Classi** e **Istanze**.
- Una **Classe** è un "progetto" o un "modello" (blueprint) che definisce le caratteristiche e i comportamenti comuni a un gruppo di oggetti.
- Una **Istanza** è l'oggetto concreto creato a partire da quel progetto.

Immagina la classe come lo stampo per i biscotti e le istanze come i singoli biscotti prodotti.

---

##  Sintassi e Definizione
Si utilizza la keyword `class` seguita dal nome della classe (per convenzione in **PascalCase**).

```python
class NomeClasse:
    """Docstring opzionale per descrivere la classe."""
    
    # Attributo di Classe (condiviso da tutte le istanze)
    specie = "Generica"

    def __init__(self, parametro1, parametro2):
        """Metodo costruttore per inizializzare l'istanza."""
        # Attributi di Istanza (unici per ogni oggetto)
        self.parametro1 = parametro1
        self.parametro2 = parametro2

    def metodo_istanza(self):
        """Un'azione che l'oggetto può compiere."""
        print(f"Eseguo azione con {self.parametro1}")
```

### Il ruolo di `self`
`self` rappresenta l'istanza corrente della classe. È il primo parametro obbligatorio di ogni metodo di istanza e permette di accedere agli attributi e agli altri metodi dell'oggetto stesso.

---

##  Esempi Pratici

### Esempio Base: La classe Cane
```python
class Cane:
    def __init__(self, nome, razza):
        self.nome = nome
        self.razza = razza

    def abbaia(self):
        return f"{self.nome} dice: Bau!"

# Classi e Istanze in Python

## Sintesi

Nota su Classi e Istanze in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
mio_cane = Cane("Fido", "Pastore Tedesco")
tuo_cane = Cane("Luna", "Labrador")

print(mio_cane.abbaia())  # Output: Fido dice: Bau!
print(tuo_cane.nome)      # Output: Luna
```

### Esempio Avanzato: Gestione Conto Bancario
```python
class ContoBancario:
    def __init__(self, titolare, saldo_iniziale=0):
        self.titolare = titolare
        self.saldo = saldo_iniziale

    def deposita(self, importo):
        if importo > 0:
            self.saldo += importo
            print(f"Depositati {importo}€. Nuovo saldo: {self.saldo}€")
        else:
            print("Importo non valido.")

    def preleva(self, importo):
        if 0 < importo <= self.saldo:
            self.saldo -= importo
            print(f"Prelevati {importo}€. Saldo residuo: {self.saldo}€")
        else:
            print("Fondi insufficienti o importo non valido.")

# Classi e Istanze in Python

## Sintesi

Nota su Classi e Istanze in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
conto = ContoBancario("Mario Rossi", 1000)
conto.deposita(500)
conto.preleva(200)
```

---

## Logic layer: Cosa succede "sotto il cofano"?

### 1. Istanziazione e `__init__`
Quando chiami `Cane("Fido", "Pastore")`, Python:
1. Crea un nuovo oggetto vuoto in memoria.
2. Chiama il metodo `__init__` passando il nuovo oggetto come primo argomento (`self`).
3. Inizializza gli attributi all'interno dell'oggetto.

### 2. Attributi di Classe vs Istanza
- **Attributi di Istanza**: Definiti dentro `__init__` usando `self`. Ogni oggetto ha i propri valori.
- **Attributi di Classe**: Definiti direttamente sotto la riga `class`. Sono condivisi da tutte le istanze. Se modifichi un attributo di classe, il cambiamento è visibile a tutti gli oggetti (a meno che un oggetto non lo sovrascriva localmente).

### 3. Namespace dell'Oggetto (`__dict__`)
Ogni istanza mantiene un dizionario interno chiamato `__dict__` che contiene tutti i suoi attributi. Python cerca prima in questo dizionario, poi in quello della classe, e infine nelle classi genitrici.

---

##  Best Practices & "Gotchas"

-  **Da fare**: Usa sempre `self` come primo argomento dei metodi di istanza.
-  **Da fare**: Segui la convenzione **PascalCase** per i nomi delle classi (es. `UserAccount`, non `user_account`).
-  **Da evitare**: Non definire troppi attributi fuori dal metodo `__init__`; rende il codice meno prevedibile.
-  **Errore comune**: Dimenticare `self` durante la definizione di un metodo o quando si accede a un attributo interno.
-  **Attenzione**: Gli attributi di classe che sono **mutabili** (come liste o dizionari) possono causare effetti collaterali indesiderati se modificati da un'istanza.

```python
class ErroreCondivisione:
    lista_comune = [] # PERICOLOSO: condiviso da tutte le istanze!

    def aggiungi(self, item):
        self.lista_comune.append(item)
```
