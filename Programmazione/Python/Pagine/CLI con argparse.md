---
date: 2026-05-14
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [python, argparse, cli, standard-library]
aliases: [argparse, CLI Python]
prerequisites: [Funzioni]
related: [Subprocess, Standard Library]
---

# CLI con argparse

## Sintesi

`argparse` e il modulo standard per creare interfacce a riga di comando.

Gestisce argomenti, opzioni, help automatico e parsing dei valori.

## Esempio base

```python
import argparse

parser = argparse.ArgumentParser(description="Elabora un file")
parser.add_argument("path")
parser.add_argument("--verbose", action="store_true")

args = parser.parse_args()

print(args.path)
print(args.verbose)
```

## Tipi e default

```python
parser.add_argument("--retries", type=int, default=3)
```

`type` converte il valore letto dalla CLI.

## Scelte ammesse

```python
parser.add_argument("--format", choices=["json", "csv"], default="json")
```

`choices` limita i valori validi.

## Errori comuni

- Leggere `sys.argv` manualmente per CLI non banali.
- Dimenticare help e descrizioni.
- Non validare path o valori numerici.
- Mischiare troppa logica applicativa nel parsing.

## Collegamenti

- [[Programmazione/Python/Pagine/Subprocess|Subprocess]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]
