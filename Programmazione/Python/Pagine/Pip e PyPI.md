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
  - packaging
aliases:
  - Pip
  - PyPI
  - Package manager Python
prerequisites: []
related: []
title: Pip e PyPI
---

# Pip e PyPI

## Sintesi

**PyPI** e un indice pubblico di distribuzioni Python; **pip** e uno strumento che risolve e installa distribuzioni. Pip puo usare anche indici privati, directory locali, wheel e sorgenti: non significa sempre "scaricare da PyPI".

`python -m pip` usa il pip dell'interprete indicato da `python`. Non garantisce da solo che sia il virtualenv giusto: verifica il percorso dell'interprete.

Riferimento degli esempi: CPython 3.12.10, pip 26.2.2 per la toolchain di verifica. Il pip incluso da `ensurepip` puo avere una versione diversa.

## Quando usarlo

- Installare dipendenze in un ambiente dedicato.
- Installare e provare un package locale o una wheel.
- Esaminare versioni e metadati delle distribuzioni.
- Riprodurre un'installazione descritta da file di requirements.

## Come funziona

Pip legge i requisiti, individua candidati compatibili con Python e piattaforma, risolve le dipendenze e installa gli artefatti. Una wheel e gia costruita; da sorgenti puo servire una build, anche con compilatori e librerie di sistema.

**Distribuzione e import non coincidono necessariamente**: `beautifulsoup4` espone `bs4`. Nel demo collegato, la distribuzione `appunti-calc-demo` espone `appunti_calc` e il comando `appunti-calc`.

Una installazione da sorgenti puo eseguire il backend di build. Il virtualenv evita molti conflitti di dipendenze, ma non limita i permessi del codice.

## API / Sintassi

I comandi seguenti presuppongono un virtualenv attivato oppure la sostituzione di `python` con il suo percorso esplicito.

```text
python -m pip --version
```

```text
python -m pip list
```

Per un pacchetto gia installato:

```text
python -m pip show appunti-calc-demo
```

Un requisito come `package-name>=1.4,<2` esprime un intervallo; `package-name==1.4.2` un pin. Sono esempi di **sintassi**, non nomi o versioni da installare. Metti tra virgolette i vincoli nei comandi, perche la shell puo interpretare `<` e `>`.

### Requirements e constraints

`requirements.txt` contiene requisiti da installare; puo includere anche opzioni e riferimenti a sorgenti. Leggilo prima di eseguirlo.

```text
python -m pip install -r requirements.txt
```

Un constraints file restringe le versioni ammissibili ma **non richiede da solo l'installazione** dei pacchetti elencati.

```text
python -m pip install -r requirements.txt -c constraints.txt
```

Un conflitto tra requisito e constraint va risolto: pip non deve essere forzato a ignorare le dipendenze per far scomparire l'errore.

### Aggiornamento e rimozione

Un normale `pip install` non e un aggiornamento completo di tutte le dipendenze. `--upgrade` richiede l'aggiornamento dei pacchetti indicati secondo i vincoli e la politica di risoluzione.

Aggiornare pip cambia il tool nell'ambiente selezionato; non e un passaggio obbligatorio prima di ogni installazione:

```text
python -m pip install --upgrade pip
```

Rimozione interattiva del solo demo, se precedentemente installato:

```text
python -m pip uninstall appunti-calc-demo
```

Pip non effettua automaticamente una pulizia generale di tutte le dipendenze rimaste inutilizzate.

## Esempio pratico

Prerequisito: aver costruito la wheel della nota Creazione di Package. Il nome e un demo locale, **non un invito a cercarlo su PyPI**. Dalla radice di quel progetto, in un virtualenv di prova:

```text
python -m pip install --no-index dist/appunti_calc_demo-0.1.0-py3-none-any.whl
```

`--no-index` esclude gli indici; il demo non ha dipendenze runtime esterne. Con altri package devi fornire anche tutte le dipendenze, per esempio tramite una wheelhouse controllata.

Verifica import e metadati senza effettuare richieste HTTP:

```text
python -c "from appunti_calc import add; from importlib.metadata import version; print(add(2, 3)); print(version('appunti-calc-demo'))"
```

Output: `5` e `0.1.0`.

```text
python -m pip check
```

`pip check` verifica requisiti dichiarati mancanti o incompatibili; non esegue test, non rileva tutte le incompatibilita runtime e non cerca vulnerabilita.

### Snapshot e riproducibilita

`pip freeze` descrive cio che e installato nel suo formato di requirements. Non risolve un ambiente nuovo, non distingue automaticamente dipendenze dirette e transitive e non registra tutti i requisiti di sistema. Per una wheel locale puo includere un riferimento `file://` specifico della macchina.

Visualizza lo snapshot prima di salvarlo:

```text
python -m pip freeze
```

Solo se vuoi **creare o sovrascrivere** `requirements.snapshot.txt`, in PowerShell:

```powershell
python -m pip freeze | Set-Content -LiteralPath requirements.snapshot.txt -Encoding utf8
```

Alternativa Bash:

```bash
python -m pip freeze > requirements.snapshot.txt
```

Non sostituire automaticamente il file delle dipendenze dichiarate con lo snapshot di un ambiente usato per piu attivita. Versioni esatte, hash degli artefatti, versione Python e piattaforma sono aspetti distinti della riproducibilita.

## Varianti

- **Editable**: `python -m pip install -e .` installa il progetto per lo sviluppo; non dimostra che la wheel contenga tutto.
- **Wheelhouse**: artefatti locali selezionati per piattaforma/interprete, installabili senza indice.
- **Lockfile**: risultato di un workflow di risoluzione controllato. `pip freeze` non equivale a `uv.lock` o `poetry.lock`.
- **Indici privati**: configura una provenienza controllata. Aggiungere PyPI come fonte concorrente per nomi interni puo causare dependency confusion; `--extra-index-url` non significa "usa questa fonte solo come fallback sicuro".
- **Hash**: aiutano a verificare gli artefatti previsti, ma non rendono affidabile un pacchetto malevolo approvato per errore.

## Errori comuni

- Installare con un pip diverso da quello dell'interprete che esegue il programma.
- Usare `sudo pip` o aggirare la protezione degli ambienti di sistema come soluzione predefinita.
- Interpretare "Successfully installed" come prova del funzionamento dell'applicazione.
- Copiare pin obsoleti da un esempio senza verificarne compatibilita e manutenzione.
- Usare `--no-deps` per nascondere un conflitto.
- Inserire token degli indici in file versionati o output di diagnostica condivisi.
- Confondere una lista di dipendenze con una garanzia di sicurezza o riproducibilita universale.

## Checklist

- Interprete e ambiente sono quelli attesi?
- La distribuzione proviene da una fonte verificata?
- Le dipendenze dirette sono dichiarate e i transitori risolti in modo controllato?
- Sono noti eventuali build tool e requisiti nativi?
- L'ambiente si ricrea da zero e supera i test?
- Snapshot e lockfile non contengono segreti o percorsi privati?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Ambienti Virtuali|Ambienti Virtuali]]
- [[Programmazione/Python/Pagine/Creazione di Package|Creazione di Package]]
- [[Programmazione/Python/Pagine/uv pipx e poetry|uv pipx e poetry]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]

## Fonti

- [pip install: risoluzione, build e indici](https://pip.pypa.io/en/stable/cli/pip_install/).
- [pip freeze](https://pip.pypa.io/en/stable/cli/pip_freeze/) e [pip check](https://pip.pypa.io/en/stable/cli/pip_check/).
- [pip: constraints](https://pip.pypa.io/en/stable/user_guide/#constraints-files).
- [pip: installazioni ripetibili](https://pip.pypa.io/en/stable/topics/repeatable-installs/) e [installazioni con hash](https://pip.pypa.io/en/stable/topics/secure-installs/).
- [PyPA: distribuzione rispetto a import package](https://packaging.python.org/en/latest/discussions/distribution-package-vs-import-package/).
