---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - automazione
  - script
aliases:
  - Script di automazione
  - Automation scripts
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Configurazione applicativa]]"
  - "[[Programmazione/Clean Code/Pagine/Gestione esplicita degli errori]]"
related:
  - "[[Programmazione/Clean Code/Pagine/File system e IO]]"
  - "[[Programmazione/Clean Code/Pagine/Logging e tracing]]"
  - "[[Programmazione/Clean Code/Pagine/Pipeline dati leggibili]]"
title: Script di automazione
---

# Script di automazione

## Sintesi

Uno script operativo deve rendere prevedibili **il primo avvio, il secondo e un fallimento a metà**. Per l'export del listino scegliamo questo contratto: anteprima per default, nessun file se ci sono scarti, creazione solo su richiesta e nessuna sovrascrittura implicita.

## Esempio: export ripetibile del listino

`export_catalog.py`, accanto a `catalog_parse.py` e `catalog_pipeline.py` delle note collegate. L'input è un piccolo CSV UTF-8 e la cartella di destinazione deve esistere. A parità di record **e ordine** il JSON in UTF-8 ha gli stessi byte.

```python
import argparse
import json
import sys
from pathlib import Path
from catalog_pipeline import read_catalog


def export_catalog(source, target, apply):
    with source.open(encoding="utf-8", newline="") as stream:
        products, issues = read_catalog(stream)
    if issues:
        first = issues[0]
        raise ValueError(f"{len(issues)} scarti; primo: linea {first['line']}, {first['code']}")
    data = (json.dumps(products, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    try:
        old = target.read_bytes()
    except FileNotFoundError:
        pass
    else:
        if old == data:
            return "unchanged"
        raise ValueError("Destinazione presente con contenuto diverso")
    if not apply:
        return "would_create"
    with target.open("xb") as stream:
        stream.write(data)
    return "created"


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("target", type=Path)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    try:
        print(export_catalog(args.source, args.target, args.apply))
    except (OSError, ValueError) as error:
        print(error, file=sys.stderr)
        sys.exit(1)
```

## Esecuzione

Verifica l'input e confronta il risultato atteso con la destinazione senza scrivere:

```sh
python export_catalog.py catalog.csv report.json
```

Crea il file solo se manca e il lotto è valido:

```sh
python export_catalog.py catalog.csv report.json --apply
```

`would_create`, `created` e `unchanged` sono esiti riusciti (exit code 0). Un file diverso o un lotto non valido producono codice 1 e un messaggio su stderr; gli errori negli argomenti sono gestiti da `argparse`. Il dry-run non prenota il nome: se un altro processo crea il file nel frattempo, `xb` rifiuta la nuova apertura.

## Limiti operativi

Creazione esclusiva **non** significa pubblicazione atomica. Un arresto durante la scrittura può lasciare un file parziale: al rilancio lo script vede contenuto diverso e si ferma. Controlla il file prima di scegliere una nuova destinazione; non cancellarlo automaticamente. Per lettori concorrenti o dati che devono sopravvivere a un guasto servono una strategia di pubblicazione e garanzie di persistenza adeguate al filesystem.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Configurazione applicativa|Configurazione applicativa]]
- [[Programmazione/Clean Code/Pagine/Gestione esplicita degli errori|Gestione esplicita degli errori]]
- [[Programmazione/Clean Code/Pagine/File system e IO|File system e IO]]
- [[Programmazione/Clean Code/Pagine/Logging e tracing|Logging e tracing]]
- [[Programmazione/Clean Code/Pagine/Pipeline dati leggibili|Pipeline dati leggibili]]

## Fonti

- The Twelve-Factor App
- Michael Nygard, *Release It!*
- Martin Fowler, *Refactoring*
- [Python 3.12: open e modalità di creazione esclusiva](https://docs.python.org/3.12/library/functions.html#open)
- [Python 3.12: argparse ed errori della CLI](https://docs.python.org/3.12/library/argparse.html)
