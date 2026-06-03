---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [python, programming, virtualenv]
aliases: [Ambienti Virtuali, Virtualenv, venv]
prerequisites: []
related: []
---

# Ambienti Virtuali in Python

## Sintesi

Un ambiente virtuale e un ambiente Python isolato per un singolo progetto. Contiene il proprio interprete di riferimento, i pacchetti installati e gli script CLI delle dipendenze.

Serve a evitare conflitti tra progetti diversi e a rendere installazione, test e sviluppo piu riproducibili.

## Quando usarlo

Usa un ambiente virtuale quasi sempre quando lavori su un progetto Python:

- applicazioni web;
- script con dipendenze esterne;
- librerie installabili;
- notebook con pacchetti specifici;
- test e CI;
- progetti che richiedono versioni precise di librerie.

L'installazione globale ha senso solo per pochi tool generali, e spesso e meglio gestirli con strumenti dedicati come `pipx`.

## Come funziona

Il modulo standard `venv` crea una directory, spesso chiamata `.venv`, che contiene l'ambiente isolato.

```bash
python -m venv .venv
```

Quando lo attivi, il comando `python` e i comandi installati dai pacchetti puntano all'ambiente del progetto.

Windows:

```bash
.venv\Scripts\activate
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Da quel momento:

```bash
python -m pip install requests
```

installa `requests` dentro `.venv`, non nell'interprete globale.

## API / Sintassi

Creare un ambiente:

```bash
python -m venv .venv
```

Attivarlo:

```bash
.venv\Scripts\activate
```

Disattivarlo:

```bash
deactivate
```

Verificare interprete e `pip`:

```bash
python --version
python -m pip --version
```

Salvare dipendenze:

```bash
python -m pip freeze > requirements.txt
```

Installare dipendenze da file:

```bash
python -m pip install -r requirements.txt
```

## Esempio pratico

Workflow iniziale per un nuovo progetto:

```bash
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install httpx pytest
python -m pip freeze > requirements.txt
```

Poi aggiungi `.venv/` al `.gitignore`, perche l'ambiente si ricrea: non va committato.

## Varianti

- **`venv`**: modulo standard, sufficiente per molti progetti.
- **`virtualenv`**: strumento storico, ancora usato in alcuni workflow.
- **`pipx`**: utile per installare tool CLI Python isolati globalmente.
- **`poetry`**: gestisce dipendenze, lockfile, packaging e virtualenv.
- **`uv`**: tool moderno e veloce per ambienti e dipendenze.
- **Conda**: ambiente piu ampio, comune in data science, gestisce anche dipendenze non Python.

## Errori comuni

- Installare pacchetti globalmente senza accorgersene.
- Usare `pip` invece di `python -m pip` in macchine con piu interpreti.
- Committare `.venv` nel repository.
- Usare lo stesso ambiente per progetti diversi.
- Dimenticare di attivare l'ambiente nel terminale corretto.
- Confondere ambiente virtuale e container: un virtualenv non isola sistema operativo o servizi esterni.

## Checklist

- Esiste un ambiente dedicato al progetto?
- `.venv/` e escluso dal repository?
- Sto usando `python -m pip`?
- Le dipendenze sono registrate in un file o lockfile?
- L'editor usa l'interprete della `.venv`?
- I comandi di test vengono eseguiti nell'ambiente corretto?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Pip e PyPI]]
- [[uv pipx e poetry]]
- [[Creazione di Package]]
- [[Testing]]
