---
date: 2026-03-04
tags:
  - programmazione
  - python
  - basi
type: #permanent-note
status: evergreen
---

# Strutture Condizionali in Python

## 💡 Concetto Chiave
Le strutture condizionali permettono di deviare il flusso di esecuzione del codice in base al verificarsi di determinate condizioni. In Python, l'elemento fondamentale è l'**indentazione**, che definisce quali istruzioni appartengono a quale blocco decisionale.

---

## 📝 Sintassi Fondamentale

### If, Elif, Else
La struttura classica per gestire scenari multipli. 

```python
eta = 18

if eta < 14:
    print("Bambino")
elif eta < 18:
    print("Adolescente")
else:
    print("Adulto")
```

- **`if`**: La condizione iniziale.
- **`elif`**: Abbreviazione di "else if", usata per testare condizioni aggiuntive se le precedenti sono false.
- **`else`**: Cattura tutto ciò che non è stato soddisfatto dalle condizioni precedenti.

### Operatore Ternario (Conditional Expression)
Python offre una sintassi contratta per assegnazioni condizionali semplici su una sola riga.

```python
# Sintassi: [valore_se_vero] if [condizione] else [valore_se_falso]
stato = "Maggiorenne" if eta >= 18 else "Minorenne"
```

---

## 🚀 Match Case (Python 3.10+)
Introdotto con il **Structural Pattern Matching**, è simile allo `switch` di altri linguaggi ma molto più potente.

```python
status_code = 404

match status_code:
    case 200:
        print("Success")
    case 400 | 404: # Operatore OR (|) nei pattern
        print("Client Error")
    case 500:
        print("Server Error")
    case _: # Pattern wildcard (default)
        print("Unknown Status")
```

---

## 🏗️ Logic Layer: Verità in Python (Truthy & Falsy)
Python valuta come `False` non solo il booleano `False`, ma anche diversi tipi di valori "vuoti":
- `None`
- `0` (zero)
- `""` (stringa vuota)
- `[]`, `{}`, `()` (collezioni vuote)

Tutto il resto viene generalmente valutato come `True`.

> [!WARNING] Attenzione
> Non è necessario scrivere `if x == True:`. La forma idiomatica Python (Pythonic) è semplicemente `if x:`.

---