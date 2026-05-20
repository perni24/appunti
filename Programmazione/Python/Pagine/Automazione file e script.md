---
date: 2026-05-20
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

## Concetto chiave

Script piccoli e chiari possono sostituire procedure manuali ripetitive.

```python
from pathlib import Path

for path in Path("logs").glob("*.log"):
    if path.stat().st_size == 0:
        path.unlink()
```

## Casi comuni

- Rinominare file.
- Convertire formati.
- Pulire cartelle.
- Generare report.
- Lanciare comandi esterni.

## Errori comuni

- Non fare dry-run prima di modifiche massive.
- Usare path come stringhe invece di `pathlib`.
- Non gestire encoding e file bloccati.

## Obiettivo

Da completare: descrivere cosa ottenere in pratica.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Procedura

1. Da completare.
2. Da completare.
3. Da completare.

## Snippet

```text
Da completare con codice o comando riutilizzabile.
```

## Adattamenti comuni

- Da completare: varianti per casi frequenti.

## Debug rapido

- Da completare: controlli rapidi in caso di errore.

## Checklist finale

- Da completare: verifiche finali.

## Collegamenti
- [[Programmazione/Python/Pagine/Gestione File|Gestione File]]
- [[Programmazione/Python/Pagine/Subprocess|Subprocess]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]


