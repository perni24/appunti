---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: beginner
tags: [python, argparse, cli, standard-library]
aliases: [argparse, CLI Python]
prerequisites: [Funzioni]
related: [Subprocess, Standard Library]
---

# CLI con argparse

## Sintesi

`argparse` e il modulo standard per creare interfacce a riga di comando in Python. Gestisce argomenti posizionali, opzioni, flag, conversioni di tipo, validazione di scelte e help automatico.

E la scelta naturale per CLI semplici o medie quando non vuoi aggiungere dipendenze esterne.

## Quando usarlo

Usa `argparse` quando:

- devi trasformare uno script in uno strumento CLI;
- vuoi help automatico con `--help`;
- servono opzioni e argomenti posizionali;
- devi validare valori semplici;
- vuoi evitare parsing manuale di `sys.argv`.

Per CLI molto grandi o con UX piu ricca, puoi valutare librerie esterne come Typer o Click.

## Come funziona

Si crea un parser, si dichiarano gli argomenti e poi si chiama `parse_args()`.

```python
import argparse


parser = argparse.ArgumentParser(description="Elabora un file")
parser.add_argument("path")
parser.add_argument("--verbose", action="store_true")

args = parser.parse_args()

print(args.path)
print(args.verbose)
```

`argparse` legge gli argomenti dalla riga di comando, converte i valori dichiarati e produce un oggetto `Namespace`.

## API / Sintassi

Argomento posizionale:

```python
parser.add_argument("path")
```

Opzione con default:

```python
parser.add_argument("--retries", type=int, default=3)
```

Flag booleano:

```python
parser.add_argument("--verbose", action="store_true")
```

Scelte ammesse:

```python
parser.add_argument("--format", choices=["json", "csv"], default="json")
```

Subcommand:

```python
subparsers = parser.add_subparsers(dest="command", required=True)
subparsers.add_parser("run")
subparsers.add_parser("check")
```

## Esempio pratico

CLI per copiare un file trasformando il testo in maiuscolo.

```python
import argparse
from pathlib import Path


def parse_args():
    parser = argparse.ArgumentParser(description="Converti un file in maiuscolo")
    parser.add_argument("source", type=Path)
    parser.add_argument("target", type=Path)
    parser.add_argument("--overwrite", action="store_true")
    return parser.parse_args()


def main():
    args = parse_args()

    if args.target.exists() and not args.overwrite:
        raise SystemExit("Target exists. Use --overwrite to replace it.")

    text = args.source.read_text(encoding="utf-8")
    args.target.write_text(text.upper(), encoding="utf-8")


if __name__ == "__main__":
    main()
```

## Varianti

- **Argomenti posizionali**: obbligatori e ordinati.
- **Opzioni**: valori con nome, come `--port 8000`.
- **Flag**: booleani, come `--verbose`.
- **Subcommand**: comandi annidati, come `git commit`.
- **Parsing separato dalla logica**: `parse_args()` prepara input, `main()` coordina l'esecuzione.

## Errori comuni

- Leggere `sys.argv` manualmente per CLI non banali.
- Mescolare parsing e logica applicativa.
- Non fornire descrizioni e help utili.
- Non validare path, numeri o scelte.
- Usare default nascosti o incoerenti con la configurazione.
- Gestire errori con traceback rumorosi quando un messaggio CLI chiaro basterebbe.

## Checklist

- Gli argomenti hanno nomi chiari?
- `--help` spiega davvero come usare il comando?
- Tipi e scelte vengono validati dal parser?
- La logica applicativa e separata dal parsing?
- Gli errori per l'utente sono comprensibili?
- I path vengono gestiti con `Path` quando utile?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Subprocess]]
- [[Standard Library]]
- [[Configurazione e Variabili d Ambiente]]
- [[Gestione File]]
