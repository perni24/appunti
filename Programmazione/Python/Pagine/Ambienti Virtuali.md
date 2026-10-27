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
  - programming
  - virtualenv
aliases:
  - Ambienti Virtuali
  - Virtualenv
  - venv
prerequisites: []
related: []
title: Ambienti Virtuali in Python
---

# Ambienti Virtuali in Python

## Sintesi

Un virtualenv separa soprattutto i **pacchetti Python** di un progetto da quelli degli altri. Contiene un interprete copiato o collegato all'installazione di base, directory di pacchetti e comandi installati.

Non e un container: non isola file, rete, credenziali o servizi. E ricreabile, non un archivio portabile da copiare tra macchine.

Riferimento Python 3.12, con prove su CPython 3.12.10 / Windows. Le varianti di attivazione sono distinte per shell; non e necessario attivare l'ambiente per usarlo.

## Quando usarlo

- Applicazioni, script con dipendenze, librerie e test.
- Progetti che richiedono versioni differenti degli stessi pacchetti.
- Ambienti CI ricostruiti da dipendenze dichiarate.
- Notebook: anche il kernel deve usare l'interprete corretto.

Una CLI condivisa tra progetti puo essere installata con pipx. Una CLI di sviluppo, come pytest o un linter, puo invece appartenere correttamente al virtualenv e alle dipendenze del progetto.

## Come funziona

`venv` crea `pyvenv.cfg` e le directory necessarie. Di default non espone i pacchetti globali; `--system-site-packages` cambia questo comportamento e va usato solo consapevolmente.

`sys.prefix != sys.base_prefix` indica che il processo gira in un virtualenv. La variabile `VIRTUAL_ENV`, da sola, non e una prova sufficiente: e associata all'attivazione della shell, che puo non essere avvenuta.

L'ambiente continua a dipendere dall'installazione Python di base. Gli script possono contenere percorsi assoluti; dopo un cambio di directory, macchina o versione Python e normalmente preferibile ricrearlo.

## API / Sintassi

### Creazione

Esegui dalla directory del progetto, usando un interprete gia verificato. Non scegliere una cartella che contiene file da conservare.

```text
python --version
```

```text
python -m venv .venv
```

Il comando crea file locali e normalmente include pip tramite `ensurepip`. In Python 3.12 **setuptools non e piu una dipendenza di base di venv**; i backend di build sono un tema separato. Alcune distribuzioni Linux richiedono il relativo componente venv installato tramite il gestore di sistema.

### Uso senza attivazione

Windows PowerShell, dalla directory del progetto:

```powershell
.\.venv\Scripts\python.exe -m pip --version
```

Linux/macOS, shell POSIX:

```bash
./.venv/bin/python -m pip --version
```

Usare il percorso completo e utile in task schedulati e CI: non dipende dal PATH modificato da una shell precedente.

### Attivazione facoltativa

Scegli **una sola** variante per la shell corrente.

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Windows cmd.exe:

```bat
.venv\Scripts\activate.bat
```

Bash su Linux/macOS:

```bash
source .venv/bin/activate
```

L'attivazione antepone la directory dei comandi al PATH della shell. Non installa pacchetti, non cambia Python in altre finestre e non riconfigura automaticamente l'IDE.

Se PowerShell blocca lo script, puoi usare direttamente `python.exe` come sopra: non serve indebolire la execution policy della macchina per eseguire un virtualenv.

## Esempio pratico

Dopo l'attivazione, verifica l'interprete:

```text
python -c "import sys; print(sys.executable); print(sys.prefix != sys.base_prefix)"
```

Deve comparire il percorso della `.venv` e `True`. Controlla anche pip:

```text
python -m pip --version
```

Se il progetto contiene un `requirements.txt` affidabile, installalo. Questa operazione puo scaricare ed eseguire codice di build: esamina prima dipendenze e provenienza.

```text
python -m pip install -r requirements.txt
```

Verifica la coerenza dei metadati delle dipendenze:

```text
python -m pip check
```

Non e un test dell'applicazione ne un audit di sicurezza. Esegui poi i test previsti dal progetto. Per uscire dall'ambiente **attivato**:

```text
deactivate
```

Il comando ripristina la shell; non cancella l'ambiente o i pacchetti. Se hai usato solo il percorso dell'interprete, non devi disattivare nulla.

### File da versionare

Nel `.gitignore` del progetto aggiungi:

```gitignore
.venv/
__pycache__/
```

Versiona i sorgenti, le dichiarazioni delle dipendenze e il lockfile adottato. Non versionare la directory dell'ambiente. `pip freeze` puo aiutare a registrare lo stato, ma non e un lockfile universale: formato e limiti sono in Pip e PyPI.

## Varianti

- `venv`: modulo standard per creare ambienti a partire da un interprete disponibile.
- `virtualenv`: strumento esterno con funzionalita e supporto propri.
- uv e Poetry: possono gestire ambiente e dipendenze del progetto.
- pipx: ambienti separati per applicazioni CLI.
- Conda: gestisce anche altri componenti dell'ambiente; non coincide con venv.

Non usare lo stesso ambiente gestito da piu strumenti senza sapere chi ne definisce lo stato desiderato.

## Errori comuni

- `ModuleNotFoundError` nell'IDE ma non nel terminale: confronta `sys.executable` nei due contesti.
- Pacchetto installato con successo ma non importabile: controlla il nome importabile e l'interprete, non reinstallare alla cieca.
- Terminale attivo ma notebook errato: il kernel e un processo distinto.
- Ambiente copiato o base Python rimossa: ricrea da dipendenze dichiarate, dopo aver verificato di non avere sorgenti salvati nella `.venv`.
- Installazione bloccata da un ambiente di sistema gestito: usa un virtualenv; non aggirare automaticamente la protezione con privilegi amministrativi.
- Considerare isolamento dei pacchetti equivalente a isolamento di codice non fidato.

## Checklist

- Interprete e versione di base sono dichiarati?
- Il percorso eseguito appartiene all'ambiente del progetto?
- IDE, kernel e CI usano lo stesso ambiente previsto?
- Le dipendenze si possono reinstallare da zero?
- La directory dell'ambiente e esclusa da Git?
- Sono documentati separatamente requisiti di sistema e servizi esterni?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Pip e PyPI|Pip e PyPI]]
- [[Programmazione/Python/Pagine/uv pipx e poetry|uv pipx e poetry]]
- [[Programmazione/Python/Pagine/Creazione di Package|Creazione di Package]]
- [[Programmazione/Python/Pagine/Testing|Testing]]

## Fonti

- [Python 3.12: venv, attivazione e portabilita](https://docs.python.org/3.12/library/venv.html).
- [Python 3.12: sys.prefix e sys.base_prefix](https://docs.python.org/3.12/library/sys.html#sys.prefix).
- [PyPA: installazione con pip e ambienti virtuali](https://packaging.python.org/en/latest/guides/installing-using-pip-and-virtual-environments/).
- [PyPA: ambienti gestiti esternamente](https://packaging.python.org/en/latest/specifications/externally-managed-environments/).
