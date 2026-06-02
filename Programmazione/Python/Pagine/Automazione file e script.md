---
date: 2026-06-02
area: Programmazione
topic: Python
type: operational-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - python
  - automazione
  - scripting
aliases: []
prerequisites: []
related: []
---

# Automazione file e script

## Sintesi

Python e molto usato per automatizzare operazioni su file, cartelle, dati e comandi di sistema.

## Quando usarlo

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Come funziona

### Concetto chiave
Script piccoli e chiari possono sostituire procedure manuali ripetitive.

```python
from pathlib import Path

for path in Path("logs").glob("*.log"):
    if path.stat().st_size == 0:
        path.unlink()
```
### Casi comuni
- Rinominare file.
- Convertire formati.
- Pulire cartelle.
- Generare report.
- Lanciare comandi esterni.

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

### Procedura
1. Da completare.
2. Da completare.
3. Da completare.

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

- Non fare dry-run prima di modifiche massive.
- Usare path come stringhe invece di `pathlib`.
- Non gestire encoding e file bloccati.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/Python/Pagine/Gestione File|Gestione File]]
- [[Programmazione/Python/Pagine/Subprocess|Subprocess]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]
