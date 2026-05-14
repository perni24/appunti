---
date: 2026-05-14
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Error Handling (Gestione delle Eccezioni)]
prerequisites: []
related: []
---
# Error Handling (Gestione delle Eccezioni) in Python

## Sintesi

Nota su Error Handling (Gestione delle Eccezioni) in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.

## Concetto chiave
In Python, gli errori rilevati durante l'esecuzione sono chiamati **eccezioni**. La gestione delle eccezioni permette al programma di rispondere a eventi imprevisti (come un file mancante o una divisione per zero) senza interrompersi bruscamente.

---

##  La Struttura `try-except`

La gestione avviene tramite un blocco che "tenta" l'esecuzione e uno che "cattura" l'eventuale errore.

```python
try:
    numero = int(input("Inserisci un numero: "))
    risultato = 10 / numero
except ValueError:
    print("Errore: devi inserire un numero intero.")
except ZeroDivisionError:
    print("Errore: non puoi dividere per zero.")
```

### Blocchi Aggiuntivi: `else` e `finally`
- **`else`**: Viene eseguito solo se il blocco `try` **non** ha sollevato eccezioni.
- **`finally`**: Viene eseguito **sempre**, indipendentemente dal fatto che sia avvenuto un errore o meno. Utile per la pulizia delle risorse (es. chiudere un database).

```python
try:
    file = open("dati.txt", "r")
except FileNotFoundError:
    print("File non trovato.")
else:
    print("Lettura completata con successo.")
finally:
    print("Fine operazione.")
    # Nota: con 'with' questo viene gestito automaticamente
```

---

##  Sollevare Eccezioni (`raise`)

È possibile forzare il sollevamento di un'eccezione quando si verifica una condizione non valida per la logica dell'applicazione.

```python
def imposta_eta(eta):
    if eta < 0:
        raise ValueError("L'età non può essere negativa!")
    print(f"Età impostata a {eta}")
```

---

## Logic layer: EAFP vs LBYL

Python sposa fermamente la filosofia **EAFP** (*Easier to Ask for Forgiveness than Permission*), contrapposta alla **LBYL** (*Look Before You Leap*) tipica di linguaggi come il C.

- **LBYL (Non tipico di Python)**: Controlli preventivi con molti `if`.
- **EAFP (Pythonic)**: Tenta l'operazione e gestisci il fallimento se avviene. È più performante in scenari dove l'eccezione è un evento raro ed evita condizioni di "race condition" (es. controllare se un file esiste e poi aprirlo, ma nel frattempo un altro processo lo cancella).

---

##  Best Practices

> [!CAUTION] Bare Except
> Evita sempre di usare un `except:` generico senza specificare l'errore. Questo catturerà anche `SystemExit` e `KeyboardInterrupt` (Ctrl+C), rendendo difficile terminare il programma. Usa almeno `except Exception:` se devi proprio catturare tutto il resto.

> [!TIP] Informazioni sull'errore
> Puoi ottenere l'oggetto eccezione per loggare il messaggio d'errore originale: `except ValueError as e:`.

---
