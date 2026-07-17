---
date: 2026-06-03
area: Programmazione
topic: Python
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [programmazione, python, packaging, distribuzione]
aliases: [PyInstaller]
prerequisites: []
related: []
---

# PyInstaller

## Sintesi

PyInstaller impacchetta applicazioni Python in eseguibili distribuibili, includendo interprete, dipendenze e file necessari. E utile quando l'utente finale non deve installare Python o gestire ambienti virtuali.

Non crea un binario piccolo o universale: la build e specifica per sistema operativo e puo essere grande.

## Quando usarlo

Usa PyInstaller per:

- tool CLI da distribuire a utenti senza Python;
- utility desktop interne;
- script operativi da consegnare come `.exe`;
- prototipi da distribuire rapidamente;
- ambienti dove installare dipendenze e difficile.

Per librerie Python, usa packaging normale con `pyproject.toml`.

## Come funziona

Uso base:

```bash
pyinstaller app.py
```

Eseguibile singolo:

```bash
pyinstaller --onefile app.py
```

PyInstaller analizza import e dipendenze, copia cio che serve e genera una directory `dist/` con l'eseguibile.

## API / Sintassi

Comandi comuni:

```bash
pyinstaller --onefile app.py
pyinstaller --name mytool app.py
pyinstaller --clean app.py
```

Aggiungere file dati:

```bash
pyinstaller --add-data "templates;templates" app.py
```

Su Windows il separatore tra sorgente e destinazione e `;`; su macOS/Linux spesso e `:`.

File `.spec`:

```bash
pyinstaller app.spec
```

Il file `.spec` permette configurazioni piu stabili per build ripetute.

## Esempio pratico

Procedura consigliata:

1. crea un ambiente virtuale pulito;
2. installa solo dipendenze necessarie;
3. verifica che lo script funzioni da terminale;
4. esegui PyInstaller;
5. testa l'eseguibile su una macchina simile a quella target;
6. aggiungi asset, hidden imports o file dati se mancano;
7. documenta OS, architettura e comando di build.

Esempio:

```bash
python -m venv .venv
.venv\Scripts\activate
python -m pip install pyinstaller
pyinstaller --onefile --name mytool app.py
```

## Varianti

- **`--onefile`**: un singolo eseguibile, avvio spesso piu lento.
- **`onedir`**: directory con eseguibile e dipendenze, piu trasparente.
- **File `.spec`**: configurazione avanzata.
- **Hidden imports**: per import dinamici non rilevati.
- **Asset e data files**: template, immagini, config.
- **Build per OS**: va creata sul sistema operativo target.

## Errori comuni

- Pensare che un exe Windows funzioni anche su Linux o macOS.
- Non testare su una macchina pulita.
- Dimenticare file dati e asset.
- Avere import dinamici non rilevati.
- Distribuire build prodotte da un ambiente sporco.
- Confondere PyInstaller con packaging di librerie.
- Non considerare antivirus o policy aziendali sugli eseguibili.

## Checklist

- Lo script funziona prima del packaging?
- L'ambiente di build e pulito?
- La build e fatta sul sistema operativo target?
- File dati e asset sono inclusi?
- L'eseguibile e testato su macchina pulita?
- Il comando di build e documentato?
- Serve davvero un eseguibile invece di un package o script?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Creazione di Package]]
- [[CLI con argparse]]
- [[Gestione File]]
- [[Ambienti Virtuali]]
