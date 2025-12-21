---
tags:
  - programmazione
  - python
  - teoria
argomento: Gestione Errori
data: 2025-12-20
stato: 🟢 completato
---

# Gestione degli Errori in Python

## 💡 Concetto Chiave
Python usa le **Eccezioni** per gestire gli errori.
La filosofia predominante è **EAFP** (*Easier to Ask for Forgiveness than Permission*): prova a fare l'operazione e gestisci l'errore se fallisce, piuttosto che controllare prima se è possibile farla (LBYL - *Look Before You Leap*).

---

## 📝 Sintassi

```python
try:
    # Codice che potrebbe sollevare un'eccezione
    risultato = 10 / 0
except ZeroDivisionError:
    # Gestione specifica dell'errore
    print("Non puoi dividere per zero!")
except Exception as e:
    # Catch-all (da usare con cautela)
    print(f"Errore generico: {e}")
else:
    # Eseguito SOLO se NON ci sono state eccezioni
    print("Tutto ok!")
finally:
    # Eseguito SEMPRE (pulizia risorse)
    print("Fine operazione")
```

---

## 💻 Esempi Pratici

### Esempio EAFP vs LBYL
```python
dizionario = {"chiave": "valore"}

# LBYL (Stile C/Java classico - Sconsigliato in Python)
if "chiave_segreta" in dizionario:
    print(dizionario["chiave_segreta"])
else:
    print("Chiave mancante")

# EAFP (Pythonic)
try:
    print(dizionario["chiave_segreta"])
except KeyError:
    print("Chiave mancante")
```
L'approccio EAFP è spesso più veloce (se l'eccezione è rara) e evita race conditions (in contesti concorrenti).

### Sollevare Eccezioni
```python
def valida_eta(eta):
    if eta < 0:
        raise ValueError("L'età non può essere negativa")
    return True
```

---

## ⚙️ Funzionamento Interno

### Gerarchia delle Eccezioni
Tutte le eccezioni ereditano da `BaseException`.
*   `BaseException`
    *   `SystemExit` (uscita script)
    *   `KeyboardInterrupt` (Ctrl+C)
    *   `Exception` (Tutte le eccezioni utente/standard)
        *   `ValueError`, `TypeError`, `OSError`, ...

### Traceback
Quando un'eccezione non viene gestita, Python risale lo stack delle chiamate (**unwinding**) fino a trovare un blocco `try` corrispondente. Se non lo trova, il programma termina stampando il traceback (la "storia" delle chiamate che hanno portato all'errore).

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Cattura eccezioni specifiche:** Mai usare `except:` nudo (cattura anche Ctrl+C!). Usa `except Exception:` se proprio devi catturare tutto, ma preferisci `except KeyError`, `except ValueError`, ecc.
- ✅ **Usa `else`:** Metti nel blocco `try` solo la riga che può fallire. Metti il codice successivo che dipende da quel successo nel blocco `else`.
- ✅ **Context Managers:** Per gestire file e risorse, usa `with open(...)` invece di `try...finally`. Gestisce la chiusura automatica anche in caso di errore.

## 📚 Riferimenti
- [Python Docs - Errors and Exceptions](https://docs.python.org/3/tutorial/errors.html)
