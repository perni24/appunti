---
date: 2026-03-05
tags:
  - programmazione
  - python
  - strutture-dati
type: #permanent-note
status: evergreen
---

# Tuple in Python

## 💡 Concetto Chiave
Le **tuple** sono collezioni di oggetti **ordinate** e **immutabili**. A differenza delle liste, una volta creata, una tupla non può essere modificata (non si possono aggiungere, rimuovere o sovrascrivere elementi). Sono spesso utilizzate per rappresentare record di dati o collezioni che devono rimanere costanti durante l'esecuzione del programma.

---

## 📝 Sintassi e Creazione

Le tuple si definiscono utilizzando le parentesi tonde `()` (anche se tecnicamente è la virgola a definire la tupla).

```python
# Creazione standard
punto = (10, 20)
colori = ("rosso", "verde", "blu")

# Tupla con un solo elemento (ATTENZIONE alla virgola)
singolo = (5,) # Senza virgola sarebbe solo un intero tra parentesi

# Creazione senza parentesi (Tuple Packing)
coordinate = 45.0, 9.0
```

### Accesso agli Elementi
L'accesso avviene tramite indice (0-indexed), esattamente come per le liste.
```python
print(colori[0]) # "rosso"
```

---

## 🏗️ Tuple Unpacking (Scompattamento)
Una delle funzionalità più potenti e "Pythonic" delle tuple. Permette di estrarre i valori direttamente in variabili separate.

```python
persona = ("Luca", 30, "Roma")

nome, eta, citta = persona

print(nome) # "Luca"
```

---

## ⚙️ Logic Layer: Perché usare le Tuple invece delle Liste?

### 1. Immutabilità e Sicurezza
Le tuple proteggono l'integrità dei dati. Se passi una tupla a una funzione, hai la garanzia che la funzione non possa modificarne il contenuto.

### 2. Performance
Dal punto di vista dell'implementazione in CPython, le tuple sono più efficienti delle liste:
- **Memoria:** Le tuple occupano meno spazio perché hanno una dimensione fissa e non necessitano di extra-allocazione per la crescita dinamica.
- **Velocità:** L'iterazione sulle tuple è leggermente più veloce rispetto alle liste.

### 3. Hashability (Dizionari)
Poiché sono immutabili, le tuple sono **hashable** (se contengono solo elementi a loro volta immutabili). Questo significa che possono essere utilizzate come **chiavi nei dizionari** o elementi nei **set**, cosa impossibile per le liste.

> [!INFO] Oggetti Mutabili dentro una Tupla
> Se una tupla contiene un oggetto mutabile (es. una lista), la lista stessa può essere modificata, ma il riferimento all'oggetto dentro la tupla rimane fisso.

---

## 🛠️ Metodi Disponibili
Essendo immutabili, le tuple hanno solo due metodi di ricerca:

| Metodo | Descrizione |
| :--- | :--- |
| `.count(x)` | Restituisce il numero di volte in cui il valore x appare nella tupla. |
| `.index(x)` | Restituisce l'indice della prima occorrenza del valore x. |

---
