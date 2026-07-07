---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: base
tags: [github, repository, git]
aliases: [Repository GitHub, Repo GitHub]
prerequisites: [GitHub, Git e GitHub]
related: [README LICENSE e gitignore, Branch su GitHub]
---

# Repository GitHub

## Sintesi

Un **repository GitHub** e uno spazio che ospita codice, history Git e metadati collaborativi. E il contenitore principale di un progetto su GitHub.

Un repository ben fatto non contiene solo codice: deve spiegare cosa fa il progetto, come eseguirlo, come contribuire, quali controlli usa e quali regole proteggono i branch importanti.

## Quando usarlo

Crea o organizza un repository quando:

- inizi un nuovo progetto;
- vuoi salvare codice in remoto;
- vuoi collaborare con altre persone;
- vuoi abilitare issue, pull request o GitHub Actions;
- vuoi pubblicare documentazione o release.

## Come funziona

Un repository GitHub puo essere:

- pubblico o privato;
- personale o dentro un'organizzazione;
- creato da zero, clonato, forkato o derivato da template;
- collegato a workflow GitHub Actions;
- protetto con regole di branch e permessi.

Gli elementi minimi consigliati sono:

- `README.md`;
- `.gitignore`;
- licenza, se pubblico;
- struttura cartelle comprensibile;
- branch principale chiaro;
- regole di collaborazione se il progetto cresce.

## API / Sintassi

Creare un repository locale e collegarlo a GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/owner/repository.git
git push -u origin main
```

Clonare un repository esistente:

```bash
git clone https://github.com/owner/repository.git
```

Con GitHub CLI:

```bash
gh repo create nome-repository --private
gh repo clone owner/repository
```

## Esempio pratico

Struttura minima per un progetto applicativo:

```text
progetto/
  README.md
  LICENSE
  .gitignore
  src/
  tests/
  docs/
```

Il `README.md` spiega come installare ed eseguire. `.gitignore` evita file temporanei. `tests/` rende chiaro dove sono i controlli automatici.

## Varianti

- **Repository applicativo**: contiene codice eseguibile.
- **Repository libreria**: espone API riutilizzabili.
- **Repository documentazione**: contiene docs, wiki o sito statico.
- **Monorepo**: contiene piu progetti collegati.
- **Template repository**: base per creare nuovi progetti.
- **Fork**: copia di un repository di origine.

## Errori comuni

- Creare repository senza `README`.
- Salvare file generati, cache o dipendenze dentro Git.
- Tenere credenziali nel repository.
- Non definire branch principale e regole di merge.
- Mescolare progetti non correlati nello stesso repository.
- Usare nomi repository vaghi o troppo abbreviati.

## Checklist

- Il nome del repository e chiaro?
- Il `README.md` spiega scopo, installazione e uso?
- `.gitignore` e adatto al linguaggio?
- La licenza e presente se il progetto e pubblico?
- I segreti sono esclusi?
- Il branch principale e protetto se il progetto e condiviso?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub]]
- [[Git e GitHub]]
- [[README LICENSE e gitignore]]
- [[Clone fork e template repository]]

## Fonti

- [GitHub Docs - About repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories)
