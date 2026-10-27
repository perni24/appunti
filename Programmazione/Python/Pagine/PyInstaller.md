---
date: 2026-06-03
area: Programmazione
topic: Python
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - python
  - packaging
  - distribuzione
aliases:
  - PyInstaller
prerequisites: []
related: []
title: PyInstaller
---

# PyInstaller

## Obiettivo

Distribuire una piccola applicazione Python con interprete e dipendenze inclusi, senza chiedere all'utente finale di installare Python. PyInstaller costruisce un bundle: non converte automaticamente la logica Python in codice macchina ottimizzato e non protegge i segreti inseriti nel programma.

Baseline della procedura: **CPython 3.12.10 e PyInstaller 6.22.3, Windows x64, PowerShell**. Servono un virtualenv di build, spazio per build/dist e permesso di eseguire il risultato. Non servono compilatori C per questo demo puro Python con il bootloader distribuito.

## Quando usarlo

- CLI o utility desktop da consegnare a utenti senza ambiente Python.
- Applicazioni con un insieme controllato di dipendenze e risorse.
- Distribuzione per uno specifico sistema e architettura.

Per una libreria usa un wheel, non un exe. Un bundle Windows non gira su Linux o macOS: costruisci e verifica sui target appropriati. Anche librerie di sistema e policy aziendali possono limitarne la portabilita.

## Procedura

### 1. Preparare un progetto minimo

Usa una directory separata con questa struttura:

```text
bundle-demo/
  app.py
  assets/
    message.txt
```

message.txt contiene `Ciao dal bundle` in UTF-8. Il programma risolve la risorsa rispetto a **file**, non alla directory di lavoro del terminale.

### app.py

```python
import argparse
from pathlib import Path


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("--name", default="Luca")
    args = parser.parse_args(argv)
    resource = Path(__file__).resolve().parent / "assets" / "message.txt"
    try:
        message = resource.read_text(encoding="utf-8").strip()
    except (OSError, UnicodeError) as error:
        parser.exit(1, f"Risorsa non disponibile: {error}\n")
    print(f"{message}, {args.name}!")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

### assets/message.txt

```text
Ciao dal bundle
```

### 2. Creare l'ambiente di build

Esegui ogni comando separatamente dalla radice del progetto. L'interprete del virtualenv viene richiamato direttamente: non e necessario cambiare la policy di esecuzione di PowerShell.

```powershell
python -m venv .venv
```

```powershell
.\.venv\Scripts\python.exe -m pip install "PyInstaller==6.22.3"
```

```powershell
.\.venv\Scripts\python.exe app.py --name Test
```

Output: `Ciao dal bundle, Test!`. Per progetti reali installa dipendenze e versioni di build da una configurazione registrata. Un solo pin di PyInstaller non blocca tutte le dipendenze transitive.

### 3. Iniziare da onedir

```powershell
.\.venv\Scripts\python.exe -m PyInstaller --clean --onedir --name mytool --add-data "assets:assets" app.py
```

Nella versione indicata `SOURCE:DEST` e la sintassi documentata anche su Windows. La vecchia regola "Windows richiede sempre il punto e virgola" non va applicata senza considerare la versione.

La build genera mytool.spec, build e dist. Con onedir devi distribuire **tutta** `dist/mytool`, non solo l'exe: nelle versioni 6 il contenuto di supporto e normalmente sotto \_internal.

```powershell
.\dist\mytool\mytool.exe --name Test
```

`--clean` pulisce cache e artefatti temporanei di build, non il sorgente. Prima di ricostruire conserva output che ti servono e usa nomi/directory distinti. `--noconfirm` rimuove la conferma per sostituire output esistenti: non aggiungerlo distrattamente.

### 4. Passare a onefile

```powershell
.\.venv\Scripts\python.exe -m PyInstaller --clean --onefile --name mytool-onefile --add-data "assets:assets" app.py
```

```powershell
.\dist\mytool-onefile.exe --name Test
```

Onefile estrae componenti in una directory temporanea all'avvio, quindi puo avviarsi piu lentamente e richiedere spazio/permessi aggiuntivi. La directory viene normalmente ripulita in uscita; un arresto anomalo puo lasciare residui.

Non scrivere dati persistenti nelle risorse estratte: usa una directory utente appropriata, con permessi e gestione degli errori. Non mettere password, token o configurazioni private dentro il bundle.

### 5. Verificare fuori dai sorgenti

Sposta o copia l'output in una directory di prova distinta, lasciando intatta la struttura onedir, e avvialo con una directory corrente diversa. Controlla almeno:

- messaggio e argomenti;
- --help ed exit code;
- presenza delle risorse e diagnostica in caso di assenza;
- funzionamento senza il progetto sorgente;
- ambiente target senza Python e senza le tue dipendenze installate.

Il controllo locale di questa nota non sostituisce una macchina/VM pulita, antivirus, firma o distribuzione reale. Non disattivare le protezioni se un eseguibile viene segnalato: indaga la causa e il processo di rilascio.

## Snippet

### Ricostruire da spec

Dopo aver generato e verificato mytool.spec:

```powershell
.\.venv\Scripts\python.exe -m PyInstaller --clean mytool.spec
```

Lo spec e **codice Python eseguibile**, non un file dati innocuo. Versiona uno spec controllato, senza percorsi locali o segreti; non eseguire spec scaricati senza esaminarli.

Quando parti dallo spec, gran parte delle opzioni e gia codificata al suo interno. Per esempio modifica datas o hiddenimports nello spec, invece di presumere che qualunque flag CLI lo sovrascriva.

## Adattamenti comuni

### Risorse, eseguibile e directory corrente

- `Path(__file__).resolve().parent`: risorse relative al modulo, con struttura riprodotta da add-data.
- `Path(sys.executable).resolve().parent` in una app frozen: directory dell'eseguibile esterno, utile per file deliberatamente affiancati all'exe.
- Directory corrente: scelta da chi avvia il processo, non garantita uguale alle due precedenti.
- `sys._MEIPASS`: dettaglio fornito dal bootloader; per questa risorsa **file** basta, senza rami speciali.

Un bundle puo non includere import dinamici, plugin, DLL o metadata che l'analisi statica non vede. Usa hook e hidden imports mirati dopo aver identificato cosa manca; non includere ogni pacchetto dell'ambiente come soluzione generale.

Per GUI, `--windowed` cambia console e stream standard: prima diagnostica in modalita console, poi fornisci log appropriati. Non applicarlo a questa CLI.

Per multiprocessing in una applicazione frozen, consulta le indicazioni PyInstaller e chiama `multiprocessing.freeze_support()` nel punto di ingresso prima di avviare worker o logica incompatibile con l'avvio dei figli. Questa variante non e verificata dal demo.

## Debug rapido

| Sintomo                                             | Controllo                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------- |
| Funziona dai sorgenti ma manca un modulo nel bundle | Import dinamici, hook, hidden imports e file warn nella cartella build. |
| File dati assente                                   | SOURCE:DEST e corrispondenza con il percorso calcolato da **file**.     |
| Funziona solo dalla cartella del progetto           | Dipendenze accidentali dalla directory corrente o dai sorgenti.         |
| La finestra si chiude subito                        | Avvia da terminale in modalita console e leggi stderr/exit code.        |
| Il solo exe onedir non parte                        | Distribuisci anche tutte le dipendenze della directory.                 |
| Onefile non estrae o viene segnalato                | Spazio, permessi temporanei, firma e policy; non bypassare i controlli. |

Una build riuscita significa che il bundle e stato prodotto, non che ogni percorso applicativo sia stato provato.

## Checklist finale

- Lo script funziona prima del packaging?
- Sistema, architettura e versioni di build sono registrati?
- Il bundle contiene soltanto risorse pubblicabili?
- Funziona fuori dai sorgenti e con una directory corrente differente?
- Argomenti errati, file mancanti e codici di uscita sono gestiti?
- E stato provato sul target pulito, non solo sul PC di sviluppo?
- Licenze, firma e canale di aggiornamento sono previsti?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Creazione di Package|Creazione di Package]]
- [[Programmazione/Python/Pagine/CLI con argparse|CLI con argparse]]
- [[Programmazione/Python/Pagine/Gestione File|Gestione File]]
- [[Programmazione/Python/Pagine/Ambienti Virtuali|Ambienti Virtuali]]
- [[Programmazione/Python/Pagine/Multiprocessing|Multiprocessing]]

## Fonti

- [PyInstaller: uso e opzioni](https://pyinstaller.org/en/stable/usage.html).
- [Funzionamento di onedir e onefile](https://pyinstaller.org/en/stable/operating-mode.html).
- [Percorsi e informazioni a runtime](https://pyinstaller.org/en/stable/runtime-information.html).
- [File spec e codice di build](https://pyinstaller.org/en/stable/spec-files.html).
- [Problemi comuni e multiprocessing](https://pyinstaller.org/en/stable/common-issues-and-pitfalls.html).
