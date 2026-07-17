---
date: 2026-06-03
area: Programmazione
topic: Python
type: operational-note
status: "non revisionato"
publish: true
difficulty: beginner
tags: [programmazione, python, automazione, scripting]
aliases: [Automazione Python, Script Python]
prerequisites: []
related: []
---

# Automazione file e script

## Sintesi

Python e molto usato per automatizzare operazioni ripetitive su file, cartelle, dati e comandi di sistema. Uno script utile deve essere chiaro, ripetibile e prudente quando modifica o cancella file.

Gli strumenti principali sono `pathlib`, `shutil`, `csv`, `json`, `argparse`, `logging` e `subprocess`.

## Quando usarlo

Usa script Python per:

- rinominare file;
- pulire cartelle;
- generare report;
- convertire formati;
- leggere e scrivere dati;
- orchestrare comandi esterni;
- sostituire procedure manuali ripetitive.

## Come funziona

Esempio semplice con `pathlib`:

```python
from pathlib import Path

for path in Path("logs").glob("*.log"):
    if path.stat().st_size == 0:
        print(f"Empty log: {path}")
```

Prima stampa cosa farebbe lo script. Solo dopo, se il risultato e corretto, aggiungi operazioni distruttive come `unlink()`.

## API / Sintassi

Moduli utili:

- `pathlib`: path e filesystem;
- `shutil`: copia, spostamento, rimozione directory;
- `csv`: lettura e scrittura CSV;
- `json`: dati JSON;
- `argparse`: parametri CLI;
- `logging`: messaggi operativi;
- `subprocess`: comandi esterni.

Pattern con dry-run:

```python
from pathlib import Path


def remove_empty_files(directory, dry_run=True):
    for path in Path(directory).glob("*"):
        if path.is_file() and path.stat().st_size == 0:
            if dry_run:
                print(f"Would remove {path}")
            else:
                path.unlink()
```

## Esempio pratico

Rinominare file `.txt` aggiungendo un prefisso:

```python
from pathlib import Path


def add_prefix(directory, prefix, dry_run=True):
    for path in Path(directory).glob("*.txt"):
        target = path.with_name(f"{prefix}{path.name}")

        if dry_run:
            print(f"{path} -> {target}")
            continue

        path.rename(target)


add_prefix("documents", "archivio - ", dry_run=True)
```

Il primo run deve essere in dry-run. Quando l'elenco e corretto, si puo rieseguire con `dry_run=False`.

## Varianti

- **Script monouso**: breve, ma comunque leggibile.
- **CLI con `argparse`**: quando lo script deve essere riutilizzato.
- **Automazione con log**: utile per processi schedulati.
- **Subprocess**: per orchestrare tool esterni.
- **Report generation**: lettura dati e scrittura output.
- **Batch filesystem**: operazioni massive su cartelle.

## Errori comuni

- Non fare dry-run prima di modifiche massive.
- Usare path come stringhe invece di `pathlib`.
- Non gestire encoding.
- Non controllare collisioni di nome prima di rinominare.
- Cancellare file senza log o conferma.
- Dipendere dalla directory corrente senza renderla esplicita.
- Non gestire errori di permessi o file bloccati.

## Checklist

- Lo script mostra cosa fara prima di modificare file?
- Usa `Path` invece di concatenare stringhe?
- Gestisce encoding e formati correttamente?
- Evita overwrite accidentali?
- Ha log o output comprensibile?
- Le operazioni distruttive sono controllate da `dry_run` o conferma?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Gestione File]]
- [[Subprocess]]
- [[CLI con argparse]]
- [[Logging]]
- [[Standard Library]]
