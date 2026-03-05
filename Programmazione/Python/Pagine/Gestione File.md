---
date: 2026-03-04
tags:
  - programmazione
  - python
  - file
type: #permanent-note
status: evergreen
---

# Gestione dei File in Python

## 💡 Concetto Chiave
La gestione dei file è una competenza fondamentale per interagire con il sistema operativo, leggere dati persistenti o salvare output. In Python, l'interazione con i file avviene principalmente tramite la funzione integrata `open()`. La best practice assoluta è l'utilizzo dello statement `with`, che gestisce automaticamente la chiusura delle risorse.

---

## 📝 Apertura e Modalità (Modes)
La funzione `open(file, mode)` richiede il percorso del file e la modalità di apertura.

| Modo | Descrizione | Note |
| :--- | :--- | :--- |
| `'r'` | **Read** (Default) | Apre il file in lettura. Errore se non esiste. |
| `'w'` | **Write** | Apre in scrittura. Sovrascrive il file esistente (o lo crea). |
| `'a'` | **Append** | Apre in scrittura aggiungendo dati alla fine senza cancellare il contenuto. |
| `'x'` | **Create** | Crea il file. Errore se il file esiste già. |
| `'b'` | **Binary** | Modalità binaria (es. per immagini o eseguibili). |
| `'t'` | **Text** (Default) | Modalità testo. |

---

## 🏗️ Lo Statement `with` (Context Manager)
Utilizzare `with` garantisce che il file venga chiuso correttamente anche se si verifica un'eccezione durante l'elaborazione, evitando perdite di memoria o corruzione dei dati.

```python
# Modalità standard e sicura
with open("dati.txt", "r", encoding="utf-8") as file:
    contenuto = file.read()
    print(contenuto)
# Qui il file è già chiuso automaticamente
```

---

## 📖 Lettura e Scrittura

### Metodi di Lettura
- `read()`: Legge l'intero file come stringa.
- `readline()`: Legge una sola riga alla volta.
- `readlines()`: Restituisce una lista dove ogni elemento è una riga del file.

### Metodi di Scrittura
- `write(stringa)`: Scrive la stringa specificata.
- `writelines(lista)`: Scrive una lista di stringhe (attenzione: non aggiunge automaticamente i newline `\n`).

```python
linee = ["Prima riga\n", "Seconda riga\n"]
with open("output.txt", "w") as f:
    f.writelines(linee)
```

---

## ⚙️ Logic Layer: Encoding e Buffer
In Python 3, le stringhe sono Unicode (UTF-8). È sempre caldamente consigliato specificare l'**encoding** esplicitamente per evitare problemi di compatibilità tra sistemi operativi (es. Windows vs Linux).

> [!TIP] Gestione Path moderne
> Per una gestione dei percorsi più robusta e cross-platform, è preferibile utilizzare il modulo `pathlib` della Standard Library invece di manipolare stringhe casuali.

```python
from pathlib import Path

percorso = Path("documenti") / "report.txt"
if percorso.exists():
    print(f"File trovato in: {percorso.absolute()}")
```

---