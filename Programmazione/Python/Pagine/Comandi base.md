---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - python
  - programming
aliases:
  - Comandi Base e Toolchain Python
prerequisites: []
related: []
title: Comandi Base e Toolchain Python
---

# Comandi Base e Toolchain Python

## Sintesi

Per lavorare con Python devi sapere **quale interprete esegue il codice**, dove sono installati i pacchetti e da quale directory parte il processo. Un ambiente virtuale separa le dipendenze del progetto; non e una macchina virtuale o una sandbox.

Baseline delle prove: **CPython 3.12.10 su Windows**. E la versione disponibile per verificare gli esempi, non una raccomandazione di installare quella specifica patch o una dichiarazione di ultima release.

## Quando usarlo

Quando avvii un progetto, esegui uno script, installi dipendenze o cerchi la causa di un import che funziona in un terminale ma non nell'editor.

## Come funziona

- `python file.py` esegue un percorso di file.
- `python -m package.module` cerca un modulo nel percorso di import e lo esegue come programma. Il nome non termina in `.py`.
- `python -c "..."` esegue un breve frammento.
- `python` senza argomenti apre il REPL se l'input e un terminale.

Le prime due modalita non sono sempre intercambiabili: influenzano il contesto del package e la ricerca degli import. La directory di lavoro rimane quella del processo, non diventa automaticamente la directory dello script.

## API / Sintassi

I comandi vanno nel **terminale**, non nel prompt Python `>>>`. Qui `python` indica l'interprete scelto: su Linux/macOS potresti dover usare `python3`; su Windows, se presente, il launcher permette anche `py -3`. Controlla il percorso reale invece di dedurlo dal nome.

Versione:

```text
python --version
```

Eseguibile effettivo:

```text
python -c "import sys; print(sys.executable)"
```

Pacchetto pip caricato da quell'interprete:

```text
python -m pip --version
```

Usare `-m pip` lega pip all'interprete invocato, ma non prova che quell'interprete sia quello desiderato. Se pip manca, va predisposto per quella installazione; non risolvere installando indiscriminatamente a livello globale.

## Esempio pratico

### Progetto e ambiente

Parti da una directory adatta e usa un nome di progetto non gia occupato:

```text
mkdir my_project
```

```text
cd my_project
```

Crea l'ambiente con l'interprete scelto:

```text
python -m venv .venv
```

Il comando crea file nella cartella .venv e normalmente include pip tramite ensurepip. Alcune distribuzioni richiedono un componente venv separato. Non usare --clear su una directory con contenuti da conservare.

### Attivazione per shell

Scegli **una sola variante**, in base alla shell corrente.

PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Prompt dei comandi Windows (cmd.exe):

```bat
.venv\Scripts\activate.bat
```

Bash/Zsh su Linux o macOS:

```bash
source .venv/bin/activate
```

L'attivazione modifica PATH nella shell. Non e obbligatoria: in PowerShell puoi eseguire direttamente l'interprete del progetto, anche se una policy impedisce Activate.ps1:

```powershell
.\.venv\Scripts\python.exe --version
```

Su Linux/macOS, senza attivazione:

```bash
./.venv/bin/python --version
```

Non e necessario cambiare la policy di esecuzione dell'intero computer per usare il virtualenv.

### Uno script completo

File `main.py`, nella radice del progetto e non dentro .venv:

```python
import sys


def main(argv):
    if len(argv) != 1 or not argv[0].strip():
        print("Uso: python main.py NOME", file=sys.stderr)
        return 2

    name = argv[0].strip()
    print(f"Ciao {name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
```

Con l'ambiente attivo:

```text
python main.py Ada
```

Risultato: Ciao Ada e codice di uscita 0. Senza un nome, stampa l'uso su stderr ed esce con 2. La guardia `if __name__ == "__main__":` evita di eseguire la CLI quando il file viene importato.

Dalla stessa directory puoi eseguire il modulo:

```text
python -m main Ada
```

Un controllo di compilazione:

```text
python -m py_compile main.py
```

Scrive bytecode in `__pycache__` e rileva errori di sintassi; non esegue i rami del programma e non sostituisce test, linter o type checker.

### Dipendenze e uscita

Il demo precedente usa soltanto la standard library. Se un altro progetto richiede requests, questa installazione **modifica l'ambiente e scarica pacchetti**:

```text
python -m pip install requests
```

Elenca cio che e installato:

```text
python -m pip list
```

Controlla i requisiti dichiarati dai pacchetti installati:

```text
python -m pip check
```

Per registrare le versioni, scegli una variante. **Sovrascrive requirements.txt**: non eseguirla su un file curato manualmente senza verificarne il contenuto.

PowerShell, con encoding esplicito:

```powershell
python -m pip freeze | Set-Content -Encoding utf8 requirements.txt
```

Bash:

```bash
python -m pip freeze > requirements.txt
```

Freeze fotografa l'ambiente installato, incluse dipendenze transitive: non e un lockfile universale e non garantisce portabilita tra sistemi. Per installare un requirements.txt gia controllato:

```text
python -m pip install -r requirements.txt
```

Se avevi attivato l'ambiente, disattivalo:

```text
deactivate
```

## Varianti

- Nel REPL puoi usare exit() per uscire; non aggiungere i caratteri >>> agli script.
- uv, Poetry e pip-tools gestiscono aspetti diversi del workflow: vedi le note dedicate.
- requirements.txt descrive installazioni; pyproject.toml puo descrivere progetto, build e configurazioni. Non sono sinonimi.
- Un upgrade di pip e un'operazione di manutenzione, non un prerequisito da ripetere a ogni esecuzione.

## Errori comuni

- Usare il pip globale mentre l'editor usa .venv.
- Creare file random.py o json.py che nascondono moduli standard.
- Committare .venv o spostarlo come fosse un ambiente portabile.
- Pensare che un virtualenv impedisca accesso a rete e filesystem.
- Confondere successo di py_compile o pip check con correttezza dell'applicazione.

## Checklist

- Versione, sys.executable e interprete dell'editor coerenti.
- Dipendenze installate nell'ambiente previsto.
- `.venv` e `__pycache__` esclusi da Git.
- File sorgenti fuori dall'ambiente virtuale.
- Comandi della shell corretta; effetti su file e rete noti.

## Collegamenti

- [[Programmazione/Python/Pagine/Ambienti Virtuali|Ambienti Virtuali]]
- [[Programmazione/Python/Pagine/Pip e PyPI|Pip e PyPI]]
- [[Programmazione/Python/Pagine/uv pipx e poetry|uv, pipx e poetry]]
- [[Programmazione/Python/Pagine/Creazione di Package|Creazione di Package]]
- [[Programmazione/Python/Pagine/CLI con argparse|CLI con argparse]]

## Fonti

- [CPython 3.12: riga di comando, -m e argomenti](https://docs.python.org/3.12/using/cmdline.html).
- [Python 3.12: venv e attivazione per piattaforma](https://docs.python.org/3.12/library/venv.html).
- [pip: significato e limiti di freeze](https://pip.pypa.io/en/stable/cli/pip_freeze/).
- [pip: controllo dei requisiti installati](https://pip.pypa.io/en/stable/cli/pip_check/).
- [Python 3.12: py_compile](https://docs.python.org/3.12/library/py_compile.html).

## Navigazione

- [[Programmazione/Python/Indice Python|Indice Python]]
