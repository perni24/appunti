---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [python, programming, file]
aliases: [Gestione dei File]
prerequisites: []
related: []
---

# Gestione dei File in Python

## Sintesi

Python gestisce i file principalmente con `open()` e con il costrutto `with`. La pratica consigliata e aprire i file con un context manager, specificare sempre l'encoding per i file di testo e preferire `pathlib.Path` per manipolare percorsi in modo portabile.

## Quando usarlo

La gestione file serve quando un programma deve:

- leggere configurazioni o input;
- scrivere report, log o output;
- processare dati riga per riga;
- lavorare con file binari;
- creare, controllare o combinare percorsi sul filesystem.

## Come funziona

La forma piu sicura e:

```python
with open("data.txt", "r", encoding="utf-8") as file:
    content = file.read()
```

`with` garantisce la chiusura del file anche se durante la lettura avviene un errore.

Per file grandi, evita `read()` e itera direttamente sulle righe.

```python
with open("data.txt", encoding="utf-8") as file:
    for line in file:
        print(line.strip())
```

## API / Sintassi

Modalita principali di apertura:

| Modalita | Significato | Effetto |
|---|---|---|
| `r` | read | legge un file esistente |
| `w` | write | scrive sovrascrivendo il file |
| `a` | append | aggiunge in fondo al file |
| `x` | exclusive create | crea un file fallendo se esiste gia |
| `b` | binary | apre in modalita binaria |
| `t` | text | apre in modalita testo |

Metodi comuni:

- `read()`: legge tutto il file;
- `readline()`: legge una riga;
- `readlines()`: legge tutte le righe in una lista;
- `write(text)`: scrive una stringa;
- `writelines(lines)`: scrive una sequenza di stringhe.

Con `pathlib`:

```python
from pathlib import Path

path = Path("reports") / "summary.txt"

if path.exists():
    print(path.read_text(encoding="utf-8"))
```

## Esempio pratico

Lettura di un file di input e scrittura di un output pulito.

```python
from pathlib import Path

source = Path("input.txt")
target = Path("output.txt")

lines = []

with source.open(encoding="utf-8") as file:
    for line in file:
        cleaned = line.strip()
        if cleaned:
            lines.append(cleaned.lower())

with target.open("w", encoding="utf-8") as file:
    for line in lines:
        file.write(f"{line}\n")
```

Per dataset grandi, la stessa logica puo essere trasformata in una pipeline con generatori.

## Varianti

- **File di testo**: usa stringhe e specifica `encoding`.
- **File binari**: usa modalita come `rb` e `wb`.
- **Percorsi con `pathlib`**: evita concatenazioni manuali di stringhe.
- **File temporanei**: usa `tempfile` quando il file serve solo durante una procedura.
- **Formati strutturati**: usa moduli come `json`, `csv` o `tomllib` invece di parsing manuale.

```python
with open("image.png", "rb") as file:
    data = file.read()
```

## Errori comuni

- Non chiudere il file o non usare `with`.
- Non specificare `encoding` nei file di testo.
- Usare `read()` su file molto grandi.
- Usare `w` quando si voleva aggiungere contenuto con `a`.
- Costruire percorsi con concatenazioni fragili invece di `pathlib`.
- Confondere testo e binario.

## Checklist

- Il file va letto tutto o riga per riga?
- L'encoding e esplicito?
- La modalita (`r`, `w`, `a`, `x`, `b`) e quella corretta?
- Il codice usa `with` o un context manager equivalente?
- Per i percorsi conviene usare `Path`?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Context Managers]]
- [[Error Handling]]
- [[Generatori]]
- [[Standard Library]]
