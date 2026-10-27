---
date: 2026-07-30
area: Programmazione
topic: Promemoria Python
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - python
  - promemoria
  - file
  - pathlib
aliases:
  - Cheatsheet file Python
prerequisites: []
related:
  - "[[Programmazione/Python/Pagine/Gestione File]]"
  - "[[Programmazione/Python/Pagine/Context Managers]]"
title: Python - File e percorsi
---

# Python - File e percorsi

## Obiettivo

Promemoria per percorsi, lettura, scrittura e operazioni comuni sui file. Ogni blocco include import e dati necessari; dettagli nei collegamenti.

## Quando usarlo

Per I/O locale con `pathlib` e `with`. I percorsi degli esempi sono fidati: combinarli con `/` o usare `resolve` non costituisce una protezione per input non fidato.

## Procedura

1. Scegli la base: directory corrente oppure cartella dello script.
2. Definisci encoding e politica di scrittura: `x` crea, `a` aggiunge, `w` tronca.
3. Gestisci solo gli errori attesi e chiudi le risorse.

Baseline: **CPython 3.12.10**. Tutti i blocchi che modificano file lavorano in directory temporanee nuove, eliminate all'uscita. Non sostituire quei percorsi con dati reali senza verificare gli effetti.

## Snippet

### Creare un percorso dalla cartella dello script

Esegui questo blocco in un file `.py`: `__file__` non e normalmente disponibile in REPL o notebook. Non crea file.

```python
from pathlib import Path

base_dir = Path(__file__).resolve().parent
file_path = base_dir / "data" / "users.txt"
print(file_path.name, file_path.parent.name)  # users.txt data
print(file_path.is_absolute())               # True
```

`Path.cwd()` restituisce invece la directory corrente del processo. `Path("data/users.txt")` e relativo a quella directory, non allo script.

### Verificare e scomporre

```python
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory() as temporary_dir:
    file_path = Path(temporary_dir) / "archive.tar.gz"
    file_path.touch(exist_ok=False)
    print(file_path.exists(), file_path.is_file(), file_path.is_dir())
    print(file_path.name, file_path.stem, file_path.suffix)
    print(file_path.parent == Path(temporary_dir))
```

Output: `True True False`, `archive.tar.gz archive.tar .gz`, `True`. `exists` e un'osservazione, non una garanzia per l'apertura successiva: permessi o file possono cambiare.

### Leggere e riscrivere testo

```python
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory() as temporary_dir:
    file_path = Path(temporary_dir) / "note.txt"
    file_path.write_text("prima\n", encoding="utf-8", newline="\n")
    content = file_path.read_text(encoding="utf-8")
    file_path.write_text("dopo\n", encoding="utf-8", newline="\n")
    print(repr(content), repr(file_path.read_text(encoding="utf-8")))
    # 'prima\n' 'dopo\n'
```

**`write_text` sovrascrive**. Le scorciatoie aprono e chiudono il file; lettura e contenuto da scrivere stanno interamente in memoria. Le directory genitrici non vengono create automaticamente.

### Creare senza sovrascrivere

```python
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory() as temporary_dir:
    file_path = Path(temporary_dir) / "new.txt"
    with file_path.open("x", encoding="utf-8", newline="\n") as file:
        file.write("nuovo\n")
    print(file.closed)  # True
```

`x` genera `FileExistsError` se il percorso esiste. **`w` tronca subito**; `with` chiude anche su eccezione, ma non annulla scritture parziali.

### Aprire con with e aggiungere

```python
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory() as temporary_dir:
    file_path = Path(temporary_dir) / "events.txt"
    file_path.write_text("first\n", encoding="utf-8", newline="\n")
    with file_path.open("a", encoding="utf-8", newline="\n") as file:
        file.write("second\n")
    with file_path.open("r", encoding="utf-8") as file:
        content = file.read()
    print(repr(content), file.closed)  # 'first\nsecond\n' True
```

`a` crea un file assente o aggiunge in fondo. `write` non inserisce newline da solo.

### Leggere riga per riga

```python
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory() as temporary_dir:
    file_path = Path(temporary_dir) / "lines.txt"
    file_path.write_bytes(b"  alpha  \r\nbeta\n")
    with file_path.open(encoding="utf-8") as file:
        for line in file:
            value = line.removesuffix("\n")
            print(repr(value))  # '  alpha  ', poi 'beta'
```

La lettura testuale standard normalizza CRLF/CR/LF in `\n`. `removesuffix` conserva gli spazi; `strip` li toglierebbe. L'iterazione evita di caricare tutto, non limita la dimensione di una singola riga.

### File binari

```python
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory() as temporary_dir:
    source = Path(temporary_dir) / "source.bin"
    target = Path(temporary_dir) / "copy.bin"
    source.write_bytes(b"\x00\xff\r\n")
    data = source.read_bytes()
    target.write_bytes(data)
    print(target.read_bytes() == data, len(data))  # True 4
```

`read_bytes` non decodifica o traduce newline. **`write_bytes` sovrascrive**; per creare senza sostituire usa `open("xb")`. Per file grandi vedi la copia a blocchi nella teoria.

### Directory

```python
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory() as temporary_dir:
    directory = Path(temporary_dir) / "output" / "reports"
    directory.mkdir(parents=True, exist_ok=True)
    (directory / "result.txt").touch()
    print(sorted(path.name for path in directory.iterdir()))
    # ['result.txt']
```

`parents` crea i genitori mancanti. `exist_ok` tollera una directory gia presente, non un file al suo posto. `iterdir` non garantisce ordine.

### Cercare file

```python
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory() as temporary_dir:
    directory = Path(temporary_dir)
    (directory / "nested").mkdir()
    (directory / "a.md").touch()
    (directory / "nested" / "b.md").touch()
    direct = [p for p in directory.glob("*.md") if p.is_file()]
    recursive = [p for p in directory.rglob("*.md") if p.is_file()]
    print(sorted(p.name for p in direct))  # ['a.md']
    print(sorted(p.relative_to(directory).as_posix() for p in recursive))
    # ['a.md', 'nested/b.md']
```

`glob` non restituisce necessariamente solo file: qui li filtriamo. `rglob` cerca ricorsivamente; liste, alberi grandi e regole sui link richiedono attenzione. Nessuna di queste operazioni autorizza un percorso.

### Rinominare e rimuovere

```python
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory() as temporary_dir:
    directory = Path(temporary_dir) / "work"
    directory.mkdir()
    old_path = directory / "old.txt"
    old_path.write_text("demo", encoding="utf-8")
    new_path = old_path.rename(old_path.with_name("new.txt"))
    print(old_path.exists(), new_path.exists())  # False True
    new_path.unlink(missing_ok=True)
    directory.rmdir()
    print(directory.exists())  # False
```

**Rinomina e cancellazioni modificano il filesystem**. Usa il percorso restituito: `old_path` resta il vecchio nome. Su destinazione esistente `rename` puo sostituire un file su Unix, mentre su Windows genera `FileExistsError`. `missing_ok` tollera solo l'assenza; `rmdir` richiede una directory vuota.

### Copiare e spostare

```python
from pathlib import Path
from shutil import copy2, move
from tempfile import TemporaryDirectory

with TemporaryDirectory() as temporary_dir:
    directory = Path(temporary_dir)
    source = directory / "source.txt"
    copied = directory / "copy.txt"
    destination = directory / "moved.txt"
    source.write_text("demo", encoding="utf-8")
    copy2(source, copied)
    move(copied, destination)
    print(source.exists(), copied.exists(), destination.read_text(encoding="utf-8"))
    # True False demo
```

Destinazioni nuove e nomi completi nel demo. **`copy2` puo sovrascrivere** e conserva solo i metadati supportati. Con una directory come destinazione, copia/spostamento usano quella directory; collisioni vanno gestite. `move` puo fare copia e cancellazione tra filesystem: non e sempre atomico.

## Adattamenti comuni

### Directory temporanea e cleanup

```python
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory() as temporary_dir:
    path = Path(temporary_dir) / "scratch.txt"
    path.write_text("temporaneo", encoding="utf-8")
    print(path.exists())  # True
print(path.exists())      # False
```

Il cleanup riguarda anche i file interni. Non mettere dati da conservare nella directory temporanea; chiudi prima eventuali handle, soprattutto su Windows.

### File opzionale assente

```python
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory() as temporary_dir:
    file_path = Path(temporary_dir) / "optional.txt"
    try:
        content = file_path.read_text(encoding="utf-8")
    except FileNotFoundError:
        content = None
    print(content)  # None
```

Solo l'assenza e trattata come opzionale: errori di permesso o di decodifica restano visibili.

## Debug rapido

- File non trovato: verifica base, directory corrente e genitori.
- `UnicodeDecodeError`: controlla la codifica; `errors="ignore"` puo perdere dati.
- File vuoto dopo errore: controlla apertura in `w` e scritture parziali.
- Collisioni o percorsi non fidati: non basta `exists` prima dell'operazione; consulta la procedura di automazione.

## Checklist finale

- Input e destinazione sono corretti e fidati?
- Creazione, aggiunta o sovrascrittura sono intenzionali?
- Encoding, dimensioni, errori e cleanup sono gestiti?

## Collegamenti

- [[Programmazione/Python/Pagine/Gestione File|Gestione File]]
- [[Programmazione/Python/Pagine/Context Managers|Context Managers]]
- [[Programmazione/Python/Pagine/Automazione file e script|Automazione file e script]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]
- [[Programmazione/Python/Promemoria/Pagine/Python - JSON e CSV|Promemoria JSON e CSV]]
- [[Programmazione/Python/Promemoria/Indice Promemoria Python|Indice Promemoria Python]]

## Fonti

- [Python 3.12: pathlib](https://docs.python.org/3.12/library/pathlib.html).
- [Python 3.12: open](https://docs.python.org/3.12/library/functions.html#open).
- [Python 3.12: shutil](https://docs.python.org/3.12/library/shutil.html).
- [Python 3.12: tempfile](https://docs.python.org/3.12/library/tempfile.html).
