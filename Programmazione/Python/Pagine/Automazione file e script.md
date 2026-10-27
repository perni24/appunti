---
date: 2026-06-03
area: Programmazione
topic: Python
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - programmazione
  - python
  - automazione
  - scripting
aliases:
  - Automazione Python
  - Script Python
prerequisites: []
related: []
title: Automazione file e script
---

# Automazione file e script

## Obiettivo

Automatizzare operazioni ripetitive con una sequenza leggibile: **selezionare i file, costruire un piano, controllarlo, applicarlo e registrare l'esito**.

Il laboratorio aggiunge un prefisso ai file di testo. Parte in simulazione e lavora solo sui figli diretti di una cartella. Non e un sistema transazionale, un backup o uno strumento sicuro per directory modificate da soggetti non fidati.

## Quando usarlo

- Rinominare o organizzare un lotto di documenti.
- Cercare file vuoti senza cancellarli subito.
- Generare report CSV/JSON, convertire formati o orchestrare tool esterni.
- Rendere ripetibile una procedura prima svolta manualmente.

Per un'operazione monouso basta spesso uno script breve. Aggiungi CLI, log e test quando deve essere riutilizzato; non trasformare ogni script in un framework.

## Prerequisiti

Solo standard library, baseline **CPython 3.12.10 su Windows**. La procedura usa `Path.is_junction()`, disponibile da Python 3.12. Non sono necessarie dipendenze `pip`.

Lavora inizialmente su una copia dei file. Chiudi applicazioni che li modificano e sospendi eventuali sincronizzazioni durante la rinomina. La cartella deve essere fidata, accessibile e non modificata contemporaneamente.

| Strumento     | Compito                                    |
| ------------- | ------------------------------------------ |
| `pathlib`     | Percorsi, selezione e metadati             |
| `shutil`      | Copie, spostamenti e rimozioni di alberi   |
| `csv`, `json` | Formati strutturati, senza parsing manuale |
| `argparse`    | Parametri espliciti e help                 |
| `logging`     | Piano, operazioni completate ed errori     |
| `subprocess`  | Avvio controllato di altri programmi       |

`Path` rende le operazioni leggibili, ma non convalida automaticamente input o confini. Anche `os.path` e le API che accettano stringhe sono valide: il problema e concatenare percorsi senza capirne la semantica. [Percorsi Python](https://docs.python.org/3.12/library/pathlib.html).

## Procedura

1. Identifica la directory e mostra il suo percorso risolto. Un percorso relativo parte dalla directory corrente, non automaticamente da quella dello script.
2. Definisci estensioni, ricorsione, collegamenti e nomi gia elaborati.
3. Costruisci tutto il piano e controlla collisioni prima delle modifiche.
4. Esegui il dry-run e confronta l'elenco con il risultato desiderato.
5. Prepara un backup o una copia verificata; solo allora usa l'opzione di applicazione.
6. In caso di errore, fermati e leggi quali operazioni sono gia riuscite.
7. Controlla file e contenuto dopo l'esecuzione. Una seconda esecuzione non dovrebbe aggiungere un altro prefisso.

## Snippet

### rename_texts.py

Esempio completo. Il prefisso e limitato a 1-32 caratteri ASCII: inizia con una lettera o cifra, poi ammette lettere, cifre, spazi, `_` e `-`. E una scelta del demo, non un limite di Python.

```python
import argparse
import logging
import re
from pathlib import Path
from stat import S_ISREG

log = logging.getLogger(__name__)


def occupied(path):
    try:
        path.lstat()
    except FileNotFoundError:
        return False
    return True


def checked_directory(directory):
    path = Path(directory).expanduser()
    if path.is_symlink() or path.is_junction():
        raise ValueError("Choose a directory, not a symlink or junction")
    root = path.resolve(strict=True)
    if not root.is_dir():
        raise NotADirectoryError(root)
    if root == Path(root.anchor):
        raise ValueError("Do not operate on a filesystem root")
    return root


def plan_prefix(directory, prefix):
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9 _-]{0,31}", prefix):
        raise ValueError("Invalid prefix")
    root = checked_directory(directory)
    plan = []
    for source in sorted(root.iterdir()):
        if source.suffix.lower() != ".txt":
            continue
        if not S_ISREG(source.lstat().st_mode):
            continue
        if source.name.startswith(prefix):
            continue
        target = source.with_name(prefix + source.name)
        if occupied(target):
            raise FileExistsError(target)
        plan.append((source, target))
    return root, plan


def add_prefix(directory, prefix, *, apply=False):
    root, plan = plan_prefix(directory, prefix)
    log.info("Directory: %s; candidates: %d", root, len(plan))
    for source, target in plan:
        if not apply:
            log.info("PLAN %r -> %r", source.name, target.name)
            continue
        if not S_ISREG(source.lstat().st_mode):
            raise ValueError(f"Source is no longer a regular file: {source.name}")
        if occupied(target):
            raise FileExistsError(target)
        source.rename(target)
        log.info("DONE %r -> %r", source.name, target.name)
    return len(plan)


def main():
    parser = argparse.ArgumentParser(description="Prefix direct .txt files")
    parser.add_argument("directory", type=Path)
    parser.add_argument("--prefix", default="archivio - ")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    try:
        add_prefix(args.directory, args.prefix, apply=args.apply)
    except (OSError, ValueError, RuntimeError) as exc:
        log.error("STOP: %s. Previous DONE operations remain applied.", exc)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

Help, senza accesso ai documenti:

```sh
python rename_texts.py --help
```

Simulazione su una directory esistente di prova:

```sh
python rename_texts.py "./documents" --prefix "archivio - "
```

**Il comando seguente modifica i nomi reali.** Usalo solo dopo aver verificato directory, backup e simulazione:

```sh
python rename_texts.py "./documents" --prefix "archivio - " --apply
```

L'opzione `--apply` abilita le modifiche; non c'e una conferma interattiva. Codice di uscita `0`: esecuzione o simulazione completata, anche se non ci sono candidati. `1`: errore operativo; errori di sintassi CLI sono gestiti da `argparse`.

### Politiche della rinomina

- Solo figli diretti con suffisso `.txt`, anche `.TXT`; niente scansione ricorsiva.
- Solo file regolari secondo `lstat()`: link simbolici e directory non sono candidati.
- File che iniziano gia con il prefisso esatto vengono ignorati: niente doppio prefisso.
- Qualunque destinazione gia occupata interrompe la pianificazione, anche se e un link simbolico rotto.
- Tutte le collisioni visibili sono controllate prima della prima rinomina; un nuovo controllo precede ogni operazione applicata.
- Una sorgente gia prefissata viene ignorata anche se non l'ha elaborata questo script: il nome non e un registro affidabile dell'origine.

Il filtro del prefisso impedisce separatori di percorso, ma non certifica ogni nome risultante su ogni filesystem. Lunghezza massima, permessi e file aperti possono causare errori durante l'applicazione.

### Limiti: collisioni e concorrenza

Su Unix `rename()` puo sostituire un file destinazione esistente; su Windows normalmente fallisce se la destinazione esiste. `replace()` e invece pensato per la sostituzione. [Semantica di rename e replace](https://docs.python.org/3.12/library/os.html#os.rename).

Il controllo `occupied()` **non rende atomici controllo e rinomina**. Un altro processo puo creare la destinazione dopo il controllo: su Unix c'e ancora rischio di sovrascrittura. Il demo e quindi adatto solo a una directory fidata e ferma, non a una coda condivisa o a un servizio multiutente.

Inoltre:

- Una rinomina riuscita non rende atomico l'intero lotto.
- Non c'e rollback automatico: se la terza rinomina fallisce, le prime due restano.
- Gli antenati del percorso possono contenere link o junction; `resolve()` mostra la destinazione effettiva, non prova che corrisponda all'intenzione dell'operatore.
- Il dry-run e una previsione, non una prenotazione dei nomi.
- Per dati importanti o scrittori concorrenti servono un protocollo condiviso di esclusione e primitive appropriate alla piattaforma. Un semplice file di lock ignorato dagli altri processi non risolve il problema.

### automation_demo.py

Prova ripetibile nella stessa directory del modulo. Crea, modifica ed elimina **soltanto la propria directory temporanea**; non accede a `documents`.

```python
import logging
from pathlib import Path
from stat import S_ISREG
from tempfile import TemporaryDirectory

from rename_texts import add_prefix


def empty_logs(directory):
    result = []
    for path in sorted(Path(directory).iterdir()):
        if path.suffix.lower() != ".log":
            continue
        info = path.lstat()
        if S_ISREG(info.st_mode) and info.st_size == 0:
            result.append(path)
    return result


def main():
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    with TemporaryDirectory(prefix="notes-automation-") as temporary:
        root = Path(temporary)
        (root / "report.txt").write_text("Report\n", encoding="utf-8")
        (root / "empty.log").write_bytes(b"")
        (root / "active.log").write_text("Started\n", encoding="utf-8")
        (root / "nested").mkdir()
        (root / "nested" / "keep.txt").write_text("Nested\n", encoding="utf-8")

        assert add_prefix(root, "archivio - ") == 1
        assert (root / "report.txt").exists()
        assert add_prefix(root, "archivio - ", apply=True) == 1
        assert add_prefix(root, "archivio - ", apply=True) == 0
        assert (root / "archivio - report.txt").read_text(
            encoding="utf-8"
        ) == "Report\n"
        assert (root / "nested" / "keep.txt").exists()
        assert [path.name for path in empty_logs(root)] == ["empty.log"]
        print("Dry-run, rename, repeated run and inventory verified")


if __name__ == "__main__":
    main()
```

Esecuzione del laboratorio:

```sh
python automation_demo.py
```

`TemporaryDirectory` ripulisce il laboratorio all'uscita dal contesto. Il rilevatore `empty_logs()` non cancella nulla e la dimensione osservata puo cambiare subito dopo il controllo. Non convertire l'inventario in un ciclo di `unlink()` su log ancora attivi. [Directory temporanee](https://docs.python.org/3.12/library/tempfile.html#tempfile.TemporaryDirectory).

## Adattamenti comuni

### Copia, spostamento e pulizia

- Prima di cancellare file vuoti o vecchi, definisci la politica di conservazione e preferisci una quarantena controllata quando e possibile.
- `unlink()` rimuove un file o link; `rmdir()` richiede una directory vuota; `shutil.rmtree()` elimina ricorsivamente un albero. Non intercambiarli.
- `shutil.move()` puo ricorrere a copia e rimozione tra filesystem: non promettere atomicita.
- `copy2()` tenta di conservare metadati ma non crea una copia completa di permessi, proprietari e attributi su ogni piattaforma. Prova anche il ripristino del backup.

Riferimento: [shutil, copia e spostamento](https://docs.python.org/3.12/library/shutil.html).

### Report e conversione

Leggi testo con encoding esplicito, usa `csv`/`json` e valida lo schema prima di scrivere. Per un report destinato a sostituire un file esistente, scrivi prima un temporaneo nella stessa directory e usa `os.replace()` solo quando l'output e completo: **la sostituzione e intenzionale** e non equivale a durabilita dopo un crash. Per creare senza sovrascrivere usa modalita esclusiva `x`, gestendo anche eventuali output parziali.

La procedura dettagliata e in [[Programmazione/Python/Pagine/Gestione File|Gestione File]]: non riutilizzare la logica di rinomina come scrittura atomica di un report.

### Tool esterni e pianificazione

Passa gli argomenti come lista a `subprocess.run()`, con `check=True`, timeout e `cwd` esplicito quando necessario. Non costruire comandi shell concatenando nomi file ricevuti in input.

Nei processi schedulati usa percorso assoluto dell'interprete del virtualenv, directory di lavoro esplicita e log persistenti. Definisci cosa accade se due esecuzioni si sovrappongono. I dettagli sono in [[Programmazione/Python/Pagine/Subprocess|Subprocess]], [[Programmazione/Python/Pagine/CLI con argparse|CLI con argparse]] e [[Programmazione/Python/Pagine/Logging|Logging]].

## Debug rapido

- Nessun candidato: verifica directory risolta, estensione e nomi gia prefissati.
- `FileExistsError`: controlla anche directory e link rotti nella destinazione; non aggiungere un overwrite automatico.
- `PermissionError`: verifica permessi, file aperti e sincronizzazione; non usare privilegi elevati senza capirne la causa.
- Lotto applicato solo in parte: consulta le righe `DONE`; la ripetizione salta i nomi gia prefissati, ma non annulla il lavoro.
- Funziona dal terminale ma non dallo scheduler: confronta interprete, variabili d'ambiente e directory corrente.
- Output di testo illeggibile: verifica encoding di ingresso, uscita e terminale.

## Checklist finale

- Directory effettiva verificata e non condivisa con altri scrittori?
- Piano completo e collisioni controllate prima di applicare?
- Backup disponibile e ripristino provato?
- Link, ricorsione e file gia elaborati hanno una politica esplicita?
- Errori e operazioni gia completate distinguibili nei log?
- Casi vuoti, collisioni, seconda esecuzione e contenuto invariato provati?
- Nessuna promessa di transazione o assenza di race che lo script non puo mantenere?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Gestione File|Gestione File]]
- [[Programmazione/Python/Pagine/Subprocess|Subprocess]]
- [[Programmazione/Python/Pagine/CLI con argparse|CLI con argparse]]
- [[Programmazione/Python/Pagine/Logging|Logging]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]
- [[Programmazione/Python/Pagine/Scraping con BeautifulSoup|Scraping con BeautifulSoup]]
