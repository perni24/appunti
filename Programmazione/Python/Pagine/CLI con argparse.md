---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - python
  - argparse
  - cli
  - standard-library
aliases:
  - argparse
  - CLI Python
prerequisites:
  - "[[Programmazione/Python/Pagine/Funzioni]]"
related:
  - "[[Programmazione/Python/Pagine/Subprocess]]"
  - "[[Programmazione/Python/Pagine/Standard Library]]"
title: CLI con argparse
---

# CLI con argparse

## Sintesi

`argparse` trasforma gli argomenti della riga di comando in un `Namespace`: gestisce posizionali, opzioni, conversioni, scelte e help. La validazione applicativa e gli effetti sui file restano responsabilita del programma.

Baseline: Python 3.12, esempi verificati con CPython 3.12.10 su Windows, non indicazione dell'ultima patch disponibile. I tre blocchi Python sono indipendenti.

## Quando usarlo

- Trasformare uno script in una CLI senza dipendenze aggiuntive.
- Dichiarare chiaramente input e default invece di indicizzare `sys.argv` a mano.
- Separare il parsing dalla logica per poterla provare con liste di argomenti.

Click e Typer sono alternative esterne; non servono per gli esempi di questa nota.

## Come funziona

`parse_args()` legge `sys.argv[1:]`. `parse_args(["file.txt", "--verbose"])` permette prove deterministiche: la lista non contiene il nome dello script.

### Parser autonomo

```python
import argparse
from pathlib import Path

def positive_int(value: str) -> int:
    number = int(value)
    if number <= 0:
        raise argparse.ArgumentTypeError("deve essere maggiore di zero")
    return number

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="inspect-file",
        description="Prepara le opzioni di lettura di un file",
        allow_abbrev=False,
    )
    parser.add_argument("path", type=Path, help="percorso da leggere")
    parser.add_argument("--limit", type=positive_int, default=10, help="limite > 0")
    parser.add_argument("--format", choices=["json", "csv"], default="json")
    parser.add_argument("--verbose", action="store_true")
    parser.add_argument("--color", action=argparse.BooleanOptionalAction, default=True)
    return parser

args = build_parser().parse_args(
    ["report.txt", "--limit", "3", "--verbose", "--no-color"]
)
print(args.path, args.limit, args.format, args.verbose, args.color)
# report.txt 3 json True False
```

L'esempio prepara le opzioni, non legge il file. `type=Path` costruisce un percorso ma non verifica esistenza o permessi. La funzione `positive_int` accetta la sintassi di `int()`, compresi segno positivo e underscore: per un formato piu restrittivo occorre validarlo esplicitamente.

## API / Sintassi

- `add_argument("path")`: posizionale obbligatorio in questa forma; `nargs="?"` lo rende opzionale.
- `--limit 3`: opzione con valore; `type` converte, `choices` limita i risultati ammessi.
- `action="store_true"`: flag senza valore. Non usare `type=bool`: anche `"false"` e una stringa non vuota.
- `BooleanOptionalAction`: genera sia `--color` sia `--no-color`, disponibile da Python 3.9.
- `nargs="+"`: uno o piu valori; `action="append"`: opzione ripetibile.
- `--`: termina le opzioni, utile per un percorso che inizia con `-`.
- `allow_abbrev=False`: evita che un prefisso non ambiguo venga accettato come opzione lunga.

### Help, errori ed exit code

Il comportamento ordinario e:

- `--help` stampa su stdout e solleva `SystemExit(0)`;
- input errato stampa usage/errore su stderr e solleva `SystemExit(2)`;
- la logica applicativa puo restituire un proprio codice, come 1 per un errore di I/O.

Non serve catturare `SystemExit` nel programma CLI; nei test e invece osservabile. Con `exit_on_error=False` puoi intercettare `ArgumentError` per gli errori di parsing. Questo non disabilita l'uscita di `--help` e non cambia una chiamata esplicita a `parser.error()`: verifica i casi richiesti sulla versione usata.

### Sottocomandi e dispatch

```python
import argparse

def run_command(args: argparse.Namespace) -> str:
    return f"run: {args.target}"

def check_command(args: argparse.Namespace) -> str:
    return "check: ok"

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="tool", allow_abbrev=False)
    commands = parser.add_subparsers(dest="command", required=True)
    run = commands.add_parser("run", allow_abbrev=False)
    run.add_argument("target")
    run.set_defaults(handler=run_command)
    check = commands.add_parser("check", allow_abbrev=False)
    check.set_defaults(handler=check_command)
    return parser

args = build_parser().parse_args(["run", "demo"])
print(args.handler(args))  # run: demo
```

I due handler restituiscono solo testo dimostrativo: non avviano processi e non effettuano controlli reali su un progetto.

## Esempio pratico

Script completo `uppercase.py`. Legge un piccolo file UTF-8, poi crea il risultato in modo esclusivo. `--overwrite` autorizza la sostituzione di un file esistente: puo distruggerne il contenuto.

```python
import argparse
from pathlib import Path
import sys

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Converti un piccolo file UTF-8 in maiuscolo",
        allow_abbrev=False,
    )
    parser.add_argument("source", type=Path)
    parser.add_argument("target", type=Path)
    parser.add_argument("--overwrite", action="store_true",
                        help="sostituisci il contenuto del target")
    return parser

def convert_file(source: Path, target: Path, *, overwrite: bool = False) -> None:
    if source.resolve() == target.resolve():
        raise ValueError("sorgente e destinazione coincidono")
    if target.exists() and source.samefile(target):
        raise ValueError("sorgente e destinazione indicano lo stesso file")
    content = source.read_text(encoding="utf-8")
    mode = "w" if overwrite else "x"
    with target.open(mode, encoding="utf-8", newline="") as output:
        output.write(content.upper())

def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        convert_file(args.source, args.target, overwrite=args.overwrite)
    except (OSError, UnicodeError, ValueError) as error:
        print(f"Errore: {error}", file=sys.stderr)
        return 1
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
```

Il controllo `exists()` iniziale serve per riconoscere lo stesso file; la protezione dalla sovrascrittura ordinaria e data da `"x"`, non da un precedente test di esistenza. Questo non e un confine di sicurezza per directory modificate da attaccanti.

Prerequisiti: script salvato come `uppercase.py`, file `input.txt` gia esistente e interprete attivo.

Help:

```powershell
python uppercase.py --help
```

Conversione senza sovrascrittura:

```powershell
python uppercase.py input.txt output.txt
```

Sostituzione intenzionale di `output.txt`:

```powershell
python uppercase.py input.txt output.txt --overwrite
```

Un nome che inizia con trattino, dopo il separatore delle opzioni:

```powershell
python uppercase.py -- -input.txt output.txt
```

## Varianti

- Per configurazione CLI + ambiente usa default che distinguano “assente” da `False`: vedi la nota collegata.
- `parse_known_args()` lascia argomenti non riconosciuti al chiamante: ha senso per wrapper, non per ignorare silenziosamente errori di battitura.
- Aprire i file dopo il parsing rende piu chiari ownership e cleanup rispetto a effetti di I/O durante la conversione degli argomenti.

## Errori comuni

- Eseguire il parsing all'importazione di un modulo riutilizzabile.
- Supporre che ogni posizionale sia sempre obbligatorio, indipendentemente da `nargs`.
- Usare un controllo `exists()` seguito da `"w"` come protezione dalla sovrascrittura.
- Confondere uscita 0 con prova che il contenuto sia semanticamente corretto.

## Checklist

- Help, default, errori e codici di uscita hanno un contratto?
- Il parser e provabile passando `argv`?
- Effetti distruttivi autorizzati esplicitamente?
- Test su file mancante, target esistente, stesso file e UTF-8 errato?

Limiti del convertitore: carica il file intero, puo cambiare il numero di caratteri con `upper()` e non offre scrittura atomica o rollback se la scrittura fallisce.

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Subprocess|Subprocess]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]
- [[Programmazione/Python/Pagine/Configurazione e Variabili d Ambiente|Configurazione e Variabili d Ambiente]]
- [[Programmazione/Python/Pagine/Gestione File|Gestione File]]
- [[Programmazione/Python/Pagine/Testing|Testing]]

## Fonti

- [Python 3.12: argparse](https://docs.python.org/3.12/library/argparse.html).
- [Tutorial ufficiale argparse](https://docs.python.org/3.12/howto/argparse.html).
- [Python 3.12: modalita di apertura dei file](https://docs.python.org/3.12/library/functions.html#open).
