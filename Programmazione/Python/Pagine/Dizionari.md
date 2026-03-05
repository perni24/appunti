---
date: 2026-03-05
tags:
  - programmazione
  - python
  - strutture-dati
type: #permanent-note
status: evergreen
---

# Dizionari in Python

## 💡 Concetto Chiave
I **Dizionari** (`dict`) sono collezioni **mutabili** di elementi archiviati come coppie **Chiave-Valore** (*Key-Value*). Sono ottimizzati per il recupero rapido dei dati: invece di usare un indice numerico, si utilizza una chiave unica per "mappare" e trovare il valore associato.

---

## 📝 Sintassi e Operazioni Base

### Creazione e Accesso
Le chiavi devono essere **immutabili** (stringhe, numeri o tuple), mentre i valori possono essere di qualsiasi tipo.

```python
# Definizione con graffe
utente = {
    "id": 101,
    "nome": "Luca",
    "email": "luca@esempio.com"
}

# Accesso tramite chiave
print(utente["nome"]) # "Luca"

# ATTENZIONE: se la chiave non esiste, l'accesso diretto solleva KeyError.
# Usa il metodo .get() per un accesso sicuro:
print(utente.get("telefono", "N/A")) # Restituisce "N/A" invece di un errore
```

### Modifica e Aggiunta
```python
utente["email"] = "nuova_email@esempio.com" # Aggiornamento
utente["attivo"] = True                      # Aggiunta di una nuova coppia
```

---

## 🏗️ Metodi Principali

| Metodo | Descrizione |
| :--- | :--- |
| `.keys()` | Restituisce una vista di tutte le **chiavi**. |
| `.values()` | Restituisce una vista di tutti i **valori**. |
| `.items()` | Restituisce una vista di coppie **(chiave, valore)**. |
| `.update(dict2)` | Unisce dic1 con dic2 (sovrascrivendo le chiavi comuni). |
| `.pop(key)` | Rimuove la chiave specificata e ne restituisce il valore. |

---

## 🔄 Iterazione sui Dizionari
Il modo più comune per iterare è usare `.items()` per ottenere sia la chiave che il valore contemporaneamente.

```python
for chiave, valore in utente.items():
    print(f"{chiave}: {valore}")
```

---

## ⚙️ Logic Layer: Come funzionano i Dizionari?

### 1. Performance (Hash Table)
I dizionari in Python sono implementati come **Hash Table**. Quando cerchi una chiave, Python calcola il suo "hash" per trovare direttamente la posizione in memoria.

> [!INFO] Complessità Computazionale (Big O)
> - **Ricerca/Inserimento/Cancellazione:** $O(1)$ in media.
> Questo rende i dizionari estremamente efficienti per dataset di grandi dimensioni.

### 2. Ordinamento
Fino a Python 3.6, l'ordine degli elementi in un dizionario era casuale.
**Da Python 3.7+**, i dizionari garantiscono di mantenere l'**ordine di inserimento** degli elementi.

---
