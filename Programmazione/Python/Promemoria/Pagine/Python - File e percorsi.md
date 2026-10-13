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

## Creare un percorso

```python
from pathlib import Path

base_dir = Path(__file__).resolve().parent
file_path = base_dir / "data" / "users.txt"
```

## Verificare

```python
file_path.exists()
file_path.is_file()
file_path.is_dir()
file_path.name
file_path.stem
file_path.suffix
file_path.parent
```

## Leggere e scrivere testo

```python
content = file_path.read_text(encoding="utf-8")
```

```python
file_path.write_text("Contenuto", encoding="utf-8")
```

## Context manager

```python
with file_path.open("r", encoding="utf-8") as file:
    content = file.read()
```

```python
with file_path.open("a", encoding="utf-8") as file:
    file.write("Nuova riga\n")
```

## Leggere riga per riga

```python
with file_path.open(encoding="utf-8") as file:
    for line in file:
        value = line.rstrip("\n")
```

## File binari

```python
data = file_path.read_bytes()
file_path.write_bytes(data)
```

## Directory

```python
directory = Path("output")
directory.mkdir(parents=True, exist_ok=True)
```

```python
for path in directory.iterdir():
    print(path)
```

## Cercare file

```python
markdown_files = list(directory.glob("*.md"))
all_markdown_files = list(directory.rglob("*.md"))
```

## Rinominare e rimuovere

```python
file_path.rename(file_path.with_name("new-name.txt"))
file_path.unlink(missing_ok=True)
directory.rmdir()
```

`rmdir()` richiede una directory vuota.

## Copiare e spostare

```python
from shutil import copy2, move

copy2(source, destination)
move(source, destination)
```

## File temporaneo

```python
from tempfile import TemporaryDirectory

with TemporaryDirectory() as temporary_dir:
    path = Path(temporary_dir)
```

## Approfondimento

- [[Programmazione/Python/Pagine/Gestione File|Gestione File]]
- [[Programmazione/Python/Pagine/Context Managers|Context Managers]]
- [[Programmazione/Python/Pagine/Automazione file e script|Automazione file e script]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]


## Navigazione

- [[Programmazione/Python/Promemoria/Indice Promemoria Python|Indice Promemoria Python]]
